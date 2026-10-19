# Payment Lifecycle

This document describes the server-authoritative UddoktaPay flow, the MongoDB topology the flow requires, and the database indexes that must exist in a deployed environment.

## Flow

1. `POST /api/payment/initiate` validates cart items, prices, coupon eligibility, and payment type on the server. It creates a `PaymentAttempt` with a 10-minute checkout deadline and stores the customer receipt email.
2. UddoktaPay redirects the browser to `POST /api/payment/success` and may also call `POST /api/payment/ipn`.
3. Both callbacks fetch `POST /api/verify-payment` from UddoktaPay. The callback body is never trusted for payment status or amount.
4. The server checks:
   - `status === "COMPLETED"`
   - metadata `attemptId` exists
   - verified `invoice_id` matches the invoice being processed
   - verified `amount` matches the attempt's `amountToPay`
5. The attempt is atomically claimed into `processing`. Only one callback can claim it.
6. Order creation, stock deduction, and coupon consumption run in one MongoDB transaction:
   - the order is created with `paymentAttemptId`; a unique partial index prevents a second order for the same attempt
   - each product stock decrement and the `stockDeductedAt` marker commit together
   - the coupon `usedCount` increment and the `couponConsumedAt` marker commit together
   - a crash before commit rolls back every mutation; a retry repeats the whole unit once
7. After the transaction commits, the attempt is marked `completed`. If the process dies after commit but before that marker, a later callback sees the committed order, verifies the side effects, and finalizes the attempt.
8. Receipt delivery is separate from payment completion. It uses its own retry state and never blocks or reverses completion.
9. A captured payment whose order creation fails is kept as `paid_pending_order`, not `failed` or `expired`. An admin can retry with `POST /api/payment/reconcile/:attemptId`.
10. The browser is redirected to the order success page only after the order exists. The client removes only the purchased cart lines after it reads a confirmed `paid` or `partial` order from the server.

## Required MongoDB topology

Fulfillment uses multi-document transactions. The deployment must use one of:

- a replica set (including a single-node replica set for development), or
- a sharded cluster (`mongos`).

A standalone `mongod` does not support transactions. If transactions are unavailable, fulfillment fails safely:

- no order, stock, or coupon mutation is attempted
- the verified attempt is stored as `paid_pending_order`
- the error is recorded in `fulfillmentError`
- the payment is not lost; restore transaction-capable topology and then use `POST /api/payment/reconcile/:attemptId`

The bundled `docker-compose.yml` starts a single-node replica set named `rs0`, initiates it through a healthcheck, and connects with `?replicaSet=rs0`.

If an existing deployment already has a standalone `mongo_data` volume, back it up before changing the topology. The same data directory must be started with `--replSet` and converted with `rs.initiate()`; if that cannot be done safely, restore the backup into a fresh single-node replica set. Verify `hello` reports `setName` and `isWritablePrimary: true` before enabling payments.

For a manual local setup:

```bash
mongod --dbpath ./data --replSet rs0 --bind_ip 127.0.0.1 --port 27017
# In another shell, on the first run only:
mongosh --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
```

Connection string:

```text
mongodb://127.0.0.1:27017/fleetmart?replicaSet=rs0
```

## Attempt states

- `pending`: checkout created, payment not verified.
- `processing`: a callback owns fulfillment. A stale claim can be recovered after five minutes.
- `paid_pending_order`: payment was verified and captured, but fulfillment did not finish.
- `completed`: one order exists for this attempt. Side effects and receipts may still be retried by later callbacks.
- `failed`: verification failed, for example an amount mismatch.
- `cancelled`: the checkout was cancelled before fulfillment.
- `expired`: retained for delayed-payment handling. A later verified payment can still be fulfilled.

`expiresAt` is the checkout deadline only. It is not a deletion deadline and is not a TTL index.

## Side-effect state

Stock:

- `stockDeductedAt` is the completion marker for the whole stock operation.
- `stockIssues` lists items that could not be deducted because stock was insufficient at fulfillment time.
- `stockReconciliationRequired` means a legacy in-flight marker was found and the result is ambiguous.

Coupon:

- `couponConsumedAt` is the completion marker.
- `couponConsumptionStatus` is `consumed`, `limit_reached`, or `failed`.
- `couponReconciliationRequired` means a legacy in-flight marker was found and the result is ambiguous.

The previous implementation used `stockProcessingAt` and `couponConsumptionStartedAt` as in-flight claims. Those markers are no longer written. If an old order still has one of them without its completion marker, the server does not guess: it flags the operation for manual review and performs no automatic mutation. This prevents both permanent skipping and double deduction.

## Receipt delivery

Receipt delivery is at-least-once, not exactly-once. Email providers used here do not expose an idempotency key that would make duplicate suppression provable.

- `receiptSentAt` marks a successful send.
- `receiptStatus` is `pending`, `sending`, `sent`, or `failed`.
- `receiptAttempts`, `receiptLastAttemptAt`, `receiptNextAttemptAt`, and `receiptLastError` record retry state.
- `receiptSendingAt` is a five-minute lease.
- A failed or interrupted send is retried by a later success/IPN callback or admin reconciliation after the backoff expires.
- A crash after the provider accepted a message but before `receiptSentAt` was stored can cause one duplicate email on retry. This is intentional and must not be described as exactly-once delivery.

Payment completion never depends on the receipt result. An attempt can be `completed` while `receiptStatus` is `failed`.

## Required indexes

Check the live collections before changing anything. Do not run these commands against production without a backup and explicit approval.

```js
// Confirm the current indexes.
db.paymentattempts.getIndexes()
db.orders.getIndexes()
```

Remove the old TTL index if it exists. It deletes attempts, including attempts that need delayed-payment reconciliation. The old non-unique `invoiceId_1` index must also be replaced, because the new index uses the same key with different options.

```js
db.paymentattempts.dropIndex("expiresAt_1")
db.paymentattempts.dropIndex("invoiceId_1")
```

Create the durable constraints after confirming there are no duplicate non-null values:

```js
db.paymentattempts.createIndex(
  { invoiceId: 1 },
  { unique: true, partialFilterExpression: { invoiceId: { $type: "string" } } }
)
db.orders.createIndex(
  { paymentAttemptId: 1 },
  { unique: true, partialFilterExpression: { paymentAttemptId: { $type: "string" } } }
)
```

Mongoose may create these indexes when `autoIndex` is enabled, but production deployments should verify them explicitly. Mongoose does not drop the previous TTL index.

## Environment

`UDDOKTAPAY_BASE_URL` may be either the installation root or a URL ending in `/api`. The server adds `/api` once when it is missing.

Examples:

- `https://sandbox.uddoktapay.com` becomes `https://sandbox.uddoktapay.com/api`
- `https://sandbox.uddoktapay.com/api` stays unchanged

The gateway header is `RT-UDDOKTAPAY-API-KEY`. The IPN endpoint validates the same key before processing.

## Retry and reconciliation

- Repeated success/IPN callbacks return the existing order and do not create or deduct again.
- Concurrent callbacks serialize through the attempt claim and the unique order index.
- A delayed payment that is verified after expiry is still fulfilled and marked `latePayment`.
- If the fulfillment transaction fails, the attempt remains `paid_pending_order` with the invoice ID, payment time, and gateway verification payload. No partial stock or coupon change survives.
- If the process dies after commit but before marking the attempt completed, the next callback finds the committed order, re-checks the side-effect markers, and completes the attempt.
- An admin can retry with `POST /api/payment/reconcile/:attemptId`. Completed attempts are also processed so unfinished receipt delivery can be retried.
- If the stock transaction itself cannot run, the order is not silently marked complete. The attempt stays recoverable.
- If stock is insufficient for an item, the available items are deducted and the unavailable items are recorded in `stockIssues`; the whole operation is still atomic. A coupon limit reached at fulfillment time does not discard the captured payment.

## Tests

Mocked tests cover the route flow, duplicate and concurrent notifications, delayed payment, order-creation failure, amount mismatch, coupon limits, transaction-unavailable failure, receipt retry after completion, and legacy ambiguous markers.

The integration suite (`server/tests/paymentFulfillment.integration.test.js`) starts an isolated local `mongod` with `--replSet`, initiates a single-node replica set, and uses a temporary database. It verifies real transaction rollback, unique partial indexes, concurrent deduplication, partial multi-item stock updates, crashes at each claim/mutation/completion boundary, legacy marker handling, and receipt retries. It requires `mongod` on `PATH`; otherwise it is skipped.

No test contacts UddoktaPay, uses production data, runs seed scripts, initiates real payments, or sends real email. The email sender is injected in tests.

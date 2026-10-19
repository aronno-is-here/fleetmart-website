# Payment Lifecycle

This document describes the server-authoritative UddoktaPay flow and the database indexes that must exist in a deployed environment.

## Flow

1. `POST /api/payment/initiate` validates cart items, prices, coupon eligibility, and payment type on the server. It creates a `PaymentAttempt` with a 10-minute checkout deadline. The gateway invoice ID is not known yet.
2. UddoktaPay redirects the browser to `POST /api/payment/success` and may also call `POST /api/payment/ipn`.
3. Both callbacks fetch `POST /api/verify-payment` from UddoktaPay. The callback body is never trusted for payment status or amount.
4. The server checks:
   - `status === "COMPLETED"`
   - metadata `attemptId` exists
   - verified `invoice_id` matches the invoice being processed
   - verified `amount` matches the attempt's `amountToPay`
5. The attempt is atomically claimed into `processing`. Only one callback can claim it.
6. The order is created with `paymentAttemptId`. A unique sparse index prevents a second order for the same attempt.
7. Stock deduction, coupon consumption, and receipt delivery each have durable claim markers on the order so retries do not repeat them.
8. A captured payment whose order creation fails is kept as `paid_pending_order`, not `failed` or `expired`. An admin can retry with `POST /api/payment/reconcile/:attemptId`.
9. The browser is redirected to the order success page only after the order exists. The client removes only the purchased cart lines after it reads a confirmed `paid` or `partial` order from the server.

## Attempt states

- `pending`: checkout created, payment not verified.
- `processing`: a callback owns fulfillment.
- `paid_pending_order`: payment was verified and captured, but order finalization failed.
- `completed`: one order exists for this attempt.
- `failed`: verification failed, for example an amount mismatch.
- `cancelled`: the checkout was cancelled before fulfillment.
- `expired`: retained for delayed-payment handling. A later verified payment can still be fulfilled.

`expiresAt` is the checkout deadline only. It is not a deletion deadline and is not a TTL index.

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
- If order creation fails, the attempt remains `paid_pending_order` with the invoice ID, payment time, and gateway verification payload.
- An admin can retry with `POST /api/payment/reconcile/:attemptId`.
- If stock deduction or coupon consumption cannot complete, the order is still paid and records a `STOCK ISSUE` or `COUPON ISSUE` note for manual review.
- A coupon limit reached at fulfillment time does not discard the captured payment. The order is created and the coupon is not incremented past its limit.

## Tests

All payment tests use mocked gateway responses and in-memory model mocks. They do not contact UddoktaPay, connect to MongoDB, or perform real payments or refunds.

Covered cases include duplicate and concurrent notifications, missed browser callbacks, delayed payment, order-creation failure and retry, amount mismatch, coupon consumption and limits, attempt retention, and client cart clearing.

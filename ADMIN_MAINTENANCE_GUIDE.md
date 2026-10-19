# FleetMart — Admin & Maintenance Guide

This guide describes the current Admin Panel, payment lifecycle, taxonomy rules, environment configuration, and production safety requirements.

## 1. Overview

FleetMart is a MERN storefront plus an admin panel. The storefront supports guests and registered customers; payments are processed through UddoktaPay. The admin panel manages catalog, taxonomy, orders, users, coupons, reviews, banners, analytics, and settings.

| Component | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Payments | UddoktaPay (bKash, Nagad, cards) |
| Images | Cloudinary |
| Deployment | Vercel (serverless API + static SPA) or Docker |

## 2. Admin Panel

### Access

- URL: `/admin/login`
- Only users with `role: 'admin'` can log in.
- Admin pages redirect non-admin sessions to `/admin/login`; API endpoints also enforce `protect` + `adminOnly`.

### Pages

| Page | URL | Purpose |
|---|---|---|
| Dashboard | `/admin` | Revenue, orders, products, users, reviews, recent orders, low stock |
| Products | `/admin/products` | Product CRUD, images, category/brand/team selection |
| Categories | `/admin/categories` | Nested categories, reorder, auto-blurb, activation |
| Brands | `/admin/brands` | Brand CRUD |
| Teams | `/admin/teams` | Team CRUD |
| Hero Banners | `/admin/banners` | Homepage banners |
| Orders | `/admin/orders` | Order list, status changes, order preview |
| Users | `/admin/users` | Roles, block/unblock |
| Coupons | `/admin/coupons` | Coupon CRUD |
| Reviews | `/admin/reviews` | Hide/show, delete |
| Analytics | `/admin/analytics` | Sales reporting |
| Settings | `/admin/settings` | Admin profile and password |

### Security Notes

- Tokens are stored in `localStorage` as `fm_token` / `fm_user`.
- Never share admin credentials or expose `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MONGODB_URI`, `UDDOKTAPAY_API_KEY`, or Cloudinary secrets.
- Log out on shared devices.

## 3. Products

### Fields

| Field | Notes |
|---|---|
| Name, slug | Slug is the public URL identifier |
| Category | Must reference an existing active category; the server derives `categoryPath` |
| Brand / Team | Reference brand and team records when set |
| Price / Discount price | BDT |
| Stock | Per-size map, e.g. `{"S": 10, "M": 5, "L": 8}` |
| Description, images | Images upload to Cloudinary |
| Featured / New / Customizable | Storefront flags |
| Active | Inactive products are hidden |

### Notes

- Category and taxonomy references are validated on the server. Do not rely on client-supplied `categoryPath`.
- Renaming or reparenting a category repairs descendant paths and affected product references.
- A category that still has descendants or products cannot be deleted; deactivate it instead.

## 4. Categories, Brands, and Teams

### Category Tree

- Categories support unlimited nesting through `parent`.
- Each category has a stable `id` (slug-like) that storefront URLs and product references use. Renaming a category does **not** change its `id`.
- New category IDs are generated from the name. Names with no Latin characters fall back to `category`, `category-1`, and so on.
- Paths and levels are derived by the server, not trusted from the client.
- Moving a category updates descendant paths and product paths. Cycles and descendant-as-parent are rejected.
- Categories can be reordered; reordering refreshes `autoBlurb` for affected parents.
- `autoBlurb` builds the blurb from active child names in display order. Turning it on regenerates the blurb unless a custom blurb is supplied.
- Deactivating a category keeps its history and products but hides it from active navigation.

### Brands and Teams

- Brands and teams have stable slugs used by products and filters.
- Renaming does not change the slug.
- A brand or team referenced by products cannot be deleted.

## 5. Inventory

- Stock is stored per size as a map on each product.
- Paid orders deduct stock inside a MongoDB transaction together with order creation.
- If stock is insufficient at fulfillment time, the available items are deducted and the unavailable items are recorded in `stockIssues`; the payment is not lost.
- Fulfillment requires a replica set or sharded cluster. A standalone MongoDB results in `paid_pending_order`, which can be reconciled later.
- Stock changes are not reversible from the admin panel; adjust counts manually if needed.
- Low-stock dashboard rules: total stock below 20, or any size below 5.

## 6. Orders

### Order States

Order status: `pending`, `processing`, `confirmed`, `shipped`, `out_for_delivery`, `delivered`, `cancelled`, `returned`.

Payment status: `pending`, `partial`, `paid`, `failed`, `refunded`, `refund_requested`, `refund_failed`, `expired`.

### What Admins Can Change

- Order status can be set to any valid order status.
- Payment status can be set manually to `pending` or `failed` only.
- Gateway-owned statuses (`paid`, `partial`, `refunded`, `refund_requested`, `refund_failed`, `expired`) are read-only badges in the admin table.
- Delivering an order does **not** mark it paid. Only verified gateway callbacks do that.
- Cancelling a paid or partial order triggers the verified refund flow. If it fails, the order records `refund_failed` and support must follow up.
- Setting a manual payment status in the same request as cancelling suppresses the automatic refund.

### Order Preview

Shows customer, contact, items, totals, shipping fee, paid/remaining amounts, gateway method, status history, notes, and refund details.

### Payment Behavior

- Online payments only; there is no cash-on-delivery flow.
- Full payment: the order total (subtotal minus discount) is paid online.
- Partial payment: the lower of ৳300 or the order total is paid online; the rest is due on delivery.
- Delivery charge is **not** included in the online amount. Standard delivery is free at subtotal ≥ ৳3,000, otherwise ৳80, paid to the courier.
- The order total stored on the order excludes the delivery charge; `shippingFee` is stored separately.
- Payment callbacks are verified against UddoktaPay and are idempotent. Duplicate callbacks do not create duplicate orders or deduct stock twice.

### Refunds

- Customers can request a refund for their own paid/partial order through `POST /api/payment/refund`.
- Admins trigger refunds by cancelling a paid/partial order.
- Refunds require a transaction ID and a supported gateway method.
- Refund states and recovery details are documented in [PAYMENT_LIFECYCLE.md](./PAYMENT_LIFECYCLE.md).

## 7. Users

- View users, change roles, and block/unblock accounts.
- Blocking prevents login but does not delete history.
- No user deletion, bulk actions, or admin password reset.

## 8. Coupons

- Supported types: percent or flat BDT.
- Optional minimum order, maximum uses, and expiry.
- Usage is counted at fulfillment inside the payment transaction; a coupon that reaches its limit during fulfillment does not lose the captured payment.
- Test coupons before announcing promotions.

## 9. Reviews

- Admin can hide/show and delete reviews.
- Product `rating` and `numReviews` are recalculated from visible reviews on create, delete, and visibility changes.
- Reviews are paginated on the storefront; the admin list is capped.

## 10. Content

Editable from the admin panel: products, categories, brands, teams, banners, coupons, reviews, order states, users.

Still developer-managed: homepage layout, hero copy, logo, navigation structure, static pages, email templates, shipping rules, and payment configuration.

## 11. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection; replica set required for payments |
| `JWT_SECRET` | Yes | Access tokens |
| `JWT_REFRESH_SECRET` | Yes | Refresh tokens |
| `SITE_URL` | Yes | Payment callback base URL |
| `UDDOKTAPAY_API_KEY` | Yes for payments | Gateway API key |
| `UDDOKTAPAY_BASE_URL` | Yes for payments | Gateway base URL (`/api` added automatically) |
| `CLOUDINARY_NAME` / `CLOUDINARY_KEY` / `CLOUDINARY_SECRET` | For uploads | Image hosting |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Optional | Receipt and reset email |
| `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` | Optional | Social sign-in |
| `PORT`, `NODE_ENV`, `CORS_ORIGINS` | Environment | Runtime configuration |
| `ENABLE_DEMO_PRODUCT` | Optional | `true` creates the demo payment-test product at startup |
| `SEED_RESET` | Optional | `true` plus `NODE_ENV=development|test` allows the destructive seeder |

Frontend equivalents use the `VITE_` prefix (`VITE_GOOGLE_CLIENT_ID`, `VITE_APPLE_CLIENT_ID`). Never put secrets in `VITE_` variables.

See `server/.env.example` for a complete template.

## 12. Seeding and Demo Data

The seeder deletes all users, products, categories, and coupons before inserting demo records.

```bash
cd server
NODE_ENV=development npm run seed:reset
```

It refuses to run when:

- `NODE_ENV` is missing, `production`, or anything other than `development`/`test`
- neither `--reset` nor `SEED_RESET=true` is provided

`ENABLE_DEMO_PRODUCT=true` creates a ৳20 "Payment Test Jersey" if it does not exist. It is off by default and is not required in production.

## 13. Deployment

### Vercel

1. Push to the deployment branch.
2. Vercel runs `npm install` and `npm run build`.
3. The build compiles the client and copies it to `public/`.
4. `api/index.js` serves the Express app; `vercel.json` rewrites `/api/*` and falls back to the SPA.
5. Set all required environment variables in the Vercel project.

The production database must be a replica set (MongoDB Atlas is). Back up data before changing database topology.

### Docker

`docker-compose.yml` starts a single-node replica set named `rs0` and connects with `?replicaSet=rs0`.

### Verification Checklist

- [ ] Homepage, shop, product pages load
- [ ] Admin login and dashboard work
- [ ] Product create/edit/delete and image upload work
- [ ] Category create/reorder works and navigation updates
- [ ] `/api/health` returns `{ "status": "ok" }`
- [ ] A test payment completes and creates exactly one order
- [ ] Order status and read-only gateway payment statuses behave correctly
- [ ] Receipt email is delivered or the failure is recorded for retry

## 14. Backup and Recovery

- **MongoDB:** use Atlas snapshots or `mongodump --db=fleetmart --out=./backup`
- **Cloudinary:** no automatic backup; keep original image files
- **Code:** Git history
- **Vercel:** deployment history supports rollback

Do not restore production data into a development environment with real customer information.

## 15. Troubleshooting

| Symptom | Checks |
|---|---|
| Paid order missing | Does the payment attempt show `paid_pending_order`? Verify MongoDB replica set; then retry `POST /api/payment/reconcile/:attemptId` |
| Payment callback fails | Verify UddoktaPay key/base URL, `SITE_URL`, invoice ID, and amount |
| Stock not deducted | Inspect `stockIssues`, `stockDeductedAt`, and transaction support |
| Coupon limit not applied | Check `couponConsumedAt` and `couponConsumptionStatus` |
| Category missing from shop | Check `isActive`, parent hierarchy, and `/api/categories/counts` |
| Category delete rejected | Remove/reassign descendants and products first, or deactivate |
| Image upload fails | Verify Cloudinary credentials, file type, and 5 MB limit |
| Email not delivered | Check SMTP settings, `receiptStatus`, and `receiptLastError` |

## 16. Known Limitations

- No cash-on-delivery flow.
- No order deletion, bulk order changes, invoice generation, or shipping-carrier integration.
- No product deletion recovery; deleting a product does not delete Cloudinary images.
- Express delivery and outside-Dhaka ৳130 pricing are not implemented server-side. Standard delivery is free ≥ ৳3,000, otherwise ৳80.
- No automated database backups in the repository.
- Homepage copy/layout and static content remain code-managed.
- Real gateway, email, and transaction behavior cannot be validated by the automated test suite.

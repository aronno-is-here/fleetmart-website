# ⚽ FLEETMART — Gear Up. Game On.

A premium MERN football jersey and sports-equipment storefront with a full admin panel.

## Features

- Dark "pitch" storefront with jersey customization, quick view, compare, wishlist, and search
- Nested categories (unlimited depth), brands, teams, and hero banners managed from the admin panel
- Guest checkout with email-verified guest order lookup, plus authenticated order history
- Server-authoritative pricing, coupons, and stock
- UddoktaPay online payments (bKash / Nagad / cards), full or partial payment
- Verified refunds, transactional fulfillment, and retryable receipts
- Admin dashboard, product/category/brand/team/banner CRUD, orders, users, coupons, reviews, analytics

## Stack

- **Client:** React 19 (Vite), Tailwind CSS, Redux Toolkit, React Router, Framer Motion
- **Server:** Node.js, Express, MongoDB (Mongoose), JWT auth
- **Payments:** UddoktaPay
- **Images:** Cloudinary

## Structure

```
client/   React storefront + /admin dashboard
server/   Express REST API
api/      Vercel serverless entry point
```

## Local Development

Requirements: Node.js 20+, MongoDB 7+ running as a replica set (payment fulfillment uses transactions), and `mongod` on `PATH` for integration tests.

```bash
# install
npm install
cd client && npm install

# copy and fill server/.env (see server/.env.example)
cp server/.env.example server/.env

# run client + server
npm run dev
```

MongoDB must be a replica set or sharded cluster:

```bash
mongod --dbpath ./data --replSet rs0 --bind_ip 127.0.0.1 --port 27017
mongosh --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
```

Then set:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/fleetmart?replicaSet=rs0
```

A standalone `mongod` cannot complete paid orders; the payment is held as `paid_pending_order` until a transaction-capable topology is available. See [PAYMENT_LIFECYCLE.md](./PAYMENT_LIFECYCLE.md).

## Environment Variables

Required for the API:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (replica set required for payments) |
| `JWT_SECRET` | Access-token signing secret |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret |
| `SITE_URL` | Public site URL used for payment callbacks |
| `UDDOKTAPAY_API_KEY` | UddoktaPay API key |
| `UDDOKTAPAY_BASE_URL` | UddoktaPay installation URL (`/api` added when missing) |
| `CLOUDINARY_NAME` / `CLOUDINARY_KEY` / `CLOUDINARY_SECRET` | Product image uploads |
| `SMTP_*` | Receipt and password-reset email (optional; console stub when blank) |

Optional safety flags:

| Variable | Default | Purpose |
|---|---|---|
| `ENABLE_DEMO_PRODUCT` | off | Set to `true` to create the ৳20 "Payment Test Jersey" on startup |
| `SEED_RESET` | off | Must be `true` (or pass `--reset`) to allow the destructive seeder |

See `server/.env.example` for the full list.

## Seed Data

The seeder **deletes all users, products, categories, and coupons** before inserting demo data. It requires `NODE_ENV=development` or `NODE_ENV=test` and an explicit reset confirmation:

```bash
cd server
NODE_ENV=development npm run seed:reset
```

Never run it against production.

## Tests

```bash
npm test          # server + client
cd server && npm test
cd client && npm test
```

The server integration suite starts an isolated local `mongod` and is skipped when `mongod` is not on `PATH`. No test contacts UddoktaPay, uses production data, sends real email, or runs the seeder.

## Deployment

The app deploys to Vercel using `vercel.json`, `api/index.js`, and `scripts/postbuild.js`. The production MongoDB must be a replica set (MongoDB Atlas provides this) so payment transactions can commit.

```bash
npm run build     # builds client and copies to public/
```

Set all required environment variables in the hosting provider. Do not enable `ENABLE_DEMO_PRODUCT` or run the seeder in production unless intentional.

## Documentation

- [ADMIN_MAINTENANCE_GUIDE.md](./ADMIN_MAINTENANCE_GUIDE.md) — admin panel and operations
- [PAYMENT_LIFECYCLE.md](./PAYMENT_LIFECYCLE.md) — payment, fulfillment, refunds, indexes
- [CODEMAP.md](./CODEMAP.md) — file and route reference

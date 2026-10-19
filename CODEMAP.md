# Fleetmart — Codebase Map

Reference for the current routes, pages, hooks, services, and server modules.

---

## Storefront Pages (`client/src/pages/`)

| File | Route | Description |
|---|---|---|
| `Home.jsx` | `/` | Hero carousel, categories, featured products, flash deal, brands |
| `Shop.jsx` | `/shop` | Filters (category tree, brand, team, size, price, customizable), sorting |
| `ProductDetails.jsx` | `/product/:slug` | Gallery, sizes, customization, cart, reviews, related products |
| `Cart.jsx` | `/cart` | Bag, coupon entry, totals |
| `Checkout.jsx` | `/checkout` | Address, shipping, payment, review. Supports guests; online total excludes delivery |
| `OrderSuccess.jsx` | `/order/success` | Confirmation; public order lookup; auth-aware tracking link |
| `OrderLookup.jsx` | `/order/lookup` | Guest lookup by Order ID + email; accepts `?orderId=` |
| `Login.jsx` | `/login` | Email/password + Google/Apple; exports shared auth UI |
| `Register.jsx` | `/register` | Registration |
| `ForgotPassword.jsx` | `/forgot-password` | 3-step reset |
| `Account.jsx` | `/account`, `/account/:tab` | Profile, orders, addresses, billing, wishlist (protected) |
| `Wishlist.jsx` | `/account/wishlist` | Saved products |
| `About.jsx` | `/about` | Brand story |
| `Contact.jsx` | `/contact` | Contact form and store details |
| `Support.jsx` | `/support` | Help center |
| `Faq.jsx` | `/faq` | FAQ accordion |
| `Policy.jsx` | `/policies/:slug` | Shipping, returns, terms, privacy |
| `NotFound.jsx` | `*` | 404 |

### Admin Pages (`client/src/pages/admin/`)

| File | Route | Description |
|---|---|---|
| `AdminLayout.jsx` | `/admin` | Sidebar, top bar, `<Outlet />` |
| `AdminLogin.jsx` | `/admin/login` | Admin-only login |
| `Dashboard.jsx` | `/admin` | Stats, recent orders, low stock |
| `AdminProducts.jsx` | `/admin/products` | Product CRUD, images, category hierarchy, search/filter |
| `AdminCategories.jsx` | `/admin/categories` | Nested category CRUD, reorder, auto-blurb, safe parent/delete |
| `AdminBrands.jsx` | `/admin/brands` | Brand CRUD with stable slugs |
| `AdminTeams.jsx` | `/admin/teams` | Team CRUD with stable slugs |
| `AdminBanners.jsx` | `/admin/banners` | Hero banner CRUD |
| `AdminOrders.jsx` | `/admin/orders` | Orders, status updates, read-only gateway payment states, preview |
| `AdminUsers.jsx` | `/admin/users` | Roles, block/unblock |
| `AdminCoupons.jsx` | `/admin/coupons` | Coupon CRUD |
| `AdminReviews.jsx` | `/admin/reviews` | Visibility and delete |
| `AdminAnalytics.jsx` | `/admin/analytics` | Sales analytics |
| `AdminSettings.jsx` | `/admin/settings` | Profile/password settings |

---

## Components

### Top-Level (`client/src/components/`)

| File | Purpose |
|---|---|
| `StoreLayout.jsx` | Public shell: Navbar, Footer, CartDrawer, SearchOverlay, QuickView, Toaster, MatchBackground |
| `CartDrawer.jsx` | Slide-in bag with free-shipping progress |
| `SearchOverlay.jsx` | Live search with category/brand/team names |
| `QuickView.jsx` | Product quick view |
| `MatchBackground.jsx` | Animated background canvas |
| `ProductArt.jsx` | SVG art per product type |
| `ProductCard.jsx` | Product card and skeleton |
| `PriceRange.jsx` | Price filter control |
| `ProtectedRoute.jsx` | Auth guard |
| `ErrorBoundary.jsx` | Render error boundary |
| `SEO.jsx` | Document metadata |

### Layout / UI

| File | Purpose |
|---|---|
| `components/layout/Navbar.jsx` | Sticky navigation, nested Shop menu, auth-aware links |
| `components/layout/Footer.jsx` | Trust strip, links, socials, payment badges |
| `components/layout/Ticker.jsx` | Promo marquee |
| `components/ui/Rating.jsx` | Star rating |
| `components/ui/SectionHeading.jsx` | Section header |
| `components/ui/Toaster.jsx` | Redux toast renderer |

---

## Client State and Hooks

| File | Purpose |
|---|---|
| `features/cartSlice.js` | Cart, `removePurchasedItems`, totals |
| `features/wishlistSlice.js` | Wishlist |
| `features/uiSlice.js` | Drawers, quick view, recently viewed, toasts |
| `features/authSlice.js` | Token/user persistence |
| `hooks/useCategories.js` | `useCategories`, `useFlatCategories`, `useCategoryCounts` |
| `hooks/useBrands.js` | Brand list/CRUD helpers |
| `hooks/useTeams.js` | Team list/CRUD helpers |

## Client Libraries (`client/src/lib/`)

| File | Purpose |
|---|---|
| `api.js` | Axios instance, JWT interceptor, 401 redirect |
| `checkout.js` | Online total, partial payment, shipping fee (free ≥ ৳3000 else ৳80) |
| `cart.js` | Cart helpers |
| `order.js` | Purchased-line clearing rules |
| `categoryTree.js` | Category tree flatten/search/parent options |
| `format.js` | Currency, discounts, stock totals |

Tests live beside `checkout`, `cart`, `order`, and `categoryTree`.

---

## Server

### Entry and Startup

| File | Purpose |
|---|---|
| `server/server.js` | Express app, middleware, route mounts, DB connect, optional startup tasks |
| `server/config/db.js` | Mongoose connection |
| `server/seed.js` | Destructive demo seeder (guarded) |
| `server/startup/ensureTaxonomy.js` | Taxonomy defaults |
| `server/startup/ensureDemoProduct.js` | Optional demo product (`ENABLE_DEMO_PRODUCT=true`) |
| `server/startup/migrateProductReferences.js` | Legacy reference normalization |
| `server/utils/seedGuard.js` | Pure seeder permission check |

### Models

`User`, `Product`, `Order`, `PaymentAttempt`, `Category`, `Brand`, `Team`, `Banner`, `Coupon`, `Review`.

- `Category` supports nested `parent`, stored `path`/`level`, stable `id`, `autoBlurb`.
- `Order` tracks payment/refund fields, status history, side-effect markers, and receipt retry state.

### Routes

| File | Mount | Purpose |
|---|---|---|
| `routes/auth.js` | `/api/auth` | Register/login/social/reset/profile/addresses/billing |
| `routes/products.js` | `/api/products` | Catalog CRUD; server-derived `categoryPath` |
| `routes/categories.js` | `/api/categories` | Nested CRUD, counts, reorder, safe delete |
| `routes/brands.js` | `/api/brands` | Brand CRUD |
| `routes/teams.js` | `/api/teams` | Team CRUD |
| `routes/banners.js` | `/api/banners` | Hero banners |
| `routes/orders.js` | `/api/orders` | Public/guest lookup, order history, admin status updates |
| `routes/payment.js` | `/api/payment` | Initiate, success, cancel, IPN, status, reconcile, refund |
| `routes/coupons.js` | `/api/coupons` | Validate and CRUD |
| `routes/reviews.js` | `/api/reviews` | Product reviews, visibility |
| `routes/admin.js` | `/api/admin` | Dashboard and user management |
| `routes/analytics.js` | `/api/admin` | Analytics |
| `routes/upload.js` | `/api/upload` | Cloudinary image upload |

### Services

| File | Purpose |
|---|---|
| `pricing.js` | Server-authoritative pricing, coupons, shipping constants |
| `orderPricing.js` | Order pricing entry point |
| `orderStatus.js` | Order/payment status validation and refund intent |
| `paymentFulfillment.js` | Transactional order creation, stock, coupon, receipts |
| `mongoTransactions.js` | Transaction support detection |
| `uddoktapay.js` | Gateway request/configuration |
| `refund.js` | Verified refunds |
| `email.js` | Receipt and notification email |
| `taxonomy.js` | Category index, paths, descendants, counts, slugs |
| `taxonomyBackfill.js` | Legacy taxonomy repair |

---

## Route Quick Reference

| Route | Access |
|---|---|
| `/`, `/shop`, `/product/:slug`, `/cart`, `/checkout`, `/order/success`, `/order/lookup`, `/login`, `/register`, `/forgot-password`, `/about`, `/contact`, `/support`, `/faq`, `/policies/:slug` | Public / guest |
| `/account`, `/account/:tab` | Authenticated |
| `/account/wishlist` | Authenticated |
| `/admin`, `/admin/products`, `/admin/categories`, `/admin/brands`, `/admin/teams`, `/admin/banners`, `/admin/orders`, `/admin/users`, `/admin/coupons`, `/admin/reviews`, `/admin/analytics`, `/admin/settings` | Admin |
| `/admin/login` | Public |

---

## Config

| File | Purpose |
|---|---|
| `client/vite.config.js` | React plugin, `/api` dev proxy, chunking |
| `client/tailwind.config.js` | Colors, fonts, animations |
| `vercel.json` | API rewrite and SPA fallback |
| `api/index.js` | Vercel serverless entry |
| `scripts/postbuild.js` | Copies `client/dist` to `public/` |
| `Dockerfile`, `docker-compose.yml` | Container deployment with a single-node replica set |

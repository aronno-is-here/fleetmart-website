# Fleetmart — Codebase Map

Complete reference of every source file and which web page(s) it belongs to.

---

## Pages (`client/src/pages/`)

| File | Route | Description |
|------|-------|-------------|
| `Home.jsx` | `/` | Homepage — hero carousel, category tiles, featured products, flash deal, brand strip, stats, testimonials, recently viewed |
| `Shop.jsx` | `/shop` | Product catalog with filters (category, brand, team, size, price, customizable) and sorting |
| `ProductDetails.jsx` | `/product/:slug` | Single product detail — gallery, sizes, jersey customizer, add-to-cart, reviews, related products |
| `Cart.jsx` | `/cart` | Shopping bag page with coupon code, order summary, proceed to checkout |
| `Checkout.jsx` | `/checkout` | Multi-step checkout — address, shipping, payment, review, place order (protected) |
| `OrderSuccess.jsx` | `/order/success` | Post-order confirmation page |
| `Login.jsx` | `/login` | User login with Google/Apple social auth + email/password. Exports `AuthShell`, `AuthInput`, `PasswordInput`, `useAuthSubmit` (reused by Register) |
| `Register.jsx` | `/register` | User registration. Imports shared auth components from `Login.jsx` |
| `ForgotPassword.jsx` | `/forgot-password` | 3-step password reset — email/SMS selection, code verification, new password |
| `Account.jsx` | `/account`, `/account/:tab` | User account dashboard with tabs — profile, orders, addresses, billing, wishlist (protected) |
| `Wishlist.jsx` | `/account/wishlist` | Dedicated wishlist page with move-to-bag and remove actions |
| `About.jsx` | `/about` | About page — brand story, stats, authenticity guarantee |
| `Contact.jsx` | `/contact` | Contact form + hotline/WhatsApp/email/store address sidebar |
| `Faq.jsx` | `/faq` | FAQ accordion with 7 questions |
| `Policy.jsx` | `/policies/:slug` | Legal pages — shipping, returns, terms, privacy (content by slug param) |
| `NotFound.jsx` | `*` | 404 page with jersey art |

### Admin Pages (`client/src/pages/admin/`)

| File | Route | Description |
|------|-------|-------------|
| `AdminLayout.jsx` | `/admin` | Admin sidebar + top bar + `<Outlet />` for child routes |
| `AdminLogin.jsx` | `/admin/login` | Admin-only email/password login form |
| `Dashboard.jsx` | `/admin` | Dashboard stats — revenue, orders, products, users, reviews, coupons, recent orders, low stock |
| `AdminProducts.jsx` | `/admin/products` | Product CRUD table with image upload, category filter, pagination, modal edit form |
| `AdminOrders.jsx` | `/admin/orders` | Order list table with status filter, inline status update, pagination |
| `AdminUsers.jsx` | `/admin/users` | User list table with role toggle, block/unblock, pagination |
| `AdminCoupons.jsx` | `/admin/coupons` | Coupon CRUD table with modal form (percent/flat, min order, max uses, expiry) |
| `AdminReviews.jsx` | `/admin/reviews` | Review list table with visibility toggle and delete |

---

## Components (`client/src/components/`)

### Top-Level Components

| File | Purpose | Used On |
|------|---------|---------|
| `CartDrawer.jsx` | Slide-in shopping bag sidebar with free-shipping progress bar | All store pages (via `StoreLayout.jsx`) |
| `SearchOverlay.jsx` | Full-screen search overlay with live API results and popular suggestions | All store pages (via `StoreLayout.jsx`) |
| `QuickView.jsx` | Modal product quick-view with size selector and add-to-cart | All store pages (via `StoreLayout.jsx`) |
| `MatchBackground.jsx` | Animated canvas of a pseudo-3D football match rendered behind all content | All store pages (via `StoreLayout.jsx`) |
| `ProductArt.jsx` | SVG art generators for every product type — JerseyArt, BootArt, BallArt, GloveArt, ConeArt, LadderArt, BibArt, GuardArt, BagArt, SockArt, ScarfArt, CapArt, TurfArt, StudioArt, ProductArt | Home, ProductDetails, Wishlist, About, NotFound, ProductCard, QuickView |
| `ProductCard.jsx` | Product card with hover art flip, quick-add, wishlist toggle, quick-view button. Also exports `ProductCardSkeleton` | Home, Shop, ProductDetails |
| `ProtectedRoute.jsx` | Auth guard — redirects to `/login` if no token/user in localStorage | App.jsx — wraps `/checkout`, `/account` |
| `ErrorBoundary.jsx` | React error boundary catching render errors, shows 500 page | main.jsx — wraps entire app |

### Layout Components (`client/src/components/layout/`)

| File | Purpose | Used On |
|------|---------|---------|
| `Navbar.jsx` | Sticky top navigation — logo, mega menu, search/wishlist/account/cart icons, mobile drawer | All store pages (via `StoreLayout.jsx`) |
| `Footer.jsx` | Footer — trust strip, newsletter signup, shop/support/company links, social icons, payment badges | All store pages (via `StoreLayout.jsx`) |
| `Ticker.jsx` | Scrolling promotional marquee (volt-green bar with announcements) | All store pages (via `Navbar.jsx`) |

### UI Components (`client/src/components/ui/`)

| File | Purpose | Used On |
|------|---------|---------|
| `Rating.jsx` | Star rating display with half-star support | ProductDetails, ProductCard, QuickView |
| `SectionHeading.jsx` | Reusable section header with eyebrow, title, and optional action link | Home, ProductDetails |
| `Toaster.jsx` | Toast notification system (success, error, wishlist) reading from Redux | All store pages (via `StoreLayout.jsx`) |

---

## Layout (`client/src/layouts/`)

| File | Purpose | Pages Rendered Inside |
|------|---------|----------------------|
| `StoreLayout.jsx` | Wraps all public store pages with Navbar, Footer, CartDrawer, SearchOverlay, QuickView, Toaster, MatchBackground | Home, Shop, ProductDetails, Cart, Checkout, OrderSuccess, Login, Register, ForgotPassword, Account, Wishlist, About, Contact, Faq, Policy, NotFound |

---

## Redux Features (`client/src/features/`)

| File | Slice | Key Actions / Selectors | Used By |
|------|-------|-------------------------|---------|
| `cartSlice.js` | `cart` | `addToCart`, `removeFromCart`, `setQty`, `clearCart`; `cartCount`, `cartTotal` | ProductDetails, Cart, Checkout, Wishlist, ProductCard, QuickView, CartDrawer, Navbar |
| `wishlistSlice.js` | `wishlist` | `toggleWishlist`; `inWishlist` | ProductDetails, Wishlist, ProductCard, QuickView |
| `uiSlice.js` | `ui` | `setCartOpen`, `setSearchOpen`, `setMobileNavOpen`, `setQuickView`, `pushRecentlyViewed`, `toast`, `dismissToast` | ProductDetails, Cart, Checkout, Login, Register, ForgotPassword, Account, Contact, Wishlist, CartDrawer, SearchOverlay, ProductCard, QuickView, Navbar, Toaster |
| `store/index.js` | Store config | Combines cart, wishlist, ui slices | main.jsx |

---

## Library (`client/src/lib/`)

| File | Purpose | Used By |
|------|---------|---------|
| `api.js` | Axios instance with base URL `/api`, JWT auth interceptor (auto-attaches Bearer token), 401 auto-redirect to login | All pages/components that make API calls (17+ files) |
| `format.js` | Utility functions: `fmt()` (BDT currency formatter), `discounted()` (effective price), `discountPct()` (discount percentage), `totalStock()` (sum of stock map) | Home, Shop, ProductDetails, Cart, Checkout, Account, Wishlist, ProductCard, QuickView, SearchOverlay, CartDrawer |

---

## Data (`client/src/data/`)

| File | Purpose | Used By |
|------|---------|---------|
| `products.js` | Static reference data: `CATEGORIES` (8), `BRANDS` (5), `SIZES` (5), `BOOT_SIZES` (7), `TEAMS` (10 with colors), `categoryMeta()` helper | Home, Shop, ProductDetails, About, Navbar, Footer, SearchOverlay |

---

## Server Files

### Entry Point & Config

| File | Purpose |
|------|---------|
| `server/server.js` | Express app — helmet, compression, CORS, rate limiting, body parsing, mongo-sanitize, static uploads, Morgan logging, route mounting, production SPA fallback, error handler, DB connect, listen |
| `server/seed.js` | Database seeder — admin user, demo customer, 8 categories, 24 products, 3 coupons |
| `server/config/db.js` | Mongoose connection to `MONGODB_URI` |

### Middleware

| File | Purpose | Used By |
|------|---------|---------|
| `server/middleware/auth.js` | `protect` (JWT verification, attaches `req.user`), `adminOnly` (checks admin role) | All protected/admin routes |
| `server/middleware/errorHandler.js` | Global Express error handler — returns JSON with status code and message | server.js |

### Models

| File | Key Fields |
|------|------------|
| `server/models/User.js` | name, email, password (bcrypt), phone, avatar, role, addresses[], passwordResetToken/Expiry, verificationCode/Expiry, isActive |
| `server/models/Product.js` | name, slug, description, category, subCategory, brand, team, price, discountPrice, stock (Map), rating, numReviews, images[], featured, isNew, customizable, artColors |
| `server/models/Order.js` | orderId, user, items[], shippingAddress, paymentMethod, paymentStatus, orderStatus, statusHistory[], subtotal, shippingFee, discount, total, couponCode |
| `server/models/Category.js` | id, name, blurb, image, isActive |
| `server/models/Coupon.js` | code, discountType, value, minOrder, maxUses, usedCount, expiresAt, isActive |
| `server/models/Review.js` | product, user, rating, comment, verifiedPurchase, isVisible |

### Routes

| File | Mount | Endpoints | Purpose |
|------|-------|-----------|---------|
| `server/routes/auth.js` | `/api/auth` | POST register/login/google/apple/forgot-password/verify-code/reset-password/refresh/logout, GET me, PUT profile/password/addresses/billing | Full auth lifecycle |
| `server/routes/products.js` | `/api/products` | GET / (filtered+paginated), GET /:slug, POST / (admin), PUT /:id (admin), DELETE /:id (admin) | Product catalog CRUD |
| `server/routes/categories.js` | `/api/categories` | GET /, POST / (admin), PUT /:id (admin), DELETE /:id (admin) | Category CRUD |
| `server/routes/orders.js` | `/api/orders` | POST / (auth, create), GET /my (auth), GET /:id (auth), GET / (admin), PUT /:id/status (admin) | Order placement & management |
| `server/routes/reviews.js` | `/api/reviews` | GET /:productId (public), POST / (auth), DELETE /:id (admin), PUT /:id/visibility (admin) | Review CRUD with rating auto-update |
| `server/routes/coupons.js` | `/api/coupons` | POST /validate (public), GET / (admin), POST / (admin), PUT /:id (admin), DELETE /:id (admin) | Coupon validation & CRUD |
| `server/routes/admin.js` | `/api/admin` | GET /dashboard, GET /users, PUT /users/:id, GET /reviews | Admin aggregated data |
| `server/routes/upload.js` | `/api/upload` | POST / (admin, multipart, up to 10 images) | Image file upload |

---

## Config Files

| File | Purpose |
|------|---------|
| `client/tailwind.config.js` | Custom colors (night, pitch, volt, ember, gold, azure), fonts (Bebas Neue, Oswald, Inter), animations, shadows |
| `client/vite.config.js` | React plugin, dev proxy `/api` -> `localhost:5000`, production manual chunks |
| `client/postcss.config.js` | tailwindcss + autoprefixer |
| `client/index.html` | HTML entry — loads Google Fonts (Bebas Neue, Oswald, Inter) |
| `package.json` (root) | Monorepo scripts — `dev`, `build`, `start`, `seed`, `install:all` |
| `client/package.json` | Client deps — react 19, react-router-dom 7, redux toolkit, axios, framer-motion, lucide-react |
| `server/package.json` | Server deps — express 4, mongoose 8, bcryptjs, jsonwebtoken, multer, nodemailer, helmet, cors, compression |
| `Dockerfile` | Docker build configuration |
| `docker-compose.yml` | Docker Compose orchestration |
| `AGENTS.md` | Agent rules — always commit after completing tasks |
| `.gitignore` | Git ignore rules |

---

## Route-to-File Quick Reference

| Route | Page File | Layout | Auth |
|-------|-----------|--------|------|
| `/` | `Home.jsx` | `StoreLayout.jsx` | Public |
| `/shop` | `Shop.jsx` | `StoreLayout.jsx` | Public |
| `/product/:slug` | `ProductDetails.jsx` | `StoreLayout.jsx` | Public |
| `/cart` | `Cart.jsx` | `StoreLayout.jsx` | Public |
| `/checkout` | `Checkout.jsx` | `StoreLayout.jsx` | Protected |
| `/order/success` | `OrderSuccess.jsx` | `StoreLayout.jsx` | Public |
| `/login` | `Login.jsx` | `StoreLayout.jsx` | Public |
| `/register` | `Register.jsx` | `StoreLayout.jsx` | Public |
| `/forgot-password` | `ForgotPassword.jsx` | `StoreLayout.jsx` | Public |
| `/account` | `Account.jsx` | `StoreLayout.jsx` | Protected |
| `/account/wishlist` | `Wishlist.jsx` | `StoreLayout.jsx` | Public |
| `/about` | `About.jsx` | `StoreLayout.jsx` | Public |
| `/contact` | `Contact.jsx` | `StoreLayout.jsx` | Public |
| `/faq` | `Faq.jsx` | `StoreLayout.jsx` | Public |
| `/policies/:slug` | `Policy.jsx` | `StoreLayout.jsx` | Public |
| `*` | `NotFound.jsx` | `StoreLayout.jsx` | Public |
| `/admin` | `Dashboard.jsx` | `AdminLayout.jsx` | Admin |
| `/admin/login` | `AdminLogin.jsx` | None | Public |
| `/admin/products` | `AdminProducts.jsx` | `AdminLayout.jsx` | Admin |
| `/admin/orders` | `AdminOrders.jsx` | `AdminLayout.jsx` | Admin |
| `/admin/users` | `AdminUsers.jsx` | `AdminLayout.jsx` | Admin |
| `/admin/coupons` | `AdminCoupons.jsx` | `AdminLayout.jsx` | Admin |
| `/admin/reviews` | `AdminReviews.jsx` | `AdminLayout.jsx` | Admin |

---

## Component Dependency Tree

```
main.jsx
  ├── ErrorBoundary.jsx (wraps all)
  ├── store/index.js
  │     ├── cartSlice.js
  │     ├── wishlistSlice.js
  │     └── uiSlice.js
  └── App.jsx
        ├── StoreLayout.jsx (ALL public routes)
        │     ├── Navbar.jsx → Ticker.jsx
        │     ├── Footer.jsx
        │     ├── MatchBackground.jsx
        │     ├── CartDrawer.jsx
        │     ├── SearchOverlay.jsx
        │     ├── QuickView.jsx
        │     └── Toaster.jsx
        ├── ProtectedRoute.jsx (wraps /checkout, /account)
        └── AdminLayout.jsx (ALL admin routes)
              ├── AdminLogin.jsx
              ├── Dashboard.jsx
              ├── AdminProducts.jsx
              ├── AdminOrders.jsx
              ├── AdminUsers.jsx
              ├── AdminCoupons.jsx
              └── AdminReviews.jsx
```

# ⚽ Fleetmart Jersey Shop — Football Jersey & Sports Equipment E-Commerce Platform
### System Requirements Specification & Architecture Document (MERN Stack)

---

## 1. Project Overview

**Project Name (working title):** SportsGear / KitZone / JerseyArena (choose one)

**Vision:** A premium, high-energy e-commerce platform for football jerseys, boots, balls, training equipment, and turf/field services — combining the polish of a modern sports brand (think Nike/JD Sports feel) with a fast, reliable, interactive shopping experience.

**Core Product Categories:**
- Football Jerseys (Club, National Team, Retro, Customized/Name-Number Printing)
- Footballs (Match, Training, Futsal)
- Football Boots (Firm Ground, Turf, Indoor)
- Training Gear (Cones, Bibs, Agility Ladders, Poles)
- Goalkeeping Gear (Gloves, Jerseys)
- Sports Turf / Artificial Grass (product + possibly turf installation/booking service)
- Accessories (Shin Guards, Socks, Bags, Water Bottles)
- Fan Merchandise (Scarves, Caps, Mugs)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), React Router, Redux Toolkit / Zustand, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (Access + Refresh Tokens), bcrypt, Google OAuth (optional) |
| Payment Gateway | SSLCommerz / bKash-Nagad (Bangladesh-based) |
| Image/Media Storage | Cloudinary or AWS S3 |
| Search | MongoDB Atlas Search or Algolia (for fast product search) |
| Caching | Redis (for cart sessions, rate limiting, product cache) |
| Email/Notifications | Nodemailer + SendGrid, or Twilio for SMS |
| Hosting | Frontend: Vercel/Netlify · Backend: Render/Railway/AWS EC2 · DB: MongoDB Atlas |
| CI/CD | GitHub Actions |
| Admin Analytics | Chart.js / Recharts |
| State Management | Redux Toolkit (RTK Query recommended for API caching) |
| Real-time (optional) | Socket.io — for order status, live chat, stock alerts |

---

## 3. System Architecture

### 3.1 High-Level Architecture (3-Tier)

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                            │
│  React SPA (Customer Storefront)  │  React Admin Dashboard    │
└───────────────────────┬────────────────────────────────────┬─┘
                         │ REST API (Axios / RTK Query, HTTPS)│
┌────────────────────────▼───────────────────────────────────▼─┐
│                     APPLICATION LAYER                         │
│  Express.js REST API                                          │
│  ├─ Auth Service (JWT, OAuth)                                 │
│  ├─ Product Service                                           │
│  ├─ Cart & Wishlist Service                                   │
│  ├─ Order & Checkout Service                                  │
│  ├─ Payment Service (Stripe/SSLCommerz webhook handling)      │
│  ├─ Review & Rating Service                                   │
│  ├─ Admin/Inventory Service                                   │
│  ├─ Notification Service (email/SMS)                          │
│  └─ Search & Filter Service                                   │
└───────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────┐
│                        DATA LAYER                             │
│  MongoDB Atlas (Users, Products, Orders, Reviews, Carts)      │
│  Redis (Session cache, Cart cache, Rate limiter)               │
│  Cloudinary/S3 (Product images, jersey mockups)                │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Folder Structure (Suggested)

```
sportsgear/
├── client/                        # React frontend (customer)
│   ├── src/
│   │   ├── components/            # Reusable UI (Navbar, Footer, ProductCard, etc.)
│   │   ├── pages/                 # Route-level pages
│   │   ├── features/              # Redux slices (auth, cart, products, orders)
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── utils/
│   │   ├── assets/
│   │   └── App.jsx
│
├── admin/                          # Separate React admin panel (recommended)
│   ├── src/
│   │   ├── pages/ (Dashboard, Products, Orders, Users, Reports)
│   │   └── components/
│
├── server/                         # Node/Express backend
│   ├── config/                     # db.js, cloudinary.js, stripe.js
│   ├── models/                     # User.js, Product.js, Order.js, Review.js, Cart.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/                 # auth.js, errorHandler.js, upload.js
│   ├── services/
│   ├── utils/
│   ├── validators/                 # Joi/Zod schemas
│   └── server.js
│
├── shared/                          # Shared constants/types (optional monorepo)
└── docs/
```

---

## 4. Database Schema Design (MongoDB Collections)

### 4.1 `users`
```js
{
  _id, name, email, password (hashed), phone,
  role: "customer" | "admin" | "manager",
  addresses: [{ label, street, city, zip, country, isDefault }],
  wishlist: [ProductId],
  isVerified, provider: "local" | "google",
  createdAt, updatedAt
}
```

### 4.2 `products`
```js
{
  _id, name, slug, description,
  category: "jersey" | "football" | "boots" | "turf" | "training" | "accessories",
  subCategory, brand, team/club, league,
  images: [{ url, publicId }],
  variants: [{ size, color, sku, stock, price, discountPrice }],
  basePrice, discount, isCustomizable, customizationOptions: { nameFee, numberFee },
  rating, numReviews, tags, featured: Boolean,
  isActive, createdAt
}
```

### 4.3 `orders`
```js
{
  _id, orderId (human-readable), user: UserId,
  items: [{ product, variant, qty, price, customization: { name, number } }],
  shippingAddress, billingAddress,
  paymentMethod, paymentStatus: "pending"|"paid"|"failed"|"refunded",
  paymentInfo: { transactionId, gateway },
  orderStatus: "processing"|"confirmed"|"shipped"|"out_for_delivery"|"delivered"|"cancelled"|"returned",
  statusHistory: [{ status, timestamp }],
  subtotal, shippingFee, tax, discount, total,
  createdAt
}
```

### 4.4 `carts`
```js
{ _id, user, items: [{ product, variant, qty }], updatedAt }
```

### 4.5 `reviews`
```js
{ _id, product, user, rating, comment, images: [], verifiedPurchase, createdAt }
```

### 4.6 `coupons`
```js
{ _id, code, discountType: "percent"|"flat", value, minOrder, expiresAt, usageLimit, usedCount }
```

### 4.7 `categories`
```js
{ _id, name, slug, parentCategory, image, description }
```

---

## 5. Customer-Facing Pages

| # | Page | Key Features |
|---|---|---|
| 1 | **Home Page** | Hero banner/slider (new arrivals, sale), category tiles, featured jerseys, trending products, brand strip (Nike/Adidas/Puma logos), testimonials, newsletter signup |
| 2 | **Shop / Category Listing** | Filters (size, price, club, league, brand, color, discount), sort (price, popularity, newest), grid/list toggle, pagination/infinite scroll |
| 3 | **Product Details Page** | Image gallery/zoom, size chart, color/size selector, "Customize Name & Number" tool, stock availability, price + discount badge, add to cart/buy now, wishlist, reviews & ratings, related products, delivery estimator |
| 4 | **Jersey Customizer** | Interactive UI to add player name/number, live preview, font/style options |
| 5 | **Cart Page** | Editable quantities, price breakdown, coupon code input, estimated delivery, "save for later" |
| 6 | **Checkout Page** | Multi-step (Address → Shipping → Payment → Review), guest checkout option, multiple payment gateways, order summary sidebar |
| 7 | **Order Confirmation** | Order ID, invoice download (PDF), tracking link |
| 8 | **My Account / Dashboard** | Profile edit, order history & tracking, saved addresses, wishlist, reviews written, password/security |
| 9 | **Order Tracking Page** | Status timeline (Processing → Shipped → Delivered), live map (optional) |
| 10 | **Wishlist Page** | Move to cart, remove |
| 11 | **Search Results Page** | Autocomplete suggestions, filters |
| 12 | **Login / Register** | Email + password, Google OAuth, OTP verification, forgot/reset password |
| 13 | **About Us** | Brand story, sports vibe imagery |
| 14 | **Contact Us / Support** | Contact form, live chat widget, FAQ |
| 15 | **Turf & Equipment Services Page** | For turf: showcase products + optional "request installation quote" form |
| 16 | **Blog / News (optional)** | Football news, product guides, style tips — great for SEO |
| 17 | **Return & Refund Policy, Shipping Info, Terms, Privacy Policy** | Standard legal pages |
| 18 | **404 / Error Pages** | Branded, on-theme |

---

## 6. Admin Panel Pages

| # | Page | Features |
|---|---|---|
| 1 | Dashboard | Sales overview, revenue charts, top products, low stock alerts, recent orders |
| 2 | Product Management | Add/edit/delete products, bulk upload (CSV), variant/stock management, image upload |
| 3 | Category Management | Add/edit categories & subcategories |
| 4 | Order Management | View/update order status, print invoice, refund processing |
| 5 | User Management | View customers, block/unblock, role management (staff/admin) |
| 6 | Review Moderation | Approve/delete reviews |
| 7 | Coupon/Discount Management | Create promo codes, flash sales |
| 8 | Inventory & Stock Alerts | Low-stock notifications, restock logs |
| 9 | Reports & Analytics | Sales reports, best sellers, revenue by category, export to Excel/PDF |
| 10 | Banner/CMS Management | Update homepage banners, featured collections |
| 11 | Settings | Payment gateway keys, shipping rules, tax settings |

---

## 7. Core Functional Requirements

### 7.1 Customer Features
- User registration/login (JWT + OAuth), email verification, password reset via OTP/link
- Browse, filter, search (with autocomplete), and sort products
- Product variants: size, color, stock-aware selection
- Jersey customization (name/number printing) with dynamic pricing
- Cart persistence (guest cart via localStorage + merge on login)
- Wishlist
- Multiple payment methods (card, mobile banking, COD)
- Order placement, tracking, cancellation (within window), and return requests
- Product reviews with star ratings and photo upload
- Coupon code application
- Responsive design (mobile-first, since sports shopping is heavily mobile)
- Email/SMS order notifications
- Related/"Frequently bought together" recommendations

### 7.2 Admin Features
- Full CRUD on products, categories, coupons
- Order lifecycle management with status updates triggering customer notifications
- Inventory tracking with auto low-stock alerts
- Sales analytics dashboard with charts (daily/weekly/monthly revenue)
- Role-based access control (Super Admin, Manager, Staff)
- Bulk product import/export (CSV/Excel)

### 7.3 System-Wide (Non-Functional) Requirements

| Category | Requirement |
|---|---|
| **Performance** | Page load < 2s; lazy loading images; API response < 300ms for standard queries; pagination on all list endpoints |
| **Scalability** | Stateless API (horizontally scalable), MongoDB indexing on search/filter fields, Redis caching for hot product data |
| **Security** | HTTPS everywhere, bcrypt password hashing, JWT with refresh token rotation, input validation (Joi/Zod), rate limiting, helmet.js headers, CORS whitelisting, XSS/CSRF protection, PCI-compliant payment handling (never store raw card data) |
| **Reliability** | 99.9% uptime target, DB backups (daily), graceful error handling with retry logic on payment webhooks, transaction rollback on order failures |
| **Usability** | Consistent design system, clear CTAs, breadcrumb navigation, accessible (WCAG AA — alt text, keyboard nav, color contrast) |
| **SEO** | Server-side rendering or pre-rendering (consider Next.js migration later) for product pages, meta tags, structured data (schema.org Product) |
| **Interactivity** | Smooth animations (Framer Motion), hover effects on product cards, skeleton loaders, toast notifications, interactive jersey customizer with live canvas preview |
| **Maintainability** | Modular code structure, ESLint/Prettier, API documentation (Swagger/Postman), environment-based config |
| **Testing** | Unit tests (Jest), API tests (Supertest), E2E tests (Cypress/Playwright) |

---

## 8. UI/UX Design Direction — "Classy Sports Vibe"

**Design Philosophy:** Bold, energetic, premium — similar to Nike, Adidas, JD Sports, or Kitbag aesthetics.

### 8.1 Visual Identity
- **Color Palette:** Deep base (charcoal black / navy) + one vibrant accent (electric green, fiery orange, or club-red) + white space. Avoid generic blue-only e-commerce look.
- **Typography:** Bold condensed sans-serif for headings (e.g., "Bebas Neue," "Anton," or "Oswald") to evoke jersey/sport branding; clean sans (Inter/Poppins) for body text.
- **Imagery:** High-contrast action shots, jersey flat-lays on dark backgrounds, motion-blur accents.
- **Micro-interactions:** Button hover states with subtle scale/glow, animated add-to-cart confirmation (mini cart slide-in), skeleton loading shimmer, parallax hero banners.
- **Iconography:** Custom sport-themed icons (ball, boot, whistle) instead of generic e-commerce icons.

### 8.2 Layout Principles
- Sticky header with mega-menu (categories with club logos)
- Product cards: hover shows alternate image (front/back jersey), quick-add button
- Size guide as an interactive modal, not a static image
- Trust badges near checkout (secure payment icons, free returns, authenticity guarantee)
- Sticky "Add to Cart" bar on mobile product pages

---

## 9. API Endpoint Overview (Sample)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
GET    /api/products
GET    /api/products/:slug
POST   /api/products               (admin)
PUT    /api/products/:id           (admin)
GET    /api/categories
GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/update
DELETE /api/cart/remove/:itemId
POST   /api/orders
GET    /api/orders/:id
GET    /api/orders/my-orders
PUT    /api/orders/:id/status      (admin)
POST   /api/payment/create-intent
POST   /api/payment/webhook
POST   /api/reviews
GET    /api/reviews/:productId
POST   /api/coupons/apply
GET    /api/admin/dashboard/stats
```

---

## 10. Suggested Development Roadmap

| Phase | Deliverable |
|---|---|
| 1. Planning | Finalize wireframes (Figma), DB schema, brand identity |
| 2. Backend Core | Auth, Product, Category models + APIs |
| 3. Frontend Core | Home, Shop, Product Detail, Cart pages |
| 4. Checkout & Payment | Order flow + payment gateway integration |
| 5. Admin Panel | Product/Order/User management |
| 6. Enhancements | Jersey customizer, reviews, wishlist, coupons |
| 7. Polish | Animations, responsive QA, performance optimization |
| 8. Testing & Deployment | Unit/E2E tests, CI/CD, production deployment |
| 9. Post-launch | Analytics integration, SEO, marketing pages, blog |

---

## 11. Optional Advanced Features (Future Scope)
- AI-based size recommendation
- AR jersey try-on (WebAR)
- Loyalty points/rewards program
- Turf booking calendar system (if offering turf rental/installation)
- Multi-vendor marketplace mode
- Live chat support (Socket.io + admin console)
- Progressive Web App (PWA) support for app-like mobile experience

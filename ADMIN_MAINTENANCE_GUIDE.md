# FleetMart — Complete Admin & Website Maintenance Guide

> **Purpose:** This guide explains how to maintain and manage the live FleetMart website from the Admin Panel without directly modifying code whenever possible.

> **Accuracy:** This document is based on the actual current repository implementation. Features are documented only if they exist in the codebase.

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Admin Panel Overview](#3-admin-panel-overview)
4. [Admin vs Developer Responsibilities](#4-admin-vs-developer-responsibilities)
5. [Admin Login & Security](#5-admin-login--security)
6. [Dashboard](#6-dashboard)
7. [Product Management](#7-product-management)
8. [Product Images & Cloudinary](#8-product-images--cloudinary)
9. [Category Management](#9-category-management)
10. [Inventory Management](#10-inventory-management)
11. [Order Management](#11-order-management)
12. [User Management](#12-user-management)
13. [Coupon Management](#13-coupon-management)
14. [Review Management](#14-review-management)
15. [Website Content Management](#15-website-content-management)
16. [Environment Variables](#16-environment-variables)
17. [Vercel Production Architecture](#17-vercel-production-architecture)
18. [Adding a New Product](#18-adding-a-new-product)
19. [Editing Products](#19-editing-products)
20. [Removing Products](#20-removing-products)
21. [Troubleshooting](#21-troubleshooting)
22. [Production Safety](#22-production-safety)
23. [Developer-Only Maintenance](#23-developer-only-maintenance)
24. [Backup & Recovery](#24-backup--recovery)
25. [Daily/Weekly/Monthly Checklist](#25-dailyweeklymonthly-checklist)
26. [Deployment Verification](#26-deployment-verification)
27. [Known Limitations](#27-known-limitations)

---

## 1. Overview

FleetMart is a football jersey and sports equipment e-commerce platform built with the MERN stack (MongoDB, Express, React, Node.js) and deployed to Vercel.

### Key Components

| Component | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Redux Toolkit | Customer storefront + Admin Panel |
| **Backend** | Node.js, Express | REST API |
| **Database** | MongoDB (Mongoose) | Data storage |
| **Images** | Cloudinary | Product image hosting |
| **Deployment** | Vercel | Hosting (serverless) |

### What This Guide Covers

- How to log in and use the Admin Panel
- How to manage products, orders, users, coupons, and reviews
- How images work with Cloudinary
- What can and cannot be done from the Admin Panel
- Troubleshooting common issues

---

## 2. System Architecture

### Live Website Flow

```
User Browser
      ↓
Vercel (CDN + Serverless Functions)
      ↓
┌─────────────────────────────────┐
│  Frontend (React SPA)           │  ← Served from Vercel CDN
│  client/dist/                   │
└──────────┬──────────────────────┘
           ↓ API calls (/api/*)
┌─────────────────────────────────┐
│  Backend (Express)              │  ← Vercel Serverless Function
│  api/index.js → server/server.js│
└──────────┬──────────────────────┘
           ↓
┌─────────────────────────────────┐
│  MongoDB Atlas                  │  ← Cloud database
└─────────────────────────────────┘
           ↓ (image uploads)
┌─────────────────────────────────┐
│  Cloudinary                     │  ← Image hosting CDN
└─────────────────────────────────┘
```

### File Structure

| Directory/File | Purpose |
|---|---|
| `client/` | React frontend (storefront + admin) |
| `server/` | Express backend (API, models, routes) |
| `api/index.js` | Vercel serverless entry point (3 lines — imports and re-exports Express app) |
| `public/` | Generated static files for Vercel (created by `scripts/postbuild.js`) |
| `scripts/postbuild.js` | Copies `client/dist/` to `public/` after build |
| `package.json` | Root project scripts (build, dev, seed) |
| `vercel.json` | Vercel SPA rewrite rules |
| `Dockerfile` | Docker build configuration (alternative deployment) |
| `docker-compose.yml` | Docker orchestration with MongoDB |

---

## 3. Admin Panel Overview

### Accessing the Admin Panel

- **URL:** `your-domain.vercel.app/admin/login`
- **Login:** Email + Password
- **Authorization:** Only users with `role: 'admin'` can access admin features

### Admin Panel Pages

| Page | URL | Purpose |
|---|---|---|
| Dashboard | `/admin` | Overview stats, recent orders, low stock alerts |
| Products | `/admin/products` | Add, edit, delete products |
| Orders | `/admin/orders` | View and manage customer orders |
| Users | `/admin/users` | View users, change roles, block/unblock |
| Coupons | `/admin/coupons` | Create, edit, delete discount coupons |
| Reviews | `/admin/reviews` | View, hide, delete customer reviews |

### Admin Panel Navigation

The Admin Panel has a fixed sidebar with navigation links:

- **Dashboard** — Stats overview
- **Products** — Product management
- **Orders** — Order management
- **Users** — User management
- **Coupons** — Coupon management
- **Reviews** — Review management
- **Logout** — Signs out and redirects to admin login

---

## 4. Admin vs Developer Responsibilities

### ✅ Admin Can Do Without Code

| Task | Admin Panel |
|---|---|
| Add new products | ✅ Manageable from Admin Panel |
| Edit product details | ✅ Manageable from Admin Panel |
| Delete products | ✅ Manageable from Admin Panel |
| Upload product images | ✅ Manageable from Admin Panel |
| Change product prices | ✅ Manageable from Admin Panel |
| Update stock quantities | ✅ Manageable from Admin Panel |
| Mark products as featured | ✅ Manageable from Admin Panel |
| Mark products as "New" | ✅ Manageable from Admin Panel |
| View all orders | ✅ Manageable from Admin Panel |
| Update order status | ✅ Manageable from Admin Panel |
| View customer information | ✅ Manageable from Admin Panel |
| Promote users to admin | ✅ Manageable from Admin Panel |
| Block/unblock users | ✅ Manageable from Admin Panel |
| Create discount coupons | ✅ Manageable from Admin Panel |
| Edit/delete coupons | ✅ Manageable from Admin Panel |
| View customer reviews | ✅ Manageable from Admin Panel |
| Hide/show reviews | ✅ Manageable from Admin Panel |
| Delete reviews | ✅ Manageable from Admin Panel |
| View dashboard stats | ✅ Manageable from Admin Panel |
| View low stock alerts | ✅ Manageable from Admin Panel |

### 🧑‍💻 Developer Required

| Task | Reason |
|---|---|
| Add new Admin Panel features | Requires code changes |
| Change database schema | Requires model changes |
| Add new API endpoints | Requires backend code |
| Change authentication logic | Requires code changes |
| Change Vercel configuration | Requires deployment changes |
| Change Cloudinary integration | Requires code changes |
| Add new payment gateways | Requires code changes |
| Change UI/UX design | Requires frontend code |
| Change homepage layout | 🧑‍💻 Developer action required |
| Change site logo | 🧑‍💻 Developer action required |
| Change navigation structure | 🧑‍💻 Developer action required |
| Add new product categories | 🧑‍💻 Developer action required (code-level category list) |
| Modify email templates | Requires code changes |
| Change shipping logic | Requires code changes |

---

## 5. Admin Login & Security

### How Admin Login Works

1. Navigate to `/admin/login`
2. Enter email and password
3. System calls `POST /api/auth/login`
4. Backend verifies credentials against MongoDB
5. If `user.role !== 'admin'`, login is rejected with "Not an admin account"
6. On success, JWT token and user data are stored in browser `localStorage`
7. Admin is redirected to `/admin` (Dashboard)

### Token Behavior

- **Access Token:** Stored as `fm_token` in `localStorage`, included as `Authorization: Bearer <token>` header
- **User Data:** Stored as `fm_user` in `localStorage`
- **Token Expiry:** 7 days for access token
- **Refresh:** Automatic via HTTP-only cookies

### Security Rules

- ⚠️ **Admin Panel has no route-level protection** — any visitor can access `/admin/*` URLs directly. The backend enforces authorization via `protect` + `adminOnly` middleware on API endpoints.
- Never share admin credentials
- Never commit credentials to Git
- Never expose `JWT_SECRET` or `JWT_REFRESH_SECRET`
- Log out when finished using the Admin Panel

### Environment Variables That Must Remain Secret

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Signs access tokens |
| `JWT_REFRESH_SECRET` | Signs refresh tokens |
| `MONGODB_URI` | Database connection string |
| `CLOUDINARY_NAME` | Cloudinary account name |
| `CLOUDINARY_KEY` | Cloudinary API key |
| `CLOUDINARY_SECRET` | Cloudinary API secret |

---

## 6. Dashboard

The Dashboard (`/admin`) displays an overview of the store.

### Stats Cards

| Stat | Description |
|---|---|
| **Revenue** | Total revenue from all orders (formatted in ৳) |
| **Orders** | Total number of orders |
| **Products** | Total number of products |
| **Users** | Total registered users |
| **Reviews** | Total customer reviews |
| **Coupons** | Total coupons created |

### Recent Orders

Shows the 5 most recent orders with:
- Order ID
- Customer name
- Total amount (৳)
- Order status (color-coded badge)

### Low Stock Alert

Shows products where:
- Total stock across all sizes is below 20, OR
- Any individual size has fewer than 5 units

Displays:
- Product name
- Category and brand
- Which sizes are low and quantity
- Total stock

### Orders by Status

Shows a count of orders in each status:
- Processing
- Confirmed
- Shipped
- Out for Delivery
- Delivered
- Cancelled
- Returned

---

## 7. Product Management

### Product Form Fields

When adding or editing a product, the Admin Panel provides these fields:

| Field | Type | Required | Description |
|---|---|---|---|
| **Product Images** | Multi-file upload | No | Upload product images (max 10, 5MB each) |
| **Name** | Text | ✅ Yes | Product name |
| **Slug** | Text | ✅ Yes | URL-friendly identifier (e.g., `adidas Predator`) |
| **Category** | Dropdown | No | Select from: Jerseys, Boots, Footballs, Training, Goalkeeping, Turf & Grass, Accessories, Fan Merch |
| **Brand** | Text | No | Brand name (e.g., Adidas, Nike) |
| **Team** | Text | No | Team name (e.g., Brazil, Manchester United) |
| **Price (BDT)** | Number | ✅ Yes | Price in Bangladeshi Taka |
| **Discount Price** | Number | No | Sale price (if applicable) |
| **Description** | Textarea | No | Product description |
| **Stock** | Text (JSON) | No | Size-based inventory as JSON, e.g., `{"S": 10, "M": 5, "L": 8}` |
| **Featured** | Checkbox | No | Show on homepage featured section |
| **New** | Checkbox | No | Mark as new arrival |
| **Customizable** | Checkbox | No | Allow jersey customization (name/number) |

### Fields in Database But Not in Admin Form

The following fields exist in the Product model but have no Admin Panel UI:

| Field | Default | Purpose |
|---|---|---|
| `subCategory` | `''` | Sub-category classification |
| `league` | `null` | League affiliation |
| `artColors` | `{ primary, secondary, accent }` | Art color configuration |
| `isActive` | `true` | Product visibility (always `true` on creation) |
| `rating` | `0` | Average rating (calculated from reviews) |
| `numReviews` | `0` | Review count (calculated from reviews) |

> 🧑‍💻 **Note:** These fields can only be modified via direct database access or API calls, not from the Admin Panel.

### Supported Operations

| Operation | Supported |
|---|---|
| Create product | ✅ Yes |
| Read/View products | ✅ Yes (paginated list, 20 per page) |
| Update product | ✅ Yes |
| Delete product | ✅ Yes (with browser confirmation) |
| Filter by category | ✅ Yes (dropdown filter) |
| Pagination | ✅ Yes |
| Search | ❌ Not in Admin Panel (available on storefront API) |
| Sort | ❌ Not in Admin Panel |

### Product Categories

Available categories in the Admin Panel dropdown:

| Category ID | Display Name |
|---|---|
| `jersey` | Jerseys |
| `boots` | Boots |
| `football` | Footballs |
| `training` | Training |
| `goalkeeper` | Goalkeeping |
| `turf` | Turf & Grass |
| `accessories` | Accessories |
| `merch` | Fan Merch |

---

## 8. Product Images & Cloudinary

### How Image Upload Works

1. Admin clicks "Add Images" in the product form
2. Selects one or more image files (accepts: JPEG, JPG, PNG, WebP, GIF)
3. Frontend sends files to `POST /api/upload` as `FormData` with field name `images`
4. Backend receives files in memory (multer `memoryStorage`)
5. Each file is streamed to Cloudinary via `cloudinary.uploader.upload_stream()`
6. Images are stored in Cloudinary folder `fleetmart`
7. Cloudinary returns a `secure_url` for each image
8. URLs are saved in the product's `images` array as `{ url, alt }`

### Cloudinary Environment Variables

| Variable | Purpose |
|---|---|
| `CLOUDINARY_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_KEY` | Your Cloudinary API key |
| `CLOUDINARY_SECRET` | Your Cloudinary API secret |

> ⚠️ Never expose these values. They are only set in Vercel environment variables and server `.env` files.

### Image Specifications

| Specification | Value |
|---|---|
| **Max files per upload** | 10 |
| **Max file size** | 5 MB per file |
| **Allowed formats** | JPEG, JPG, PNG, WebP, GIF |
| **Storage location** | Cloudinary `fleetmart` folder |
| **URL type** | HTTPS (`secure_url`) |

### Image Management in Admin Panel

| Operation | How |
|---|---|
| **Add images** | Click "Add Images" button in product form, select files |
| **Remove images** | Click the X button on image preview (before saving) |
| **Replace images** | Remove old images, upload new ones, save |
| **View images** | Thumbnail shown in product table; full image in edit form |

### What Happens If Upload Fails

- The Admin Panel shows an uploading indicator
- If Cloudinary is unreachable or credentials are wrong, the upload will fail
- The product can still be saved without images (images field is optional)
- Check that `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, and `CLOUDINARY_SECRET` are correctly set in Vercel

### Admin vs Developer Responsibilities

| Task | Who |
|---|---|
| Upload product images | ✅ Admin |
| Remove product images | ✅ Admin |
| Replace product images | ✅ Admin |
| Configure Cloudinary account | 🧑‍💻 Developer |
| Set Cloudinary env vars | 🧑‍💻 Developer |
| Change upload folder | 🧑‍💻 Developer |
| Modify image size limits | 🧑‍💻 Developer |
| Modify allowed formats | 🧑‍💻 Developer |

---

## 9. Category Management

### Current Status

> ❌ **Category management is not available from the Admin Panel.**

Categories are hardcoded in the frontend as a fixed list:

```
Jerseys, Boots, Footballs, Training, Goalkeeping, Turf & Grass, Accessories, Fan Merch
```

### How Categories Work

- **Backend:** Categories exist in MongoDB (`Category` model) with fields: `id`, `name`, `blurb`, `image`, `isActive`
- **Frontend:** The Admin Panel product form uses a hardcoded dropdown, not the database categories
- **Storefront:** Products are filtered by the `category` field on the Product model

### Adding New Categories

> 🧑‍💻 **Developer action required.** To add a new category, a developer must:
> 1. Add the category to the hardcoded list in `AdminProducts.jsx`
> 2. Add the category to any frontend filtering logic
> 3. Optionally create a Category document in MongoDB

### Category API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `GET /api/categories` | GET | None | List active categories |
| `POST /api/categories` | POST | Admin | Create category |
| `PUT /api/categories/:id` | PUT | Admin | Update category |
| `DELETE /api/categories/:id` | DELETE | Admin | Delete category |

> These endpoints exist but are not used by the Admin Panel UI.

---

## 10. Inventory Management

### How Stock Works

Stock is managed per product, per size using a JSON object:

```json
{
  "S": 10,
  "M": 5,
  "L": 8,
  "XL": 3
}
```

### Stock Management in Admin Panel

| Operation | How |
|---|---|
| **Set initial stock** | Enter JSON in the Stock field when creating/editing a product |
| **Update stock** | Edit the JSON in the Stock field and save |
| **View stock** | Stock total is shown in the product table; individual sizes visible in edit form |

### Automatic Stock Changes

- **When an order is placed:** Stock is automatically decremented via `$inc` (MongoDB atomic operation)
- **Stock decrement failure:** Silently caught — orders can technically be placed even with insufficient stock
- **No automatic restocking:** Stock must be manually updated by admin

### Stock Format

The Stock field accepts raw JSON. Example:

```json
{"S": 10, "M": 5, "L": 8, "XL": 3}
```

> ⚠️ **Important:** The Stock field is a raw JSON text input. There is no guided UI for stock management. Enter valid JSON or the field will be empty.

### Low Stock Alerts

The Dashboard shows products with:
- Total stock below 20 units across all sizes
- Any individual size with fewer than 5 units

### What Is NOT Supported

- ❌ No low-stock email notifications
- ❌ No automatic out-of-stock marking
- ❌ No stock history tracking
- ❌ No variant-level stock UI (only JSON input)
- ❌ No inventory reports

---

## 11. Order Management

### Viewing Orders

1. Navigate to `/admin/orders`
2. Orders are displayed in a table with pagination (20 per page)
3. Filter by status using the dropdown at the top

### Order Information Displayed

| Column | Content |
|---|---|
| **Order ID** | Unique ID (e.g., `FM-LX5K2`) |
| **Customer** | Name and email |
| **Items** | Number of items in the order |
| **Total** | Order total in ৳ |
| **Payment** | Payment status badge (Paid/Pending) |
| **Status** | Order status badge (color-coded) |
| **Actions** | Status dropdown to change status |

### Order Statuses

| Status | Meaning |
|---|---|
| `processing` | Order received, awaiting processing |
| `confirmed` | Order confirmed by admin |
| `shipped` | Order shipped to customer |
| `out_for_delivery` | Order out for delivery |
| `delivered` | Order delivered (auto-sets payment to "paid") |
| `cancelled` | Order cancelled |
| `returned` | Order returned |

### How to Change Order Status

1. Find the order in the list
2. Use the dropdown in the "Actions" column
3. Select the new status
4. The status is updated immediately via `PUT /api/orders/:id/status`

### Order Workflow

```
Customer places order
       ↓
Order created with status "processing"
Payment status: "pending" (for COD) or "paid" (for online)
       ↓
Admin reviews order in Admin Panel
       ↓
Admin changes status to "confirmed"
       ↓
Admin ships the order
Status changed to "shipped"
       ↓
Status changed to "out_for_delivery"
       ↓
Status changed to "delivered"
Payment status auto-changes to "paid"
```

### Order Information Available to Admins

- Order ID
- Customer name and email
- All items (product, size, quantity, price)
- Shipping address (label, name, phone, street, city, zip, country)
- Payment method (cod, bkash, card)
- Payment status
- Order status
- Status history (each status change with timestamp)
- Subtotal, shipping fee, discount, total
- Coupon code (if used)
- Order notes

### What Is NOT Supported

- ❌ No order deletion from Admin Panel
- ❌ No invoice generation
- ❌ No refund processing from Admin Panel
- ❌ No shipping tracking integration
- ❌ No order export to CSV/PDF
- ❌ No bulk status updates

---

## 12. User Management

### Viewing Users

1. Navigate to `/admin/users`
2. Users are displayed in a table with pagination (20 per page)

### User Information Displayed

| Column | Content |
|---|---|
| **User** | Name and email |
| **Role** | Admin or Customer (color-coded badge) |
| **Status** | Active or Blocked |
| **Joined** | Registration date |
| **Actions** | Role toggle + Block/Unblock buttons |

### User Management Operations

| Operation | How |
|---|---|
| **View users** | Navigate to `/admin/users` |
| **Promote to admin** | Click "Make Admin" button |
| **Demote admin** | Click "Demote" button |
| **Block user** | Click "Block" button |
| **Unblock user** | Click "Unblock" button |

### Role System

| Role | Permissions |
|---|---|
| `customer` | Can browse, order, review, manage own account |
| `admin` | Full access to Admin Panel and all API endpoints |

### What Is NOT Supported

- ❌ No user search or filter
- ❌ No user deletion from Admin Panel
- ❌ No viewing user order history from Users page
- ❌ No bulk operations
- ❌ No user detail/profile view
- ❌ No password reset from Admin Panel
- ⚠️ No confirmation dialog for role changes or block/unblock

---

## 13. Coupon Management

### Viewing Coupons

1. Navigate to `/admin/coupons`
2. All coupons are displayed in a table (no pagination — loads all)

### Coupon Information Displayed

| Column | Content |
|---|---|
| **Code** | Coupon code (displayed in volt color) |
| **Discount** | Percentage (e.g., `10%`) or flat amount (e.g., `৳500`) |
| **Min Order** | Minimum order amount (or `—`) |
| **Uses** | `usedCount / maxUses` (∞ if unlimited) |
| **Expires** | Expiration date (or "Never") |
| **Actions** | Edit + Delete icons |

### Coupon Form Fields

| Field | Type | Required | Description |
|---|---|---|---|
| **Code** | Text | ✅ Yes | Coupon code (auto-uppercased) |
| **Type** | Dropdown | No | "Percent" or "Flat (BDT)" |
| **Value** | Number | ✅ Yes | Discount value |
| **Min Order (BDT)** | Number | No | Minimum order amount to use coupon |
| **Max Uses (0=unlimited)** | Number | No | Maximum number of times coupon can be used |
| **Expires** | Date | No | Expiration date |

### Supported Operations

| Operation | Supported |
|---|---|
| Create coupon | ✅ Yes |
| Edit coupon | ✅ Yes |
| Delete coupon | ✅ Yes (with confirmation) |
| Validate coupon | ✅ Yes (via API — `POST /api/coupons/validate`) |

---

## 14. Review Management

### Viewing Reviews

1. Navigate to `/admin/reviews`
2. Reviews are displayed in a table (loads up to 50 reviews, no pagination)

### Review Information Displayed

| Column | Content |
|---|---|
| **Product** | Product name |
| **User** | Reviewer name |
| **Rating** | Star rating (★/☆) |
| **Comment** | Review text (truncated) |
| **Visible** | "Visible" (green) or "Hidden" (ember) |
| **Actions** | Toggle visibility + Delete |

### Review Management Operations

| Operation | How |
|---|---|
| **Hide review** | Click the Eye icon (toggles to hidden) |
| **Show review** | Click the EyeOff icon (toggles to visible) |
| **Delete review** | Click Trash icon (with confirmation) |

### What Is NOT Supported

- ❌ No review pagination (limited to 50)
- ❌ No review search or filter
- ❌ No reply to reviews
- ❌ No review analytics
- ⚠️ Deleting a review does NOT recalculate product rating/numReviews (known issue)

---

## 15. Website Content Management

### What CAN Be Managed From Admin Panel

| Content | Manageable |
|---|---|
| Products | ✅ Yes |
| Product images | ✅ Yes |
| Product prices | ✅ Yes |
| Product descriptions | ✅ Yes |
| Product categories | ✅ Yes (via product edit) |
| Product featured status | ✅ Yes |
| Order statuses | ✅ Yes |
| Coupons/discounts | ✅ Yes |
| Review visibility | ✅ Yes |
| User roles | ✅ Yes |

### What CANNOT Be Managed From Admin Panel

| Content | Status |
|---|---|
| Homepage layout | 🧑‍💻 Developer action required |
| Hero/banner images | 🧑‍💻 Developer action required |
| Site logo | 🧑‍💻 Developer action required |
| Navigation menu | 🧑‍💻 Developer action required |
| Footer content | 🧑\UD83E\uDDD1‍💻 Developer action required |
| About page | 🧑‍💻 Developer action required |
| Contact page | 🧑‍💻 Developer action required |
| FAQ page | 🧑‍💻 Developer action required |
| Privacy/Policy pages | 🧑‍💻 Developer action required |
| Email templates | 🧑‍💻 Developer action required |
| Payment gateway config | 🧑‍💻 Developer action required |
| Shipping rules | 🧑‍💻 Developer action required |
| Tax settings | 🧑‍💻 Developer action required |
| Product categories list | 🧑‍💻 Developer action required |
| Custom page content | 🧑‍💻 Developer action required |

---

## 16. Environment Variables

### Complete Environment Variable Table

| Variable | Used By | Purpose | Secret? | Where Configured |
|---|---|---|---|---|
| `MONGODB_URI` | `server/config/db.js` | MongoDB connection string | ✅ Yes | Vercel / `.env` |
| `JWT_SECRET` | `server/middleware/auth.js`, `server/routes/auth.js` | Signs JWT access tokens | ✅ Yes | Vercel / `.env` |
| `JWT_REFRESH_SECRET` | `server/routes/auth.js` | Signs JWT refresh tokens | ✅ Yes | Vercel / `.env` |
| `PORT` | `server/server.js` | Server port (default: 5000) | No | Vercel / `.env` |
| `CORS_ORIGINS` | `server/server.js` | Allowed CORS origins (comma-separated) | No | Vercel / `.env` |
| `NODE_ENV` | `server/server.js` | Environment mode | No | Vercel / `.env` |
| `SMTP_HOST` | `server/routes/auth.js` | Email server host | No | Vercel / `.env` |
| `SMTP_PORT` | `server/routes/auth.js` | Email server port (default: 587) | No | Vercel / `.env` |
| `SMTP_SECURE` | `server/routes/auth.js` | Email TLS (true/false) | No | Vercel / `.env` |
| `SMTP_USER` | `server/routes/auth.js` | Email username | ⚠️ Yes | Vercel / `.env` |
| `SMTP_PASS` | `server/routes/auth.js` | Email password | ✅ Yes | Vercel / `.env` |
| `SMTP_FROM` | `server/routes/auth.js` | Sender email address | No | Vercel / `.env` |
| `CLOUDINARY_NAME` | `server/routes/upload.js` | Cloudinary cloud name | ⚠️ Yes | Vercel / `.env` |
| `CLOUDINARY_KEY` | `server/routes/upload.js` | Cloudinary API key | ✅ Yes | Vercel / `.env` |
| `CLOUDINARY_SECRET` | `server/routes/upload.js` | Cloudinary API secret | ✅ Yes | Vercel / `.env` |
| `VERCEL` | `server/server.js` | Vercel detection (set by Vercel) | No | Auto-set by Vercel |

### Frontend Environment Variables (Vite)

| Variable | Purpose | Public? |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | ⚠️ Yes (exposed to browser) |
| `VITE_APPLE_CLIENT_ID` | Apple OAuth client ID | ⚠️ Yes (exposed to browser) |

> ⚠️ Frontend env vars (prefixed with `VITE_`) are embedded in the JavaScript bundle and visible to anyone. Never put secrets in frontend env vars.

### Local Development

For local development, create `server/.env` with:

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fleetmart
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

> ⚠️ Never commit `.env` files to Git. They are in `.gitignore`.

### What Happens If a Required Variable Is Missing

| Variable Missing | Effect |
|---|---|
| `MONGODB_URI` | Server cannot connect to database. All API calls fail. |
| `JWT_SECRET` | Authentication fails. Users cannot log in. |
| `JWT_REFRESH_SECRET` | Token refresh fails. Users get logged out. |
| `CLOUDINARY_*` | Image uploads fail. Products can still be created without images. |
| `SMTP_*` | Password reset emails fail (uses console stub in development). |
| `CORS_ORIGINS` | Only localhost origins are allowed. Production requests may be blocked. |

---

## 17. Vercel Production Architecture

### How Deployment Works

1. Code is pushed to `main` branch on GitHub
2. Vercel automatically detects the push and triggers a build
3. Vercel runs `npm install` at the root
4. Vercel runs `npm run build` which:
   - Runs `cd client && npm ci` (installs client dependencies)
   - Runs `vite build` (builds React app to `client/dist/`)
   - Runs `node ../scripts/postbuild.js` (copies `client/dist/` to `public/`)
5. Vercel deploys:
   - `public/` as static files (CDN)
   - `api/index.js` as a serverless function (Express backend)

### Request Routing

| Request Type | Handler |
|---|---|
| `GET /*` (non-API) | Vercel CDN serves `public/index.html` (SPA) |
| `GET /api/*` | Vercel invokes `api/index.js` → Express handles |
| `POST /api/*` | Vercel invokes `api/index.js` → Express handles |
| Static assets (`/assets/*`) | Vercel CDN serves from `public/` |

### File Roles in Deployment

| File | Role |
|---|---|
| `api/index.js` | Vercel serverless entry point — imports Express app |
| `server/server.js` | Express application — all API routes and middleware |
| `vercel.json` | SPA rewrite rule: non-API routes → `/index.html` |
| `scripts/postbuild.js` | Copies build output to `public/` for Vercel |
| `public/` | Static files served by Vercel CDN |
| `client/dist/` | Build output (also kept for Docker deployment) |

---

## 18. Adding a New Product: Complete Tutorial

### Step 1: Prepare Product Information

Before adding a product, gather:

- Product name
- Brand name
- Team name (if applicable)
- Price in BDT
- Discount price (if applicable)
- Description
- Category (Jerseys, Boots, Footballs, Training, Goalkeeper, Turf & Grass, Accessories, Fan Merch)
- Stock quantities per size
- Product images (JPEG, PNG, WebP, or GIF, max 5MB each)

### Step 2: Prepare Images

- Ensure images are in supported formats (JPEG, JPG, PNG, WebP, GIF)
- Each image must be under 5 MB
- You can upload up to 10 images per product
- Recommended: Have images ready before starting

### Step 3: Login to Admin Panel

1. Go to `your-domain.vercel.app/admin/login`
2. Enter your admin email and password
3. Click **Sign In**

### Step 4: Navigate to Product Management

1. Click **Products** in the sidebar

### Step 5: Create New Product

1. Click the **+ Add Product** button (top right)
2. The product form modal will appear

### Step 6: Fill In Product Details

1. **Product Images:** Click **Add Images** → select your image files → wait for upload
2. **Name:** Enter the product name (required)
3. **Slug:** Enter a URL-friendly identifier, e.g., `adidas-predator-25` (required)
4. **Category:** Select from the dropdown
5. **Brand:** Enter the brand name
6. **Team:** Enter the team name (if applicable)
7. **Price (BDT):** Enter the price as a number (required)
8. **Discount Price:** Enter sale price (leave empty if no discount)
9. **Description:** Enter product description
10. **Stock:** Enter stock as JSON, e.g., `{"S": 10, "M": 5, "L": 8}`
11. **Featured:** Check if this should appear on the homepage
12. **New:** Check if this is a new arrival
13. **Customizable:** Check if this jersey supports name/number customization

### Step 7: Save the Product

1. Click **Save** (or equivalent button)
2. Wait for the API response
3. The modal closes and the product list refreshes

### Step 8: Verify

1. Check the product list — your product should appear
2. Visit the storefront (`your-domain.vercel.app`) to verify it shows up
3. If the product doesn't appear, check:
   - Is `isActive` set to `true`? (it should be by default)
   - Is the category correct?
   - Is the product in the database? (check via API)

---

## 19. Editing Products

### Finding a Product

1. Go to `/admin/products`
2. Use the category filter dropdown to narrow results if needed
3. Browse the paginated list

### Editing a Product

1. Click the **Edit** (pencil) icon on the product row
2. The form modal opens with current values pre-filled
3. Modify any fields
4. Click **Save**

### Changing Price

1. Edit the product
2. Change the **Price (BDT)** field
3. Optionally set a **Discount Price**
4. Save

### Changing Description

1. Edit the product
2. Modify the **Description** textarea
3. Save

### Changing Category

1. Edit the product
2. Select a new category from the **Category** dropdown
3. Save

### Changing Stock

1. Edit the product
2. Update the **Stock** JSON field
3. Save

Example: To set 10 Medium and 5 Large: `{"M": 10, "L": 5}`

### Replacing Images

1. Edit the product
2. Click X on existing images to remove them
3. Click **Add Images** to upload new ones
4. Save

### Verifying Changes

1. After saving, check the product list
2. Visit the storefront to verify changes appear
3. If changes don't appear, try clearing browser cache or wait a moment for Vercel CDN cache to update

---

## 20. Removing Products

### Product Deletion

> ✅ **Supported from Admin Panel.**

1. Go to `/admin/products`
2. Click the **Delete** (trash) icon on the product row
3. A browser confirmation dialog appears: "Delete this product?"
4. Click **OK** to confirm
5. The product is permanently deleted

### Important Warnings

- ⚠️ **Deletion is permanent.** There is no undo.
- ⚠️ **No soft-delete.** The product is completely removed from the database.
- ⚠️ **Existing orders are NOT affected.** Orders that contain this product will still reference it by name and price.
- ⚠️ **Images remain on Cloudinary.** Deleting a product does NOT delete its images from Cloudinary. Images must be manually removed from Cloudinary if needed.

---

## 21. Troubleshooting

### Product Does Not Appear on Storefront

**Possible causes:**
1. Product `isActive` is `false` (check database)
2. Category filter is hiding it
3. Vercel CDN cache (wait a few minutes)
4. Browser cache (hard refresh: Ctrl+Shift+R)
5. API error (check browser DevTools Network tab)
6. MongoDB connection issue

**Steps:**
1. Check the product in Admin Panel — is it in the list?
2. Check browser DevTools → Network → look for `/api/products` response
3. Verify the product data in the response
4. Clear browser cache and reload

### Image Upload Fails

**Possible causes:**
1. Cloudinary environment variables missing or incorrect
2. File exceeds 5 MB limit
3. Unsupported file format
4. Network issue
5. Cloudinary service outage

**Steps:**
1. Verify `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` are set in Vercel
2. Check file size — must be under 5 MB
3. Check file format — must be JPEG, JPG, PNG, WebP, or GIF
4. Try uploading a different image
5. Check Cloudinary status page

### Admin Login Fails

**Possible causes:**
1. Wrong email or password
2. User is not an admin (`role !== 'admin'`)
3. JWT_SECRET is missing or wrong
4. Backend is not deployed/running
5. MongoDB connection issue

**Steps:**
1. Verify email and password
2. Check if the user has `role: 'admin'` in the database
3. Verify `JWT_SECRET` is set in Vercel
4. Check Vercel deployment status
5. Check `/api/health` endpoint

### Changes Do Not Appear on Website

**Possible causes:**
1. Vercel CDN cache
2. Browser cache
3. API error (changes didn't save)
4. MongoDB write failed

**Steps:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check Admin Panel — did the changes save?
3. Call the API directly to verify (e.g., `GET /api/products`)
4. Wait 2-3 minutes for CDN cache to invalidate
5. Try opening in incognito/private window

### Order Status Not Updating

**Possible causes:**
1. Admin not authenticated (token expired)
2. Backend error
3. Network issue

**Steps:**
1. Refresh the page and log in again
2. Check browser DevTools for API errors
3. Try the status update again

---

## 22. Production Safety

### Rules for Administrators

1. **Never edit the production database directly** unless absolutely necessary
2. **Never delete products without checking existing orders** — deletion is permanent
3. **Never expose credentials** — no screenshots, no shared links with tokens
4. **Never upload sensitive content as product images**
5. **Do not modify Vercel environment variables** without understanding the impact
6. **Verify product information** before publishing — check spelling, prices, stock
7. **Keep product images optimized** — large images slow down the storefront
8. **Do not modify code** for routine product management
9. **Test coupon codes** before announcing promotions
10. **Back up important data** before making bulk changes

### Before Making Changes

- [ ] Verify you are logged in as admin
- [ ] Check current state of the item you're changing
- [ ] Make changes in the Admin Panel
- [ ] Verify changes saved successfully
- [ ] Check the storefront to confirm changes appear
- [ ] If something goes wrong, note the exact error

---

## 23. Developer-Only Maintenance

### Operations Requiring Developer Access

| Category | Tasks |
|---|---|
| **Code Changes** | New features, bug fixes, UI/UX improvements |
| **Database** | Schema changes, data migrations, index creation |
| **API** | New endpoints, authentication changes, rate limit adjustments |
| **Deployment** | Vercel configuration, domain changes, SSL certificates |
| **Integrations** | Payment gateways, email services, analytics |
| **Security** | Dependency updates, vulnerability patches, access control |
| **Performance** | Caching, optimization, CDN configuration |
| **Content** | Homepage layout, navigation, footer, static pages |

### When to Contact a Developer

- The Admin Panel doesn't have a feature you need
- You encounter a bug in the Admin Panel
- You need to add a new product category
- You need to change the site's design
- You need to integrate a new payment method
- You need to modify shipping rules
- You need to change email templates
- You need to update the site's content pages

---

## 24. Backup & Recovery

### Current Backup Status

> ⚠️ **No automated backup mechanism was found in the current repository.**

### What Exists

| Component | Backup Status |
|---|---|
| **MongoDB** | Manual backup via MongoDB Atlas (if using Atlas) |
| **Cloudinary** | No automated backup |
| **Code** | Git repository (GitHub) |
| **Vercel** | Automatic deployment history (can rollback) |

### Manual Backup Procedures

**MongoDB (if using Atlas):**
1. Log in to MongoDB Atlas
2. Go to Database → Backups
3. Create a manual snapshot

**MongoDB (local):**
```bash
mongodump --db=fleetmart --out=./backup
```

**Vercel Rollback:**
1. Go to Vercel Dashboard → your project
2. Go to Deployments tab
3. Find a working deployment
4. Click "..." → "Promote to Production"

**Git Rollback:**
```bash
git revert HEAD
git push origin main
```

---

## 25. Daily/Weekly/Monthly Checklist

### Daily

- [ ] Check new orders in Admin Panel
- [ ] Update order statuses (processing → confirmed → shipped)
- [ ] Check low stock alerts on Dashboard
- [ ] Verify storefront is accessible
- [ ] Check for any customer issues

### Weekly

- [ ] Review all pending orders
- [ ] Update stock for popular items
- [ ] Check coupon usage
- [ ] Review new customer reviews
- [ ] Hide or delete inappropriate reviews
- [ ] Verify all product images are loading

### Monthly

- [ ] Review sales statistics on Dashboard
- [ ] Analyze low stock products
- [ ] Update product prices if needed
- [ ] Create new promotional coupons
- [ ] Review user accounts (block any suspicious activity)
- [ ] Check Cloudinary storage usage
- [ ] Verify MongoDB Atlas performance

### Before Adding Many Products

- [ ] Prepare all product images (correct format, under 5MB)
- [ ] Write product descriptions
- [ ] Determine pricing and categories
- [ ] Plan stock quantities per size
- [ ] Consider which products should be "Featured"

### Before Changing Production Configuration

- [ ] Understand what the change will affect
- [ ] Test in a non-production environment if possible
- [ ] Back up relevant data
- [ ] Plan a rollback strategy
- [ ] Communicate the change to your team

### After Deployment

- [ ] Verify the homepage loads
- [ ] Check product listing
- [ ] Test product detail pages
- [ ] Verify image loading
- [ ] Test admin login
- [ ] Try creating a test product
- [ ] Try editing a test product
- [ ] Check API health endpoint
- [ ] Verify MongoDB connection
- [ ] Test Cloudinary uploads

---

## 26. Deployment Verification

### Health Checks

After any deployment, verify:

| Check | How | Expected |
|---|---|---|
| **Homepage** | Visit `your-domain.vercel.app` | Page loads with products |
| **Product listing** | Click "Shop" or browse | Products appear with images |
| **Product details** | Click a product | Full details load with images |
| **Admin login** | Go to `/admin/login` | Login form appears |
| **Admin dashboard** | Login and visit `/admin` | Stats load correctly |
| **Product creation** | Create a test product | Product saves and appears |
| **Product editing** | Edit the test product | Changes save correctly |
| **Product deletion** | Delete the test product | Product is removed |
| **Image upload** | Upload an image | Image uploads to Cloudinary |
| **Order listing** | Go to `/admin/orders` | Orders appear (if any) |
| **API health** | Visit `/api/health` | Returns `{"status":"ok"}` |
| **MongoDB** | Check Dashboard stats | Numbers are correct |
| **Cloudinary** | Upload a test image | Image URL is returned |

---

## 27. Known Limitations

### Admin Panel Limitations

1. **No category management UI** — categories are hardcoded in the frontend
2. **No product search** —只能通过分类筛选
3. **Stock input is raw JSON** — no guided UI for size/quantity management
4. **No order deletion** — orders can only have status changed
5. **No user deletion** — users can only be blocked
6. **No bulk operations** — must edit items one at a time
7. **No CSV/PDF export** — no data export functionality
8. **No review pagination** — limited to 50 reviews
9. **No coupon pagination** — loads all coupons at once
10. **No loading states** on some pages (Users, Coupons, Reviews)

### Technical Limitations

1. **Admin Panel has no route-level protection** — backend enforces auth, but admin pages are accessible to anyone
2. **401 redirect goes to customer login** — admin users get redirected to wrong login page on token expiry
3. **Deleting a review doesn't recalculate product rating** — known bug
4. **Coupon `usedCount` is never incremented** — `maxUses` limit is checked but not enforced
5. **Stock decrement silently fails** — orders can be placed even with insufficient stock
6. **All reviews marked as verified purchases** — no actual purchase verification
7. **Google/Apple OAuth tokens not cryptographically verified** — security concern

### Missing Features (Future Improvements)

- [ ] Admin route protection (require admin role check on frontend)
- [ ] Product search in Admin Panel
- [ ] Guided stock management UI
- [ ] Category management in Admin Panel
- [ ] Order export to CSV/PDF
- [ ] Bulk product operations
- [ ] Review pagination
- [ ] Coupon pagination
- [ ] Low stock email notifications
- [ ] Order confirmation emails
- [ ] Invoice generation
- [ ] Shipping tracking integration
- [ ] Payment gateway integration (SSLCommerz/bKash)
- [ ] Homepage content management

---

## Appendix: API Reference

### Authentication

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login |
| POST | `/api/auth/register` | None | Register |
| POST | `/api/auth/logout` | None | Logout |
| GET | `/api/auth/me` | Protected | Get current user |
| PUT | `/api/auth/profile` | Protected | Update profile |
| PUT | `/api/auth/password` | Protected | Change password |

### Products

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/products` | None | List products |
| GET | `/api/products/:slug` | None | Get product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Orders

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/orders` | Protected | Create order |
| GET | `/api/orders/my` | Protected | My orders |
| GET | `/api/orders/:id` | Protected | Get order |
| GET | `/api/orders` | Admin | List all orders |
| PUT | `/api/orders/:id/status` | Admin | Update status |

### Coupons

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/coupons/validate` | None | Validate coupon |
| GET | `/api/coupons` | Admin | List coupons |
| POST | `/api/coupons` | Admin | Create coupon |
| PUT | `/api/coupons/:id` | Admin | Update coupon |
| DELETE | `/api/coupons/:id` | Admin | Delete coupon |

### Reviews

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/reviews/:productId` | None | Get reviews |
| POST | `/api/reviews` | Protected | Create review |
| DELETE | `/api/reviews/:id` | Admin | Delete review |
| PUT | `/api/reviews/:id/visibility` | Admin | Toggle visibility |

### Admin

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/admin/users` | Admin | List users |
| PUT | `/api/admin/users/:id` | Admin | Update user |
| GET | `/api/admin/reviews` | Admin | List reviews |

### Upload

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/upload` | Admin | Upload images to Cloudinary |

### Health

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | None | Health check |

---

*This guide was generated from the actual FleetMart repository code. Last updated: September 2026.*

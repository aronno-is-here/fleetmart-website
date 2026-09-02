# FleetMart — Production-Ready Task List

## Phase 1: Critical Security Fixes
- [x] 1.1 Delete `ADMIN_CREDENTIALS.md` from repo
- [x] 1.2 Add `helmet` middleware for security headers
- [x] 1.3 Add `express-rate-limit` on auth routes
- [x] 1.4 Replace hardcoded JWT secrets with strong env vars
- [x] 1.5 Make CORS configurable via env var
- [x] 1.6 Add `express-validator` on all route inputs
- [x] 1.7 Add `mongo-sanitize` to prevent NoSQL injection

## Phase 2: Bug Fixes
- [x] 2.1 Fix Checkout product ID — cart stores `id` but Checkout sends `productId || _id`
- [x] 2.2 Fix Order status display — `ORDER_STAGES` uses capitalized strings but `orderStatus` stores lowercase
- [x] 2.3 Fix coupon validation — Cart uses hardcoded coupons, should use API
- [x] 2.4 Fix `product.id` vs `product._id` — MongoDB returns `_id`

## Phase 3: Missing Production Features
- [x] 3.1 Add stock decrement on order creation
- [x] 3.2 Implement real email via Nodemailer (SMTP)
- [x] 3.3 Add password reset rate limiting
- [x] 3.4 Add global React error boundary
- [x] 3.5 Add proper 401 redirect on token expiry

## Phase 4: Server Hardening
- [x] 4.1 Add `unhandledRejection` + `uncaughtException` handlers
- [x] 4.2 Add API response compression
- [x] 4.3 Serve React build as static files in production

## Phase 5: Deployment Configuration
- [x] 5.1 Create root `package.json` with workspace scripts
- [x] 5.2 Create `Dockerfile` for server
- [x] 5.3 Create `docker-compose.yml`
- [x] 5.4 Create `.env.example` for both client and server
- [x] 5.5 Configure Vite build for production

## Phase 6: Cleanup
- [x] 6.1 Remove `console.log` from production code paths
- [x] 6.2 Remove Google/Apple dev-only fallback hacks
- [x] 6.3 Remove or fix hardcoded social media `#` links
- [x] 6.4 Update `.gitignore` to exclude `.env` files and credentials

## Phase 7: Light/Dark Mode Toggle
- [x] 7.1 Create ThemeContext with light/dark/persist
- [x] 7.2 Update Tailwind config with light theme colors
- [x] 7.3 Update CSS for theme switching
- [x] 7.4 Add toggle button in Navbar
- [x] 7.5 Update all components to work with both themes

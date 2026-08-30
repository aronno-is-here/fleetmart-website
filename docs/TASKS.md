# FLEETMART — Master Task List

> Live checklist. Marked ✅ = done, 🔄 = in progress, ⬜ = pending.
> Every completed chunk gets its own git commit (small, frequent commits).

---

## Phase 1 — Foundation & Docs ⬜
- [x] Review original SRS.md idea
- [x] Enhanced SRS with brand + design system (`SRS_ENHANCED.md`)
- [x] Work log tracker (`WORKLOG.md`)
- [x] This task list (`TASKS.md`)
- [x] README.md for repo
- [x] Git init + .gitignore + first commit
- [x] GitHub repo created + pushed

## Phase 2 — Client Scaffold & Design System ⬜
- [ ] Vite + React + Tailwind + Redux Toolkit + React Router + Framer Motion
- [ ] Tailwind theme tokens: colors (`night/pitch/volt/ember/gold`), fonts (Bebas Neue, Oswald, Inter), animations (marquee, shimmer, fade-up)
- [ ] Base UI components: Button, Badge, Chip, Skeleton, Rating stars, SectionHeading, Toast system
- [ ] Global layout shell: dark theme, container, selection color, scrollbar styling

## Phase 3 — Storefront Layout (mock data) ⬜
- [ ] Announcement ticker (marquee)
- [ ] Sticky Navbar + mega-menu + mobile drawer + search overlay
- [ ] Cart drawer (Redux, localStorage persist)
- [ ] Wishlist drawer/page (Redux, localStorage persist)
- [ ] Footer (newsletter, links, payment badges, socials)

## Phase 4 — Storefront Pages (mock data) ⬜
- [ ] Home: hero slider, category tiles, featured grid, deal strip w/ countdown, brand marquee, testimonials, stats count-up, newsletter
- [ ] Shop: filters (category, size, brand, price, team), sort, grid/list, pagination, quick view
- [ ] Product Details: gallery, variants (size/color), jersey customizer (name/number live SVG preview), stock urgency, add to cart, reviews, related products
- [ ] Cart page: qty edit, free-shipping progress, coupon, summary
- [ ] Checkout: multi-step (address → shipping → payment → review), COD + mock gateway
- [ ] Order confirmation + invoice view
- [ ] Auth pages: login / register (UI + validation)
- [ ] Account: profile, orders, order tracking timeline, addresses, wishlist
- [ ] Static pages: About, Contact, FAQ, Policies, 404
- [ ] Compare drawer (pin up to 3 products)

## Phase 5 — API Server ⬜
- [ ] Express scaffold: config, error handler, security (helmet, cors, rate-limit), validation (zod)
- [ ] Models: User, Product, Category, Order, Cart, Review, Coupon
- [ ] Auth: register/login/refresh/logout, role guard
- [ ] Products API: list (filter/sort/paginate), detail, search, admin CRUD
- [ ] Categories API
- [ ] Cart API (auth) + guest merge
- [ ] Orders API: create (COD), my-orders, status timeline, admin status update
- [ ] Reviews API + moderation
- [ ] Coupons API: validate/apply, admin CRUD
- [ ] Admin stats API (revenue, top products, low stock)
- [ ] Seed script (products, categories, demo users, coupons)

## Phase 6 — Wire Frontend to API ⬜
- [ ] RTK Query services (products, auth, orders…)
- [ ] Replace mock data page-by-page
- [ ] Auth flow end-to-end (JWT persist, route guards)
- [ ] Real cart sync (guest → user merge on login)
- [ ] Search autocomplete wired

## Phase 7 — Admin Panel (`/admin`) ⬜
- [ ] Admin layout + role guard
- [ ] Dashboard: revenue chart, category donut, recent orders, low-stock table
- [ ] Products table + create/edit form with image upload
- [ ] Orders management + status updates
- [ ] Users management
- [ ] Coupons management
- [ ] Review moderation

## Phase 8 — Polish & Ship ⬜
- [ ] Responsive QA (mobile sticky add-to-cart, drawer gestures)
- [ ] Accessibility pass (contrast, focus, aria)
- [ ] SEO meta + OpenGraph
- [ ] Performance pass (lazy routes, memo, image dims)
- [ ] Deployment (client → Vercel/Netlify, server → Render, DB → Atlas)
- [ ] Final README screenshots + docs

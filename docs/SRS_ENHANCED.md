# ⚽ FLEETMART — Enhanced SRS & Brand Book
### Football Jersey & Sports Equipment E-Commerce Platform (MERN)
> This document **extends `SRS.md`**. Original requirements are kept; this file locks in final decisions, adds new features, and defines the complete design system. Where the two differ, **this file wins**.

---

## 1. Brand Identity (Final Decisions)

| Item | Decision |
|---|---|
| **Brand Name** | **FLEETMART** (from project folder — replaces working titles SportsGear/KitZone/JerseyArena) |
| **Tagline** | *"Gear Up. Game On."* |
| **Personality** | Premium, electric, confident — Nike/JD Sports energy, boutique polish |
| **Logo** | Wordmark: `FLEET` in white + `MART` in volt, with a lightning-bolt cut through the "E" (CSS/SVG) |
| **Voice** | Short, punchy, stadium-loud. "KIT UP." / "NEW DROPS" / "MATCH DAY READY" |

---

## 2. Design System — "Dark Pitch" Aesthetic

### 2.1 Color Palette (Classy + Sporty)

**Core rule:** 90% dark/neutral canvas, 8% volt accents, 2% ember (sale/urgency only). Never flood the page with accent color — restraint = class.

| Token | Hex | Usage |
|---|---|---|
| `night` | `#0A0E13` | Page background (near-black, cool undertone) |
| `pitch` | `#111923` | Cards, surfaces, header |
| `pitch-2` | `#18222E` | Elevated surfaces, hovers |
| `chalk` | `#EDF1F5` | Primary text on dark |
| `muted` | `#8A98A6` | Secondary text |
| `line` | `#223040` | Borders, dividers |
| `volt` | `#C6F53F` | **Primary accent** — CTAs, active states, brand highlights |
| `volt-dark` | `#9FCC1F` | Hover state for volt |
| `ember` | `#FF5A1F` | Sale badges, urgency, error |
| `gold` | `#E8C36A` | Ratings, "premium" tier tags |
| `azure` | `#3FA9F5` | Info, links (used sparingly) |
| `snow` | `#F5F7F4` | Light sections (checkout, policies) |

### 2.2 Typography (Font Combination)

| Role | Font | Weight / Style | Notes |
|---|---|---|---|
| **Display / Hero** | **Bebas Neue** | 400, ALL CAPS, tight tracking | Jersey-number energy for hero headlines & section titles |
| **Sub-heads / Labels / Buttons** | **Oswald** | 500–600, uppercase, letterspaced | Eyebrow labels, nav links, buttons — the "kit typography" |
| **Body / UI** | **Inter** | 400–600 | Descriptions, forms, body copy — maximum readability |

Scale: `display 64–96px → h2 40px → h3 24px → body 16px → small 14px → micro 12px (tracking-widest uppercase)`.

### 2.3 Motion & Interactivity Rules
- **Speed:** all transitions 150–250ms, `ease-out`. Animations delight, never delay.
- **Signature moves:**
  - Marquee announcement ticker (infinite scroll) above navbar
  - Hero slider with autoplay + progress bar + parallax drift
  - Product cards: image swap (front/back) on hover + quick-add slide-up
  - Animated cart drawer (slide-in) + fly-to-cart micro-animation
  - Skeleton shimmer on all loading states
  - Count-up stat numbers on scroll-into-view
  - Section reveal: fade-up 16px stagger via Framer Motion
  - Jersey customizer: **live SVG preview** updating as you type name/number
- **Feedback:** toast notifications (top-right, dark glass), button press scale 0.97, sticky mobile add-to-cart bar.

### 2.4 Iconography
Lucide icons (stroke 2) + custom sport glyphs (ball, boot, glove, whistle) as inline SVGs. No generic shopping-cart clip-art look.

### 2.5 Imagery Strategy
No external photo dependencies. Product visuals = **generated SVG kit art** (jerseys, boots, balls, gloves) with per-product team colors — crisp, consistent, brand-owned. Dark studio-style gradients behind products.

---

## 3. Enhanced Feature Set (Additions to SRS §7)

Beyond the original SRS, these are added:

1. **Quick View modal** — shop grid without leaving the page.
2. **Compare kit drawer** — pin up to 3 jerseys, side-by-side spec compare.
3. **Live stock urgency** — "Only 3 left in L" with pulsing ember dot when stock < 5.
4. **Recently viewed rail** — localStorage-driven, on home & product pages.
5. **Free-shipping progress bar** in cart ("Add ৳500 more for FREE delivery").
6. **Coupon guess-proof UX** — applied coupon chips with one-tap remove.
7. **Order tracking timeline** — animated stepper (Processing → Confirmed → Shipped → Delivered).
8. **Mega-menu** with category imagery + featured club links.
9. **Command-style search** — instant suggestions with product thumbnails, debounced.
10. **Skeleton-first rendering** on every async surface.
11. **Turf/installation quote form** with file-upload UI (service lead → admin panel).
12. **Admin dashboard analytics** — revenue line chart, category donut, low-stock table.
13. **Accessibility pass** — WCAG AA contrast (volt on night = 12.8:1 ✓), focus rings, aria labels.

---

## 4. Final Tech Decisions (locking SRS §2)

| Concern | Decision | Why |
|---|---|---|
| Frontend | React 18 + **Vite** | Fast DX |
| Styling | **Tailwind CSS 3** + custom design tokens | Token-driven dark system |
| State | **Redux Toolkit** (cart, wishlist, ui) | SRS recommendation, DevTools |
| Routing | React Router 6 | Nested layouts, lazy routes |
| Animation | **Framer Motion** | Signature interactions |
| Icons | lucide-react | Consistent strokes |
| Backend | Express + Mongoose | As SRS |
| Auth | JWT access/refresh + bcrypt | As SRS |
| Payments | **COD first**, SSLCommerz/bKash behind an interface | Can't ship real gateway keys in dev; abstraction allows later plug-in |
| Images | Cloudinary-ready upload service (mock in dev) | As SRS |
| Charts | Recharts | Admin analytics |

### Repo Layout (monorepo)
```
fleetmart-website/
├── client/     # React storefront + admin dashboard (role-gated routes)
├── server/     # Express API
├── docs/       # SRS.md, SRS_ENHANCED.md, TASKS.md, WORKLOG.md
└── README.md
```
*(Single `client` app — admin lives under `/admin/*` routes with role guard, cheaper to host than a second app.)*

---

## 5. Build Order (see TASKS.md for the live checklist)

Phase 1 → docs & repo · Phase 2 → design system & shell · Phase 3 → storefront pages (mock data) · Phase 4 → API server · Phase 5 → wire real data + auth · Phase 6 → checkout & orders · Phase 7 → admin · Phase 8 → polish, seed, deploy.

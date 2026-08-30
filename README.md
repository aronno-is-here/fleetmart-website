# ⚽ FLEETMART — Gear Up. Game On.

A premium, high-energy football jersey & sports equipment e-commerce platform (MERN).

**Storefront** — dark "pitch" aesthetic, volt-green accents, Bebas Neue display type, animated product experiences (jersey customizer with live preview, quick-view, compare, fly-to-cart).

## Docs
| Doc | Purpose |
|---|---|
| [`docs/SRS.md`](docs/SRS.md) | Original requirements idea |
| [`docs/SRS_ENHANCED.md`](docs/SRS_ENHANCED.md) | Final spec: brand, design system, enhanced features |
| [`docs/TASKS.md`](docs/TASKS.md) | Master task checklist (live) |
| [`docs/WORKLOG.md`](docs/WORKLOG.md) | Timestamped request/work tracker |

## Stack
- **Client:** React 18 (Vite) · Tailwind CSS · Redux Toolkit · React Router · Framer Motion
- **Server:** Node.js · Express · MongoDB (Mongoose) · JWT auth
- **Payments:** COD + gateway abstraction (SSLCommerz/bKash ready)

## Structure
```
client/   React storefront + /admin dashboard
server/   Express REST API
docs/     Specs, tasks, worklog
```

## Getting Started
```bash
# client
cd client && npm install && npm run dev

# server
cd server && npm install && npm run dev
```

---
Status & progress: see `docs/TASKS.md`.

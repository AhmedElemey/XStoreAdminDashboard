# xStore Admin Dashboard

Angular admin console for the xStore marketplace — Angular 22, standalone
components, signals, and the CLI's default `@if`/`@for` control-flow syntax.
No NgModules.

## Run

```bash
npm install
npm start        # ng serve — http://localhost:4200
```

```bash
npm run build     # production build → dist/xstore-admin
```

## Structure

```
src/app/
  core/            services, API clients, mappers, models, guards — no templates
  shared/          reusable presentational components (kpi card, pager, avatar, icon, ...)
  layout/          app shell (sidebar/topbar/drawer/toast) + the login page
  features/        one folder per routed section (dashboard, moderation, vendors, ...)
```

- **Auth** — `core/auth.service.ts` holds the admin API session (base URL + JWT in
  `localStorage`, same keys as the legacy prototype) and a `fetch`-based `apiFetch()`
  wrapper. `core/auth.guard.ts` redirects to `/login` when signed out.
- **Two backends** — the marketplace admin API (`AdminApiService`) and the standalone
  delivery-backend pilot (`DeliveryApiService`) are separate sessions, exactly like the
  original: Couriers and Delivery Requests fall back to demo data until you connect the
  delivery API from the in-page connect bar.
- **Drawer / Toast** — `core/drawer.service.ts` and `core/toast.service.ts` are
  signal-based singletons rendered once in the app shell (`layout/shell.component.html`).
  Any feature can open a typed drawer component via `DrawerService.show(title, Component,
  inputs)` — the Angular-native replacement for the legacy prototype's
  `openDrawer(title, html, actions)` string-based drawer.
- **Live vs. demo data** — Dashboard, Product Moderation, Vendors (incl. the per-vendor
  Commission wallet), Orders, Categories, Users, Content & Banners, and the System
  Settings commission panel all call the real admin API (see below). Only Couriers and
  Delivery Requests fall back to demo data, until you connect the separate delivery API
  from the in-page connect bar — that's a different backend the marketplace admin API
  doesn't cover. The Settings page's marketplace-policy toggles and team roster stay
  local (`core/demo-data.service.ts`) — there's no backend endpoint for either.

## What's ported

All nine routes reachable from the sidebar nav in the original prototype: Dashboard,
Product Moderation, Vendors, Categories, Orders, Delivery (Couriers), Delivery Requests
(Packages), Users, Content & Banners, and Settings. The three phase-2 sections commented
out of the original nav (Analytics, Disputes, Coupons) were left out — they're
unreachable in the source app already.

Endpoint wiring was corrected and extended against the real "xStoreEcommerce Admin &
Super Admin" Postman collection (not just the legacy prototype's comments, which turned
out wrong on a couple of points — Vendors was hitting `/api/users?role=VENDOR` instead of
the dedicated `/api/admin/vendors`, and its status enum was off by one with an extra
"Suspended" value the real API doesn't have). That collection also documents several live
endpoints the original static prototype never wired up (having predated the contract) —
Dashboard's KPIs/revenue-trend/category-breakdown, Orders, the per-vendor Commission
wallet, and System Settings' commission/threshold config are all live here now instead of
hardcoded/local, per `AdminApiService` in `core/admin-api.service.ts`. The one thing from
that collection intentionally not wired up: assigning a courier to an order from the
Orders page — no endpoint for it exists in the collection (it was pure client-side demo
state in the original, tied to the separate delivery-backend's courier list, which has no
real relationship to marketplace orders).

## Legacy prototype

The original dependency-free static prototype (`index.html` / `app.js` / `styles.css`)
this app replaces is kept under `legacy/` for reference. It is not part of the Angular
build.

## Backend

Wired against the real "xStoreEcommerce Admin & Super Admin" Postman collection. Default
admin API base: `https://xstoreegy-001-site1.jtempurl.com` (override from the login
screen's "change API server" link). Every authenticated request sends the JWT as both
`Authorization: Bearer <token>` and `X-Auth-Token: <token>`, matching that collection.

A handful of response shapes aren't documented in the collection (only the enums and
request bodies are) — `core/mappers.ts` maps those tolerantly, same approach as the
original prototype, with a comment on each mapper noting exactly what's unconfirmed.
Worth a live smoke test against a real backend, in particular: the Dashboard overview
payload shape, the vendor commission wallet's GET response shape, and the admin orders
list/detail shape.

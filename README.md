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
- **Live vs. demo data** — Product Moderation, Vendors, Categories, Users and Content &
  Banners call the real admin API. Orders, and the Settings roster/toggles, are demo data
  (`core/demo-data.service.ts`), matching what the original static prototype shipped with.

## What's ported

All nine routes currently reachable from the sidebar nav in the original prototype:
Dashboard, Product Moderation, Vendors, Categories, Orders, Delivery (Couriers), Delivery
Requests (Packages), Users, Content & Banners, and Settings. The three phase-2 sections
commented out of the original nav (Analytics, Disputes, Coupons) were left out here too —
they're unreachable in the source app already. A separate vendor-detail sub-page
(listings/orders/commission wallet) existed in the original `app.js` but had no live entry
point either — that dead code was not ported.

## Legacy prototype

The original dependency-free static prototype (`index.html` / `app.js` / `styles.css`)
this app replaces is kept under `legacy/` for reference during the remaining port work.
It is not part of the Angular build.

## Backend

Wired against the endpoints documented in `BACKEND_HANDOFF.md`. Default admin API base:
`https://xstoreegy-001-site1.jtempurl.com` (override from the login screen's "change API
server" link, same as before).

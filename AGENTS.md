# Repository Guidelines

## Project Structure & Module Organization

This repository is an Angular 22 admin console for the xStore marketplace (standalone
components, signals, no NgModules). Source lives under `src/app/`:

- `core/` — services, API clients (`admin-api.service.ts`, `delivery-api.service.ts`),
  DTO mappers, models, `auth.guard.ts`. No templates here.
- `shared/` — reusable presentational standalone components (`kpi-card`, `pager`,
  `avatar`, `icon`, `state-block`, `chip-tabs`, `drawer-host`, `toast`,
  `delivery-connect-bar`).
- `layout/` — the app shell (`shell.component.*`: sidebar, topbar, drawer/toast hosts)
  and `login.component.*`.
- `features/<name>/` — one folder per routed section, each with its own drawer/form
  sub-components colocated alongside the view (e.g. `features/moderation/product-drawer.component.ts`).

Routes are declared in `src/app/app.routes.ts`, all lazy (`loadComponent`). Global
design tokens and shared component classes (`.card`, `.btn`, `.badge-s`, `.kv`, `.drawer`,
etc.) live in `src/styles.scss` — kept global (not per-component) since the same class
names are composed across many feature templates, mirroring the original CSS.

The pre-Angular static prototype (`index.html` / `app.js` / `styles.css`) is preserved
under `legacy/` for reference only; it is not part of the build and should not be edited.

## Build, Test, and Development Commands

```bash
npm install
npm start          # ng serve, http://localhost:4200, live reload
npm run build       # production build → dist/xstore-admin
npm test            # Vitest unit tests
```

## Coding Style & Naming Conventions

- Standalone components only; no NgModules. Prefer `input()`/`output()` signal-based APIs
  over `@Input()`/`@Output()` decorators, and `signal()`/`computed()` over manual RxJS
  subjects where the state is simple component/service state.
- Two-space indentation. Component selector prefix is `app-`.
- A feature's list/table component owns its data-loading and mutation methods; per-row
  detail/edit UI is a separate small component opened through `DrawerService.show(title,
  Component, inputs)` rather than growing one giant template. Pass callbacks as inputs
  (e.g. `onApprove = input<() => void>()`) for drawer components to call back into the
  opener.
- DTOs from the two backends are intentionally loosely typed (`Dto = Record<string,
  any>`) since several fields are unconfirmed — `core/mappers.ts` / `core/delivery-mappers.ts`
  centralize the tolerant field-aliasing (`firstNonEmpty(...)`, `numOr(...)`) instead of
  duplicating it per view.
- Two live sessions exist side by side: `AuthService` (marketplace admin API) and
  `DeliveryApiService` (delivery-backend pilot) each own their own `localStorage`
  base-URL/token pair — don't conflate them.

## Testing Guidelines

No component/unit test suite has been written yet (the legacy prototype had none either).
When adding significant new interaction logic, prefer a small Vitest spec next to the
file (`*.spec.ts`) over skipping tests entirely. Manually validate in a modern desktop
browser and at narrow viewport widths — check navigation, drawers, forms, and toasts
render with no console errors, and confirm a real backend call renders the loading /
empty / error `app-state-block` states, not just the happy path (the sandboxed dev
environment used to build this port has no outbound access to the real API, so this
matters).

## Commit & Pull Request Guidelines

Use short, imperative commit subjects, e.g. `Add vendor filter controls`. Keep commits
focused.

For pull requests, describe the user-visible change, list manual validation performed,
link any relevant issue, and include screenshots for visual changes. Do not add secrets
or production API credentials.

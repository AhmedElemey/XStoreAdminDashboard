# Repository Guidelines

## Project Structure & Module Organization

This repository is a dependency-free, front-end prototype for the xStore admin dashboard. All source files live at the repository root:

- `index.html` provides the application shell, navigation, drawers, and script/style references.
- `styles.css` contains all visual styles and design tokens; edit the `:root` CSS variables to change the theme.
- `app.js` holds sample marketplace data, view builders, and interaction handlers.
- `xstore_admin_dashboard.html` is a standalone dashboard variant. Keep it intentional if updating shared UI behavior.

There are currently no test, asset, package, or build directories.

## Build, Test, and Development Commands

No install or build step is required. Open `index.html` directly in a browser for local development. For a local HTTP server, run:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`. Manually check navigation, drawers, forms, responsive layouts, and toast messages after UI changes.

## Coding Style & Naming Conventions

Use two-space indentation in HTML and CSS. Keep CSS organized by component and reuse existing custom properties such as `--primary`, `--surface`, and `--line` instead of hard-coding repeated colours.

In `app.js`, use `const` for immutable values, camelCase for functions and variables (`openVendorProducts`), and uppercase names for static data collections (`VENDORS`, `ORDERS`). This app intentionally uses global functions because markup invokes handlers through inline `onclick`; preserve that compatibility when adding UI actions.

## Testing Guidelines

There is no automated test framework or coverage target. Validate changes in a modern desktop browser and at narrow viewport widths. Ensure that interactive actions update the expected view or display the appropriate simulated toast/drawer without console errors.

## Commit & Pull Request Guidelines

The history currently contains only the initial commit, so no established convention exists. Use short, imperative commit subjects, for example `Add vendor filter controls`. Keep commits focused.

For pull requests, describe the user-visible change, list manual validation performed, link any relevant issue, and include screenshots for visual changes. Do not add secrets or production API credentials; this prototype currently uses only local sample data.

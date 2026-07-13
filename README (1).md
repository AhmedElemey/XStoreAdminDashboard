# xStore Admin Dashboard — source

Deck-aligned design prototype (forest-green / cream / teal / amber).

## Files
- `index.html` — markup (sidebar, topbar, container)
- `styles.css` — all styles + design tokens (CSS variables in `:root`)
- `app.js` — all views, drawers, forms, and interactions (plain script; functions are global so inline `onclick` works)

## Run
Open `index.html` in any browser. No build step, no dependencies, works offline.
Keep the three files in the same folder (relative paths).

## Theme
Edit the `:root` variables at the top of `styles.css` to retheme
(`--primary` teal, `--accent` amber, `--sidebar` forest-green, `--bg` cream, etc.).

## Note
This is a front-end prototype — actions simulate outcomes (toasts/drawers).
Wire each action to the backend endpoints in ../../backend/02_BACKEND_API_DOCUMENTATION.md.

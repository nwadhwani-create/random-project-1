# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js application located in `airline-encyclopedia/`. All data is static (no database, no API, no Docker).

### Services

| Service | Command | Port |
|---|---|---|
| Next.js dev server | `npm run dev` | 3000 |

### Quick reference

- **Install deps:** `npm install` (from `airline-encyclopedia/`)
- **Lint:** `npm run lint` — uses ESLint 9 with `eslint-config-next`. Pre-existing lint errors exist (1 error, 3 warnings); these are in the repo, not regressions.
- **Build:** `npm run build` — static generation of ~20 pages via Turbopack.
- **Dev server:** `npm run dev` — starts on `localhost:3000`.

### Caveats

- The Leaflet route map loads tiles from `basemaps.cartocdn.com`. In restricted-network environments, the map background will be blank but the app still functions.
- Fonts are loaded from Google Fonts; they may fall back to system fonts if network is restricted.

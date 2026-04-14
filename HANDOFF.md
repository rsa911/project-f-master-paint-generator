# Handoff — Masterpaint Generator

## Session Info
- **Date/time:** Mon Apr 13 21:49 EDT 2026
- **Machine:** DragonKing
- **Project:** project-f-master-paint-generator
- **Local path:** `//UNAS/Claude/project-f-master-paint-generator`
- **Network path:** `\\UNAS\Claude\project-f-master-paint-generator`
- **NAS path:** `/volume2/Claude/project-f-master-paint-generator`

---

## What was being worked on

Tint (-T) and tone (-G) formula ratios are wrong. All tint/tone formulas in `src/data/paints.json` use `1:1` White/Grey ratios (e.g. `1Y:1W`, `1M:15Y:1W`) which produces muddy, too-pale colors. User confirmed: mixing 7.5ml Yellow + 7.5ml Grey does not match the color wheel.

**Decision pending:** Should tints/tones follow the same 9:1 convention as shades (`9[base]:1W`, `9[base]:1Grey`)? Or a different ratio? User was asked but session ended before answering.

The app itself is fully deployed and working at **http://192.168.1.219:3001**. This is purely a data correction issue.

---

## What was completed this session

Full rebuild from static React SPA → full-stack Express + SQLite app hosted in Docker on the NAS.

| File | What changed |
|------|-------------|
| `package.json` | Added express, better-sqlite3; new scripts (build, start, migrate) |
| `vite.config.js` | base changed to `/`; added /api proxy for dev |
| `server/index.js` | Express server, serves dist/ as static, SPA fallback |
| `server/db.js` | better-sqlite3 init, WAL mode, colors + pigments tables |
| `server/cmyToHex.js` | CMY→hex via masstone RGB weighted mix |
| `server/routes/colors.js` | Full CRUD: GET/POST/PUT/DELETE, returns hex per row |
| `server/routes/pigments.js` | GET all, PUT by code to update pricePerMl |
| `server/routes/planner.js` | POST with selections[] → ingredient totals + cost |
| `server/migrate/importPaints.js` | One-time migration: paints.json → SQLite (run, 96 colors imported) |
| `src/api.js` | Fetch wrapper for all API endpoints |
| `src/utils/formula.js` | Added expandShade(), calcCost() accepts dynamic prices |
| `src/utils/cmyToHex.js` | Client-side copy of CMY→hex for live preview |
| `src/components/ColorSwatch.jsx` | Now accepts `hex` prop directly |
| `src/components/PaintCard.jsx` | Uses `paint.formula`, `hex={paint.hex}`, dynamic prices |
| `src/components/PaintTable.jsx` | Add/Edit/Delete buttons, pigmentPrices prop |
| `src/components/RecipeModal.jsx` | Uses `paint.hex`, `paint.formula`, pigmentPrices prop |
| `src/components/ColorEditor.jsx` | NEW — modal for add/edit colors with live hex preview |
| `src/components/PigmentPriceEditor.jsx` | NEW — modal for editing pigment prices per ml |
| `src/components/ProductionPlanner.jsx` | NEW — shopping list: select colors → ingredient totals |
| `src/App.jsx` | Full rewrite: API fetch, tabs (Colors/Planner), all modals wired |
| `Dockerfile` | node:20-alpine, apk python3/make/g++, npm install, vite build |
| `docker-compose.yml` | Port 3001, volume mount /volume2/.../data, restart:always |
| `.dockerignore` | Excludes node_modules, data, dist, .git |
| `data/.gitkeep` | Ensures data/ dir exists in repo |

**Migration was run.** SQLite DB is live at `/volume2/Claude/project-f-master-paint-generator/data/masterpaint.db` (bind-mounted into container).

---

## What remains

1. **Decide and fix tint/tone ratios** — Ask user: should -T and -G use `9:1` (same as shades), or a different ratio like `3:1`? Once decided, update all 48 formulas in `src/data/paints.json`, then re-run migration:
   ```bash
   sudo docker exec masterpaint-generator node server/migrate/importPaints.js
   ```
   Note: migration uses `INSERT OR REPLACE` so re-running is safe.

2. **Rebuild container after any code changes** — SSH to NAS and run:
   ```bash
   cd /volume2/Claude/project-f-master-paint-generator
   sudo docker compose up -d --build
   ```

3. **Fix SSH key auth on NAS** — Currently broken after reboot (UGOS Pro resets home dir permissions). Fix:
   ```bash
   chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
   ```
   SSH key is at `~/.ssh/unas_key` on DragonKing.

4. **Update CLAUDE.md** — Add note that SSH key auth needs to be restored after each NAS reboot.

---

## What was tried and failed

- `npm ci` in Dockerfile — failed because `package-lock.json` was out of sync with package.json (express/better-sqlite3 added but lock file not updated). Fixed by switching to `npm install`.
- SSH from Claude Code to NAS — `/dev/tty` not available in non-interactive context, password auth fails. User must SSH manually from PowerShell.
- UNC paths with `node` or `npm` commands from bash — not supported. All code was written via Write tool directly to `\\UNAS\...` paths.

---

## Key files

| Path | Why it matters |
|------|---------------|
| `src/data/paints.json` | Source of truth for all 96 color formulas — needs tint/tone ratio fix |
| `server/migrate/importPaints.js` | Re-run after any paints.json change to update SQLite |
| `server/db.js` | DB schema and pigment seed data |
| `server/routes/planner.js` | Production planner logic — ingredient totals per color selection |
| `src/components/ProductionPlanner.jsx` | Planner UI |
| `src/utils/formula.js` | `expandShade()`, `scaleFormula()`, `calcCost()` |
| `docker-compose.yml` | Port 3001, data volume mount |

---

## Open questions

1. **Tint/tone modifier ratio** — Should `-T` and `-G` variants use `9:1` (base:White/Grey) to match the shade convention of `9:1` (base:Black)? Or different? Grey is more visually powerful than White, so they may warrant different ratios. User was mid-answer when session ended.

---

## Environment / services

- **Docker container:** `masterpaint-generator` running on NAS
- **App URL:** http://192.168.1.219:3001 (accessible from any device on the LAN)
- **Other container on NAS:** Something running on port 5000 (different project, no conflict)
- **DB location (on NAS):** `/volume2/Claude/project-f-master-paint-generator/data/masterpaint.db`
- **SSH to NAS:** `ssh rsa911@192.168.1.219` (password auth; key auth broken until permissions restored)
- **NAS web UI:** http://192.168.1.219:9999

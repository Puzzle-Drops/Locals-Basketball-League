# Locals Basketball League (LBL)

Static tracker for the Locals Basketball League - a 2v2 league between Jacob, Daniel, Joseph, and Nathan. Standings, teams, players, schedule, stats, and VOD links.

Source of truth for rules, data model, and conventions: [`docs/LBL-spec.md`](docs/LBL-spec.md). Project context for Claude Code: [`CLAUDE.md`](CLAUDE.md).

## Stack

- Vite + React (plain JS)
- Tailwind CSS
- React Router
- No backend - data is static JSON in `data/`

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173/`.

## Build for GitHub Pages

```bash
npm run build
npm run preview   # optional, smoke-test the production build
```

Production assets are emitted to `dist/` with the base path `/Locals-Basketball-League/`. Override either base with `VITE_BASE=/some/path/ npm run build`.

## Layout

```
data/        season1.json, teams.json - edit these to record results
assets/      league/players/teams logos (do not rename - paths are by name)
src/
  lib/       constants.js, stats.js (pure stat engine), data.js
  components/ Layout
  pages/     Home, Standings, Teams, Players, Schedule, GameDetail, Rules, Playoffs
docs/        LBL-spec.md
mockups/     (Phase 2 - populated later)
```

## Adding results

Open `data/season1.json` and edit a series' `games` array. Set the series `status` to `"completed"`, `"partial"`, or `"dnp"`. Stats recompute on page load - there's no build step for data.

A new season is a new file: `data/season2.json`. Import it in `src/lib/data.js` and append to `SEASONS`.

## Phase status

Phase 1 (current): scaffold, data layer, stat engine, minimal UI. Visual polish comes in Phase 3 once mockups land in `mockups/`.

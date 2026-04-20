# CLAUDE.md

Project context for Claude Code. Read this first, then read `docs/LBL-spec.md`.

---

## What this is

The **Locals Basketball League (LBL)** is a 2v2 basketball league between four players (Jacob, Daniel, Joseph, Nathan). This repo is a static website that tracks the league: standings, teams, players, schedule, stats, and VODs.

Full rules and data model are in `docs/LBL-spec.md`. That document is the source of truth — if anything here conflicts with it, the spec wins.

---

## Workflow: this is being built in phases

**Design polish comes from mockups produced in Claude Desktop.** Do NOT over-invest in visual design until those mockups land in `mockups/`.

**Phase 1 (DONE): Scaffold + data layer + stat engine**
- Vite + React + Tailwind + React Router scaffold (plain JS).
- `data/season1.json` seeded with Day 1 results; `data/teams.json` seeded with the six-duo NBA map.
- Pure stat engine in `src/lib/stats.js` — `computeSeason`, `computeCareer`, `standings` (h2h → point-diff tiebreakers), `decorateDuo`/`decoratePlayer`, `partnerBreakdown`.
- All pages wired to the engine: Home, Standings, Teams (+detail), Players (+detail), Schedule, GameDetail (with halved player lines + YouTube embed), Rules, Playoffs (TBD).
- Plain/minimal styling — intentionally unstyled pending mockups.

**Phase 2 (next, NOT Claude Code): Mockups**
- Claude Desktop produces styled HTML mockups in `mockups/`.

**Phase 3 (back to Claude Code): Implement the design**
- Rebuild the UI layer using the approved mockups as the visual reference. Stat engine and data layer should not need to change.

---

## Stack (chosen in Phase 1)

- **Vite + React (plain JS)** — fast dev, easy componentization, static build.
- **Tailwind CSS** — utility classes; Phase 3 swaps the look without restructuring the markup.
- **React Router** — client-side routing.
- **No backend, no database.** Data lives in JSON files in `data/` and is imported directly.
- **Deploy target:** GitHub Pages. `vite.config.js` defaults to base `/` in dev and `/Locals-Basketball-League/` for `vite build`. Override with `VITE_BASE`.

---

## Project structure

```
Locals-Basketball-League/
├── CLAUDE.md                 (this file)
├── README.md                 (project blurb + how to run)
├── docs/
│   └── LBL-spec.md           (full spec, source of truth)
├── assets/                   (DO NOT rename or move — Vite serves this as publicDir)
│   ├── league/LBL.png
│   ├── players/{Jacob,Daniel,Joseph,Nathan}.png
│   └── teams/{Celtics,Lakers,Warriors,Heat,Bucks,Suns}.png
├── data/
│   ├── season1.json          (Day 1 results seeded; edit to record more games)
│   └── teams.json            (six-duo NBA name map)
├── mockups/                  (empty until Phase 2)
├── src/
│   ├── lib/                  (constants.js, stats.js, data.js)
│   ├── components/           (Layout)
│   ├── pages/                (Home, Standings, Teams, TeamDetail, Players,
│   │                          PlayerDetail, Schedule, GameDetail, Rules, Playoffs)
│   ├── App.jsx, main.jsx, index.css
├── index.html, package.json, vite.config.js, tailwind.config.js, postcss.config.js
```

**Adding a new season:** drop `data/season2.json`, import it in `src/lib/data.js`, append to `SEASONS`.

---

## Critical conventions (do not violate)

These come from the spec. Getting them wrong silently breaks stats.

**Team keys use age-ordered player names, not alphabetical.**
Age order (oldest → youngest): Jacob, Daniel, Joseph, Nathan.
- Correct: `Jacob-Daniel`, `Jacob-Joseph`, `Jacob-Nathan`, `Daniel-Joseph`, `Daniel-Nathan`, `Joseph-Nathan`
- Wrong: `Daniel-Jacob`, `Joseph-Jacob`, etc.

There are exactly 6 duos. Hardcode this constant.

**Scoring model — player points are HALVED team points.**
- Team points are authoritative (what's recorded per game).
- Player points scored = team points / 2
- Player points allowed = opponent points / 2
- Player +/- = scored − allowed
- Display player points to 1 decimal place (21 → 10.5).
- Never record "who scored what" individually — it's not tracked and shouldn't be invented.

**Series status values:** `"completed"` | `"partial"` | `"dnp"`
- DNP series award no wins and no points. Don't count them in averages.
- Partial = some games played, series didn't finish. Count the played games; don't award a series winner unless the BO3 was mathematically decided.

**Tiebreakers for standings:**
1. Head-to-head series record
2. Point differential

**Player order everywhere (display):** Jacob, Daniel, Joseph, Nathan (age order, oldest first).

**Week labels are logical, not calendar.** A "Week 1" in data might span multiple real-world days. Don't compute anything from dates — dates are optional cosmetic metadata on games only.

---

## The stat engine

Lives in `src/lib/stats.js`. All pure — no I/O, no DOM. UI components consume the outputs.

Public functions:
- `computeSeason(seasonJson)` → `{ duoStats, h2h, playerStats, seriesIndex }`.
- `computeCareer(seasonJsonArray)` → `{ duoStats, playerStats, h2h, seriesIndex, perSeason }`.
- `standings(duoStats, h2h)` → decorated rows sorted by series wins, then h2h within tied groups, then point diff.
- `decorateDuo(key, raw)` / `decoratePlayer(name, raw)` — add derived rates (diff, avg margin, ppg, win%, +/-, etc.).
- `partnerBreakdown(player, duoStats)` → `{ entries, best, worst }` keyed by game win%.
- `fmt1(n)` → string with 1 decimal place (used for halved player points).

If you change a public signature, update every page that calls it.

---

## Assets

Already in place, do not modify:
- `assets/league/LBL.png` — league logo
- `assets/players/{Name}.png` — portrait per player (Jacob, Daniel, Joseph, Nathan)
- `assets/teams/{TeamName}.png` — logo per duo (Celtics, Lakers, Warriors, Heat, Bucks, Suns)

Reference them by relative path. Team-key → logo mapping comes from `teams.json`.

---

## Things to avoid

- Don't invent per-player scoring lines — halved team points is the only individual scoring stat.
- Don't alphabetize team keys.
- Don't auto-compute "days since last game" or anything else tied to calendar dates — dates don't drive logic.
- Don't add authentication, backend, or a database. Data is static JSON edited directly in the repo.
- Don't hardcode stats into components — everything flows from the stat engine.
- Don't polish the UI in Phase 1. That's Phase 3's job and it needs mockups first.

---

## When in doubt

Read `docs/LBL-spec.md`. Ask before making non-trivial decisions about season structure, stats definitions, or data model shape.

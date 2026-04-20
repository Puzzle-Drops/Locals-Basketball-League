# CLAUDE.md

Project context for Claude Code. Read this first, then read `docs/LBL-spec.md`.

---

## What this is

The **Locals Basketball League (LBL)** is a 2v2 basketball league between four players (Jacob, Daniel, Joseph, Nathan). This repo is a static website that tracks the league: standings, teams, players, schedule, stats, and VODs.

Full rules and data model are in `docs/LBL-spec.md`. That document is the source of truth. If anything here conflicts with it, the spec wins.

---

## Workflow: this is being built in phases

**Design polish comes from mockups produced in Claude Desktop.** Do NOT over-invest in visual design until those mockups land in `mockups/`.

**Phase 1 (DONE): Scaffold + data layer + stat engine**
- Vite + React + Tailwind + React Router scaffold (plain JS).
- `data/season1.json` seeded with Day 1 results; `data/teams.json` seeded with the six-duo NBA map.
- Pure stat engine in `src/lib/stats.js` with `computeSeason`, `computeCareer`, `standings` (h2h then point-diff tiebreakers), `decorateDuo`, `decoratePlayer`, `partnerBreakdown`.
- All pages wired to the engine: Home, Standings, Teams (+detail), Players (+detail), Schedule, GameDetail (with halved player lines + YouTube embed), Rules, Playoffs (TBD).
- Plain, minimal styling. Intentionally unstyled pending mockups.

**Phase 2 (in progress, NOT Claude Code): Mockups**
- Claude Desktop produces styled HTML mockups in `mockups/`.

**Phase 3 (back to Claude Code): Implement the design**
- Rebuild the UI layer using the approved mockups as the visual reference. Stat engine and data layer should not need to change.

---

## Stack (chosen in Phase 1)

- **Vite + React (plain JS)** for fast dev, easy componentization, static build.
- **Tailwind CSS** utility classes. Phase 3 swaps the look without restructuring the markup.
- **React Router** for client-side routing.
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
├── assets/                   (DO NOT rename or move. Vite serves this as publicDir.)
│   ├── league/LBL.png
│   ├── players/{Jacob,Daniel,Joseph,Nathan}.png
│   └── teams/{Celtics,Lakers,Warriors,Heat,Bucks,Suns}.png
├── data/
│   ├── season1.json          (Day 1 results seeded; edit to record more games)
│   └── teams.json            (six-duo NBA name map)
├── mockups/                  (Phase 2 output)
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
Age order (oldest to youngest): Jacob, Daniel, Joseph, Nathan.
- Correct: `Jacob-Daniel`, `Jacob-Joseph`, `Jacob-Nathan`, `Daniel-Joseph`, `Daniel-Nathan`, `Joseph-Nathan`
- Wrong: `Daniel-Jacob`, `Joseph-Jacob`, etc.

There are exactly 6 duos. Hardcode this constant.

**Scoring model: player points are HALVED team points.**
- Team points are authoritative (what's recorded per game).
- Player points scored = team points / 2
- Player points allowed = opponent points / 2
- Player +/- = scored minus allowed
- Display player points to 1 decimal place (21 becomes 10.5).
- Never record "who scored what" individually. It's not tracked and shouldn't be invented.

**Wins/Losses in standings are GAMES, not series.** A team that went 2-1 in a best-of-3 shows as 2W, 1L.

**Series status values:** `"completed"` | `"partial"` | `"dnp"`
- DNP series award no wins and no points. Don't count them in averages.
- Partial = some games played, series didn't finish. Count the played games; don't award a series winner unless the BO3 was mathematically decided.

**Tiebreakers for standings:**
1. Head-to-head series record
2. Point differential

**Player order everywhere (display):** Jacob, Daniel, Joseph, Nathan (age order, oldest first).

**Week labels are logical, not calendar.** A "Week 1" in data might span multiple real-world days. Don't compute anything from dates. Dates are optional cosmetic metadata on games only.

---

## Typography rules (strict)

**Only regular ASCII hyphens (`-`) are allowed for dashes and score separators.** Never use em dashes (`—` U+2014), en dashes (`–` U+2013), or minus signs (`−` U+2212). This applies to:

- Score separators: `21-0`, never `21—0`, `21–0`, or `21 · 0`.
- Negative numbers: `-1`, `-19`, never `−1`.
- Empty/no-data cells in tables: `-`, never `—`.
- Any dash in body copy or UI text: use a regular hyphen, or rewrite the sentence to avoid a dash entirely.

Middle dots (`·`) are fine as text separators in label lines like `Season 1 · 2026` or `4-2 · 9.1 PPG`. They are NOT dashes and are not banned. Just don't use them between score numbers.

Claude Code must also scrub any existing em dashes in source files on touch.

---

## The stat engine

Lives in `src/lib/stats.js`. All pure. No I/O, no DOM. UI components consume the outputs.

Public functions:
- `computeSeason(seasonJson)` returns `{ duoStats, h2h, playerStats, seriesIndex }`.
- `computeCareer(seasonJsonArray)` returns `{ duoStats, playerStats, h2h, seriesIndex, perSeason }`.
- `standings(duoStats, h2h)` returns decorated rows sorted by games won, then h2h within tied groups, then point diff.
- `decorateDuo(key, raw)` / `decoratePlayer(name, raw)` add derived rates (diff, avg margin, ppg, papg, win%, +/-).
- `partnerBreakdown(player, duoStats)` returns `{ entries, best, worst }` keyed by game win%.
- `fmt1(n)` returns a string with 1 decimal place (used for halved player points).

If you change a public signature, update every page that calls it.

---

## Assets

Already in place, do not modify:
- `assets/league/LBL.png` is the league logo.
- `assets/players/{Name}.png` is the portrait per player (Jacob, Daniel, Joseph, Nathan).
- `assets/teams/{TeamName}.png` is the logo per duo (Celtics, Lakers, Warriors, Heat, Bucks, Suns).

Reference them by relative path. Team-key to logo mapping comes from `teams.json`.

---

## Things to avoid

- Don't invent per-player scoring lines. Halved team points is the only individual scoring stat.
- Don't alphabetize team keys.
- Don't auto-compute "days since last game" or anything else tied to calendar dates. Dates don't drive logic.
- Don't add authentication, backend, or a database. Data is static JSON edited directly in the repo.
- Don't hardcode stats into components. Everything flows from the stat engine.
- Don't polish the UI in Phase 1. That's Phase 3's job and it needs mockups first.
- Don't use em dashes, en dashes, or minus signs. See "Typography rules" above.

---

## When in doubt

Read `docs/LBL-spec.md`. Ask before making non-trivial decisions about season structure, stats definitions, or data model shape.

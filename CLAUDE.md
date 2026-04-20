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

**Phase 2 (DONE, NOT Claude Code): Mockups**
- Eight styled HTML mockups in `mockups/`. They are the source of truth for visual design and contain inline `<!-- DEV NOTE -->` comments explaining intent. Read `docs/HANDOFF.md` for the design pass decisions.

**Phase 3 (in progress): Implement the design**
- Design system ported from mockups to `src/index.css` (CSS vars, Big Shoulders + Manrope fonts, `.scorecard` / `.pill` / `.seg` / `.logo` / `.avatar` / `.card` component classes, `.court-bg` / `.player-bg` / `.team-bg` backdrops).
- Reusable components in `src/components/`: `Layout` (sticky nav + hamburger mobile menu), `Scorecard` (played / DNP / upcoming variants), `Seg` toggle, `TeamLogo` and `PlayerAvatar` (real PNG with gradient fallback, multiple sizes), `Pill` (default / accent / dnp / team / success variants), `ScrollManager` (route-change hash-scroll + top-of-page reset).
- Pages built: Home, Teams (index), TeamDetail, Players (index), PlayerDetail, Schedule, Game Detail, Standings.
- Pages remaining: Rules (07), Playoffs (08).

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
│   ├── components/           (Layout, Scorecard, Seg, TeamLogo,
│   │                          PlayerAvatar, Pill, ScrollManager)
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

**A series is 3 games. ALL 3 are always played, even at 2-0.** This is NOT best-of-3. Every game counts toward PF, PA, +/-, and the games-won record. The series winner is whichever duo takes 2 or more of the 3 games. Vocabulary: call it a "series", never "match" or "best of 3". UI pills should say `3 GAMES`, not `BEST OF 3`.

**Series number labeling (display only).** The UI labels series as `Series 1`, `Series 2`, `Series 3` based on **play order within the week**, NOT on fixed pairing identity.
- `matchup_id` in the JSON is a fixed identifier for a specific pairing (1 = Jacob+Joseph vs Daniel+Nathan, 2 = Jacob+Daniel vs Joseph+Nathan, 3 = Jacob+Nathan vs Daniel+Joseph).
- The display label is `Series N`, where N is the series's index+1 within its week's `series` array.
- Example: In Week 2, the play order is `[matchup_id: 2, matchup_id: 3, matchup_id: 1]`. The card for Jacob+Daniel vs Joseph+Nathan (matchup_id 2) displays as "Series 1" because it's played first. Lakers vs Bucks (matchup_id 1) displays as "Series 3" because it's played last.
- Rule of thumb: compute `seriesNumber = seriesIndex + 1` from the week's `series` array. Never derive it from `matchup_id`.

**Standings W/L shows GAMES by default.** The Standings table must support a toggle between `Games` (game record, e.g. 2-1) and `Series` (series record, e.g. 1-0). Default view is `Games`. The RANKING is always by game wins regardless of the selected view; the toggle only swaps the displayed W/L (and the per-N stats: PPG/PPS, PAPG/PAPS, AVG/G/AVG/S).

**Series status values:** `"completed"` | `"partial"` | `"dnp"` | `"upcoming"`
- DNP series award no wins and no points. Don't count them in averages. Render with the amber DNP pill.
- Partial = some games played, series didn't finish. Count the played games; only award a series winner if one duo has already taken 2 of the 3 games.
- Upcoming = scheduled but not played yet. Same stat treatment as DNP (no wins/points), but the UI renders it as a neutral upcoming card (no DNP pill, `0-0` placeholder cells, current records shown in parens).

**Standings ranking:**
1. Game wins (primary)
2. Head-to-head series record (tiebreak)
3. Point differential (tiebreak)

The Games/Series toggle on the Standings table is display-only. Ranking is always by game wins regardless of the selected view.

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
- `standings(duoStats, h2h, { mode = "games" } = {})` returns decorated rows sorted by game wins, then h2h series record, then point diff. `mode` is surfaced on each row so the UI's Games/Series toggle has a single source of truth, but ranking does not change with mode.
- `decorateDuo(key, raw)` adds derived rates. Both per-game (`ppg`, `papg`, `avgMarginGame`) and per-series (`pps`, `paps`, `avgMarginSeries`) averages are exposed; the standings UI picks based on the active toggle. `avgPF` / `avgPA` / `avgMargin` are aliases of the per-game versions for legacy Phase 1 callers.
- `decoratePlayer(name, raw)` adds player rates (`plusMinus`, `seriesWinPct`, `gameWinPct`, `ppg`, `papg`, `pps`).
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
- Don't derive "Series N" labels from `matchup_id`. Use the series' index within its week.
- Don't auto-compute "days since last game" or anything else tied to calendar dates. Dates don't drive logic.
- Don't add authentication, backend, or a database. Data is static JSON edited directly in the repo.
- Don't hardcode stats into components. Everything flows from the stat engine.
- Don't polish the UI in Phase 1. That's Phase 3's job and it needs mockups first.
- Don't use em dashes, en dashes, or minus signs. See "Typography rules" above.

---

## When in doubt

Read `docs/LBL-spec.md`. Ask before making non-trivial decisions about season structure, stats definitions, or data model shape.

# CLAUDE.md

Project context for Claude Code. Read this first, then read `docs/LBL-spec.md`.

---

## What this is

The **Locals Basketball League (LBL)** is a 2v2 basketball league between four players (Jacob, Daniel, Joseph, Nathan). This repo is a static website that tracks the league: standings, teams, players, schedule, stats, and VODs.

Full rules and data model are in `docs/LBL-spec.md`. That document is the source of truth — if anything here conflicts with it, the spec wins.

---

## Workflow: this is being built in phases

**You (Claude Code) are being asked to build the backend / data layer first.** Design polish comes later from mockups produced in Claude Desktop. Do NOT over-invest in visual design right now — use plain, functional styling. The design will be handed to you as HTML/CSS mockups in the `mockups/` folder in a later phase.

**Phase 1 (current): Scaffold + data layer + stat engine**
- Repo scaffold, build tooling, routing
- Load `data/season1.json` and `data/teams.json`
- Pure stat engine: functions that take the season JSON and return computed standings, team stats, player stats
- Plain/minimal UI showing that the data and stats work end-to-end
- Seed `data/season1.json` with the Day 1 data shown in the spec
- Seed `data/teams.json` with the six team names from the spec

**Phase 2 (next, not you): Mockups**
- Claude Desktop produces styled HTML mockups in `mockups/`

**Phase 3 (back to you): Implement the design**
- Rebuild the UI layer using the approved mockups as the visual reference

Keep Phase 1 code clean and componentized so Phase 3 is a styling pass, not a rewrite.

---

## Recommended stack

Flexible, but this is a good default:
- **Vite + React** — fast dev, easy componentization, static build
- **Tailwind CSS** — matches the mockup-driven design workflow cleanly in Phase 3
- **Plain JS** is fine. **TypeScript** is nice-to-have given the stat shapes, but optional — defer to user preference if asked.
- **No backend, no database.** Data lives in JSON files in `data/`.
- **Deploy target:** GitHub Pages (configure `vite.config` `base` accordingly).

If the user prefers a different stack, go with theirs.

---

## Project structure (target)

```
Locals-Basketball-League/
├── CLAUDE.md                 (this file)
├── README.md                 (create in Phase 1 — brief project blurb + how to run)
├── docs/
│   └── LBL-spec.md           (full spec, source of truth)
├── assets/                   (DO NOT rename or move — file paths are referenced by name)
│   ├── league/LBL.png
│   ├── players/{Jacob,Daniel,Joseph,Nathan}.png
│   └── teams/{Celtics,Lakers,Warriors,Heat,Bucks,Suns}.png
├── data/
│   ├── season1.json          (create in Phase 1, seed with Day 1 data from spec)
│   └── teams.json            (create in Phase 1, seed with spec's team map)
├── mockups/                  (currently empty, populated in Phase 2)
├── src/                      (app source)
└── [build tooling — package.json, vite config, etc.]
```

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

This is the most important code in Phase 1. Keep it in pure functions, ideally one module (e.g. `src/lib/stats.js`). It should:

Take inputs:
- A season JSON (or array of season JSONs for career stats)
- The teams map

Return computed outputs:
- Duo standings (sorted with tiebreakers applied)
- Per-duo season stats (W-L series, W-L games, PF, PA, diff, avg margin, win%)
- Per-duo career stats (same, aggregated across seasons)
- Per-player season stats (aggregated across their 3 duos)
- Per-player career stats
- Head-to-head records between any two duos
- Best/worst partner per player (by win%)

All pure. No I/O. No DOM. Easy to unit test. UI components consume the outputs.

---

## Assets

Already in place, do not modify:
- `assets/league/LBL.png` — league logo
- `assets/players/{Name}.png` — portrait per player (Jacob, Daniel, Joseph, Nathan)
- `assets/teams/{TeamName}.png` — logo per duo (Celtics, Lakers, Warriors, Heat, Bucks, Suns)

Reference them by relative path. Team-key → logo mapping comes from `teams.json`.

---

## Seed data for `data/season1.json` (Week 1)

From the spec, day 1 results to populate:

**Series 1 (M1):** Jacob-Joseph vs Daniel-Nathan → Jacob-Joseph wins 2-1
- Game 1: 21-0, Game 2: 17-21, Game 3: 21-19

**Series 2 (M2):** Jacob-Daniel vs Joseph-Nathan → Joseph-Nathan wins 2-1
- Game 1: 17-23, Game 2: 22-5, Game 3: 10-22

**Series 3 (M3):** Jacob-Nathan vs Daniel-Joseph → status `"dnp"`, games `[]`

VOD URL placeholder for all played games: `"https://google.com"` (will be swapped for real YouTube links later).

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

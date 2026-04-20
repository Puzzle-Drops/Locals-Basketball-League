# LBL — Phase 3 Handoff (Design → Build)

This doc is the source of truth for rebuilding the UI from the approved mockups.
Read CLAUDE.md first for project context; read this doc for everything design-related
and all decisions made during the design pass that aren't yet reflected in code.

**TL;DR:** 8 HTML mockups in `mockups/` are the visual spec. Rebuild each page in
`src/pages/` to match. Stat logic is already wired in `src/lib/`. Don't change
ranking/playoff logic without reading the non-negotiable decisions section.

---

## Phase 3 Status

Built so far:
- Design system in `src/index.css` (CSS vars, Big Shoulders + Manrope, all `.scorecard` / `.pill` / `.seg` / `.logo` / `.avatar` / `.card` classes, `.court-bg` / `.player-bg` / `.team-bg` / `.game-bg` backdrops, `.week-divider`, `.pill.success`, `.game-cell` strip, `.crumb` breadcrumb, `.video-placeholder`, `.box-row`).
- Reusable components in `src/components/`: `Layout` (sticky nav with Playoffs link + hamburger mobile menu), `Scorecard` (handles played, DNP, and upcoming variants with optional `records` prop), `Seg` toggle, `TeamLogo` and `PlayerAvatar` (real PNGs from `assets/` with gradient-and-initial fallback, multiple sizes), `Pill`, `ScrollManager` (smooth-scrolls to hash on cross-page nav, jumps to top otherwise).
- Pages: **Home (01)**, **Teams (index)**, **TeamDetail (02)**, **Players (index)**, **PlayerDetail (03)**, **Schedule (04)**, **Game Detail (05)**, **Standings (06)**, **Rules (07)**, **Playoffs (08)**.

All eight mockups built. Phase 3 complete.

Data model note: series `status` now includes `"upcoming"` alongside `completed` / `partial` / `dnp`. Upcoming gets the same stat treatment as DNP (no wins, no points) but is rendered neutrally instead of with the amber DNP pill. `data/season1.json` Week 1 Series 3 was switched from `dnp` to `upcoming` since the league plans to play it.

---

## Non-Negotiable Decisions

These were debated and resolved during the design pass. Do not change them
without asking. They affect data model, stat engine, and visual content.

### Ranking & playoff logic (two-stage)

**Standings ranking + playoff seeding** use **game wins** as the primary key:

```
Primary   : game wins (descending)
Tiebreak 1: head-to-head match record
Tiebreak 2: point differential (+/-)
Tiebreak 3: COINFLIP (see below)
Top 4     : advance to the playoffs
```

**Playoff matchup resolution** uses **point differential (+/-)** — a different
metric from seeding. Once in the bracket, the team with the higher +/-
advances. This is intentional: cross-pairing matchups (e.g. #1 vs #4) may
feature teams that never played each other in the regular season, so head-to-head
W/L doesn't exist. +/- always does. If both teams have identical +/-, the
matchup also resolves by **COINFLIP**.

**Phrase it this way to users:** "Game wins get you in, +/- wins you games inside."

**No double counting.** Playoff outcomes are computed views of regular-season
data — they must not add to any stat totals.

### Coinflip (final tiebreaker)

When teams are truly identical on every quantitative criterion — e.g. two
DNP teams at 0-0-0 with no head-to-head, or two bracket teams with identical
+/- — **a coinflip decides.** This happens in real life and the result is
recorded in data.

**UI behavior:**

- The label/pill that would normally show a score comparison or winner indicator
  should instead read **`COINFLIP`** in accent color when a coinflip resolved
  the outcome.
- Example in a playoff bracket advance note:
  - Normal: `LAKERS advances (+19 vs -19)`
  - Coinflip: `LAKERS advances (COINFLIP)`
- In the Playoff Race table status column, a seed-decided-by-coinflip row
  could show a `COINFLIP` pill instead of a plain seed number indicator
  (design TBD — use accent color, not green/amber).

**Data model suggestion:** add an optional `tiebreaker: "coinflip"` field on
the relevant record (match result, standings entry, or playoff matchup).
When present, UI swaps to the `COINFLIP` label. When absent, UI shows the
normal score/metric.

**Temporary fallback while no coinflip result is recorded:** sort by team-list
order (the order in `data/teams.json`: Celtics, Lakers, Warriors, Heat, Bucks,
Suns) so the UI is deterministic. Flag visibly that a coinflip is needed
(e.g. `COINFLIP TBD` pill in amber) so the league knows they owe a real flip.

### 3-game series structure

Every series is 3 games. **All 3 games are always played**, even after a team
wins the first two. The series winner is whoever takes 2 or more of 3, but
every game counts toward PF, PA, +/-, and the game-wins record. This is NOT
best-of-3 in the traditional sense.

### Scoring model

- Team points are authoritative.
- Player points = team points / 2.
- Player +/- = scored - allowed (from their team's perspective).
- Display player stats to 1 decimal place.
- Never invent per-player scoring — it doesn't exist.

### Team identity

- Age-ordered keys: `Jacob-Daniel`, `Jacob-Joseph`, `Jacob-Nathan`, `Daniel-Joseph`, `Daniel-Nathan`, `Joseph-Nathan`. **Never alphabetical.**
- Team names are permanent: Celtics, Lakers, Warriors, Heat, Bucks, Suns.
- Only 3 pairings are valid (A: Lakers-Bucks, B: Celtics-Suns, C: Warriors-Heat). Teams sharing a player can't play each other.

---

## The 8 Mockups

All live in `mockups/`. Each is a complete, self-contained HTML file with
Tailwind via CDN. Inline `<!-- DEV NOTE: ... -->` comments explain intent and
flag Phase 3 wiring points — **read those comments, they're not decoration.**

| # | File | Route | Notes |
|---|---|---|---|
| 01 | `01-home.html` | `/` | Hero + progress, latest results (scorecards), standings preview with Games/Matches toggle, Week 1 Leaders, Next Week preview |
| 02 | `02-team-detail.html` | `/teams/:id` | Example is Lakers. Team-colored hero, Scope selector, Primary stats, Roster with On Team/Overall toggle, Game Log, Head-to-Head table, Up Next scorecard |
| 03 | `03-player-detail.html` | `/players/:id` | Example is Joseph. Orange hero backdrop, Season MVP/#1 pills, avatar, stats strip, "MY TEAMS" (3 partnership cards), Game Log, Up Next |
| 04 | `04-schedule.html` | `/schedule` | Jump-to pills per week, three week sections each with 3 scorecards |
| 05 | `05-game-detail.html` | `/games/:id` | Example is W1 M1 G3. Breadcrumb, mirror-symmetric hero, VOD placeholder, Box Score, Series Games strip |
| 06 | `06-standings.html` | `/standings` | 11-column sortable table, frozen (# + Team) columns, Scope + View toggles |
| 07 | `07-rules.html` | `/rules` | 6 numbered sections. Sections 05 and 06 spell out the two-stage playoff logic — match that prose exactly. **Consider adding a one-line coinflip mention** (see Coinflip decision above) |
| 08 | `08-playoffs.html` | `/playoffs` | **New page, not scaffolded in Phase 1.** Hero with live-projection pill, Playoff Race table, Bracket, How Playoffs Work card. **Coinflip label is new** — doesn't appear in Week 1 data but the component logic needs to support it |

### Design system (from mockups)

- **CSS vars:** `--bg: #0a0b0d`, `--surface: #15171c`, `--surface-hover: #1a1d23`, `--accent: #ff6b2b`, borders at 7% white
- **Fonts:** Big Shoulders Display (900) for numbers and headlines, Manrope for body
- **Colors:** green `#22c55e` for positive, red `#ef4444` for negative, amber `#fbbf24` for DNP, orange `--accent` for coinflip
- **Tabular nums** on all numeric columns (`font-variant-numeric: tabular-nums`)

### Reusable components to extract

These patterns appear on multiple pages. Build each once and reuse:

- **Scorecard** (home, schedule, team-detail, game-detail) — header pills, two team rows with big scores, "N WINS" labels, 3-cell game strip, click-to-expand Details
- **Seg control** (toggle) — used for Games/Matches, Season/Career, On Team/Overall. Pill-styled, single active state in accent color
- **Sortable table header** — arrow pseudo-element only appears when sorted; cycle asc → desc → default
- **Frozen-column table row** — sticky-left # + Team on mobile horizontal scroll (see Standings mockup JS for behavior)
- **Circular team logo placeholder** — gradient + initial letter; will be swapped with real NBA logos later
- **Live projection dot** — CSS keyframe box-shadow pulse (`@keyframes live-pulse` in playoffs mockup)
- **Status pills** — IN (green), GB (amber), DNP (amber), COINFLIP (accent orange)

---

## Data & Stat Engine

- `data/season1.json` — Week 1 is seeded. Weeks 2 and 3 are placeholders to fill in later.
- `data/teams.json` — the 6 permanent teams and their player pairs.
- `src/lib/stats.js` — all stat derivations. **Use this; don't reinvent.**
- `src/lib/data.js` — data loader.
- `src/lib/constants.js` — team colors, player metadata, etc.

### Season 1 Week 1 computed standings (for visual verification)

After Week 1 only:

| # | Team | Games | Matches | +/- | Status |
|---|---|---|---|---|---|
| 1 | Lakers | 2-1 | 1-0 | +19 | IN |
| 2 | Suns | 2-1 | 1-0 | +1 | IN |
| 3 | Celtics | 1-2 | 0-1 | -1 | IN |
| 4 | Bucks | 1-2 | 0-1 | -19 | IN |
| 5 | Warriors | 0-0 (DNP) | 0-0 | 0 | 1 GB |
| 6 | Heat | 0-0 (DNP) | 0-0 | 0 | 1 GB |

**Note:** Warriors (#5) and Heat (#6) are identical on all three sorted criteria
(0 game wins, 0-0 H2H, 0 +/-), so they're technically tied. In the real league
this would require a coinflip to decide seeding — but since both are OUT of
the playoff bracket, it doesn't matter for Week 1 display. The current mockup
orders them by team-list order (Warriors before Heat). Phase 3 should handle
this per the Coinflip decision above.

**Projected bracket:**
- Left: Lakers (+19) vs Bucks (-19) → Lakers advances
- Right: Suns (+1) vs Celtics (-1) → Suns advances
- Championship: Lakers (+19) vs Suns (+1) → Lakers projected champion

**Player +/-:** Joseph +10.0 (MVP), Jacob +9.0, Nathan -9.0, Daniel -10.0.

If the stat engine produces different numbers, the engine is wrong — the
mockups match the math.

---

## Ripple Effects Not Yet in Code

Phase 1 was scaffolded before some design decisions. These need to be applied
during Phase 3:

### 1. Nav: add "Playoffs" link everywhere -- DONE

Layout has the Playoffs link between Schedule and Rules. Active state styling
matches the other links. Mobile hamburger menu mirrors the same order.

### 2. "BEST OF 3" -> "3 GAMES" -- DONE

Mockup pass scrubbed every "BEST OF 3" pill to "3 GAMES". Scorecard component
hardcodes "3 GAMES" in the header.

### 3. Game Detail "clincher" label -- DONE

`clincherInfo()` in `src/pages/GameDetail.jsx` implements the rule:
- G1 / G2: no label (just margin + date in the context strip).
- G3 with series 1-1 going in: `Series clincher · {Winner} won 2-1`.
- G3 with series 2-0 going in: `Dead game · {Winner} clinched 2-0`.

### 4. Playoffs page is new -- DONE

`src/pages/Playoffs.jsx` renders all four sections from the mockup:
1. Hero with pulsing Live Projection pill (`live-pulse` keyframe). Flips to a static `Final` pill when `seasonComplete` is true.
2. Playoff Race table with all 6 teams, PLAYOFF LINE divider between #4 and #5, IN green pill for top 4, orange `-N` games-behind value for the bottom 2 (replaces the original GB pill per user feedback).
3. Bracket: 3-column grid on desktop (championship in middle), stacks vertically on mobile. Semifinal team-cards highlight winner with accent ring; advances note shows the +/- comparison.
4. How Playoffs Work reference card with 6 numbered steps.

### 5. Standings page row order -- DONE

`sortDuosWithTiebreakers` in `src/lib/stats.js` ranks by game wins, then h2h
series, then point diff. The Standings page (`src/pages/Standings.jsx`)
renders in that order by default and includes a sortable header layer that
lets the user re-sort by any column without changing the canonical ranking.

### 6. Rules page prose -- DONE

`src/pages/Rules.jsx` renders all six sections with the mockup's prose
intact. Section 05 includes a 4th-item coinflip fallback in the Ranking
Logic list and a coinflip note in the prose. Section 06 includes the
"Game wins get you in, +/- wins you games inside" tagline and a coinflip
mention for tied bracket matchups. The first-possession rule was added
to section 01 (lower-seeded team starts G1, prior-game loser starts
G2/G3) and mirrored into `docs/LBL-spec.md`.

### 7. Coinflip support -- DONE

`src/lib/coinflip.js` provides `seededWinner`, `overrideWinner`, and a
combined `resolveCoinflip` helper. The Playoffs page uses it via
`resolveMatchup` for both semifinals and the championship, with a per-round
salt so the three coinflip moments don't share an outcome.

- **Bracket advances notes** swap `(+X vs -X)` to `(COINFLIP)` when +/- ties.
- **Championship projection** appends `· COINFLIP` to the duo line.
- **Status pill** has a `.coinflip` accent variant ready for the Playoff
  Race seeding case (not yet wired to the standings tiebreaker chain --
  the stat engine's `sortDuosWithTiebreakers` doesn't currently surface
  ties as coinflip resolutions; see Open Question #4 below).
- **Override format**: `season.coinflips["DuoA__DuoB"] = "DuoA"` (sorted
  duo keys joined by `__`, value is the winner). Documented in CLAUDE.md.

---

## Phase 3 Open Questions

Resolve these and update this doc when you land on answers.

### GB calculation

Playoff Race section uses **simple win gap**:

```
GB = fourthSeed.gameWins - team.gameWins
```

**Not** the traditional baseball formula `((winsA - winsB + lossesB - lossesA) / 2)`.
The traditional formula produces negative GB values when teams have played
unequal numbers of games (e.g. a 0-0 DNP team vs a 1-2 team computes to -0.5 GB,
which reads as "ahead" despite zero wins). Simple win gap matches our ranking
logic and is legible.

### Playoff bracket state transitions

The Playoffs hero has a Live Projection pill. When the season ends, the page
should adapt:

- Pill: `Live Projection` (pulsing) → `Final` (static)
- Heading copy: "Projected Champion" → "Champion"
- "LAKERS advances" remains accurate but no longer "projected"

Recommended: thread a simple `seasonComplete` boolean through the page.

### Standings "playoff line" visual

Mockup currently does NOT draw a playoff-line divider in the full standings
table (Page 06). We considered adding one but decided it was misleading when
the user sorts by a non-rank column. Leave as-is unless you think of a better
approach.

---

## Typography Rules (Strict)

The user has a strong aesthetic preference and will flag these every time:

- **Only regular ASCII hyphens `-`.** Never em dashes `—`, en dashes `–`, or
  minus-sign glyphs `−`. This includes prose, stat values, everything.
- Middle dots `·` are fine as label separators (e.g. `Jacob · Joseph`).
- No personality pills, no redundant narrative, no VS-style layouts when a
  scorecard works. Keep copy tight.

---

## Assets

Currently in `assets/`:

- `league/LBL.png` (current logo, plus v1-4 alternates in `alt/`)
- `players/{Jacob,Daniel,Joseph,Nathan}.png` — real player photos
- `teams/{Bucks,Celtics,Heat,Lakers,Suns,Warriors}.png` — real NBA team logos

The mockups use **placeholder circles** with color gradients and letter
initials for both team logos and player avatars. **Phase 3: swap these
placeholders with the real images.** For teams, use the NBA logo PNGs. For
players, use the photo PNGs.

---

## How to Work

1. Read this doc.
2. Read CLAUDE.md for project context.
3. Open each mockup in order and match it in the corresponding `src/pages/` file.
4. Extract reusable components as you go (Scorecard first — it appears on 4 pages).
5. Stat logic lives in `src/lib/stats.js` — use it; don't inline calculations.
6. Every mockup has inline `<!-- DEV NOTE -->` comments explaining design intent and Phase 3 wiring. Read them.
7. After each page is rebuilt, pause and let the user eyeball it before moving to the next.
8. When you hit an open question (see above), surface it rather than guessing.

**Keep things honest.** If the stat engine disagrees with mockup values,
investigate — don't paper over it. If the mockup does something weird, there's
usually a dev-note comment explaining why. If there isn't, ask.

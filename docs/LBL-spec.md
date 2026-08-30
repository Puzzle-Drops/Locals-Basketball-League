# Locals Basketball League (LBL) - Spec

The official tracker for the Locals Basketball League.

## Players

The roster is four players, but it can change between seasons. Each season's JSON
carries its own `roster`, and team keys are ordered by age across everyone who has
ever played: **Joe, Jacob, Daniel, Joey, Nathan** (oldest to youngest).

| Season | Roster (age order) |
|--------|--------------------|
| 1      | Jacob, Daniel, Joey, Nathan |
| 2      | Joe, Jacob, Joey, Nathan |

Season 2 replaced Daniel with **Joe Monnin**. The player recorded through Season 1 as
"Joseph" is **Joey Monnin**, renamed everywhere so the two aren't confused.

---

## League Rules

**Game format:**
- 2v2 basketball
- Make it take it
- 2-pointers and 3-pointers
- First to 21, straight up (no win by 2)
- Each matchup is a 3-game series. All 3 games are always played, even at 2-0. The series winner is whichever duo takes 2 or more games.
- **First possession:** on Game 1 of a series, the team currently lower in the standings starts with the ball. On Games 2 and 3, the team that lost the previous game starts with the ball.

**Season format:**
- A season is 3 weeks
- Each week has 3 series (one for each unique matchup)
- Matchup order rotates each week so no pairing is always rested or always tired
- "Week" is a logical label, not calendar time. A single "week" may span multiple real-world play sessions.

**Standings ranking:**
1. Game wins (primary)
2. Head-to-head series record (tiebreak)
3. Point differential (tiebreak)

Top 4 teams advance to the playoffs. The Games/Series toggle on the Standings page is display-only; ranking is always by game wins.

**DNP:** any series or game that doesn't get played is logged but awards no points and no wins.

---

## Weekly Rotation

Three unique pairings (each plays one 3-game series per week). A `matchup_id` is a
fixed pairing of roster **slots**, not of names, so the same three matchups survive a
roster change. `season.roster` is stored in slot order -
`[Jacob, <Daniel's slot>, <Joseph's slot>, Nathan]` - which is why Season 2 lists Joe
second even though he is the oldest player.

- **Pairing A** (`matchup_id: 1`): slot0 + slot2 vs slot1 + slot3
- **Pairing B** (`matchup_id: 2`): slot0 + slot1 vs slot2 + slot3
- **Pairing C** (`matchup_id: 3`): slot0 + slot3 vs slot1 + slot2

| matchup_id | Season 1 | Season 2 |
|------------|----------|----------|
| 1 | Jacob & Joey vs Daniel & Nathan | Jacob & Joey vs Joe & Nathan |
| 2 | Jacob & Daniel vs Joey & Nathan | Joe & Jacob vs Joey & Nathan |
| 3 | Jacob & Nathan vs Daniel & Joey | Jacob & Nathan vs Joe & Joey |

Weekly play order (rotates so no pairing is always rested or always tired):

| Week | Series 1 | Series 2 | Series 3 |
|------|----------|----------|----------|
| 1    | A        | B        | C        |
| 2    | B        | C        | A        |
| 3    | C        | A        | B        |

**Season totals**: 9 series, up to 27 games. Each duo plays 3 series per season. Each player plays 9 series per season across their 3 possible partners.

---

## Display labels (Series N)

The UI labels each series as `Series 1`, `Series 2`, or `Series 3` based on **play order within its week**, NOT based on the pairing identity.

- `matchup_id` in the JSON is a fixed identifier for a specific pairing.
- The display label `Series N` is derived from the series' index in its week (`index + 1`).
- Example: Pairing A (Jacob+Joey vs Daniel+Nathan) is labeled "Series 1" in Week 1 (first in play order), but "Series 3" in Week 2 (third in play order).

Never derive "Series N" from `matchup_id`. It's the array index within the week, period.

---

## Duos (Teams)

Six duos per season (4 choose 2). A team name is locked to a *partnership* for as long
as that partnership exists. When the roster changes, the duos that no longer exist keep
their name in the history and the new duos get new franchises - so `teams.json` is the
union across every season, currently nine entries.

**Season 1**

1. Jacob & Daniel: *Celtics*
2. Jacob & Joey: *Lakers*
3. Jacob & Nathan: *Warriors*
4. Daniel & Joey: *Heat*
5. Daniel & Nathan: *Bucks*
6. Joey & Nathan: *Suns*

**Season 2** (Joe replaced Daniel, so Joe's three duos are new franchises)

1. Joe & Jacob: *Bulls*
2. Jacob & Joey: *Lakers*
3. Jacob & Nathan: *Warriors*
4. Joe & Joey: *Grizzlies*
5. Joe & Nathan: *Thunder*
6. Joey & Nathan: *Suns*

---

## Scoring Model

**Team-level (authoritative, recorded directly):**
- Team points scored per game
- Team points allowed per game

**Player-level (derived):**
- Player points scored = team points / 2
- Player points allowed = opponent points / 2
- Player +/- = scored minus allowed

Player points may be decimals (21 becomes 10.5). Display to 1 decimal place. Halving is done so a player's stats aggregate coherently across all 3 of their duos.

---

## Stats Tracked

**Per duo (per-season + career):**
- Series record, game record. Both must be computable.
- Total points scored, allowed, differential
- Avg margin per game, win % (series and games)
- Head-to-head vs every other duo

**Per player (per-season + career):**
- Series record, game record (aggregated across 3 duos)
- Points scored, points allowed, +/-
- Avg points per game, avg points allowed per game
- Best/worst partner (by win%)
- Blowouts (20+ margin), longest win streak

**Standings display:** W/L defaults to **games** but the Standings view has a toggle to switch to **series** (series record). Ranking is always by game wins regardless of the selected view; the toggle only swaps the displayed W/L and per-N stats.

---

## Typography rules

Only regular ASCII hyphens (`-`) are allowed for dashes. Never use em dashes (`—`), en dashes (`–`), or minus signs (`−`). This applies to:

- Score separators: `21-0`, never `21—0` or `21–0`
- Negative numbers: `-1`, never `−1`
- Empty/no-data cells: `-`, never `—`
- Body copy: use a regular hyphen, or rewrite to avoid a dash

Middle dots (`·`) are fine as label separators like `Season 1 · 2026`. They're not dashes.

---

## VOD Links
Each game has an optional YouTube URL. If present, the game detail view shows an embedded player. Current placeholder: `https://google.com`. Swap in real YouTube links anytime.

Each G1/G2/G3 game cell on scorecards displays a small play-icon link to that game's VOD.

---

## Playoffs
Top 4 teams by regular-season game wins make the bracket (#1 vs #4 on the left, #2 vs #3
on the right). Bracket matchups are not played out - they resolve on regular-season point
differential, higher +/- advances, with a coinflip if the two are identical. The bracket
renders as a live projection during the season and locks once all 9 series are played.

---

## Data Model

**One JSON file per season** (`season1.json`, `season2.json`, ...). Games are the source of truth; all stats are computed on the fly.

```json
{
  "season": 1,
  "roster": ["Jacob", "Daniel", "Joey", "Nathan"],
  "weeks": [
    {
      "week": 1,
      "series": [
        {
          "matchup_id": 1,
          "team1_key": "Jacob-Joey",
          "team2_key": "Daniel-Nathan",
          "status": "completed",
          "games": [
            { "game": 1, "date": "2026-04-19", "team1_score": 21, "team2_score": 0,  "vod_url": "https://google.com" },
            { "game": 2, "date": "2026-04-19", "team1_score": 17, "team2_score": 21, "vod_url": "https://google.com" },
            { "game": 3, "date": "2026-04-19", "team1_score": 21, "team2_score": 19, "vod_url": "https://google.com" }
          ]
        },
        {
          "matchup_id": 2,
          "team1_key": "Jacob-Daniel",
          "team2_key": "Joey-Nathan",
          "status": "completed",
          "games": [
            { "game": 1, "date": "2026-04-19", "team1_score": 17, "team2_score": 23, "vod_url": "https://google.com" },
            { "game": 2, "date": "2026-04-19", "team1_score": 22, "team2_score": 5,  "vod_url": "https://google.com" },
            { "game": 3, "date": "2026-04-19", "team1_score": 10, "team2_score": 22, "vod_url": "https://google.com" }
          ]
        },
        {
          "matchup_id": 3,
          "team1_key": "Jacob-Nathan",
          "team2_key": "Daniel-Joey",
          "status": "dnp",
          "games": []
        }
      ]
    }
  ]
}
```

**Conventions:**
- **Team keys** use age-ordered player names joined by hyphen. Older player always first (`Jacob-Daniel`, `Daniel-Joey`, `Joe-Nathan`, etc.). Age order spans every season's roster: Joe, Jacob, Daniel, Joey, Nathan.
- **Roster** is required per season and stored in *slot* order (see Weekly Rotation), not age order. Display order is derived from it by age.
- **Date** is optional per-game, purely cosmetic. Leave it out or set `null` if you don't care. Nothing depends on it. "Week" is the logical unit.
- **Status**: `"completed"` | `"partial"` | `"dnp"` | `"upcoming"` (scheduled but not played yet, same stat treatment as DNP -- no wins, no points -- but rendered neutrally in the UI rather than with the amber DNP styling)
- **Series labels** are derived from the series' index in the week, not from `matchup_id`.

**Separate `teams.json`** holds the duo to nickname map, unioned across every season:

```json
{
  "Jacob-Daniel":  "Celtics",
  "Jacob-Joey":    "Lakers",
  "Jacob-Nathan":  "Warriors",
  "Daniel-Joey":   "Heat",
  "Daniel-Nathan": "Bucks",
  "Joey-Nathan":   "Suns",
  "Joe-Jacob":     "Bulls",
  "Joe-Joey":      "Grizzlies",
  "Joe-Nathan":    "Thunder"
}
```

---

## Site Pages
Branded as **Locals Basketball League (LBL)** throughout.

- **Home**: current season standings, latest results, current week
- **Standings**: full duo table with games/series toggle and tiebreakers applied
- **Teams**: one page per duo: roster, record, stats, game log
- **Players**: one page per player: career + per-season stats, partner breakdowns
- **Schedule**: season grid showing all 9 series and their status
- **Game Detail**: box score + VOD embed if linked
- **Rules**: static page rendering the League Rules section above
- **Playoffs**: live bracket projection, locks when the season completes

Mobile-first. Polished visuals. Static site.

---

## Hosting & Updates
- Static site, intended for GitHub Pages
- Repo location (local): `C:\Users\Jamonnin\Documents\Locals-Basketball-League`
- Data updates = edit JSON in the repo and push
- No admin UI, no auth, no database

---

## Build Order (once approved)
1. Scaffold repo + seed JSON with Season 1 Week 1 data
2. Build the stat engine: pure functions that take JSON and return computed stats
3. Build the pages
4. Style and polish

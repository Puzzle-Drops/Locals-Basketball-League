# Locals Basketball League (LBL) — Spec

The official tracker for the Locals Basketball League.

## Players
Listed in order of age (oldest → youngest): **Jacob, Daniel, Joseph, Nathan**.

---

## League Rules

**Game format:**
- 2v2 basketball
- Make it take it
- 2-pointers and 3-pointers
- First to 21, win by 2
- Each matchup is a best-of-3 series

**Season format:**
- A season = 3 weeks
- Each week = 3 series (one for each unique matchup)
- Matchup order rotates each week so no pairing is always rested or always tired
- "Week" is a logical label, not calendar time — a single "week" may span multiple real-world play sessions

**Standings tiebreakers:**
1. Head-to-head series record
2. Point differential

**DNP:** any series or game that doesn't get played is logged but awards no points and no wins.

---

## Weekly Rotation

| Week | Series 1 | Series 2 | Series 3 |
|------|----------|----------|----------|
| 1    | M1       | M2       | M3       |
| 2    | M2       | M3       | M1       |
| 3    | M3       | M1       | M2       |

Matchups (each is one best-of-3 series):
- **M1**: Jacob & Joseph vs Daniel & Nathan
- **M2**: Jacob & Daniel vs Joseph & Nathan
- **M3**: Jacob & Nathan vs Daniel & Joseph

**Season totals**: 9 series, up to 27 games. Each duo plays 3 series per season. Each player plays 9 series per season across their 3 possible partners.

---

## Duos (Teams)
Six permanent duos. Each has a random NBA team name assigned once and locked across all seasons.

1. Jacob & Daniel — *Celtics*
2. Jacob & Joseph — *Lakers*
3. Jacob & Nathan — *Warriors*
4. Daniel & Joseph — *Heat*
5. Daniel & Nathan — *Bucks*
6. Joseph & Nathan — *Suns*

---

## Scoring Model

**Team-level (authoritative, recorded directly):**
- Team points scored per game
- Team points allowed per game

**Player-level (derived):**
- Player points scored = team points / 2
- Player points allowed = opponent points / 2
- Player +/- = scored − allowed

Player points may be decimals (21 → 10.5). Display to 1 decimal place. Halving is done so a player's stats aggregate coherently across all 3 of their duos.

---

## Stats Tracked

**Per duo (per-season + career):**
- Series record (W-L), game record (W-L)
- Total points scored, allowed, differential
- Avg margin per game, win % (series and games)
- Head-to-head vs every other duo

**Per player (per-season + career):**
- Series record, game record (aggregated across 3 duos)
- Points scored, points allowed, +/-
- Avg points per game, per series
- Best/worst partner (by win%)
- Blowouts (20+ margin), longest win streak

---

## VOD Links
Each game has an optional YouTube URL. If present, the game detail view shows an embedded player. Current placeholder: `https://google.com` — swap in real YouTube links anytime.

---

## Playoffs
**Season 1 Playoffs: TBD.** Decision to be made before the regular season ends. Options on the table:
- Simulated bracket based on regular-season point differential and/or +/-
- Actual bracket played out
- Hybrid (e.g. top seed picks partner, lower seeds battle first)

Until decided, the Playoffs page on the site just shows "TBD."

---

## Data Model

**One JSON file per season** (`season1.json`, `season2.json`, …). Games are the source of truth; all stats are computed on the fly.

```json
{
  "season": 1,
  "weeks": [
    {
      "week": 1,
      "series": [
        {
          "matchup_id": 1,
          "team1_key": "Jacob-Joseph",
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
          "team2_key": "Joseph-Nathan",
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
          "team2_key": "Daniel-Joseph",
          "status": "dnp",
          "games": []
        }
      ]
    }
  ]
}
```

**Conventions:**
- **Team keys** use age-ordered player names joined by hyphen — older player always first (`Jacob-Daniel`, `Daniel-Joseph`, `Joseph-Nathan`, etc.)
- **Date** is optional per-game, purely cosmetic. Leave it out or set `null` if you don't care — nothing depends on it. "Week" is the logical unit.
- **Status**: `"completed"` | `"partial"` | `"dnp"`

**Separate `teams.json`** holds the permanent duo → nickname map:

```json
{
  "Jacob-Daniel":  "Celtics",
  "Jacob-Joseph":  "Lakers",
  "Jacob-Nathan":  "Warriors",
  "Daniel-Joseph": "Heat",
  "Daniel-Nathan": "Bucks",
  "Joseph-Nathan": "Suns"
}
```

---

## Site Pages
Branded as **Locals Basketball League (LBL)** throughout.

- **Home** — current season standings, latest results, current week
- **Standings** — full duo table with tiebreakers applied
- **Teams** — one page per duo: roster, record, stats, game log
- **Players** — one page per player: career + per-season stats, partner breakdowns
- **Schedule** — season grid showing all 9 series and their status
- **Game Detail** — box score + VOD embed if linked
- **Rules** — static page rendering the League Rules section above
- **Playoffs** — currently displays "TBD"

Mobile-first. Polished visuals. Static site.

---

## Hosting & Updates
- Static site, intended for GitHub Pages
- Repo location (local): `C:\Users\Jamonnin\Documents\Locals-Basketball-League`
- Data updates = edit JSON in the repo and push
- No admin UI, no auth, no database

---

## Build Order (once approved)
1. Scaffold repo + seed JSON with Season 1 Week 1 data (what you shared)
2. Build the stat engine — pure functions that take JSON and return computed stats
3. Build the pages
4. Style and polish

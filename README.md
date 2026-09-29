# Draft Hub

Multi-league fantasy **sports draft** app — create a room, share the 6-char code,
draft live turn-by-turn, and watch the scoreboard update itself.

- **Live site:** https://monkeydrafts.netlify.app
- **Stack:** one static `index.html` + Firebase Realtime Database + one Netlify
  function for live scores. No build step for the app.

---

## How it works

| Piece | What it does |
|---|---|
| `index.html` | The entire app — lobby, draft room, scoring, scoreboard, all-time results, upcoming events. Talks to Firebase directly. |
| `netlify/functions/update-scores.mjs` | Runs every 15 min (and on demand). Pulls ESPN standings, the current golf major, and every in-window playoff bracket, and writes them into Firebase. Clients listen and re-render. |
| `netlify/functions/lib/espn.mjs` | ESPN endpoints, team-id maps, `findGolfMajor()` (auto-detects the active major), and `getPlayoffBracket()` (auto-detects each league's playoff round from game headlines). |
| Firebase Realtime DB (`draft-hub-bece4`) | Rooms, drafts, finalized drafts, all-time results, and the live score caches. |

### Scoring modes (set by the host on the Setup tab)

- **Playoff Bracket** — each playoff round a team wins is worth double the last
  (base points per league on the Scoring tab). Golf = total strokes. World Cup =
  group result + doubling bracket. Round wins for NFL/CFB/CBB (single-elimination)
  and NBA/NHL/MLB (best-of-series) are pulled from ESPN automatically during each
  league's postseason window; World Cup stays manual (next in season in 2030).
- **Regular Season Wins** — your score is the **total regular-season wins** of
  every team you drafted. Standings come from ESPN automatically (NFL, CFB, NBA,
  MLB). Use this for win-totals drafts.

### Leagues

NFL · CFB (all 138 FBS) · NBA · MLB · CBB · PGA majors · World Cup.
NBA/NHL/CBB team lists are playoff-field only; NFL/CFB/MLB are full.

---

## Local development

```bash
npm install
npm run dev          # netlify dev → http://localhost:8888
```

Without the Netlify CLI you can also just serve the folder
(`python3 -m http.server 8899`) — everything except the score function works,
since the app hits Firebase directly.

### Testing the score function

```bash
cp .env.example .env      # fill in FIREBASE_SERVICE_ACCOUNT + FIREBASE_DB_URL
npm run scores            # one full run (standings + golf)
npm run scores -- nfl     # just NFL standings
```

`FIREBASE_SERVICE_ACCOUNT` comes from Firebase console → Project settings →
Service accounts → *Generate new private key*. Paste the whole JSON as a single
quoted line.

---

## Deploying

Push to `main` → Netlify builds and deploys automatically.

**One-time Netlify setup:** Site settings → Environment variables, add
`FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_DB_URL` (same values as `.env`).
The scheduled function won't be able to write scores until these are set.

**Firebase rules:** apply `database.rules.json` in the Firebase console
(Realtime Database → Rules). This locks the `seasonRecords` / `golfScores` /
`scoresMeta` paths to the service account so clients can't tamper with live
scores; everything else stays open (rooms are protected only by their code).

---

## Common edits

- **Add / update a season's rosters** — `TEAMS` object near the top of the
  `<script>` in `index.html`. CFB is auto-generated from ESPN abbreviations
  (`<abbr>-cf`); other leagues use explicit ids that must match
  `TEAM_ID_MAP` in `netlify/functions/lib/espn.mjs`.
- **Upcoming events list** — `UPCOMING_EVENTS` in `index.html`. Events that
  finished more than 45 days ago hide automatically.
- **Golf majors** — fully automatic. `findGolfMajor()` in `espn.mjs` scans the
  ESPN golf scoreboard each run, recognises the four majors by name, and writes
  `golfScores/<major><year>` (e.g. `masters2027`). The only edit needed is
  keeping the `MAJORS` list in `index.html` current so a host can pick the
  right tournament when creating a PGA draft — `espnId` there is unused now.
- **Playoff round mapping** — `PLAYOFF_ROUNDS` in `espn.mjs` matches each league's
  game headlines (e.g. "NBA Finals", "AFC Championship", "1st Round") to a round
  index. Verified against real 2025-26 postseason data for all six leagues before
  shipping — if ESPN ever renames a round, add/adjust a pattern there.
- **Playoff-team pools** — NHL and CBB (`TEAMS.nhl`/`TEAMS.cbb` in `index.html`
  plus the matching `TEAM_ID_MAP.nhl`/`.cbb` in `espn.mjs`) are a snapshot of one
  year's actual bracket and need refreshing before the next postseason, same as
  NBA. NFL/CFB/MLB use their full league so this doesn't apply to them.
- **Who can log All-Time Results** — `ADMIN_NAMES` in `index.html`
  (name match, case-insensitive).
- **Finalized draft cards on the Scoreboard** — `SHOW_FINALIZED_DRAFTS` in
  `index.html` (currently `true`). During a season keep the room un-finalized
  so its live grid stays visible; finalize once it's over.

---

## Automated vs. manual

- **Regular-season win totals** (NFL, CFB, NBA, MLB) — fully automatic, every season.
- **Golf majors** — fully automatic; the function detects the live major itself.
- **Playoff brackets** (NBA/NHL/MLB/CFB/CBB) — fully automatic during each league's
  postseason window (`isLeagueInPlayoffWindow` in `espn.mjs`): series wins for
  MLB/NBA/NHL read straight from ESPN's series data, single-elimination rounds
  (NFL/CFB/CBB) from each game's winner. The manual **Edit Playoff Results**
  panel still exists as an override for when ESPN lags or gets something wrong.
- **World Cup** — manual only (group stage + knockout bracket); not worth
  automating until the next Cup in 2030.
- **Automated texts** — intentionally not built; score updates are sent by hand.

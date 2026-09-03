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
| `netlify/functions/update-scores.mjs` | Runs every 15 min (and on demand). Pulls ESPN standings + golf leaderboards, writes them into Firebase. Clients listen and re-render. |
| `netlify/functions/lib/espn.mjs` | ESPN endpoints + the ESPN-abbreviation → internal-team-id maps. |
| Firebase Realtime DB (`draft-hub-bece4`) | Rooms, drafts, finalized drafts, all-time results, and the live score caches. |

### Scoring modes (set by the host on the Setup tab)

- **Playoff Bracket** — each playoff round a team wins is worth double the last
  (base points per league on the Scoring tab). Golf = total strokes. World Cup =
  group result + doubling bracket.
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
- **Golf majors** — `MAJORS` in `index.html` *and* the `MAJORS` table in
  `update-scores.mjs`. Fill in each `espnId` once the event page exists on
  ESPN (find it via
  `site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard`).
- **Who can log All-Time Results** — `ADMIN_NAMES` in `index.html`
  (name match, case-insensitive).
- **Show finalized draft cards on the Scoreboard** — flip
  `SHOW_FINALIZED_DRAFTS` to `true` in `index.html`. Currently off; during a
  season keep the room un-finalized so its live grid stays visible, and
  finalize only when it's over.

---

## Not yet automated

- **Playoff series results** (NBA/NHL/MLB/CFB brackets) still use the manual
  **Edit Playoff Results** panel on the Scoreboard. The `?type=playoffs` route
  in the function returns empty on purpose until that aggregation is built.
- **Automated texts** — intentionally not built; score updates are sent by hand.

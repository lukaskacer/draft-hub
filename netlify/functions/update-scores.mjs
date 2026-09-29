// Draft Hub — live score ingester.
//
// Runs on a schedule (see netlify.toml) AND is invocable over HTTP so the
// Scoreboard "⟳ Refresh" button can force an update. It reads ESPN and writes
// into Firebase Realtime Database; the browser clients just listen on those
// paths and re-render.
//
// Firebase paths written:
//   seasonRecords/{league}/{teamId}  ->  { w, l, t, updatedAt }
//   golfScores/{majorId}/{golferId}  ->  { toPar, position, rounds, total, cut }
//   playoffScores/{teamId}           ->  { wins:[...], eliminated, league }  (bracket leagues)
//   scoresMeta/lastRun               ->  { at, summary }
//
// Env: FIREBASE_SERVICE_ACCOUNT (JSON string), FIREBASE_DB_URL,
//      SCORES_REFRESH_KEY (optional).

import admin from 'firebase-admin';
import {
  LEAGUES,
  isLeagueInSeason,
  getStandings,
  getGolfLeaderboard,
  findGolfMajor,
  getPlayoffBracket,
  isLeagueInPlayoffWindow,
} from './lib/espn.mjs';

const PLAYOFF_LEAGUES = ['mlb', 'nba', 'nhl', 'nfl', 'cfb', 'cbb'];

// ── Firebase ────────────────────────────────────────────────────────────────
let dbInstance = null;
function db() {
  if (dbInstance) return dbInstance;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
  const credential = admin.credential.cert(JSON.parse(raw));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential,
      databaseURL: process.env.FIREBASE_DB_URL || 'https://draft-hub-bece4-default-rtdb.firebaseio.com',
    });
  }
  dbInstance = admin.database();
  return dbInstance;
}

// ── Work ────────────────────────────────────────────────────────────────────
async function updateStandings(only) {
  const summary = {};
  const unmatchedAll = {};
  const leagues = only ? [only] : Object.keys(LEAGUES);
  for (const league of leagues) {
    if (!only && !isLeagueInSeason(league)) continue;
    try {
      const { records, unmatched } = await getStandings(league);
      const ids = Object.keys(records);
      if (!ids.length) { summary[league] = 'no data'; continue; }
      const payload = {};
      const now = Date.now();
      for (const id of ids) payload[id] = { ...records[id], updatedAt: now };
      await db().ref(`seasonRecords/${league}`).update(payload);
      summary[league] = ids.length;
      if (unmatched.length) unmatchedAll[league] = unmatched;
    } catch (err) {
      summary[league] = `error: ${err.message}`;
    }
  }
  if (Object.keys(unmatchedAll).length) {
    console.warn('[update-scores] unmatched ESPN teams:', JSON.stringify(unmatchedAll));
  }
  return { standings: summary, unmatched: unmatchedAll };
}

async function updateGolf(forceEventId) {
  const summary = {};

  // Which event + which golfScores/{majorId} key to write.
  let target = null;
  if (forceEventId) {
    target = { majorId: 'adhoc', espnId: forceEventId };
  } else {
    try {
      target = await findGolfMajor(); // auto-discovered; null outside major weeks
    } catch (err) {
      return { golf: { discover: `error: ${err.message}` } };
    }
  }
  if (!target) return { golf: 'no active major' };

  try {
    const { scores } = await getGolfLeaderboard(target.espnId);
    const ids = Object.keys(scores);
    if (!ids.length) { summary[target.majorId] = 'no data'; }
    else {
      await db().ref(`golfScores/${target.majorId}`).set(scores);
      summary[target.majorId] = ids.length;
    }
  } catch (err) {
    summary[target.majorId] = `error: ${err.message}`;
  }
  return { golf: summary };
}

// Writes each team's bracket state with targeted per-field updates (never a bare
// `set` of the whole node) so this coexists cleanly with:
//  - a manual correction made via the Edit Scores / Edit Playoff Results panel
//  - an earlier round's result that's no longer in this run's scoreboard window
async function writeBracket(bracket) {
  for (const [teamId, data] of Object.entries(bracket)) {
    const updates = { league: data.league };
    data.wins.forEach((w, i) => { if (w) updates[`wins/${i}`] = 1; });
    if (data.eliminated) updates.eliminated = true;
    await db().ref(`playoffScores/${teamId}`).update(updates);
  }
}

async function updatePlayoffs(only) {
  const summary = {};
  const unmatchedAll = {};
  const leagues = only ? [only] : PLAYOFF_LEAGUES;
  for (const league of leagues) {
    if (!only && !isLeagueInPlayoffWindow(league)) continue;
    try {
      const { bracket, unmatched } = await getPlayoffBracket(league);
      const ids = Object.keys(bracket);
      if (!ids.length) { summary[league] = 'no decided games yet'; continue; }
      await writeBracket(bracket);
      summary[league] = ids.length;
      if (unmatched.length) unmatchedAll[league] = unmatched;
    } catch (err) {
      summary[league] = `error: ${err.message}`;
    }
  }
  if (Object.keys(unmatchedAll).length) {
    console.warn('[update-scores] unmatched playoff teams:', JSON.stringify(unmatchedAll));
  }
  return { playoffs: summary };
}

async function runAll(opts = {}) {
  const started = Date.now();
  const result = {
    ...(await updateStandings(opts.league)),
    ...(await updateGolf(opts.event)),
    ...(await updatePlayoffs(opts.playoffLeague)),
  };
  const meta = { at: new Date().toISOString(), ms: Date.now() - started, summary: result };
  try { await db().ref('scoresMeta/lastRun').set(meta); } catch { /* non-fatal */ }
  return meta;
}

// ── Handler (scheduled POST + manual GET) ───────────────────────────────────
export default async (req) => {
  const url = new URL(req.url);
  const params = url.searchParams;

  // Optional shared-secret gate for manual HTTP calls.
  const requiredKey = process.env.SCORES_REFRESH_KEY;
  const isScheduled = req.method === 'POST' && !params.has('type') && !params.has('event');
  if (requiredKey && !isScheduled && params.get('key') !== requiredKey) {
    return json({ error: 'unauthorized' }, 401);
  }

  try {
    // Back-compat passthrough for the old Cloudflare Worker contract.
    if (params.has('event') && !params.has('type')) {
      const { scores, state } = await getGolfLeaderboard(params.get('event'));
      const leaderboard = Object.values(scores).map((s) => ({
        name: s.name, position: s.position, toPar: s.toPar,
        totalStrokes: s.total, rounds: s.rounds, cut: s.cut, played: s.rounds.length,
      }));
      return json({ leaderboard, state });
    }
    if (params.get('type') === 'playoffs') {
      // Real bracket aggregation (series wins + single-elimination results from ESPN).
      // The client reads playoffScores from Firebase directly now, but this still
      // returns the computed bracket for manual triggering/debugging.
      const league = params.get('league');
      if (league) {
        const { bracket, unmatched } = await getPlayoffBracket(league);
        await writeBracket(bracket);
        return json({ seriesResults: bracket, unmatched });
      }
      return json(await updatePlayoffs());
    }
    if (params.get('type') === 'golf') {
      return json(await runAll({ event: params.get('event') || undefined }));
    }
    if (params.get('type') === 'standings') {
      return json(await runAll({ league: params.get('league') || undefined }));
    }

    return json(await runAll());
  } catch (err) {
    console.error('[update-scores]', err);
    return json({ error: err.message }, 500);
  }
};

export const config = { schedule: '*/15 * * * *' };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });
}

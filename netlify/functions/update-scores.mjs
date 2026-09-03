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
//   scoresMeta/lastRun               ->  { at, summary }
//
// Env: FIREBASE_SERVICE_ACCOUNT (JSON string), FIREBASE_DB_URL,
//      SCORES_REFRESH_KEY (optional).

import admin from 'firebase-admin';
import {
  LEAGUES,
  TEAM_ID_MAP,
  isLeagueInSeason,
  getStandings,
  getGolfLeaderboard,
} from './lib/espn.mjs';

// Mirror of index.html MAJORS (id + ESPN event id). Keep in sync when the
// season's majors change.
const MAJORS = [
  { id: 'masters2027',   espnId: null, start: '2027-04-08', end: '2027-04-11' },
  { id: 'pga2027',       espnId: null, start: '2027-05-20', end: '2027-05-23' },
  { id: 'usopen2027',    espnId: null, start: '2027-06-17', end: '2027-06-20' },
  { id: 'theopen2027',   espnId: null, start: '2027-07-15', end: '2027-07-18' },
];

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
  const now = new Date();
  const targets = forceEventId
    ? [{ id: 'adhoc', espnId: forceEventId }]
    : MAJORS.filter((m) => m.espnId && withinWindow(m, now));
  for (const m of targets) {
    try {
      const { scores } = await getGolfLeaderboard(m.espnId);
      const ids = Object.keys(scores);
      if (!ids.length) { summary[m.id] = 'no data'; continue; }
      await db().ref(`golfScores/${m.id}`).set(scores);
      summary[m.id] = ids.length;
    } catch (err) {
      summary[m.id] = `error: ${err.message}`;
    }
  }
  return { golf: summary };
}

function withinWindow(m, now) {
  const start = new Date(m.start + 'T00:00:00Z');
  const end = new Date(m.end + 'T23:59:59Z');
  const grace = 2 * 24 * 3600 * 1000; // keep polling 2 days after finish
  return now >= new Date(start - grace) && now <= new Date(+end + grace);
}

async function runAll(opts = {}) {
  const started = Date.now();
  const result = { ...(await updateStandings(opts.league)), ...(await updateGolf(opts.event)) };
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
      // Playoff-series aggregation is not yet reproduced here; the client falls
      // back to Firebase manual entry (Edit Playoff Results) when this is empty.
      return json({ seriesResults: {}, note: 'manual entry' });
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

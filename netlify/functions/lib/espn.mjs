// ESPN data helpers for Draft Hub's live-scoring function.
//
// ESPN's "hidden" site API needs no key and sends permissive CORS headers.
// We only read from it. Endpoints used:
//   standings:   https://site.api.espn.com/apis/v2/sports/{path}/standings?level=1
//   scoreboard:  https://site.api.espn.com/apis/site/v2/sports/{path}/scoreboard
//   golf:        https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?event={id}
//
// Everything here maps ESPN identifiers onto the *internal* team/golfer ids used
// by index.html so the client can read Firebase without any translation.

export const LEAGUES = {
  nfl: { path: 'football/nfl',            seasonMonths: [9, 10, 11, 12, 1, 2] },
  cfb: { path: 'football/college-football', seasonMonths: [8, 9, 10, 11, 12, 1] },
  nba: { path: 'basketball/nba',          seasonMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6] },
  mlb: { path: 'baseball/mlb',            seasonMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11] },
};

// ── ESPN abbreviation → internal id ──────────────────────────────────────────
// Keys are ESPN team abbreviations (upper-case). Values are index.html team ids.
export const TEAM_ID_MAP = {
  nfl: {
    ARI: 'ari-f', ATL: 'atl-f', BAL: 'bal-f', BUF: 'buf-f', CAR: 'car-f', CHI: 'chi-f',
    CIN: 'cin-f', CLE: 'cle-f', DAL: 'dal-f', DEN: 'den-f', DET: 'det-f', GB: 'gb-f',
    HOU: 'hou-f', IND: 'ind-f', JAX: 'jac-f', KC: 'kc-f', LAC: 'lac-f', LAR: 'lar-f',
    LV: 'lv-f', MIA: 'mia-f', MIN: 'min-f', NE: 'ne-f', NO: 'no-f', NYG: 'nyg-f',
    NYJ: 'nyj-f', PHI: 'phi-f', PIT: 'pit-f', SEA: 'sea-f', SF: 'sf-f', TB: 'tb-f',
    TEN: 'ten-f', WSH: 'wsh-f',
  },
  mlb: {
    ARI: 'ari-m', ATL: 'atl-m', BAL: 'bal-m', BOS: 'bos-m', CHC: 'chc-m', CWS: 'cws-m',
    CHW: 'cws-m', CIN: 'cin-m', CLE: 'cle-m', COL: 'col-m', DET: 'det-m', HOU: 'hou-m',
    KC: 'kc-m', LAA: 'laa-m', LAD: 'lad-m', MIA: 'mia-m', MIL: 'mil-m', MIN: 'min-m',
    NYM: 'nym-m', NYY: 'nyy-m', ATH: 'ath-m', OAK: 'ath-m', PHI: 'phi-m', PIT: 'pit-m',
    SD: 'sd-m', SF: 'sf-m', SEA: 'sea-m', STL: 'stl-m', TB: 'tb-m', TEX: 'tex-m',
    TOR: 'tor-m', WSH: 'wsh-m',
  },
  nba: {
    ATL: 'atl', BOS: 'bos', BKN: 'bkn', CHA: 'cha', CHI: 'chi-b', CLE: 'cle', DAL: 'dal-b',
    DEN: 'den', DET: 'det', GS: 'gsw', GSW: 'gsw', HOU: 'hou', IND: 'ind-b', LAC: 'lac-b',
    LAL: 'lal', MEM: 'mem', MIA: 'mia-b', MIL: 'mil-b', MIN: 'min', NO: 'nop', NOP: 'nop',
    NY: 'nyk', NYK: 'nyk', OKC: 'okc', ORL: 'orl', PHI: 'phi', PHX: 'phx', POR: 'por',
    SAC: 'sac', SA: 'sas', SAS: 'sas', TOR: 'tor', UTAH: 'uta', UTA: 'uta', WSH: 'was',
  },
  // All 130+ FBS programs. Keys are ESPN abbreviations; values match TEAMS.cfb in
  // index.html. getStandings() also falls back to a normalized-abbr match, so a
  // new/renamed team still resolves.
  // Current NHL playoff-field snapshot — matches TEAMS.nhl in index.html. Like the NBA
  // list, this needs refreshing to each year's actual playoff teams before relying on it.
  nhl: {
    BUF: 'buf-h', TB: 'tbl-h', MTL: 'mtl-h', CAR: 'car-h', PIT: 'pit-h', PHI: 'phi-h',
    BOS: 'bos-h', OTT: 'ott-h', COL: 'col-h', DAL: 'dal-h', MIN: 'min-h', VGK: 'vgk-h',
    EDM: 'edm-h', ANA: 'ana-h', UTA: 'uta-h', LA: 'lak-h',
  },
  // Current March Madness field snapshot — matches TEAMS.cbb in index.html. Refresh this
  // (and TEAMS.cbb) to the actual bracket before each tournament.
  // NOTE: two id/abbr mismatches on purpose — TEAMS.cbb's id 'ksu' is Kentucky (ESPN
  // abbr "UK"), and its id 'kst' is Kansas State (ESPN's actual abbr for KSU is "KSU").
  cbb: {
    CONN: 'uconn', HOU: 'hou-c', PUR: 'pur', KU: 'kan', DUKE: 'duke', UNC: 'unc',
    UK: 'ksu', TENN: 'ten-c', ALA: 'ala', GONZ: 'gon', ISU: 'isu', AUB: 'aub',
    MARQ: 'marq', CREI: 'cre', SDSU: 'sdsu', MSU: 'msn', ILL: 'ill', TEX: 'tex',
    ARIZ: 'ari-c', SJU: 'stj', FLA: 'fla-c', XAV: 'xav', BYU: 'byu-c', IU: 'ind-c',
    ARK: 'ark', OU: 'okl', MD: 'mar', VILL: 'vil', KSU: 'kst', WVU: 'wvu',
  },
  cfb: {
    'AFA':'afa-cf', 'AKR':'akr-cf', 'ALA':'ala-cf', 'APP':'app-cf', 'ARIZ':'ariz-cf', 'ASU':'asu-cf',
    'ARK':'ark-cf', 'ARST':'arst-cf', 'ARMY':'army-cf', 'AUB':'aub-cf', 'BALL':'ball-cf', 'BAY':'bay-cf',
    'BOIS':'bois-cf', 'BC':'bc-cf', 'BGSU':'bgsu-cf', 'BUFF':'buff-cf', 'BYU':'byu-cf', 'CAL':'cal-cf',
    'CMU':'cmu-cf', 'CLT':'clt-cf', 'CIN':'cin-cf', 'CLEM':'clem-cf', 'CCU':'ccu-cf', 'COLO':'colo-cf',
    'CSU':'csu-cf', 'DEL':'del-cf', 'DUKE':'duke-cf', 'ECU':'ecu-cf', 'EMU':'emu-cf', 'FLA':'fla-cf',
    'FAU':'fau-cf', 'FIU':'fiu-cf', 'FSU':'fsu-cf', 'FRES':'fres-cf', 'UGA':'uga-cf', 'GASO':'gaso-cf',
    'GAST':'gast-cf', 'GT':'gt-cf', 'HAW':'haw-cf', 'HOU':'hou-cf', 'ILL':'ill-cf', 'IU':'iu-cf',
    'IOWA':'iowa-cf', 'ISU':'isu-cf', 'JVST':'jvst-cf', 'JMU':'jmu-cf', 'KU':'ku-cf', 'KSU':'ksu-cf',
    'KENN':'kenn-cf', 'KENT':'kent-cf', 'UK':'uk-cf', 'LIB':'lib-cf', 'UL':'ul-cf', 'LT':'lt-cf',
    'LOU':'lou-cf', 'LSU':'lsu-cf', 'MRSH':'mrsh-cf', 'MD':'md-cf', 'MASS':'mass-cf', 'MEM':'mem-cf',
    'MIA':'mia-cf', 'M-OH':'moh-cf', 'MICH':'mich-cf', 'MSU':'msu-cf', 'MTSU':'mtsu-cf', 'MINN':'minn-cf',
    'MSST':'msst-cf', 'MIZ':'miz-cf', 'MOST':'most-cf', 'NAVY':'navy-cf', 'NCSU':'ncsu-cf', 'NEB':'neb-cf',
    'NEV':'nev-cf', 'UNM':'unm-cf', 'NMSU':'nmsu-cf', 'UNC':'unc-cf', 'NDSU':'ndsu-cf', 'UNT':'unt-cf',
    'NIU':'niu-cf', 'NU':'nu-cf', 'ND':'nd-cf', 'OHIO':'ohio-cf', 'OSU':'osu-cf', 'OU':'ou-cf',
    'OKST':'okst-cf', 'ODU':'odu-cf', 'MISS':'miss-cf', 'ORE':'ore-cf', 'ORST':'orst-cf', 'PSU':'psu-cf',
    'PITT':'pitt-cf', 'PUR':'pur-cf', 'RICE':'rice-cf', 'RUTG':'rutg-cf', 'SAC':'sac-cf', 'SHSU':'shsu-cf',
    'SDSU':'sdsu-cf', 'SJSU':'sjsu-cf', 'SMU':'smu-cf', 'USA':'usa-cf', 'SC':'sc-cf', 'USF':'usf-cf',
    'USM':'usm-cf', 'STAN':'stan-cf', 'SYR':'syr-cf', 'TCU':'tcu-cf', 'TEM':'tem-cf', 'TENN':'tenn-cf',
    'TEX':'tex-cf', 'TA&M':'tam-cf', 'TXST':'txst-cf', 'TTU':'ttu-cf', 'TOL':'tol-cf', 'TROY':'troy-cf',
    'TULN':'tuln-cf', 'TLSA':'tlsa-cf', 'UAB':'uab-cf', 'UCF':'ucf-cf', 'UCLA':'ucla-cf', 'CONN':'conn-cf',
    'ULM':'ulm-cf', 'UNLV':'unlv-cf', 'USC':'usc-cf', 'UTAH':'utah-cf', 'USU':'usu-cf', 'UTEP':'utep-cf',
    'UTSA':'utsa-cf', 'VAN':'van-cf', 'UVA':'uva-cf', 'VT':'vt-cf', 'WAKE':'wake-cf', 'WASH':'wash-cf',
    'WSU':'wsu-cf', 'WVU':'wvu-cf', 'WKU':'wku-cf', 'WMU':'wmu-cf', 'WIS':'wis-cf', 'WYO':'wyo-cf',
  },
};

// ESPN 403s non-browser User-Agents on several endpoints, so present a real one.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function fetchJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`ESPN ${res.status} for ${url}`);
  return res.json();
}

export function isLeagueInSeason(league, now = new Date()) {
  const cfg = LEAGUES[league];
  if (!cfg) return false;
  return cfg.seasonMonths.includes(now.getUTCMonth() + 1);
}

// ── Standings → { teamId: { w, l, t, pct } } plus a list of unmatched ESPN teams ──
export async function getStandings(league) {
  const cfg = LEAGUES[league];
  if (!cfg) throw new Error(`unknown league ${league}`);
  const url = `https://site.web.api.espn.com/apis/v2/sports/${cfg.path}/standings` +
    `?region=us&lang=en&contentorigin=espn&type=0&level=1`;
  const data = await fetchJSON(url);

  const map = TEAM_ID_MAP[league] || {};
  const out = {};
  const unmatched = [];

  // Flat list at data.standings.entries; some leagues nest under children[].standings.entries
  const buckets = [];
  if (data?.standings?.entries?.length) buckets.push(data.standings.entries);
  for (const child of data?.children || []) {
    if (child?.standings?.entries?.length) buckets.push(child.standings.entries);
  }

  for (const entries of buckets) {
    for (const entry of entries) {
      const t = entry.team || {};
      const abbr = (t.abbreviation || '').toUpperCase();
      const stats = entry.stats || [];
      const stat = (name) => stats.find((s) => s.name === name)?.value;
      let id = map[abbr] || map[(t.shortDisplayName || '').toUpperCase()] ||
        map[(t.name || '').toUpperCase()];
      // CFB: fall back to normalized abbreviation (<abbr>-cf) so new teams still resolve.
      if (!id && league === 'cfb' && abbr) id = abbr.toLowerCase().replace(/[^a-z0-9]/g, '') + '-cf';
      if (!id) { unmatched.push(abbr || t.displayName); continue; }
      if (out[id]) continue; // first bucket wins (overall standings)
      out[id] = {
        w: num(stat('wins')) ?? 0,
        l: num(stat('losses')) ?? 0,
        t: num(stat('ties')) || 0,
        pct: num(stat('winPercent')),
        name: t.displayName,
      };
    }
  }
  return { records: out, unmatched };
}

// ── Golf leaderboard → { golferId: { toPar, position, rounds, total, cut } } ──
// golferId is a normalized name (matches index.html's TEAMS.pga ids).
export function normalizeGolfer(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
}

// The four men's majors, matched against ESPN event names. The `id` becomes
// `<id><year>` (e.g. masters2027) which is exactly the id index.html's MAJORS use.
const MAJOR_PATTERNS = [
  { id: 'masters', re: /masters/i },
  { id: 'pga', re: /^pga championship$/i },
  { id: 'usopen', re: /u\.?s\.? open/i },
  { id: 'theopen', re: /^the open$|open championship/i },
];

// Look at the current golf scoreboard (and a date window around `now`) for a
// men's major that is in progress or recently finished. Returns
// { majorId, espnId, name, state } or null — no hardcoded event ids needed.
export async function findGolfMajor(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  const from = new Date(+now - 9 * 864e5);
  const to = new Date(+now + 2 * 864e5);

  const urls = [
    'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard',
    `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?dates=${ymd(from)}-${ymd(to)}`,
  ];

  for (const url of urls) {
    let events = [];
    try { events = (await fetchJSON(url))?.events || []; } catch { continue; }
    for (const e of events) {
      const name = e.name || e.shortName || '';
      const match = MAJOR_PATTERNS.find((m) => m.re.test(name));
      if (!match) continue;
      const state = e.status?.type?.state || e.competitions?.[0]?.status?.type?.state || 'pre';
      if (state === 'pre') continue; // not started yet — nothing to pull
      const year = new Date(e.date || e.endDate || now).getFullYear();
      return { majorId: `${match.id}${year}`, espnId: String(e.id), name, state };
    }
  }
  return null;
}

export async function getGolfLeaderboard(espnEventId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?event=${espnEventId}`;
  const data = await fetchJSON(url);
  const comp = data?.events?.[0]?.competitions?.[0];
  const competitors = comp?.competitors || [];
  const statusState = comp?.status?.type?.state || data?.events?.[0]?.status?.type?.state || 'pre';

  const out = {};
  for (const c of competitors) {
    const name = c.athlete?.displayName || '';
    if (!name) continue;
    const id = normalizeGolfer(name);
    const linescores = c.linescores || [];
    const rounds = linescores.map((ls) => parseInt(ls.value, 10)).filter((n) => !isNaN(n));
    const total = rounds.length ? rounds.reduce((a, b) => a + b, 0) : null;
    const statusName = (c.status?.type?.name || '').toUpperCase();
    const cut = /CUT|WD|DQ|DSQ/.test(statusName) || /wd|dq/i.test(c.status?.displayValue || '');
    const scoreToPar = c.statistics?.find?.((s) => s.name === 'scoreToPar');
    out[id] = {
      name,
      toPar: num(scoreToPar?.value) ?? parseScore(scoreToPar?.displayValue ?? c.score?.displayValue),
      position: c.status?.position?.displayName || c.status?.displayValue || '—',
      rounds,
      total,
      cut,
      thru: c.status?.thru ?? null,
    };
  }
  return { scores: out, state: statusState };
}

// ── PLAYOFF BRACKETS ─────────────────────────────────────────────────────────
// Round-name patterns are matched against each ESPN event's `notes[0].headline`, checked
// in the order listed so a more specific pattern wins over a broader one (e.g. "NBA
// Finals" before the generic "Finals" that also matches "West Finals"). Round indices
// line up with each league's PLAYOFF config in index.html. Verified against every
// league's actual 2025-26 postseason headlines before shipping.
const PLAYOFF_ROUNDS = {
  mlb: [ // best-of-series: Wild Card(0) / Div Series(1) / LCS(2) / World Series(3)
    { round: 3, re: /world series/i },
    { round: 2, re: /^(al|nl)cs\b/i },
    { round: 1, re: /^(al|nl)ds\b/i },
    { round: 0, re: /^(al|nl)wc\b/i },
  ],
  nba: [ // best-of-series: 1st Round(0) / Semifinals(1) / Conf Finals(2) / NBA Finals(3)
    { round: 3, re: /nba finals/i },
    { round: 1, re: /semifinals/i },
    { round: 0, re: /1st round/i },
    { round: 2, re: /finals/i }, // "East/West Finals" — only reached once NBA Finals is ruled out
  ],
  nhl: [ // best-of-series: 1st Round(0) / 2nd Round(1) / Conf Final(2) / Stanley Cup(3)
    { round: 3, re: /stanley cup final/i },
    { round: 0, re: /1st round/i },
    { round: 1, re: /2nd round/i },
    { round: 2, re: /\bfinal\b/i }, // "East/West Final" — only reached once Stanley Cup Final is ruled out
  ],
  nfl: [ // single-elimination: Wild Card(0) / Divisional(1) / Championship(2) / Super Bowl(3)
    { round: 3, re: /super bowl/i },
    { round: 2, re: /championship/i },
    { round: 1, re: /divisional/i },
    { round: 0, re: /wild card/i },
  ],
  cfb: [ // single-elimination, 12-team CFP: First Round(0)/QF(1)/SF(2)/Natl Champ(3)
    { round: 3, re: /national championship/i },
    { round: 2, re: /semifinal/i },
    { round: 1, re: /quarterfinal/i },
    { round: 0, re: /first round/i },
  ],
  cbb: [ // single-elimination, March Madness: R64(0)/R32(1)/Sweet16(2)/Elite8(3)/F4(4)/Champ(5)
    { round: 5, re: /national championship/i },
    { round: 4, re: /final four/i },
    { round: 3, re: /elite 8/i },
    { round: 2, re: /sweet 16/i },
    { round: 1, re: /2nd round/i },
    { round: 0, re: /1st round/i },
  ],
};

// Only count events whose headline has this prefix — filters out non-CFP bowl games
// (CFB) and non-championship early-round noise (CBB "First Four" play-ins, which are
// intentionally left unmapped: our TEAMS.cbb pool is tournament-proper teams only).
const HEADLINE_PREFIX = {
  cfb: /^college football playoff/i,
  cbb: /^ncaa men's basketball championship/i,
};

// Best-of-N leagues read the series win count directly; everything else is single-elimination.
const SERIES_LEAGUES = new Set(['mlb', 'nba', 'nhl']);

const PLAYOFF_LEAGUE_PATH = {
  mlb: 'baseball/mlb', nba: 'basketball/nba', nhl: 'hockey/nhl',
  nfl: 'football/nfl', cfb: 'football/college-football', cbb: 'basketball/mens-college-basketball',
};

function matchRound(league, headline) {
  if (!headline) return null;
  const prefix = HEADLINE_PREFIX[league];
  if (prefix && !prefix.test(headline)) return null;
  const hit = (PLAYOFF_ROUNDS[league] || []).find((p) => p.re.test(headline));
  return hit ? hit.round : null;
}

function ymd(d) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

async function fetchScoreboardDay(path, day, seasontype) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${day}` +
    (seasontype ? `&seasontype=${seasontype}` : '');
  try {
    const data = await fetchJSON(url);
    return data?.events || [];
  } catch {
    return [];
  }
}

// ESPN's multi-day `dates=A-B` range is unreliable across sports (400s for some), so walk
// individual days instead and merge, deduped by event id. Wide window on purpose — a
// missed cron tick or a slow round just means the next run still sees everything.
async function fetchScoreboardWindow(path, { seasontype, daysBack = 10, daysForward = 2, now = new Date() } = {}) {
  const days = [];
  for (let i = -daysBack; i <= daysForward; i++) days.push(ymd(new Date(+now + i * 864e5)));
  const results = await Promise.all(days.map((d) => fetchScoreboardDay(path, d, seasontype)));
  const byId = new Map();
  results.flat().forEach((e) => byId.set(e.id, e));
  return [...byId.values()];
}

// Rough calendar windows so the 15-min cron doesn't burn ~12 ESPN calls per league
// year-round. Deliberately generous — being a little early/late just costs a few no-op
// calls, never missed data.
export function isLeagueInPlayoffWindow(league, now = new Date()) {
  const m = now.getUTCMonth() + 1;
  switch (league) {
    case 'mlb': return m === 9 || m === 10 || m === 11;
    case 'nba': return m === 4 || m === 5 || m === 6;
    case 'nhl': return m === 4 || m === 5 || m === 6;
    case 'nfl': return m === 1 || m === 2;
    case 'cfb': return m === 12 || m === 1;
    case 'cbb': return m === 3 || m === 4;
    default: return false;
  }
}

// Build { teamId: { wins:[...], eliminated, league } } for one league's current bracket
// state. Safe to call repeatedly — later runs just refine/overwrite the same picture as
// more games complete; a team's wins/eliminated only ever move toward "more decided".
// `now`/`daysBack` are exposed only so tests/debugging can validate against a past
// postseason window; production calls always use the real current date and the
// default 10-day lookback (a live cron only needs to see the current round).
export async function getPlayoffBracket(league, { now = new Date(), daysBack = 10 } = {}) {
  const path = PLAYOFF_LEAGUE_PATH[league];
  if (!path) throw new Error(`unknown playoff league ${league}`);
  const map = TEAM_ID_MAP[league] || {};
  const roundCount = (PLAYOFF_ROUNDS[league] || []).reduce((m, p) => Math.max(m, p.round + 1), 4);
  const seasontype = SERIES_LEAGUES.has(league) || league === 'nfl' ? 3 : undefined;

  const events = await fetchScoreboardWindow(path, { seasontype, now, daysBack, daysForward: 2 });

  const out = {};
  const unmatched = new Set();
  const ensure = (id) => (out[id] ||= { wins: Array(roundCount).fill(0), eliminated: false, league });
  const idOf = (c) => map[(c.team?.abbreviation || '').toUpperCase()] || null;

  for (const e of events) {
    const comp = e.competitions?.[0];
    if (!comp) continue;
    const headline = comp.notes?.[0]?.headline || e.name || '';
    const round = matchRound(league, headline);
    if (round == null) continue;

    const competitors = comp.competitors || [];
    if (competitors.length < 2) continue;
    competitors.forEach((c) => { if (!idOf(c)) unmatched.add(c.team?.abbreviation || c.team?.displayName); });

    if (SERIES_LEAGUES.has(league) && comp.series?.competitors?.length === 2) {
      const winsNeeded = Math.ceil((comp.series.totalCompetitions || 7) / 2);
      const seriesDone = !!comp.series.completed;
      for (const sc of comp.series.competitors) {
        const topComp = competitors.find((c) => String(c.team?.id) === String(sc.id));
        const id = topComp && idOf(topComp);
        if (!id) continue;
        if ((sc.wins || 0) >= winsNeeded) ensure(id).wins[round] = 1;
        else if (seriesDone) ensure(id).eliminated = true;
      }
    } else if (comp.status?.type?.completed) {
      for (const c of competitors) {
        const id = idOf(c);
        if (!id) continue;
        if (c.winner === true) ensure(id).wins[round] = 1;
        else if (c.winner === false) ensure(id).eliminated = true;
      }
    }
  }

  return { bracket: out, unmatched: [...unmatched] };
}

function num(v) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && !isNaN(n) ? n : null;
}

function parseScore(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim().toUpperCase();
  if (s === 'E') return 0;
  const n = parseInt(s.replace('+', ''), 10);
  return isNaN(n) ? null : n;
}

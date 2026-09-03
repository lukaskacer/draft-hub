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

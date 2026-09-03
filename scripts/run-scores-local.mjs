// Run the score ingester once from your machine.
//
//   1. Put FIREBASE_SERVICE_ACCOUNT and FIREBASE_DB_URL in .env
//   2. npm run scores            # full run (standings + golf)
//      npm run scores -- nfl     # standings for one league
//
import fs from 'node:fs';
import handler from '../netlify/functions/update-scores.mjs';

// minimal .env loader (no dependency)
try {
  for (const line of fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* no .env — rely on real env vars */ }

const league = process.argv[2];
const qs = league ? `?type=standings&league=${league}` : '';
const res = await handler(new Request(`http://local/.netlify/functions/update-scores${qs}`));
console.log(res.status, JSON.stringify(await res.json(), null, 2));
process.exit(0);

// A poster for each of the four product promos (src/promo/saas, through scripts/cv/promos): a JPEG of its first
// chapter, 1280 × 720, which the CV page shows until its promo plays (live, src/promo/Promo.tsx) and the visual PDF
// prints. Run it when a promo changes:  node scripts/cv/render-promos.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROMO_CHAPTERS } from './promos/chapters.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const OUT = resolve(ROOT, 'public/cv/promo');
const ENTRY = 'scripts/cv/promos/index.ts';
mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
for (const [id, { chapters }] of Object.entries(PROMO_CHAPTERS)) {
  if (only.length && !only.includes(id)) continue;
  const run = (...args) => execFileSync('npx', ['remotion', ...args], { cwd: ROOT, stdio: 'inherit' });
  run('still', ENTRY, id, `${OUT}/${id}.jpg`, `--frame=${chapters[0][1] + 90}`, '--scale=0.6667', '--image-format=jpeg', '--jpeg-quality=82');
}

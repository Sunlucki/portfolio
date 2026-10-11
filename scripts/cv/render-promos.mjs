// The four product promos (src/promo/saas, through scripts/cv/promos) as small MP4s for the CV page's project cards:
// 1280 × 720, muted (they play muted on the page), H.264, plus a JPEG poster from each one's first chapter, which the
// visual PDF prints. Slow (minutes per promo); run it only when a promo changes:  node scripts/cv/render-promos.mjs
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
  run('render', ENTRY, id, `${OUT}/${id}.mp4`, '--scale=0.6667', '--muted', '--codec=h264', '--crf=30', '--pixel-format=yuv420p', '--concurrency=4', '--x264-preset=slow');
}

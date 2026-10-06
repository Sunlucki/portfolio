// Caveat for the site's two handwritten words (About's "Why?" over the handle and the word the hero's finger writes),
// in every language: just their letters, so a phone fetches a few kB instead of Caveat's whole alphabets (some 50 kB
// each). Cut from @fontsource/caveat's pieces (Latin, Latin Extended, Cyrillic...), each into a piece of its own with
// its letters, keeping its features (the hand's alternates); writes src/fonts/caveat-*.woff2 and src/fonts/caveat.css
// (main.tsx). Run it again when those words change in src/i18n.
// Usage: node scripts/prepare-caveat.mjs    (needs a python3 with fonttools and brotli)
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const LANGS = ['en', 'ru', 'uk', 'pl', 'de', 'it', 'fr'];
const FROM = 'node_modules/@fontsource/caveat';
const OUT = 'src/fonts';

const copies = await Promise.all(LANGS.map((lang) => import(`../src/i18n/${lang}.ts`)));
const letters = [...new Set(copies.flatMap(({ default: t }) => [...t.about.hint, ...t.hero.swipe]))].sort().join('');
const ranges = (range) => range.split(',').map((part) => part.trim().replace('U+', '').split('-').map((hex) => parseInt(hex, 16)));
const inRange = (range, ch) => ranges(range).some(([from, to = from]) => ch.codePointAt(0) >= from && ch.codePointAt(0) <= to);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const faces = [];
// each piece of the 700 weight, with the letters of ours it holds
for (const [, piece, range] of readFileSync(`${FROM}/700.css`, 'utf8').matchAll(/files\/caveat-([a-z-]+)-700-normal\.woff2[^;]*;\s*unicode-range: ([^;]+);/g)) {
  const text = [...letters].filter((ch) => inRange(range, ch)).join('');
  if (!text) continue;
  const file = `caveat-${piece}.woff2`;
  const run = spawnSync('python3', ['-m', 'fontTools.subset', `${FROM}/files/caveat-${piece}-700-normal.woff2`, `--text=${text}`, '--layout-features=*', '--flavor=woff2', `--output-file=${OUT}/${file}`], { stdio: 'inherit' });
  if (run.status !== 0) throw new Error(`fonttools failed on ${piece}`);
  faces.push(`@font-face {\n  font-family: 'Caveat';\n  font-style: normal;\n  font-display: swap;\n  font-weight: 700;\n  src: url(./${file}) format('woff2');\n  unicode-range: ${range};\n}`);
  console.log(piece, JSON.stringify(text), readFileSync(`${OUT}/${file}`).length, 'bytes');
}
writeFileSync(`${OUT}/caveat.css`, `/* Caveat 700, only the letters of the handwritten words: written by scripts/prepare-caveat.mjs */\n${faces.join('\n')}\n`);

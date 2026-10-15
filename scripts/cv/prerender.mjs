// After `vite build`: writes the CV's words into its built pages (dist/cv/index.html, dist/ru/cv/index.html and so
// on), so they read without JavaScript (CV parsers, AI screeners, link previews). Each page is opened in headless
// Chrome from dist, with reduced motion (the numbers then show their values at once), and what React drew into #root
// is saved into the page's HTML; in the browser React draws it again over that (src/cv/main.tsx).
//   node scripts/cv/prerender.mjs        (npm run build runs it)
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { LANGS, langPath } from '../../src/i18n/langs.ts';

const DIST = resolve(import.meta.dirname, '../../dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

// dist, served as nginx serves it (a folder's index.html)
const server = createServer((req, res) => {
  let file = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const origin = `http://127.0.0.1:${server.address().port}`;

const profile = join(tmpdir(), `cv-prerender-${process.pid}`);
const port = 9740 + Math.floor(Math.random() * 40);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
try {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    try {
      target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    } catch {
      await sleep(200);
    }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let seq = 0;
  const waiting = new Map();
  ws.addEventListener('message', (m) => {
    const msg = JSON.parse(m.data);
    waiting.get(msg.id)?.(msg);
  });
  const send = (method, params = {}) =>
    new Promise((ok, fail) => {
      const id = ++seq;
      waiting.set(id, (msg) => (msg.error ? fail(new Error(`${method}: ${msg.error.message}`)) : ok(msg.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  // at /cv/ the page goes by the visitor's language: here, English
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "try { localStorage.setItem('lang', 'en') } catch {}" });
  for (const lang of LANGS) {
    const path = `${langPath(lang)}cv/`;
    await send('Page.navigate', { url: origin + path });
    const { result } = await send('Runtime.evaluate', {
      expression: `new Promise((ok) => { const t0 = Date.now(); const look = () => document.querySelector('[data-cv-ready]') ? document.fonts.ready.then(() => setTimeout(() => ok(document.getElementById('root').innerHTML), 400)) : Date.now() - t0 > 15000 ? ok('') : setTimeout(look, 100); look(); })`,
      awaitPromise: true,
      returnByValue: true,
    });
    const html = result.value;
    if (!html || !html.includes('id="experience"')) throw new Error(`prerender: ${path} did not draw`);
    const file = join(DIST, path, 'index.html');
    writeFileSync(file, readFileSync(file, 'utf8').replace('<div id="root"></div>', `<div id="root">${html}</div>`));
    console.log(`prerendered ${path} (${Math.round(html.length / 1024)} KB)`);
  }
  ws.close();
} finally {
  chrome.kill();
  server.close();
  await sleep(400);
  rmSync(profile, { recursive: true, force: true });
}

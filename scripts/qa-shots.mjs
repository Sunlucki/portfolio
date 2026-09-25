// Visual QA: drives headless Chrome over the DevTools protocol and captures the page at key
// scroll positions on desktop and mobile. Usage: node scripts/qa-shots.mjs <outDir> [url]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const OUT = process.argv[2] ?? './qa';
const URL = process.argv[3] ?? 'http://localhost:5199/';
const PORT = 9333;
mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${OUT}/.profile`, '--hide-scrollbars', '--no-first-run', 'about:blank'],
  { stdio: 'ignore' },
);

async function devtools(path, method = 'GET') {
  for (let i = 0; i < 60; i++) {
    try {
      return await (await fetch(`http://127.0.0.1:${PORT}${path}`, { method })).json();
    } catch {
      await sleep(200);
    }
  }
  throw new Error('DevTools endpoint not reachable');
}

const target = await devtools('/json/new?about:blank', 'PUT');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));

let seq = 0;
const pending = new Map();
const problems = [];
ws.addEventListener('message', (message) => {
  const msg = JSON.parse(message.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    problems.push(`exception: ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
  } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    problems.push(`log: ${msg.params.entry.text} ${msg.params.entry.url ?? ''}`);
  } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    problems.push(`console: ${msg.params.args.map((a) => a.value ?? a.description).join(' ')}`);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;

async function shoot(name, { width, height, dpr, mobile }) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  await send('Page.navigate', { url: URL });
  await sleep(4000);
  const a = await evaluate(`(() => {
    const top = (s) => { const el = document.querySelector(s); return el ? Math.round(el.getBoundingClientRect().top + scrollY) : null; };
    return { heroEnd: document.querySelector('#top').offsetHeight - innerHeight, marquee: top('section[aria-label="Selected screens"]'),
      about: top('#about'), services: top('#services'), projects: top('#projects'), contact: top('#contact'),
      docH: document.documentElement.scrollHeight, innerH: innerHeight, overflowX: document.documentElement.scrollWidth > innerWidth };
  })()`);
  const stops = [
    ['01-hero-0', 0], ['02-hero-15', a.heroEnd * 0.15], ['03-hero-35', a.heroEnd * 0.35], ['04-hero-60', a.heroEnd * 0.6],
    ['05-hero-85', a.heroEnd * 0.85], ['06-hero-end', a.heroEnd], ['07-marquee', a.marquee - 100], ['08-about', a.about],
    ['09-about-mid', a.about + a.innerH * 0.5], ['10-services', a.services], ['11-services-2', a.services + a.innerH],
    ['12-projects', a.projects], ['13-projects-2', a.projects + a.innerH], ['14-projects-3', a.projects + a.innerH * 2.5],
    ['15-projects-4', a.projects + a.innerH * 4], ['16-contact', a.contact], ['17-bottom', a.docH - a.innerH],
  ];
  for (const [label, y] of stops) {
    await evaluate(`window.scrollTo({ top: ${Math.round(y)}, behavior: 'instant' })`);
    await sleep(1000);
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
    writeFileSync(`${OUT}/${name}-${label}.jpg`, Buffer.from(data, 'base64'));
  }
  return a;
}

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  const desktop = await shoot('desktop', { width: 1440, height: 900, dpr: 1, mobile: false });
  const mobile = await shoot('mobile', { width: 390, height: 844, dpr: 2, mobile: true });
  console.log(JSON.stringify({ desktop, mobile, problems }, null, 2));
} finally {
  ws.close();
  chrome.kill();
}

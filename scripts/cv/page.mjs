// The CV page (public/cv/index.html), and the same page printed as the visual PDF. A CV first (a head with the
// portrait, the facts and the numbers; experience on a timeline; everything scannable in a minute), drawn with the
// site's own craft: section titles with the first letter in a design tool's selection box, the delivery steps as the
// site's numbered service rows on a white sheet, projects as cards with their real screens, skills as the stack's
// folders, numbers that count up. Long details are folded on screen and all open in the PDF, where every address
// and section is still a button. The words are data.mjs's, the same as in the one-column ATS PDF, the Markdown and
// the JSON Resume.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const month = (ym) => {
  const [y, m] = ym.split('-');
  return `${MONTHS[+m - 1]} ${y}`;
};
const span = ({ start, end }) => (end === start ? `${month(start)} (1 month)` : `${month(start)} – ${end ? month(end) : 'present'}`);
const byRecency = (a, b) => (b.end ?? '9999').localeCompare(a.end ?? '9999') || b.start.localeCompare(a.start);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const host = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const two = (i) => String(i + 1).padStart(2, '0');

// text with its figures picked out (not years, not versions after a name) and hyphenated words kept whole
const txt = (s) =>
  esc(s)
    .replace(/(?<![\p{L}\p{N}.\-/])(?<!KSeF |v|SDK |Next\.js |Socket\.IO v|AES-)(\d(?:[\d,.]*\d)?(?:K|\+|%)?)(?![\p{L}\p{N}])/gu, (m) => (/^(19|20)\d\d$/.test(m) ? m : `<b class="n">${m}</b>`))
    .replace(/([\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+)/gu, '<span class="nw">$1</span>');
// a point with its subject (up to its first colon) in bold
const point = (s) => {
  const i = s.indexOf(': ');
  return i > 0 && i < 90 ? `<b class="k">${txt(s.slice(0, i))}:</b> ${txt(s.slice(i + 2))}` : txt(s);
};
// a section title as the site draws its own: heavy capitals, the first letter selected as in a design tool
const title = (text) => `<span class="tt" aria-hidden="true"><span class="tt-l">${esc(text[0])}</span><i class="h tl"></i><i class="h tr"></i><i class="h bl"></i><i class="h br"></i><i class="dim"></i></span><span class="tt-rest" aria-hidden="true">${esc(text.slice(1))}</span><span class="sr">${esc(text)}</span>`;

// the portfolio's own screens of each project (public/work), the site's gallery: two stacked, one tall
// (TAXI BOSS's third web screen is blank, so its driver app stands in)
const shots = (name) => [1, 2, 3].map((n) => `${name}-${n}`);
const SHOTS = { 'SIMBIA CRM': shots('simbia'), 'B2B Commerce Platform': shots('b2b'), PROTECTDENT: shots('protectdent'), 'iApply Workforce': shots('iapply'), 'TAXI BOSS': ['taxiboss-1', 'taxiboss-2', 'app-taxi-0'], 'spin.clinic design system': shots('spin') };

const SECTIONS = [
  ['summary', 'Summary'],
  ['delivery', 'How I deliver'],
  ['experience', 'Experience'],
  ['projects', 'Projects'],
  ['fit', 'Role fit'],
  ['skills', 'Skills'],
];

export function page({ cv, PDF, ATS, PHONE, URL_CV, jsonLd }) {
  const { person } = cv;
  const s = cv.summaryParts;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(person.name)} · CV · ${esc(person.headline)} (AI-assisted SDLC)</title>
<meta name="description" content="${esc(`${person.name}, ${person.headline.toLowerCase()} in Poznań, Poland. ${cv.numbers[0].value} ${cv.numbers[0].label}; AI-assisted SDLC with Claude Code and Codex.`)}">
<meta name="author" content="${esc(person.name)}">
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${URL_CV}">
<link rel="alternate" type="text/plain" href="cv.txt" title="This CV as plain text (Markdown)">
<link rel="alternate" type="application/json" href="resume.json" title="This CV as JSON Resume">
<link rel="alternate" type="application/pdf" href="${esc(PDF)}" title="This CV as PDF">
<link rel="alternate" type="application/pdf" href="${esc(ATS)}" title="This CV as a one-column PDF for applicant tracking systems">
<meta name="theme-color" content="#0C0C0C">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
:root {
  --bg: #0c0c0c; --panel: #111216; --edge: rgb(85 87 94 / 0.5); --line: rgb(215 226 234 / 0.12);
  --text: #d7e2ea; --muted: rgb(215 226 234 / 0.66); --head: #bbccd7; --accent: #7fb0ff; --blue: #1261d6; --night: #040b1c;
  --cta: linear-gradient(123deg, #18011f 7%, #b600a8 37%, #7621b0 72%, #be4c00 100%);
  --heading: linear-gradient(180deg, #646973 0%, #bbccd7 100%);
  --ease: cubic-bezier(0.23, 1, 0.32, 1); --spring: cubic-bezier(0.34, 1.57, 0.64, 1);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--bg); color-scheme: dark; scroll-behavior: smooth; scroll-padding-top: 76px; }
body { font: 400 16.5px/1.6 Kanit, system-ui, sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
a { color: inherit; }
img { display: block; max-width: 100%; }
.wrap { max-width: 1200px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.skip { position: absolute; left: -999px; }
.skip:focus { left: 16px; top: 16px; z-index: 9; background: var(--text); color: var(--bg); padding: 8px 14px; border-radius: 999px; }
.nw { white-space: nowrap; }
.n, .k { font-weight: 600; color: #fff; }
.print-only { display: none; }
.label { display: block; text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.72rem; color: var(--muted); margin-bottom: 8px; font-weight: 500; }
.grad { background: var(--heading); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

/* the bar on top: the sections as buttons, the one on screen lit */
.topnav { position: sticky; top: 0; z-index: 5; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: rgb(12 12 12 / 0.78); border-bottom: 1px solid var(--line); }
.topnav .wrap { display: flex; align-items: center; gap: 14px; height: 60px; }
.topnav .mono { font-weight: 900; letter-spacing: 0.04em; text-decoration: none; color: var(--head); }
.secnav { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; flex: 1; -webkit-mask-image: linear-gradient(90deg, #000 85%, transparent); mask-image: linear-gradient(90deg, #000 85%, transparent); }
.secnav a { font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.14em; text-decoration: none; color: var(--muted); white-space: nowrap; padding: 7px 12px; border-radius: 999px; transition: color 0.2s, background 0.2s; }
.secnav a:hover { color: var(--text); background: rgb(215 226 234 / 0.08); }
.secnav a.on { color: var(--bg); background: var(--text); }

/* buttons */
.btn { display: inline-flex; align-items: center; gap: 8px; border: 2px solid var(--text); border-radius: 999px; padding: 9px 18px; font-size: 0.78rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; white-space: nowrap; transition: background 0.2s, transform 0.3s var(--spring); }
.btn:hover { background: rgb(215 226 234 / 0.1); transform: translateY(-2px); }
.btn.cta { border: 0; color: #fff; background: var(--cta); outline: 2px solid #fff; outline-offset: -3px; box-shadow: 0 4px 4px rgb(181 1 167 / 0.25), 4px 4px 12px #7721b1 inset; padding: 11px 22px; }
.btn.small { padding: 6px 13px; font-size: 0.7rem; border-width: 1.5px; }
/* addresses as written, so they copy whole (spaced capitals come out of a PDF as single letters) */
.btn.addr { text-transform: none; letter-spacing: 0; font-size: 0.86rem; border-width: 1.5px; }
.chip { display: inline-flex; align-items: center; border: 1px solid rgb(215 226 234 / 0.26); border-radius: 999px; padding: 3px 11px; font-size: 0.8rem; color: rgb(215 226 234 / 0.9); font-family: inherit; background: none; }
button.chip { cursor: pointer; transition: background 0.2s, color 0.2s; }
button.chip[aria-pressed="true"] { background: var(--text); color: var(--bg); border-color: var(--text); }

/* tiles, lit where the pointer is */
.tile { position: relative; background: radial-gradient(420px circle at var(--mx, -999px) var(--my, -999px), rgb(127 176 255 / 0.09), transparent 45%), var(--panel); border: 1.5px solid var(--edge); border-radius: 24px; padding: 22px 24px; min-width: 0; }
.tile h3 { font-weight: 600; font-size: 1.12rem; line-height: 1.3; color: #fff; }
.slats { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='46'%3E%3Crect x='4' y='4' width='10' height='38' rx='5' fill='%231261d6'/%3E%3C/svg%3E"); opacity: 0.55; -webkit-mask-image: radial-gradient(ellipse 60% 90% at 100% 0%, #000, transparent 75%); mask-image: radial-gradient(ellipse 60% 90% at 100% 0%, #000, transparent 75%); animation: drift 18s linear infinite; }
@keyframes drift { to { background-position: 0 -460px; } }

/* section titles: the first letter outlined in a selection box, its handles and its size, as on the site */
section { padding: 88px 0 0; }
.sec-head { display: flex; align-items: end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
h2.title { font-weight: 900; text-transform: uppercase; color: var(--head); font-size: clamp(2.3rem, 5.4vw, 4.4rem); line-height: 0.92; letter-spacing: -0.01em; display: flex; align-items: flex-end; }
.tt { position: relative; display: inline-block; margin: 0 0.08em 0 0.04em; }
.tt-l { color: transparent; -webkit-text-stroke: 1.5px var(--accent); }
.tt::before { content: ''; position: absolute; inset: 0.08em -0.06em 0 -0.06em; border: 1px solid rgb(127 176 255 / 0.55); }
.tt .h { position: absolute; width: 6px; height: 6px; background: var(--bg); border: 1px solid var(--accent); }
.tt .tl { left: calc(-0.06em - 3px); top: calc(0.08em - 3px); } .tt .tr { right: calc(-0.06em - 3px); top: calc(0.08em - 3px); }
.tt .bl { left: calc(-0.06em - 3px); bottom: -3px; } .tt .br { right: calc(-0.06em - 3px); bottom: -3px; }
.tt .dim { position: absolute; left: -0.06em; top: -0.12em; transform: translateY(-100%); font: 500 10px/1 Kanit, sans-serif; letter-spacing: 0.06em; color: var(--accent); white-space: nowrap; font-style: normal; }
.sub { color: var(--muted); text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.76rem; max-width: 46ch; }

/* the head: who, the portrait, how to reach me, the numbers */
header.hero { padding-top: 28px; }
.head { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; }
.who { background: radial-gradient(120% 140% at 85% 0%, rgb(18 97 214 / 0.42), transparent 60%), var(--night); border-color: rgb(127 176 255 / 0.35); overflow: hidden; padding: 30px 32px; display: flex; flex-direction: column; gap: 22px; }
.who > * { position: relative; }
h1.name { font-weight: 900; text-transform: uppercase; line-height: 0.88; letter-spacing: -0.01em; font-size: clamp(2.8rem, 7.2vw, 6.2rem); }
h1.name span { display: block; }
.role { font-size: clamp(1.02rem, 2vw, 1.35rem); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #fff; }
.focus { color: var(--accent); margin-top: 2px; }
.facts { list-style: none; display: grid; grid-template-columns: repeat(3, auto); gap: 8px 22px; justify-content: start; font-size: 0.92rem; }
.facts li { display: flex; gap: 8px; align-items: flex-start; }
.facts svg { flex: none; width: 17px; height: 17px; margin-top: 3px; stroke: var(--accent); fill: none; stroke-width: 1.8; }
.contacts { display: flex; flex-wrap: wrap; gap: 8px; }
.portrait { padding: 0; overflow: hidden; }
.portrait img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s var(--ease); }
.portrait:hover img { transform: scale(1.04); }
.badge { position: absolute; left: 14px; bottom: 14px; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgb(12 12 12 / 0.7); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.1em; }
.badge::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #3ddc84; box-shadow: 0 0 0 0 rgb(61 220 132 / 0.6); animation: ping 2s infinite; }
@keyframes ping { 70% { box-shadow: 0 0 0 8px rgb(61 220 132 / 0); } 100% { box-shadow: 0 0 0 0 rgb(61 220 132 / 0); } }
.stats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; margin-top: 14px; }
.stat { display: flex; flex-direction: column; gap: 10px; background: linear-gradient(160deg, rgb(255 255 255 / 0.05), rgb(255 255 255 / 0.01)), var(--panel); }
.stat .value small { font-size: 0.5em; font-weight: 600; }
.stat .value { font-weight: 900; font-size: clamp(1.7rem, 2.9vw, 2.5rem); line-height: 1; white-space: nowrap; font-variant-numeric: tabular-nums; }
.stat .what { color: var(--muted); font-size: 0.84rem; line-height: 1.35; }

/* summary */
.bento { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 14px; }
.s4 { grid-column: span 4; } .s5 { grid-column: span 5; } .s6 { grid-column: span 6; } .s7 { grid-column: span 7; } .s12 { grid-column: span 12; }
.lead { font-size: clamp(1.4rem, 2.8vw, 2.2rem); line-height: 1.25; font-weight: 500; color: #fff; max-width: 30ch; }
.built { list-style: none; display: grid; gap: 10px; margin-top: 12px; }
.built li { display: grid; grid-template-columns: 30px 1fr; gap: 6px; }
.built .i { font-weight: 800; color: var(--accent); }

/* how I deliver: the site's numbered service rows, on a white sheet */
.sheet { background: #fff; color: #0c0c0c; border-radius: 48px; padding: 72px 0 56px; margin-top: 88px; }
.sheet section { padding: 0; }
.sheet h2.title { color: #0c0c0c; }
.sheet .tt-l { -webkit-text-stroke-color: var(--blue); }
.sheet .tt::before { border-color: rgb(18 97 214 / 0.55); }
.sheet .tt .h { background: #fff; border-color: var(--blue); }
.sheet .tt .dim { color: var(--blue); }
.sheet .sub { color: rgb(12 12 12 / 0.55); }
.sheet .n, .sheet .k { color: #0c0c0c; }
.rows { list-style: none; display: grid; grid-template-columns: 1fr 1fr; column-gap: 56px; }
.rows li { display: flex; gap: 22px; align-items: flex-start; padding: 26px 0; border-top: 1px solid rgb(12 12 12 / 0.14); }
.rows .num { flex: none; width: 1.25em; font-weight: 900; line-height: 0.85; font-size: clamp(2.8rem, 6vw, 5.2rem); color: #0c0c0c; transition: color 0.3s; }
.rows li:hover .num { color: var(--blue); }
.rows h3 { font-weight: 500; text-transform: uppercase; font-size: clamp(1rem, 1.6vw, 1.3rem); letter-spacing: 0.02em; }
.rows p { margin-top: 6px; color: rgb(12 12 12 / 0.68); font-size: 0.95rem; }
.light-tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 26px; }
.light-tiles .tile { background: #f2f4f7; border: 0; color: #1d2026; }
.light-tiles .tile.wide { grid-column: span 2; background: none; border: 1.5px dashed rgb(12 12 12 / 0.2); }
.light-tiles .label { color: rgb(12 12 12 / 0.5); }

/* experience: a timeline, newest first */
.timeline { list-style: none; position: relative; display: grid; gap: 14px; }
.timeline::before { content: ''; position: absolute; left: 170px; top: 8px; bottom: 8px; width: 2px; background: linear-gradient(180deg, var(--accent), rgb(127 176 255 / 0.05)); }
.job { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 40px; align-items: start; }
.job .when { padding-top: 22px; text-align: right; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
.job .when b { display: block; font-size: 1.6rem; font-weight: 900; letter-spacing: 0; color: var(--head); line-height: 1.1; }
.job .tile { position: relative; }
.job .tile::before { content: ''; position: absolute; left: -29px; top: 28px; width: 12px; height: 12px; border-radius: 50%; background: var(--bg); border: 2px solid var(--accent); }
.job.now .tile::before { background: var(--accent); box-shadow: 0 0 0 5px rgb(127 176 255 / 0.18); }
.job .org { color: var(--muted); font-size: 0.92rem; margin: 2px 0 8px; }
.job .org a { color: var(--accent); text-decoration: none; }
.job p.text { font-size: 0.96rem; max-width: 75ch; }

/* projects: cards with their real screens */
.filters { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 8px; }
.filter-note { color: var(--muted); font-size: 0.85rem; min-height: 1.4em; margin-bottom: 8px; }
.projects { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.project { border: 2px solid rgb(215 226 234 / 0.75); border-radius: 36px; padding: 22px; display: flex; flex-direction: column; gap: 14px; background: var(--bg); transition: opacity 0.3s, border-color 0.3s, transform 0.5s var(--ease); }
.project:hover { transform: translateY(-4px); }
.project.dim { opacity: 0.25; }
.project.hit { border-color: var(--accent); }
.project .top { display: flex; gap: 16px; align-items: center; }
.project .no { font-weight: 900; line-height: 0.9; font-size: clamp(2.6rem, 4.6vw, 4rem); flex: none; }
.project .status { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); }
.project h3 { font-weight: 500; text-transform: uppercase; font-size: clamp(1.15rem, 1.9vw, 1.55rem); line-height: 1.15; color: var(--text); }
.gallery { display: grid; grid-template-columns: 2fr 3fr; gap: 10px; height: 230px; }
.gallery .col { display: grid; grid-template-rows: 1fr 1fr; gap: 10px; min-height: 0; }
.gallery img { width: 100%; height: 100%; object-fit: cover; object-position: left top; border-radius: 18px; background: #1a1c22; transition: transform 0.8s var(--ease); }
.gallery a, .gallery span { display: block; min-height: 0; overflow: hidden; border-radius: 18px; }
.gallery a:hover img { transform: scale(1.05); }
.project .foot { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.metric { font-size: 0.76rem; border-radius: 999px; padding: 3px 10px; background: rgb(127 176 255 / 0.12); color: var(--accent); white-space: nowrap; }
.open { margin-left: auto; }
details summary { cursor: pointer; list-style: none; display: inline-flex; align-items: center; gap: 8px; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); }
details summary::-webkit-details-marker { display: none; }
details summary::before { content: '+'; display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--edge); font-size: 0.9rem; letter-spacing: 0; transition: transform 0.3s; }
details[open] summary::before { content: '–'; }
details[open] summary { margin-bottom: 10px; }
.bullets { list-style: none; display: grid; gap: 9px; font-size: 0.94rem; }
.bullets li { position: relative; padding-left: 18px; }
.bullets li::before { content: ''; position: absolute; left: 0; top: 0.66em; width: 7px; height: 7px; border-radius: 50%; background: var(--cta); }
.also { color: var(--muted); margin-top: 18px; padding: 16px 22px; border: 1.5px dashed var(--edge); border-radius: 24px; }

/* role fit */
.fit { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.fit .tile { padding: 18px 22px; }
.fit h3 { font-size: 1.02rem; margin-bottom: 4px; }
.fit p { font-size: 0.93rem; }

/* skills: the stack's folders, the tools sprung out of them as notes */
.folders { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px 18px; padding-top: 14px; }
.folder { position: relative; padding-top: 14px; }
.folder .back { position: relative; border-radius: 16px; background: #0e2a66; padding: 18px 16px 92px; min-height: 100%; }
.folder .back::before { content: ''; position: absolute; top: -14px; left: 0; width: 42%; height: 30px; border-radius: 16px 16px 0 0; background: inherit; }
.notes { list-style: none; position: relative; display: flex; flex-wrap: wrap; gap: 6px; }
.notes li { background: #eef4ff; color: #0b1426; border-radius: 8px; padding: 4px 9px; font-size: 0.8rem; font-weight: 500; line-height: 1.3; box-shadow: 0 2px 6px rgb(0 0 0 / 0.25); transform: rotate(var(--r, 0deg)); transition: transform 0.45s var(--spring); }
.folder:hover .notes li { transform: translateY(-4px) rotate(0deg); }
.folder .front { position: absolute; left: 0; right: 0; bottom: 0; height: 80px; border-radius: 16px; padding: 14px 16px; display: flex; flex-direction: column; justify-content: flex-end; gap: 4px; color: #f2f7ff; background: linear-gradient(180deg, #3d73d6, #1a56c4 60%); box-shadow: 0 -10px 24px rgb(0 0 0 / 0.28); transform: perspective(600px) rotateX(-10deg); transform-origin: 50% 100%; transition: transform 0.5s var(--ease); }
.folder:hover .front { transform: perspective(600px) rotateX(-24deg); }
.folder .front b { font-weight: 500; font-size: 1rem; }
.folder .front span { font-size: 0.78rem; opacity: 0.6; }
.edu { display: flex; flex-direction: column; justify-content: center; gap: 14px; }

footer { margin-top: 88px; padding: 24px 0 48px; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.85rem; }
footer p + p { margin-top: 8px; }
footer .consent { font-size: 0.74rem; }

/* parts come in as they scroll in, one after another */
html.js .rv { opacity: 0; transform: translateY(26px); transition: opacity 0.7s var(--ease), transform 0.7s var(--ease); transition-delay: var(--d, 0s); }
html.js .rv.in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { html.js .rv { opacity: 1; transform: none; transition: none; } html { scroll-behavior: auto; } .slats, .badge::before { animation: none; } }

@media screen and (max-width: 1040px) {
  .head { grid-template-columns: minmax(0, 1fr) 240px; }
  .facts { grid-template-columns: 1fr; }
  .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .rows { grid-template-columns: 1fr; }
  .projects, .fit { grid-template-columns: 1fr; }
  .folders { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .s4, .s5, .s6, .s7 { grid-column: span 12; }
}
@media screen and (max-width: 680px) {
  .wrap { padding-left: 16px; padding-right: 16px; }
  .head { grid-template-columns: 1fr; }
  .portrait { order: -1; aspect-ratio: 4 / 3; }
  .who { padding: 22px; }
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .tile { padding: 18px; border-radius: 20px; }
  section { padding-top: 64px; }
  .sheet { border-radius: 32px; padding: 52px 0 40px; margin-top: 64px; }
  .rows li { gap: 14px; padding: 20px 0; }
  .light-tiles { grid-template-columns: 1fr; } .light-tiles .tile.wide { grid-column: auto; }
  .timeline::before { left: 5px; }
  .job { grid-template-columns: 1fr; gap: 6px; padding-left: 26px; }
  .job .when { text-align: left; padding-top: 0; }
  .job .when b { display: inline; font-size: 1.1rem; margin-right: 8px; }
  .job .tile::before { left: -27px; top: -24px; }
  .project { border-radius: 26px; padding: 16px; }
  .gallery { height: 170px; }
  .folders { grid-template-columns: 1fr; }
}

/* the visual PDF: the page on A4, every fold open, parts kept whole, the buttons still links */
@page { size: A4; margin: 0; }
@media print {
  html, body { background: var(--bg); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-size: 8.6pt; line-height: 1.42; }
  .page-pad { padding: 9mm 9mm 6mm; }
  .wrap { max-width: none; padding-left: 0; padding-right: 0; }
  .topnav { position: static; backdrop-filter: none; background: none; border: 0; margin-bottom: 6pt; }
  .topnav .wrap { height: auto; }
  .secnav { overflow: visible; flex-wrap: wrap; -webkit-mask-image: none; mask-image: none; }
  .secnav a { border: 1px solid var(--edge); color: var(--text); padding: 3pt 8pt; font-size: 6.6pt; }
  .secnav a.on { background: none; color: var(--text); }
  .noprint, .filters, .filter-note, .skip, .badge { display: none !important; }
  .print-only { display: block; }
  html.js .rv { opacity: 1 !important; transform: none !important; }
  .slats { animation: none; }
  /* Chrome's PDF outlines text clipped to a gradient: plain light grey instead */
  .grad { background: none; -webkit-text-fill-color: #c4d2dc; }
  .tile { padding: 9pt 11pt; border-radius: 12pt; border-width: 1px; break-inside: avoid; background: var(--panel); }
  header.hero { padding: 0; }
  .portrait { padding: 0; }
  .job .org { font-size: 8pt; margin: 0 0 3pt; }
  .btn.small { font-size: 6.4pt; padding: 2pt 8pt; border-width: 1px; }
  .fit h3 { font-size: 9.6pt; }
  .head { grid-template-columns: minmax(0, 1fr) 150pt; gap: 6pt; }
  .who { padding: 12pt 14pt; gap: 8pt; background: radial-gradient(120% 140% at 85% 0%, rgb(18 97 214 / 0.42), transparent 60%), var(--night); }
  h1.name { font-size: 28pt; }
  .role { font-size: 10.5pt; }
  .facts { grid-template-columns: 1fr; font-size: 8pt; gap: 3pt; }
  .btn { padding: 3pt 9pt; font-size: 6.8pt; border-width: 1px; }
  .btn.addr { font-size: 7.6pt; }
  .stats { gap: 6pt; margin-top: 6pt; }
  .stat .value { font-size: 15pt; }
  .stat .what { font-size: 7pt; }
  section { padding: 14pt 0 0; }
  .sec-head { margin-bottom: 7pt; break-after: avoid; }
  h2.title { font-size: 17pt; }
  .tt .h { width: 4px; height: 4px; } .tt .dim { display: none; }
  .tt-l { -webkit-text-stroke-width: 1px; }
  .sub { font-size: 6.6pt; }
  .bento { gap: 6pt; }
  .lead { font-size: 13pt; }
  .tile h3 { font-size: 9.6pt; }
  .sheet { border-radius: 16pt; padding: 14pt 14pt 12pt; margin: 14pt 0 0; break-inside: auto; }
  .rows { column-gap: 18pt; }
  .rows li { padding: 8pt 0; gap: 10pt; break-inside: avoid; }
  .rows .num { font-size: 26pt; }
  .rows h3 { font-size: 9pt; }
  .rows p { font-size: 8pt; margin-top: 2pt; }
  .light-tiles { gap: 6pt; margin-top: 8pt; }
  .light-tiles .tile { background: #f2f4f7; }
  .light-tiles .tile.wide { background: none; }
  .timeline { gap: 6pt; }
  .timeline::before { left: 74pt; }
  .job { grid-template-columns: 62pt minmax(0, 1fr); gap: 20pt; break-inside: avoid; }
  .job .when { padding-top: 9pt; font-size: 6.6pt; }
  .job .when b { font-size: 12pt; }
  .job .tile::before { left: -15pt; top: 11pt; width: 7pt; height: 7pt; }
  .job p.text, .bullets, .fit p { font-size: 8.2pt; }
  .projects { gap: 6pt; }
  .project { border-radius: 14pt; padding: 9pt; gap: 6pt; border-width: 1.5px; break-inside: avoid; }
  .project .no { font-size: 22pt; }
  .project h3 { font-size: 10pt; }
  .gallery { height: 92pt; gap: 4pt; }
  .gallery .col { gap: 4pt; }
  .gallery img, .gallery a, .gallery span { border-radius: 7pt; }
  .label, .project .status, details summary { font-size: 6.4pt; }
  details summary::before { display: none; }
  .metric, .chip { font-size: 6.8pt; padding: 1pt 7pt; }
  .also { margin-top: 6pt; padding: 7pt 10pt; border-radius: 10pt; }
  .fit { gap: 6pt; }
  .folders { gap: 12pt 6pt; padding-top: 8pt; }
  .folder { break-inside: avoid; padding-top: 9pt; }
  .folder .back { border-radius: 9pt; padding: 8pt 8pt 34pt; }
  .folder .back::before { top: -9pt; height: 18pt; border-radius: 9pt 9pt 0 0; }
  .notes { gap: 3pt; }
  .notes li { font-size: 6.8pt; padding: 1.5pt 5pt; border-radius: 4pt; box-shadow: none; }
  .folder .front { height: 30pt; border-radius: 9pt; padding: 5pt 8pt; transform: none; box-shadow: none; }
  .folder .front b { font-size: 8pt; } .folder .front span { font-size: 6.4pt; }
  footer { margin-top: 10pt; padding: 6pt 0 0; font-size: 6.8pt; }
}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="page-pad">
<div class="topnav">
  <div class="wrap">
    <a class="mono" href="#top">BN</a>
    <nav class="secnav" aria-label="Sections">
      ${SECTIONS.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join('')}
    </nav>
    <a class="btn small noprint" href="${esc(PDF)}" download>PDF</a>
  </div>
</div>

<header class="hero wrap" id="top">
  <div class="head">
    <div class="tile who rv">
      <div class="slats" aria-hidden="true"></div>
      <div>
        <span class="label">Curriculum vitae</span>
        <h1 class="name grad">${person.name.split(' ').map((w) => `<span>${esc(w)}</span>`).join(' ')}</h1>
      </div>
      <div>
        <p class="role">${esc(person.headline)}</p>
        <p class="focus">${esc(person.focus)}</p>
      </div>
      <ul class="facts">
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${esc(person.location)}</span></li>
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 6V4h8v2"/></svg><span>${esc(person.terms)}</span></li>
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg><span>${person.languages.map(([l, level]) => `${esc(l)} ${esc(level)}`).join(' · ')}</span></li>
      </ul>
      <p class="contacts">
        <a class="btn addr" href="mailto:${esc(person.email)}">${esc(person.email)}</a>
        ${PHONE ? `<a class="btn addr" href="tel:${esc(PHONE.replace(/\s/g, ''))}">${esc(PHONE)}</a>` : ''}
        ${person.links.map((l) => `<a class="btn addr" href="${esc(l.url)}">${esc(l.label)}</a>`).join('\n        ')}
      </p>
      <p class="contacts noprint">
        <a class="btn cta" href="${esc(PDF)}" download>Download PDF</a>
        <a class="btn small" href="${esc(ATS)}" download>One-column PDF for ATS</a>
      </p>
    </div>
    <div class="tile portrait rv" style="--d:.08s"><img src="portrait.jpg" width="500" height="500" alt="Portrait of ${esc(person.name)}"><span class="badge">Open to work</span></div>
  </div>
  <div class="stats">
    ${cv.numbers.map((n, i) => `<div class="tile stat rv" style="--d:${(i * 0.06).toFixed(2)}s"><span class="value grad" data-count>${esc(n.value).replace(' of ', ' <small>of</small> ')}</span><span class="what">${txt(n.label)}</span></div>`).join('\n    ')}
  </div>
</header>

<main id="main">
<section id="summary" class="wrap">
  <div class="sec-head"><h2 class="title">${title('Summary')}</h2></div>
  <div class="bento">
    <div class="tile s12 rv" style="background:var(--night);border-color:rgb(127 176 255 / 0.3)"><div class="slats" aria-hidden="true"></div><p class="lead" style="position:relative">${txt(s.lead)}</p></div>
    <div class="tile s7 rv">
      <span class="label">Built in 2026</span>
      <h3>${txt(s.built.intro)}</h3>
      <ul class="built">${s.built.items.map((x, i) => `<li><span class="i">${two(i)}</span><span>${txt(x)}</span></li>`).join('')}</ul>
    </div>
    <div class="tile s5 rv" style="--d:.08s">
      <span class="label">How I deliver</span>
      <p>${point(s.delivery)}</p>
      <span class="label" style="margin-top:18px">Before engineering</span>
      <p>${txt(s.background)}</p>
    </div>
  </div>
</section>

<div class="sheet">
<section id="delivery" class="wrap">
  <div class="sec-head"><h2 class="title">${title('How I deliver')}</h2><p class="sub">AI-assisted SDLC, step by step, each with its evidence</p></div>
  <ol class="rows">
    ${cv.sdlc.map((st, i) => `<li class="rv" style="--d:${((i % 2) * 0.08).toFixed(2)}s"><span class="num">${two(i)}</span><div><h3>${esc(st.title)}</h3><p>${txt(st.text)}</p></div></li>`).join('\n    ')}
  </ol>
  <div class="light-tiles">
    <div class="tile wide rv"><span class="label">Tools</span><p>${txt(cv.tools)}</p></div>
    ${cv.aiSystems.map((a, i) => `<div class="tile rv" style="--d:${((i % 2) * 0.08).toFixed(2)}s"><span class="label">AI system in production</span><p>${point(a)}</p></div>`).join('\n    ')}
  </div>
</section>
</div>

<section id="experience" class="wrap">
  <div class="sec-head"><h2 class="title">${title('Experience')}</h2><p class="sub">Newest first</p></div>
  <ol class="timeline">
    ${[...cv.experience]
      .sort(byRecency)
      .map(
        (j) => `<li class="job rv${j.end ? '' : ' now'}">
      <p class="when"><b>${esc(j.start.slice(0, 4))}</b>${esc(span(j))}</p>
      <div class="tile">
        <h3>${esc(j.role)}</h3>
        <p class="org">${j.url ? `<a href="${esc(j.url)}">${esc(j.org)}</a>` : esc(j.org)}${j.place ? ` · ${esc(j.place)}` : ''}</p>
        <p class="text">${txt(j.text)}</p>
      </div>
    </li>`,
      )
      .join('\n    ')}
  </ol>
</section>

<section id="projects" class="wrap">
  <div class="sec-head"><h2 class="title">${title('Projects')}</h2><p class="sub">Production systems I designed and built</p></div>
  <div class="filters noprint" role="group" aria-label="Show the projects that use a skill">
    ${Object.entries(cv.SKILL_TAGS)
      .map(([key, label]) => `<button type="button" class="chip" data-skill="${key}" aria-pressed="false">${esc(label)}</button>`)
      .join('\n    ')}
  </div>
  <p class="filter-note noprint" aria-live="polite"></p>
  <div class="projects">
    ${cv.projects
      .map((p, i) => {
        const shot = SHOTS[p.name];
        const img = (n) => `<img src="../work/${shot[n - 1]}.webp" alt="${esc(p.name)}, screen ${n}" loading="lazy">`;
        const frame = (n) => (p.url ? `<a href="${esc(p.url)}" tabindex="-1">${img(n)}</a>` : `<span>${img(n)}</span>`);
        return `<article class="project rv${p.pdf === false ? ' noprint' : ''}" style="--d:${((i % 2) * 0.08).toFixed(2)}s" data-skills="${p.skills.join(' ')}">
      <div class="top"><span class="no grad">${two(i)}</span><div><p class="status">${esc(p.status)}</p><h3>${esc(p.name)}</h3></div></div>
      ${shot ? `<div class="gallery"><div class="col">${frame(1)}${frame(2)}</div>${frame(3)}</div>` : ''}
      <p>${txt(p.text)}</p>
      <div class="foot">${(p.metrics ?? []).map((m) => `<span class="metric">${esc(m)}</span>`).join('')}${p.url ? `<a class="btn small open" href="${esc(p.url)}">${esc(host(p.url))} ↗</a>` : ''}</div>
      <details>
        <summary>How it is built</summary>
        <ul class="bullets">${p.points.map((x) => `<li>${point(x)}</li>`).join('')}</ul>
      </details>
    </article>`;
      })
      .join('\n    ')}
  </div>
  <p class="also noprint">${point(cv.alsoBuilt)}</p>
  <p class="also print-only">${point(cv.alsoInPdf)}</p>
</section>

<section id="fit" class="wrap">
  <div class="sec-head"><h2 class="title">${title('Role fit')}</h2><p class="sub">Solutions Architect · AI-assisted SDLC: what the role asks, and what shows it</p></div>
  <div class="fit">
    ${cv.fit
      .map(
        (f, i) => `<div class="tile rv" style="--d:${((i % 2) * 0.08).toFixed(2)}s">
      <h3>${esc(f.ask)}</h3>
      <details>
        <summary>Evidence</summary>
        <p>${txt(f.evidence)}</p>
      </details>
    </div>`,
      )
      .join('\n    ')}
  </div>
</section>

<section id="skills" class="wrap">
  <div class="sec-head"><h2 class="title">${title('Skills')}</h2><p class="sub">The stack, folder by folder</p></div>
  <div class="folders">
    ${cv.skills
      .map(
        (g, i) => `<div class="folder rv" style="--d:${((i % 3) * 0.08).toFixed(2)}s">
      <div class="back">
        <ul class="notes">${g.items.map((x, k) => `<li style="--r:${[-2, 1.5, -1, 2, -1.5, 1][k % 6]}deg">${esc(x)}</li>`).join('')}</ul>
      </div>
      <div class="front"><b>${esc(g.group)}</b><span>${g.items.length} tools</span></div>
    </div>`,
      )
      .join('\n    ')}
    <div class="tile edu rv" style="--d:.16s">
      <div><span class="label">Education</span>${cv.education.map((e) => `<p><b class="k">${esc(e.degree)}, ${esc(e.field)}</b><br>${esc(e.school)} · ${esc(e.start)}–${esc(e.end)}</p>`).join('')}</div>
      <div><span class="label">Languages</span><p>${person.languages.map(([l, level]) => `<b class="k">${esc(l)}</b> ${esc(level)}`).join(' · ')}</p></div>
    </div>
  </div>
</section>
</main>

<footer class="wrap">
  <p>Updated ${esc(new Date(`${cv.UPDATED}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))} · <a href="${URL_CV}">${esc(host(URL_CV))}</a> · this CV as <a href="cv.txt">plain text</a>, <a href="resume.json">JSON Resume</a> and a <a href="${esc(ATS)}">one-column PDF</a></p>
  <p class="consent">${esc(cv.consent)}</p>
</footer>
</div>
<script>
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parts = document.querySelectorAll('.rv');
  // numbers count up the first time they are seen (the text stays the real value until then)
  const counters = [...document.querySelectorAll('[data-count]')].map((el) => {
    const node = el.firstChild, m = node.nodeValue.match(/^(\\D*)(\\d[\\d,]*)(.*)$/);
    return m && { el, node, to: +m[2].replace(/,/g, ''), pre: m[1], post: m[3], comma: m[2].includes(','), text: node.nodeValue };
  }).filter(Boolean);
  const count = (c) => {
    if (still) return;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1400), v = Math.round(c.to * (1 - Math.pow(1 - k, 4)));
      c.node.nodeValue = c.pre + (c.comma ? v.toLocaleString('en-US') : v) + c.post;
      if (k < 1) requestAnimationFrame(step); else c.node.nodeValue = c.text;
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && !still) {
    const seen = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach((el) => { const c = counters.find((x) => x.el === el); if (c) count(c); });
      seen.unobserve(e.target);
    }), { rootMargin: '0px 0px -6% 0px' });
    parts.forEach((p) => seen.observe(p));
  } else parts.forEach((p) => p.classList.add('in'));
  // each title's first letter: its selection box says its size, as a design tool would
  const sizes = () => document.querySelectorAll('.tt').forEach((t) => { const r = t.querySelector('.tt-l').getBoundingClientRect(); t.querySelector('.dim').textContent = t.textContent.trim()[0] + '  ' + Math.round(r.width) + ' × ' + Math.round(r.height); });
  document.fonts.ready.then(sizes);
  addEventListener('resize', sizes);
  // tiles lit where the pointer is
  addEventListener('pointermove', (e) => { const t = e.target.closest && e.target.closest('.tile'); if (!t) return; const r = t.getBoundingClientRect(); t.style.setProperty('--mx', e.clientX - r.left + 'px'); t.style.setProperty('--my', e.clientY - r.top + 'px'); }, { passive: true });
  // the section on screen lit in the bar
  const links = [...document.querySelectorAll('.secnav a')];
  const spy = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.hash === '#' + e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
  links.forEach((a) => { const s = document.querySelector(a.hash); if (s) spy.observe(s); });
  // projects by skill
  const cards = [...document.querySelectorAll('.project')];
  const chips = [...document.querySelectorAll('[data-skill]')];
  const note = document.querySelector('.filter-note');
  let active = null;
  chips.forEach((chip) => chip.addEventListener('click', () => {
    active = active === chip.dataset.skill ? null : chip.dataset.skill;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.skill === active)));
    let hits = 0;
    cards.forEach((card) => { const hit = !!active && card.dataset.skills.split(' ').includes(active); hits += hit; card.classList.toggle('hit', hit); card.classList.toggle('dim', !!active && !hit); });
    note.textContent = active ? hits + ' of ' + cards.length + ' projects use ' + chip.textContent + '. Tap it again to show all.' : '';
  }));
  // printed: every fold open, every part in, every number at its value, every screen loaded
  addEventListener('beforeprint', () => {
    document.querySelectorAll('details').forEach((d) => (d.open = true));
    parts.forEach((p) => p.classList.add('in'));
    counters.forEach((c) => (c.node.nodeValue = c.text));
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
  });
})();
</script>
</body>
</html>
`;
}

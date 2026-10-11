// The CV page (public/cv/index.html) as a bento grid in the site's look, and the same page printed as the visual PDF:
// tiles to scan instead of paragraphs to read, numbers picked out, each point's subject in bold, the long details
// folded on screen (all open in the PDF), every address and section a button that works in the PDF too. The words
// are data.mjs's, the same as in the one-column ATS PDF, the Markdown and the JSON Resume.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const month = (ym) => {
  const [y, m] = ym.split('-');
  return `${MONTHS[+m - 1]} ${y}`;
};
const span = ({ start, end }) => (end === start ? `${month(start)} (1 month)` : `${month(start)} – ${end ? month(end) : 'present'}`);
const byRecency = (a, b) => (b.end ?? '9999').localeCompare(a.end ?? '9999') || b.start.localeCompare(a.start);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const host = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

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
const title = (text) => `<span class="tt">${esc(text[0])}</span>${esc(text.slice(1))}`;

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
  --bg: #0c0c0c; --panel: #111216; --panel2: #15171d; --edge: rgb(85 87 94 / 0.5); --line: rgb(215 226 234 / 0.12);
  --text: #d7e2ea; --muted: rgb(215 226 234 / 0.66); --head: #bbccd7; --accent: #7fb0ff; --blue: #1261d6; --night: #040b1c;
  --cta: linear-gradient(123deg, #18011f 7%, #b600a8 37%, #7621b0 72%, #be4c00 100%);
  --heading: linear-gradient(180deg, #646973 0%, #bbccd7 100%);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--bg); color-scheme: dark; scroll-behavior: smooth; scroll-padding-top: 76px; }
body { font: 400 16.5px/1.6 Kanit, system-ui, sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
a { color: inherit; }
.wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.skip { position: absolute; left: -999px; }
.skip:focus { left: 16px; top: 16px; z-index: 9; background: var(--text); color: var(--bg); padding: 8px 14px; border-radius: 999px; }
.nw { white-space: nowrap; }
.n { font-weight: 600; color: #fff; }
.k { font-weight: 600; color: #fff; }
.muted { color: var(--muted); }
.print-only { display: none; }

/* the bar on top: the sections as buttons, the one on screen lit */
.topnav { position: sticky; top: 0; z-index: 5; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: rgb(12 12 12 / 0.78); border-bottom: 1px solid var(--line); }
.topnav .wrap { display: flex; align-items: center; gap: 14px; height: 60px; }
.topnav .mono { font-weight: 900; letter-spacing: 0.04em; text-decoration: none; color: var(--head); }
.secnav { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; flex: 1; }
.secnav a { font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.14em; text-decoration: none; color: var(--muted); white-space: nowrap; padding: 7px 12px; border-radius: 999px; border: 1px solid transparent; transition: color 0.2s, border-color 0.2s, background 0.2s; }
.secnav a:hover { color: var(--text); border-color: var(--line); }
.secnav a.on { color: var(--bg); background: var(--text); }

/* buttons */
.btn { display: inline-flex; align-items: center; gap: 8px; border: 2px solid var(--text); border-radius: 999px; padding: 9px 18px; font-size: 0.78rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; white-space: nowrap; transition: background 0.2s; }
.btn:hover { background: rgb(215 226 234 / 0.1); }
.btn.cta { border: 0; color: #fff; background: var(--cta); outline: 2px solid #fff; outline-offset: -3px; box-shadow: 0 4px 4px rgb(181 1 167 / 0.25), 4px 4px 12px #7721b1 inset; padding: 11px 22px; }
.btn.small { padding: 6px 13px; font-size: 0.7rem; border-width: 1.5px; }
.chip { display: inline-flex; align-items: center; border: 1px solid rgb(215 226 234 / 0.26); border-radius: 999px; padding: 3px 11px; font-size: 0.8rem; color: rgb(215 226 234 / 0.9); font-family: inherit; background: none; }
button.chip { cursor: pointer; transition: background 0.2s, color 0.2s; }
button.chip[aria-pressed="true"] { background: var(--text); color: var(--bg); border-color: var(--text); }
.metric { font-size: 0.76rem; border-radius: 999px; padding: 3px 10px; background: rgb(127 176 255 / 0.12); color: var(--accent); white-space: nowrap; }

/* the grid */
.bento { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 14px; }
.s2 { grid-column: span 2; } .s3 { grid-column: span 3; } .s4 { grid-column: span 4; } .s5 { grid-column: span 5; } .s6 { grid-column: span 6; } .s7 { grid-column: span 7; } .s8 { grid-column: span 8; } .s12 { grid-column: span 12; }
.tile { position: relative; background: var(--panel); border: 1.5px solid var(--edge); border-radius: 24px; padding: 22px 24px; min-width: 0; }
.tile.flat { background: none; border-style: dashed; }
.tile.blue { background: radial-gradient(120% 140% at 85% 0%, rgb(18 97 214 / 0.45), transparent 60%), var(--night); border-color: rgb(127 176 255 / 0.35); }
.tile.glow { background: var(--cta); border: 0; color: #fff; }
.tile h3 { font-weight: 600; font-size: 1.12rem; line-height: 1.3; color: #fff; }
.label { display: block; text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.72rem; color: var(--muted); margin-bottom: 8px; font-weight: 500; }
.slats { position: absolute; inset: 0; border-radius: inherit; opacity: 0.5; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='46'%3E%3Crect x='4' y='4' width='10' height='38' rx='5' fill='%231261d6'/%3E%3C/svg%3E"); -webkit-mask-image: radial-gradient(ellipse 70% 85% at 90% 20%, #000, transparent 70%); mask-image: radial-gradient(ellipse 70% 85% at 90% 20%, #000, transparent 70%); pointer-events: none; }

/* the head */
header.hero { padding: 28px 0 0; }
.who { display: flex; flex-direction: column; justify-content: flex-end; min-height: 300px; overflow: hidden; }
.who > * { position: relative; }
h1.name { font-weight: 900; text-transform: uppercase; line-height: 0.88; letter-spacing: -0.01em; font-size: clamp(2.8rem, 7.4vw, 6.4rem); background: var(--heading); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
h1.name span { display: block; }
.role { margin-top: 16px; font-size: clamp(1.02rem, 2vw, 1.4rem); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text); }
.focus { margin-top: 4px; color: var(--accent); }
.portrait { padding: 0; overflow: hidden; display: flex; align-items: stretch; }
.portrait img { width: 100%; height: 100%; min-height: 300px; object-fit: cover; display: block; }
.facts { list-style: none; display: grid; gap: 10px; }
.facts li { display: grid; grid-template-columns: 22px 1fr; gap: 8px; align-items: start; }
.facts svg { width: 18px; height: 18px; margin-top: 3px; stroke: var(--accent); fill: none; stroke-width: 1.8; }
.contacts { display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; }
/* addresses as written, so they copy whole (spaced capitals come out of a PDF as single letters) */
.contacts .addr { text-transform: none; letter-spacing: 0; font-size: 0.86rem; }
.stat { display: flex; flex-direction: column; justify-content: space-between; gap: 10px; }
.stat .value { font-weight: 900; font-size: clamp(1.9rem, 3.4vw, 2.8rem); line-height: 1; background: var(--heading); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; white-space: nowrap; }
.stat .what { color: var(--muted); font-size: 0.86rem; line-height: 1.35; }

/* sections */
section { padding: 64px 0 0; }
.sec-head { display: flex; align-items: end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
h2.title { font-weight: 900; text-transform: uppercase; color: var(--head); font-size: clamp(2rem, 4.6vw, 3.6rem); line-height: 0.92; letter-spacing: -0.01em; }
.tt { display: inline-block; color: transparent; -webkit-text-stroke: 1.5px var(--accent); outline: 1.5px dashed rgb(127 176 255 / 0.7); outline-offset: 3px; margin-right: 0.04em; }
.sub { color: var(--muted); text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.76rem; max-width: 46ch; }

/* summary */
.lead { font-size: clamp(1.25rem, 2.3vw, 1.75rem); line-height: 1.35; font-weight: 500; color: #fff; max-width: 34ch; }
.built { list-style: none; display: grid; gap: 10px; margin-top: 12px; }
.built li { display: grid; grid-template-columns: 28px 1fr; gap: 6px; }
.built .i { font-weight: 800; color: var(--accent); }

/* delivery */
.step .num { font-weight: 900; font-size: 2rem; line-height: 1; background: var(--heading); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.step h3 { margin: 8px 0 6px; }
.step p { color: var(--text); font-size: 0.95rem; }
.bullets { list-style: none; display: grid; gap: 9px; }
.bullets li { position: relative; padding-left: 18px; }
.bullets li::before { content: ''; position: absolute; left: 0; top: 0.66em; width: 7px; height: 7px; border-radius: 50%; background: var(--cta); }
.ai p { font-size: 0.95rem; }

/* experience */
.job .when { display: inline-block; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); border: 1px solid rgb(127 176 255 / 0.35); border-radius: 999px; padding: 2px 10px; margin-bottom: 10px; }
.job .org { color: var(--muted); font-size: 0.92rem; margin: 2px 0 8px; }
.job .org a { color: var(--accent); text-decoration: none; }
.job p.text { font-size: 0.95rem; }
.job.now { border-color: rgb(127 176 255 / 0.45); }

/* projects */
.filters { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 8px; }
.filter-note { color: var(--muted); font-size: 0.85rem; min-height: 1.4em; margin-bottom: 8px; }
.project { display: flex; flex-direction: column; gap: 10px; transition: opacity 0.3s, border-color 0.3s; }
.project.dim { opacity: 0.25; }
.project.hit { border-color: rgb(127 176 255 / 0.75); }
.project .top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.project h3 { font-size: 1.35rem; }
.project .status { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); }
.project .host { color: var(--accent); text-decoration: none; font-size: 0.86rem; }
.metrics { display: flex; flex-wrap: wrap; gap: 6px; }
details summary { cursor: pointer; list-style: none; display: inline-flex; align-items: center; gap: 8px; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); }
details summary::-webkit-details-marker { display: none; }
details summary::before { content: '+'; display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--edge); font-size: 0.9rem; letter-spacing: 0; }
details[open] summary::before { content: '–'; }
details[open] summary { margin-bottom: 10px; }
.project .bullets { font-size: 0.94rem; }
.also { color: var(--muted); }

/* role fit */
.fit h3 { font-size: 1.02rem; }
.fit p { font-size: 0.93rem; }

/* skills */
.chips { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; }

footer { margin-top: 64px; padding: 24px 0 48px; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.85rem; }
footer p + p { margin-top: 8px; }
footer .consent { font-size: 0.74rem; }

/* tiles come in as they scroll in */
html.js .rv { opacity: 0; transform: translateY(22px); transition: opacity 0.6s ease, transform 0.6s ease; }
html.js .rv.in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { html.js .rv { opacity: 1; transform: none; transition: none; } html { scroll-behavior: auto; } }

/* narrower: six columns (also the PDF's); then one */
@media screen and (max-width: 1040px) {
  .bento { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .s3, .s4, .s5, .s6, .s7 { grid-column: span 3; } .s8, .s12 { grid-column: span 6; } .s2 { grid-column: span 2; }
  .who { grid-column: span 4; } .portrait { grid-column: span 2; }
}
@media screen and (max-width: 680px) {
  .bento { gap: 10px; }
  .s3, .s4, .s5, .s6, .s7, .s8, .s12, .who, .portrait { grid-column: span 6; } .s2 { grid-column: span 3; }
  .tile { padding: 18px; border-radius: 20px; }
  .portrait { order: -1; }
  .portrait img { min-height: 0; aspect-ratio: 4 / 3; }
  .who { min-height: 0; }
  section { padding-top: 48px; }
}

/* the visual PDF: the page on A4, the six-column grid, every fold open, tiles kept whole, the buttons still links */
@page { size: A4; margin: 0; }
@media print {
  html, body { background: var(--bg); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-size: 8.6pt; line-height: 1.42; }
  .page-pad { padding: 9mm 9mm 6mm; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .wrap { max-width: none; padding: 0; }
  .topnav { position: static; backdrop-filter: none; background: none; border: 0; margin-bottom: 6pt; }
  .topnav .wrap { height: auto; }
  .secnav { overflow: visible; flex-wrap: wrap; }
  .secnav a { border-color: var(--edge); color: var(--text); padding: 3pt 8pt; font-size: 6.6pt; }
  .noprint, .filters, .filter-note, .skip { display: none !important; }
  .print-only { display: block; }
  html.js .rv { opacity: 1 !important; transform: none !important; }
  .bento { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6pt; }
  .s3, .s4, .s5, .s6, .s7 { grid-column: span 3; } .s8, .s12 { grid-column: span 6; } .s2 { grid-column: span 2; }
  .who { grid-column: span 4; } .portrait { grid-column: span 2; }
  /* Chrome's PDF outlines text clipped to a gradient: plain light grey instead */
  h1.name, .stat .value, .step .num { background: none; -webkit-text-fill-color: #c4d2dc; }
  .tile { padding: 9pt 11pt; border-radius: 12pt; border-width: 1px; break-inside: avoid; }
  header.hero { padding: 0; }
  .who { min-height: 0; }
  h1.name { font-size: 26pt; }
  .role { font-size: 11pt; margin-top: 6pt; }
  .portrait img { min-height: 0; height: 100%; }
  .btn { padding: 3pt 9pt; font-size: 6.8pt; border-width: 1px; }
  .contacts .addr { font-size: 7.6pt; }
  .stat .value { font-size: 17pt; }
  .stat .what { font-size: 7.4pt; }
  section { padding: 12pt 0 0; break-inside: auto; }
  .sec-head { margin-bottom: 6pt; break-after: avoid; }
  h2.title { font-size: 17pt; }
  .tt { -webkit-text-stroke: 1px var(--accent); outline-width: 1px; }
  .sub { font-size: 6.6pt; }
  .lead { font-size: 12pt; }
  .tile h3 { font-size: 9.6pt; }
  .step .num { font-size: 14pt; }
  .step p, .ai p, .job p.text, .project .bullets, .fit p { font-size: 8.2pt; }
  .label, .job .when, .project .status, details summary { font-size: 6.4pt; }
  details summary::before { display: none; }
  .metric, .chip { font-size: 6.8pt; padding: 1pt 7pt; }
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
  <div class="bento">
    <div class="tile blue who s8 rv">
      <div class="slats" aria-hidden="true"></div>
      <span class="label">Curriculum vitae</span>
      <h1 class="name">${person.name.split(' ').map((w) => `<span>${esc(w)}</span>`).join(' ')}</h1>
      <p class="role">${esc(person.headline)}</p>
      <p class="focus">${esc(person.focus)}</p>
    </div>
    <div class="tile portrait s4 rv"><img src="portrait.jpg" width="500" height="500" alt="Portrait of ${esc(person.name)}"></div>
    <div class="tile s7 rv">
      <span class="label">Work with me</span>
      <ul class="facts">
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${esc(person.location)}</span></li>
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 6V4h8v2"/></svg><span>${esc(person.terms)}</span></li>
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg><span>${person.languages.map(([l, level]) => `${esc(l)} ${esc(level)}`).join(' · ')}</span></li>
      </ul>
    </div>
    <div class="tile s5 rv">
      <span class="label">Contact</span>
      <p class="contacts">
        <a class="btn addr" href="mailto:${esc(person.email)}">${esc(person.email)}</a>
        ${PHONE ? `<a class="btn addr" href="tel:${esc(PHONE.replace(/\s/g, ''))}">${esc(PHONE)}</a>` : ''}
        ${person.links.map((l) => `<a class="btn addr" href="${esc(l.url)}">${esc(l.label)}</a>`).join('\n        ')}
        <a class="btn cta noprint" href="${esc(PDF)}" download>Download PDF</a>
        <a class="btn small noprint" href="${esc(ATS)}" download>One-column PDF for ATS</a>
      </p>
    </div>
    ${cv.numbers.map((n) => `<div class="tile stat s2 rv"><span class="value">${esc(n.value)}</span><span class="what">${txt(n.label)}</span></div>`).join('\n    ')}
  </div>
</header>

<main id="main" class="wrap">
<section id="summary">
  <div class="sec-head"><h2 class="title">${title('Summary')}</h2></div>
  <div class="bento">
    <div class="tile blue s12 rv"><div class="slats" aria-hidden="true"></div><p class="lead" style="position:relative">${txt(s.lead)}</p></div>
    <div class="tile s6 rv">
      <span class="label">Built in 2026</span>
      <h3>${txt(s.built.intro)}</h3>
      <ul class="built">${s.built.items.map((x, i) => `<li><span class="i">${String(i + 1).padStart(2, '0')}</span><span>${txt(x)}</span></li>`).join('')}</ul>
    </div>
    <div class="tile s6 rv">
      <span class="label">How I deliver</span>
      <p>${point(s.delivery)}</p>
      <span class="label" style="margin-top:18px">Before engineering</span>
      <p>${txt(s.background)}</p>
    </div>
  </div>
</section>

<section id="delivery">
  <div class="sec-head"><h2 class="title">${title('How I deliver')}</h2><p class="sub">AI-assisted SDLC, step by step, each with its evidence</p></div>
  <div class="bento">
    ${cv.sdlc.map((st, i) => `<div class="tile step s4 rv"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(st.title)}</h3><p>${txt(st.text)}</p></div>`).join('\n    ')}
    <div class="tile flat s12 rv"><span class="label">Tools</span><p>${txt(cv.tools)}</p></div>
    ${cv.aiSystems.map((a) => `<div class="tile ai s6 rv"><span class="label">AI system in production</span><p>${point(a)}</p></div>`).join('\n    ')}
  </div>
</section>

<section id="experience">
  <div class="sec-head"><h2 class="title">${title('Experience')}</h2><p class="sub">Newest first</p></div>
  <div class="bento">
    ${[...cv.experience]
      .sort(byRecency)
      .map(
        (j) => `<div class="tile job s6 rv${j.end ? '' : ' now'}">
      <span class="when">${esc(span(j))}</span>
      <h3>${esc(j.role)}</h3>
      <p class="org">${j.url ? `<a href="${esc(j.url)}">${esc(j.org)}</a>` : esc(j.org)}${j.place ? ` · ${esc(j.place)}` : ''}</p>
      <p class="text">${txt(j.text)}</p>
    </div>`,
      )
      .join('\n    ')}
  </div>
</section>

<section id="projects">
  <div class="sec-head"><h2 class="title">${title('Projects')}</h2><p class="sub">Production systems I designed and built</p></div>
  <div class="filters noprint" role="group" aria-label="Show the projects that use a skill">
    ${Object.entries(cv.SKILL_TAGS)
      .map(([key, label]) => `<button type="button" class="chip" data-skill="${key}" aria-pressed="false">${esc(label)}</button>`)
      .join('\n    ')}
  </div>
  <p class="filter-note noprint" aria-live="polite"></p>
  <div class="bento">
    ${cv.projects
      .map(
        (p) => `<article class="tile project s6 rv${p.pdf === false ? ' noprint' : ''}" data-skills="${p.skills.join(' ')}">
      <div class="top"><h3>${esc(p.name)}</h3><span class="status">${esc(p.status)}</span></div>
      ${p.url ? `<a class="host" href="${esc(p.url)}">${esc(host(p.url))} ↗</a>` : ''}
      <p>${txt(p.text)}</p>
      ${p.metrics ? `<div class="metrics">${p.metrics.map((m) => `<span class="metric">${esc(m)}</span>`).join('')}</div>` : ''}
      <details>
        <summary>How it is built</summary>
        <ul class="bullets">${p.points.map((x) => `<li>${point(x)}</li>`).join('')}</ul>
      </details>
    </article>`,
      )
      .join('\n    ')}
    <div class="tile flat s12 rv noprint"><p class="also">${point(cv.alsoBuilt)}</p></div>
    <div class="tile flat s12 rv print-only"><p class="also">${point(cv.alsoInPdf)}</p></div>
  </div>
</section>

<section id="fit">
  <div class="sec-head"><h2 class="title">${title('Role fit')}</h2><p class="sub">Solutions Architect · AI-assisted SDLC: what the role asks, and what shows it</p></div>
  <div class="bento">
    ${cv.fit
      .map(
        (f) => `<div class="tile fit s6 rv">
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

<section id="skills">
  <div class="sec-head"><h2 class="title">${title('Skills')}</h2></div>
  <div class="bento">
    ${cv.skills.map((g, i) => `<div class="tile ${i < 2 ? 's6' : 's4'} rv"><span class="label">${esc(g.group)}</span><ul class="chips">${g.items.map((x) => `<li class="chip">${esc(x)}</li>`).join('')}</ul></div>`).join('\n    ')}
    <div class="tile s6 edu rv">
      <span class="label">Education</span>
      ${cv.education.map((e) => `<p><b class="k">${esc(e.degree)}, ${esc(e.field)}</b><br>${esc(e.school)} · ${esc(e.start)}–${esc(e.end)}</p>`).join('')}
    </div>
    <div class="tile s6 noprint rv">
      <span class="label">Languages</span>
      <p>${person.languages.map(([l, level]) => `<b class="k">${esc(l)}</b> ${esc(level)}`).join(' · ')}</p>
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
  // tiles come in as they scroll in
  const parts = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const seen = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), { rootMargin: '0px 0px -4% 0px' });
    parts.forEach((p) => seen.observe(p));
  } else parts.forEach((p) => p.classList.add('in'));
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
  // printed: every fold open
  addEventListener('beforeprint', () => { document.querySelectorAll('details').forEach((d) => (d.open = true)); parts.forEach((p) => p.classList.add('in')); });
})();
</script>
</body>
</html>
`;
}

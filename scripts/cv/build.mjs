// The CV (scripts/cv/data.mjs) as the page public/cv/index.html, in the site's look, its PDF (printed from the page by
// headless Chrome), Markdown (cv.txt) and JSON Resume (resume.json): the same words in each, readable by people and by
// the agents that score CVs. All the text is in the HTML (nothing needs JavaScript to be read); the PDF has a real text
// layer, tagged, one column.
//
//   node scripts/cv/build.mjs                       → public/cv/
//   node scripts/cv/build.mjs --out <dir> --phone "+48 …" --pdf <name>.pdf
//                                                     → a copy with the phone number, for an application only
import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import * as cv from './data.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith('--') ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []));
const PUBLIC = resolve(import.meta.dirname, '../../public/cv');
const OUT = args.out ? resolve(args.out) : PUBLIC;
const PDF = args.pdf ?? 'Bogdan_Nenadovic_CV.pdf';
const PHONE = args.phone ?? null;
const URL_CV = `${cv.SITE}/cv/`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const month = (ym) => {
  const [y, m] = ym.split('-');
  return m ? `${MONTHS[+m - 1]} ${y}` : y;
};
const when = ({ start, end }) =>
  end === start ? `<time datetime="${start}">${month(start)}</time> (1 month)` : `<time datetime="${start}">${month(start)}</time> – ${end ? `<time datetime="${end}">${month(end)}</time>` : 'present'}`;
const whenText = ({ start, end }) => (end === start ? `${month(start)} (1 month)` : `${month(start)} – ${end ? month(end) : 'present'}`);
// newest first: the roles still going, then by when they ended, then by when they began
const byRecency = (a, b) => (b.end ?? '9999').localeCompare(a.end ?? '9999') || b.start.localeCompare(a.start);
const txt = (s) => esc(s).replace(/([\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+)/gu, '<span class="nw">$1</span>');
const host = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
// a section title as the site draws its own: heavy capitals, the first one outlined in a dashed box
const title = (text) => `<span class="tt">${esc(text[0])}</span>${esc(text.slice(1))}`;
const { person } = cv;
const languagesText = person.languages.map(([l, level]) => `${l} ${level}`).join(' · ');

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  url: URL_CV,
  dateModified: cv.UPDATED,
  mainEntity: {
    '@type': 'Person',
    '@id': `${cv.SITE}/#person`,
    name: person.name,
    alternateName: person.alternateNames,
    jobTitle: person.headline,
    description: cv.summary,
    email: `mailto:${person.email}`,
    url: `${cv.SITE}/`,
    image: `${URL_CV}portrait.jpg`,
    address: { '@type': 'PostalAddress', addressLocality: 'Poznań', addressCountry: 'PL' },
    worksFor: { '@type': 'Organization', name: 'SIMBIA sp. z o.o.', url: 'https://simbia.eu' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: cv.education[0].school },
    knowsLanguage: person.languages.map(([name]) => ({ '@type': 'Language', name })),
    knowsAbout: cv.skills.flatMap((g) => g.items),
    sameAs: person.links.filter((l) => l.network).map((l) => l.url),
  },
};

const html = `<!doctype html>
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
<meta name="theme-color" content="#0C0C0C">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;900&display=swap">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
:root {
  --bg: #0c0c0c; --panel: #111216; --edge: rgb(85 87 94 / 0.55); --line: rgb(215 226 234 / 0.14);
  --text: #d7e2ea; --muted: rgb(215 226 234 / 0.66); --head: #bbccd7; --accent: #7fb0ff; --blue: #1261d6;
  --cta: linear-gradient(123deg, #18011f 7%, #b600a8 37%, #7621b0 72%, #be4c00 100%);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--bg); color-scheme: dark; scroll-behavior: smooth; scroll-padding-top: 72px; }
body { font: 300 16px/1.6 Kanit, system-ui, sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }
a { color: inherit; }
.wrap { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
.skip { position: absolute; left: -999px; }
.skip:focus { left: 16px; top: 16px; z-index: 9; background: var(--text); color: var(--bg); padding: 8px 14px; border-radius: 999px; }

/* top bar */
.topnav { position: sticky; top: 0; z-index: 5; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: rgb(12 12 12 / 0.72); border-bottom: 1px solid var(--line); }
.topnav .wrap { display: flex; align-items: center; gap: 22px; height: 56px; }
.topnav .mono { font-weight: 900; letter-spacing: 0.04em; text-decoration: none; color: var(--head); }
.topnav nav { display: flex; gap: 18px; overflow-x: auto; scrollbar-width: none; flex: 1; }
.topnav nav a { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.16em; text-decoration: none; color: var(--muted); white-space: nowrap; }
.topnav nav a:hover { color: var(--text); }

/* buttons, pills */
.btn { display: inline-flex; align-items: center; gap: 8px; border: 2px solid var(--text); border-radius: 999px; padding: 9px 20px; font-size: 0.8rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.12em; text-decoration: none; white-space: nowrap; transition: background 0.2s; }
.btn:hover { background: rgb(215 226 234 / 0.1); }
.btn.cta { border: 0; color: #fff; background: var(--cta); outline: 2px solid #fff; outline-offset: -3px; box-shadow: 0 4px 4px rgb(181 1 167 / 0.25), 4px 4px 12px #7721b1 inset; padding: 11px 24px; }
.btn.small { padding: 6px 14px; font-size: 0.72rem; border-width: 1.5px; }
.pill { display: inline-flex; align-items: center; border: 1px solid rgb(215 226 234 / 0.3); border-radius: 999px; padding: 4px 12px; font-size: 0.8rem; color: rgb(215 226 234 / 0.88); background: none; font-family: inherit; font-weight: 400; }
button.pill { cursor: pointer; transition: background 0.2s, color 0.2s; }
.pill.on, button.pill[aria-pressed="true"] { background: var(--text); color: var(--bg); border-color: var(--text); }

/* the hero */
.hero { position: relative; overflow: hidden; padding: 72px 0 56px; border-bottom: 1px solid var(--line); }
.slats { position: absolute; inset: 0; opacity: 0.55; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='46'%3E%3Crect x='4' y='4' width='10' height='38' rx='5' fill='%231261d6'/%3E%3C/svg%3E"); -webkit-mask-image: radial-gradient(ellipse 60% 75% at 78% 30%, #000, transparent 72%); mask-image: radial-gradient(ellipse 60% 75% at 78% 30%, #000, transparent 72%); }
.hero-in { position: relative; display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.3em; font-size: 0.75rem; color: var(--muted); margin-bottom: 14px; }
h1.name { font-weight: 900; text-transform: uppercase; line-height: 0.88; letter-spacing: -0.01em; font-size: clamp(3.2rem, 10vw, 7.6rem); background: linear-gradient(180deg, #646973 0%, #bbccd7 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
h1.name span { display: block; }
.role { margin-top: 18px; font-size: clamp(1.05rem, 2.2vw, 1.5rem); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text); }
.focus { margin-top: 6px; color: var(--accent); font-weight: 400; }
.facts { list-style: none; margin-top: 18px; display: flex; flex-wrap: wrap; gap: 6px 18px; color: var(--muted); font-size: 0.92rem; }
.contacts { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 10px; }
.avatar { width: clamp(150px, 22vw, 250px); height: auto; aspect-ratio: 1; border-radius: 50%; object-fit: cover; padding: 4px; background: var(--cta); box-shadow: 0 0 60px rgb(18 97 214 / 0.35); }

/* sections */
section { padding: 64px 0 8px; }
h2.title { font-weight: 900; text-transform: uppercase; color: var(--head); font-size: clamp(2.3rem, 7vw, 5.2rem); line-height: 0.92; letter-spacing: -0.01em; margin-bottom: 26px; }
.tt { display: inline-block; color: transparent; -webkit-text-stroke: 1.5px var(--accent); outline: 1.5px dashed rgb(127 176 255 / 0.7); outline-offset: 3px; margin-right: 0.04em; }
h3 { font-weight: 500; color: var(--text); }
.lead { font-size: 1.12rem; max-width: 64ch; }
.sub { color: var(--muted); margin: -12px 0 22px; text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.78rem; }
.card { background: var(--panel); border: 1.5px solid var(--edge); border-radius: 26px; padding: 22px 24px; }

/* numbers */
.numbers { list-style: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 30px; }
.numbers .value { display: block; white-space: nowrap; font-weight: 900; font-size: clamp(2rem, 4.4vw, 3.1rem); line-height: 1; background: linear-gradient(180deg, #646973, #bbccd7); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.numbers .label { display: block; margin-top: 8px; color: var(--muted); font-size: 0.9rem; line-height: 1.4; }

/* the SDLC steps: tabs in a row when wide, all of them when not driven */
.steps { list-style: none; counter-reset: step; }
.step h3 button { all: unset; cursor: pointer; display: flex; align-items: baseline; gap: 12px; width: 100%; padding: 14px 0; border-top: 1px solid var(--line); font-weight: 500; font-size: 1.1rem; }
.step .n { font-weight: 900; font-size: 1.6rem; background: linear-gradient(180deg, #646973, #bbccd7); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; min-width: 2.2ch; }
.step .panel { padding: 0 0 16px 3.2ch; color: var(--text); max-width: 75ch; }
html.js .step:not(.on) .panel { display: none; }
.step.on h3 button { color: var(--accent); }
@media screen and (min-width: 900px) {
  html.js .steps { display: grid; grid-template-columns: repeat(6, 1fr); column-gap: 10px; }
  html.js .step { display: contents; }
  html.js .step h3 { grid-row: 1; }
  html.js .step h3 button { flex-direction: column; gap: 4px; border-top: 2px solid var(--line); padding-top: 16px; transition: border-color 0.25s, color 0.25s; }
  html.js .step.on h3 button { border-top-color: var(--accent); }
  html.js .step .panel { grid-row: 2; grid-column: 1 / -1; padding: 18px 0 0; font-size: 1.05rem; }
}
.tools { margin-top: 22px; color: var(--muted); }
.tools b { color: var(--text); font-weight: 500; }
.ai { margin-top: 30px; }
.ai h3 { text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.85rem; color: var(--muted); margin-bottom: 10px; }
.bullets { list-style: none; display: grid; gap: 10px; }
.bullets li { position: relative; padding-left: 20px; }
.bullets li::before { content: ''; position: absolute; left: 0; top: 0.68em; width: 8px; height: 8px; border-radius: 50%; background: var(--cta); }

/* role fit */
.fit { display: grid; gap: 10px; }
.fit details { background: var(--panel); border: 1.5px solid var(--edge); border-radius: 20px; padding: 0 20px; }
.fit summary { cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 15px 0; font-weight: 500; }
.fit summary::-webkit-details-marker { display: none; }
.fit summary .pill { flex-shrink: 0; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; }
.fit details[open] summary .pill { background: var(--text); color: var(--bg); }
.fit details p { padding: 0 0 16px; color: var(--text); }
.expand { margin: -8px 0 16px; }

/* experience */
.timeline { list-style: none; border-left: 1.5px solid var(--line); margin-left: 6px; }
.job { position: relative; padding: 0 0 24px 26px; }
.job::before { content: ''; position: absolute; left: -6px; top: 7px; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px rgb(127 176 255 / 0.15); }
.job .dates { color: var(--muted); }
.job h3 { font-size: 1.12rem; }
.job .org { color: var(--accent); font-size: 0.95rem; margin-bottom: 4px; }
.job .org a { text-decoration: none; }

/* projects */
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.filter-note { color: var(--muted); font-size: 0.85rem; min-height: 1.4em; margin: -8px 0 12px; }
.projects { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.project { transition: opacity 0.3s, border-color 0.3s; }
.project.dim { opacity: 0.28; }
.project.hit { border-color: rgb(127 176 255 / 0.7); }
.project header { display: flex; align-items: baseline; gap: 6px 12px; flex-wrap: wrap; }
.project .host { color: var(--accent); text-decoration: none; font-size: 0.85rem; }
.project .status { margin-left: auto; }
.project h3 { font-size: 1.3rem; font-weight: 600; }
.project .status { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); }
.project > p { margin-top: 8px; }
.metrics { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.metrics li { font-size: 0.78rem; border-radius: 999px; padding: 3px 10px; background: rgb(127 176 255 / 0.12); color: var(--accent); }
.project details { margin-top: 12px; }
.project summary { cursor: pointer; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); }
.project details ul { margin-top: 10px; }
.project .link { margin-top: 12px; font-size: 0.9rem; }
.project .link a { color: var(--accent); text-decoration: none; }
.also { margin-top: 16px; color: var(--muted); }
.print-only { display: none; }
.nw { white-space: nowrap; }

/* skills, education, languages */
.skills { display: grid; gap: 18px; }
.skills h3 { text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.8rem; color: var(--muted); margin-bottom: 8px; }
.chips { list-style: none; display: flex; flex-wrap: wrap; gap: 7px; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.pair h3 { text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.8rem; color: var(--muted); margin-bottom: 8px; }
footer { margin-top: 64px; padding: 26px 0 48px; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.85rem; }
footer p + p { margin-top: 8px; }
footer .consent { font-size: 0.75rem; }

/* coming in as they scroll in (only when driven, and not when motion is reduced) */
html.js .rv { opacity: 0; transform: translateY(26px); transition: opacity 0.7s ease, transform 0.7s ease; }
html.js .rv.in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { html.js .rv { opacity: 1; transform: none; transition: none; } html { scroll-behavior: auto; } }

@media screen and (max-width: 760px) {
  .hero { padding-top: 40px; }
  .hero-in { grid-template-columns: 1fr; }
  .avatar { order: -1; width: 132px; }
  .numbers { grid-template-columns: repeat(2, 1fr); }
  .numbers .value { font-size: 1.75rem; }
  .projects, .pair { grid-template-columns: 1fr; }
  section { padding-top: 48px; }
}

/* the PDF: A4 sheets, dark to the edge (the padding repeats on every sheet), every panel open, no controls */
@page { size: A4; margin: 0; }
@media print {
  html, body { background: var(--bg); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-size: 8.5pt; line-height: 1.36; }
  .print-only { display: block; }
  /* one column and no letter-spacing: CV parsers read a PDF line by line, and spaced capitals come out as letters */
  body * { letter-spacing: 0 !important; }
  .page-pad { padding: 9.5mm 12.5mm; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .topnav, .noprint, .filters, .filter-note, .expand, .skip { display: none !important; }
  .wrap { max-width: none; padding: 0; }
  html.js .rv { opacity: 1 !important; transform: none !important; }
  .hero { padding: 0 0 9pt; }
  .slats { opacity: 0.35; }
  .hero-in { grid-template-columns: 1fr auto; gap: 18pt; }
  .eyebrow { display: none; }
  h1.name, .numbers .value { background: none; -webkit-text-fill-color: currentColor; color: var(--head); }
  h1.name { font-size: 30pt; }
  h1.name span { display: inline; }
  .role { font-size: 11pt; margin-top: 6pt; }
  .focus { margin-top: 1pt; }
  .facts { margin-top: 5pt; font-size: 8.4pt; gap: 2pt 12pt; }
  .contacts { margin-top: 7pt; gap: 4pt; }
  .btn { padding: 2.5pt 8pt; font-size: 7.6pt; border-width: 1px; text-transform: none; }
  .avatar { order: 0; width: 84pt; padding: 2.5pt; }
  section { padding: 9pt 0 0; }
  h2.title { font-size: 14pt; margin-bottom: 4pt; break-after: avoid; }
  .tt { display: inline; color: var(--accent); -webkit-text-stroke: 0; outline: none; margin: 0; }
  .sub { margin: -2pt 0 5pt; font-size: 7.4pt; text-transform: none; break-after: avoid; }
  .sub + * { break-before: avoid; }
  .lead { font-size: 9.2pt; max-width: none; }
  .numbers { display: block; margin-top: 6pt; }
  .numbers li.card { display: block; background: none; border: 0; border-radius: 0; padding: 0; }
  .numbers li + li { margin-top: 1.5pt; }
  .numbers .value { display: inline; font-size: 10pt; color: var(--accent); }
  .numbers .label { display: inline; font-size: 8.5pt; color: var(--text); margin: 0 0 0 4pt; }
  .card { padding: 7pt 10pt; border-radius: 10pt; border-width: 1px; }
  html.js .steps, .steps { display: block; }
  html.js .step, .step { display: block; break-inside: avoid; }
  .step h3 { display: inline; }
  .step h3 button { display: inline !important; width: auto !important; padding: 0; border: 0 !important; font-size: 8.6pt; font-weight: 500; color: var(--accent) !important; }
  .step .n { font-size: 8.6pt; min-width: 0; margin-right: 3pt; background: none; -webkit-text-fill-color: currentColor; color: var(--accent); }
  html.js .step .panel, .step .panel { display: inline !important; padding: 0; font-size: 8.6pt; }
  .step h3::after { content: ':'; color: var(--accent); font-weight: 500; }
  .step + .step { margin-top: 3pt; }
  .tools { margin-top: 5pt; }
  .ai { margin-top: 6pt; }
  .ai h3, .skills h3, .pair h3 { font-size: 7.4pt; margin-bottom: 3pt; text-transform: none; font-weight: 500; color: var(--text); }
  .bullets { gap: 2pt; }
  .bullets li { padding-left: 10pt; }
  .bullets li::before { content: '•'; background: none; width: auto; height: auto; top: 0; color: #b600a8; }
  .fit { display: block; }
  .fit details { display: block; background: none; border: 0; border-radius: 0; padding: 0; break-inside: avoid; }
  .fit details + details { margin-top: 3pt; }
  .fit summary { display: inline; padding: 0; }
  .fit summary h3 { display: inline; font-size: 8.6pt; color: var(--accent); }
  .fit summary h3::after { content: ':'; }
  .fit summary .pill { display: none; }
  .fit details p { display: inline; padding: 0; }
  .timeline { margin-left: 3pt; }
  .job { padding: 0 0 5pt 13pt; break-inside: avoid; }
  .job::before { left: -4pt; top: 3pt; width: 6pt; height: 6pt; box-shadow: none; }
  .job h3 { font-size: 9.2pt; }
  .job .org { font-size: 8.4pt; margin-bottom: 1pt; }
  .projects { display: block; }
  .project { break-inside: avoid; }
  .project + .project { margin-top: 5pt; }
  .project h3 { font-size: 9.8pt; }
  .project .status { font-size: 7.4pt; text-transform: none; }
  .project > p { margin-top: 2pt; }
  .metrics { margin-top: 3pt; gap: 3pt; }
  .metrics li { font-size: 7.4pt; padding: 1pt 6pt; }
  .project details { margin-top: 3pt; }
  .project summary { display: none; }
  .project details ul { margin-top: 0; }
  .project .host { font-size: 7.8pt; }
  .also { margin-top: 5pt; }
  .skills { gap: 2pt; }
  .skills > div h3 { display: inline; font-size: 8.5pt; color: var(--accent); }
  .skills > div h3::after { content: ': '; }
  .chips { display: inline; }
  .chips li { display: inline; border: 0; padding: 0; font-size: 8.6pt; color: var(--text); }
  .chips li:not(:last-child)::after { content: ', '; }
  .pair { display: block; }
  .pair .card { background: none; border: 0; padding: 0; border-radius: 0; }
  .pair .card h3 { display: inline; font-size: 8.5pt; color: var(--accent); }
  .pair .card h3::after { content: ': '; }
  .pair .card p { display: inline; }
  footer { margin-top: 6pt; padding: 4pt 0 0; font-size: 7pt; }
  footer p + p { margin-top: 2pt; }
  footer .consent { font-size: 6.6pt; }
}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="topnav noprint">
  <div class="wrap">
    <a class="mono" href="#top">BN</a>
    <nav aria-label="Sections">
      <a href="#summary">Summary</a><a href="#sdlc">AI SDLC</a><a href="#fit">Role fit</a><a href="#experience">Experience</a><a href="#projects">Projects</a><a href="#skills">Skills</a>
    </nav>
    <a class="btn small" href="${esc(PDF)}" download>PDF</a>
  </div>
</div>
<div class="page-pad">
<header class="hero" id="top">
  <div class="slats" aria-hidden="true"></div>
  <div class="wrap hero-in">
    <div>
      <p class="eyebrow">Curriculum vitae</p>
      <h1 class="name">${person.name.split(' ').map((w) => `<span>${esc(w)}</span>`).join(' ')}</h1>
      <p class="role">${esc(person.headline)}</p>
      <p class="focus">${esc(person.focus)}</p>
      <ul class="facts"><li>${esc(person.location)}</li><li>${esc(person.terms)}</li><li>${esc(languagesText)}</li></ul>
      <p class="contacts">
        <a class="btn" href="mailto:${esc(person.email)}">${esc(person.email)}</a>
        ${PHONE ? `<a class="btn" href="tel:${esc(PHONE.replace(/\s/g, ''))}">${esc(PHONE)}</a>` : ''}
        ${person.links.map((l) => `<a class="btn" href="${esc(l.url)}">${esc(l.label)}</a>`).join('\n        ')}
        <a class="btn cta noprint" href="${esc(PDF)}" download>Download PDF</a>
      </p>
    </div>
    <img class="avatar" src="portrait.jpg" width="250" height="250" alt="Portrait of ${esc(person.name)}">
  </div>
</header>

<main id="main" class="wrap">
<section id="summary" class="rv">
  <h2 class="title">${title('Summary')}</h2>
  <p class="lead">${txt(cv.summary)}</p>
  <ul class="numbers">
    ${cv.numbers.map((n) => `<li class="card"><span class="value">${esc(n.value)}</span><span class="label">${txt(n.label)}</span></li>`).join('\n    ')}
  </ul>
</section>

<section id="sdlc" class="rv">
  <h2 class="title">${title('AI-assisted SDLC')}</h2>
  <p class="sub">How I deliver, step by step</p>
  <ol class="steps">
    ${cv.sdlc
      .map(
        (s, i) => `<li class="step${i === 0 ? ' on' : ''}">
      <h3><button type="button" aria-expanded="${i === 0}" aria-controls="step-${i + 1}"><span class="n">${String(i + 1).padStart(2, '0')}</span>${esc(s.title)}</button></h3>
      <p class="panel" id="step-${i + 1}">${txt(s.text)}</p>
    </li>`,
      )
      .join('\n    ')}
  </ol>
  <p class="tools"><b>Tools:</b> ${txt(cv.tools)}</p>
  <div class="ai">
    <h3>AI systems in production</h3>
    <ul class="bullets">
      ${cv.aiSystems.map((a) => `<li>${txt(a)}</li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section id="fit" class="rv">
  <h2 class="title">${title('Role fit')}</h2>
  <p class="sub">Solutions Architect · AI-assisted SDLC: what the role asks, and what shows it</p>
  <p class="expand noprint"><button type="button" class="pill" data-expand>Open all</button></p>
  <div class="fit">
    ${cv.fit
      .map(
        (f, i) => `<details${i < 2 ? ' open' : ''}>
      <summary><h3>${esc(f.ask)}</h3><span class="pill">Evidence</span></summary>
      <p>${txt(f.evidence)}</p>
    </details>`,
      )
      .join('\n    ')}
  </div>
</section>

<section id="experience" class="rv">
  <h2 class="title">${title('Experience')}</h2>
  <ol class="timeline">
    ${[...cv.experience]
      .sort(byRecency)
      .map(
        (j) => `<li class="job">
      <h3>${esc(j.role)}</h3>
      <p class="org">${j.url ? `<a href="${esc(j.url)}">${esc(j.org)}</a>` : esc(j.org)}${j.place ? ` · ${esc(j.place)}` : ''} · <span class="dates">${when(j)}</span></p>
      <p>${txt(j.text)}</p>
    </li>`,
      )
      .join('\n    ')}
  </ol>
</section>

<section id="projects" class="rv">
  <h2 class="title">${title('Projects')}</h2>
  <div class="filters" role="group" aria-label="Show the projects that use a skill">
    ${Object.entries(cv.SKILL_TAGS)
      .map(([key, label]) => `<button type="button" class="pill" data-skill="${key}" aria-pressed="false">${esc(label)}</button>`)
      .join('\n    ')}
  </div>
  <p class="filter-note" aria-live="polite"></p>
  <div class="projects">
    ${cv.projects
      .map(
        (p) => `<article class="project card${p.pdf === false ? ' noprint' : ''}" data-skills="${p.skills.join(' ')}">
      <header><h3>${esc(p.name)}</h3>${p.url ? `<a class="host" href="${esc(p.url)}">${esc(host(p.url))}<span class="noprint"> ↗</span></a>` : ''}<span class="status">${esc(p.status)}</span></header>
      <p>${txt(p.text)}</p>
      ${p.metrics ? `<ul class="metrics">${p.metrics.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
      <details open>
        <summary>How it is built</summary>
        <ul class="bullets">${p.points.map((x) => `<li>${txt(x)}</li>`).join('')}</ul>
      </details>
    </article>`,
      )
      .join('\n    ')}
  </div>
  <p class="also noprint">${txt(cv.alsoBuilt)}</p>
  <p class="also print-only">${txt(cv.alsoInPdf)}</p>
</section>

<section id="skills" class="rv">
  <h2 class="title">${title('Skills')}</h2>
  <div class="skills">
    ${cv.skills
      .map((g) => `<div><h3>${esc(g.group)}</h3><ul class="chips">${g.items.map((s) => `<li class="pill">${esc(s)}</li>`).join('')}</ul></div>`)
      .join('\n    ')}
  </div>
</section>

<section id="education" class="rv">
  <h2 class="title">${title('Education and languages')}</h2>
  <div class="pair">
    <div class="card">
      <h3>Education</h3>
      ${cv.education.map((e) => `<p><b>${esc(e.degree)}, ${esc(e.field)}</b> · ${esc(e.school)} · ${esc(e.start)}–${esc(e.end)}</p>`).join('')}
    </div>
    <div class="card">
      <h3>Languages</h3>
      <p>${person.languages.map(([l, level]) => `${esc(l)}: ${esc(level)}`).join(' · ')}</p>
    </div>
  </div>
</section>
</main>

<footer class="wrap">
  <p>Updated ${esc(new Date(`${cv.UPDATED}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))} · <a href="${URL_CV}">${esc(host(URL_CV))}</a> · this CV as <a href="cv.txt">plain text</a> and <a href="resume.json">JSON Resume</a></p>
  <p class="consent">${esc(cv.consent)}</p>
</footer>
</div>
<script>
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  // sections come in as they scroll in
  const parts = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const seen = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    parts.forEach((p) => seen.observe(p));
  } else parts.forEach((p) => p.classList.add('in'));
  // the SDLC: one step open at a time
  const steps = [...document.querySelectorAll('.step')];
  const pick = (i) => steps.forEach((s, k) => { s.classList.toggle('on', k === i); s.querySelector('button').setAttribute('aria-expanded', String(k === i)); });
  steps.forEach((s, i) => s.querySelector('button').addEventListener('click', () => pick(i)));
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
  // role fit: open all
  const expand = document.querySelector('[data-expand]');
  expand?.addEventListener('click', () => { const all = [...document.querySelectorAll('.fit details')]; const open = !all.every((d) => d.open); all.forEach((d) => (d.open = open)); expand.textContent = open ? 'Close all' : 'Open all'; });
  // printed: every panel open
  addEventListener('beforeprint', () => { document.querySelectorAll('details').forEach((d) => (d.open = true)); parts.forEach((p) => p.classList.add('in')); });
})();
</script>
</body>
</html>
`;

// the same words as Markdown and as JSON Resume
const md = [
  `# ${person.name}`,
  '',
  `**${person.headline}**  `,
  `${person.focus}`,
  '',
  `${person.location} · ${person.terms}  `,
  `${[person.email, PHONE].filter(Boolean).join(' · ')} · ${person.links.map((l) => l.url).join(' · ')}  `,
  `Languages: ${languagesText}`,
  '',
  '## Summary',
  '',
  cv.summary,
  '',
  ...cv.numbers.map((n) => `- **${n.value}** ${n.label}`),
  '',
  '## AI-assisted SDLC: how I deliver',
  '',
  ...cv.sdlc.map((s, i) => `${i + 1}. **${s.title}.** ${s.text}`),
  '',
  `**Tools:** ${cv.tools}`,
  '',
  '### AI systems in production',
  '',
  ...cv.aiSystems.map((a) => `- ${a}`),
  '',
  '## Role fit: Solutions Architect, AI-assisted SDLC',
  '',
  ...cv.fit.map((f) => `- **${f.ask}:** ${f.evidence}`),
  '',
  '## Experience',
  '',
  ...[...cv.experience].sort(byRecency).flatMap((j) => [`### ${j.role}, ${j.org}`, '', `${whenText(j)}${j.place ? ` · ${j.place}` : ''}`, '', j.text, '']),
  '## Projects',
  '',
  ...cv.projects.flatMap((p) => [`### ${p.name}${p.url ? ` (${p.url})` : ''}`, '', `${p.status}. ${p.text}`, '', ...(p.metrics ? [p.metrics.join(' · '), ''] : []), ...p.points.map((x) => `- ${x}`), '']),
  cv.alsoBuilt,
  '',
  '## Skills',
  '',
  ...cv.skills.map((g) => `- **${g.group}:** ${g.items.join(', ')}`),
  '',
  '## Education',
  '',
  ...cv.education.map((e) => `- ${e.degree}, ${e.field}. ${e.school}, ${e.start}–${e.end}`),
  '',
  '## Languages',
  '',
  ...person.languages.map(([l, level]) => `- ${l}: ${level}`),
  '',
  `_Updated ${cv.UPDATED}. ${URL_CV}_`,
  '',
].join('\n');

const resume = {
  $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
  basics: {
    name: person.name,
    label: person.headline,
    image: `${URL_CV}portrait.jpg`,
    email: person.email,
    ...(PHONE ? { phone: PHONE } : {}),
    url: cv.SITE,
    summary: cv.summary,
    location: { city: 'Poznań', countryCode: 'PL' },
    profiles: person.links.filter((l) => l.network).map((l) => ({ network: l.network, username: l.username, url: l.url })),
  },
  work: cv.experience
    .filter((j) => !j.role.includes('pro bono'))
    .map((j) => ({ name: j.org, position: j.role, ...(j.url ? { url: j.url } : {}), startDate: j.start, ...(j.end ? { endDate: j.end } : {}), summary: j.text })),
  volunteer: cv.experience
    .filter((j) => j.role.includes('pro bono'))
    .map((j) => ({ organization: j.org, position: j.role, startDate: j.start, endDate: j.end, summary: j.text })),
  education: cv.education.map((e) => ({ institution: e.school, area: e.field, studyType: e.degree, startDate: e.start, endDate: e.end })),
  skills: [
    { name: 'AI-assisted SDLC', keywords: cv.sdlc.map((s) => s.title) },
    ...cv.skills.map((g) => ({ name: g.group, keywords: g.items })),
  ],
  languages: person.languages.map(([language, fluency]) => ({ language, fluency })),
  projects: cv.projects.map((p) => ({ name: p.name, description: `${p.status}. ${p.text}`, highlights: [...(p.metrics ?? []), ...p.points], ...(p.url ? { url: p.url } : {}), keywords: p.skills.map((k) => cv.SKILL_TAGS[k]) })),
  meta: { canonical: `${URL_CV}resume.json`, version: 'v1.0.0', lastModified: cv.UPDATED },
};

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), html);
writeFileSync(join(OUT, 'cv.txt'), md); // (Markdown, served as plain text: the server has no type for .md)
writeFileSync(join(OUT, 'resume.json'), `${JSON.stringify(resume, null, 2)}\n`);
if (OUT !== PUBLIC) copyFileSync(join(PUBLIC, 'portrait.jpg'), join(OUT, 'portrait.jpg'));

// the PDF, printed from the page itself
const profile = join(tmpdir(), `cv-pdf-${process.pid}`);
const port = 9700 + Math.floor(Math.random() * 40);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
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
  await send('Page.navigate', { url: pathToFileURL(join(OUT, 'index.html')).href });
  await sleep(1500);
  await send('Runtime.evaluate', {
    expression: `Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode().catch(() => {}))]).then(() => { dispatchEvent(new Event('beforeprint')); return true; })`,
    awaitPromise: true,
  });
  const { data } = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, generateTaggedPDF: true, generateDocumentOutline: true });
  writeFileSync(join(OUT, PDF), Buffer.from(data, 'base64'));
  ws.close();
} finally {
  chrome.kill();
  await sleep(400);
  rmSync(profile, { recursive: true, force: true });
}
console.log(`CV → ${OUT}: index.html, cv.txt, resume.json, ${PDF}`);

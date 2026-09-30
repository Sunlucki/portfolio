// All copy and data for the page. Facts mirror ../data/profile.json in the knowledge base.

import musicTracks from './music.json';

export const PERSON = {
  name: 'Bogdan Nenadović',
  firstName: 'bogdan',
  role: 'Full-Stack Design Engineer',
  // TODO: confirm the public mailbox — sunlucki.pl has no MX records yet.
  email: 'hello@sunlucki.pl',
  linkedin: 'https://www.linkedin.com/in/sunlucki',
  github: 'https://github.com/Sunlucki',
  location: 'Poznań, Poland',
} as const;

export const NAV = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
] as const;

export const HERO_FRAMES = 83; // frames 0–82 of the eye clip (public/hero/count.txt)
export const HERO_FG_FRAMES = 25; // first frames with the background removed (subject cut-out layer)

export const HERO_TAGLINE = 'a full-stack design engineer who designs, builds and ships complete products';

// The About text opens with his name and his handle (his words, 2026-09-30). Hovering the handle asks "Why?";
// clicking it scatters the text for its story (NAME_STORY) until "Got it" gathers it back.
export const ABOUT_HELLO = {
  text: 'Hi, my name is Bogdan Nenadović, but online I’m known as',
  handle: 'SUNLUCKI',
  hint: 'Why?',
  close: 'Got it',
};

export const ABOUT_TEXT =
  'For eight years I’ve been helping people bring their ideas and dreams to life. Design, video and marketing taught me how products should look, feel and sell. Now I build them end to end: interfaces, backends, infrastructure and native iOS apps, shipped AI-native with rigorous verification. Let’s build something that works flawlessly and looks unforgettable.';

// SUNLUCKI, Bogdan's handle, and what it stands for (his words, 2026-09-30). *Marked* words are highlighted:
// the Sun in gold, luck in violet.
export const NAME_STORY = {
  question: 'Why SUNLUCKI?',
  text: 'My handle brings together our star, the *Sun*, which gives us light, warmth and life, and *luck*, which only comes to those who try to make their dreams real.',
  philosophy: 'That is my whole philosophy: devotion to the cosmos, and to luck.',
};

// The numbers after About, on a drum that turns with the scroll (Bogdan's picks, 2026-09-30). Checked claims:
// ../data/profile.json (stats, experience); 238 projects (counting those he did for his employers), 250+ videos,
// 1,200+ graphic designs and 139 tracks per Bogdan (2026-09-30). The hours count from 2016, when he started, at his 8 to 10 hours a day, 4 to 6
// days a week, taken at the middle (45 a week) and rounded down to the thousand. Lines of code: 611,820 on
// 2026-09-30, the source in the tips of all his repositories, only what his own git identities wrote, the code
// line PROTECTDENT, XyliMelts and Mind Logistic share counted once, vendored and generated code left out.
export const NUMBERS_TITLE = 'Here are the numbers';
export const NUMBERS_CAPTION = 'Everyone loves big numbers… and I’ve got them.';
const HOURS = Math.floor(((Date.now() - Date.UTC(2016, 0, 1)) / (7 * 86_400_000)) * 45 / 1000) * 1000;
export const NUMBERS = [
  { value: 600_000, suffix: '+', label: 'lines of code shipped' },
  { value: HOURS, suffix: '+', label: 'hours of work since 2016' },
  { value: 238, suffix: '', label: 'projects delivered' },
  { value: 1_200, suffix: '+', label: 'graphic designs' },
  { value: 250, suffix: '+', label: 'videos produced' },
  { value: 139, suffix: '', label: 'tracks produced' },
  { value: 5, suffix: '', label: 'native Apple apps' },
  { value: 3, suffix: '', label: 'companies founded' },
];

// The manifesto after the hero (Bogdan's own lines of 2026-09-30, in English), written in particles under a
// shape each: the galaxy the hero's iris winds into, the Earth, the Earth lit where people live, a heart, a
// bulb the hands don't quite reach, a brain, a laptop the camera dives into, down to its chip, whose brain
// turns into the letters AI, an eye. *Marked* words are highlighted, ~marked~ ones struck out.
export const PHRASES = [
  'We live in a universe full of *possibilities*.',
  'On a planet of *dreams*, our shared *home*!',
  'Our *hearts* beat in every corner of the world.',
  'And inside, our hearts are warmed by *dreams*.',
  'Some of those dreams become *ideas*.',
  'And we look for a way to make them *real*.',
  'I use a *computer* to bring dreams to life.',
  'I’ve put my most *advanced tool* inside it.',
  'Tell me about *your dream*, and I’ll do my best to *help you*.',
];
// Shapes per phrase: the chip's holds over two, the chip with a brain and the chip with AI.
export const PHRASE_SHAPES = [1, 1, 1, 1, 1, 1, 1, 2, 1];
// Scroll from each shape to the next, in shapes: the galaxy holds its phrase a while before it collapses into
// the Earth, and the camera's dive from the laptop into its chip takes half as long again as a morph.
export const SHAPE_SCROLL = [1.8, 1, 1, 1, 1, 1, 1.5, 1, 1];

export type Run = { text: string; mark: 'plain' | 'hi' | 'off' };

// A phrase as runs of plain, highlighted and struck-out text.
export const phraseRuns = (phrase: string): Run[] =>
  phrase
    .split(/(\*[^*]+\*|~[^~]+~)/)
    .filter(Boolean)
    .map((part) =>
      part[0] === '*' ? { text: part.slice(1, -1), mark: 'hi' } : part[0] === '~' ? { text: part.slice(1, -1), mark: 'off' } : { text: part, mark: 'plain' },
    );

export const phraseText = (phrase: string) => phrase.replace(/[*~]/g, '');

// Tools in daily use, one folder each. Only what the repositories and files actually show
// (../data/profile.json → skills); nothing listed on the old CV without evidence.
export const STACK = [
  { name: 'Frontend', items: ['TypeScript', 'React', 'Next.js', 'Vite', 'Tailwind CSS', 'shadcn/ui', 'TanStack Query', 'Zustand', 'Zod'] },
  { name: 'Backend', items: ['Node.js', 'Fastify', 'Express', 'PostgreSQL', 'Prisma', 'Drizzle', 'Redis', 'BullMQ', 'Socket.IO', 'OpenAPI'] },
  { name: 'iOS', items: ['Swift 6', 'SwiftUI', 'WidgetKit', 'Live Activities', 'StoreKit 2', 'APNs', 'CoreNFC', 'XCTest'] },
  { name: 'AI', items: ['Claude Code', 'Codex', 'Claude API', 'OpenAI API', 'Groq', 'Structured outputs', 'Tesseract OCR', 'whisper.cpp'] },
  { name: 'Fintech', items: ['KSeF 2.0', 'SAF-T / JPK', 'PSD2 banking', 'Stripe', 'PayU', 'Przelewy24', 'Allegro', 'BaseLinker', 'Shopify'] },
  { name: 'DevOps', items: ['Linux', 'nginx', 'PM2', 'Docker', 'GitHub Actions', 'Let’s Encrypt', 'Sentry', 'Vitest', 'Playwright'] },
  { name: 'Design', items: ['Figma', 'Framer Motion', 'Three.js', 'React Three Fiber', 'GLSL', 'Spline', 'Photoshop', 'Illustrator'] },
  { name: 'Media', items: ['Final Cut Pro', 'Premiere Pro', 'Logic Pro', 'Higgsfield', 'Kling', 'Midjourney', 'ElevenLabs', 'Remotion'] },
];

export const SERVICES = [
  {
    name: 'Product Engineering',
    description:
      'End-to-end web products in TypeScript, React, Node.js and PostgreSQL, with the data model, APIs, deploys and backups included. MVPs and SaaS built to survive production.',
  },
  {
    name: 'Design Engineering',
    description:
      'Design systems, motion and interfaces that feel crafted: accessible components, spring-based animation and Three.js / WebGL when the story needs depth.',
  },
  {
    name: 'AI Integration',
    description:
      'LLM features with guardrails (structured outputs, document AI and assistants), delivered AI-native with specs, tests and adversarial reviews on every change.',
  },
  {
    name: 'Payments & E-invoicing',
    description:
      'Stripe, PayU, Przelewy24, marketplaces and Poland’s KSeF 2.0: financial integrations engineered for correctness, idempotency and audits.',
  },
  {
    name: 'Native iOS',
    description:
      'SwiftUI apps with widgets, Live Activities, offline sync and push, connected to the same backend as your web product.',
  },
  {
    name: 'Brand & Motion',
    description:
      'Identity, packaging and AI-assisted video. The person designing your brand can also ship your product.',
  },
] as const;

// A scenario in a product's promo: its label on the site and the promo's scene it jumps to (src/promo).
export type Chapter = { label: string; scene: string };
// A site in a card's slideshow: its frames (Bogdan's mockups of it, pages of it that scroll by, a demo film with
// its first frame as the image) and its address while it is live.
// A native app on the Mobile Apps section's 3D iPhone: its screens (simulator screenshots, fictional data), a
// caption for each.
export type PhoneApp = { label: string; tagline: string; tint: string; screens: { image: string; caption: string; alt: string }[] };
export type Slide = { label: string; url?: string; frames: { image: string; alt: string; page?: boolean; video?: string; focus?: string }[] };

export type Project = {
  category: string;
  name: string;
  description: string;
  stack: string[];
  live?: string;
  liveLabel?: string; // the live link's label, if not "Live Project"
  images: [string, string, string];
  alts: [string, string, string];
  // the product's 2D promo, played live in the card in place of the screenshots
  promo?: { id: 'crm' | 'hr' | 'b2b' | 'taxi'; chapters: Chapter[] };
  // or a slideshow of sites, in place of the screenshots
  slides?: Slide[];
};

// Named by the system each is (Bogdan, 2026-09-30); the product or the client goes in the line above it.
export const PROJECTS: Project[] = [
  {
    category: 'Own product · SIMBIA CRM',
    name: 'CRM & Accounting System',
    description:
      'Sales CRM with full double-entry accounting, KSeF e-invoicing and open banking. My own company runs on it.',
    stack: ['React 19', 'Fastify', 'PostgreSQL', 'SwiftUI'],
    live: 'https://simbia.eu',
    images: ['/work/simbia-1.webp', '/work/simbia-2.webp', '/work/simbia-3.webp'],
    alts: ['SIMBIA CRM kanban board', 'SIMBIA CRM finance overview', 'SIMBIA CRM dashboard'],
    promo: {
      id: 'crm',
      chapters: [
        { label: 'Dashboard', scene: '05 Pulpit' },
        { label: 'Lead scoring', scene: '07 Scoring' },
        { label: 'Priorities', scene: '09 Priorytety' },
        { label: 'Kanban', scene: '11 Kanban' },
        { label: 'Offer', scene: '12 Oferta' },
        { label: 'Follow-up', scene: '14 Follow-up' },
        { label: 'Invoice & KSeF', scene: '16 Faktura' },
        { label: 'Mobile', scene: '20 Na biurku i w kieszeni' },
      ],
    },
  },
  {
    category: 'Client stores · Mind Logistic, PROTECTDENT, XyliMelts',
    name: 'B2B / B2C Store Platform',
    description:
      'One commerce engine behind three live stores: B2B wholesale with company approvals, trade credit, 7 payment gateways and 6 marketplace channels, and B2C storefronts in up to 23 languages.',
    stack: ['React', 'Node.js', 'PostgreSQL', 'Three.js'],
    live: 'https://bosspartners.pl',
    images: ['/work/b2b-1.webp', '/work/b2b-2.webp', '/work/b2b-3.webp'],
    alts: ['Wholesale portal audience section', 'Wholesale platform key numbers', 'Wholesale platform landing page'],
    promo: {
      id: 'b2b',
      chapters: [
        { label: 'Sign-up', scene: '03-04 Rejestracja NIP' },
        { label: 'Approval', scene: '06-07 Weryfikacja i mail' },
        { label: 'Store', scene: '09 Sklep' },
        { label: 'Your price', scene: '11 Twoja cena' },
        { label: 'Quick order', scene: '13 Szybkie zamówienie' },
        { label: 'Trade credit', scene: '15 Kredyty' },
        { label: 'Shipping', scene: '17 InPost' },
        { label: 'Sales channels', scene: '18 Kanały sprzedaży' },
      ],
    },
  },
  {
    category: 'Own product · iApply',
    name: 'Workforce Management System',
    description:
      'Shift and time tracking for staffing agencies: QR, GPS and NFC clock-in, a live coordinator board and a native iOS app.',
    stack: ['React', 'Socket.IO', 'PostgreSQL', 'SwiftUI'],
    live: 'https://iapply.com.pl',
    images: ['/work/iapply-1.webp', '/work/iapply-2.webp', '/work/iapply-3.webp'],
    alts: ['iApply QR check-in centre', 'iApply shift planning', 'iApply weekly schedule'],
    promo: {
      id: 'hr',
      chapters: [
        { label: 'Start', scene: '03-04 Start' },
        { label: 'QR check-in', scene: '06-07 QR' },
        { label: 'Shift market', scene: '09-11 Giełda' },
        { label: 'Schedule', scene: '12-13 Grafik' },
        { label: 'Tasks', scene: '14 Zadania' },
        { label: 'Overtime', scene: '15 Nadgodziny' },
        { label: 'Absence', scene: '17 Nieobecność' },
        { label: 'NFC', scene: '18 NFC' },
      ],
    },
  },
  {
    category: 'Client · TAXI BOSS',
    name: 'Fleet Management System',
    description:
      'Fleet platform for Uber and Bolt partners: driver funnel, e-signed contracts, Uber API sync and a SwiftUI driver app.',
    stack: ['React', 'Express', 'Redis', 'SwiftUI'],
    images: ['/work/taxiboss-1.webp', '/work/taxiboss-2.webp', '/work/taxiboss-3.webp'],
    alts: ['TAXI BOSS 3D vehicle showcase', 'TAXI BOSS driver dashboard', 'TAXI BOSS landing page'],
    promo: {
      id: 'taxi',
      chapters: [
        { label: 'Candidate', scene: '03 Kandydat' },
        { label: 'Sign-up', scene: '06 Rejestracja' },
        { label: 'Documents', scene: '09 Dokumenty' },
        { label: 'Contract', scene: '12 Umowa' },
        { label: 'Car', scene: '14 Auto' },
        { label: 'Fleet', scene: '15 Flota' },
        { label: 'Driver app', scene: '18 Mobile' },
      ],
    },
  },
  {
    // Bogdan's sites for clients (2026-09-30), also on his Behance; Architect Vision was his own interior design
    // studio, now closed. The sites with a demo film come first; each site in his order: its film, his mockups of
    // it, then pages of it, which scroll on a MacBook (scripts/prepare-media.py).
    category: 'Client websites · WordPress & Elementor',
    name: 'WordPress Websites',
    description:
      'Websites designed and built on WordPress for small businesses: a pâtisserie, a barbershop with online booking, a moving company in Canada, a medical school, a print shop, a hair salon, a streetwear brand and e-shops.',
    stack: ['WordPress', 'Elementor'],
    live: 'https://www.behance.net/styleicon',
    liveLabel: 'Behance',
    images: ['/work/wp-kreem-0.webp', '/work/wp-blackpoint-0.webp', '/work/wp-lizard-0.webp'],
    alts: ['KREEM pâtisserie website on a laptop', 'Black Point barbershop website on a laptop', 'Lizard Moving website on a tablet'],
    slides: [
      { label: 'Lizard Moving', url: 'https://lizardmoving.com', frames: [
        { image: '/work/wp-lizard-demo.webp', video: '/work/wp-lizard-demo.mp4', alt: 'Lizard Moving mobile site demo' },
        { image: '/work/wp-lizard-0.webp', alt: 'Lizard Moving website on a tablet', focus: 'center 45%' },
        { image: '/work/wp-lizard-1.webp', alt: 'Lizard Moving home page', page: true },
      ] },
      { label: 'Magic Patron', url: 'https://magicpatron.pl', frames: [
        { image: '/work/wp-magicpatron-demo.webp', video: '/work/wp-magicpatron-demo.mp4', alt: 'Magic Patron mobile site demo' },
        { image: '/work/wp-magicpatron-0.webp', alt: 'Magic Patron e-shop on a phone' },
        { image: '/work/wp-magicpatron-1.webp', alt: 'Magic Patron home page', page: true },
        { image: '/work/wp-magicpatron-2.webp', alt: 'Magic Patron product page', page: true },
      ] },
      { label: 'Alibia', frames: [
        { image: '/work/wp-alibia-demo.webp', video: '/work/wp-alibia-demo.mp4', alt: 'Alibia mobile shop demo' },
        { image: '/work/wp-alibia-0.webp', alt: 'Alibia e-shop on a laptop', focus: 'center 45%' },
        { image: '/work/wp-alibia-1.webp', alt: 'Alibia home page', page: true },
        { image: '/work/wp-alibia-2.webp', alt: 'Alibia shop page', page: true },
      ] },
      { label: 'KREEM', url: 'https://kreem.pl', frames: [
        { image: '/work/wp-kreem-0.webp', alt: 'KREEM pâtisserie website on a laptop' },
        { image: '/work/wp-kreem-1.webp', alt: 'KREEM home page', page: true },
        { image: '/work/wp-kreem-2.webp', alt: 'KREEM cakes page', page: true },
      ] },
      { label: 'Black Point', frames: [
        { image: '/work/wp-blackpoint-0.webp', alt: 'Black Point barbershop website on a laptop', focus: 'center 35%' },
        { image: '/work/wp-blackpoint-2.webp', alt: 'Black Point price list on a laptop', focus: 'center 40%' },
        { image: '/work/wp-blackpoint-1.webp', alt: 'Black Point home page', page: true },
      ] },
      { label: 'Nami Clean', url: 'https://namiclean.pl', frames: [
        { image: '/work/wp-namiclean-0.webp', alt: 'Nami Clean cleaning service website on a laptop', focus: 'center 60%' },
        { image: '/work/wp-namiclean-1.webp', alt: 'Nami Clean home page', page: true },
      ] },
      { label: 'Casada', frames: [
        { image: '/work/wp-casada-0.webp', alt: 'Casada armchairs website on a laptop', focus: 'center 35%' },
        { image: '/work/wp-casada-1.webp', alt: 'Casada home page', page: true },
        { image: '/work/wp-casada-2.webp', alt: 'Casada product page', page: true },
      ] },
      { label: 'ARAB 30', frames: [
        { image: '/work/wp-arab-0.webp', alt: 'ARAB 30 streetwear shop on a phone' },
        { image: '/work/wp-arab-1.webp', alt: 'ARAB 30 home page', page: true },
        { image: '/work/wp-arab-2.webp', alt: 'ARAB 30 shop page', page: true },
        { image: '/work/wp-arab-3.webp', alt: 'ARAB 30 product page', page: true },
      ] },
      { label: 'Architect Vision', frames: [
        { image: '/work/wp-architect-0.webp', alt: 'Architect Vision interior design studio website on a laptop', focus: 'center 35%' },
        { image: '/work/wp-architect-1.webp', alt: 'Architect Vision home page', page: true },
      ] },
      { label: 'Enveloper', frames: [
        { image: '/work/wp-enveloper-0.webp', alt: 'Enveloper home page', page: true },
        { image: '/work/wp-enveloper-1.webp', alt: 'Enveloper shop categories', page: true },
      ] },
      { label: 'Medicus', frames: [{ image: '/work/wp-medicus-0.webp', alt: 'Medicus medical school home page', page: true }] },
      { label: 'Hair Hub', frames: [{ image: '/work/wp-hairhub-0.webp', alt: 'Hair Hub salon home page', page: true }] },
      { label: 'Fencing', frames: [{ image: '/work/wp-fencing-0.webp', alt: 'Fencing referees home page', page: true }] },
    ],
  },
];

// Marquee: project covers from the STYLEICON archive (scripts/prepare-media.py). `?v` busts the 30-day cache.
const tile = (i: number, alt: string) => ({ src: `/tiles/${String(i).padStart(2, '0')}.webp?v=5`, alt });

// Branding, print and social media only: the sites are in the WordPress card (Bogdan, 2026-09-30).
export const TILES = [
  tile(0, 'HYPE event series posters'),
  tile(1, 'Music poster for Ihor Poperechny'),
  tile(2, 'DC Consulting logo'),
  tile(3, 'Touch Coffee branding'),
  tile(4, 'Da Vinci Tattoo business cards'),
  tile(5, 'Black Point T-shirt with the Ant Might print'),
  tile(6, 'Black Point barbershop social media'),
  tile(7, 'Adaya branding'),
  tile(8, 'Soul Nation Tattoo branding'),
  tile(9, 'Strimat passenger transport'),
  tile(10, 'Profi Dokument branding'),
  tile(11, 'Zero Śladu branding'),
  tile(12, 'Yana Lashes business cards'),
  tile(13, 'Stories Beauty branding'),
  tile(14, 'Black Point T-shirt'),
  tile(15, 'Laser hair removal business cards'),
  tile(16, 'PROTECTDENT flyer'),
  tile(17, 'Alibia logo'),
  tile(18, 'Time Relax Body branding'),
  tile(19, 'Na Serio Na Żarty restaurant social media'),
  tile(20, 'Business card for Ihor Poperechny'),
];

// Music: Bogdan's playlist (2026-09-30): fifteen tracks in his order, then the rest of his LUCKI BEATS album mixed,
// the titles in English and without "Beat" (his call). Track N plays /music/NNN.m4a, the AAC master from his Music
// library; both come from scripts/prepare-media.py, which writes music.json.
export const MUSIC = {
  artist: 'SUNLUCKI',
  album: 'LUCKI BEATS',
  links: [
    { label: 'Apple Music', href: 'https://music.apple.com/us/artist/sunlucki/1695520105' },
    { label: 'SoundCloud', href: 'https://soundcloud.com/sunlucki' },
  ],
  tracks: musicTracks as { title: string; seconds: number; artist?: string }[],
};

// Mobile apps: Bogdan's native iOS apps (2026-09-30), a section of their own after the web projects (his call);
// real screens from the iOS Simulator with demo data (scripts/prepare-media.py). SIMBIA CRM's app is left out:
// Russian only, live data only.
export const MOBILE_APPS: { caption: string; stack: string[]; apps: PhoneApp[] } = {
  caption:
    'Native SwiftUI apps beside the web platforms: clock-in by QR, GPS and NFC for staffing agencies, a driver app for a taxi fleet, and a private personal finance advisor.',
  stack: ['Swift 6', 'SwiftUI', 'SwiftData', 'WidgetKit', 'Live Activities'],
  apps: [
    {
      label: 'iApply',
      tagline: 'Clock-in and shifts for staffing agencies',
      tint: '#4C6EF5',
      screens: [
        { image: '/work/app-iapply-0.webp', caption: 'On the clock', alt: 'iApply worker home: on the clock with a running shift timer, clock out, availability, next shift and hours this month' },
        { image: '/work/app-iapply-1.webp', caption: 'Site QR code', alt: 'iApply coordinator QR code for clock-in at a site, with its expiry and validity options' },
        { image: '/work/app-iapply-2.webp', caption: 'Shift market', alt: 'iApply shift market: open shifts with free places, on-call sign-up and claim buttons' },
        { image: '/work/app-iapply-3.webp', caption: 'Coordinator board', alt: 'iApply coordinator dashboard: live attendance, today’s shifts, a claim to approve and tasks' },
      ],
    },
    {
      label: 'TAXI BOSS',
      tagline: 'The driver app for a taxi fleet',
      tint: '#F5B301',
      screens: [
        { image: '/work/app-taxi-0.webp', caption: 'Dashboard', alt: 'TAXI BOSS driver dashboard: weekly earnings, rides, monthly total, rating and the rented car' },
        { image: '/work/app-taxi-1.webp', caption: 'Earnings', alt: 'TAXI BOSS earnings: weekly totals and a bar chart by day' },
        { image: '/work/app-taxi-2.webp', caption: 'Documents', alt: 'TAXI BOSS documents: the required certificates, approved, each with a replace button' },
        { image: '/work/app-taxi-3.webp', caption: 'Schedule', alt: 'TAXI BOSS schedule: a month calendar of working days, days off and rental periods' },
      ],
    },
    {
      label: 'CashFlow',
      tagline: 'A private personal finance advisor',
      tint: '#14B8A6',
      screens: [
        { image: '/work/app-cashflow-0.webp', caption: 'Overview', alt: 'CashFlow overview: monthly income, expenses and commitments, what is left over, and spending by category' },
        { image: '/work/app-cashflow-1.webp', caption: 'Debt payoff plan', alt: 'CashFlow debt payoff plan: debts with snowball and avalanche strategies and the debt-free date' },
        { image: '/work/app-cashflow-2.webp', caption: 'Spending by category', alt: 'CashFlow spending by category: a donut chart with each category’s share' },
        { image: '/work/app-cashflow-3.webp', caption: 'Debt and savings', alt: 'CashFlow debt and savings status with a savings goal ring and an AI insight card' },
      ],
    },
  ],
};

// Videos on YouTube Bogdan made or is credited in (2026-09-30, views counted that day, 1,551,492 together): played in
// YouTube's own player (privacy-enhanced), their pictures from YouTube. Black Point's description links his
// Instagram, Diablica's names him as co-director, HYPE HOP by Alibia's for filming and editing; ŁAŁ credits him on
// screen; 100 000 MAGAZIN is on his own channel. Views are shown from 10,000 up.
export const VIDEO_VIEWS = '1.5M+ views on YouTube';
export const YOUTUBE_FILMS = [
  { slug: 'black-point', youtube: 'EmpEr-TNiTM', title: 'BLACK POINT', credit: 'ARAB', width: 1920, height: 1080, seconds: 143, views: 1_339_737 },
  { slug: 'diablica', youtube: 'y4qliIPDRp8', title: 'Diablica', credit: 'ARAB · co-director', width: 1920, height: 1080, seconds: 171, views: 135_735 },
  { slug: 'lal', youtube: 'zTLT6ZSKs90', title: 'ŁAŁ', credit: 'ARAB ft. Kalka, Wrzecion, Liv K, Mordo Mati', width: 1920, height: 1080, seconds: 256, views: 63_836 },
  { slug: 'hype-hop-alibia', youtube: 'k8B1CTu5alQ', title: 'HYPE HOP by Alibia', credit: 'Filming and editing', width: 1920, height: 1080, seconds: 344, views: 11_927 },
  { slug: 'magazin', youtube: 'Y28iR0GmlhI', title: '100 000 MAGAZIN', credit: 'SUNLUCKI production', width: 1920, height: 1080, seconds: 151 },
];

// The Video section's order (Bogdan's, 2026-09-30): Who Am I?, his films in his list's order, then the videos on
// YouTube (the grid lets wide and tall ones take turns); and the films he wants right under another in the grid.
export const VIDEO_ORDER = [
  'who-am-i', 'promo', 'dima-space', 'hype-hop', 'grzyb', 'chase-1090', 'hype-party', 'ant-interview', 'vlad-interview', 'loma', 'industrial',
  'eyes-in-the-night', 'adrian-the-barber', 'choose-your-style', 'juli-the-barber', 'rodi-m3', 'skater-cut', 'vlad-the-barber', 'valentines-day',
  'black-point', 'diablica', 'lal', 'hype-hop-alibia', 'magazin',
];
export const VIDEO_UNDER: Record<string, string> = { 'chase-1090': 'grzyb' };

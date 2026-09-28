// All copy and data for the page. Facts mirror ../data/profile.json in the knowledge base.

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

export const ABOUT_TEXT =
  'Eight years in design, video and marketing taught me how products should look, feel and sell. Now I build them end to end — interfaces, backends, infrastructure and native iOS apps — shipping AI-native with rigorous verification. Let’s build something that works flawlessly and looks unforgettable.';

export const STATS = [
  { value: 10, suffix: '+', label: 'production systems shipped in 2026' },
  { value: 339, suffix: '', label: 'API endpoints in one B2B platform' },
  { value: 4, suffix: '', label: 'native iOS apps' },
  { value: 23, suffix: '', label: 'languages in one storefront' },
] as const;

// Career timeline after the hero. The particles spell `label`, `title` and `line`; `text` is the
// fuller sentence for screen readers. Early years from Bogdan (2026-09-28); the rest mirrors
// ../data/profile.json (experience, company).
export const TIMELINE = [
  { label: '1998', title: 'Cherkasy, Ukraine', line: 'Born on the Dnipro', text: 'Born in Cherkasy, a city on the Dnipro in central Ukraine.' },
  { label: '2012', title: 'School, then studies', line: 'Cherkasy', text: 'Finished school in Cherkasy and went straight on to study.' },
  {
    label: '2016',
    title: 'Poznań, Poland',
    line: 'Computer Science · WSB',
    text: 'Moved to Poland and studied Computer Science with a Computer Graphics specialisation at WSB University.',
  },
  {
    label: '2017',
    title: 'Web developer',
    line: 'GreenView',
    text: 'Web developer at GreenView: websites from UX/UI to WordPress deployment, working with clients and marketing teams.',
  },
  {
    label: '2020',
    title: 'Co-founder',
    line: 'Black Point · Poznań',
    text: 'Co-founded Black Point, a barbershop and creative hub in Poznań — brand identity, interior, merch, booking website, social media and video.',
  },
  {
    label: '2022',
    title: 'Marketing lead',
    line: 'Black Point Group',
    text: 'Content creator at Pomaranczowi.PL, then leading the creative team and marketing at Black Point Group.',
  },
  {
    label: '2025',
    title: 'STYLEICON studio',
    line: 'Web · brand · video',
    text: 'Founded STYLEICON, a web, branding and video studio — and turned from building brands to building the software behind them.',
  },
  {
    label: '2026',
    title: 'AI-native engineer',
    line: '10+ production systems',
    text: 'AI-native product engineer: 10+ production systems for Polish and EU companies, including an accounting-grade CRM with KSeF and native iOS apps.',
  },
  {
    label: 'SIMBIA',
    title: 'My software company',
    line: 'August 2026',
    text: 'In August 2026 co-founded SIMBIA sp. z o.o., a software company in Poznań that licenses its platforms and runs on the CRM I built.',
  },
  { label: 'NEXT', title: 'Your team?', line: 'Open to remote roles', text: 'Open to remote product and design-engineering roles and B2B contracts.' },
];

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
      'End-to-end web products in TypeScript, React, Node.js and PostgreSQL — data model, APIs, deploys and backups included. MVPs and SaaS built to survive production.',
  },
  {
    name: 'Design Engineering',
    description:
      'Design systems, motion and interfaces that feel crafted — accessible components, spring-based animation and Three.js / WebGL when the story needs depth.',
  },
  {
    name: 'AI Integration',
    description:
      'LLM features with guardrails — structured outputs, document AI and assistants — delivered AI-native, with specs, tests and adversarial reviews on every change.',
  },
  {
    name: 'Payments & E-invoicing',
    description:
      'Stripe, PayU, Przelewy24, marketplaces and Poland’s KSeF 2.0 — financial integrations engineered for correctness, idempotency and audits.',
  },
  {
    name: 'Native iOS',
    description:
      'SwiftUI apps with widgets, Live Activities, offline sync and push — connected to the same backend as your web product.',
  },
  {
    name: 'Brand & Motion',
    description:
      'Identity, packaging and AI-assisted video. The person designing your brand can also ship your product.',
  },
] as const;

export type Project = {
  category: string;
  name: string;
  description: string;
  stack: string[];
  live?: string;
  images: [string, string, string];
  alts: [string, string, string];
};

export const PROJECTS: Project[] = [
  {
    category: 'Own product · Fintech',
    name: 'SIMBIA CRM',
    description:
      'Sales CRM with full double-entry accounting, KSeF e-invoicing and open banking — the system my own company runs on.',
    stack: ['React 19', 'Fastify', 'PostgreSQL', 'SwiftUI'],
    live: 'https://simbia.eu',
    images: ['/work/simbia-1.webp', '/work/simbia-2.webp', '/work/simbia-3.webp'],
    alts: ['SIMBIA CRM kanban board', 'SIMBIA CRM finance overview', 'SIMBIA CRM dashboard'],
  },
  {
    category: 'Client · B2B wholesale',
    name: 'Mind Logistic B2B',
    description:
      'Wholesale platform with company approval flows, trade credit, 7 payment gateways and 6 marketplace channels.',
    stack: ['React', 'Node.js', 'PostgreSQL', 'Three.js'],
    live: 'https://bosspartners.pl',
    images: ['/work/b2b-1.webp', '/work/b2b-2.webp', '/work/b2b-3.webp'],
    alts: ['Wholesale portal audience section', 'Wholesale platform key numbers', 'Wholesale platform landing page'],
  },
  {
    category: 'Client · Medical e-commerce',
    name: 'PROTECTDENT',
    description:
      '23-language EU storefront for CE-certified dental barriers, with an AI lead-qualification pipeline behind it.',
    stack: ['React', 'Express', 'PostgreSQL', 'Stripe'],
    live: 'https://protectdent.eu',
    images: ['/work/protectdent-1.webp', '/work/protectdent-2.webp', '/work/protectdent-3.webp'],
    alts: ['PROTECTDENT bestselling products', 'PROTECTDENT product categories', 'PROTECTDENT landing page'],
  },
  {
    category: 'Own product · HR-tech',
    name: 'iApply Workforce',
    description:
      'Shift and time tracking for staffing agencies — QR, GPS and NFC clock-in, a live coordinator board and a native iOS app.',
    stack: ['React', 'Socket.IO', 'PostgreSQL', 'SwiftUI'],
    live: 'https://iapply.com.pl',
    images: ['/work/iapply-1.webp', '/work/iapply-2.webp', '/work/iapply-3.webp'],
    alts: ['iApply QR check-in centre', 'iApply shift planning', 'iApply weekly schedule'],
  },
  {
    category: 'Client · Mobility',
    name: 'TAXI BOSS',
    description:
      'Fleet platform for Uber and Bolt partners — driver funnel, e-signed contracts, Uber API sync and a SwiftUI driver app.',
    stack: ['React', 'Express', 'Redis', 'SwiftUI'],
    images: ['/work/taxiboss-1.webp', '/work/taxiboss-2.webp', '/work/taxiboss-3.webp'],
    alts: ['TAXI BOSS 3D vehicle showcase', 'TAXI BOSS driver dashboard', 'TAXI BOSS landing page'],
  },
  {
    category: 'Contract · Design engineering',
    name: 'spin.clinic UI Kit',
    description:
      'Production design system and motion kit — FLIP morphing, spring physics and full accessibility, shipped in 14.5 hours.',
    stack: ['Next.js', 'Framer Motion', 'TypeScript'],
    live: 'https://spin.clinic/ui-kit',
    images: ['/work/spin-1.webp', '/work/spin-2.webp', '/work/spin-3.webp'],
    alts: ['spin.clinic component library', 'spin.clinic portal', 'spin.clinic UI kit showcase'],
  },
];

const tile = (i: number, alt: string) => ({ src: `/tiles/${String(i).padStart(2, '0')}.webp`, alt });

export const TILES = [
  tile(0, 'AiBizBox landing page'),
  tile(1, 'XyliMelts storefront'),
  tile(2, 'SIMBIA CRM dashboard, light theme'),
  tile(3, 'AntMight landing page'),
  tile(4, 'PROTECTDENT blog'),
  tile(5, 'iApply shift planning'),
  tile(6, 'TAXI BOSS benefits section'),
  tile(7, 'spin.clinic typography'),
  tile(8, 'XyliMelts ingredients section'),
  tile(9, 'SIMBIA CRM reports'),
  tile(10, 'Mind Logistic B2B landing'),
  tile(11, 'AiBizBox app preview'),
  tile(12, 'AntMight academy numbers'),
  tile(13, 'XyliMelts product selector'),
  tile(14, 'PROTECTDENT procedures'),
  tile(15, 'SIMBIA CRM project board'),
  tile(16, 'TAXI BOSS fleet admin'),
  tile(17, 'iApply coordinator panel'),
  tile(18, 'XyliMelts sample kit'),
  tile(19, 'SIMBIA CRM kanban'),
  tile(20, 'TAXI BOSS 3D car'),
];

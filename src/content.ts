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
  'Eight years in design, video and marketing taught me how products should look, feel and sell. Now I build them end to end: interfaces, backends, infrastructure and native iOS apps, shipped AI-native with rigorous verification. Let’s build something that works flawlessly and looks unforgettable.';

// The strongest checked claims: ../data/profile.json (stats, person.languages, experience);
// 76 clients per Bogdan (2026-09-29).
export const STATS = [
  { value: 76, suffix: '', label: 'clients served' },
  { value: 4, suffix: '', label: 'languages: EN · PL · UA · RU' },
  { value: 11, suffix: '', label: 'production systems shipped in 2026' },
  { value: 8, suffix: '+', label: 'years in design, video & marketing' },
  { value: 5, suffix: '', label: 'native Apple apps' },
  { value: 3, suffix: '', label: 'companies founded' },
] as const;

// The manifesto after the hero (Bogdan's words, 2026-09-29), written in particles under a shape each:
// the Earth, a gear, a circuit brain, a question mark, an eye. *Marked* words are highlighted, ~marked~
// ones struck out.
export const PHRASES = [
  'In our world, *anything* is possible.',
  'I always pick the *best tools* to get the job done.',
  'The age of *AI* lets us create *beautiful* things.',
  'The question is no longer ~how~ to build it. Only *why*.',
  'Have an *idea* and need someone to bring it to life? *Keep scrolling.*',
];

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
      'Sales CRM with full double-entry accounting, KSeF e-invoicing and open banking. My own company runs on it.',
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
      'Shift and time tracking for staffing agencies: QR, GPS and NFC clock-in, a live coordinator board and a native iOS app.',
    stack: ['React', 'Socket.IO', 'PostgreSQL', 'SwiftUI'],
    live: 'https://iapply.com.pl',
    images: ['/work/iapply-1.webp', '/work/iapply-2.webp', '/work/iapply-3.webp'],
    alts: ['iApply QR check-in centre', 'iApply shift planning', 'iApply weekly schedule'],
  },
  {
    category: 'Client · Mobility',
    name: 'TAXI BOSS',
    description:
      'Fleet platform for Uber and Bolt partners: driver funnel, e-signed contracts, Uber API sync and a SwiftUI driver app.',
    stack: ['React', 'Express', 'Redis', 'SwiftUI'],
    images: ['/work/taxiboss-1.webp', '/work/taxiboss-2.webp', '/work/taxiboss-3.webp'],
    alts: ['TAXI BOSS 3D vehicle showcase', 'TAXI BOSS driver dashboard', 'TAXI BOSS landing page'],
  },
  {
    category: 'Contract · Design engineering',
    name: 'spin.clinic UI Kit',
    description:
      'Production design system and motion kit: FLIP morphing, spring physics and full accessibility, shipped in 14.5 hours.',
    stack: ['Next.js', 'Framer Motion', 'TypeScript'],
    live: 'https://spin.clinic/ui-kit',
    images: ['/work/spin-1.webp', '/work/spin-2.webp', '/work/spin-3.webp'],
    alts: ['spin.clinic component library', 'spin.clinic portal', 'spin.clinic UI kit showcase'],
  },
];

// Marquee: project covers from the STYLEICON archive (scripts/prepare-media.py). `?v` busts the 30-day cache.
const tile = (i: number, alt: string) => ({ src: `/tiles/${String(i).padStart(2, '0')}.webp?v=2`, alt });

export const TILES = [
  tile(0, 'HYPE event series posters'),
  tile(1, 'Music poster for Ihor Poperechny'),
  tile(2, 'DC Consulting logo'),
  tile(3, 'Touch Coffee branding'),
  tile(4, 'Da Vinci Tattoo business cards'),
  tile(5, 'RESULT branding'),
  tile(6, 'Black Point barbershop social media'),
  tile(7, 'Adaya branding'),
  tile(8, 'Soul Nation Tattoo branding'),
  tile(9, 'Alibia website'),
  tile(10, 'Magic Patron branding'),
  tile(11, 'Strimat passenger transport'),
  tile(12, 'Profi Dokument branding'),
  tile(13, 'Zero Śladu branding'),
  tile(14, 'KREEM Pâtisserie'),
  tile(15, 'Stories Beauty branding'),
  tile(16, 'Black Point T-shirt'),
  tile(17, 'Nami Clean branding'),
  tile(18, 'ARAB30 campaign'),
  tile(19, 'Alibia logo'),
  tile(20, 'Time Relax Body branding'),
  tile(21, 'Lizard Moving website'),
];

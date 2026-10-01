// The CV's words and facts, once: scripts/cv/build.mjs renders them as the page (public/cv/index.html), its PDF,
// Markdown (cv.txt) and JSON Resume (resume.json). Facts mirror ../data/profile.json in the knowledge base: only what
// the code, the git history and the registries show. No em dashes in the copy.

export const UPDATED = '2026-10-01';
export const SITE = 'https://sunlucki.pl';

export const person = {
  name: 'Bogdan Nenadović',
  alternateNames: ['Bohdan Nenadovych'],
  headline: 'Product Engineer & Solutions Architect',
  focus: 'AI-assisted SDLC · agentic coding · CRM, commerce and fintech platforms',
  location: 'Poznań, Poland (CET)',
  terms: 'Remote · B2B through my own company, SIMBIA sp. z o.o.',
  email: 'hello@sunlucki.pl',
  links: [
    { label: 'sunlucki.pl', url: 'https://sunlucki.pl' },
    { label: 'linkedin.com/in/sunlucki', url: 'https://www.linkedin.com/in/sunlucki', network: 'LinkedIn', username: 'sunlucki' },
    { label: 'github.com/Sunlucki', url: 'https://github.com/Sunlucki', network: 'GitHub', username: 'Sunlucki' },
  ],
  languages: [
    ['English', 'C2'],
    ['Polish', 'C2'],
    ['Ukrainian', 'native'],
    ['Russian', 'native'],
  ],
};

export const summary =
  'I design, build and run software products end to end, and I run the whole software lifecycle through AI agents. ' +
  'In 2026 I was the sole architect of 10+ production systems for Polish and EU businesses: a CRM with double-entry ' +
  'accounting and KSeF e-invoicing that runs my own company, a B2B commerce platform with 7 payment gateways and 6 ' +
  'marketplace integrations, a 23-language EU store with an LLM lead-qualification pipeline, and workforce and fleet ' +
  'platforms with native iOS apps. My delivery is spec-driven and agentic: written specifications, parallel coding agents ' +
  'with frozen contracts, automated tests, adversarial multi-agent reviews and, on the main platforms, CI/CD with health-gated rollback. Before ' +
  'engineering full time I co-owned businesses and led a creative team, so I explain architecture in terms of cost, risk ' +
  'and business value.';

export const numbers = [
  { value: '10+', label: 'production systems shipped in 2026, as the sole architect' },
  { value: '94%', label: 'of my 2026 commits co-authored with Claude' },
  { value: '84 of 127', label: 'audit findings confirmed by skeptic agents, then fixed' },
  { value: '9 + 1', label: 'parallel coding agents and a QA agent: an 11K-line design system in ~14.5 h' },
  { value: '700+', label: 'automated tests on the largest platform (339 REST endpoints)' },
  { value: '23', label: 'interface languages on one EU platform' },
];

// How I deliver: one step after another, each with its evidence
export const sdlc = [
  {
    title: 'Specify',
    text: 'Requirements become written specs the agents follow: MASTER_PROMPT, CLAUDE.md and AGENTS.md, skill packs, phases with a Definition of Done. Architecture decisions are recorded as ADRs (29 on one MVP).',
  },
  {
    title: 'Orchestrate',
    text: 'Coding agents work in parallel in git worktrees against frozen contracts and a file-ownership map, with handoff prompts between models. The spin.clinic design system was built this way by 9 agents and a QA agent: 11K lines in about 14.5 hours, with no merge conflicts.',
  },
  {
    title: 'Test',
    text: 'Agents write and run the tests: Vitest, node:test, supertest against a real PostgreSQL, contract tests with golden fixtures shared by a TypeScript API and a Swift app, XCTest. 700+, 600+ and 269 tests on the three largest platforms.',
  },
  {
    title: 'Review and validate',
    text: 'Adversarial multi-agent audits: a skeptic agent confirms or rejects every finding by reproducing it, and only confirmed ones are fixed and pinned by a regression test (84 of 127 confirmed on SIMBIA CRM, 20 of 52 on AiBizBox); an accounting review ran as a multi-agent audit of 28 agents and 750 tool calls.',
  },
  {
    title: 'Ship',
    text: 'On the main platforms (SIMBIA CRM, PROTECTDENT, XyliMelts): GitHub Actions with PostgreSQL and Redis service containers, a database backup before every deploy, migrations, health-gated automatic rollback and smoke tests.',
  },
  {
    title: 'Operate',
    text: 'Daily off-site backups with weekly automated restore tests (SIMBIA CRM), Sentry, health endpoints and alerts. Incidents get a postmortem: after a sync failure wiped a working copy, the code was rebuilt from the agents’ session logs and checked against production.',
  },
];

export const tools =
  'Claude Code (primary; in VS Code and the CLI) · OpenAI Codex · MCP servers (Chrome browser automation, iOS Simulator, Figma, Spline) · LLM APIs: Claude, OpenAI, Gemini, Groq, NVIDIA NIM';

export const aiSystems = [
  'LLM lead-qualification pipeline (PROTECTDENT): map-based discovery, site crawling, evidence-based scoring from 0 to 100 and reply-intent classification into 8 intents; 7,800+ qualified B2B accounts.',
  'Multi-provider LLM routing: a 4-model fallback chain with hard timeouts, quotas, caching and a call log; a vision assistant that maps a photo of dental equipment to compatible products.',
  'Document AI: OCR, then a vision LLM, field extraction and human review, with personal data masked before any LLM call (AiBizBox, SIMBIA).',
  'Claude features with structured outputs validated by Zod, prompt caching and atomic per-user quotas (CashFlow); an LLM ingest pipeline that rejects quotes that are not verbatim (Novus Ignis).',
];

// The role's asks (a Solutions Architect for an AI-assisted SDLC), each with what shows it
export const fit = [
  {
    ask: 'System and application architecture',
    evidence: 'Sole architect of 10+ production systems: domain modules without I/O, state machines (orders with 20 to 24 states), invariants enforced in PostgreSQL triggers, event streams (LISTEN/NOTIFY to SSE), queues with lease locks and circuit breakers, a payment adapter registry, 29 ADRs on one MVP.',
  },
  {
    ask: 'AI-assisted SDLC: development, testing, CI/CD',
    evidence: 'My 2026 projects were built this way, from written specs to tested releases; the main platforms ship through CI/CD with health checks and automatic rollback. About 94% of my 2026 commits are co-authored with Claude.',
  },
  {
    ask: 'Agentic coding and autonomous software engineering',
    evidence: 'Task orchestration across parallel agents (worktrees, frozen contracts, ownership maps), quality gates (tests, Definition of Done), validation by skeptic agents that must reproduce each finding, decisions recorded as ADRs.',
  },
  {
    ask: 'AI systems: AI workflows, single- and multi-agent',
    evidence: 'AI workflows in production: LLM pipelines for lead qualification, reply-intent classification and document AI with human review, with multi-provider routing; multi-agent systems: a multi-agent audit system (28 agents, 750 tool calls) and parallel coding agents for the engineering itself.',
  },
  {
    ask: 'Infrastructure choices: security, cost, performance, scalability',
    evidence: 'Self-managed Linux infrastructure for 20+ projects on 4+ servers (nginx, PM2, systemd, TLS, Docker) with backups and restore tests; AWS integrations: S3 object storage with presigned URLs (TAXI BOSS), Amazon SES with bounce and complaint webhooks over SNS, signature-verified (PROTECTDENT); technology picked for the data and the cost, e.g. PostgreSQL trigram search chosen over pgvector (vector/semantic search) for a 500-item catalog (CashFlow); security by design: passkeys and WebAuthn, argon2id, CSP and HSTS, rate limits, HMAC-signed webhooks, signed URLs, PII masking, GDPR.',
  },
  {
    ask: 'Business value and stakeholders',
    evidence: 'Co-founder and board member of a software company that licenses its platforms; the B2B commerce platform runs three businesses’ stores in production (Mind Logistic, PROTECTDENT, XyliMelts); earlier co-owned a business and led a creative team; a 90-day EU go-to-market plan with pricing research across 9 countries.',
  },
  {
    ask: 'Communication with technical and non-technical audiences',
    evidence: 'For engineers: specs, ADRs, runbooks and audit reports with file-and-line evidence. For buyers and owners: proposals, seller cheat sheets, minute-by-minute demo scripts and plain tables of what a system does, what is coming and what not to promise.',
  },
  {
    ask: 'Leadership',
    evidence: 'Pro bono tech lead of a foundation’s MVP (2026); leader of a creative and marketing team (2022–2025).',
  },
];

export const experience = [
  {
    org: 'SIMBIA sp. z o.o.',
    url: 'https://simbia.eu',
    role: 'Co-founder, Board Member & Solutions Architect',
    start: '2026-08',
    end: null,
    place: 'Poznań · remote',
    text: 'A software company that builds and licenses vertical platforms: CRM, workforce management, fleet management and B2B commerce. I own the architecture and the AI-assisted delivery process. The company runs its sales and statutory accounting on our own CRM.',
  },
  {
    org: 'STYLEICON (own studio)',
    role: 'Independent Product Engineer & Solutions Architect',
    start: '2026-01',
    end: null,
    place: 'Poznań',
    text: 'Designed, built and operate 10+ production systems for Polish and EU businesses, licensed to clients (21 repositories, about 1,560 commits in 2026); since August 2026 through SIMBIA sp. z o.o.',
  },
  {
    org: 'STYLEICON (own studio)',
    role: 'Owner: web, branding and video studio',
    start: '2025-01',
    end: '2025-12',
    place: 'Poznań',
    text: 'Websites, brand identities and video production for local businesses.',
  },
  {
    org: 'spin.clinic',
    url: 'https://spin.clinic',
    role: 'Design System Engineer (contract)',
    start: '2026-09',
    end: '2026-09',
    text: 'Built the production design system and motion UI kit (11K lines, 41 exports, used across 56 product files) with 9 parallel coding agents and a QA agent in about 14.5 hours.',
  },
  {
    org: 'Fundacja Novus Ignis',
    role: 'Tech Lead (pro bono)',
    start: '2026-09',
    end: '2026-09',
    text: 'Re-architected and built the MVP of a verifiable deliberation platform: Next.js 16, passkeys, a Merkle tree anchored with OpenTimestamps and an LLM ingest pipeline; 29 ADRs, 58 tests.',
  },
  {
    org: 'Black Point Group sp. z o.o.',
    role: 'Marketing & Team Leader; shareholder and President of the Management Board',
    start: '2022-09',
    end: '2025-01',
    place: 'Poznań',
    text: 'Led the creative team and marketing operations: campaigns, brand strategy, content and video production, client communication.',
  },
  {
    org: 'Black Point Barbershop',
    role: 'Co-owner',
    start: '2020-10',
    end: '2025-05',
    place: 'Poznań',
    text: 'Co-founded and ran a barbershop and creative hub: identity, a website with online booking, social media and video.',
  },
  {
    org: 'GreenView',
    role: 'Web Developer',
    start: '2017-05',
    end: '2020-08',
    text: 'Websites from UX/UI to WordPress deployment: responsive builds, usability testing, work directly with clients and marketing teams.',
  },
];

// The filters on the projects (skills' keys → labels)
export const SKILL_TAGS = {
  'ai-sdlc': 'AI-assisted SDLC',
  llm: 'LLM in production',
  architecture: 'Architecture',
  ts: 'TypeScript',
  node: 'Node.js',
  pg: 'PostgreSQL',
  react: 'React',
  swift: 'Swift / iOS',
  cicd: 'CI/CD & testing',
  security: 'Security',
  payments: 'Payments & e-invoicing',
};

export const projects = [
  {
    name: 'SIMBIA CRM',
    url: 'https://crm.simbia.eu',
    status: 'Production · runs my company',
    text: 'Sales CRM with full double-entry accounting for a Polish limited company: KSeF 2.0 e-invoicing, PSD2 open banking, registry-based lead generation and a SwiftUI companion app.',
    metrics: ['~110K lines of TypeScript', '~240 REST endpoints', '57 PostgreSQL tables', '269 tests'],
    points: [
      'Accounting invariants enforced inside PostgreSQL: deferred constraint triggers, immutable journals, gapless numbering; 8 government XML filings validated against the official XSD schemas.',
      'Realtime updates from PostgreSQL LISTEN/NOTIFY to Server-Sent Events with per-role filtering; IMAP IDLE sync that puts client replies on the lead timeline in about 4 seconds.',
      'Zero-touch deploys with health-gated automatic rollback; daily off-site backups with weekly automated restore checks.',
      'Built through orchestrated coding agents with written specs and adversarial multi-agent audits: 127 findings, 84 confirmed and fixed.',
    ],
    skills: ['ai-sdlc', 'architecture', 'ts', 'node', 'pg', 'react', 'swift', 'cicd', 'security', 'payments'],
  },
  {
    name: 'B2B Commerce Platform',
    url: 'https://bosspartners.pl',
    status: 'Production · licensed to Mind Logistic',
    text: 'Wholesale platform that replaced a client’s WooCommerce store in production: company accounts with spend limits and approval flows, contract price books, RFQ and quotes, trade credit with aging and dunning.',
    metrics: ['~140K lines of TypeScript', '339 REST endpoints', '66 data models', '700+ tests'],
    points: [
      'Payment adapter registry for 7 gateways (Stripe, PayU, Przelewy24, Tpay, Autopay, Paynow, Revolut) with gateway-specific auth and signed-webhook verification.',
      'Marketplace channel engine (Allegro, Shopify, WooCommerce, Shoper, Empik, Erli): job queue, exponential backoff, nightly reconciliation, AES-256-GCM encrypted credentials.',
      'Migrated live customers, orders and products from WooCommerce, upgrading legacy password hashes to bcrypt transparently.',
    ],
    skills: ['architecture', 'ts', 'node', 'pg', 'react', 'cicd', 'security', 'payments'],
  },
  {
    name: 'PROTECTDENT',
    url: 'https://protectdent.eu',
    status: 'Production · client platform, licensed',
    text: '23-language EU e-commerce for medical-device consumables, with an LLM lead-qualification pipeline for B2B sales.',
    metrics: ['23 languages', '600+ tests', '7,800+ qualified B2B accounts'],
    points: [
      'The LLM lead-qualification pipeline and the 4-model fallback chain with a vision assistant (see AI systems in production).',
      'Stripe checkout, VIES-based VAT and KSeF e-invoicing; Amazon SES bounce and complaint handling over SNS with signature verification; CI/CD with health-checked deploys; a 90-day EU go-to-market plan (373 price points across 9 countries).',
    ],
    skills: ['llm', 'ts', 'node', 'pg', 'react', 'cicd', 'payments'],
  },
  {
    name: 'iApply Workforce',
    pdf: false,
    url: 'https://iapply.com.pl',
    status: 'Production demo',
    text: 'Time, attendance and shift management for staffing agencies: a web app and a native SwiftUI app.',
    points: [
      'Anti-fraud clock-in with expiring QR codes, geofencing and NFC (Web NFC, HID readers, CoreNFC).',
      'SwiftUI app with its own Socket.IO v4 client, widgets, Live Activities and APNs push sent over HTTP/2 straight from Node.',
      'Payroll-grade time calculations with decimal arithmetic and rounding rules.',
    ],
    skills: ['ts', 'node', 'pg', 'react', 'swift', 'security'],
  },
  {
    name: 'TAXI BOSS',
    status: 'Production',
    text: 'Fleet management for Uber and Bolt partner fleets, with a native SwiftUI driver app.',
    points: [
      'Uber Vehicle Suppliers API: OAuth2 client credentials, per-endpoint rate-limit buckets, token caching, scheduled sync.',
      'Driver app with an actor-based API client, single-flight token refresh and an offline outbox queue.',
      'Files on AWS S3 (AWS SDK v3, presigned URLs); a security remediation cycle, 95 integration tests against a real PostgreSQL and CI/CD from scratch.',
    ],
    skills: ['architecture', 'ts', 'node', 'pg', 'swift', 'cicd', 'security'],
  },
  {
    name: 'spin.clinic design system',
    pdf: false,
    url: 'https://spin.clinic',
    status: 'Live · contract',
    text: 'Design system and motion UI kit for spin.clinic (Next.js 14, Framer Motion): 11K lines, 41 exports, used across 56 product files.',
    points: [
      'Built by 9 parallel coding agents and a QA agent (git worktrees, frozen contracts, a file-ownership map) in about 14.5 hours, with no merge conflicts.',
      'FLIP card-to-fullscreen morphing with History API integration, spring motion tokens driven by gesture velocity, full keyboard and reduced-motion support.',
    ],
    skills: ['ai-sdlc', 'ts', 'react'],
  },
];

// (the PDF keeps four project cards; the others it names here)
export const alsoInPdf =
  'Also: iApply Workforce (shift tracking for staffing agencies: web and a native SwiftUI app), the spin.clinic design system (see Experience), CashFlow (iOS finance advisor with Claude), AiBizBox (document-AI SaaS), XyliMelts (D2C store with a 3D hero).';

export const alsoBuilt =
  'Also: CashFlow (iOS finance advisor: SwiftUI, Fastify, Claude with structured outputs), AiBizBox (document-AI SaaS with PII masking), XyliMelts (D2C store with a React Three Fiber hero and the most mature CI/CD), Novus Ignis (verifiable deliberation MVP).';

export const skills = [
  {
    group: 'AI and SDLC',
    items: ['AI-assisted SDLC', 'Agentic coding', 'Multi-agent orchestration', 'Claude Code', 'OpenAI Codex', 'MCP', 'LLM integration', 'Structured outputs', 'Prompt caching', 'Document AI / OCR', 'LLM pipelines', 'Prompt engineering'],
  },
  {
    group: 'Architecture',
    items: ['Solution architecture', 'System design', 'Domain modules', 'State machines', 'Event-driven design (LISTEN/NOTIFY, SSE, queues)', 'Integration architecture (OAuth2, signed webhooks, idempotency)', 'Security architecture', 'ADRs'],
  },
  {
    group: 'Engineering',
    items: ['TypeScript', 'Node.js (Fastify, Express)', 'React', 'Next.js', 'PostgreSQL', 'Prisma', 'Drizzle', 'Redis / BullMQ', 'REST / OpenAPI', 'Swift / SwiftUI'],
  },
  {
    group: 'Delivery and operations',
    items: ['CI/CD (GitHub Actions)', 'Automated testing (Vitest, XCTest)', 'Docker', 'Linux (nginx, PM2, systemd)', 'AWS: S3 (AWS SDK v3, presigned URLs), SES bounce and complaint webhooks over SNS, signature-verified', 'Backups and disaster recovery', 'Sentry'],
  },
  {
    group: 'Domains',
    items: ['CRM', 'B2B commerce', 'Payments (Stripe, PayU, Przelewy24)', 'E-invoicing (KSeF 2.0)', 'Accounting', 'HR tech', 'Fleet management (Uber API)'],
  },
];

export const education = [
  { school: 'WSB University in Poznań', degree: 'BSc', field: 'Computer Science, specialization: Computer Graphics', start: '2016', end: '2018' },
];

// Polish recruiters expect the consent clause on a CV
export const consent =
  'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji (zgodnie z art. 6 ust. 1 lit. a RODO).';

# Bogdan Nenadović

**Product Engineer & Solutions Architect**  
AI-assisted SDLC · agentic coding · CRM, commerce and fintech platforms

Poznań, Poland (CET) · Remote · B2B through my own company, SIMBIA sp. z o.o.  
hello@sunlucki.pl · https://sunlucki.pl · https://www.linkedin.com/in/sunlucki · https://github.com/Sunlucki  
Languages: English C2 · Polish C2 · Ukrainian native · Russian native

## Summary

I design, build and run software products end to end, and I run the whole software lifecycle through AI agents. In 2026 I was the sole architect of 10+ production systems for Polish and EU businesses: a CRM with double-entry accounting and KSeF e-invoicing that runs my own company, a B2B commerce platform with 7 payment gateways and 6 marketplace integrations, a 23-language EU store with an LLM lead-qualification pipeline, and workforce and fleet platforms with native iOS apps. My delivery is spec-driven and agentic: written specifications, parallel coding agents with frozen contracts, automated tests, adversarial multi-agent reviews and, on the main platforms, CI/CD with health-gated rollback. Before engineering full time I co-owned businesses and led a creative team, so I explain architecture in terms of cost, risk and business value.

- **10+** production systems shipped in 2026, as the sole architect
- **94%** of my 2026 commits co-authored with Claude
- **127 → 84** audit findings reproduced by skeptic agents, then fixed
- **9 + 1** parallel coding agents and a QA agent: an 11K-line design system in ~14.5 h
- **700+** automated tests on the largest platform (339 REST endpoints)
- **23** interface languages on one EU platform

## AI-assisted SDLC: how I deliver

1. **Specify.** Requirements become written specs the agents follow: MASTER_PROMPT, CLAUDE.md and AGENTS.md, skill packs, phases with a Definition of Done. Architecture decisions are recorded as ADRs (29 on one MVP).
2. **Orchestrate.** Coding agents work in parallel in git worktrees against frozen contracts and a file-ownership map, with handoff prompts between models. The spin.clinic design system was built this way by 9 agents and a QA agent: 11K lines in about 14.5 hours, with no merge conflicts.
3. **Test.** Agents write and run the tests: Vitest, node:test, supertest against a real PostgreSQL, contract tests with golden fixtures shared by a TypeScript API and a Swift app, XCTest. 700+, 600+ and 269 tests on the three largest platforms.
4. **Review and validate.** Adversarial multi-agent audits: a skeptic agent has to reproduce every finding before it is fixed and pinned by a regression test. 127 findings, 84 confirmed and fixed on SIMBIA CRM; 52 findings, 20 confirmed on AiBizBox; an accounting review that ran 28 agents and 750 tool calls.
5. **Ship.** On the main platforms (SIMBIA CRM, PROTECTDENT, XyliMelts): GitHub Actions with PostgreSQL and Redis service containers, a database backup before every deploy, migrations, health-gated automatic rollback and smoke tests.
6. **Operate.** Daily off-site backups with weekly automated restore tests (SIMBIA CRM), Sentry, health endpoints and alerts. Incidents get a postmortem: after a sync failure wiped a working copy, the code was rebuilt from the agents’ session logs and checked against production.

**Tools:** Claude Code (primary; in VS Code and the CLI) · OpenAI Codex · MCP servers (browser automation, iOS Simulator, design tools) · LLM APIs: Claude, OpenAI, Gemini, Groq, NVIDIA NIM

### AI systems in production

- LLM lead-qualification pipeline (PROTECTDENT): map-based discovery, site crawling, evidence-based scoring from 0 to 100 and reply-intent classification into 8 intents; 7,800+ qualified B2B accounts.
- Multi-provider LLM routing: a 4-model fallback chain with hard timeouts, quotas, caching and a call log; a vision assistant that maps a photo of dental equipment to compatible products.
- Document AI: OCR, then a vision LLM, field extraction and human review, with personal data masked before any LLM call (AiBizBox, SIMBIA).
- Claude features with structured outputs validated by Zod, prompt caching and atomic per-user quotas (CashFlow); an LLM ingest pipeline that rejects quotes that are not verbatim (Novus Ignis).

## Role fit: Solutions Architect, AI-assisted SDLC

- **System and application architecture:** Sole architect of 10+ production systems: domain modules without I/O, state machines (orders with 20 to 24 states), invariants enforced in PostgreSQL triggers, event streams (LISTEN/NOTIFY to SSE), queues with lease locks and circuit breakers, a payment adapter registry, 29 ADRs on one MVP.
- **AI-assisted SDLC: development, testing, CI/CD:** My 2026 projects were built this way, from written specs to tested releases; the main platforms ship through CI/CD with health checks and automatic rollback. About 94% of my 2026 commits are co-authored with Claude.
- **Agentic coding and autonomous software engineering:** Task orchestration across parallel agents (worktrees, frozen contracts, ownership maps), quality gates (tests, Definition of Done), validation by skeptic agents that must reproduce each finding, decisions recorded as ADRs.
- **AI systems: AI workflows, single- and multi-agent:** LLM pipelines in production (lead qualification, intent classification, document AI with human review, multi-provider routing) and multi-agent orchestration for the engineering work itself.
- **Infrastructure choices: security, cost, performance, scalability:** Self-managed Linux infrastructure for 20+ projects on 4+ servers (nginx, PM2, systemd, TLS, Docker); backups with restore tests; security by design: passkeys and WebAuthn, argon2id, CSP and HSTS, rate limits, HMAC-signed webhooks, signed URLs, PII masking, GDPR.
- **Business value and stakeholders:** Co-founder and board member of a software company; earlier co-owned a business and led a creative team; sales materials that state plainly what a system does and does not do; a 90-day EU go-to-market plan with pricing research across 9 countries.
- **Leadership:** Pro bono tech lead of a foundation’s MVP (2026); leader of a creative and marketing team (2022–2025).

## Experience

### Co-founder, Board Member & Solutions Architect, SIMBIA sp. z o.o.

Aug 2026 – present · Poznań · remote

A software company that builds and licenses vertical platforms: CRM, workforce management, fleet management and B2B commerce. I own the architecture and the AI-assisted delivery process. The company runs its sales and statutory accounting on our own CRM.

### Founder; independent product engineer and architect since 2026, STYLEICON (own studio)

Jan 2025 – present · Poznań

Web, branding and video studio in 2025. Since January 2026: designed, built and operate 10+ production systems for Polish and EU businesses, licensed to clients (21 repositories, about 1,560 commits in 2026).

### Design System Engineer (contract), spin.clinic

Sep 2026

Built the production design system and motion UI kit (11K lines, 41 exports, used across 56 product files) with 9 parallel coding agents and a QA agent in about 14.5 hours.

### Tech Lead (pro bono), Fundacja Novus Ignis

Sep 2026

Re-architected and built the MVP of a verifiable deliberation platform: Next.js 16, passkeys, a Merkle tree anchored with OpenTimestamps and an LLM ingest pipeline; 29 ADRs, 58 tests.

### Marketing & Team Leader; shareholder and President of the Management Board, Black Point Group sp. z o.o.

Sep 2022 – Jan 2025 · Poznań

Led the creative team and marketing operations: campaigns, brand strategy, content and video production, client communication.

### Co-owner, Black Point Barbershop

Oct 2020 – May 2025 · Poznań

Co-founded and ran a barbershop and creative hub: identity, a website with online booking, social media and video.

### Web Developer, GreenView

May 2017 – Aug 2020

Websites from UX/UI to WordPress deployment: responsive builds, usability testing, work directly with clients and marketing teams.

## Projects

### SIMBIA CRM (https://crm.simbia.eu)

Production · runs my company. Sales CRM with full double-entry accounting for a Polish limited company: KSeF 2.0 e-invoicing, PSD2 open banking, registry-based lead generation and a SwiftUI companion app.

~110K lines of TypeScript · ~240 REST endpoints · 57 PostgreSQL tables · 269 tests

- Accounting invariants enforced inside PostgreSQL: deferred constraint triggers, immutable journals, gapless numbering; 8 government XML filings validated against the official XSD schemas.
- Realtime updates from PostgreSQL LISTEN/NOTIFY to Server-Sent Events with per-role filtering; IMAP IDLE sync that puts client replies on the lead timeline in about 4 seconds.
- Zero-touch deploys with health-gated automatic rollback; daily off-site backups with weekly automated restore checks.
- Built through orchestrated coding agents with written specs and adversarial multi-agent audits: 127 findings, 84 confirmed and fixed.

### B2B Commerce Platform (https://bosspartners.pl)

Production · licensed to Mind Logistic. Wholesale platform that replaced a client’s WooCommerce store in production: company accounts with spend limits and approval flows, contract price books, RFQ and quotes, trade credit with aging and dunning.

~140K lines of TypeScript · 339 REST endpoints · 66 data models · 700+ tests

- Payment adapter registry for 7 gateways (Stripe, PayU, Przelewy24, Tpay, Autopay, Paynow, Revolut) with gateway-specific auth and signed-webhook verification.
- Marketplace channel engine (Allegro, Shopify, WooCommerce, Shoper, Empik, Erli): job queue, exponential backoff, nightly reconciliation, AES-256-GCM encrypted credentials.
- Migrated live customers, orders and products from WooCommerce, upgrading legacy password hashes to bcrypt transparently.

### PROTECTDENT (https://protectdent.eu)

Production. 23-language EU e-commerce for medical-device consumables, with an LLM lead-qualification pipeline for B2B sales.

23 languages · 600+ tests · 7,800+ qualified B2B accounts

- The LLM lead-qualification pipeline and the 4-model fallback chain with a vision assistant (see AI systems in production).
- Stripe checkout, VIES-based VAT and KSeF e-invoicing; CI/CD with health-checked deploys; a 90-day EU go-to-market plan (373 price points across 9 countries).

### iApply Workforce (https://iapply.com.pl)

Production demo. Time, attendance and shift management for staffing agencies: a web app and a native SwiftUI app.

- Anti-fraud clock-in with expiring QR codes, geofencing and NFC (Web NFC, HID readers, CoreNFC).
- SwiftUI app with its own Socket.IO v4 client, widgets, Live Activities and APNs push sent over HTTP/2 straight from Node.
- Payroll-grade time calculations with decimal arithmetic and rounding rules.

### TAXI BOSS

Production. Fleet management for Uber and Bolt partner fleets, with a native SwiftUI driver app.

- Uber Vehicle Suppliers API: OAuth2 client credentials, per-endpoint rate-limit buckets, token caching, scheduled sync.
- Driver app with an actor-based API client, single-flight token refresh and an offline outbox queue.
- A security remediation cycle, 95 integration tests against a real PostgreSQL and CI/CD from scratch.

### spin.clinic design system (https://spin.clinic)

Live · contract. Design system and motion UI kit for spin.clinic (Next.js 14, Framer Motion): 11K lines, 41 exports, used across 56 product files.

- Built by 9 parallel coding agents and a QA agent (git worktrees, frozen contracts, a file-ownership map) in about 14.5 hours, with no merge conflicts.
- FLIP card-to-fullscreen morphing with History API integration, spring motion tokens driven by gesture velocity, full keyboard and reduced-motion support.

Also: CashFlow (iOS finance advisor: SwiftUI, Fastify, Claude with structured outputs), AiBizBox (document-AI SaaS with PII masking), XyliMelts (D2C store with a React Three Fiber hero and the most mature CI/CD), Novus Ignis (verifiable deliberation MVP).

## Skills

- **AI and SDLC:** AI-assisted SDLC, Agentic coding, Multi-agent orchestration, Claude Code, OpenAI Codex, MCP, LLM integration, Structured outputs, Prompt caching, Document AI / OCR, LLM pipelines, Prompt engineering
- **Architecture:** Solution architecture, System design, Domain modules, State machines, Event-driven design (LISTEN/NOTIFY, SSE, queues), Integration architecture (OAuth2, signed webhooks, idempotency), Security architecture, ADRs
- **Engineering:** TypeScript, Node.js (Fastify, Express), React, Next.js, PostgreSQL, Prisma, Drizzle, Redis / BullMQ, REST / OpenAPI, Swift / SwiftUI
- **Delivery and operations:** CI/CD (GitHub Actions), Automated testing (Vitest, XCTest), Docker, Linux (nginx, PM2, systemd), Backups and disaster recovery, Sentry
- **Domains:** CRM, B2B commerce, Payments (Stripe, PayU, Przelewy24), E-invoicing (KSeF 2.0), Accounting, HR tech, Fleet management (Uber API)

## Education

- BSc, Computer Science, specialization: Computer Graphics. WSB University in Poznań, 2016–2018

## Languages

- English: C2
- Polish: C2
- Ukrainian: native
- Russian: native

_Updated 2026-10-01. https://sunlucki.pl/cv/_

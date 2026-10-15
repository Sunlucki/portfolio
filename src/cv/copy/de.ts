import type { CvText } from './types.ts';

// German
const de: CvText = {
  meta: {
    title: 'Bogdan Nenadović · Lebenslauf · Product Engineer & Solutions Architect',
    description:
      'Bogdan Nenadović, Product Engineer und Solutions Architect in Poznań, Polen: 10+ Produktivsysteme im Jahr 2026 als alleiniger Architekt, ein KI-gestützter SDLC mit Claude Code und Codex.',
  },
  ui: {
    cv: 'Lebenslauf',
    updated: 'Stand: {date}',
    nav: {
      summary: 'Kurzprofil',
      delivery: 'Arbeitsweise',
      experience: 'Berufserfahrung',
      projects: 'Projekte',
      fit: 'Passung zur Rolle',
      skills: 'Kenntnisse',
    },
    subs: {
      delivery: 'KI-gestützter SDLC, Schritt für Schritt, jeweils mit Nachweis',
      experience: 'Von der ersten Stelle bis heute',
      projects: 'Produktivsysteme, die ich entworfen und gebaut habe; die Promovideos zeigen sie im Einsatz',
      fit: 'Solutions Architect · KI-gestützter SDLC: was die Rolle verlangt und was es belegt',
      skills: 'Technologien und Methoden, mit denen ich arbeite',
    },
    builtIn2026: 'Gebaut 2026',
    howIDeliver: 'Arbeitsweise',
    beforeEngineering: 'Vor dem Engineering',
    tools: 'Tools',
    aiSystem: 'KI-System im Produktivbetrieb',
    present: 'heute',
    oneMonth: '1 Monat',
    howBuilt: 'Wie es gebaut ist',
    showEvidence: 'Nachweise zeigen',
    whatShowsIt: 'Was es belegt',
    openAll: 'Alle öffnen',
    closeAll: 'Alle schließen',
    filterLabel: 'Die Projekte zeigen, die einen Skill nutzen',
    filterNote: '{n} von {total} Projekten nutzen {skill}. Erneut tippen, um alle zu zeigen.',
    download: 'PDF herunterladen',
    ats: 'Einspaltiges PDF für ATS',
    openToWork: 'Offen für Angebote',
    toolsCount: '{n} Tools',
    education: 'Ausbildung',
    languages: 'Sprachen',
    portraitAlt: 'Porträt von Bogdan Nenadović',
    alsoAs: 'Diesen Lebenslauf gibt es auch als {txt}, {json} und {pdf}',
    plainText: 'Textdatei',
    jsonResume: 'JSON Resume',
    onePdf: 'einspaltiges PDF',
    site: 'Hauptseite',
    language: 'Sprache',
    sections: 'Abschnitte',
    projectScreens: '{name}: Ansichten',
    promoPoster: '{name}: ein Standbild aus dem Promovideo',
    play: 'Promovideo von {name} abspielen',
    projectsLink: 'Alle Projekte auf der Startseite',
    folders: { llm: 'LLMs in Produkten', integrations: 'Integrationen und Sicherheit', frontend: 'Frontend und Mobile', backend: 'Backend und Daten' },
  },
  headline: 'Product Engineer & Solutions Architect',
  focus: 'KI-gestützter SDLC · Agentic Coding · CRM-, Commerce- und Fintech-Plattformen',
  location: 'Poznań, Polen (MEZ)',
  terms: 'Remote von zu Hause · vor Ort bei wichtigen Firmenevents · B2B über mein eigenes Unternehmen, SIMBIA sp. z o.o.',
  languages: [
    ['Englisch', 'C2'],
    ['Polnisch', 'C2'],
    ['Ukrainisch', 'Muttersprache'],
    ['Russisch', 'Muttersprache'],
  ],
  summary: {
    lead: 'Ich entwerfe, baue und betreibe Softwareprodukte von Anfang bis Ende und führe den gesamten Softwarelebenszyklus mit KI-Agenten durch.',
    builtIntro: 'Im Jahr 2026 war ich alleiniger Architekt von 10+ Produktivsystemen für polnische und EU-Unternehmen',
    built: [
      'ein CRM mit doppelter Buchführung und KSeF-E-Rechnungen, auf dem mein eigenes Unternehmen läuft',
      'eine B2B-Commerce-Plattform mit 7 Zahlungs-Gateways und 6 Marktplatzintegrationen',
      'ein EU-Shop in 23 Sprachen mit einer LLM-Pipeline zur Lead-Qualifizierung',
      'eine Workforce-Plattform für Personaldienstleister und ein Flottenmanagement für Uber- und Bolt-Partnerflotten, beide mit nativen iOS-Apps',
    ],
    delivery:
      'Meine Arbeitsweise ist spec-getrieben und agentisch: schriftliche Spezifikationen, parallele Coding-Agenten mit eingefrorenen Schnittstellenverträgen, automatisierte Tests, adversariale Multi-Agenten-Reviews und auf den Hauptplattformen CI/CD mit Rollback per Health-Check.',
    background:
      'Bevor ich hauptberuflich in die Softwareentwicklung ging, war ich Mitinhaber von Unternehmen und habe ein Team von 6 Personen geführt. Deshalb erkläre ich Architektur in Begriffen von Kosten, Risiko und geschäftlichem Nutzen.',
  },
  numbers: [
    { value: '10+', label: 'Produktivsysteme 2026 ausgeliefert, als alleiniger Architekt' },
    { value: '94%', label: 'meiner Commits aus 2026 mit Claude als Co-Autor' },
    { value: '84 von 127', label: 'Audit-Befunden von Skeptiker-Agenten bestätigt, dann behoben' },
    { value: '10', label: 'Agenten parallel (9 für Code, 1 für QA): ein Designsystem mit 11K Zeilen in ~14,5 h' },
    { value: '700+', label: 'automatisierte Tests auf der größten Plattform (339 REST-Endpunkte)' },
    { value: '23', label: 'Oberflächensprachen auf einer EU-Plattform' },
  ],
  sdlc: [
    {
      title: 'Spezifizieren',
      text: 'Anforderungen werden zu schriftlichen Specs, denen die Agenten folgen: MASTER_PROMPT, CLAUDE.md und AGENTS.md, Skill-Packs, Phasen mit einer Definition of Done. Architekturentscheidungen werden als ADRs festgehalten (29 bei einem MVP).',
    },
    {
      title: 'Orchestrieren',
      text: 'Coding-Agenten arbeiten parallel in Git-Worktrees gegen eingefrorene Schnittstellenverträge und eine File-Ownership-Map, mit Übergabe-Prompts zwischen den Modellen. Das Designsystem von spin.clinic entstand so durch 9 Agenten und einen QA-Agenten: 11K Zeilen in etwa 14,5 Stunden, ohne Merge-Konflikte.',
    },
    {
      title: 'Testen',
      text: 'Agenten schreiben und starten die Tests: Vitest, node:test, supertest gegen ein echtes PostgreSQL, Contract-Tests mit Golden Fixtures, die eine TypeScript-API und eine Swift-App gemeinsam nutzen, XCTest. 700+, 600+ und 269 Tests auf den drei größten Plattformen.',
    },
    {
      title: 'Prüfen und validieren',
      text: 'Adversariale Multi-Agenten-Audits: Ein Skeptiker-Agent bestätigt oder verwirft jeden Befund, indem er ihn reproduziert, und nur bestätigte Befunde werden behoben und durch einen Regressionstest abgesichert (84 von 127 bestätigt bei SIMBIA CRM, 20 von 52 bei AiBizBox); eine Buchhaltungsprüfung lief als Multi-Agenten-Audit mit 28 Agenten und 750 Tool-Calls.',
    },
    {
      title: 'Ausliefern',
      text: 'Auf den Hauptplattformen (SIMBIA CRM, PROTECTDENT, XyliMelts): GitHub Actions mit PostgreSQL- und Redis-Service-Containern, ein Datenbank-Backup vor jedem Deploy, Migrationen, automatischer Rollback per Health-Check und Smoke-Tests.',
    },
    {
      title: 'Betreiben',
      text: 'Tägliche Offsite-Backups mit wöchentlichen automatisierten Wiederherstellungstests (SIMBIA CRM), Sentry, Health-Endpunkte und Alerts. Vorfälle bekommen ein Postmortem: Nachdem ein Sync-Fehler eine Arbeitskopie gelöscht hatte, wurde der Code aus den Session-Logs der Agenten rekonstruiert und mit der Produktion abgeglichen.',
    },
  ],
  tools:
    'Claude Code (primär, bei kommerziellen Kundenprojekten; in VS Code und in der CLI) · GitHub Copilot (VS Code) · OpenAI Codex · Cursor (getestet, VS Code bevorzugt) · MCP-Server (Browserautomatisierung in Chrome, iOS Simulator, Figma, Spline) · LLM-APIs: Claude, OpenAI, Gemini, Groq, NVIDIA NIM',
  aiSystems: [
    'LLM-Pipeline zur Lead-Qualifizierung (PROTECTDENT): kartenbasierte Discovery, Website-Crawling, evidenzbasiertes Scoring von 0 bis 100 und Klassifizierung der Antwortabsicht in 8 Intents; 7.800+ qualifizierte B2B-Accounts.',
    'LLM-Routing über mehrere Anbieter: eine Fallback-Kette aus 4 Modellen mit harten Timeouts, Kontingenten, Caching und einem Aufruf-Log; ein Vision-Assistent, der ein Foto von Dentalgeräten kompatiblen Produkten zuordnet.',
    'Dokumenten-KI: OCR, danach ein Vision-LLM, Feldextraktion und menschliche Prüfung, wobei personenbezogene Daten vor jedem LLM-Aufruf maskiert werden (AiBizBox, SIMBIA).',
    'Claude-Features mit strukturierten Outputs, validiert durch Zod, Prompt-Caching und atomaren Kontingenten pro Nutzer (CashFlow); eine LLM-Ingest-Pipeline, die nicht wörtliche Zitate ablehnt (Novus Ignis).',
  ],
  fit: [
    {
      ask: 'System- und Anwendungsarchitektur',
      evidence:
        'Alleiniger Architekt von 10+ Produktivsystemen: Domänenmodule ohne I/O, State Machines (Bestellungen mit 20 bis 24 Zuständen), in PostgreSQL-Triggern durchgesetzte Invarianten, Event-Streams (LISTEN/NOTIFY zu SSE), Queues mit Lease-Locks und Circuit Breakern, eine Payment-Adapter-Registry, 29 ADRs bei einem MVP.',
    },
    {
      ask: 'KI-gestützter SDLC: Entwicklung, Testing, CI/CD',
      evidence:
        'Meine Projekte aus 2026 sind so entstanden, von schriftlichen Specs bis zu getesteten Releases; die Hauptplattformen werden über CI/CD mit Health-Checks und automatischem Rollback ausgeliefert. Rund 94% meiner Commits aus 2026 haben Claude als Co-Autor.',
    },
    {
      ask: 'Agentic Coding und autonomes Software Engineering',
      evidence:
        'Orchestrierung von Aufgaben über parallele Agenten (Worktrees, eingefrorene Schnittstellenverträge, Ownership-Maps), Quality Gates (Tests, Definition of Done), Validierung durch Skeptiker-Agenten, die jeden Befund reproduzieren müssen, als ADRs festgehaltene Entscheidungen.',
    },
    {
      ask: 'KI-Systeme: KI-Workflows, Single- und Multi-Agent',
      evidence:
        'KI-Workflows im Produktivbetrieb: LLM-Pipelines für Lead-Qualifizierung, Klassifizierung der Antwortabsicht und Dokumenten-KI mit menschlicher Prüfung, mit Routing über mehrere Anbieter; Multi-Agenten-Systeme: ein Multi-Agenten-Auditsystem (28 Agenten, 750 Tool-Calls) und parallele Coding-Agenten für die Entwicklung selbst.',
    },
    {
      ask: 'Infrastrukturentscheidungen: Sicherheit, Kosten, Performance, Skalierbarkeit',
      evidence:
        'Selbst verwaltete Linux-Infrastruktur für 20+ Projekte auf 4+ Servern (nginx, PM2, systemd, TLS, Docker) mit Backups und Wiederherstellungstests; AWS-Integrationen: S3-Objektspeicher mit Presigned URLs (TAXI BOSS), Amazon SES mit Bounce- und Complaint-Webhooks über SNS, signaturgeprüft (PROTECTDENT); Technologie passend zu Daten und Kosten gewählt, z. B. PostgreSQL-Trigrammsuche statt pgvector (Vektor- bzw. semantische Suche) für einen Katalog mit 500 Artikeln (CashFlow); Security by Design: Passkeys und WebAuthn, argon2id, CSP und HSTS, Rate Limits, HMAC-signierte Webhooks, signierte URLs, PII-Maskierung, DSGVO.',
    },
    {
      ask: 'Geschäftlicher Nutzen und Stakeholder',
      evidence:
        'Mitgründer und Vorstandsmitglied eines Softwareunternehmens, das seine Plattformen lizenziert; die B2B-Commerce-Plattform betreibt die Shops von drei Unternehmen im Produktivbetrieb (Mind Logistic, PROTECTDENT, XyliMelts); zuvor Mitinhaber und Leiter eines Unternehmens mit einem Team von 6 Personen; ein 90-Tage-Go-to-Market-Plan für die EU mit Preisrecherche in 9 Ländern.',
    },
    {
      ask: 'Kommunikation mit technischem und nichttechnischem Publikum',
      evidence:
        'Für Engineers: Specs, ADRs, Runbooks und Audit-Berichte mit Nachweisen bis auf Datei und Zeile. Für Käufer und Inhaber: Angebote, Spickzettel für Verkäufer, minutengenaue Demo-Skripte und einfache Tabellen dazu, was ein System kann, was noch kommt und was man nicht versprechen sollte.',
    },
    {
      ask: 'Führung',
      evidence:
        'Führung eines Teams von 6 Personen bei Black Point (Mitinhaber ab 2020; Vorstandsvorsitzender der Black Point Group sp. z o.o., 2022–2025); Mitgründer und Vorstandsmitglied der SIMBIA sp. z o.o. (2026); Tech Lead pro bono für das MVP einer Stiftung (2026).',
    },
  ],
  experience: [
    {
      role: 'Mitgründer, Vorstandsmitglied & Solutions Architect',
      org: 'SIMBIA sp. z o.o.',
      place: 'Poznań · remote',
      text: 'Ein Softwareunternehmen, das vertikale Plattformen entwickelt und lizenziert: CRM, Workforce-Management, Flottenmanagement und B2B-Commerce. Ich verantworte die Architektur und den KI-gestützten Delivery-Prozess. Das Unternehmen wickelt seinen Vertrieb und seine gesetzliche Buchhaltung über unser eigenes CRM ab.',
    },
    {
      role: 'Selbstständiger Product Engineer & Solutions Architect',
      org: 'STYLEICON (eigenes Studio)',
      place: 'Poznań',
      text: 'Entwurf, Bau und Betrieb von 10+ Produktivsystemen für polnische und EU-Unternehmen, an Kunden lizenziert (21 Repositories, rund 1.560 Commits im Jahr 2026); seit August 2026 über die SIMBIA sp. z o.o.',
    },
    {
      role: 'Freiberuflicher Webentwickler & Designer',
      org: 'Selbstständig (ab 2025 als STYLEICON)',
      place: 'Poznań',
      text: 'Websites und Onlineshops für kleine Unternehmen, im Alleingang gestaltet und gebaut mit WordPress und Elementor, parallel zur Führung der unten genannten Unternehmen: Black Point (ein Barbershop mit Onlinebuchung), Architect Vision (ein Innenarchitekturstudio), Hair Hub (ein Friseursalon), Alibia (ein Onlineshop) und weitere; ab 2025 unter der Marke STYLEICON, mit Branding und Video (13 Websites auf sunlucki.pl).',
    },
    {
      role: 'Design System Engineer (auf Vertragsbasis)',
      org: 'spin.clinic',
      text: 'Aufbau des produktiven Designsystems und Motion-UI-Kits (11K Zeilen, 41 Exporte, eingesetzt in 56 Produktdateien) mit 9 parallelen Coding-Agenten und einem QA-Agenten in etwa 14,5 Stunden.',
    },
    {
      role: 'Tech Lead (pro bono)',
      org: 'Fundacja Novus Ignis',
      text: 'Neue Architektur und Umsetzung des MVP einer Plattform für verifizierbare Deliberation: Next.js 16, Passkeys, ein mit OpenTimestamps verankerter Merkle-Baum und eine LLM-Ingest-Pipeline; 29 ADRs, 58 Tests.',
    },
    {
      role: 'Marketing- & Teamleiter; Gesellschafter und Vorstandsvorsitzender',
      org: 'Black Point Group sp. z o.o.',
      place: 'Poznań',
      text: 'Führung eines Teams von 6 Personen und des Marketingbetriebs: Kampagnen, Markenstrategie, Content- und Videoproduktion, Kundenkommunikation.',
    },
    {
      role: 'Mitinhaber',
      org: 'Black Point Barbershop',
      place: 'Poznań',
      text: 'Mitgründung und Führung eines Barbershops und Creative Hubs: Identität, eine Website mit Onlinebuchung, Social Media und Video.',
    },
    {
      role: 'Webentwickler',
      org: 'GreenView',
      text: 'Websites von UX/UI bis zum WordPress-Deployment: responsive Umsetzungen, Usability-Tests, direkte Zusammenarbeit mit Kunden und Marketingteams.',
    },
  ],
  skillTags: {
    'ai-sdlc': 'KI-gestützter SDLC',
    llm: 'LLM im Produktivbetrieb',
    architecture: 'Architektur',
    ts: 'TypeScript',
    node: 'Node.js',
    pg: 'PostgreSQL',
    react: 'React',
    swift: 'Swift / iOS',
    cicd: 'CI/CD & Tests',
    security: 'Sicherheit',
    payments: 'Zahlungen & E-Rechnung',
  },
  projects: [
    {
      name: 'SIMBIA CRM',
      status: 'Produktiv · mein Unternehmen läuft darauf',
      text: 'Vertriebs-CRM mit vollständiger doppelter Buchführung für eine polnische GmbH: KSeF-2.0-E-Rechnungen, PSD2-Open-Banking, registerbasierte Leadgenerierung und eine SwiftUI-Begleit-App.',
      metrics: ['~110K Zeilen TypeScript', '~240 REST-Endpunkte', '57 PostgreSQL-Tabellen', '269 Tests'],
      points: [
        'Buchhaltungsinvarianten, direkt in PostgreSQL durchgesetzt: Deferred Constraint Triggers, unveränderliche Journale, lückenlose Nummerierung; 8 behördliche XML-Meldungen, validiert gegen die offiziellen XSD-Schemas.',
        'Echtzeit-Updates von PostgreSQL LISTEN/NOTIFY zu Server-Sent Events mit Filterung pro Rolle; IMAP-IDLE-Sync, der Kundenantworten in etwa 4 Sekunden auf die Lead-Timeline bringt.',
        'Zero-Touch-Deploys mit automatischem Rollback per Health-Check; tägliche Offsite-Backups mit wöchentlichen automatisierten Wiederherstellungsprüfungen.',
        'Gebaut mit orchestrierten Coding-Agenten, schriftlichen Specs und adversarialen Multi-Agenten-Audits: 127 Befunde, 84 bestätigt und behoben.',
      ],
    },
    {
      name: 'B2B-Commerce-Plattform',
      status: 'Produktiv · an Mind Logistic lizenziert',
      text: 'Großhandelsplattform, die den WooCommerce-Shop eines Kunden im Produktivbetrieb abgelöst hat: Firmenkonten mit Ausgabenlimits und Freigabeprozessen, vertragliche Preislisten, RFQ und Angebote, Handelskredit mit Fälligkeitsanalyse und Mahnwesen.',
      metrics: ['~140K Zeilen TypeScript', '339 REST-Endpunkte', '66 Datenmodelle', '700+ Tests'],
      points: [
        'Payment-Adapter-Registry für 7 Gateways (Stripe, PayU, Przelewy24, Tpay, Autopay, Paynow, Revolut) mit gatewayspezifischer Authentifizierung und Prüfung signierter Webhooks.',
        'Marktplatz-Kanal-Engine (Allegro, Shopify, WooCommerce, Shoper, Empik, Erli): Job-Queue, exponentielles Backoff, nächtlicher Abgleich, mit AES-256-GCM verschlüsselte Zugangsdaten.',
        'Migration der Live-Daten zu Kunden, Bestellungen und Produkten aus WooCommerce, wobei alte Passwort-Hashes transparent auf bcrypt umgestellt wurden.',
      ],
    },
    {
      name: 'PROTECTDENT',
      status: 'Produktiv · Kundenplattform, lizenziert',
      text: 'EU-E-Commerce in 23 Sprachen für Verbrauchsmaterialien für Medizinprodukte, mit einer LLM-Pipeline zur Lead-Qualifizierung für den B2B-Vertrieb.',
      metrics: ['23 Sprachen', '600+ Tests', '7.800+ qualifizierte B2B-Accounts'],
      points: [
        'Die LLM-Pipeline zur Lead-Qualifizierung und die Fallback-Kette aus 4 Modellen mit einem Vision-Assistenten (siehe KI-Systeme im Produktivbetrieb).',
        'Stripe-Checkout, Umsatzsteuer auf Basis von VIES und KSeF-E-Rechnungen; Bounce- und Complaint-Verarbeitung mit Amazon SES über SNS mit Signaturprüfung; CI/CD mit Deploys per Health-Check; ein 90-Tage-Go-to-Market-Plan für die EU (373 Preispunkte in 9 Ländern).',
      ],
    },
    {
      name: 'iApply Workforce',
      status: 'Demo im Produktivbetrieb',
      text: 'Zeiterfassung, Anwesenheit und Schichtmanagement für Personaldienstleister: eine Web-App und eine native SwiftUI-App.',
      points: [
        'Einstempeln mit Betrugsschutz durch ablaufende QR-Codes, Geofencing und NFC (Web NFC, HID-Lesegeräte, CoreNFC).',
        'SwiftUI-App mit eigenem Socket.IO-v4-Client, Widgets, Live Activities und APNs-Push, direkt aus Node über HTTP/2 gesendet.',
        'Zeitberechnungen auf Lohnabrechnungsniveau mit Dezimalarithmetik und Rundungsregeln.',
      ],
    },
    {
      name: 'TAXI BOSS',
      status: 'Produktiv',
      text: 'Flottenmanagement für Uber- und Bolt-Partnerflotten, mit einer nativen SwiftUI-Fahrer-App.',
      points: [
        'Uber Vehicle Suppliers API: OAuth2 Client Credentials, Rate-Limit-Buckets pro Endpunkt, Token-Caching, geplanter Sync.',
        'Fahrer-App mit einem actorbasierten API-Client, Single-Flight-Token-Refresh und einer Offline-Outbox-Queue.',
        'Dateien auf AWS S3 (AWS SDK v3, Presigned URLs); ein Zyklus zur Behebung von Sicherheitslücken, 95 Integrationstests gegen ein echtes PostgreSQL und CI/CD von Grund auf.',
      ],
    },
    {
      name: 'Designsystem von spin.clinic',
      status: 'Live · auf Vertragsbasis',
      text: 'Designsystem und Motion-UI-Kit für spin.clinic (Next.js 14, Framer Motion): 11K Zeilen, 41 Exporte, eingesetzt in 56 Produktdateien.',
      points: [
        'Gebaut von 9 parallelen Coding-Agenten und einem QA-Agenten (Git-Worktrees, eingefrorene Schnittstellenverträge, eine File-Ownership-Map) in etwa 14,5 Stunden, ohne Merge-Konflikte.',
        'FLIP-Morphing von der Karte zum Vollbild mit Integration der History API, Spring-Motion-Tokens, gesteuert durch die Gestengeschwindigkeit, volle Unterstützung für Tastatur und Reduced Motion.',
      ],
    },
  ],
  alsoBuilt:
    'Außerdem: CashFlow (iOS-Finanzberater: SwiftUI, Fastify, Claude mit strukturierten Outputs), AiBizBox (Dokumenten-KI-SaaS mit PII-Maskierung), XyliMelts (D2C-Shop mit einem React-Three-Fiber-Hero und dem ausgereiftesten CI/CD), Novus Ignis (MVP für verifizierbare Deliberation).',
  skills: [
    {
      group: 'KI und SDLC',
      items: [
        'KI-gestützter SDLC',
        'Agentic Coding',
        'Multi-Agenten-Orchestrierung',
        'Claude Code',
        'GitHub Copilot',
        'OpenAI Codex',
        'MCP',
        'LLM-Integration',
        'Strukturierte Outputs',
        'Prompt-Caching',
        'Dokumenten-KI / OCR',
        'LLM-Pipelines',
        'Prompt Engineering',
      ],
    },
    {
      group: 'Architektur',
      items: [
        'Lösungsarchitektur',
        'Systemdesign',
        'Domänenmodule',
        'State Machines',
        'Eventgetriebenes Design (LISTEN/NOTIFY, SSE, Queues)',
        'Integrationsarchitektur (OAuth2, signierte Webhooks, Idempotenz)',
        'Sicherheitsarchitektur',
        'ADRs',
      ],
    },
    {
      group: 'Engineering',
      items: [
        'TypeScript',
        'Node.js (Fastify, Express)',
        'React',
        'Next.js',
        'PostgreSQL',
        'Prisma',
        'Drizzle',
        'Redis / BullMQ',
        'REST / OpenAPI',
        'Swift / SwiftUI',
      ],
    },
    {
      group: 'Delivery und Betrieb',
      items: [
        'CI/CD (GitHub Actions)',
        'Automatisierte Tests (Vitest, XCTest)',
        'Docker',
        'Linux (nginx, PM2, systemd)',
        'AWS: S3, SES, SNS (SDK v3, Presigned URLs, signaturgeprüfte Webhooks)',
        'Backups und Disaster Recovery',
        'Sentry',
      ],
    },
    {
      group: 'Fachdomänen',
      items: [
        'CRM',
        'B2B-Commerce',
        'Zahlungen (Stripe, PayU, Przelewy24)',
        'E-Rechnung (KSeF 2.0)',
        'Buchhaltung',
        'HR-Tech',
        'Flottenmanagement',
      ],
    },
  ],
  education: [{ degree: 'B.Sc.', field: 'Informatik, Schwerpunkt: Computergrafik' }],
};

export default de;

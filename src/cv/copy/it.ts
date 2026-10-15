import type { CvText } from './types.ts';

// Italian
const it: CvText = {
  meta: {
    title: 'Bogdan Nenadović · CV · Product Engineer & Solutions Architect',
    description:
      'Bogdan Nenadović, product engineer e solutions architect a Poznań, in Polonia: 10+ sistemi in produzione nel 2026 come unico architetto, un SDLC assistito dall’AI con Claude Code e Codex.',
  },
  ui: {
    cv: 'Curriculum vitae',
    updated: 'Aggiornato il {date}',
    nav: { summary: 'Profilo', delivery: 'Come lavoro', experience: 'Esperienza', projects: 'Progetti', fit: 'Requisiti del ruolo', skills: 'Competenze' },
    subs: {
      delivery: 'SDLC assistito dall’AI, passo per passo, ognuno con le sue prove',
      experience: 'Dal primo ruolo a oggi',
      projects: 'Sistemi in produzione che ho progettato e sviluppato; i video promozionali li mostrano all’opera',
      fit: 'Solutions Architect · SDLC assistito dall’AI: cosa chiede il ruolo e cosa lo dimostra',
      skills: 'Lo stack, cartella per cartella',
    },
    builtIn2026: 'Sviluppato nel 2026',
    howIDeliver: 'Come lavoro',
    beforeEngineering: 'Prima dell’ingegneria',
    tools: 'Strumenti',
    aiSystem: 'Sistema AI in produzione',
    present: 'oggi',
    oneMonth: '1 mese',
    howBuilt: 'Come è costruito',
    showEvidence: 'Mostra le prove',
    whatShowsIt: 'Cosa lo dimostra',
    openAll: 'Apri tutto',
    closeAll: 'Chiudi tutto',
    filterLabel: 'Mostra i progetti che usano una competenza',
    filterNote: '{n} progetti su {total} usano {skill}. Toccala di nuovo per mostrarli tutti.',
    download: 'Scarica il PDF',
    ats: 'PDF a una colonna per ATS',
    openToWork: 'Disponibile per nuove opportunità',
    toolsCount: '{n} strumenti',
    education: 'Formazione',
    languages: 'Lingue',
    portraitAlt: 'Ritratto di Bogdan Nenadović',
    alsoAs: 'Questo CV è disponibile anche in formato {txt}, {json} e {pdf}',
    plainText: 'testo semplice',
    jsonResume: 'JSON Resume',
    onePdf: 'PDF a una colonna',
    site: 'Pagina principale',
    language: 'Lingua',
    sections: 'Sezioni',
    projectScreens: '{name}: le sue schermate',
    promoPoster: '{name}: un fotogramma del video promozionale',
    play: 'Riproduci il video promozionale di {name}',
    projectsLink: 'Tutti i progetti nella pagina principale',
    folders: { llm: 'LLM nei prodotti', integrations: 'Integrazioni e sicurezza', frontend: 'Frontend e mobile', backend: 'Backend e dati' },
  },
  headline: 'Product Engineer & Solutions Architect',
  focus: 'SDLC assistito dall’AI · agentic coding · piattaforme CRM, commerce e fintech',
  location: 'Poznań, Polonia (CET)',
  terms: 'Da remoto, da casa · in sede per gli eventi aziendali chiave · B2B tramite la mia società, SIMBIA sp. z o.o.',
  languages: [
    ['Inglese', 'C2'],
    ['Polacco', 'C2'],
    ['Ucraino', 'madrelingua'],
    ['Russo', 'madrelingua'],
  ],
  summary: {
    lead: 'Progetto, sviluppo e gestisco prodotti software end-to-end, e conduco l’intero ciclo di vita del software tramite agenti AI.',
    builtIntro: 'Nel 2026 sono stato l’unico architetto di 10+ sistemi in produzione per aziende polacche e dell’UE',
    built: [
      'un CRM con contabilità in partita doppia e fatturazione elettronica KSeF su cui gira la mia azienda',
      'una piattaforma di commercio B2B con 7 gateway di pagamento e 6 integrazioni con marketplace',
      'un negozio online UE in 23 lingue con una pipeline LLM di qualificazione dei lead',
      'una piattaforma di gestione del personale per agenzie interinali e una di gestione flotte per le flotte partner di Uber e Bolt, entrambe con app iOS native',
    ],
    delivery:
      'Il mio modo di consegnare è spec-driven e agentico: specifiche scritte, coding agent in parallelo con contratti congelati, test automatizzati, revisioni multi-agente avversariali e, sulle piattaforme principali, CI/CD con rollback vincolato agli health check.',
    background:
      'Prima di dedicarmi all’ingegneria a tempo pieno sono stato co-titolare di aziende e ho gestito un team di 6 persone, quindi spiego l’architettura in termini di costi, rischi e valore di business.',
  },
  numbers: [
    { value: '10+', label: 'sistemi in produzione rilasciati nel 2026, come unico architetto' },
    { value: '94%', label: 'dei miei commit del 2026 con Claude come co-autore' },
    { value: '84 su 127', label: 'rilievi dell’audit confermati da agenti scettici, poi corretti' },
    { value: '10', label: 'agenti in parallelo (9 di sviluppo, 1 di QA): un design system di 11K righe in ~14,5 h' },
    { value: '700+', label: 'test automatizzati sulla piattaforma più grande (339 endpoint REST)' },
    { value: '23', label: 'lingue dell’interfaccia su un’unica piattaforma UE' },
  ],
  sdlc: [
    {
      title: 'Specifica',
      text: 'I requisiti diventano specifiche scritte che gli agenti seguono: MASTER_PROMPT, CLAUDE.md e AGENTS.md, pacchetti di skill, fasi con una Definition of Done. Le decisioni architetturali sono registrate come ADR (29 su un solo MVP).',
    },
    {
      title: 'Orchestrazione',
      text: 'I coding agent lavorano in parallelo in git worktree su contratti congelati e una mappa di ownership dei file, con prompt di passaggio di consegne tra i modelli. Il design system di spin.clinic è stato costruito così da 9 agenti e un agente di QA: 11K righe in circa 14,5 ore, senza conflitti di merge.',
    },
    {
      title: 'Test',
      text: 'Gli agenti scrivono ed eseguono i test: Vitest, node:test, supertest su un PostgreSQL reale, contract test con golden fixture condivise da un’API TypeScript e da un’app Swift, XCTest. 700+, 600+ e 269 test sulle tre piattaforme più grandi.',
    },
    {
      title: 'Revisione e validazione',
      text: 'Audit multi-agente avversariali: un agente scettico conferma o respinge ogni rilievo riproducendolo, e solo quelli confermati vengono corretti e fissati da un test di regressione (84 su 127 confermati su SIMBIA CRM, 20 su 52 su AiBizBox); una revisione contabile è stata condotta come audit multi-agente con 28 agenti e 750 chiamate a strumenti.',
    },
    {
      title: 'Rilascio',
      text: 'Sulle piattaforme principali (SIMBIA CRM, PROTECTDENT, XyliMelts): GitHub Actions con service container PostgreSQL e Redis, un backup del database prima di ogni deploy, migrazioni, rollback automatico vincolato agli health check e smoke test.',
    },
    {
      title: 'Operatività',
      text: 'Backup giornalieri off-site con test di ripristino automatici settimanali (SIMBIA CRM), Sentry, endpoint di health e alert. Ogni incidente ha il suo postmortem: dopo che un errore di sincronizzazione ha cancellato una copia di lavoro, il codice è stato ricostruito dai log di sessione degli agenti e verificato rispetto alla produzione.',
    },
  ],
  tools:
    'Claude Code (principale, sui progetti commerciali per i clienti; in VS Code e da CLI) · GitHub Copilot (VS Code) · OpenAI Codex · Cursor (provato, preferisco VS Code) · server MCP (automazione del browser Chrome, iOS Simulator, Figma, Spline) · API LLM: Claude, OpenAI, Gemini, Groq, NVIDIA NIM',
  aiSystems: [
    'Pipeline LLM di qualificazione dei lead (PROTECTDENT): discovery basata su mappe, crawling dei siti, scoring basato su evidenze da 0 a 100 e classificazione dell’intento delle risposte in 8 intenti; 7.800+ account B2B qualificati.',
    'Routing LLM multi-provider: una catena di fallback su 4 modelli con timeout rigidi, quote, caching e un log delle chiamate; un assistente visivo che associa la foto di un’attrezzatura dentale ai prodotti compatibili.',
    'Document AI: OCR, poi un LLM con visione, estrazione dei campi e revisione umana, con i dati personali mascherati prima di qualsiasi chiamata LLM (AiBizBox, SIMBIA).',
    'Funzionalità Claude con output strutturati validati da Zod, prompt caching e quote atomiche per utente (CashFlow); una pipeline LLM di ingest che rifiuta le citazioni non letterali (Novus Ignis).',
  ],
  fit: [
    {
      ask: 'Architettura di sistema e applicativa',
      evidence:
        'Unico architetto di 10+ sistemi in produzione: moduli di dominio senza I/O, macchine a stati (ordini con un numero di stati da 20 a 24), invarianti imposte con trigger PostgreSQL, flussi di eventi (da LISTEN/NOTIFY a SSE), code con lease lock e circuit breaker, un registro di adapter di pagamento, 29 ADR su un solo MVP.',
    },
    {
      ask: 'SDLC assistito dall’AI: sviluppo, test, CI/CD',
      evidence:
        'I miei progetti del 2026 sono stati costruiti così, dalle specifiche scritte ai rilasci testati; le piattaforme principali vengono rilasciate tramite CI/CD con health check e rollback automatico. Circa il 94% dei miei commit del 2026 ha Claude come co-autore.',
    },
    {
      ask: 'Agentic coding e ingegneria del software autonoma',
      evidence:
        'Orchestrazione dei task tra agenti in parallelo (worktree, contratti congelati, mappe di ownership), quality gate (test, Definition of Done), validazione da parte di agenti scettici che devono riprodurre ogni rilievo, decisioni registrate come ADR.',
    },
    {
      ask: 'Sistemi AI: workflow AI, single-agent e multi-agente',
      evidence:
        'Workflow AI in produzione: pipeline LLM per la qualificazione dei lead, la classificazione dell’intento delle risposte e la document AI con revisione umana, con routing multi-provider; sistemi multi-agente: un sistema di audit multi-agente (28 agenti, 750 chiamate a strumenti) e coding agent in parallelo per il lavoro di ingegneria stesso.',
    },
    {
      ask: 'Scelte infrastrutturali: sicurezza, costi, prestazioni, scalabilità',
      evidence:
        'Infrastruttura Linux autogestita per 20+ progetti su 4+ server (nginx, PM2, systemd, TLS, Docker) con backup e test di ripristino; integrazioni AWS: object storage S3 con URL presigned (TAXI BOSS), Amazon SES con webhook di bounce e reclami via SNS, con verifica della firma (PROTECTDENT); tecnologie scelte in base ai dati e ai costi, ad es. la ricerca trigram di PostgreSQL preferita a pgvector (ricerca vettoriale/semantica) per un catalogo di 500 articoli (CashFlow); security by design: passkey e WebAuthn, argon2id, CSP e HSTS, rate limit, webhook firmati con HMAC, URL firmati, mascheramento dei dati personali (PII), GDPR.',
    },
    {
      ask: 'Valore di business e stakeholder',
      evidence:
        'Co-fondatore e membro del consiglio di amministrazione di una società di software che concede in licenza le proprie piattaforme; la piattaforma di commercio B2B fa girare in produzione i negozi di tre aziende (Mind Logistic, PROTECTDENT, XyliMelts); in precedenza co-titolare e gestore di un’attività con un team di 6 persone; un piano go-to-market UE di 90 giorni con una ricerca sui prezzi in 9 paesi.',
    },
    {
      ask: 'Comunicazione con pubblici tecnici e non tecnici',
      evidence:
        'Per gli ingegneri: specifiche, ADR, runbook e report di audit con prove a livello di file e riga. Per acquirenti e titolari: proposte, schede di riferimento per i venditori, script di demo minuto per minuto e tabelle semplici su cosa fa un sistema, cosa arriverà e cosa non promettere.',
    },
    {
      ask: 'Leadership',
      evidence:
        'Ho gestito un team di 6 persone in Black Point (co-titolare dal 2020; Presidente del Consiglio di Amministrazione di Black Point Group sp. z o.o., 2022–2025); co-fondatore e membro del consiglio di amministrazione di SIMBIA sp. z o.o. (2026); tech lead pro bono dell’MVP di una fondazione (2026).',
    },
  ],
  experience: [
    {
      role: 'Co-fondatore, membro del consiglio di amministrazione e Solutions Architect',
      org: 'SIMBIA sp. z o.o.',
      place: 'Poznań · da remoto',
      text: 'Una società di software che sviluppa e concede in licenza piattaforme verticali: CRM, gestione del personale, gestione flotte e commercio B2B. Sono responsabile dell’architettura e del processo di delivery assistito dall’AI. La società gestisce vendite e contabilità civilistica sul nostro CRM.',
    },
    {
      role: 'Product Engineer & Solutions Architect indipendente',
      org: 'STYLEICON (il mio studio)',
      place: 'Poznań',
      text: 'Ho progettato, sviluppato e gestisco 10+ sistemi in produzione per aziende polacche e dell’UE, concessi in licenza ai clienti (21 repository, circa 1.560 commit nel 2026); da agosto 2026 tramite SIMBIA sp. z o.o.',
    },
    {
      role: 'Web developer e designer freelance',
      org: 'Libero professionista (dal 2025 come STYLEICON)',
      place: 'Poznań',
      text: 'Siti web ed e-shop per piccole imprese, progettati e sviluppati da solo su WordPress ed Elementor, parallelamente alla gestione delle attività qui sotto: Black Point (una barberia con prenotazione online), Architect Vision (uno studio di interior design), Hair Hub (un salone di parrucchiere), Alibia (un e-shop) e altri; dal 2025 con il brand STYLEICON, con branding e video (13 siti su sunlucki.pl).',
    },
    {
      role: 'Design System Engineer (a contratto)',
      org: 'spin.clinic',
      text: 'Ho realizzato il design system di produzione e il motion UI kit (11K righe, 41 export, usati in 56 file del prodotto) con 9 coding agent in parallelo e un agente di QA in circa 14,5 ore.',
    },
    {
      role: 'Tech Lead (pro bono)',
      org: 'Fundacja Novus Ignis',
      text: 'Ho riprogettato l’architettura e sviluppato l’MVP di una piattaforma di deliberazione verificabile: Next.js 16, passkey, un Merkle tree ancorato con OpenTimestamps e una pipeline LLM di ingest; 29 ADR, 58 test.',
    },
    {
      role: 'Marketing & Team Leader; socio e Presidente del Consiglio di Amministrazione',
      org: 'Black Point Group sp. z o.o.',
      place: 'Poznań',
      text: 'Ho gestito un team di 6 persone e le attività di marketing: campagne, strategia di brand, produzione di contenuti e video, comunicazione con i clienti.',
    },
    {
      role: 'Co-titolare',
      org: 'Black Point Barbershop',
      place: 'Poznań',
      text: 'Ho co-fondato e gestito una barberia e hub creativo: identità visiva, un sito con prenotazione online, social media e video.',
    },
    {
      role: 'Web Developer',
      org: 'GreenView',
      text: 'Siti web dalla UX/UI al deploy su WordPress: sviluppo responsive, test di usabilità, lavoro diretto con i clienti e i team di marketing.',
    },
  ],
  skillTags: {
    'ai-sdlc': 'SDLC assistito dall’AI',
    llm: 'LLM in produzione',
    architecture: 'Architettura',
    ts: 'TypeScript',
    node: 'Node.js',
    pg: 'PostgreSQL',
    react: 'React',
    swift: 'Swift / iOS',
    cicd: 'CI/CD e test',
    security: 'Sicurezza',
    payments: 'Pagamenti e fatturazione elettronica',
  },
  projects: [
    {
      name: 'SIMBIA CRM',
      status: 'In produzione · gestisce la mia azienda',
      text: 'CRM per le vendite con contabilità completa in partita doppia per una società a responsabilità limitata polacca: fatturazione elettronica KSeF 2.0, open banking PSD2, lead generation basata sui registri e un’app companion in SwiftUI.',
      metrics: ['~110K righe di TypeScript', '~240 endpoint REST', '57 tabelle PostgreSQL', '269 test'],
      points: [
        'Invarianti contabili imposte dentro PostgreSQL: deferred constraint trigger, giornali contabili immutabili, numerazione senza salti; 8 invii XML alla pubblica amministrazione validati rispetto agli schemi XSD ufficiali.',
        'Aggiornamenti in tempo reale da PostgreSQL LISTEN/NOTIFY a Server-Sent Events con filtri per ruolo; sincronizzazione IMAP IDLE che porta le risposte dei clienti nella timeline del lead in circa 4 secondi.',
        'Deploy zero-touch con rollback automatico vincolato agli health check; backup giornalieri off-site con verifiche di ripristino automatiche settimanali.',
        'Sviluppato tramite coding agent orchestrati con specifiche scritte e audit multi-agente avversariali: 127 rilievi, 84 confermati e corretti.',
      ],
    },
    {
      name: 'Piattaforma di commercio B2B',
      status: 'In produzione · in licenza a Mind Logistic',
      text: 'Piattaforma all’ingrosso che ha sostituito in produzione il negozio WooCommerce di un cliente: account aziendali con limiti di spesa e flussi di approvazione, listini prezzi contrattuali, RFQ e preventivi, credito commerciale con scadenzario e solleciti di pagamento.',
      metrics: ['~140K righe di TypeScript', '339 endpoint REST', '66 modelli di dati', '700+ test'],
      points: [
        'Registro di adapter di pagamento per 7 gateway (Stripe, PayU, Przelewy24, Tpay, Autopay, Paynow, Revolut) con autenticazione specifica per gateway e verifica dei webhook firmati.',
        'Motore dei canali marketplace (Allegro, Shopify, WooCommerce, Shoper, Empik, Erli): coda di job, backoff esponenziale, riconciliazione notturna, credenziali cifrate con AES-256-GCM.',
        'Ho migrato clienti, ordini e prodotti attivi da WooCommerce, aggiornando in modo trasparente a bcrypt gli hash delle password legacy.',
      ],
    },
    {
      name: 'PROTECTDENT',
      status: 'In produzione · piattaforma del cliente, in licenza',
      text: 'E-commerce UE in 23 lingue per materiali di consumo per dispositivi medici, con una pipeline LLM di qualificazione dei lead per le vendite B2B.',
      metrics: ['23 lingue', '600+ test', '7.800+ account B2B qualificati'],
      points: [
        'La pipeline LLM di qualificazione dei lead e la catena di fallback su 4 modelli con un assistente visivo (vedi Sistemi AI in produzione).',
        'Checkout Stripe, IVA basata su VIES e fatturazione elettronica KSeF; gestione di bounce e reclami di Amazon SES via SNS con verifica della firma; CI/CD con deploy verificati da health check; un piano go-to-market UE di 90 giorni (373 prezzi rilevati in 9 paesi).',
      ],
    },
    {
      name: 'iApply Workforce',
      status: 'Demo in produzione',
      text: 'Gestione di orari, presenze e turni per agenzie interinali: un’app web e un’app nativa in SwiftUI.',
      points: [
        'Timbratura antifrode con QR code a scadenza, geofencing e NFC (Web NFC, lettori HID, CoreNFC).',
        'App SwiftUI con un proprio client Socket.IO v4, widget, Live Activities e notifiche push APNs inviate via HTTP/2 direttamente da Node.',
        'Calcolo delle ore con la precisione richiesta dalle buste paga, con aritmetica decimale e regole di arrotondamento.',
      ],
    },
    {
      name: 'TAXI BOSS',
      status: 'In produzione',
      text: 'Gestione flotte per le flotte partner di Uber e Bolt, con un’app nativa per autisti in SwiftUI.',
      points: [
        'Uber Vehicle Suppliers API: OAuth2 client credentials, bucket di rate limit per endpoint, caching dei token, sincronizzazione pianificata.',
        'App per autisti con un client API basato su actor, refresh dei token single-flight e una coda outbox offline.',
        'File su AWS S3 (AWS SDK v3, URL presigned); un ciclo di remediation di sicurezza, 95 test di integrazione su un PostgreSQL reale e CI/CD da zero.',
      ],
    },
    {
      name: 'Design system di spin.clinic',
      status: 'Online · a contratto',
      text: 'Design system e motion UI kit per spin.clinic (Next.js 14, Framer Motion): 11K righe, 41 export, usati in 56 file del prodotto.',
      points: [
        'Realizzato da 9 coding agent in parallelo e un agente di QA (git worktree, contratti congelati, una mappa di ownership dei file) in circa 14,5 ore, senza conflitti di merge.',
        'Morphing FLIP da card a schermo intero con integrazione della History API, motion token a molla guidati dalla velocità del gesto, supporto completo per tastiera e reduced motion.',
      ],
    },
  ],
  alsoBuilt:
    'Inoltre: CashFlow (consulente finanziario per iOS: SwiftUI, Fastify, Claude con output strutturati), AiBizBox (SaaS di document AI con mascheramento dei dati personali), XyliMelts (negozio D2C con una hero in React Three Fiber e la CI/CD più matura), Novus Ignis (MVP di deliberazione verificabile).',
  skills: [
    {
      group: 'AI e SDLC',
      items: [
        'SDLC assistito dall’AI',
        'Agentic coding',
        'Orchestrazione multi-agente',
        'Claude Code',
        'GitHub Copilot',
        'OpenAI Codex',
        'MCP',
        'Integrazione LLM',
        'Output strutturati',
        'Prompt caching',
        'Document AI / OCR',
        'Pipeline LLM',
        'Prompt engineering',
      ],
    },
    {
      group: 'Architettura',
      items: [
        'Architettura delle soluzioni',
        'System design',
        'Moduli di dominio',
        'Macchine a stati',
        'Design event-driven (LISTEN/NOTIFY, SSE, code)',
        'Architettura delle integrazioni (OAuth2, webhook firmati, idempotenza)',
        'Architettura della sicurezza',
        'ADR',
      ],
    },
    {
      group: 'Ingegneria',
      items: ['TypeScript', 'Node.js (Fastify, Express)', 'React', 'Next.js', 'PostgreSQL', 'Prisma', 'Drizzle', 'Redis / BullMQ', 'REST / OpenAPI', 'Swift / SwiftUI'],
    },
    {
      group: 'Delivery e operatività',
      items: [
        'CI/CD (GitHub Actions)',
        'Test automatizzati (Vitest, XCTest)',
        'Docker',
        'Linux (nginx, PM2, systemd)',
        'AWS: S3, SES, SNS (SDK v3, URL presigned, webhook con verifica della firma)',
        'Backup e disaster recovery',
        'Sentry',
      ],
    },
    {
      group: 'Domini',
      items: ['CRM', 'Commercio B2B', 'Pagamenti (Stripe, PayU, Przelewy24)', 'Fatturazione elettronica (KSeF 2.0)', 'Contabilità', 'HR tech', 'Gestione flotte'],
    },
  ],
  education: [{ degree: 'Laurea di primo livello', field: 'Informatica, specializzazione: computer grafica' }],
};

export default it;

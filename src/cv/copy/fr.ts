import type { CvText } from './types.ts';

// French
const fr: CvText = {
  meta: {
    title: 'Bogdan Nenadović · CV · Product Engineer & Solutions Architect',
    description:
      'Bogdan Nenadović, product engineer et solutions architect à Poznań, Pologne : 10+ systèmes en production en 2026 en tant que seul architecte, un SDLC assisté par IA avec Claude Code et Codex.',
  },
  ui: {
    cv: 'Curriculum vitae',
    updated: 'Mis à jour : {date}',
    nav: {
      summary: 'Profil',
      delivery: 'Comment je livre',
      experience: 'Expérience',
      projects: 'Projets',
      fit: 'Adéquation au poste',
      skills: 'Compétences',
    },
    subs: {
      delivery: 'Le SDLC assisté par IA, étape par étape, chacune avec ses preuves',
      experience: 'Du premier poste jusqu’à aujourd’hui',
      projects: 'Des systèmes en production que j’ai conçus et développés ; les vidéos promo les montrent à l’œuvre',
      fit: 'Solutions Architect · SDLC assisté par IA : ce que demande le poste, et ce qui le démontre',
      skills: 'Technologies et pratiques avec lesquelles je travaille',
    },
    builtIn2026: 'Développé en 2026',
    howIDeliver: 'Comment je livre',
    beforeEngineering: 'Avant l’ingénierie',
    tools: 'Outils',
    aiSystem: 'Système d’IA en production',
    present: 'aujourd’hui',
    oneMonth: '1 mois',
    howBuilt: 'Comment il est construit',
    showEvidence: 'Voir les preuves',
    whatShowsIt: 'Ce qui le démontre',
    openAll: 'Tout ouvrir',
    closeAll: 'Tout fermer',
    filterLabel: 'Afficher les projets qui utilisent une compétence',
    filterNote: '{n} projets sur {total} utilisent {skill}. Touchez à nouveau pour tout afficher.',
    download: 'Télécharger le PDF',
    ats: 'PDF sur une colonne pour les ATS',
    openToWork: 'Ouvert aux opportunités',
    toolsCount: '{n} outils',
    education: 'Formation',
    languages: 'Langues',
    portraitAlt: 'Portrait de Bogdan Nenadović',
    alsoAs: 'Ce CV existe aussi en {txt}, en {json} et en {pdf}',
    plainText: 'texte brut',
    jsonResume: 'JSON Resume',
    onePdf: 'PDF sur une colonne',
    site: 'Page principale',
    language: 'Langue',
    sections: 'Sections',
    projectScreens: '{name} : ses écrans',
    promoPoster: '{name} : une image de sa vidéo promo',
    play: 'Lire la vidéo promo : {name}',
    projectsLink: 'Tous les projets sur la page d’accueil',
    folders: { llm: 'LLM dans les produits', integrations: 'Intégrations et sécurité', frontend: 'Frontend et mobile', backend: 'Backend et données' },
  },
  headline: 'Product Engineer & Solutions Architect',
  focus: 'SDLC assisté par IA · codage agentique · plateformes CRM, e-commerce et fintech',
  location: 'Poznań, Pologne (CET)',
  terms: 'Télétravail depuis chez moi · sur site pour les événements clés de l’entreprise · B2B via ma propre société, SIMBIA sp. z o.o.',
  languages: [
    ['Anglais', 'C2'],
    ['Polonais', 'C2'],
    ['Ukrainien', 'langue maternelle'],
    ['Russe', 'langue maternelle'],
  ],
  summary: {
    lead: 'Je conçois, développe et exploite des produits logiciels de bout en bout, et je pilote tout le cycle de vie logiciel à travers des agents IA.',
    builtIntro: 'En 2026, j’ai été le seul architecte de 10+ systèmes en production pour des entreprises polonaises et européennes',
    built: [
      'un CRM avec comptabilité en partie double et facturation électronique KSeF, sur lequel tourne ma propre entreprise',
      'une plateforme e-commerce B2B avec 7 passerelles de paiement et 6 intégrations marketplace',
      'une boutique européenne en 23 langues avec un pipeline LLM de qualification des leads',
      'une plateforme de gestion des effectifs pour les agences d’intérim et une solution de gestion de flotte pour les flottes partenaires d’Uber et de Bolt, toutes deux avec des apps iOS natives',
    ],
    delivery:
      'Ma livraison est pilotée par les spécifications et agentique : spécifications écrites, agents de code en parallèle avec des contrats figés, tests automatisés, revues multi-agents contradictoires et, sur les plateformes principales, CI/CD avec rollback conditionné aux health checks.',
    background:
      'Avant de me consacrer à plein temps à l’ingénierie, j’ai été copropriétaire d’entreprises et j’ai managé une équipe de 6 personnes, c’est pourquoi j’explique l’architecture en termes de coût, de risque et de valeur métier.',
  },
  numbers: [
    { value: '10+', label: 'systèmes en production livrés en 2026, en tant que seul architecte' },
    { value: '94%', label: 'de mes commits de 2026 co-écrits avec Claude' },
    { value: '84 sur 127', label: 'constats d’audit confirmés par des agents sceptiques, puis corrigés' },
    { value: '10', label: 'agents en parallèle (9 de code, 1 de QA) : un design system de 11K lignes en ~14,5 h' },
    { value: '700+', label: 'tests automatisés sur la plus grande plateforme (339 endpoints REST)' },
    { value: '23', label: 'langues d’interface sur une seule plateforme européenne' },
  ],
  sdlc: [
    {
      title: 'Spécifier',
      text: 'Les exigences deviennent des spécifications écrites que les agents suivent : MASTER_PROMPT, CLAUDE.md et AGENTS.md, packs de skills, phases avec une Definition of Done. Les décisions d’architecture sont consignées sous forme d’ADR (29 sur un seul MVP).',
    },
    {
      title: 'Orchestrer',
      text: 'Les agents de code travaillent en parallèle dans des git worktrees, en s’appuyant sur des contrats figés et une carte de propriété des fichiers, avec des prompts de passation entre modèles. Le design system de spin.clinic a été construit ainsi par 9 agents et un agent QA : 11K lignes en environ 14,5 heures, sans aucun conflit de merge.',
    },
    {
      title: 'Tester',
      text: 'Les agents écrivent et exécutent les tests : Vitest, node:test, supertest sur un vrai PostgreSQL, tests de contrat avec des golden fixtures partagées par une API TypeScript et une app Swift, XCTest. 700+, 600+ et 269 tests sur les trois plus grandes plateformes.',
    },
    {
      title: 'Revoir et valider',
      text: 'Audits multi-agents contradictoires : un agent sceptique confirme ou rejette chaque constat en le reproduisant, et seuls les constats confirmés sont corrigés et verrouillés par un test de régression (84 sur 127 confirmés sur SIMBIA CRM, 20 sur 52 sur AiBizBox) ; une revue comptable a été menée sous forme d’audit multi-agents de 28 agents et 750 appels d’outils.',
    },
    {
      title: 'Livrer',
      text: 'Sur les plateformes principales (SIMBIA CRM, PROTECTDENT, XyliMelts) : GitHub Actions avec des service containers PostgreSQL et Redis, une sauvegarde de la base de données avant chaque déploiement, des migrations, un rollback automatique conditionné aux health checks et des smoke tests.',
    },
    {
      title: 'Exploiter',
      text: 'Sauvegardes externalisées quotidiennes avec tests de restauration automatisés chaque semaine (SIMBIA CRM), Sentry, endpoints de santé et alertes. Les incidents font l’objet d’un postmortem : après qu’un échec de synchronisation a effacé une copie de travail, le code a été reconstruit à partir des journaux de session des agents et vérifié par rapport à la production.',
    },
  ],
  tools:
    'Claude Code (principal, sur des projets clients commerciaux ; dans VS Code et en CLI) · GitHub Copilot (VS Code) · OpenAI Codex · Cursor (essayé, VS Code préféré) · serveurs MCP (automatisation du navigateur Chrome, iOS Simulator, Figma, Spline) · API LLM : Claude, OpenAI, Gemini, Groq, NVIDIA NIM',
  aiSystems: [
    'Pipeline LLM de qualification des leads (PROTECTDENT) : découverte à partir de cartes, crawl des sites, scoring fondé sur des preuves de 0 à 100 et classification de l’intention des réponses en 8 intentions ; 7 800+ comptes B2B qualifiés.',
    'Routage LLM multi-fournisseurs : une chaîne de repli sur 4 modèles avec timeouts stricts, quotas, cache et journal des appels ; un assistant de vision qui associe une photo d’équipement dentaire aux produits compatibles.',
    'IA documentaire : OCR, puis un LLM de vision, extraction des champs et relecture humaine, avec masquage des données personnelles avant tout appel LLM (AiBizBox, SIMBIA).',
    'Fonctionnalités Claude avec sorties structurées validées par Zod, mise en cache des prompts et quotas atomiques par utilisateur (CashFlow) ; un pipeline d’ingestion LLM qui rejette les citations qui ne sont pas mot pour mot (Novus Ignis).',
  ],
  fit: [
    {
      ask: 'Architecture système et applicative',
      evidence:
        'Seul architecte de 10+ systèmes en production : modules de domaine sans I/O, machines à états (des commandes de 20 à 24 états), invariants imposés par des triggers PostgreSQL, flux d’événements (LISTEN/NOTIFY vers SSE), files d’attente avec verrous à bail et circuit breakers, un registre d’adaptateurs de paiement, 29 ADR sur un seul MVP.',
    },
    {
      ask: 'SDLC assisté par IA : développement, tests, CI/CD',
      evidence:
        'Mes projets de 2026 ont été construits ainsi, des spécifications écrites jusqu’aux releases testées ; les plateformes principales sont livrées via CI/CD avec health checks et rollback automatique. Environ 94% de mes commits de 2026 sont co-écrits avec Claude.',
    },
    {
      ask: 'Codage agentique et ingénierie logicielle autonome',
      evidence:
        'Orchestration des tâches entre agents parallèles (worktrees, contrats figés, cartes de propriété), quality gates (tests, Definition of Done), validation par des agents sceptiques qui doivent reproduire chaque constat, décisions consignées sous forme d’ADR.',
    },
    {
      ask: 'Systèmes d’IA : workflows IA, mono-agent et multi-agents',
      evidence:
        'Workflows IA en production : pipelines LLM pour la qualification des leads, la classification de l’intention des réponses et l’IA documentaire avec relecture humaine, avec un routage multi-fournisseurs ; systèmes multi-agents : un système d’audit multi-agents (28 agents, 750 appels d’outils) et des agents de code en parallèle pour l’ingénierie elle-même.',
    },
    {
      ask: 'Choix d’infrastructure : sécurité, coût, performance, scalabilité',
      evidence:
        'Infrastructure Linux autogérée pour 20+ projets sur 4+ serveurs (nginx, PM2, systemd, TLS, Docker) avec sauvegardes et tests de restauration ; intégrations AWS : stockage objet S3 avec URL présignées (TAXI BOSS), Amazon SES avec webhooks de bounces et de plaintes via SNS, à signature vérifiée (PROTECTDENT) ; technologie choisie en fonction des données et du coût, par exemple la recherche par trigrammes de PostgreSQL préférée à pgvector (recherche vectorielle/sémantique) pour un catalogue de 500 articles (CashFlow) ; sécurité dès la conception : passkeys et WebAuthn, argon2id, CSP et HSTS, limites de débit, webhooks signés par HMAC, URL signées, masquage des PII, RGPD.',
    },
    {
      ask: 'Valeur métier et parties prenantes',
      evidence:
        'Cofondateur et membre du directoire d’une société logicielle qui concède ses plateformes sous licence ; la plateforme e-commerce B2B fait tourner en production les boutiques de trois entreprises (Mind Logistic, PROTECTDENT, XyliMelts) ; auparavant, copropriétaire et dirigeant d’une entreprise avec une équipe de 6 personnes ; un plan go-to-market européen sur 90 jours avec une étude des prix dans 9 pays.',
    },
    {
      ask: 'Communication avec des publics techniques et non techniques',
      evidence:
        'Pour les ingénieurs : spécifications, ADR, runbooks et rapports d’audit avec des preuves au fichier et à la ligne près. Pour les acheteurs et les propriétaires : propositions, aide-mémoire pour les vendeurs, scripts de démo minute par minute et tableaux simples de ce que fait un système, de ce qui arrive et de ce qu’il ne faut pas promettre.',
    },
    {
      ask: 'Leadership',
      evidence:
        'Management d’une équipe de 6 personnes chez Black Point (copropriétaire depuis 2020 ; président du directoire de Black Point Group sp. z o.o., 2022–2025) ; cofondateur et membre du directoire de SIMBIA sp. z o.o. (2026) ; tech lead pro bono du MVP d’une fondation (2026).',
    },
  ],
  experience: [
    {
      role: 'Cofondateur, membre du directoire & Solutions Architect',
      org: 'SIMBIA sp. z o.o.',
      place: 'Poznań · télétravail',
      text: 'Une société logicielle qui développe et concède sous licence des plateformes verticales : CRM, gestion des effectifs, gestion de flotte et e-commerce B2B. Je suis responsable de l’architecture et du processus de livraison assisté par IA. L’entreprise gère ses ventes et sa comptabilité réglementaire sur notre propre CRM.',
    },
    {
      role: 'Product Engineer & Solutions Architect indépendant',
      org: 'STYLEICON (mon propre studio)',
      place: 'Poznań',
      text: 'Conception, développement et exploitation de 10+ systèmes en production pour des entreprises polonaises et européennes, concédés sous licence aux clients (21 dépôts, environ 1 560 commits en 2026) ; depuis août 2026 via SIMBIA sp. z o.o.',
    },
    {
      role: 'Développeur web & designer freelance',
      org: 'Indépendant (sous le nom STYLEICON à partir de 2025)',
      place: 'Poznań',
      text: 'Sites web et boutiques en ligne pour de petites entreprises, conçus et développés seul sous WordPress et Elementor, en parallèle de la gestion des entreprises ci-dessous : Black Point (un barbier avec réservation en ligne), Architect Vision (un studio d’architecture intérieure), Hair Hub (un salon de coiffure), Alibia (une boutique en ligne) et d’autres ; à partir de 2025 sous la marque STYLEICON, avec identité visuelle et vidéo (13 sites sur sunlucki.pl).',
    },
    {
      role: 'Design System Engineer (mission)',
      org: 'spin.clinic',
      text: 'Construction du design system de production et du kit UI motion (11K lignes, 41 exports, utilisés dans 56 fichiers produit) avec 9 agents de code en parallèle et un agent QA en environ 14,5 heures.',
    },
    {
      role: 'Tech Lead (pro bono)',
      org: 'Fundacja Novus Ignis',
      text: 'Refonte de l’architecture et développement du MVP d’une plateforme de délibération vérifiable : Next.js 16, passkeys, un arbre de Merkle ancré avec OpenTimestamps et un pipeline d’ingestion LLM ; 29 ADR, 58 tests.',
    },
    {
      role: 'Responsable marketing & chef d’équipe ; associé et président du directoire',
      org: 'Black Point Group sp. z o.o.',
      place: 'Poznań',
      text: 'Management d’une équipe de 6 personnes et des opérations marketing : campagnes, stratégie de marque, production de contenu et de vidéo, communication client.',
    },
    {
      role: 'Copropriétaire',
      org: 'Black Point Barbershop',
      place: 'Poznań',
      text: 'Cofondation et gestion d’un barbier et hub créatif : identité visuelle, site web avec réservation en ligne, réseaux sociaux et vidéo.',
    },
    {
      role: 'Développeur web',
      org: 'GreenView',
      text: 'Des sites web de l’UX/UI au déploiement sous WordPress : intégrations responsive, tests d’utilisabilité, travail en direct avec les clients et les équipes marketing.',
    },
  ],
  skillTags: {
    'ai-sdlc': 'SDLC assisté par IA',
    llm: 'LLM en production',
    architecture: 'Architecture',
    ts: 'TypeScript',
    node: 'Node.js',
    pg: 'PostgreSQL',
    react: 'React',
    swift: 'Swift / iOS',
    cicd: 'CI/CD & tests',
    security: 'Sécurité',
    payments: 'Paiements & facturation électronique',
  },
  projects: [
    {
      name: 'SIMBIA CRM',
      status: 'En production · fait tourner mon entreprise',
      text: 'CRM commercial avec comptabilité complète en partie double pour une société à responsabilité limitée polonaise : facturation électronique KSeF 2.0, open banking PSD2, génération de leads à partir des registres et une app compagnon SwiftUI.',
      metrics: ['~110K lignes de TypeScript', '~240 endpoints REST', '57 tables PostgreSQL', '269 tests'],
      points: [
        'Invariants comptables imposés au sein de PostgreSQL : triggers de contrainte différés, journaux immuables, numérotation sans trous ; 8 déclarations XML aux administrations validées par rapport aux schémas XSD officiels.',
        'Mises à jour en temps réel de PostgreSQL LISTEN/NOTIFY vers les Server-Sent Events avec filtrage par rôle ; synchronisation IMAP IDLE qui place les réponses des clients sur la timeline du lead en environ 4 secondes.',
        'Déploiements zero-touch avec rollback automatique conditionné aux health checks ; sauvegardes externalisées quotidiennes avec vérifications de restauration automatisées chaque semaine.',
        'Construit par des agents de code orchestrés, avec des spécifications écrites et des audits multi-agents contradictoires : 127 constats, 84 confirmés et corrigés.',
      ],
    },
    {
      name: 'Plateforme e-commerce B2B',
      status: 'En production · sous licence pour Mind Logistic',
      text: 'Plateforme de vente en gros qui a remplacé en production la boutique WooCommerce d’un client : comptes entreprise avec plafonds de dépenses et circuits de validation, grilles tarifaires contractuelles, RFQ et devis, crédit commercial avec balance âgée et relances.',
      metrics: ['~140K lignes de TypeScript', '339 endpoints REST', '66 modèles de données', '700+ tests'],
      points: [
        'Registre d’adaptateurs de paiement pour 7 passerelles (Stripe, PayU, Przelewy24, Tpay, Autopay, Paynow, Revolut) avec une authentification propre à chaque passerelle et la vérification des webhooks signés.',
        'Moteur de canaux marketplace (Allegro, Shopify, WooCommerce, Shoper, Empik, Erli) : file de jobs, backoff exponentiel, réconciliation nocturne, identifiants chiffrés en AES-256-GCM.',
        'Migration des clients, commandes et produits en production depuis WooCommerce, avec mise à niveau transparente des anciens hashs de mots de passe vers bcrypt.',
      ],
    },
    {
      name: 'PROTECTDENT',
      status: 'En production · plateforme client, sous licence',
      text: 'E-commerce européen en 23 langues pour les consommables de dispositifs médicaux, avec un pipeline LLM de qualification des leads pour les ventes B2B.',
      metrics: ['23 langues', '600+ tests', '7 800+ comptes B2B qualifiés'],
      points: [
        'Le pipeline LLM de qualification des leads et la chaîne de repli sur 4 modèles avec un assistant de vision (voir Systèmes d’IA en production).',
        'Paiement Stripe, TVA via VIES et facturation électronique KSeF ; gestion des bounces et des plaintes Amazon SES via SNS avec vérification de signature ; CI/CD avec déploiements contrôlés par health checks ; un plan go-to-market européen sur 90 jours (373 points de prix dans 9 pays).',
      ],
    },
    {
      name: 'iApply Workforce',
      status: 'Démo en production',
      text: 'Gestion du temps, des présences et des créneaux pour les agences d’intérim : une app web et une app SwiftUI native.',
      points: [
        'Pointage anti-fraude avec QR codes à expiration, géorepérage et NFC (Web NFC, lecteurs HID, CoreNFC).',
        'App SwiftUI avec son propre client Socket.IO v4, widgets, Live Activities et notifications push APNs envoyées en HTTP/2 directement depuis Node.',
        'Calculs du temps de niveau paie, en arithmétique décimale avec règles d’arrondi.',
      ],
    },
    {
      name: 'TAXI BOSS',
      status: 'En production',
      text: 'Gestion de flotte pour les flottes partenaires d’Uber et de Bolt, avec une app chauffeur SwiftUI native.',
      points: [
        'Uber Vehicle Suppliers API : client credentials OAuth2, buckets de rate limit par endpoint, mise en cache des tokens, synchronisation planifiée.',
        'App chauffeur avec un client API basé sur des actors, un rafraîchissement de token single-flight et une file d’envoi hors ligne (outbox).',
        'Fichiers sur AWS S3 (AWS SDK v3, URL présignées) ; un cycle de remédiation de sécurité, 95 tests d’intégration sur un vrai PostgreSQL et une CI/CD mise en place de zéro.',
      ],
    },
    {
      name: 'Design system spin.clinic',
      status: 'En ligne · mission',
      text: 'Design system et kit UI motion pour spin.clinic (Next.js 14, Framer Motion) : 11K lignes, 41 exports, utilisés dans 56 fichiers produit.',
      points: [
        'Construit par 9 agents de code en parallèle et un agent QA (git worktrees, contrats figés, carte de propriété des fichiers) en environ 14,5 heures, sans aucun conflit de merge.',
        'Morphing FLIP de la carte au plein écran intégré à l’History API, tokens de motion à ressort pilotés par la vélocité du geste, prise en charge complète du clavier et du mode reduced-motion.',
      ],
    },
  ],
  alsoBuilt:
    'Aussi : CashFlow (conseiller financier iOS : SwiftUI, Fastify, Claude avec sorties structurées), AiBizBox (SaaS d’IA documentaire avec masquage des PII), XyliMelts (boutique D2C avec un hero en React Three Fiber et la CI/CD la plus mature), Novus Ignis (MVP de délibération vérifiable).',
  skills: [
    {
      group: 'IA et SDLC',
      items: [
        'SDLC assisté par IA',
        'Codage agentique',
        'Orchestration multi-agents',
        'Claude Code',
        'GitHub Copilot',
        'OpenAI Codex',
        'MCP',
        'Intégration de LLM',
        'Sorties structurées',
        'Mise en cache des prompts',
        'IA documentaire / OCR',
        'Pipelines LLM',
        'Prompt engineering',
      ],
    },
    {
      group: 'Architecture',
      items: [
        'Architecture de solutions',
        'Conception de systèmes',
        'Modules de domaine',
        'Machines à états',
        'Architecture événementielle (LISTEN/NOTIFY, SSE, files d’attente)',
        'Architecture d’intégration (OAuth2, webhooks signés, idempotence)',
        'Architecture de sécurité',
        'ADR',
      ],
    },
    {
      group: 'Ingénierie',
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
      group: 'Livraison et exploitation',
      items: [
        'CI/CD (GitHub Actions)',
        'Tests automatisés (Vitest, XCTest)',
        'Docker',
        'Linux (nginx, PM2, systemd)',
        'AWS : S3, SES, SNS (SDK v3, URL présignées, webhooks à signature vérifiée)',
        'Sauvegardes et reprise après sinistre',
        'Sentry',
      ],
    },
    {
      group: 'Domaines',
      items: [
        'CRM',
        'E-commerce B2B',
        'Paiements (Stripe, PayU, Przelewy24)',
        'Facturation électronique (KSeF 2.0)',
        'Comptabilité',
        'Tech RH',
        'Gestion de flotte',
      ],
    },
  ],
  education: [{ degree: 'BSc', field: 'Informatique, spécialisation : informatique graphique' }],
};

export default fr;

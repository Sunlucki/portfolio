import type { CvText } from './types.ts';

// Polish
const pl: CvText = {
  meta: {
    title: 'Bogdan Nenadović · CV · Product Engineer & Solutions Architect',
    description:
      'Bogdan Nenadović, product engineer i solutions architect z Poznania: 10+ systemów produkcyjnych w 2026 roku jako jedyny architekt, SDLC wspierany przez AI z Claude Code i Codex.',
  },
  ui: {
    cv: 'Curriculum vitae',
    updated: 'Zaktualizowano {date}',
    nav: {
      summary: 'Podsumowanie',
      delivery: 'Jak pracuję',
      experience: 'Doświadczenie',
      projects: 'Projekty',
      fit: 'Dopasowanie do roli',
      skills: 'Umiejętności',
    },
    subs: {
      delivery: 'SDLC wspierany przez AI krok po kroku, każdy etap z dowodem',
      experience: 'Od pierwszej roli aż do dziś',
      projects: 'Systemy produkcyjne, które zaprojektowałem i zbudowałem; filmy promocyjne pokazują je w działaniu',
      fit: 'Solutions Architect · SDLC wspierany przez AI: czego wymaga rola i co to potwierdza',
      skills: 'Technologie i praktyki, z którymi pracuję',
    },
    builtIn2026: 'Zbudowane w 2026 roku',
    howIDeliver: 'Jak pracuję',
    beforeEngineering: 'Przed inżynierią',
    tools: 'Narzędzia',
    aiSystem: 'System AI na produkcji',
    present: 'obecnie',
    oneMonth: '1 miesiąc',
    howBuilt: 'Jak to zbudowano',
    showEvidence: 'Pokaż dowody',
    whatShowsIt: 'Co to potwierdza',
    openAll: 'Rozwiń wszystko',
    closeAll: 'Zwiń wszystko',
    filterLabel: 'Pokaż projekty, w których użyto danej umiejętności',
    filterNote: 'Projekty z {skill}: {n} z {total}. Stuknij ponownie, aby pokazać wszystkie.',
    download: 'Pobierz PDF',
    ats: 'Jednokolumnowy PDF dla systemów ATS',
    openToWork: 'Otwarty na pracę',
    toolsCount: '{n} narzędzi',
    education: 'Wykształcenie',
    languages: 'Języki',
    portraitAlt: 'Bogdan Nenadović: portret',
    alsoAs: 'To CV jest też dostępne jako {txt}, {json} i {pdf}',
    plainText: 'zwykły tekst',
    jsonResume: 'JSON Resume',
    onePdf: 'jednokolumnowy PDF',
    site: 'Strona główna',
    language: 'Język',
    sections: 'Sekcje',
    projectScreens: '{name}: ekrany',
    promoPoster: '{name}: kadr z filmu promocyjnego',
    play: 'Odtwórz film promocyjny {name}',
    projectsLink: 'Wszystkie projekty na stronie głównej',
    folders: { llm: 'LLM w produktach', integrations: 'Integracje i bezpieczeństwo', frontend: 'Frontend i mobile', backend: 'Backend i dane' },
  },
  headline: 'Product Engineer & Solutions Architect',
  focus: 'SDLC wspierany przez AI · programowanie agentowe · platformy CRM, e-commerce i fintech',
  location: 'Poznań, Polska (CET)',
  terms: 'Praca zdalna z domu · na miejscu podczas kluczowych wydarzeń firmy · B2B przez moją własną firmę, SIMBIA sp. z o.o.',
  languages: [
    ['Angielski', 'C2'],
    ['Polski', 'C2'],
    ['Ukraiński', 'ojczysty'],
    ['Rosyjski', 'ojczysty'],
  ],
  summary: {
    lead: 'Projektuję, buduję i utrzymuję produkty programistyczne od A do Z, a cały cykl życia oprogramowania prowadzę za pośrednictwem agentów AI.',
    builtIntro: 'W 2026 roku byłem jedynym architektem 10+ systemów produkcyjnych dla firm z Polski i UE',
    built: [
      'CRM z księgowością w systemie podwójnego zapisu i e-fakturowaniem w KSeF, na którym działa moja własna firma',
      'platforma e-commerce B2B z 7 bramkami płatności i 6 integracjami z marketplace’ami',
      'sklep dla rynku UE w 23 językach z pipeline’em LLM do kwalifikacji leadów',
      'platforma do zarządzania pracownikami dla agencji zatrudnienia oraz system zarządzania flotą dla partnerów flotowych Uber i Bolt, oba z natywnymi aplikacjami iOS',
    ],
    delivery:
      'Mój proces opiera się na specyfikacjach i agentach: spisane specyfikacje, równolegle pracujący agenci kodujący z zamrożonymi kontraktami, testy automatyczne, adwersarialne przeglądy wieloagentowe oraz, na głównych platformach, CI/CD z automatycznym rollbackiem warunkowanym health checkami.',
    background:
      'Zanim zająłem się inżynierią na pełen etat, byłem współwłaścicielem firm i zarządzałem zespołem 6 osób, dlatego wyjaśniam architekturę w kategoriach kosztów, ryzyka i wartości biznesowej.',
  },
  numbers: [
    { value: '10+', label: 'systemów produkcyjnych wdrożonych w 2026 roku jako jedyny architekt' },
    { value: '94%', label: 'moich commitów z 2026 roku współtworzonych z Claude' },
    { value: '84 z 127', label: 'ustaleń audytu potwierdzonych przez agentów-sceptyków, a następnie naprawionych' },
    { value: '10', label: 'agentów równolegle (9 kodujących, 1 QA): design system o 11K linii w ~14,5 h' },
    { value: '700+', label: 'testów automatycznych na największej platformie (339 endpointów REST)' },
    { value: '23', label: 'języki interfejsu na jednej platformie dla UE' },
  ],
  sdlc: [
    {
      title: 'Specyfikacja',
      text: 'Wymagania stają się spisanymi specyfikacjami, według których pracują agenci: MASTER_PROMPT, CLAUDE.md i AGENTS.md, pakiety skilli, fazy z Definition of Done. Decyzje architektoniczne są zapisywane jako ADR (29 w jednym MVP).',
    },
    {
      title: 'Orkiestracja',
      text: 'Agenci kodujący pracują równolegle w git worktrees w oparciu o zamrożone kontrakty i mapę własności plików, z promptami handoff między modelami. W ten sposób 9 agentów i agent QA zbudowało design system spin.clinic: 11K linii w około 14,5 godziny, bez konfliktów merge.',
    },
    {
      title: 'Testy',
      text: 'Agenci piszą i uruchamiają testy: Vitest, node:test, supertest na prawdziwym PostgreSQL, testy kontraktowe z golden fixtures współdzielonymi przez API w TypeScript i aplikację w Swift, XCTest. 700+, 600+ i 269 testów na trzech największych platformach.',
    },
    {
      title: 'Przegląd i walidacja',
      text: 'Adwersarialne audyty wieloagentowe: agent-sceptyk potwierdza lub odrzuca każde ustalenie, odtwarzając je, a tylko potwierdzone są naprawiane i utrwalane testem regresyjnym (84 z 127 potwierdzonych w SIMBIA CRM, 20 z 52 w AiBizBox); przegląd księgowości przeprowadzono jako audyt wieloagentowy z udziałem 28 agentów i 750 wywołań narzędzi.',
    },
    {
      title: 'Wdrożenie',
      text: 'Na głównych platformach (SIMBIA CRM, PROTECTDENT, XyliMelts): GitHub Actions z kontenerami usług PostgreSQL i Redis, backup bazy danych przed każdym wdrożeniem, migracje, automatyczny rollback warunkowany health checkami i smoke testy.',
    },
    {
      title: 'Utrzymanie',
      text: 'Codzienne backupy off-site z cotygodniowymi automatycznymi testami odtwarzania (SIMBIA CRM), Sentry, endpointy health i alerty. Incydenty kończą się postmortemem: gdy awaria synchronizacji wymazała kopię roboczą, kod odtworzono z logów sesji agentów i zweryfikowano z produkcją.',
    },
  ],
  tools:
    'Claude Code (główne narzędzie, w komercyjnych projektach klientów; w VS Code i CLI) · GitHub Copilot (VS Code) · OpenAI Codex · Cursor (wypróbowany, wolę VS Code) · serwery MCP (automatyzacja przeglądarki Chrome, iOS Simulator, Figma, Spline) · API LLM: Claude, OpenAI, Gemini, Groq, NVIDIA NIM',
  aiSystems: [
    'Pipeline LLM do kwalifikacji leadów (PROTECTDENT): wyszukiwanie oparte na mapach, crawling stron, scoring od 0 do 100 oparty na dowodach i klasyfikacja intencji odpowiedzi na 8 intencji; 7 800+ zakwalifikowanych kont B2B.',
    'Routing LLM między wieloma dostawcami: łańcuch fallbacku z 4 modelami, z twardymi timeoutami, limitami, cache’owaniem i logiem wywołań; asystent wizyjny, który dopasowuje zdjęcie sprzętu stomatologicznego do kompatybilnych produktów.',
    'AI do dokumentów: OCR, następnie wizyjny LLM, ekstrakcja pól i weryfikacja przez człowieka, z maskowaniem danych osobowych przed każdym wywołaniem LLM (AiBizBox, SIMBIA).',
    'Funkcje Claude z ustrukturyzowanymi odpowiedziami walidowanymi przez Zod, prompt caching i atomowe limity na użytkownika (CashFlow); pipeline ingestu LLM, który odrzuca cytaty niebędące dosłownymi (Novus Ignis).',
  ],
  fit: [
    {
      ask: 'Architektura systemów i aplikacji',
      evidence:
        'Jedyny architekt 10+ systemów produkcyjnych: moduły domenowe bez I/O, maszyny stanów (zamówienia mające od 20 do 24 stanów), niezmienniki egzekwowane w triggerach PostgreSQL, strumienie zdarzeń (LISTEN/NOTIFY do SSE), kolejki z blokadami typu lease i circuit breakerami, rejestr adapterów płatności, 29 ADR w jednym MVP.',
    },
    {
      ask: 'SDLC wspierany przez AI: rozwój, testowanie, CI/CD',
      evidence:
        'Moje projekty z 2026 roku powstały w ten sposób, od spisanych specyfikacji po przetestowane wydania; główne platformy są wdrażane przez CI/CD z health checkami i automatycznym rollbackiem. Około 94% moich commitów z 2026 roku jest współtworzonych z Claude.',
    },
    {
      ask: 'Programowanie agentowe i autonomiczna inżynieria oprogramowania',
      evidence:
        'Orkiestracja zadań między równoległymi agentami (worktrees, zamrożone kontrakty, mapy własności), bramki jakości (testy, Definition of Done), walidacja przez agentów-sceptyków, którzy muszą odtworzyć każde ustalenie, decyzje zapisywane jako ADR.',
    },
    {
      ask: 'Systemy AI: workflowy AI, jedno- i wieloagentowe',
      evidence:
        'Workflowy AI na produkcji: pipeline’y LLM do kwalifikacji leadów, klasyfikacji intencji odpowiedzi i AI do dokumentów z weryfikacją przez człowieka, z routingiem między wieloma dostawcami; systemy wieloagentowe: system audytu wieloagentowego (28 agentów, 750 wywołań narzędzi) i równolegli agenci kodujący w samej pracy inżynierskiej.',
    },
    {
      ask: 'Wybory infrastrukturalne: bezpieczeństwo, koszty, wydajność, skalowalność',
      evidence:
        'Samodzielnie zarządzana infrastruktura Linux dla 20+ projektów na 4+ serwerach (nginx, PM2, systemd, TLS, Docker) z backupami i testami odtwarzania; integracje z AWS: object storage S3 z presigned URL-ami (TAXI BOSS), Amazon SES z webhookami bounce i complaint przez SNS, z weryfikacją podpisu (PROTECTDENT); technologia dobierana do danych i kosztów, np. wyszukiwanie trigramowe w PostgreSQL wybrane zamiast pgvector (wyszukiwanie wektorowe/semantyczne) dla katalogu z 500 pozycjami (CashFlow); bezpieczeństwo wbudowane w projekt: passkeys i WebAuthn, argon2id, CSP i HSTS, rate limity, webhooki podpisane HMAC, podpisane URL-e, maskowanie PII, RODO.',
    },
    {
      ask: 'Wartość biznesowa i interesariusze',
      evidence:
        'Współzałożyciel i członek zarządu firmy programistycznej, która licencjonuje swoje platformy; platforma e-commerce B2B obsługuje na produkcji sklepy trzech firm (Mind Logistic, PROTECTDENT, XyliMelts); wcześniej współwłaściciel firmy, którą prowadziłem z zespołem 6 osób; 90-dniowy plan go-to-market w UE z badaniem cen w 9 krajach.',
    },
    {
      ask: 'Komunikacja z odbiorcami technicznymi i nietechnicznymi',
      evidence:
        'Dla inżynierów: specyfikacje, ADR, runbooki i raporty z audytów z dowodami wskazującymi plik i linię. Dla kupujących i właścicieli: oferty, ściągi dla sprzedawców, scenariusze demo minuta po minucie i proste tabele: co system robi, co jest w drodze i czego nie obiecywać.',
    },
    {
      ask: 'Przywództwo',
      evidence:
        'Zarządzałem zespołem 6 osób w Black Point (współwłaściciel od 2020 roku; Prezes Zarządu Black Point Group sp. z o.o., 2022–2025); współzałożyciel i Członek Zarządu SIMBIA sp. z o.o. (2026); tech lead pro bono MVP fundacji (2026).',
    },
  ],
  experience: [
    {
      role: 'Współzałożyciel, Członek Zarządu i Solutions Architect',
      org: 'SIMBIA sp. z o.o.',
      place: 'Poznań · zdalnie',
      text: 'Firma programistyczna, która buduje i licencjonuje platformy wertykalne: CRM, zarządzanie pracownikami, zarządzanie flotą i e-commerce B2B. Odpowiadam za architekturę i proces dostarczania wspierany przez AI. Firma prowadzi sprzedaż i księgowość ustawową w naszym własnym CRM.',
    },
    {
      role: 'Niezależny Product Engineer i Solutions Architect',
      org: 'STYLEICON (własne studio)',
      place: 'Poznań',
      text: 'Zaprojektowałem, zbudowałem i utrzymuję 10+ systemów produkcyjnych dla firm z Polski i UE, licencjonowanych klientom (21 repozytoriów, około 1 560 commitów w 2026 roku); od sierpnia 2026 roku przez SIMBIA sp. z o.o.',
    },
    {
      role: 'Web developer i projektant (freelance)',
      org: 'Własna działalność (od 2025 roku jako STYLEICON)',
      place: 'Poznań',
      text: 'Strony i sklepy internetowe dla małych firm, samodzielnie zaprojektowane i zbudowane na WordPressie i Elementorze, równolegle z prowadzeniem firm opisanych niżej: Black Point (barbershop z rezerwacjami online), Architect Vision (studio projektowania wnętrz), Hair Hub (salon fryzjerski), Alibia (sklep internetowy) i inne; od 2025 roku pod marką STYLEICON, z brandingiem i wideo (13 stron na sunlucki.pl).',
    },
    {
      role: 'Design System Engineer (kontrakt)',
      org: 'spin.clinic',
      text: 'Zbudowałem produkcyjny design system i motion UI kit (11K linii, 41 eksportów, używany w 56 plikach produktu) z 9 równoległymi agentami kodującymi i agentem QA w około 14,5 godziny.',
    },
    {
      role: 'Tech Lead (pro bono)',
      org: 'Fundacja Novus Ignis',
      text: 'Przeprojektowałem architekturę i zbudowałem MVP platformy weryfikowalnej deliberacji: Next.js 16, passkeys, drzewo Merkle’a zakotwiczone przez OpenTimestamps i pipeline ingestu LLM; 29 ADR, 58 testów.',
    },
    {
      role: 'Lider marketingu i zespołu; wspólnik i Prezes Zarządu',
      org: 'Black Point Group sp. z o.o.',
      place: 'Poznań',
      text: 'Zarządzałem zespołem 6 osób i działaniami marketingowymi: kampanie, strategia marki, produkcja treści i wideo, komunikacja z klientami.',
    },
    {
      role: 'Współwłaściciel',
      org: 'Black Point Barbershop',
      place: 'Poznań',
      text: 'Współzałożyłem i prowadziłem barbershop i kreatywny hub: identyfikacja wizualna, strona z rezerwacjami online, social media i wideo.',
    },
    {
      role: 'Web Developer',
      org: 'GreenView',
      text: 'Strony internetowe od UX/UI po wdrożenie na WordPressie: responsywne realizacje, testy użyteczności, bezpośrednia współpraca z klientami i zespołami marketingu.',
    },
  ],
  skillTags: {
    'ai-sdlc': 'SDLC wspierany przez AI',
    llm: 'LLM na produkcji',
    architecture: 'Architektura',
    ts: 'TypeScript',
    node: 'Node.js',
    pg: 'PostgreSQL',
    react: 'React',
    swift: 'Swift / iOS',
    cicd: 'CI/CD i testy',
    security: 'Bezpieczeństwo',
    payments: 'Płatności i e-faktury',
  },
  projects: [
    {
      name: 'SIMBIA CRM',
      status: 'Produkcja · działa na nim moja firma',
      text: 'CRM sprzedażowy z pełną księgowością w systemie podwójnego zapisu dla polskiej spółki z o.o.: e-fakturowanie w KSeF 2.0, open banking PSD2, generowanie leadów na podstawie rejestrów i aplikacja towarzysząca w SwiftUI.',
      metrics: ['~110K linii TypeScript', '~240 endpointów REST', '57 tabel PostgreSQL', '269 testów'],
      points: [
        'Niezmienniki księgowe egzekwowane wewnątrz PostgreSQL: odroczone triggery ograniczeń, niezmienialne dzienniki, numeracja bez luk; 8 urzędowych deklaracji XML walidowanych względem oficjalnych schematów XSD.',
        'Aktualizacje w czasie rzeczywistym z PostgreSQL LISTEN/NOTIFY do Server-Sent Events z filtrowaniem według roli; synchronizacja IMAP IDLE, która umieszcza odpowiedzi klientów na osi czasu leada w około 4 sekundy.',
        'Wdrożenia zero-touch z automatycznym rollbackiem warunkowanym health checkami; codzienne backupy off-site z cotygodniowymi automatycznymi testami odtwarzania.',
        'Zbudowany przez orkiestrowanych agentów kodujących na podstawie spisanych specyfikacji, z adwersarialnymi audytami wieloagentowymi: 127 ustaleń, 84 potwierdzone i naprawione.',
      ],
    },
    {
      name: 'Platforma e-commerce B2B',
      status: 'Produkcja · na licencji dla Mind Logistic',
      text: 'Platforma hurtowa, która zastąpiła na produkcji sklep klienta na WooCommerce: konta firmowe z limitami wydatków i ścieżkami akceptacji, cenniki kontraktowe, RFQ i oferty, kredyt kupiecki z wiekowaniem należności i monitami.',
      metrics: ['~140K linii TypeScript', '339 endpointów REST', '66 modeli danych', '700+ testów'],
      points: [
        'Rejestr adapterów płatności dla 7 bramek (Stripe, PayU, Przelewy24, Tpay, Autopay, Paynow, Revolut) z uwierzytelnianiem specyficznym dla każdej bramki i weryfikacją podpisanych webhooków.',
        'Silnik kanałów marketplace (Allegro, Shopify, WooCommerce, Shoper, Empik, Erli): kolejka zadań, exponential backoff, nocne uzgadnianie danych, dane uwierzytelniające szyfrowane AES-256-GCM.',
        'Przeniosłem działające dane klientów, zamówień i produktów z WooCommerce, w niewidoczny dla użytkowników sposób aktualizując stare hashe haseł do bcrypt.',
      ],
    },
    {
      name: 'PROTECTDENT',
      status: 'Produkcja · platforma klienta, na licencji',
      text: 'Sklep e-commerce dla UE w 23 językach z materiałami eksploatacyjnymi do wyrobów medycznych, z pipeline’em LLM do kwalifikacji leadów w sprzedaży B2B.',
      metrics: ['23 języki', '600+ testów', '7 800+ zakwalifikowanych kont B2B'],
      points: [
        'Pipeline LLM do kwalifikacji leadów i łańcuch fallbacku z 4 modelami z asystentem wizyjnym (zob. systemy AI na produkcji).',
        'Checkout Stripe, VAT na podstawie VIES i e-fakturowanie w KSeF; obsługa bounce’ów i skarg w Amazon SES przez SNS z weryfikacją podpisu; CI/CD z wdrożeniami sprawdzanymi health checkami; 90-dniowy plan go-to-market w UE (373 punkty cenowe w 9 krajach).',
      ],
    },
    {
      name: 'iApply Workforce',
      status: 'Demo produkcyjne',
      text: 'Rejestracja czasu pracy i obecności oraz zarządzanie zmianami dla agencji zatrudnienia: aplikacja webowa i natywna aplikacja w SwiftUI.',
      points: [
        'Check-in odporny na nadużycia z wygasającymi kodami QR, geofencingiem i NFC (Web NFC, czytniki HID, CoreNFC).',
        'Aplikacja SwiftUI z własnym klientem Socket.IO v4, widżetami, Live Activities i powiadomieniami push APNs wysyłanymi przez HTTP/2 bezpośrednio z Node.',
        'Obliczenia czasu pracy o dokładności wymaganej w płacach, z arytmetyką dziesiętną i regułami zaokrągleń.',
      ],
    },
    {
      name: 'TAXI BOSS',
      status: 'Produkcja',
      text: 'Zarządzanie flotą dla partnerów flotowych Uber i Bolt, z natywną aplikacją kierowcy w SwiftUI.',
      points: [
        'Uber Vehicle Suppliers API: OAuth2 client credentials, osobne limity zapytań dla każdego endpointu, cache’owanie tokenów, synchronizacja według harmonogramu.',
        'Aplikacja kierowcy z klientem API opartym na aktorach, odświeżaniem tokenu w trybie single-flight i kolejką offline typu outbox.',
        'Pliki w AWS S3 (AWS SDK v3, presigned URL-e); cykl naprawy bezpieczeństwa, 95 testów integracyjnych na prawdziwym PostgreSQL i CI/CD od zera.',
      ],
    },
    {
      name: 'Design system spin.clinic',
      status: 'Online · kontrakt',
      text: 'Design system i motion UI kit dla spin.clinic (Next.js 14, Framer Motion): 11K linii, 41 eksportów, używany w 56 plikach produktu.',
      points: [
        'Zbudowany przez 9 równoległych agentów kodujących i agenta QA (git worktrees, zamrożone kontrakty, mapa własności plików) w około 14,5 godziny, bez konfliktów merge.',
        'Morphing FLIP z karty do pełnego ekranu z integracją History API, sprężynowe tokeny ruchu sterowane prędkością gestu, pełna obsługa klawiatury i trybu reduced motion.',
      ],
    },
  ],
  alsoBuilt:
    'Ponadto: CashFlow (doradca finansowy na iOS: SwiftUI, Fastify, Claude z ustrukturyzowanymi odpowiedziami), AiBizBox (SaaS AI do dokumentów z maskowaniem PII), XyliMelts (sklep D2C z sekcją hero w React Three Fiber i najbardziej dojrzałym CI/CD), Novus Ignis (MVP weryfikowalnej deliberacji).',
  skills: [
    {
      group: 'AI i SDLC',
      items: [
        'SDLC wspierany przez AI',
        'Programowanie agentowe',
        'Orkiestracja wielu agentów',
        'Claude Code',
        'GitHub Copilot',
        'OpenAI Codex',
        'MCP',
        'Integracja LLM',
        'Ustrukturyzowane odpowiedzi',
        'Prompt caching',
        'AI do dokumentów / OCR',
        'Pipeline’y LLM',
        'Prompt engineering',
      ],
    },
    {
      group: 'Architektura',
      items: [
        'Architektura rozwiązań',
        'Projektowanie systemów',
        'Moduły domenowe',
        'Maszyny stanów',
        'Architektura sterowana zdarzeniami (LISTEN/NOTIFY, SSE, kolejki)',
        'Architektura integracji (OAuth2, podpisane webhooki, idempotencja)',
        'Architektura bezpieczeństwa',
        'ADR',
      ],
    },
    {
      group: 'Inżynieria',
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
      group: 'Dostarczanie i utrzymanie',
      items: [
        'CI/CD (GitHub Actions)',
        'Testy automatyczne (Vitest, XCTest)',
        'Docker',
        'Linux (nginx, PM2, systemd)',
        'AWS: S3, SES, SNS (SDK v3, presigned URL-e, webhooki z weryfikacją podpisu)',
        'Backupy i disaster recovery',
        'Sentry',
      ],
    },
    {
      group: 'Domeny',
      items: [
        'CRM',
        'E-commerce B2B',
        'Płatności (Stripe, PayU, Przelewy24)',
        'E-faktury (KSeF 2.0)',
        'Księgowość',
        'HR tech',
        'Zarządzanie flotą',
      ],
    },
  ],
  education: [{ degree: 'Studia I stopnia', field: 'Informatyka, specjalność: grafika komputerowa' }],
};

export default pl;

// The site's words in Italian: a translation of ./en.ts, key for key.
import type { Copy } from './en.ts';

const it: Copy = {
  meta: {
    title: 'Bogdan Nenadović · Full-Stack Design Engineer',
    description:
      'Bogdan Nenadović, full-stack design engineer a Poznań, in Polonia. Progetto, sviluppo e lancio prodotti completi: React, Node.js, PostgreSQL, SwiftUI e 3D.',
    ogDescription: 'Progetto, sviluppo e lancio prodotti completi: interfacce, backend, infrastruttura e app iOS native.',
  },
  language: 'Lingua',
  name: 'Bogdan Nenadović',
  role: 'Full-Stack Design Engineer',
  location: 'Poznań, Polonia',
  nav: { main: 'Principale', about: 'Chi sono', services: 'Servizi', projects: 'Progetti', contact: 'Contatti' },
  hero: {
    label: 'Introduzione',
    hello: 'CIAO, SONO',
    name: 'BOGDAN',
    heading: 'Ciao, sono {name}, {role}',
    tagline: 'un full-stack design engineer che progetta, sviluppa e lancia prodotti completi',
    scroll: 'Scorri',
  },
  buttons: { contact: 'Contattami', email: 'Scrivimi', live: 'Progetto live', close: 'Chiudi', play: 'Riproduci', pause: 'Pausa' },
  manifesto: {
    label: 'Manifesto',
    phrases: [
      'Viviamo in un universo pieno di *possibilità*.',
      'Su un pianeta di *sogni*, la nostra +casa+ comune!',
      'I nostri ^cuori^ battono in ogni angolo del mondo.',
      'E nel profondo, i nostri ^cuori^ sono ^scaldati dai sogni^.',
      'Alcuni di quei sogni diventano *idee*.',
      'E cerchiamo un modo per renderle *reali*.',
      'Uso un *computer* per dare vita ai sogni.',
      'Dentro ci ho messo il mio\n*strumento\u00a0più\u00a0evoluto*.',
      'E l’ho collegato all’*AI*.',
      'Per trasformare\n*i sogni in realtà*.',
    ],
  },
  about: {
    title: 'Chi sono',
    portraitAlt: 'Bogdan Nenadović, ritratto dal basso in felpa con cappuccio',
    hello: 'Ciao, mi chiamo Bogdan Nenadović, ma online mi conoscono come',
    hint: 'Perché?',
    close: 'Capito',
    text: 'Da otto anni aiuto le persone a dare vita alle loro idee e ai loro sogni. Design, video e marketing mi hanno insegnato come devono essere i prodotti: belli da vedere, piacevoli da usare e capaci di vendere. Oggi li costruisco da cima a fondo: interfacce, backend, infrastruttura e app iOS native, con un approccio AI-native e verifiche rigorose. Creiamo insieme qualcosa che funzioni alla perfezione e abbia un look indimenticabile.',
    story: {
      question: 'Perché SUNLUCKI?',
      text: 'Il mio nickname unisce la nostra stella, il *Sole*, che ci dona luce, calore e vita, e la *fortuna*, che arriva solo a chi prova a trasformare i propri sogni in realtà.',
      philosophy: 'Ecco tutta la mia filosofia: devozione al cosmo, e alla fortuna.',
    },
  },
  numbers: {
    title: 'Ecco i numeri',
    caption: 'A tutti piacciono i grandi numeri… e io ce li ho.',
    code: 'righe di codice in produzione',
    views: 'visualizzazioni su YouTube, TikTok e Instagram',
    hours: 'ore di lavoro dal 2016',
    projects: 'progetti realizzati',
    designs: 'lavori di grafica',
    videos: 'video prodotti',
    tracks: 'brani prodotti',
    apps: 'app native per Apple',
    companies: 'aziende fondate',
  },
  stack: {
    title: 'Stack',
    intro: 'Tutti gli strumenti con cui lavoro, ordinati in cartelle.',
    hover: 'Passa il mouse su una cartella per aprirla. Puoi trascinare le note dove vuoi.',
    tap: 'Tocca una cartella per aprirla.',
    swipe: 'Scorri: si apre la cartella al centro.',
    tools: '{n} strumenti',
  },
  services: {
    title: 'Servizi',
    list: [
      {
        name: 'Product Engineering',
        description:
          'Prodotti web end-to-end in TypeScript, React, Node.js e PostgreSQL, con modello dati, API, deploy e backup inclusi. MVP e SaaS costruiti per resistere in produzione.',
      },
      {
        name: 'Design Engineering',
        description:
          'Design system, motion e interfacce curate nei minimi dettagli: componenti accessibili, animazioni a molla e Three.js / WebGL quando la storia richiede profondità.',
      },
      {
        name: 'Integrazione AI',
        description:
          'Funzionalità LLM con guardrail (output strutturati, AI per i documenti e assistenti), realizzate in modo AI-native con specifiche, test e revisioni avversariali a ogni modifica.',
      },
      {
        name: 'Pagamenti e fatturazione elettronica',
        description:
          'Stripe, PayU, Przelewy24, marketplace e il KSeF 2.0 polacco: integrazioni finanziarie progettate per essere corrette, idempotenti e a prova di audit.',
      },
      {
        name: 'iOS nativo',
        description: 'App in SwiftUI con widget, Live Activities, sincronizzazione offline e notifiche push, collegate allo stesso backend del tuo prodotto web.',
      },
      {
        name: 'Brand e motion design',
        description: 'Identità visiva, packaging e video assistiti dall’AI. Chi crea il tuo brand può anche realizzare il tuo prodotto.',
      },
    ],
  },
  projects: {
    title: 'Progetti web',
    caseStudy: 'Case study su richiesta',
    demo: '{name}: demo del prodotto',
    sites: 'Siti',
    scenarios: 'Scenari',
    crm: {
      category: 'Prodotto proprietario · SIMBIA CRM',
      name: 'Sistema CRM e contabilità',
      description:
        'CRM per le vendite con contabilità completa in partita doppia, fatturazione elettronica KSeF e open banking. Tutta la mia azienda gira su questo sistema.',
      alts: ['Bacheca kanban di SIMBIA CRM', 'Panoramica finanziaria di SIMBIA CRM', 'Dashboard di SIMBIA CRM'],
      chapters: ['Dashboard', 'Lead scoring', 'Priorità', 'Kanban', 'Offerta', 'Follow-up', 'Fattura e KSeF', 'Mobile'],
    },
    b2b: {
      category: 'E-shop dei clienti · Mind Logistic, PROTECTDENT, XyliMelts',
      name: 'Piattaforma e-commerce B2B / B2C',
      description:
        'Un unico motore e-commerce dietro tre negozi online attivi: ingrosso B2B con approvazione delle aziende, credito commerciale, 7 gateway di pagamento e 6 canali marketplace, e vetrine B2C che parlano fino a 23 lingue.',
      alts: ['Sezione sul target del portale all’ingrosso', 'Numeri chiave della piattaforma all’ingrosso', 'Landing page della piattaforma all’ingrosso'],
      chapters: ['Registrazione', 'Approvazione', 'Negozio', 'Il tuo prezzo', 'Ordine rapido', 'Credito commerciale', 'Spedizione', 'Canali di vendita'],
    },
    hr: {
      category: 'Prodotto proprietario · iApply',
      name: 'Sistema di gestione del personale',
      description:
        'Gestione di turni e presenze per agenzie interinali: timbratura con QR, GPS e NFC, un pannello in tempo reale per i coordinatori e un’app iOS nativa.',
      alts: ['Centro timbrature QR di iApply', 'Pianificazione dei turni in iApply', 'Calendario settimanale di iApply'],
      chapters: ['Inizio', 'Timbratura QR', 'Mercato turni', 'Calendario', 'Attività', 'Straordinari', 'Assenze', 'NFC'],
    },
    taxi: {
      category: 'Cliente · TAXI BOSS',
      name: 'Sistema di gestione flotte',
      description:
        'Piattaforma per flotte partner di Uber e Bolt: funnel di reclutamento autisti, contratti con firma elettronica, sincronizzazione con le API di Uber e un’app per autisti in SwiftUI.',
      alts: ['Vetrina 3D dei veicoli di TAXI BOSS', 'Dashboard dell’autista di TAXI BOSS', 'Landing page di TAXI BOSS'],
      chapters: ['Candidato', 'Registrazione', 'Documenti', 'Contratto', 'Auto', 'Flotta', 'App autista'],
    },
    wordpress: {
      category: 'Siti per clienti · WordPress ed Elementor',
      name: 'Siti WordPress',
      description:
        'Siti progettati e sviluppati su WordPress per piccole imprese: una pasticceria, una barberia con prenotazione online, un’azienda di traslochi in Canada, una scuola di medicina, una tipografia, un parrucchiere, un brand di streetwear e diversi e-shop.',
      alts: ['Sito della pasticceria KREEM su un portatile', 'Sito della barberia Black Point su un portatile', 'Sito di Lizard Moving su un tablet'],
      // each site's frames, in order
      slides: {
        'Lizard Moving': ['Demo del sito mobile di Lizard Moving', 'Sito di Lizard Moving su un tablet', 'Home page di Lizard Moving'],
        'Magic Patron': ['Demo del sito mobile di Magic Patron', 'E-shop di Magic Patron su uno smartphone', 'Home page di Magic Patron', 'Pagina prodotto di Magic Patron'],
        Alibia: ['Demo dello shop mobile di Alibia', 'E-shop di Alibia su un portatile', 'Home page di Alibia', 'Pagina del negozio di Alibia'],
        KREEM: ['Sito della pasticceria KREEM su un portatile', 'Home page di KREEM', 'Pagina delle torte di KREEM'],
        'Black Point': ['Sito della barberia Black Point su un portatile', 'Listino prezzi di Black Point su un portatile', 'Home page di Black Point'],
        'Nami Clean': ['Sito dell’impresa di pulizie Nami Clean su un portatile', 'Home page di Nami Clean'],
        Casada: ['Sito delle poltrone Casada su un portatile', 'Home page di Casada', 'Pagina prodotto di Casada'],
        'ARAB 30': ['Negozio streetwear di ARAB 30 su uno smartphone', 'Home page di ARAB 30', 'Pagina del negozio di ARAB 30', 'Pagina prodotto di ARAB 30'],
        'Architect Vision': ['Sito dello studio di interior design Architect Vision su un portatile', 'Home page di Architect Vision'],
        Enveloper: ['Home page di Enveloper', 'Categorie del negozio di Enveloper'],
        Medicus: ['Home page della scuola di medicina Medicus'],
        'Hair Hub': ['Home page del salone Hair Hub'],
        Fencing: ['Home page degli arbitri di scherma'],
      },
    },
  },
  apps: {
    title: 'App mobili',
    caption:
      'App native in SwiftUI accanto alle piattaforme web: timbratura con QR, GPS e NFC per le agenzie interinali, un’app per gli autisti di una flotta di taxi e un consulente privato per le finanze personali.',
    drag: 'Trascina le schede',
    previous: 'App precedente',
    next: 'App successiva',
    iapply: {
      tagline: 'Timbrature e turni per agenzie interinali',
      screens: [
        { caption: 'In servizio', alt: 'Home del lavoratore in iApply: in servizio con il timer del turno in corso, il pulsante per timbrare l’uscita, disponibilità, prossimo turno e ore del mese' },
        { caption: 'QR della sede', alt: 'QR code del coordinatore iApply per timbrare in una sede, con la scadenza e le opzioni di validità' },
        { caption: 'Mercato dei turni', alt: 'Mercato dei turni di iApply: turni aperti con posti liberi, iscrizione alla reperibilità e pulsanti per prenotare un turno' },
        { caption: 'Pannello del coordinatore', alt: 'Dashboard del coordinatore in iApply: presenze in tempo reale, turni di oggi, una richiesta da approvare e le attività' },
      ],
    },
    taxi: {
      tagline: 'L’app per gli autisti di una flotta di taxi',
      screens: [
        { caption: 'Dashboard', alt: 'Dashboard dell’autista in TAXI BOSS: guadagni della settimana, corse, totale del mese, valutazione e l’auto a noleggio' },
        { caption: 'Guadagni', alt: 'Guadagni in TAXI BOSS: totali settimanali e un grafico a barre giorno per giorno' },
        { caption: 'Documenti', alt: 'Documenti in TAXI BOSS: i certificati richiesti, approvati, ognuno con un pulsante per sostituirlo' },
        { caption: 'Calendario', alt: 'Calendario di TAXI BOSS: il mese con giorni lavorativi, giorni liberi e periodi di noleggio' },
      ],
    },
    cashflow: {
      tagline: 'Un consulente privato per le finanze personali',
      screens: [
        { caption: 'Panoramica', alt: 'Panoramica di CashFlow: entrate, uscite e impegni del mese, quanto avanza e spese per categoria' },
        { caption: 'Piano di rientro', alt: 'Piano di rientro dai debiti in CashFlow: i debiti con le strategie a palla di neve e a valanga e la data di estinzione' },
        { caption: 'Spese per categoria', alt: 'Spese per categoria in CashFlow: un grafico ad anello con la quota di ogni categoria' },
        { caption: 'Debiti e risparmi', alt: 'Situazione di debiti e risparmi in CashFlow, con l’anello dell’obiettivo di risparmio e una scheda con un’analisi dell’AI' },
      ],
    },
  },
  graphics: {
    title: 'Grafica',
    tiles: [
      'Poster per la serie di eventi HYPE',
      'Poster musicale per Ihor Poperechny',
      'Logo di DC Consulting',
      'Branding di Touch Coffee',
      'Biglietti da visita di Da Vinci Tattoo',
      'T-shirt Black Point con la stampa Ant Might',
      'Social media della barberia Black Point',
      'Branding di Adaya',
      'Branding di Soul Nation Tattoo',
      'Strimat, trasporto passeggeri',
      'Branding di Profi Dokument',
      'Branding di Zero Śladu',
      'Biglietti da visita di Yana Lashes',
      'Branding di Stories Beauty',
      'T-shirt Black Point',
      'Biglietti da visita per un centro di epilazione laser',
      'Volantino PROTECTDENT',
      'Logo di Alibia',
      'Branding di Time Relax Body',
      'Social media del ristorante Na Serio Na Żarty',
      'Biglietto da visita per Ihor Poperechny',
    ],
  },
  video: {
    title: 'Video',
    views: '{n} visualizzazioni',
    viewsOn: '{n}+ visualizzazioni su {platform}',
    play: 'Riproduci {title}',
    // the credits under the films that are words, not names
    credits: {
      'AI film': 'Film AI',
      'Episode 1': 'Episodio 1',
      'ARAB · co-director': 'ARAB · co-regista',
      'Filming and editing': 'Riprese e montaggio',
      'SUNLUCKI production': 'Produzione SUNLUCKI',
    },
  },
  music: {
    title: 'Musica',
    nowPlaying: 'In riproduzione',
    previous: 'Brano precedente',
    next: 'Brano successivo',
    seek: 'Avanzamento',
    playlist: 'Playlist',
  },
  contact: {
    title: 'Parliamone',
    sceneAlt: 'Bogdan Nenadović che fluttua sopra un iPhone luminoso',
    pitch: 'Aperto a ruoli da remoto in product e design engineering e a contratti B2B. Con base a {location}, lavoro con team in tutta Europa e negli Stati Uniti.',
    b2b: 'Contratti B2B tramite SIMBIA sp. z o.o.',
    // the credits in the footer, around the names and links
    credits: {
      models: 'Modelli 3D con licenza',
      by: 'di',
      recoloured: 'ricolorato',
      and: 'e',
      particles: 'trasformati in particelle',
      earth: 'La Terra di notte: NASA Black Marble.',
      bits: 'Micro Slats, Tech Text e Folder Float da',
      quotes: ['«', '»'],
    },
  },
};

export default it;

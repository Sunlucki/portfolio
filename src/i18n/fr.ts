// The site's words in French: a translation of ./en.ts, key for key.
import type { Copy } from './en.ts';

const fr: Copy = {
  meta: {
    title: 'Bogdan Nenadović · Full-Stack Design Engineer',
    description:
      'Bogdan Nenadović, full-stack design engineer à Poznań, Pologne. Je conçois, développe et livre des produits complets : React, Node.js, PostgreSQL, SwiftUI, 3D.',
    ogDescription: 'Je conçois, développe et livre des produits complets : interfaces, back-ends, infrastructure et apps iOS natives.',
  },
  language: 'Langue',
  name: 'Bogdan Nenadović',
  role: 'Full-Stack Design Engineer',
  location: 'Poznań, Pologne',
  nav: { main: 'Menu principal', about: 'À propos', services: 'Services', projects: 'Projets', contact: 'Contact' },
  hero: {
    label: 'Introduction',
    hello: 'SALUT, JE SUIS',
    name: 'BOGDAN',
    heading: 'Salut, je suis {name}, {role}',
    tagline: 'un full-stack design engineer qui conçoit, développe et livre des produits complets',
    scroll: 'Défiler',
    swipe: 'défiler',
  },
  buttons: { contact: 'Me contacter', email: 'Écrivez-moi', live: 'Voir en ligne', close: 'Fermer', play: 'Lire', pause: 'Pause' },
  manifesto: {
    label: 'Manifeste',
    phrases: [
      'Nous vivons dans l’univers des *possibles*.',
      'Sur la planète *bleue*, notre +foyer+ commun\u00a0!',
      'Nos ^cœurs^ battent aux quatre coins du monde.',
      'Et au fond ^naissent les rêves^.',
      'Certains deviennent des *idées*.',
      'Et nous cherchons comment les *concrétiser*.',
      'Pour cela, j’utilise un *ordinateur*.',
      'J’y ai placé mon\n*outil le plus avancé*.',
      'Et je l’ai relié à l’*IA*.',
      'Pour que\n*les rêves se réalisent*.',
    ],
  },
  about: {
    title: 'À propos',
    portraitAlt: 'Bogdan Nenadović en sweat à capuche, portrait en contre-plongée',
    hello: 'Bonjour, je m’appelle Bogdan Nenadović, mais en ligne on me connaît sous le nom de',
    hint: 'Pourquoi ?',
    close: 'Compris',
    text: 'Depuis huit ans, j’aide les gens à donner vie à leurs idées et à leurs rêves. Le design, la vidéo et le marketing m’ont appris comment les produits doivent se présenter, se vivre et se vendre. Aujourd’hui, je les construis de bout en bout : interfaces, back-ends, infrastructure et apps iOS natives, le tout livré en mode AI-native avec une vérification rigoureuse. Construisons ensemble quelque chose qui fonctionne à la perfection et qui marque les esprits.',
    story: {
      question: 'Pourquoi SUNLUCKI ?',
      text: 'Mon pseudo réunit notre étoile, le *Soleil*, qui nous donne la lumière, la chaleur et la vie, et la *chance*, qui ne sourit qu’à ceux qui tentent de réaliser leurs rêves.',
      philosophy: 'Voilà toute ma philosophie : la dévotion au cosmos, et à la chance.',
    },
  },
  numbers: {
    title: 'Place aux chiffres',
    caption: 'Tout le monde aime les gros chiffres… ça tombe bien, j’en ai.',
    code: 'lignes de code livrées',
    views: 'vues sur YouTube, TikTok et Instagram',
    hours: 'heures de travail depuis 2016',
    projects: 'projets réalisés',
    designs: 'créations graphiques',
    videos: 'vidéos produites',
    tracks: 'morceaux produits',
    apps: 'apps Apple natives',
    companies: 'entreprises fondées',
  },
  stack: {
    title: 'Stack',
    intro: 'Tout ce que j’utilise en production, rangé par dossiers.',
    hover: 'Survolez un dossier pour l’ouvrir. Vous pouvez faire glisser les notes.',
    tap: 'Touchez un dossier pour l’ouvrir.',
    swipe: 'Balayez : le dossier du milieu s’ouvre.',
    tools: '{n} outils',
  },
  services: {
    title: 'Services',
    list: [
      {
        name: 'Ingénierie produit',
        description:
          'Des produits web de bout en bout avec TypeScript, React, Node.js et PostgreSQL, modèle de données, API, déploiements et sauvegardes compris. Des MVP et des SaaS taillés pour tenir le choc en production.',
      },
      {
        name: 'Design engineering',
        description:
          'Design systems, motion design et interfaces ciselées : composants accessibles, animations à ressort et Three.js / WebGL quand l’histoire demande de la profondeur.',
      },
      {
        name: 'Intégration IA',
        description:
          'Des fonctionnalités LLM encadrées par des garde-fous (sorties structurées, IA documentaire et assistants), livrées en mode AI-native avec spécifications, tests et revues contradictoires à chaque modification.',
      },
      {
        name: 'Paiements & facturation électronique',
        description:
          'Stripe, PayU, Przelewy24, marketplaces et le KSeF 2.0 polonais : des intégrations financières conçues pour être exactes, idempotentes et auditables.',
      },
      {
        name: 'iOS natif',
        description:
          'Des apps SwiftUI avec widgets, Live Activities, synchronisation hors ligne et notifications push, reliées au même back-end que votre produit web.',
      },
      {
        name: 'Marque & motion design',
        description: 'Identité visuelle, packaging et vidéo assistée par IA. Celui qui conçoit votre marque peut aussi livrer votre produit.',
      },
    ],
  },
  projects: {
    title: 'Projets web',
    caseStudy: 'Étude de cas sur demande',
    demo: '{name} : démo produit',
    sites: 'Sites',
    scenarios: 'Scénarios',
    crm: {
      category: 'Produit maison · SIMBIA CRM',
      name: 'Système CRM & comptable',
      description:
        'CRM commercial avec comptabilité complète en partie double, facturation électronique KSeF et open banking. Ma propre entreprise tourne dessus.',
      alts: ['Tableau kanban de SIMBIA CRM', 'Vue financière de SIMBIA CRM', 'Tableau de bord de SIMBIA CRM'],
      chapters: ['Tableau de bord', 'Scoring des leads', 'Priorités', 'Kanban', 'Offre', 'Relance', 'Facture & KSeF', 'Mobile'],
    },
    b2b: {
      category: 'Boutiques clients · Mind Logistic, PROTECTDENT, XyliMelts',
      name: 'Plateforme e-commerce B2B / B2C',
      description:
        'Un seul moteur e-commerce derrière trois boutiques en ligne : vente en gros B2B avec validation des entreprises, crédit commercial, 7 passerelles de paiement et 6 canaux marketplace, et des vitrines B2C qui parlent jusqu’à 23 langues.',
      alts: [
        'Section audience du portail de vente en gros',
        'Chiffres clés de la plateforme de vente en gros',
        'Page d’accueil de la plateforme de vente en gros',
      ],
      chapters: ['Inscription', 'Validation', 'Boutique', 'Votre prix', 'Commande rapide', 'Crédit commercial', 'Livraison', 'Canaux de vente'],
    },
    hr: {
      category: 'Produit maison · iApply',
      name: 'Système de gestion des effectifs',
      description:
        'Suivi des créneaux et des heures pour les agences d’intérim : pointage par QR, GPS et NFC, tableau de bord coordinateur en temps réel et app iOS native.',
      alts: ['Centre de pointage QR d’iApply', 'Planification des créneaux dans iApply', 'Planning hebdomadaire d’iApply'],
      chapters: ['Démarrage', 'Pointage QR', 'Bourse aux créneaux', 'Planning', 'Tâches', 'Heures supplémentaires', 'Absences', 'NFC'],
    },
    taxi: {
      category: 'Client · TAXI BOSS',
      name: 'Système de gestion de flotte',
      description:
        'Plateforme de flotte pour les partenaires Uber et Bolt : tunnel de recrutement des chauffeurs, contrats signés électroniquement, synchronisation avec l’API Uber et app chauffeur en SwiftUI.',
      alts: ['Vitrine 3D des véhicules TAXI BOSS', 'Tableau de bord chauffeur TAXI BOSS', 'Page d’accueil de TAXI BOSS'],
      chapters: ['Candidat', 'Inscription', 'Documents', 'Contrat', 'Voiture', 'Flotte', 'App chauffeur'],
    },
    wordpress: {
      category: 'Sites clients · WordPress & Elementor',
      name: 'Sites WordPress',
      description:
        'Des sites conçus et développés sous WordPress pour de petites entreprises : une pâtisserie, un barbier avec réservation en ligne, une entreprise de déménagement au Canada, une école de médecine, une imprimerie, un salon de coiffure, une marque de streetwear et des boutiques en ligne.',
      alts: [
        'Site de la pâtisserie KREEM sur un ordinateur portable',
        'Site du barbier Black Point sur un ordinateur portable',
        'Site de Lizard Moving sur une tablette',
      ],
      // each site's frames, in order
      slides: {
        'Lizard Moving': ['Démo du site mobile de Lizard Moving', 'Site de Lizard Moving sur une tablette', 'Page d’accueil de Lizard Moving'],
        'Magic Patron': [
          'Démo du site mobile de Magic Patron',
          'Boutique en ligne Magic Patron sur un téléphone',
          'Page d’accueil de Magic Patron',
          'Page produit de Magic Patron',
        ],
        Alibia: ['Démo de la boutique mobile Alibia', 'Boutique en ligne Alibia sur un ordinateur portable', 'Page d’accueil d’Alibia', 'Page boutique d’Alibia'],
        KREEM: ['Site de la pâtisserie KREEM sur un ordinateur portable', 'Page d’accueil de KREEM', 'Page des gâteaux de KREEM'],
        'Black Point': [
          'Site du barbier Black Point sur un ordinateur portable',
          'Tarifs de Black Point sur un ordinateur portable',
          'Page d’accueil de Black Point',
        ],
        'Nami Clean': ['Site du service de nettoyage Nami Clean sur un ordinateur portable', 'Page d’accueil de Nami Clean'],
        Casada: ['Site des fauteuils Casada sur un ordinateur portable', 'Page d’accueil de Casada', 'Page produit de Casada'],
        'ARAB 30': ['Boutique streetwear ARAB 30 sur un téléphone', 'Page d’accueil d’ARAB 30', 'Page boutique d’ARAB 30', 'Page produit d’ARAB 30'],
        'Architect Vision': [
          'Site du studio d’architecture intérieure Architect Vision sur un ordinateur portable',
          'Page d’accueil d’Architect Vision',
        ],
        Enveloper: ['Page d’accueil d’Enveloper', 'Catégories de la boutique Enveloper'],
        Medicus: ['Page d’accueil de l’école de médecine Medicus'],
        'Hair Hub': ['Page d’accueil du salon Hair Hub'],
        Fencing: ['Page d’accueil de Fencing, le site des arbitres d’escrime'],
      },
    },
  },
  apps: {
    title: 'Apps mobiles',
    caption:
      'Des apps SwiftUI natives aux côtés des plateformes web : pointage par QR, GPS et NFC pour les agences d’intérim, une app chauffeur pour une flotte de taxis et un conseiller privé pour vos finances personnelles.',
    drag: 'Faites glisser les cartes',
    previous: 'App précédente',
    next: 'App suivante',
    iapply: {
      tagline: 'Pointage et créneaux pour les agences d’intérim',
      screens: [
        {
          caption: 'En service',
          alt: 'Accueil intérimaire iApply : en service avec le chrono du créneau en cours, pointage de sortie, disponibilités, prochain créneau et heures du mois',
        },
        { caption: 'QR code du site', alt: 'QR code coordinateur iApply pour pointer sur un site, avec son expiration et ses options de validité' },
        {
          caption: 'Bourse aux créneaux',
          alt: 'Bourse aux créneaux iApply : créneaux ouverts avec places libres, inscription d’astreinte et boutons pour réserver',
        },
        {
          caption: 'Tableau coordinateur',
          alt: 'Tableau de bord coordinateur iApply : présences en direct, créneaux du jour, une demande à valider et des tâches',
        },
      ],
    },
    taxi: {
      tagline: 'L’app chauffeur d’une flotte de taxis',
      screens: [
        {
          caption: 'Tableau de bord',
          alt: 'Tableau de bord chauffeur TAXI BOSS : gains de la semaine, courses, total du mois, note et voiture louée',
        },
        { caption: 'Gains', alt: 'Gains TAXI BOSS : totaux hebdomadaires et graphique en barres par jour' },
        { caption: 'Documents', alt: 'Documents TAXI BOSS : les certificats requis, validés, chacun avec un bouton pour le remplacer' },
        { caption: 'Planning', alt: 'Planning TAXI BOSS : calendrier du mois avec jours travaillés, jours de repos et périodes de location' },
      ],
    },
    cashflow: {
      tagline: 'Un conseiller privé pour vos finances personnelles',
      screens: [
        {
          caption: 'Vue d’ensemble',
          alt: 'Vue d’ensemble CashFlow : revenus, dépenses et engagements du mois, reste à vivre et dépenses par catégorie',
        },
        {
          caption: 'Plan de remboursement',
          alt: 'Plan de remboursement CashFlow : dettes avec les stratégies boule de neige et avalanche, et date de désendettement',
        },
        { caption: 'Dépenses par catégorie', alt: 'Dépenses par catégorie CashFlow : graphique en anneau avec la part de chaque catégorie' },
        { caption: 'Dettes et épargne', alt: 'État des dettes et de l’épargne CashFlow, avec un anneau d’objectif d’épargne et une carte d’analyse IA' },
      ],
    },
  },
  graphics: {
    title: 'Graphisme',
    tiles: [
      'Affiches de la série d’événements HYPE',
      'Affiche musicale pour Ihor Poperechny',
      'Logo DC Consulting',
      'Identité visuelle Touch Coffee',
      'Cartes de visite Da Vinci Tattoo',
      'T-shirt Black Point avec l’imprimé Ant Might',
      'Réseaux sociaux du barbier Black Point',
      'Identité visuelle Adaya',
      'Identité visuelle Soul Nation Tattoo',
      'Strimat, transport de voyageurs',
      'Identité visuelle Profi Dokument',
      'Identité visuelle Zero Śladu',
      'Cartes de visite Yana Lashes',
      'Identité visuelle Stories Beauty',
      'T-shirt Black Point',
      'Cartes de visite pour l’épilation laser',
      'Flyer Profi Dokument',
      'Logo Alibia',
      'Identité visuelle Time Relax Body',
      'Réseaux sociaux du restaurant Na Serio Na Żarty',
      'Carte de visite pour Ihor Poperechny',
    ],
    open: 'Ouvrir le projet\u00a0: {name}',
    client: 'Client',
    problem: 'Problème',
    solution: 'Solution',
    projects: {
      hype: { name: 'HYPE', kind: 'Affiches d’événements', client: '', problem: '', solution: '' },
      ihor: { name: 'Ihor Poperechny', kind: 'Affiche musicale et cartes de visite', client: '', problem: '', solution: '' },
      'dc-consulting': { name: 'DC Consulting', kind: 'Logo, pochette et bon cadeau', client: '', problem: '', solution: '' },
      'touch-coffee': { name: 'Touch Coffee', kind: 'Branding', client: '', problem: '', solution: '' },
      'da-vinci': { name: 'Da Vinci Tattoo', kind: 'Cartes de visite, flyer et guide de soin', client: '', problem: '', solution: '' },
      'black-point': { name: 'Black Point', kind: 'Barbershop\u00a0: branding, merch, réseaux, site', client: '', problem: '', solution: '' },
      adaya: { name: 'Adaya', kind: 'Branding', client: '', problem: '', solution: '' },
      'soul-nation': { name: 'Soul Nation Tattoo', kind: 'Branding', client: '', problem: '', solution: '' },
      strimat: { name: 'Strimat', kind: 'Transport de passagers', client: '', problem: '', solution: '' },
      'profi-dokument': { name: 'Profi Dokument', kind: 'Branding, cartes de visite et flyers', client: '', problem: '', solution: '' },
      'zero-sladu': { name: 'Zero Śladu', kind: 'Branding', client: '', problem: '', solution: '' },
      'yana-lashes': { name: 'Yana Lashes', kind: 'Cartes de visite', client: '', problem: '', solution: '' },
      'stories-beauty': { name: 'Stories Beauty', kind: 'Branding', client: '', problem: '', solution: '' },
      depilacja: { name: 'Depilacja', kind: 'Cartes de visite d’épilation laser', client: '', problem: '', solution: '' },
      alibia: { name: 'Alibia', kind: 'Logo, flyer, campagne et boutique en ligne', client: '', problem: '', solution: '' },
      'time-relax-body': { name: 'Time Relax Body', kind: 'Branding', client: '', problem: '', solution: '' },
      'na-serio-na-zarty': { name: 'Na Serio Na Żarty', kind: 'Réseaux sociaux d’un restaurant', client: '', problem: '', solution: '' },
    },
  },
  video: {
    title: 'Vidéo',
    views: '{n} vues',
    viewsOn: '{n}+ vues sur {platform}',
    play: 'Lire {title}',
    tap: 'Touchez pour lire les vidéos',
    swipe: 'Balayez vers le haut pour la suivante',
    // the credits under the films that are words, not names
    credits: {
      'AI film': 'Film IA',
      'Episode 1': 'Épisode 1',
      'ARAB · co-director': 'ARAB · coréalisateur',
      'Filming and editing': 'Tournage et montage',
      'SUNLUCKI production': 'Une production SUNLUCKI',
    },
  },
  music: {
    title: 'Musique',
    nowPlaying: 'En cours de lecture',
    previous: 'Morceau précédent',
    next: 'Morceau suivant',
    seek: 'Position de lecture',
    playlist: 'Playlist',
    all: 'Tout afficher',
    fewer: 'Afficher moins',
  },
  contact: {
    title: 'Parlons-en',
    sceneAlt: 'Bogdan Nenadović flottant au-dessus d’un iPhone lumineux',
    pitch: 'Ouvert aux postes produit et design engineering en télétravail, ainsi qu’aux contrats B2B. Basé à {location}, je travaille avec des équipes dans toute l’Europe et aux États-Unis.',
    b2b: 'Contrats B2B via SIMBIA sp. z o.o.',
    // the credits in the footer, around the names and links
    credits: {
      models: 'Modèles 3D sous licence',
      by: 'par',
      recoloured: 'recoloré',
      and: 'et',
      particles: 'transformés en particules',
      earth: 'La Terre la nuit : NASA Black Marble.',
      bits: 'Micro Slats, Tech Text et Folder Float viennent de',
      quotes: ['« ', ' »'],
    },
  },
  egg: {
    slow: 'Pas si vite, faisons plus ample connaissance. Ça ne prend que 5 minutes 😊 Fais défiler doucement et profite.',
    together: 'Hé, j’ai mis tout mon cœur dans cette aventure, vivons-la ensemble\u00a0!',
    name: 'Je m’appelle Bogdan et je suis full-stack engineer.',
    back: 'D’accord, j’irai doucement',
  },
  cat: {
    ask: 'Hé, tu n’as pas vu mon chat\u00a0?',
    no: 'Pas vu',
    yes: 'Vu',
    bye: 'D’accord, à bientôt\u00a0!',
    found: 'Voici mon chat, il s’appelle Messi.',
  },
};

export default fr;

// Every word on the page, in English, the language the site is written in. The other languages (./ru.ts and the
// rest) are translations of these, key for key. {braces} are filled in by the page; in the manifesto's phrases
// *marked* words are highlighted, ^marked^ ones red and beating with the heart and +marked+ ones green, and a line
// break starts a new line (content.ts).
const en = {
  meta: {
    title: 'Bogdan Nenadović · Full-Stack Design Engineer',
    description:
      'Bogdan Nenadović, full-stack design engineer in Poznań, Poland. I design, build and ship complete products: React, Node.js, PostgreSQL, SwiftUI and 3D. 10+ production systems shipped in 2026.',
    ogDescription: 'I design, build and ship complete products: interfaces, backends, infrastructure and native iOS apps.',
  },
  language: 'Language',
  name: 'Bogdan Nenadović',
  role: 'Full-Stack Design Engineer',
  location: 'Poznań, Poland',
  nav: { main: 'Main', about: 'About', services: 'Services', projects: 'Projects', contact: 'Contact' },
  hero: {
    label: 'Intro',
    hello: 'HI, I’M',
    name: 'BOGDAN',
    heading: 'Hi, I’m {name}, {role}',
    tagline: 'a full-stack design engineer who designs, builds and ships complete products',
    scroll: 'Scroll',
  },
  buttons: { contact: 'Contact Me', email: 'Email me', live: 'Live Project', close: 'Close', play: 'Play', pause: 'Pause' },
  manifesto: {
    label: 'Manifesto',
    phrases: [
      'We live in a universe full of *possibilities*.',
      'On a planet of *dreams*, our shared +home+!',
      'Our ^hearts^ beat in every corner of the world.',
      'And inside, our ^hearts^ are ^warmed by dreams^.',
      'Some of those dreams become *ideas*.',
      'And we look for a way to make them *real*.',
      'I use a *computer* to bring dreams to life.',
      'I’ve put my most\n*advanced tool* inside it.',
      'And connected it to *AI*.',
      'To make\n*dreams come true*.',
    ],
  },
  about: {
    title: 'About me',
    portraitAlt: 'Bogdan Nenadović, a low-angle portrait in a hoodie',
    hello: 'Hi, my name is Bogdan Nenadović, but online I’m known as',
    hint: 'Why?',
    close: 'Got it',
    text: 'For eight years I’ve been helping people bring their ideas and dreams to life. Design, video and marketing taught me how products should look, feel and sell. Now I build them end to end: interfaces, backends, infrastructure and native iOS apps, shipped AI-native with rigorous verification. Let’s build something that works flawlessly and looks unforgettable.',
    story: {
      question: 'Why SUNLUCKI?',
      text: 'My handle brings together our star, the *Sun*, which gives us light, warmth and life, and *luck*, which only comes to those who try to make their dreams real.',
      philosophy: 'That is my whole philosophy: devotion to the cosmos, and to luck.',
    },
  },
  numbers: {
    title: 'Here are the numbers',
    caption: 'Everyone loves big numbers… and I’ve got them.',
    code: 'lines of code shipped',
    views: 'views on YouTube, TikTok and Instagram',
    hours: 'hours of work since 2016',
    projects: 'projects delivered',
    designs: 'graphic designs',
    videos: 'videos produced',
    tracks: 'tracks produced',
    apps: 'native Apple apps',
    companies: 'companies founded',
  },
  stack: {
    title: 'Stack',
    intro: 'Everything I ship with, sorted into folders.',
    hover: 'Hover a folder to open it. The notes can be dragged around.',
    tap: 'Tap a folder to open it.',
    swipe: 'Swipe: the folder in the middle opens.',
    tools: '{n} tools',
  },
  services: {
    title: 'Services',
    list: [
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
        description: 'SwiftUI apps with widgets, Live Activities, offline sync and push, connected to the same backend as your web product.',
      },
      {
        name: 'Brand & Motion',
        description: 'Identity, packaging and AI-assisted video. The person designing your brand can also ship your product.',
      },
    ],
  },
  projects: {
    title: 'Web Projects',
    caseStudy: 'Case study on request',
    demo: '{name}: product demo',
    sites: 'Sites',
    scenarios: 'Scenarios',
    crm: {
      category: 'Own product · SIMBIA CRM',
      name: 'CRM & Accounting System',
      description: 'Sales CRM with full double-entry accounting, KSeF e-invoicing and open banking. My own company runs on it.',
      alts: ['SIMBIA CRM kanban board', 'SIMBIA CRM finance overview', 'SIMBIA CRM dashboard'],
      chapters: ['Dashboard', 'Lead scoring', 'Priorities', 'Kanban', 'Offer', 'Follow-up', 'Invoice & KSeF', 'Mobile'],
    },
    b2b: {
      category: 'Client stores · Mind Logistic, PROTECTDENT, XyliMelts',
      name: 'B2B / B2C Store Platform',
      description:
        'One commerce engine behind three live stores: B2B wholesale with company approvals, trade credit, 7 payment gateways and 6 marketplace channels, and B2C storefronts in up to 23 languages.',
      alts: ['Wholesale portal audience section', 'Wholesale platform key numbers', 'Wholesale platform landing page'],
      chapters: ['Sign-up', 'Approval', 'Store', 'Your price', 'Quick order', 'Trade credit', 'Shipping', 'Sales channels'],
    },
    hr: {
      category: 'Own product · iApply',
      name: 'Workforce Management System',
      description: 'Shift and time tracking for staffing agencies: QR, GPS and NFC clock-in, a live coordinator board and a native iOS app.',
      alts: ['iApply QR check-in centre', 'iApply shift planning', 'iApply weekly schedule'],
      chapters: ['Start', 'QR check-in', 'Shift market', 'Schedule', 'Tasks', 'Overtime', 'Absence', 'NFC'],
    },
    taxi: {
      category: 'Client · TAXI BOSS',
      name: 'Fleet Management System',
      description: 'Fleet platform for Uber and Bolt partners: driver funnel, e-signed contracts, Uber API sync and a SwiftUI driver app.',
      alts: ['TAXI BOSS 3D vehicle showcase', 'TAXI BOSS driver dashboard', 'TAXI BOSS landing page'],
      chapters: ['Candidate', 'Sign-up', 'Documents', 'Contract', 'Car', 'Fleet', 'Driver app'],
    },
    wordpress: {
      category: 'Client websites · WordPress & Elementor',
      name: 'WordPress Websites',
      description:
        'Websites designed and built on WordPress for small businesses: a pâtisserie, a barbershop with online booking, a moving company in Canada, a medical school, a print shop, a hair salon, a streetwear brand and e-shops.',
      alts: ['KREEM pâtisserie website on a laptop', 'Black Point barbershop website on a laptop', 'Lizard Moving website on a tablet'],
      // each site's frames, in order
      slides: {
        'Lizard Moving': ['Lizard Moving mobile site demo', 'Lizard Moving website on a tablet', 'Lizard Moving home page'],
        'Magic Patron': ['Magic Patron mobile site demo', 'Magic Patron e-shop on a phone', 'Magic Patron home page', 'Magic Patron product page'],
        Alibia: ['Alibia mobile shop demo', 'Alibia e-shop on a laptop', 'Alibia home page', 'Alibia shop page'],
        KREEM: ['KREEM pâtisserie website on a laptop', 'KREEM home page', 'KREEM cakes page'],
        'Black Point': ['Black Point barbershop website on a laptop', 'Black Point price list on a laptop', 'Black Point home page'],
        'Nami Clean': ['Nami Clean cleaning service website on a laptop', 'Nami Clean home page'],
        Casada: ['Casada armchairs website on a laptop', 'Casada home page', 'Casada product page'],
        'ARAB 30': ['ARAB 30 streetwear shop on a phone', 'ARAB 30 home page', 'ARAB 30 shop page', 'ARAB 30 product page'],
        'Architect Vision': ['Architect Vision interior design studio website on a laptop', 'Architect Vision home page'],
        Enveloper: ['Enveloper home page', 'Enveloper shop categories'],
        Medicus: ['Medicus medical school home page'],
        'Hair Hub': ['Hair Hub salon home page'],
        Fencing: ['Fencing referees home page'],
      },
    },
  },
  apps: {
    title: 'Mobile Apps',
    caption:
      'Native SwiftUI apps beside the web platforms: clock-in by QR, GPS and NFC for staffing agencies, a driver app for a taxi fleet, and a private personal finance advisor.',
    drag: 'Drag the cards',
    previous: 'Previous app',
    next: 'Next app',
    iapply: {
      tagline: 'Clock-in and shifts for staffing agencies',
      screens: [
        { caption: 'On the clock', alt: 'iApply worker home: on the clock with a running shift timer, clock out, availability, next shift and hours this month' },
        { caption: 'Site QR code', alt: 'iApply coordinator QR code for clock-in at a site, with its expiry and validity options' },
        { caption: 'Shift market', alt: 'iApply shift market: open shifts with free places, on-call sign-up and claim buttons' },
        { caption: 'Coordinator board', alt: 'iApply coordinator dashboard: live attendance, today’s shifts, a claim to approve and tasks' },
      ],
    },
    taxi: {
      tagline: 'The driver app for a taxi fleet',
      screens: [
        { caption: 'Dashboard', alt: 'TAXI BOSS driver dashboard: weekly earnings, rides, monthly total, rating and the rented car' },
        { caption: 'Earnings', alt: 'TAXI BOSS earnings: weekly totals and a bar chart by day' },
        { caption: 'Documents', alt: 'TAXI BOSS documents: the required certificates, approved, each with a replace button' },
        { caption: 'Schedule', alt: 'TAXI BOSS schedule: a month calendar of working days, days off and rental periods' },
      ],
    },
    cashflow: {
      tagline: 'A private personal finance advisor',
      screens: [
        { caption: 'Overview', alt: 'CashFlow overview: monthly income, expenses and commitments, what is left over, and spending by category' },
        { caption: 'Debt payoff plan', alt: 'CashFlow debt payoff plan: debts with snowball and avalanche strategies and the debt-free date' },
        { caption: 'Spending by category', alt: 'CashFlow spending by category: a donut chart with each category’s share' },
        { caption: 'Debt and savings', alt: 'CashFlow debt and savings status with a savings goal ring and an AI insight card' },
      ],
    },
  },
  graphics: {
    title: 'Graphics',
    tiles: [
      'HYPE event series posters',
      'Music poster for Ihor Poperechny',
      'DC Consulting logo',
      'Touch Coffee branding',
      'Da Vinci Tattoo business cards',
      'Black Point T-shirt with the Ant Might print',
      'Black Point barbershop social media',
      'Adaya branding',
      'Soul Nation Tattoo branding',
      'Strimat passenger transport',
      'Profi Dokument branding',
      'Zero Śladu branding',
      'Yana Lashes business cards',
      'Stories Beauty branding',
      'Black Point T-shirt',
      'Laser hair removal business cards',
      'PROTECTDENT flyer',
      'Alibia logo',
      'Time Relax Body branding',
      'Na Serio Na Żarty restaurant social media',
      'Business card for Ihor Poperechny',
    ],
  },
  video: {
    title: 'Video',
    views: '{n} views',
    viewsOn: '{n}+ views on {platform}',
    play: 'Play {title}',
    tap: 'Tap to play the videos',
    swipe: 'Swipe up for the next one',
    // the credits under the films that are words, not names
    credits: {
      'AI film': 'AI film',
      'Episode 1': 'Episode 1',
      'ARAB · co-director': 'ARAB · co-director',
      'Filming and editing': 'Filming and editing',
      'SUNLUCKI production': 'SUNLUCKI production',
    } as Record<string, string>,
  },
  music: {
    title: 'Music',
    nowPlaying: 'Now playing',
    previous: 'Previous track',
    next: 'Next track',
    seek: 'Seek',
    playlist: 'Playlist',
    all: 'Show all', // phones: the playlist, all of it
    fewer: 'Show fewer',
  },
  contact: {
    title: 'Let’s talk',
    sceneAlt: 'Bogdan Nenadović floating above a glowing iPhone',
    pitch: 'Open to remote product and design-engineering roles and B2B contracts. Based in {location}, working with teams across Europe and the US.',
    b2b: 'B2B contracts via SIMBIA sp. z o.o.',
    // the credits in the footer, around the names and links
    credits: {
      models: '3D models under',
      by: 'by',
      recoloured: 'recoloured',
      and: 'and',
      particles: 'turned into particles',
      earth: 'Earth at night: NASA Black Marble.',
      bits: 'Micro Slats, Tech Text and Folder Float from',
      quotes: ['“', '”'],
    },
  },
};

export type Copy = typeof en;
export default en;

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
    swipe: 'scroll', // touch screens: the word the finger sweeps up, idle on the hero
  },
  buttons: { contact: 'Contact Me', email: 'Email me', live: 'Live Project', close: 'Close', play: 'Play', pause: 'Pause' },
  manifesto: {
    label: 'Manifesto',
    phrases: [
      'We live in a universe full of *possibilities*.',
      'On the *blue* planet, our shared +home+!',
      'Our ^hearts^ beat in every corner of the world.',
      'And inside, ^dreams are born^.',
      'Some of them become *ideas*.',
      'And we look for a way to make them *real*.',
      'A *computer* helps me with that.',
      'I’ve put my most\n*advanced tool* inside it.',
      'And connected it to *AI*.',
      'So that\n*dreams come true*.',
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
    stores: 'Stores on the platform',
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
      'Mind Logistic sticker on a laptop',
      'Elixir Panoramixa bottle in 3D',
      'Poucher can in 3D',
      'Elixir Cherry Cola gummies pouch',
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
      'Profi Dokument flyer',
      'Alibia logo',
      'Time Relax Body branding',
      'Na Serio Na Żarty restaurant social media',
      'Business card for Ihor Poperechny',
    ],
    open: 'Open the project: {name}',
    client: 'Client',
    problem: 'Problem',
    solution: 'Solution',
    // each cover's project (content.ts GRAPHICS): who it was for, what was wrong, what Bogdan did
    projects: {
      hype: { name: 'HYPE', kind: 'Event posters', client: '', problem: '', solution: '' },
      ihor: { name: 'Ihor Poperechny', kind: 'Music poster and business cards', client: '', problem: '', solution: '' },
      'dc-consulting': { name: 'DC Consulting', kind: 'Logo, folder and voucher', client: 'Notary assistance for foreigners in Poland.', problem: 'Their materials, such as the folder for documents, looked cheap and didn’t show the quality of the service: the brand didn’t feel prestigious.', solution: 'A premium folder and voucher in their colours, inspired by luxury houses like Louis Vuitton, with a pattern of their logo, to raise the value people see in the service.' },
      'touch-coffee': { name: 'Touch Coffee', kind: 'Branding', client: '', problem: '', solution: '' },
      'da-vinci': { name: 'Da Vinci Tattoo', kind: 'Business cards, flyer and aftercare guide', client: 'A tattoo studio.', problem: 'It needed a fresh identity and had no professional business cards, aftercare instructions or flyers, nor a style of its own to draw new clients.', solution: 'Five one-sided business cards styled as Tarot cards, an aftercare guide given after each session and a street flyer, all print-ready, in four days. Now in use: the cards catch the eye and the flyers bring local clients.' },
      'black-point': { name: 'Black Point', kind: 'Barbershop: branding, merch, social media, website', client: 'A barbershop at ul. Kutrzeby 16G in Poznań, made out of a former tile shop.', problem: 'An empty, ruined shop to become not just a barbershop but a hybrid creative space with its own style.', solution: 'The design and renovation (2019–2020), the opening in 2021, then its identity, hand-printed T-shirts, viral Reels and TikToks, ads on Meta and TikTok, and the website.' },
      adaya: { name: 'Adaya', kind: 'Branding', client: '', problem: '', solution: '' },
      'soul-nation': { name: 'Soul Nation Tattoo', kind: 'Branding', client: '', problem: '', solution: '' },
      strimat: { name: 'Strimat', kind: 'Passenger transport', client: '', problem: '', solution: '' },
      'profi-dokument': { name: 'Profi Dokument', kind: 'Branding, business cards and flyers', client: '', problem: '', solution: '' },
      'zero-sladu': { name: 'Zero Śladu', kind: 'Branding', client: '', problem: '', solution: '' },
      'yana-lashes': { name: 'Yana Lashes', kind: 'Business cards', client: '', problem: '', solution: '' },
      'stories-beauty': { name: 'Stories Beauty', kind: 'Branding', client: '', problem: '', solution: '' },
      depilacja: { name: 'Depilacja', kind: 'Laser hair removal business cards', client: '', problem: '', solution: '' },
      alibia: { name: 'Alibia', kind: 'Logo, flyer, campaign and online shop', client: 'Alibia, maker of the Elixir Panoramix drink.', problem: 'They wanted to sell more of their flagship drink online, but the brand was barely visible to young people.', solution: 'The HypeHop music show with a 30,000 zł prize (over 1,200 entries), green-screen videos, 3D product animations, social media and street polls; and an online shop on WooCommerce with BaseLinker, built in a week and a half, which raised online sales markedly.' },
      'time-relax-body': { name: 'Time Relax Body', kind: 'Branding', client: '', problem: '', solution: '' },
      'na-serio-na-zarty': { name: 'Na Serio Na Żarty', kind: 'Restaurant social media', client: '', problem: '', solution: '' },
      'mind-logistic': { name: 'Mind Logistic', kind: 'Logo and brand identity', client: '', problem: '', solution: '' },
      elixir: { name: 'Elixir Panoramixa', kind: 'Mind Logistic: bottle labels, renders and the bottle in 3D', client: '', problem: '', solution: '' },
      poucher: { name: 'Poucher', kind: 'Mind Logistic: caffeine pouches, the can in 3D', client: '', problem: '', solution: '' },
      'elixir-gummies': { name: 'Elixir Cherry Cola', kind: 'Mind Logistic: gummies pouch', client: '', problem: '', solution: '' },
    },
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
      'Website hero film': 'Website hero film',
      'How to use': 'How to use',
      'Promo film': 'Promo film',
      'Branding showreel': 'Branding showreel',
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
  // rushing down the page (components/SwipeEgg.tsx): the pixel me asks to go slowly, the 1st and the 2nd time; the
  // 4th, only this is left of the page, on black
  egg: {
    slow: 'Easy there, let’s get to know each other. It only takes 5 minutes 😊 Just swipe slowly and enjoy.',
    together: 'Hey, I worked hard to build this adventure for you, let’s go through it together!',
    name: 'My name is Bogdan and I’m a full-stack engineer.',
    back: 'OK, I’ll go slowly',
  },
  // the Stack's egg (components/CatEgg.tsx): the pixel me, out of the second folder, asks after his cat; the two
  // answers, then what I say to each
  cat: {
    ask: 'Hey, have you seen my cat?',
    no: 'No, I haven’t',
    yes: 'Yes, I have',
    bye: 'OK, see you around!',
    found: 'Here’s my cat, his name is Messi.',
  },
};

export type Copy = typeof en;
export default en;

// All copy and data for the page. Facts mirror ../data/profile.json in the knowledge base. The words come from
// ./i18n, in the visitor's language (English: i18n/en.ts).

import { lang, t, type Lang } from './i18n';
import graphicsSizes from './graphics.json';
import type { SceneName } from './three/miniScenes';
import prints from './prints.json';
import logoFilms from './logoFilms.json';
import musicTracks from './music.json';

export const PERSON = {
  name: 'Bogdan Nenadović',
  firstName: 'bogdan',
  role: t.role,
  // TODO: confirm the public mailbox — sunlucki.pl has no MX records yet.
  email: 'hello@sunlucki.pl',
  linkedin: 'https://www.linkedin.com/in/sunlucki',
  github: 'https://github.com/Sunlucki',
  location: t.location,
} as const;

export const NAV = [
  { label: t.nav.about, href: '#about' },
  { label: t.nav.services, href: '#services' },
  { label: t.nav.projects, href: '#projects' },
  { label: t.nav.contact, href: '#contact' },
] as const;

export const HERO_FRAMES = 83; // frames 0–82 of the eye clip (public/hero/count.txt)
export const HERO_FG_FRAMES = 25; // first frames with the background removed (subject cut-out layer)

export const HERO_TAGLINE = t.hero.tagline;

// The About text opens with his name and his handle (his words, 2026-09-30). Hovering the handle asks "Why?";
// clicking it scatters the text for its story (NAME_STORY) until "Got it" gathers it back.
export const ABOUT_HELLO = {
  text: t.about.hello,
  handle: 'SUNLUCKI',
  hint: t.about.hint,
  close: t.about.close,
};

export const ABOUT_TEXT = t.about.text;

// SUNLUCKI, Bogdan's handle, and what it stands for (his words, 2026-09-30). *Marked* words are highlighted:
// the Sun in gold, luck in violet.
export const NAME_STORY = t.about.story;

// The numbers after About, on a drum that turns with the scroll (Bogdan's picks, 2026-09-30). Checked claims:
// ../data/profile.json (stats, experience); 238 projects (counting those he did for his employers), 250+ videos,
// 1,200+ graphic designs and 139 tracks per Bogdan (2026-09-30). The hours count from 2016, when he started, at his 8 to 10 hours a day, 4 to 6
// days a week, taken at the middle (45 a week) and rounded down to the thousand. Lines of code: 611,820 on
// 2026-09-30, the source in the tips of all his repositories, only what his own git identities wrote, the code
// line PROTECTDENT, XyliMelts and Mind Logistic share counted once, vendored and generated code left out.
export const NUMBERS_TITLE = t.numbers.title;
export const NUMBERS_CAPTION = t.numbers.caption;
const HOURS = Math.floor(((Date.now() - Date.UTC(2016, 0, 1)) / (7 * 86_400_000)) * 45 / 1000) * 1000;
// Views of Bogdan's videos, by platform, in tenths of a million: YouTube's counted on 2026-09-30 (1,551,492,
// YOUTUBE_FILMS), TikTok's and Instagram's as he gives them (2026-09-30).
export const VIDEO_VIEWS = [
  { platform: 'YouTube', views: 15 },
  { platform: 'TikTok', views: 50 },
  { platform: 'Instagram', views: 25 },
] as const;
export const NUMBERS = [
  { value: 600_000, suffix: '+', label: t.numbers.code },
  { value: VIDEO_VIEWS.reduce((sum, { views }) => sum + views, 0) * 100_000, suffix: '+', label: t.numbers.views },
  { value: HOURS, suffix: '+', label: t.numbers.hours },
  { value: 238, suffix: '', label: t.numbers.projects },
  { value: 1_200, suffix: '+', label: t.numbers.designs },
  { value: 250, suffix: '+', label: t.numbers.videos },
  { value: 139, suffix: '', label: t.numbers.tracks },
  { value: 5, suffix: '', label: t.numbers.apps },
  { value: 3, suffix: '', label: t.numbers.companies },
];

// The manifesto after the hero (Bogdan's own lines of 2026-09-30, reworded without repeats at his asking, i18n/en.ts), written in particles under a
// shape each: the galaxy the camera flies to through the hero's pupil, the Earth, the Earth lit where people
// live, a heart, a brain, a bulb the hands reach for, a laptop the camera dives into, down to its chip, with a
// brain on it, then the letters AI, an eye. *Marked* words are highlighted, ~marked~ ones struck out, ^marked^
// ones (the hearts) red and beating and +marked+ ones green like the Earth's land; a line break starts a new line.
export const PHRASES = t.manifesto.phrases;
// Shapes per phrase: one each.
export const PHRASE_SHAPES = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
// Scroll from each shape to the next, in shapes: the camera flies through space to the galaxy, which gathers and
// holds its phrase a while before the camera flies into it; the brain charges up before it flies into that; the
// hands reach for the bulb before it flares; and the dive from the laptop into its chip takes half as long again
// as a plain flight.
export const SHAPE_SCROLL = [2, 1, 1, 1, 1.3, 1.6, 1.5, 1, 1];

const MARKS = { '*': 'hi', '~': 'off', '^': 'heart', '+': 'home' } as const;
export type Run = { text: string; mark: 'plain' | (typeof MARKS)[keyof typeof MARKS] };

// A phrase as runs of plain text and marked text (MARKS).
export const phraseRuns = (phrase: string): Run[] =>
  phrase
    .split(/(\*[^*]+\*|~[^~]+~|\^[^^]+\^|\+[^+]+\+)/)
    .filter(Boolean)
    .map((part) => {
      const mark = (MARKS as Record<string, Run['mark']>)[part[0]] ?? 'plain';
      return { text: mark === 'plain' ? part : part.slice(1, -1), mark };
    });

export const phraseText = (phrase: string) => phrase.replace(/[*~^+]/g, '');

// Tools in daily use, one folder each. Only what the repositories and files actually show (../data/profile.json
// → skills, and this site itself for its WebGL, motion and languages); nothing listed on the old CV without evidence.
const FOLDERS = {
  Frontend: ['TypeScript', 'React 19', 'Next.js', 'Vite', 'Tailwind CSS', 'shadcn/ui', 'TanStack Query', 'Zustand', 'Zod', 'i18n', 'Telegram Mini Apps'],
  'WebGL & Motion': ['WebGL', 'Three.js', 'React Three Fiber', 'GLSL', 'Postprocessing', 'GPGPU particles', 'Framer Motion', 'anime.js', 'OGL', 'Spline'],
  Backend: ['Node.js', 'Fastify', 'Express', 'PostgreSQL', 'Prisma', 'Drizzle', 'Redis', 'BullMQ', 'Socket.IO', 'SSE', 'OpenAPI'],
  AI: ['Claude Code', 'Codex', 'AI agents', 'Claude API', 'OpenAI API', 'Groq', 'Structured outputs', 'Document AI', 'Tesseract OCR', 'whisper.cpp'],
  iOS: ['Swift 6', 'SwiftUI', 'WidgetKit', 'Live Activities', 'StoreKit 2', 'Sign in with Apple', 'APNs', 'CoreNFC', 'XCTest'],
  'Fintech & Commerce': ['Stripe', 'PSD2 banking', 'EU VAT / VIES', 'Shopify', 'WooCommerce', 'KSeF 2.0', 'SAF-T / JPK', 'PayU', 'Przelewy24', 'Allegro', 'BaseLinker'],
  'DevOps & Security': ['Linux', 'nginx', 'Docker', 'GitHub Actions', 'PM2', 'Let’s Encrypt', 'Sentry', 'Vitest', 'Playwright', 'Passkeys', 'RBAC'],
  'Design & Media': ['Figma', 'Photoshop', 'Illustrator', 'Final Cut Pro', 'Premiere Pro', 'Logic Pro', 'Remotion', 'Midjourney', 'Higgsfield', 'Kling', 'ElevenLabs'],
};
type Folder = keyof typeof FOLDERS;
// The folders in the order each language's market asks for them: first what is sought most there. Polish: its
// e-invoicing and payments (KSeF is mandatory from 2026); German: quality and security early; Italian and French:
// commerce and the visual side; Russian and Ukrainian: AI and 3D after the core. The rest as for English.
const ORDER: Record<Lang, Folder[]> = {
  en: ['Frontend', 'WebGL & Motion', 'Backend', 'AI', 'iOS', 'DevOps & Security', 'Fintech & Commerce', 'Design & Media'],
  de: ['Frontend', 'Backend', 'DevOps & Security', 'AI', 'WebGL & Motion', 'Fintech & Commerce', 'iOS', 'Design & Media'],
  pl: ['Fintech & Commerce', 'Backend', 'Frontend', 'AI', 'DevOps & Security', 'WebGL & Motion', 'iOS', 'Design & Media'],
  it: ['Frontend', 'Backend', 'Fintech & Commerce', 'WebGL & Motion', 'AI', 'iOS', 'DevOps & Security', 'Design & Media'],
  fr: ['Frontend', 'WebGL & Motion', 'Backend', 'Fintech & Commerce', 'AI', 'iOS', 'DevOps & Security', 'Design & Media'],
  ru: ['Frontend', 'Backend', 'AI', 'WebGL & Motion', 'iOS', 'DevOps & Security', 'Fintech & Commerce', 'Design & Media'],
  uk: ['Frontend', 'Backend', 'AI', 'WebGL & Motion', 'iOS', 'DevOps & Security', 'Fintech & Commerce', 'Design & Media'],
};
// (in Polish the fintech folder leads with the Polish ones)
const POLISH_FINTECH = ['KSeF 2.0', 'SAF-T / JPK', 'PayU', 'Przelewy24', 'Allegro', 'BaseLinker', 'PSD2 banking', 'EU VAT / VIES', 'Stripe', 'Shopify', 'WooCommerce'];
export const STACK = ORDER[lang].map((name) => ({ name, items: lang === 'pl' && name === 'Fintech & Commerce' ? POLISH_FINTECH : FOLDERS[name] }));

export const SERVICES = t.services.list;

// A scenario in a product's promo: its label on the site and the promo's scene it jumps to (src/promo).
export type Chapter = { label: string; scene: string };
// A site in a card's slideshow: its frames (Bogdan's mockups of it, pages of it that scroll by, a demo film with
// its first frame as the image) and its address while it is live.
// A native app on the Mobile Apps section's 3D iPhone: its screens (simulator screenshots, fictional data), a
// caption for each.
export type PhoneApp = { label: string; tagline: string; screens: { image: string; caption: string; alt: string }[] };
export type Slide = { label: string; url?: string; frames: { image: string; alt: string; page?: boolean; video?: string; focus?: string }[] };

export type Project = {
  category: string;
  name: string;
  description: string;
  stack: string[];
  live?: string;
  liveLabel?: string; // the live link's label, if not "Live Project"
  images: [string, string, string];
  alts: [string, string, string];
  // the product's 2D promo, played live in the card in place of the screenshots
  promo?: { id: 'crm' | 'hr' | 'b2b' | 'taxi'; chapters: Chapter[] };
  // or a slideshow of sites, in place of the screenshots
  slides?: Slide[];
  // the stores it runs: its live button shows them in the promo's window, each its icon linking to it
  stores?: { name: string; href: string; icon: string }[];
};

// A promo's scenarios: its scenes (src/promo), each under its label.
const scenarios = (scenes: string[], labels: string[]): Chapter[] => scenes.map((scene, i) => ({ label: labels[i], scene }));
// A site of the WordPress card: its frames, each with its words.
const WP = t.projects.wordpress;
const site = (label: keyof typeof WP.slides, url: string | undefined, frames: Omit<Slide['frames'][number], 'alt'>[]): Slide => ({
  label,
  url,
  frames: frames.map((frame, i) => ({ ...frame, alt: WP.slides[label][i] })),
});
const texts = ({ category, name, description, alts }: { category: string; name: string; description: string; alts: string[] }) => ({
  category,
  name,
  description,
  alts: alts as [string, string, string],
});

// Named by the system each is (Bogdan, 2026-09-30); the product or the client goes in the line above it.
export const PROJECTS: Project[] = [
  {
    ...texts(t.projects.crm),
    stack: ['React 19', 'Fastify', 'PostgreSQL', 'SwiftUI'],
    live: 'https://simbia.eu',
    images: ['/work/simbia-1.webp', '/work/simbia-2.webp', '/work/simbia-3.webp'],
    promo: {
      id: 'crm',
      chapters: scenarios(
        ['05 Pulpit', '07 Scoring', '09 Priorytety', '11 Kanban', '12 Oferta', '14 Follow-up', '16 Faktura', '20 Na biurku i w kieszeni'],
        t.projects.crm.chapters,
      ),
    },
  },
  {
    ...texts(t.projects.b2b),
    stack: ['React', 'Node.js', 'PostgreSQL', 'Three.js'],
    // the three stores (2026-10-01), their icons their own sites' (scripts/prepare-media.py)
    stores: [
      { name: 'PROTECTDENT', href: 'https://protectdent.eu', icon: '/work/store-protectdent.webp' },
      { name: 'XyliMelts', href: 'https://xylimelts.pl', icon: '/work/store-xylimelts.webp' },
      { name: 'Mind Logistic', href: 'https://bosspartners.pl', icon: '/work/store-mind-logistic.webp' },
    ],
    images: ['/work/b2b-1.webp', '/work/b2b-2.webp', '/work/b2b-3.webp'],
    promo: {
      id: 'b2b',
      chapters: scenarios(
        ['03-04 Rejestracja NIP', '06-07 Weryfikacja i mail', '09 Sklep', '11 Twoja cena', '13 Szybkie zamówienie', '15 Kredyty', '17 InPost', '18 Kanały sprzedaży'],
        t.projects.b2b.chapters,
      ),
    },
  },
  {
    ...texts(t.projects.hr),
    stack: ['React', 'Socket.IO', 'PostgreSQL', 'SwiftUI'],
    live: 'https://iapply.com.pl',
    images: ['/work/iapply-1.webp', '/work/iapply-2.webp', '/work/iapply-3.webp'],
    promo: {
      id: 'hr',
      chapters: scenarios(
        ['03-04 Start', '06-07 QR', '09-11 Giełda', '12-13 Grafik', '14 Zadania', '15 Nadgodziny', '17 Nieobecność', '18 NFC'],
        t.projects.hr.chapters,
      ),
    },
  },
  {
    ...texts(t.projects.taxi),
    stack: ['React', 'Express', 'Redis', 'SwiftUI'],
    images: ['/work/taxiboss-1.webp', '/work/taxiboss-2.webp', '/work/taxiboss-3.webp'],
    promo: {
      id: 'taxi',
      chapters: scenarios(['03 Kandydat', '06 Rejestracja', '09 Dokumenty', '12 Umowa', '14 Auto', '15 Flota', '18 Mobile'], t.projects.taxi.chapters),
    },
  },
  {
    // Bogdan's sites for clients (2026-09-30), also on his Behance; Architect Vision was his own interior design
    // studio, now closed. The sites with a demo film come first; each site in his order: its film, his mockups of
    // it, then pages of it, which scroll on a MacBook (scripts/prepare-media.py).
    ...texts(WP),
    stack: ['WordPress', 'Elementor'],
    live: 'https://www.behance.net/styleicon',
    liveLabel: 'Behance',
    images: ['/work/wp-kreem-0.webp', '/work/wp-blackpoint-0.webp', '/work/wp-lizard-0.webp'],
    slides: [
      site('Lizard Moving', 'https://lizardmoving.com', [
        { image: '/work/wp-lizard-demo.webp', video: '/work/wp-lizard-demo.mp4' },
        { image: '/work/wp-lizard-0.webp', focus: 'center 45%' },
        { image: '/work/wp-lizard-1.webp', page: true },
      ]),
      site('Magic Patron', 'https://magicpatron.pl', [
        { image: '/work/wp-magicpatron-demo.webp', video: '/work/wp-magicpatron-demo.mp4' },
        { image: '/work/wp-magicpatron-0.webp' },
        { image: '/work/wp-magicpatron-1.webp', page: true },
        { image: '/work/wp-magicpatron-2.webp', page: true },
      ]),
      site('Alibia', undefined, [
        { image: '/work/wp-alibia-demo.webp', video: '/work/wp-alibia-demo.mp4' },
        { image: '/work/wp-alibia-0.webp', focus: 'center 45%' },
        { image: '/work/wp-alibia-1.webp', page: true },
        { image: '/work/wp-alibia-2.webp', page: true },
      ]),
      site('KREEM', 'https://kreem.pl', [
        { image: '/work/wp-kreem-0.webp' },
        { image: '/work/wp-kreem-1.webp', page: true },
        { image: '/work/wp-kreem-2.webp', page: true },
      ]),
      site('Black Point', undefined, [
        { image: '/work/wp-blackpoint-0.webp', focus: 'center 35%' },
        { image: '/work/wp-blackpoint-2.webp', focus: 'center 40%' },
        { image: '/work/wp-blackpoint-1.webp', page: true },
      ]),
      site('Nami Clean', 'https://namiclean.pl', [
        { image: '/work/wp-namiclean-0.webp', focus: 'center 60%' },
        { image: '/work/wp-namiclean-1.webp', page: true },
      ]),
      site('Casada', undefined, [
        { image: '/work/wp-casada-0.webp', focus: 'center 35%' },
        { image: '/work/wp-casada-1.webp', page: true },
        { image: '/work/wp-casada-2.webp', page: true },
      ]),
      site('ARAB 30', undefined, [
        { image: '/work/wp-arab-0.webp' },
        { image: '/work/wp-arab-1.webp', page: true },
        { image: '/work/wp-arab-2.webp', page: true },
        { image: '/work/wp-arab-3.webp', page: true },
      ]),
      site('Architect Vision', undefined, [
        { image: '/work/wp-architect-0.webp', focus: 'center 35%' },
        { image: '/work/wp-architect-1.webp', page: true },
      ]),
      site('Enveloper', undefined, [
        { image: '/work/wp-enveloper-0.webp', page: true },
        { image: '/work/wp-enveloper-1.webp', page: true },
      ]),
      site('Medicus', undefined, [{ image: '/work/wp-medicus-0.webp', page: true }]),
      site('Hair Hub', undefined, [{ image: '/work/wp-hairhub-0.webp', page: true }]),
      site('Fencing', undefined, [{ image: '/work/wp-fencing-0.webp', page: true }]),
    ],
  },
];

// Marquee: project covers from the STYLEICON archive (scripts/prepare-media.py), their words in t.graphics.tiles.
// `?v` busts the 30-day cache. Branding, print and social media only: the sites are in the WordPress card (Bogdan,
// 2026-09-30).
export const TILES = t.graphics.tiles.map((alt, i) => ({ src: `/tiles/${String(i).padStart(2, '0')}.webp?v=8`, alt }));

// The covers' projects (2026-10-01): each with all its pictures (public/graphics/<slug>/N.webp, sized in graphics.json by
// scripts/prepare-media.py) and when it was, from the dates of its PSDs on his desktop (Проэкты/АРХИВ); a cover opens
// its project, at the picture it shows.
export type GraphicsSlug = keyof typeof graphicsSizes;
const GRAPHICS_DATES: Record<GraphicsSlug, [string, string?]> = {
  hype: ['2024-09'],
  ihor: ['2024-02'],
  'dc-consulting': ['2025-05', '2025-07'],
  'touch-coffee': ['2024-11'],
  'da-vinci': ['2025-04'],
  'black-point': ['2021-12', '2024-11'],
  adaya: ['2025-04'],
  'soul-nation': ['2024-07', '2025-02'],
  strimat: ['2023-12', '2025-05'],
  'profi-dokument': ['2024-02', '2025-01'],
  'zero-sladu': ['2025-04'],
  'yana-lashes': ['2024-07'],
  'stories-beauty': ['2025-04'],
  depilacja: ['2024-05', '2024-10'],
  alibia: ['2025-04', '2025-09'],
  'time-relax-body': ['2024-05'],
  'na-serio-na-zarty': ['2025-01'],
  'mind-logistic': ['2025-10', '2025-11'],
  elixir: ['2025-09', '2026-07'],
  poucher: ['2026-07', '2026-08'], // (its 3D can, in his Mind Logistic site's history)
  'elixir-gummies': ['2026-03'],
};
export const GRAPHICS = Object.fromEntries(
  (Object.keys(graphicsSizes) as GraphicsSlug[]).map((slug) => [
    slug,
    {
      slug,
      when: GRAPHICS_DATES[slug],
      pictures: graphicsSizes[slug].map(([width, height], i) => ({ src: `/graphics/${slug}/${i}.webp`, width, height })),
      ...t.graphics.projects[slug],
    },
  ]),
) as Record<GraphicsSlug, { slug: GraphicsSlug; when: [string, string?]; pictures: { src: string; width: number; height: number }[] } & (typeof t.graphics.projects)[GraphicsSlug]>;
// cover i (TILES): its project, and which of the project's pictures it shows (-1: its 3D scene, SCENE_OF)
export const COVER_OF: [GraphicsSlug, number][] = [
  ['mind-logistic', 0], ['elixir', -1], ['poucher', -1], ['elixir-gummies', 0],
  ['hype', 0], ['ihor', 0], ['dc-consulting', 0], ['touch-coffee', 0], ['da-vinci', 1], ['black-point', 5], ['black-point', 2],
  ['adaya', 0], ['soul-nation', 0], ['strimat', 0], ['profi-dokument', 0], ['zero-sladu', 0], ['yana-lashes', 0],
  ['stories-beauty', 0], ['black-point', 7], ['depilacja', 0], ['profi-dokument', 1], ['alibia', 1], ['time-relax-body', 0],
  ['na-serio-na-zarty', 0], ['ihor', 1],
];
// The projects that open on a live 3D scene (2026-10-01), Mind Logistic's site's own (src/three/miniScenes.ts): the
// cover is a still of it (no 3D in the rows, his call), the project opens on the scene, all its pictures under it
// (-1 above).
export const SCENE_OF: Partial<Record<GraphicsSlug, SceneName>> = {
  elixir: 'elixir',
  poucher: 'poucher',
  ...Object.fromEntries(Object.keys(prints).map((slug) => [slug, `print:${slug}` as const])),
};
// Two projects open on their logo's animation (2026-10-01, src/logoFilms.json from scripts/prepare-media.py logos),
// looping and muted: Mind Logistic's and Black Point's; when they have printed things too, it is the first of the chips.
export const LOGO_FILM_OF = logoFilms as Partial<Record<GraphicsSlug, { src: string; poster: string; width: number; height: number }>>;
// The projects whose printed things are in 3D (2026-10-01, src/prints.json from the print files in his archive):
// they open on them, to be turned over and looked at, one thing after another by the chips under them.
export const PRINT_KINDS = Object.fromEntries(Object.entries(prints).map(([slug, things]) => [slug, things.map((thing) => thing.kind)])) as Partial<
  Record<GraphicsSlug, ('deck' | 'folder' | 'card' | 'flyer' | 'voucher' | 'guide')[]>
>;

// Music: Bogdan's playlist (2026-09-30): fifteen tracks in his order, then the rest of his LUCKI BEATS album mixed,
// the titles in English and without "Beat" (his call). Track N plays /music/NNN.m4a, the AAC master from his Music
// library; both come from scripts/prepare-media.py, which writes music.json.
export const MUSIC = {
  artist: 'SUNLUCKI',
  album: 'LUCKI BEATS',
  links: [
    { label: 'Spotify', href: 'https://open.spotify.com/artist/6wlJavSlOcPJqE6o7qwYDW' },
    { label: 'Apple Music', href: 'https://music.apple.com/us/artist/sunlucki/1695520105' },
    { label: 'SoundCloud', href: 'https://soundcloud.com/sunlucki' },
  ],
  tracks: musicTracks as { title: string; seconds: number; artist?: string }[],
};

// Mobile apps: Bogdan's native iOS apps (2026-09-30), a section of their own after the web projects (his call);
// real screens from the iOS Simulator with demo data (scripts/prepare-media.py). SIMBIA CRM's app is left out:
// Russian only, live data only.
const screens = (images: string[], words: { caption: string; alt: string }[]) => images.map((image, i) => ({ image, ...words[i] }));
export const MOBILE_APPS: { title: string; drag: string; previous: string; next: string; caption: string; apps: PhoneApp[] } = {
  title: t.apps.title,
  drag: t.apps.drag,
  previous: t.apps.previous,
  next: t.apps.next,
  caption: t.apps.caption,
  apps: [
    {
      label: 'iApply',
      tagline: t.apps.iapply.tagline,
      screens: screens(['/work/app-iapply-0.webp', '/work/app-iapply-1.webp', '/work/app-iapply-2.webp', '/work/app-iapply-3.webp'], t.apps.iapply.screens),
    },
    {
      label: 'TAXI BOSS',
      tagline: t.apps.taxi.tagline,
      screens: screens(['/work/app-taxi-0.webp', '/work/app-taxi-1.webp', '/work/app-taxi-2.webp', '/work/app-taxi-3.webp'], t.apps.taxi.screens),
    },
    {
      label: 'CashFlow',
      tagline: t.apps.cashflow.tagline,
      screens: screens(
        ['/work/app-cashflow-0.webp', '/work/app-cashflow-1.webp', '/work/app-cashflow-2.webp', '/work/app-cashflow-3.webp'],
        t.apps.cashflow.screens,
      ),
    },
  ],
};

// Videos on YouTube Bogdan made or is credited in (2026-09-30, views counted that day, 1,551,492 together): played in
// YouTube's own player (privacy-enhanced), their pictures from YouTube. Black Point's description links his
// Instagram, Diablica's names him as co-director, HYPE HOP by Alibia's for filming and editing; ŁAŁ credits him on
// screen; 100 000 MAGAZIN is on his own channel. Views are shown from 10,000 up.
export const YOUTUBE_FILMS = [
  { slug: 'black-point', youtube: 'EmpEr-TNiTM', title: 'BLACK POINT', credit: 'ARAB', width: 1920, height: 1080, seconds: 143, views: 1_339_737 },
  { slug: 'diablica', youtube: 'y4qliIPDRp8', title: 'Diablica', credit: 'ARAB · co-director', width: 1920, height: 1080, seconds: 171, views: 135_735 },
  { slug: 'lal', youtube: 'zTLT6ZSKs90', title: 'ŁAŁ', credit: 'ARAB ft. Kalka, Wrzecion, Liv K, Mordo Mati', width: 1920, height: 1080, seconds: 256, views: 63_836 },
  { slug: 'hype-hop-alibia', youtube: 'k8B1CTu5alQ', title: 'HYPE HOP by Alibia', credit: 'Filming and editing', width: 1920, height: 1080, seconds: 344, views: 11_927 },
  { slug: 'magazin', youtube: 'Y28iR0GmlhI', title: '100 000 MAGAZIN', credit: 'SUNLUCKI production', width: 1920, height: 1080, seconds: 151 },
];

// The Video section's order (Bogdan's, 2026-09-30): Who Am I?, his films in his list's order, then the videos on
// YouTube (the grid lets wide and tall ones take turns); and the films he wants right under another in the grid. The
// clients' films he added on 2026-10-01 come after Dima Space, in the order he named them.
export const VIDEO_ORDER = [
  'who-am-i', 'promo', 'dima-space', 'protectdent', 'xylimelts', 'currywurst', 'mind-logistic', 'tesla', 'dreams-come-true', 'magic', 'yellow',
  'hype-hop', 'grzyb', 'chase-1090', 'hype-party', 'ant-interview', 'vlad-interview', 'loma', 'industrial',
  'eyes-in-the-night', 'adrian-the-barber', 'choose-your-style', 'juli-the-barber', 'rodi-m3', 'skater-cut', 'vlad-the-barber', 'valentines-day',
  'black-point', 'diablica', 'lal', 'hype-hop-alibia', 'magazin',
];
export const VIDEO_UNDER: Record<string, string> = { 'chase-1090': 'grzyb' };

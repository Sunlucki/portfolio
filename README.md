# sunlucki.pl — portfolio of Bogdan Nenadović

**Live:** https://sunlucki.pl

Personal site of a full-stack design engineer from Poznań, Poland. It shows selected production work — a CRM with double-entry accounting and KSeF e-invoicing, a B2B wholesale platform, a 23-language medical-device storefront, workforce and fleet platforms with native iOS apps, and a production design system.

## Stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS 3.4
- Framer Motion — in-view fades, the character-by-character text reveal, sticky stacking project cards
- anime.js 4 — the scroll-synced hero timeline (`onScroll`), the scroll hint loop and the stat counters
- Lucide icons, Kanit from Google Fonts

## How the hero works

The intro is a three-layer, scroll-scrubbed scene:

1. **Video layer** — an 83-frame image sequence (the camera flies into the eye), drawn on a `<canvas>` inside a sticky, viewport-high container.
2. **Headline** — "Hi, I'm Bogdan".
3. **Subject layer** — the same frames with the background removed, so the headline sits *behind* the person. The cut-outs are generated on-device with Apple Vision (`scripts/cutout.swift`, the model behind "Copy Subject" in Photos). They are needed only while the headline is on screen, so there are 25 of them.

Scroll sync: one anime.js timeline is linked to the section's scroll range with `onScroll({ enter: 'top top', leave: 'bottom bottom', sync })`. It scrubs both canvases frame by frame and, on the same timeline, fades the copy, the shading and the final blackout.

Mouse depth (fine pointers only, off for `prefers-reduced-motion`):
- the video and subject layers drift together against the cursor, so the subject never doubles;
- the headline drifts less and tilts in 3D, so it reads as sitting between the person and the wall.

On phones the first frames are drawn slightly smaller, with the backdrop extended above, to make room for a two-line headline. The framing eases back to full cover early in the scroll.

Frames load coarse-to-fine (every 8th first), so scrubbing works before everything has downloaded. Phones get a 1280 px set, desktops a 1920 px set, all WebP.

## Project layout

```
src/
  content.ts            all copy and project data
  components/           FadeIn, Magnet, AnimatedText, CountUp, buttons
  sections/             Hero, Marquee, About, Services, Projects, Contact
scripts/
  prepare-media.py      builds hero frames (+ Vision cut-outs), card images, marquee tiles and icons from local sources
  cutout.swift          Apple Vision foreground mask → full-frame transparent PNGs
  qa-shots.mjs          headless-Chrome visual QA (desktop 1440 px + mobile 390 px) over the DevTools protocol
public/                 generated media (hero/, work/, tiles/, about/)
```

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
```

`npm run deploy` builds and rsyncs `dist/` to the server (SSH host alias `styleicon`), where nginx serves it with TLS from Let's Encrypt.

## Rights

Code © Bogdan Nenadović. Screenshots show products I built and are published with my clients' consent. Photos, video and 3D renders are my own and may not be reused.

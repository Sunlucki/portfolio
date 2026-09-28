# sunlucki.pl — portfolio of Bogdan Nenadović

**Live:** https://sunlucki.pl

Personal site of a full-stack design engineer from Poznań, Poland. It shows selected production work — a CRM with double-entry accounting and KSeF e-invoicing, a B2B wholesale platform, a 23-language medical-device storefront, workforce and fleet platforms with native iOS apps, and a production design system.

## Stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS 3.4
- Framer Motion — in-view fades, the character-by-character text reveal, sticky stacking project cards
- anime.js 4 — the scroll-synced hero timeline (`onScroll`), the scroll hint loop and the stat counters
- React Three Fiber + drei + postprocessing — the 3D About scene (loaded lazily)
- React Bits — Micro Slats (hero backdrop), Tech Text (headings) and Folder Float (the stack, with matter-js), in `src/vendor/react-bits/`
- Lucide icons, Kanit from Google Fonts

## How the hero works

The intro is a layered, scroll-scrubbed scene, back to front:

1. **Backdrop** — React Bits Micro Slats in the hoodie's blue (WebGL), paused once it is covered.
2. **Video layer** — an 83-frame image sequence (the camera flies into the eye) on a `<canvas>` inside a sticky, viewport-high container. It fades in as the camera moves in, replacing the backdrop with the real wall.
3. **Headline** — "Hi, I'm Bogdan" drawn by Tech Text; the letters react to the cursor.
4. **Subject layer** — the same frames with the background removed, so the headline sits *behind* the person. The cut-outs are generated on-device with Apple Vision (`scripts/cutout.swift`, the model behind "Copy Subject" in Photos); the armchair, which Vision leaves out, is added back with a hue/saturation key. They are needed only while the headline is on screen, so there are 25 of them.

Scroll sync: one anime.js timeline is linked to the section's scroll range with `onScroll({ enter: 'top top', leave: 'bottom bottom', sync })`. It drives a fractional playhead for both canvases and, on the same timeline, fades the copy, the shading and the final blackout.

Morphing: the camera move is almost a pure zoom, so `scripts/estimate-motion.py` fits it for every pair of frames (OpenCV ECC → zoom `s` about a point `c`, stored in `src/heroMotion.json`). Between frames *i* and *i+1* the hero grows frame *i* towards the next framing while *i+1* fades in over it from its smaller size, so scroll positions between frames look like real in-between frames instead of a double exposure.

Mouse depth (fine pointers only, off for `prefers-reduced-motion`), in three planes:
- the backdrop barely moves;
- the headline drifts less than the subject and tilts in 3D;
- the video and subject layers drift together against the cursor, so the subject never doubles.

On phones the first frames are drawn slightly smaller, with the backdrop extended above, to make room for a two-line headline. The framing eases back to full cover early in the scroll.

Frames load cut-outs first, then video frames coarse-to-fine (every 8th first), so scrubbing works before everything has downloaded. Phones get a 1280 px set, desktops a 1920 px set, all WebP.

## The About scene

A small React Three Fiber scene, loaded only when the section comes near (the original render is shown until then, and stays if WebGL is unavailable):

- an iPhone 17 Pro Max model (recoloured to Deep Blue, meshopt-compressed) lies on a reflective floor; its lock screen is drawn on a canvas and rendered over-bright so the bloom pass turns it into a light source;
- a ray-marched box of light rises from the screen — dense right above it, spreading and fading with height;
- Bogdan, lifted out of the render with Apple Vision, floats above it as a billboard. He is printed as a 1-bit Atkinson dither in texture space (after React Bits' Dither Veil); the cursor burns a trail through to the photo, and each cell knits back at its own threshold;
- the camera orbits a few degrees with the pointer and sways on its own, so the depth reads on touch screens too.

## The stack section

Eight React Bits Folder Float folders (Frontend, Backend, iOS, AI, Fintech, DevOps, Design, Media). A folder opens on hover — on touch screens on tap — and its tools spring out as notes that can be dragged around (matter-js). Wide screens get a 4 × 2 shelf with room above each row for the notes; narrow screens a swipeable row whose middle folder opens by itself. The list lives in `STACK` in `src/content.ts` and only names tools the repositories actually show.

## Project layout

```
src/
  content.ts            all copy and project data
  heroMotion.json       per-frame camera zoom for the hero morph (generated)
  components/           FadeIn, Magnet, AnimatedText, CountUp, SectionTitle, buttons
  sections/             Hero, Marquee, About, Stack, Services, Projects, Contact
  three/AboutScene.tsx  the 3D About scene
  vendor/react-bits/    Micro Slats, Tech Text, Folder Float (unmodified but for one renamed parameter)
scripts/
  prepare-media.py      builds hero frames (+ Vision cut-outs), card images, marquee tiles and icons from local sources
  cutout.swift          Apple Vision foreground mask → full-frame transparent PNGs
  estimate-motion.py    fits the camera zoom between hero frames (needs opencv-python-headless, numpy)
  prepare-about.py      About scene assets: Bogdan's cut-out, the poster, the recoloured iPhone model
  qa-shots.mjs          headless-Chrome visual QA (desktop 1440 px + mobile 390 px) over the DevTools protocol
public/                 generated media (hero/, work/, tiles/, about/, models/)
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

## Credits

- 3D model: ["iPhone 17 Pro Max"](https://sketchfab.com/3d-models/iphone-17-pro-max-87fc1df741384124a8ce0226d2b2058d) by [MajdyModels](https://sketchfab.com/MG990), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Recoloured and compressed for the web.
- [React Bits](https://reactbits.dev) by David Haz — Micro Slats, Tech Text and Folder Float (MIT + Commons Clause); the About figure's dither is modelled on Dither Veil.

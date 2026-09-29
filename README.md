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
4. **Subject layer** — the same frames with the background removed, so the headline sits *behind* the person. The cut-outs are generated on-device with Apple Vision (`scripts/cutout.swift`, the model behind "Copy Subject" in Photos); the armchair, which Vision leaves out, is added back with a hue/saturation key. They are needed only while the headline is on screen, so there are 25 of them. They are drawn through a WebGL pass (`src/sections/heroVeil.ts`): a 1-bit print after React Bits' Dither Veil that the pointer — or, when idle, a wandering spot — burns through to the photo, with a chromatic aberration around the silhouette that grows with scroll speed and hides the rough edges of the cut-out.

Scroll sync: one anime.js timeline is linked to the section's scroll range with `onScroll({ enter: 'top top', leave: 'bottom bottom', sync })`. It drives a fractional playhead for both canvases and, on the same timeline, fades the copy, the shading and the final blackout.

Morphing: the camera move is almost a pure zoom, so `scripts/estimate-motion.py` fits it for every pair of frames (OpenCV ECC → zoom `s` about a point `c`, stored in `src/heroMotion.json`). Between frames *i* and *i+1* the hero grows frame *i* towards the next framing while *i+1* fades in over it from its smaller size, so scroll positions between frames look like real in-between frames instead of a double exposure.

Mouse depth (fine pointers only, off for `prefers-reduced-motion`), in three planes:
- the backdrop barely moves;
- the headline drifts less than the subject and tilts in 3D;
- the video and subject layers drift together against the cursor, so the subject never doubles.

On phones the first frames are drawn slightly smaller, with the backdrop extended above, to make room for a two-line headline. The framing eases back to full cover early in the scroll.

Frames load cut-outs first, then video frames coarse-to-fine (every 8th first), so scrubbing works before everything has downloaded. Phones get a 1280 px set, desktops a 1920 px set, all WebP.

The canvases are sized from their own box (a ResizeObserver: Safari can run the set-up before the styles apply, which left the hero stretched and blurred) and never sharper than the frames themselves. Each layer is drawn only while it can be seen, the cut-out's photo at 1x (it only shows where the pointer burns through the print), and the frames around the playhead are decoded ahead of drawing. Measured in Safari 26 over WebDriver (safaridriver): the hero went from 34 to 60 fps at the median, with 3 frames over 34 ms instead of 35.

## The manifesto

Straight after the hero, five phrases, each written in particles under a shape made of one cloud of particles (`src/sections/ManifestoSection.tsx`, `src/three/ManifestoScene.tsx`): the Earth, a gear, a circuit brain, a question mark and an eye that looks back.

- The section starts on top of the hero's last part and is screen-blended, so its black is see-through. As the camera nears the eye, particles gather out of a loose swirl into an iris laid exactly over the real one (`scripts/estimate-motion.py` also measures the pupil in every frame, `src/heroPupil.json`) and grow with the zoom until the camera is inside the pupil.
- As the camera flies into the pupil the iris becomes a galaxy: the pupil closes into a bright core and the fibres wind into three arms. Past the hero the galaxy draws to the middle of the screen and collapses into the Earth: continents in dense points with brighter coasts, sparse blue oceans and a rim of air, from hand-simplified coastlines (`src/three/earth.ts`). Its far side fades, so it reads as a solid planet.
- From there the particles flow from shape to shape. Every shape's points are ordered along a Hilbert curve, so each particle travels to a nearby place in the next one and the cloud flows instead of criss-crossing; mid-flight they swirl through 3D noise towards the lens. Most points sit on outlines and flicker, and a light pulse runs across (after React Bits' Electric Logo). The Earth and the gear turn; the eye's iris follows the cursor (or looks around on its own), hides behind the lids and blinks.
- The phrases are particles too, sampled from Kanit set on a canvas and drawn straight in clip space so the type stays put while the camera moves. A phrase gathers while its shape forms and breaks up as the shape leaves, driven by the same scroll; words land in reading order, highlighted words (`*word*` in `content.ts`) last, in heavier type and a cyan-to-pink accent, and `~word~` is struck out. Dust streams past; bloom, film grain and a chromatic aberration that follows the scroll speed and the morph do the lens work. Everything moves in vertex shaders; the CPU only uploads the next pair of shapes when the scroll crosses into it.
- At the end the About section slides over this one (`--handoff`, which this section grows by, so nothing below moves) and the eye breaks up into the About scene: its points, the phone and the figure's very dither dots (`src/three/aboutStage.ts`), are carried through the About camera onto the stage's place on screen, and the scene fades in over them. The About camera holds its resting pose until then. Once it has taken over, the manifesto stops rendering.
- The layer is transparent, not CSS-blended: a last pass (ScreenAlpha) gives each pixel the alpha of its brightest channel, which composites exactly like a screen blend without making the browser (Safari above all) blend a full-screen layer on every frame.
- Smoothness: the rig runs before the cloud in every frame, so the pair of shapes on the GPU always matches the morph; the lens kick follows the eased scroll, not the wheel's steps; both 3D scenes mount and compile their shaders in the background (`compileAsync`) while the hero plays, so nothing is set up mid-scroll.
- Without WebGL the phrases are shown as plain text.

## The 3D cursor

On devices with a mouse (and without reduced motion) the pointer is an extruded arrow in thin-film iridescent chrome (`src/three/cursor3d.ts`). Its tip is the hotspot; it banks with the movement, and near anything clickable it grows, turns to point at it and spins, so buttons are easy to find. The 180 px canvas travels with the pointer instead of covering the page.

## The About scene

A small React Three Fiber scene, loaded only when the section comes near (the original render is shown until then, and stays if WebGL is unavailable):

- an iPhone 17 Pro Max model (recoloured to Deep Blue, meshopt-compressed) lies on a reflective floor; its lock screen is drawn on a canvas and rendered over-bright so the bloom pass turns it into a light source;
- a ray-marched box of light rises from the screen — dense right above it, spreading and fading with height;
- Bogdan, lifted out of the render with Apple Vision, floats above it as a billboard. He is printed as a 1-bit Atkinson dither in texture space (after React Bits' Dither Veil); the cursor burns a trail through to the photo, and each cell knits back at its own threshold;
- the camera orbits a few degrees with the pointer and sways on its own, so the depth reads on touch screens too.

Two R3F canvases can be on screen at once here. `@react-three/postprocessing` sizes a new composer from a size vector shared by all composers, so one canvas could come up at the other's size; `src/three/KeepSize.tsx` puts the renderer back.

## The stack section

Eight React Bits Folder Float folders (Frontend, Backend, iOS, AI, Fintech, DevOps, Design, Media). A folder opens on hover — on touch screens on tap — and its tools spring out as notes that can be dragged around (matter-js). Wide screens get a 4 × 2 shelf with room above each row for the notes; narrow screens a swipeable row whose middle folder opens by itself. The list lives in `STACK` in `src/content.ts` and only names tools the repositories actually show.

## Project layout

```
src/
  content.ts            all copy and project data
  heroMotion.json       per-frame camera zoom for the hero morph (generated)
  components/           FadeIn, Magnet, AnimatedText, CountUp, SectionTitle, buttons
  heroPupil.json        the pupil's centre and radius in the hero's last frames (generated)
  sections/             Hero (+ heroVeil.ts), Manifesto, About, Stack, Services, Projects, Marquee, Contact
  three/                AboutScene, ManifestoScene (+ earth.ts, aboutStage.ts, KeepSize), cursor3d
  vendor/react-bits/    Micro Slats, Tech Text, Folder Float (unmodified but for one renamed parameter)
scripts/
  prepare-media.py      builds hero frames (+ Vision cut-outs), card images, marquee tiles (project covers) and icons from local sources
  cutout.swift          Apple Vision foreground mask → full-frame transparent PNGs
  estimate-motion.py    camera zoom between hero frames + the pupil per frame (needs opencv-python-headless, numpy)
  prepare-about.py      About scene assets (cut-out, poster, recoloured iPhone model)
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
- [React Bits](https://reactbits.dev) by David Haz — Micro Slats, Tech Text and Folder Float (MIT + Commons Clause); the dithered figures are modelled on Dither Veil and the manifesto's flicker on Electric Logo.
- [Lucide](https://lucide.dev) icons (ISC), including the brain-circuit outline the manifesto draws in particles.
- 3D simplex noise from [ashima/webgl-noise](https://github.com/ashima/webgl-noise) (Ashima Arts, Ian McEwan; MIT).

# sunlucki.pl — portfolio of Bogdan Nenadović

**Live:** https://sunlucki.pl

Personal site of a full-stack design engineer from Poznań, Poland. It shows selected production work — a CRM with double-entry accounting and KSeF e-invoicing, a B2B wholesale platform, a 23-language medical-device storefront, workforce and fleet platforms with native iOS apps, and a production design system.

## Stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS 3.4
- Framer Motion — in-view fades, the character-by-character text reveal, sticky stacking project cards
- anime.js 4 — the scroll-synced hero timeline (`onScroll`) and the scroll hint loop
- React Three Fiber + drei + postprocessing — the manifesto and the 3D phone scene in the contact section (loaded lazily)
- React Bits — Micro Slats (hero backdrop), Tech Text (headings) and Folder Float (the stack, with matter-js), in `src/vendor/react-bits/`
- Lucide icons, Kanit (and Montserrat for Cyrillic) from Google Fonts

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

On phones the first frames are drawn slightly smaller, with the backdrop extended above, to make room for a two-line headline. The framing eases back to full cover early in the scroll. At the bottom the tagline is centred, the contact button centred under it, over a darker scrim so they read over the print. Touch screens have no pointer to burn the print with: it stays whole until a touch or a swipe, which shows the photo whole for three seconds (the print dissolving into it, each cell at its own threshold) before it knits back.

Frames load cut-outs first, then video frames coarse-to-fine (every 8th first), so scrubbing works before everything has downloaded. Phones get a 1280 px set, desktops a 1920 px set, all WebP.

The canvases are sized from their own box (a ResizeObserver: Safari can run the set-up before the styles apply, which left the hero stretched and blurred) and never sharper than the frames themselves. Each layer is drawn only while it can be seen, the cut-out's photo at 1x (it only shows where the pointer burns through the print), and the frames around the playhead are decoded ahead of drawing. Measured in Safari 26 over WebDriver (safaridriver): the hero went from 34 to 60 fps at the median, with 3 frames over 34 ms instead of 35.

## The manifesto

Straight after the hero, ten phrases (Bogdan's own lines), each written in particles under a shape made of one cloud of particles (`src/sections/ManifestoSection.tsx`, `src/three/ManifestoScene.tsx`): the galaxy the camera flies to through the hero's pupil, the Earth, the Earth at night lit where people live, a heart, a brain, a bulb that two hands reach for (after the Creation of Adam), a laptop the camera dives into, down to its chip, whose brain then turns into the letters AI, and an eye that looks back. A red thread runs through them: the lights, the heart, the brain's signals, the bolt glowing in the bulb, the caret on the laptop's screen and the sparks running into the chip.

- The section starts on top of the hero's last part and is screen-blended, so its black is see-through. As the camera nears the eye, particles gather out of a loose swirl into an iris laid exactly over the real one (`scripts/estimate-motion.py` also measures the pupil in every frame, `src/heroPupil.json`) and grow with the zoom until the camera is inside the pupil.
- As the camera flies into the pupil the iris winds into a galaxy and out into a whirl of its arms round the way ahead, which the camera flies down, the points streaming past the lens, until they wind back in to the galaxy ahead: a bright core and three arms. It all turns one way from the iris to the galaxy, without a pause. The galaxy holds the first phrase a while, then the camera flies into its core, where the Earth is: continents in dense points with brighter coasts, sparse blue oceans and a rim of air, from hand-simplified coastlines (`src/three/earth.ts`). Its far side fades, so it reads as a solid planet.
- From there the camera flies from shape to shape (`FLIGHTS`): a flight scales both shapes about the point it flies at, which is the same as the camera flying there. Flying in, a shape bursts apart as the camera nears it, its points swirling through 3D noise past the lens, and each point, once it has left the view or burst away, turns into the next shape's, which gathers out of the same burst, growing out of the depth; flying back, the shape shrinks away as the next closes in round it. Some parts travel on into the next shape instead: the Earth's lights gather into the heart, the heart dissolves into the brain's signals, the bulb's bolt folds into the laptop's screen and its glass into the rest of the laptop, the chip's letters AI into the eye (points are paired to match, `pairOrder`). The camera never stands still: it nears a shape while it holds, and every flight starts and ends on the move. Past the chip's brain turning into AI in place, the rest are flights. Most points sit on outlines and flicker, and a light pulse runs across (after React Bits' Electric Logo). The Earth turns; the heart, the brain, the bulb, the laptop and its chip sway, so they are never seen edge on. The eye's iris follows the cursor (or looks around on its own), hides behind the lids and blinks.
- The camera nears the Earth at Europe, which the Earth turns to face it, as the Earth dims its land to night and its loose dust and air come on, flaring, as red points that pulse where people live, scattered by NASA's Black Marble (`scripts/prepare-lights.py`, `public/manifesto/lights.webp`); arcs rise off the surface between cities (Poznań out to the world, and across Europe and the continents), a pulse running along each. Then it flies into Europe, and the red lights gather into a heart. It pulls back from the heart, which dissolves into the red signals of a brain closing in round it; the brain charges up, its points racing and glowing, and the camera flies into it, to a bulb. Two hands come in from opposite corners, turning a little and trailing points, and brighten the bulb as they near it; as they touch it, it flares, they are blown away, its glass bursts, baring the bolt, and the camera flies in as the burst makes a laptop. The heart, the brain and the bulb with the hands are baked from models into 20,000 points each, 78 KB (`scripts/prepare-models.py`): the heart's and the brain's folds, fat and vessels live in their textures, so points are kept by the texture's brightness; the bulb's points carry their part (hand, nail, glass, base, bolt), and its glass lights up at the rim. The heart beats twice a second; the brain has faint red signals flitting inside. Far sides of the Earth, the heart and the brain are dimmed, so they read as solids.
- The laptop and its chip are drawn in code. The laptop: its shell, keys and trackpad in steel, and code on its screen as bars in syntax colours, with a red caret blinking. Into it the particles don't fly, the camera dives: the scene is magnified about the chip's place under the keys while the view pitches down to the chip's tilt (`dive()` in the vertex shader), and each point stays the laptop's until it leaves the view or dissolves on the way in, then turns into the chip's, which grows from inside the laptop to full size. The dive gets half a shape more scroll than a plain flight (`SHAPE_SCROLL` in `src/content.ts`, which also gives the galaxy its time). The chip follows the renders Bogdan picked: a die with a brain drawn as a circuit in cyan neon, pins all round, a substrate webbed with magenta traces, white pads at its corners and a board whose cyan traces fade into the dark, with red sparks running in along them. The chip with AI is the same point set with only the brain's points moved to the letters (Kanit ExtraBold), so the brain turns into AI in place.
- The phrases are particles too, sampled from Kanit set on a canvas and drawn straight in clip space so the type stays put while the camera moves. Their lines are balanced (the narrowest measure that takes as few lines, like CSS `text-wrap: balance`), so no word is left alone on the last one; a line break in a phrase starts a new line. On phones held upright each phrase sits right under its shape (`PHONE_TOP`), lower only under the Earth drawn near and the hands reaching for the bulb, and lower on shorter screens, where the shapes take more of the height. A phrase gathers while its shape forms and breaks up as the shape leaves, driven by the same scroll; words land in reading order, highlighted words (`*word*` in `content.ts`) last, in heavier type and a cyan-to-pink accent, `~word~` is struck out, `^word^` (the hearts, warmed by dreams) is red and beats with the heart and `+word+` (home) is the Earth's green. The brain's highlighted word shakes and glows as the brain charges up, the bulb's lights up with the bulb and bursts with it, the laptop's blinks with the caret in its red, and the chip's glows in the cyan neon of the brain on the chip. Dust streams past; bloom, film grain and a chromatic aberration that follows the scroll speed and the morph do the lens work. Everything moves in vertex shaders; the CPU only uploads the next pair of shapes when the scroll crosses into it.
- At the end the About section slides over this one (`--handoff`, which this section grows by, so nothing below moves) and the eye breaks up into Bogdan's portrait: points scattered over the photo by its brightness, drawing it like a halftone, are carried through the stage's framing onto its place on screen (`src/three/aboutStage.ts`), and the portrait fades in over them. The particles fade towards the stage's sides and bottom as the stage does, so the bottom of the photo stays dark. The portrait holds still until it has taken over. Once it has taken over, the manifesto stops rendering.
- The layer is transparent, not CSS-blended: a last pass (ScreenAlpha) gives each pixel the alpha of its brightest channel, which composites exactly like a screen blend without making the browser (Safari above all) blend a full-screen layer on every frame.
- Smoothness: the rig runs before the cloud in every frame, so the pair of shapes on the GPU always matches the morph; the lens kick follows the eased scroll, not the wheel's steps; both 3D scenes (this one and the phone) mount and compile their shaders in the background (`compileAsync`) while the hero plays, so nothing is set up mid-scroll.
- Without WebGL the phrases are shown as plain text.

## The 3D cursor

On devices with a mouse (and without reduced motion) the pointer is an extruded arrow in thin-film iridescent chrome (`src/three/cursor3d.ts`). Its tip is the hotspot; it banks with the movement, and near anything clickable it grows, turns to point at it and spins, so buttons are easy to find. The 180 px canvas travels with the pointer instead of covering the page.

## The About portrait

A low-angle portrait, full width, right under the title: the letters sit on the photo's dark top, the hoodie fades out at the bottom, and the text follows the scene (`src/components/DepthImage.tsx`, one OGL shader; phones get a taller crop around the face). The photo is shown as it is, with depth and light:

- depth: the camera moves with the pointer (or circles on its own), so near parts slide against far ones. The depth map's head is flattened to one depth, so the face holds still as one piece instead of its features sliding against each other;
- light: the pointer is a lamp above the photo. What faces it brightens (normals from the depth map, smoothed), and the skin glints; away from it the photo stays, a little dimmer, never black;
- the maps are prepared offline (`scripts/prepare-portrait.py`): one texture packs the parallax depth with the normals, another says where the skin glints. The canvas never renders finer than the photo itself.

The text opens with a hello: "Hi, my name is Bogdan Nenadović, but online I’m known as SUNLUCKI". Hovering the handle writes a violet "Why?" above it in Caveat (only those four glyphs are loaded; on touch screens it is always there). Clicking the handle scatters every letter of the text out from it (Web Animations), and the handle's story comes up in their place; "Got it" (or Escape) gathers the letters back, landing with a little bounce (`Story` in `src/sections/AboutSection.tsx`).

## The numbers

Right after About, "Here are the numbers" (`src/sections/NumbersSection.tsx`, figures in `NUMBERS` in `src/content.ts`). The heading's letters scatter from the cursor and bounce back a second later (`src/components/ScatterText.tsx`, after React Bits Pro's Text Scatter; Web Animations, no library). Below it a drum turns as the page scrolls (after 3D Text Reveal): the stage sticks while the section scrolls past, a number on every face, on the rim of a cylinder in CSS 3D whose angle follows the scroll, eased. As a number comes round to the front it races up to its value, blurred and stretched with trailing copies while it is fast, then settles sharp (`src/components/SpeedNumber.tsx`, after Speeding Text); a number under 10 spins its digit through two laps first. A number that goes back down below the front resets, so it races again. The hours count from 1 January 2016 up to the day the page is opened, at Bogdan's 8 to 10 hours a day, 4 to 6 days a week, taken at the middle (45 a week) and rounded down to the thousand. With reduced motion the numbers are a plain list.

## The contact scene

"Let's talk" is a call: a small React Three Fiber scene, loaded when the browser is idle after load (the original render is shown until it is ready, and stays if WebGL is unavailable):

- an iPhone 17 Pro Max model (recoloured to Deep Blue, meshopt-compressed) lies on a reflective floor; its lock screen is drawn on a canvas and rendered over-bright so the bloom pass turns it into a light source;
- a ray-marched box of light rises from the screen — dense right above it, spreading and fading with height;
- Bogdan, lifted out of the render with Apple Vision, floats above it as a billboard. He is printed as a 1-bit Atkinson dither in texture space (after React Bits' Dither Veil); the cursor burns a trail through to the photo, and each cell knits back at its own threshold;
- the camera orbits a few degrees with the pointer and sways on its own, so the depth reads on touch screens too.

Four R3F canvases live on the page: the manifesto, this one, the particle scene behind the Mobile Apps, Graphics and Video sections, and the music stage; only the first two post-process. `@react-three/postprocessing` sizes a new composer from a size vector shared by all composers, so one canvas could come up at the other's size; `src/three/KeepSize.tsx` puts the renderer back.

## The stack section

Eight React Bits Folder Float folders (Frontend, Backend, iOS, AI, Fintech, DevOps, Design, Media). A folder opens on hover — on touch screens on tap — and its tools spring out as notes that can be dragged around (matter-js). Wide screens get a 4 × 2 shelf with room above each row for the notes; narrow screens a swipeable row whose middle folder opens by itself. The list lives in `STACK` in `src/content.ts` and only names tools the repositories actually show.

## The projects

Sticky cards that stack as the page scrolls, each named by the system it is (the product or the client in the line above). Four of them play the product's promo live in one wide window, in place of the screenshots: SIMBIA's 2D films (Remotion compositions, 1920 × 1080 at 30 fps, every frame a pure function of its number), in `@remotion/player`, muted, looping, covering the window. Only the card on top plays; the others show a screenshot, and a promo goes on from where it left off when its card comes back on top. Over the film, a chapter for each scenario jumps there (the one playing is lit); below it, play/pause and the progress, which seeks. Remotion, the films and Inter load as the section comes near (`src/promo/Promo.tsx`, about 340 KB gzipped); three.js they share with the manifesto. The films play in English (`inputProps={{ lang: 'en' }}`).

The WordPress sites' card turns through the sites instead (`public/work/wp-*.webp`, made by `scripts/prepare-media.py`), the ones with a demo film first: each its film, Bogdan's own mockups easing in a little closer, then its pages scrolling on a MacBook drawn in CSS, with a pill per site and a link to each site that is still live.

`src/promo/saas` and `src/promo/oner` are copied from the SIMBIA repo (branch `promo/wideo-2d` at `2ba662f`: `Claude outputs/promo-remotion/src/saas` without `compositions.tsx` and `kit/Demo.tsx`, and the 16 files of `packages/oner/src` it needs), changed only where this app needs it: the paths to oner, and one unused render-prop parameter renamed (`b2b/Mobile.tsx`). They are linted at the source, not here (`.oxlintrc.json`). To update, copy them again from the branch.

## Mobile apps

A section of its own after the web projects (`src/sections/AppsSection.tsx`, apps in `MOBILE_APPS` in `src/content.ts`). The contact scene's iPhone gathers out of particles strewn round its place as the section comes up and becomes the model, as the About portrait does out of the manifesto's, and each app's screens show on its display, a new one pushing in from the right as in iOS; a new app turns the phone round, its back to the camera while the screen changes. Beside the phone the apps are a deck of cards drawn like the web projects' (the number, the app's tagline and name, its screens as pills, each a jump to it); everything about an app is on its card, and under the deck there are only the arrows and DRAG THE CARDS: drag the top card aside, or use the arrows, and it slides under the deck while the phone turns to the next app. The phone is the contact scene's model in silver, as the iPhone 17 Pro comes in it (a light aluminium unibody, white glass on its back): its palette's blue swatches and the photo on its camera plateau are repainted on copies of its textures as it loads. The display's own UVs are shifted, with a seam, so the screens are laid across its face by position instead. The screens are real iOS Simulator captures with demo data (iApply and TAXI BOSS on local demo servers, CashFlow offline), kept in the knowledge base (`sources/screens/apps`) and cut to 640 wide by `scripts/prepare-media.py`. SIMBIA CRM's app is left out: it is Russian only and shows live data only.

The phone is not the section's own: one particle scene (`src/three/FlowScene.tsx`) sits behind the Mobile Apps, Graphics, Video and Music sections (`src/sections/FlowSections.tsx`, a canvas the size of the screen, sticky behind them and taking no room), so the same particles can travel. Scrolled on, the phone breaks up again, its particles drift up behind the Graphics covers as a slow cloud and land on the Video section's first films, which then show; on phones they build the iPhone again in the Video section instead. Everything is driven by where the sections are on the screen (`[data-flow]` attributes, read every frame) and eased; what the sections tell the scene (the screen on the phone, the film's picture, PLAY tapped) goes through `src/three/flow.ts`. The points are spread over the model's surfaces by area (`MeshSurfaceSampler`).

## Graphics

Branding, print and social media, no websites: rows of covers that slide slowly in alternating directions as the page scrolls (`src/sections/MarqueeSection.tsx`, covers in `TILES` in `src/content.ts`, cut to 840 × 540 by `scripts/prepare-media.py`, some from a closer crop). Behind them drifts the cloud of particles the Mobile Apps iPhone broke into, on its way to the Video section. The covers are solid, so the particles pass behind them and never show through; the first and last rows fade into the page with a shade in its colour rather than a mask.

## Video

Under the title, the views of his videos on YouTube, TikTok and Instagram in a row (`VIDEO_VIEWS` in `src/content.ts`; YouTube's counted, the others as he gives them), each with its icon, fading in as the row comes into view, each count's digits on drums like a counter's (`src/components/DrumNumber.tsx`: every digit a wheel of 0 to 9 that spins a few turns and settles, the wheels stopping one after another from the left, the digits either side showing faintly above and below; each face is turned on its own, since Safari flattens a shared 3D space under some styles). Below, on tablets and desktops, Bogdan's films in a masonry grid (`src/sections/VideoSection.tsx`), each at its own shape, dealt to the shortest column so the order still reads across (three columns, two on tablets); the first ones in view are built out of the particles coming from the Mobile Apps section, and show once they are. A film shows its poster; hovered, it loads a strip of ten of its frames, one small image, and flips through them. Clicked, it plays on the full screen with its sound (the Fullscreen API), and the music player stops.

Phones get no grid (too many films for a small screen): the particles build the iPhone there, its screen showing the films as a grid like a profile's (three across, each 9:16, the last row cut off: there are more), and PLAY, red, gathers out of particles with it in the middle of its screen, standing out in front of the phone and beating, over "Tap to play the videos" (the section's button is its hit area; without WebGL, the button shows itself). Tapped, the first film starts in the tap itself (so it plays with its sound), PLAY bursts at the camera and the phone flies at it, over the whole page, until its display fills the view, its picture splitting into red, green and blue; then the feed opens (`src/sections/VideoFeed.tsx`), like TikTok's: one film at a time on the whole screen, swipe up for the next and down for the one before. Swiped, the film breaks into particles that follow the finger away while the next one's gather from the other side (a grid of points in raw three.js over the film, only while it moves: the frame on the screen and the next film's poster). A tap pauses or plays; the play buttons and the timeline, a line of particles like the music stage's rim, touched or dragged to seek, are red. YouTube's films play in YouTube's player driven through its IFrame API (privacy-enhanced), the picture's size so its own title stays on the picture. While the feed is open the scene behind stops drawing. Closed, the feed flies back into the phone's screen. When it is over (the last film has played, or is swiped past) it flies back the same way and the page glides on to the Music section, the phone breaking up into the particles that build the Music stage's floor.

`scripts/prepare-media.py` makes, from `~/Desktop/Видео`, an H.264 film for each (1080p and 30 fps at most, AAC), its poster and its strip (`public/video/`, kept out of git like the music) and the list in `src/videos.json`.

## Music

A player for Bogdan's music (`src/sections/MusicSection.tsx`): 131 tracks, fifteen in his order, then the rest of his LUCKI BEATS album mixed, the short beats spread out between the full tracks; titles in English and without "Beat". Play, skip, seek, the next track when one ends, and the phone's lock screen and media keys (Media Session). The tracks are his AAC masters from his Music library, copied as they are, only moved to stream from the first byte (WAV and MP3 become AAC at 256 kbps); `scripts/prepare-media.py` writes them to `public/music/NNN.m4a` (about 750 MB) and the list to `src/music.json`. They are kept out of git (`.gitignore`) and reach the server with the deploy, from this Mac.

On the left, his stage (`src/three/MusicStage.tsx`, loaded as the section comes near, drawn only while on screen): Bogdan in his headphones (his cut-out, `public/about/listening.webp`, shown as it is) stands still, the camera fixed where the photo was taken, on a flattened cloud of blue particles centred on the point between his feet. The music plays straight from an `<audio>` element, so a phone keeps playing it with the screen locked (sound run through Web Audio stops there); the cloud moves to the track's spectrum, worked out beforehand by `scripts/prepare-bands.mjs` as the page's analyser would have heard it (48 bands, 30 frames a second, `public/music/NNN.bands`, about 32 MB, kept out of git and deployed with the music): the loudness of the last two and a half seconds runs out from under his feet to the edge (a 150-sample texture read by radius), so every hit leaves him as a bright wave that lifts the particles it passes; every band of the spectrum sets the cloud rippling along its own axis, the bass in broad slow swells and the highs in fine quick ones; the louder it plays, the faster it swirls. With no music it breathes. Only the cloud answers the pointer: it turns about its own axis, under his feet, as the pointer moves across the stage.

The floor's rim and PLAY are built by the particles coming from the Video section (from the phone on phones, from the films on desktops, raining down from them): the particle scene lands them where the stage draws its own (`src/three/musicFloor.ts` shares the floor, PLAY's triangle and the camera), and the stage's floor shows in their place.

On the right, the tracks as cards like the projects' only smaller (`Playlist`, Framer Motion): folded to a strip, the one at the list's middle (or under the pointer, or focused) open, the one that plays lit blue; an open card grows as much up as down, its neighbours making way on both sides, so the middle holds still as the list scrolls, and every change springs with a bounce. When the scroll stops, the nearest card settles into the middle; the track that plays comes there by itself. The list fades out at its top and bottom.

## Languages and search engines

The site speaks English, Russian, Ukrainian, Polish, German, Italian and French. Every word is in `src/i18n/`: `en.ts` is the source, the others are translations of it, key for key (their type is English's, so a missing or extra key fails the build). `src/i18n/index.ts` picks the language: at `/ru/`, `/uk/` and so on that one; at `/` the one the visitor picked last in the language menu (in the hero's nav, and as links in the footer), or else the first of their device's languages the site speaks, or else English. Only that language's words are loaded. Russian and Ukrainian are set in Montserrat, as Kanit has no Cyrillic; numbers are written the language's way (`Intl`).

Each language has its own page for search engines: the build (`vite.config.ts`) writes `index.html` for English and `/ru/index.html` and the rest, each with its title and description, a canonical link, `hreflang` links to all the others (and `x-default` to `/`), Open Graph and Twitter cards, and schema.org data about Bogdan (Person, WebSite, ProfilePage); plus `sitemap.xml` with every page and its translations, which `public/robots.txt` points to. The key file for IndexNow (Bing, Yandex and the others that share it) is `public/<key>.txt`; after a deploy that changes the words, the pages can be sent to `https://api.indexnow.org/indexnow` with that key.

## Project layout

```
src/
  content.ts            all project data, its words from i18n/
  i18n/                 the words in every language (en.ts the source), the language picked (index.ts), the list (langs.ts)
  heroMotion.json       per-frame camera zoom for the hero morph (generated)
  components/           DepthImage (+ coverCrop), FadeIn, Magnet, AnimatedText, ScatterText, SpeedNumber, DrumNumber, SectionTitle, buttons
  heroPupil.json        the pupil's centre and radius in the hero's last frames (generated)
  promo/                the products' promos in the project cards (Promo.tsx; saas/ and oner/ copied from SIMBIA)
  sections/             Hero (+ heroVeil.ts), Manifesto, About, Numbers, Stack, Services, Projects, FlowSections (Apps, Marquee = Graphics, Video + VideoFeed, Music), Contact
  three/                PhoneScene, ManifestoScene (+ earth.ts, aboutStage.ts, KeepSize), FlowScene (+ flow.ts), noise.ts, MusicStage (+ musicFloor.ts), cursor3d
  vendor/react-bits/    Micro Slats, Tech Text, Folder Float (unmodified but for one renamed parameter)
scripts/
  prepare-media.py      builds hero frames (+ Vision cut-outs), card images, the WordPress slides and films, marquee tiles, icons and the music from local sources
  cutout.swift          Apple Vision foreground mask → full-frame transparent PNGs
  estimate-motion.py    camera zoom between hero frames + the pupil per frame (needs opencv-python-headless, numpy)
  prepare-about.py      phone scene assets (cut-out, poster, recoloured iPhone model)
  prepare-portrait.py   About portrait assets (photo, packed depth + normals, glint map)
  prepare-lights.py     the Earth's night lights for the manifesto (NASA Black Marble → 720×360)
  prepare-models.py     the manifesto's heart, brain and bulb with hands, baked from models into point sets
  prepare-bands.mjs     each track's spectrum for the music stage (needs ffmpeg)
  qa-shots.mjs          headless-Chrome visual QA (desktop 1440 px + mobile 390 px) over the DevTools protocol
public/                 generated media (hero/, work/, tiles/, about/, models/; music/ and video/ not in git)
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
- 3D models baked into the manifesto's particles: ["Realistic Human Heart"](https://sketchfab.com/3d-models/realistic-human-heart-3f8072336ce94d18b3d0d055a1ece089) by [neshallads](https://sketchfab.com/neshallads) and ["Low-Poly Human Brain Model"](https://sketchfab.com/3d-models/low-poly-human-brain-model-781330cf8c6e40508f0de62e2fef8dec) by [moaazzizo123](https://sketchfab.com/moaazzizo123), both [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Only point sets reach the site (`scripts/prepare-models.py`).
- [React Bits](https://reactbits.dev) by David Haz — Micro Slats, Tech Text and Folder Float (MIT + Commons Clause); the dithered figures are modelled on Dither Veil and the manifesto's flicker on Electric Logo. The numbers are modelled on [React Bits Pro](https://pro.reactbits.dev)'s Text Scatter, 3D Text Reveal and Speeding Text, written from scratch here.
- [Lucide](https://lucide.dev) icons (ISC).
- The Earth at night: NASA Earth Observatory, [Black Marble 2016](https://earthobservatory.nasa.gov/features/NightLights) (Suomi NPP VIIRS; public domain).
- 3D simplex noise from [ashima/webgl-noise](https://github.com/ashima/webgl-noise) (Ashima Arts, Ian McEwan; MIT).

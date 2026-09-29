/**
 * What the About section's stage shares with the manifesto (ManifestoScene.tsx): at the end of the manifesto
 * its particles assemble the portrait exactly where the stage is about to show it (DepthImage), so both take
 * the photo and its framing from here. No three.js in here: the section components import it too.
 */

export const PORTRAIT = {
  image: '/about/portrait.webp',
  depth: '/about/portrait-depth.webp',
  specular: '/about/portrait-specular.webp',
  aspect: 1536 / 1024,
  focus: [0.44, 0.33] as const, // the face: kept in frame when the stage crops the photo, circled by the idle light
  // The stage fades out over its outer `side` share at the left and right, and from `bottom` down; the
  // particles that assemble it fade the same way, so the bottom of the photo stays dark throughout.
  feather: { side: 0.06, bottom: 0.62 },
};

// The manifesto's hand-over: 0 while its particles still fly, 1 once the portrait shows. Until then the
// portrait holds still (no parallax, the light at rest), so it matches the particles that land on it.
export const handoff = { reveal: 1 };

// Scroll length of the hand-over: from the About section's top entering the viewport until its stage is
// centred in it (rects from getBoundingClientRect, `vh` the viewport height).
export const handoffLength = (section: DOMRect, stage: DOMRect, vh: number) => (vh + stage.height) / 2 + (stage.top - section.top);

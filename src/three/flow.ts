/**
 * What the Mobile Apps, Graphics and Video sections share with the particle scene behind them
 * (three/FlowScene.tsx): the iPhone is built of particles in the Apps section and becomes the model, breaks up
 * again as the page scrolls on, its particles fly behind the Graphics covers and build the Video section's first
 * films (on phones, the iPhone again, with PLAY over it). No three.js in here: the sections import it.
 *
 * The scene finds its places by these attributes: [data-flow="apps"] (the Apps section's stage for the phone),
 * [data-flow="graphics"] (the Graphics section), [data-flow="films"] (the Video section's grid; its first films,
 * [data-film], are the ones the particles build), on phones [data-flow="phone"] (the Video section's stage) and
 * [data-flow="music"] (the Music section's stage, whose floor the particles build last).
 */
export const flow = {
  // the Apps section's phone: its screens, the one on it, and which app's it is
  phone: { images: [] as string[], shown: 0, app: 0 },
  // phones: the films' pictures, for the Video section's iPhone to show as a grid on its screen
  posters: [] as string[],
  // phones: PLAY tapped (the time it was, performance.now()); the scene flies into the screen, then calls `flown`
  fly: 0,
  flown: null as (() => void) | null,
  // phones: the feed closed (the time it was); the scene flies back out of the screen, then calls `landed`
  back: 0,
  landed: null as (() => void) | null,
  // the Music stage's floor: how far the particles have built it (whole without the scene), and its turn and its
  // button (0 PLAY, 1 the whole floor as the music plays), the stage's, for the particles to land where it draws
  music: { built: 1, turn: 0, morph: 0 },
  // phones: where the scene is (FlowSections' own): behind the page, over it (the phone flying into the screen) or
  // under the feed (nothing of it shows: it stops drawing)
  layer: null as ((layer: FlowLayer) => void) | null,
};
export type FlowLayer = 'page' | 'fly' | 'feed';

// Is this a phone? Its Video section is the iPhone and the full-screen feed, not the grid of films.
export const phoneLayout = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

/**
 * What the About scene (AboutScene.tsx) shares with the manifesto (ManifestoScene.tsx): at the end of the
 * manifesto its particles assemble the About scene exactly where the About canvas is about to draw it,
 * so both build the scene from these numbers. No three.js in here: the section components import it too.
 */

export const PHONE_SCALE = 1.8;
export const PHONE_YAW = 1.13; // top of the phone points away and to the right, like the original render
export const SCREEN_Y = 0.0887 * PHONE_SCALE; // screen surface above the floor
// Screen footprint in the phone group's space (long side along X), centred on the origin.
export const SCREEN_LENGTH = 1.663 * PHONE_SCALE;
export const SCREEN_WIDTH = 0.776 * PHONE_SCALE;
export const FIGURE_HEIGHT = 2.4;
export const FIGURE_ASPECT = 816 / 1320; // public/about/floating.webp
export const FIGURE_BASE = [0.05, SCREEN_Y + 0.4, 0.2] as const; // feet, floating above the middle of the screen
export const FIGURE_ROWS = 300; // rows of the figure's dither print
export const CAMERA_TARGET = [0.1, 1.15, -0.1] as const;
export const CAMERA_FOV = 32;
export const CAMERA_ELEVATION = 0.28; // radians above the target, at rest

// Narrow canvases step back to keep the phone in frame.
export const cameraDistance = (aspect: number) => 7.8 * Math.max(1, Math.pow(0.8 / aspect, 0.7));

// The manifesto's hand-over: 0 while its particles still fly, 1 once the About scene shows. Until then
// the About camera holds its resting pose, the one the particles are aimed through.
export const handoff = { reveal: 1 };

// Scroll length of the hand-over: from the About section's top entering the viewport until its stage is
// centred in it (rects from getBoundingClientRect, `vh` the viewport height).
export const handoffLength = (section: DOMRect, stage: DOMRect, vh: number) => (vh + stage.height) / 2 + (stage.top - section.top);

// Error-diffused (Atkinson) 1-bit print of the figure: R = dot, A = inside the silhouette. `dots` marks
// the printed dots, the only cells the About scene draws light.
export function ditherPrint(image: HTMLImageElement, rows: number) {
  const cols = Math.round((rows * image.naturalWidth) / image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, cols, rows);
  const pixels = ctx.getImageData(0, 0, cols, rows);
  const px = pixels.data;
  const level = new Float32Array(cols * rows);
  for (let i = 0; i < level.length; i++) {
    const l = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
    level[i] = 0.1 + 0.9 * Math.pow(l, 0.8); // lift the shadows so the dark hoodie keeps a sparse print
  }
  const spread = [
    [1, 0],
    [2, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [0, 2],
  ];
  const dots = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const dot = level[i] > 0.5 ? 1 : 0;
      const error = (level[i] - dot) / 8;
      for (const [dx, dy] of spread) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < cols && ny < rows) level[ny * cols + nx] += error;
      }
      px[i * 4] = dot * 255;
      px[i * 4 + 3] = px[i * 4 + 3] > 128 ? 255 : 0;
      dots[i] = dot && px[i * 4 + 3] ? 1 : 0;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return { canvas, cols, rows, dots };
}

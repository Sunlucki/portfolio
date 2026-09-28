import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';

/**
 * The hero cut-out as React Bits' Dither Veil: a 1-bit print (ordered dither, since the frames change
 * while scrolling) that the pointer burns through to the photo, each cell knitting back at its own
 * threshold. Around the silhouette the colour channels split — a lens-like chromatic aberration that
 * also hides the rough edges of the cut-out; it grows with scroll speed.
 *
 * The frames are composited on a 2D canvas (`source`) as before; this pass draws it through the shader.
 */

const TRAIL_W = 128;
const LINGER = 1; // seconds for a burnt-through cell to knit back (Dither Veil's default)

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tSource;
  uniform sampler2D tTrail;
  uniform vec2 uResolution;
  uniform float uCell;
  uniform float uAberration;
  uniform vec3 uInk;
  uniform vec3 uPaper;
  uniform vec3 uRim;
  varying vec2 vUv;

  float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // One sample of the figure: the print, burnt through to the photo where the trail is hot enough.
  vec4 figure(vec2 uv, vec2 cell, float threshold) {
    vec4 src = texture2D(tSource, uv);
    float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
    lum = clamp((lum - 0.5) * 1.15 + 0.5, 0.0, 1.0);
    vec3 print = mix(uInk, uPaper, step(bayer8(cell), lum));
    float trail = texture2D(tTrail, uv).r;
    float shown = step(threshold, trail);
    float rim = step(threshold - 0.12, trail) - shown;
    return vec4(mix(mix(print, uRim, rim), src.rgb, shown), src.a);
  }

  void main() {
    vec2 cell = floor(vUv * uResolution / uCell);
    float threshold = 0.16 + 0.78 * hash(cell);
    // Near the contour a ring of samples sees transparency: 0 deep inside, 1 at the edge.
    float inside = 1.0;
    for (int k = 0; k < 8; k++) {
      float angle = float(k) * 0.7853982;
      inside = min(inside, texture2D(tSource, vUv + vec2(cos(angle), sin(angle)) * uAberration * 1.6 / uResolution).a);
    }
    vec2 offset = normalize(vUv - vec2(0.5, 0.42) + 1e-5) * uAberration * (1.0 - inside) / uResolution;
    vec4 r = figure(vUv + offset, cell, threshold);
    vec4 g = figure(vUv, cell, threshold);
    vec4 b = figure(vUv - offset, cell, threshold);
    gl_FragColor = vec4(r.r * r.a, g.g * g.a, b.b * b.a, max(max(r.a, g.a), b.a));
  }
`;

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export function createHeroVeil(canvas: HTMLCanvasElement, source: HTMLCanvasElement) {
  const renderer = new Renderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  canvas.style.width = canvas.style.height = ''; // OGL sizes it to 300×150 inline; the page's CSS sizes it
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  const sourceTexture = new Texture(gl, { image: source, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });
  let trailH = 80;
  let trail = new Uint8Array(TRAIL_W * trailH * 4);
  const trailTexture = new Texture(gl, {
    image: trail,
    width: TRAIL_W,
    height: trailH,
    flipY: false,
    generateMipmaps: false,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
  });
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      tSource: { value: sourceTexture },
      tTrail: { value: trailTexture },
      uResolution: { value: [1, 1] },
      uCell: { value: 2 },
      uAberration: { value: 4 },
      uInk: { value: rgb('#050b1d') },
      uPaper: { value: rgb('#dbe8ff') },
      uRim: { value: rgb('#4f8dff') },
    },
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  let dpr = 1;
  let cssW = 1;
  let cssH = 1;
  let radius = 170; // CSS px
  let last: { x: number; y: number } | null = null;

  return {
    /** Canvas size in CSS px and the pixel ratio for both this canvas and the source canvas. */
    resize(width: number, height: number, pixelRatio: number) {
      cssW = Math.max(1, width);
      cssH = Math.max(1, height);
      dpr = pixelRatio;
      renderer.dpr = dpr;
      renderer.setSize(cssW, cssH);
      canvas.style.width = '';
      canvas.style.height = '';
      program.uniforms.uResolution.value = [cssW * dpr, cssH * dpr];
      program.uniforms.uCell.value = Math.max(2, Math.round(2.5 * dpr));
      radius = Math.min(200, cssW * 0.24);
      trailH = Math.max(1, Math.round((TRAIL_W * cssH) / cssW));
      trail = new Uint8Array(TRAIL_W * trailH * 4);
      trailTexture.image = trail;
      trailTexture.width = TRAIL_W;
      trailTexture.height = trailH;
      trailTexture.needsUpdate = true;
      last = null;
    },

    /**
     * Advances the trail: fades what was burnt, then burns a soft line from the last pointer position
     * (CSS px inside the canvas, or null when there is none). Returns whether anything is still lit.
     */
    step(dt: number, pointer: { x: number; y: number } | null) {
      const fade = Math.ceil((255 * dt) / LINGER);
      let lit = false;
      for (let i = 0; i < trail.length; i += 4) {
        if (trail[i]) {
          trail[i] = Math.max(0, trail[i] - fade);
          lit = true;
        }
      }
      if (pointer) {
        const scale = TRAIL_W / cssW;
        const r = radius * scale;
        const bx = pointer.x * scale;
        const by = (cssH - pointer.y) * scale; // trail rows run bottom-up, like the texture
        const ax = last ? last.x : bx;
        const ay = last ? last.y : by;
        const dx = bx - ax;
        const dy = by - ay;
        const len2 = dx * dx + dy * dy || 1;
        for (let y = Math.max(0, Math.floor(Math.min(ay, by) - r)); y < Math.min(trailH, Math.ceil(Math.max(ay, by) + r)); y++) {
          for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - r)); x < Math.min(TRAIL_W, Math.ceil(Math.max(ax, bx) + r)); x++) {
            const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / len2));
            const d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
            const v = Math.round(255 * Math.min(1, Math.max(0, (r - d) / (r * 0.6))));
            const i = (y * TRAIL_W + x) * 4;
            if (v > trail[i]) trail[i] = v;
          }
        }
        last = { x: bx, y: by };
        lit = true;
      } else {
        last = null;
      }
      trailTexture.needsUpdate = true;
      return lit;
    },

    /** Draws the current source frame; `aberration` is the edge split in CSS px. */
    render(sourceChanged: boolean, aberration: number) {
      if (sourceChanged) sourceTexture.needsUpdate = true;
      program.uniforms.uAberration.value = aberration * dpr;
      renderer.render({ scene: mesh });
    },

    // Frees the GPU resources but keeps the context: the canvas element stays mounted (and React's
    // StrictMode re-runs the effect on it), and a lost context cannot be restored on the same canvas.
    destroy() {
      gl.deleteTexture(sourceTexture.texture);
      gl.deleteTexture(trailTexture.texture);
      program.remove();
    },
  };
}

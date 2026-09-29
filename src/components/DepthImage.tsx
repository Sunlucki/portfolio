import { useEffect, useRef, type CSSProperties } from 'react';
import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
import { coverCrop } from './coverCrop';

/**
 * A photo with depth and a light that follows the pointer (or circles `focus` slowly while there is none).
 * The camera moves with the light, so the near parts slide one way and the far parts the other around the
 * depth that stays put. The light brightens what faces it and glints on the skin; away from it the photo
 * stays as it is, a little dimmer. Its blacks settle on `background`, the page colour.
 *
 * `depthMap` packs the depth for the parallax (r) with the surface normal (g, b); `specularMap` says where the
 * light glints (scripts/prepare-portrait.py makes both). The photo covers the container like object-fit: cover
 * with object-position at `focus` (coverCrop). While `hold.reveal` is below 1 the camera and the light rest.
 * Nothing loads until the container is within a few screens, and it only draws while visible.
 */

const SHIFT = [0.03, 0.02]; // camera travel with the light at the edge of the screen: share of the photo per unit of depth
const FOLLOW = 0.08; // share of the way to the pointer the light moves per 60 fps frame
const ELEVATION = 0.3; // of the light above the photo, in photo heights
const REST = [0.15, 0.12]; // the light at rest, from the focus: up and to the right, where the photo's own key light is
const ORBIT = 0.22; // radius of the idle circle round the focus, in photo heights
const ORBIT_SECONDS = 10;
const IDLE_AFTER = 2500; // ms without pointer movement before the light circles on its own

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
  uniform sampler2D tImage;
  uniform sampler2D tDepth;
  uniform sampler2D tSpecular;
  uniform vec4 uCrop; // the part of the photo on the canvas: offset and size, in uv
  uniform vec2 uShift;
  uniform vec3 uLight; // over the photo: u, v (up) and its height, in photo heights
  uniform float uAspect;
  uniform vec3 uBackground;
  varying vec2 vUv;

  const float STILL = 0.5; // the depth that stays put: the head, flattened to it in the depth map
  const float BASE = 0.72; // the photo away from the light
  const float GAIN = 0.75; // added where the surface faces the light
  const float GLINT = 0.45;
  const float SHINE = 28.0;
  const float RADIUS = 0.45; // of the light's pool, in photo heights
  const float KNEE = 0.8; // above it highlights roll off instead of clipping

  void main() {
    // The point of the photo that lands on this pixel: near parts move against the camera, far parts with
    // it. A few fixed-point steps settle on the depth found there.
    vec2 base = uCrop.xy + vUv * uCrop.zw;
    vec2 uv = base;
    for (int i = 0; i < 4; i++) uv = base + uShift * (texture2D(tDepth, uv).r - STILL);
    vec3 photo = texture2D(tImage, uv).rgb;

    vec2 nxy = texture2D(tDepth, uv).gb * 2.0 - 1.0;
    vec3 n = vec3(nxy, sqrt(max(0.0, 1.0 - dot(nxy, nxy))));
    vec3 toLight = vec3((uLight.xy - uv) * vec2(uAspect, 1.0), uLight.z);
    vec3 l = normalize(toLight);
    float pool = 1.0 / (1.0 + dot(toLight.xy, toLight.xy) / (RADIUS * RADIUS));
    float diffuse = max(dot(n, l), 0.0) * pool;
    float glint = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), SHINE) * GLINT * pool * texture2D(tSpecular, uv).r;

    vec3 lit = photo * (BASE + GAIN * diffuse) + glint;
    lit = min(lit, KNEE) + (1.0 - KNEE) * (1.0 - exp(-max(lit - KNEE, 0.0) / (1.0 - KNEE)));
    gl_FragColor = vec4(uBackground + (1.0 - uBackground) * lit, 1.0);
  }
`;

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const load = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.decode().then(() => resolve(img), reject);
  });

type Props = {
  image: string;
  depthMap: string;
  specularMap: string;
  /** Where the photo is framed when it is cropped, and the point the idle light circles: 0..1 from the top left. */
  focus?: readonly [number, number];
  /** While `reveal` is below 1 (something is being handed over to the photo), the camera and the light rest. */
  hold?: { reveal: number };
  background?: string;
  className?: string;
  style?: CSSProperties;
};

export function DepthImage({ image, depthMap, specularMap, focus = [0.5, 0.5], hold, background = '#000000', className = '', style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusX, focusY] = focus;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let alive = true;
    let stop = () => {};
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        Promise.all([load(image), load(depthMap), load(specularMap)])
          .then((images) => {
            if (alive) stop = run(container, images, [focusX, focusY], hold, rgb(background));
          })
          .catch(() => {});
      },
      { rootMargin: '300% 0px' },
    );
    near.observe(container);
    return () => {
      alive = false;
      near.disconnect();
      stop();
    };
  }, [image, depthMap, specularMap, focusX, focusY, hold, background]);

  return <div ref={containerRef} aria-hidden className={className} style={style} />;
}

function run(
  container: HTMLElement,
  [photo, depth, specular]: HTMLImageElement[],
  focus: [number, number],
  hold: { reveal: number } | undefined,
  background: number[],
) {
  let renderer: Renderer;
  try {
    renderer = new Renderer({ alpha: false, antialias: false, depth: false });
  } catch {
    return () => {}; // no WebGL: whatever is underneath stays
  }
  const gl = renderer.gl;
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE); // the maps are data, not colours
  const canvas = gl.canvas as HTMLCanvasElement;
  canvas.style.width = canvas.style.height = ''; // OGL sets them inline; the page's CSS sizes the canvas
  canvas.className = 'block h-full w-full opacity-0 transition-opacity duration-1000';
  container.appendChild(canvas);

  const aspect = photo.naturalWidth / photo.naturalHeight;
  const linear = { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR };
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      tImage: { value: new Texture(gl, { image: photo, ...linear }) },
      tDepth: { value: new Texture(gl, { image: depth, ...linear }) },
      tSpecular: { value: new Texture(gl, { image: specular, ...linear }) },
      uCrop: { value: [0, 0, 1, 1] },
      uShift: { value: [0, 0] },
      uLight: { value: [0, 0, ELEVATION] },
      uAspect: { value: aspect },
      uBackground: { value: background },
    },
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const crop = program.uniforms.uCrop.value as number[];
  const shift = program.uniforms.uShift.value as number[];
  const light = program.uniforms.uLight.value as number[];

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    crop.splice(0, 4, ...coverCrop(width / height, aspect, focus));
    // No finer than the photo itself: a big stage is upscaled by the browser instead of by the shader.
    renderer.dpr = Math.min(window.devicePixelRatio || 1, 1.5, (photo.naturalWidth * crop[2]) / width);
    renderer.setSize(width, height);
    canvas.style.width = canvas.style.height = '';
    wake();
  };

  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0, y: 0, at: -Infinity };
  const onPointer = (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.at = performance.now();
    wake();
  };

  // The light over the photo (u, v up) and the camera (-1..1 across the screen). At rest, and without
  // motion, the light stays up and to the right of the focus and the camera stays put.
  const face = [focus[0], 1 - focus[1]];
  const rest = [face[0] + REST[0] / aspect, face[1] + REST[1]];
  const aim = [...rest];
  const camera = [0, 0];
  let visible = false;
  let raf = 0;
  let last = 0;
  let shown = false;
  const tick = (now: number) => {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    if (motion) {
      const rect = canvas.getBoundingClientRect();
      const free = !hold || hold.reveal >= 0.999;
      // Towards the pointer while it moves, else round a slow circle.
      let u = rest[0];
      let v = rest[1];
      if (free && now - pointer.at < IDLE_AFTER) {
        u = crop[0] + ((pointer.x - rect.left) / rect.width) * crop[2];
        v = crop[1] + (1 - (pointer.y - rect.top) / rect.height) * crop[3];
      } else if (free) {
        const a = ((now / 1000) * Math.PI * 2) / ORBIT_SECONDS;
        u = face[0] + (Math.cos(a) * ORBIT) / aspect;
        v = face[1] + Math.sin(a) * ORBIT;
      }
      // The camera looks from where the light is on screen.
      const clamp = (x: number) => Math.max(-1, Math.min(1, x));
      const cx = free ? clamp(((rect.left + ((aim[0] - crop[0]) / crop[2]) * rect.width) / window.innerWidth) * 2 - 1) : 0;
      const cy = free ? clamp(((rect.top + (1 - (aim[1] - crop[1]) / crop[3]) * rect.height) / window.innerHeight) * 2 - 1) : 0;
      const k = 1 - Math.pow(1 - FOLLOW, dt * 60);
      aim[0] += (u - aim[0]) * k;
      aim[1] += (v - aim[1]) * k;
      camera[0] += (cx - camera[0]) * k;
      camera[1] += (cy - camera[1]) * k;
      shift[0] = camera[0] * SHIFT[0];
      shift[1] = -camera[1] * SHIFT[1]; // v runs up
    }
    light[0] = aim[0];
    light[1] = aim[1];
    renderer.render({ scene: mesh });
    if (!shown) {
      shown = true;
      canvas.style.opacity = '1';
    }
    if (motion) raf = requestAnimationFrame(tick);
  };
  function wake() {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  const sizes = new ResizeObserver(resize);
  sizes.observe(canvas);
  const seen = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  });
  seen.observe(canvas);
  window.addEventListener('pointermove', onPointer, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    sizes.disconnect();
    seen.disconnect();
    window.removeEventListener('pointermove', onPointer);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    canvas.remove();
  };
}

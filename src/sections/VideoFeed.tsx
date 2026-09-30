import { Pause, Play, X } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { t } from '../i18n';
import { NOISE_GLSL } from '../three/noise';

// The Video section's feed on phones, like TikTok's: one film at a time on the whole screen, with its sound; swipe
// up for the next, down for the one before. Swiped, the film breaks into particles that follow the finger away while
// the next one's gather from the other side (WebGL, over the film only while it moves). Tap to pause or play; the
// play buttons and the timeline, a line of particles like the music player's, are red. The feed is over when the
// last film has played or is swiped past: it closes as if closed, saying so (`onClose`'s `end`).

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const RED = '#FF2D55';

export type FeedFilm = { slug: string; title: string; credit?: string; width: number; height: number; seconds: number; youtube?: string; poster: string };
export type FeedHandle = { start: () => void };

// Tall films fill the screen; wide ones fit its width.
const covers = (film: FeedFilm) => film.height > film.width;
// Where the screen (0-1 across and down) shows in the film's picture: tex = (screen - xy) / zw.
function fit(film: FeedFilm, width: number, height: number) {
  const screen = width / height;
  const picture = film.width / film.height;
  if (covers(film)) {
    return picture > screen ? [(1 - picture / screen) / 2, 0, picture / screen, 1] : [0, (1 - screen / picture) / 2, 1, screen / picture];
  }
  const tall = screen / picture; // the picture's share of the screen's height
  return [0, (1 - tall) / 2, 1, tall];
}

// ——— the particles, for a swipe ———
const vertexShader = /* glsl */ `
  attribute vec2 aGrid; // where on the screen, 0-1 across and down
  attribute vec4 aRand; // x: its layer (0 the film leaving, 1 the one coming), the rest random
  uniform float uProgress, uWay, uTime, uSize;
  uniform vec4 uFitA, uFitB;
  varying vec2 vUv;
  varying float vAlpha, vLayer, vMove;
  ${NOISE_GLSL}
  void main() {
    float coming = step(0.5, aRand.x);
    // the rows at the swipe's front go first (up: the top ones), each particle a little in its own time
    float lead = uWay > 0.0 ? aGrid.y : 1.0 - aGrid.y;
    float own = clamp(uProgress * 1.7 - lead * 0.55 - aRand.y * 0.15, 0.0, 1.0);
    own = own * own * (3.0 - 2.0 * own);
    float apart = mix(own, 1.0 - own, coming); // how far from its place
    vec3 q = vec3(aGrid * 5.0, uTime * 0.6 + aRand.z * 3.0);
    vec2 p = aGrid + vec2(snoise(q), snoise(q + 11.0)) * 0.09 * apart;
    p.y -= uWay * mix(own, own - 1.0, coming) * 1.15;
    vUv = (aGrid - mix(uFitA.xy, uFitB.xy, coming)) / mix(uFitA.zw, uFitB.zw, coming);
    vAlpha = mix(1.0 - own * own, own, coming);
    vLayer = coming;
    vMove = apart * (1.0 - apart) * 4.0 + 0.6 * apart;
    gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
    gl_PointSize = uSize * (1.0 + 0.9 * vMove);
  }
`;
const fragmentShader = /* glsl */ `
  uniform sampler2D tA;
  uniform sampler2D tB;
  varying vec2 vUv;
  varying float vAlpha, vLayer, vMove;
  vec3 look(sampler2D t, vec2 uv, float split) {
    return vec3(texture2D(t, uv + vec2(split, 0.0)).r, texture2D(t, uv).g, texture2D(t, uv - vec2(split, 0.0)).b);
  }
  void main() {
    if (vUv.x < 0.0 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) discard;
    float r = length(gl_PointCoord - 0.5);
    float shape = mix(1.0, 1.0 - smoothstep(0.25, 0.5, r), clamp(vMove, 0.0, 1.0)); // square at rest, round in flight
    if (shape * vAlpha < 0.01) discard;
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    float split = 0.006 * clamp(vMove, 0.0, 1.0); // its colours pulled apart as it flies
    vec3 c = vLayer < 0.5 ? look(tA, uv, split) : look(tB, uv, split);
    gl_FragColor = vec4(c, vAlpha * shape);
  }
`;

function particles(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    uniforms: {
      tA: { value: null as THREE.Texture | null },
      tB: { value: null as THREE.Texture | null },
      uFitA: { value: new THREE.Vector4(0, 0, 1, 1) },
      uFitB: { value: new THREE.Vector4(0, 0, 1, 1) },
      uProgress: { value: 0 },
      uWay: { value: 1 },
      uTime: { value: 0 },
      uSize: { value: 4 },
    },
  });
  let points: THREE.Points | null = null;
  const resize = (width: number, height: number) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    const cols = 84;
    const rows = Math.round((cols * height) / width);
    const grid = new Float32Array(cols * rows * 2 * 2);
    const rand = new Float32Array(cols * rows * 2 * 4);
    let i = 0;
    for (let layer = 0; layer < 2; layer++) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++, i++) {
          grid.set([(x + 0.5) / cols, (y + 0.5) / rows], i * 2);
          rand.set([layer, Math.random(), Math.random(), Math.random()], i * 4);
        }
      }
    }
    if (points) {
      points.geometry.dispose();
      scene.remove(points);
    }
    const geometry = new THREE.BufferGeometry()
      .setAttribute('position', new THREE.BufferAttribute(new Float32Array(i * 3), 3))
      .setAttribute('aGrid', new THREE.BufferAttribute(grid, 2))
      .setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
    points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);
    material.uniforms.uSize.value = (width / cols) * dpr * 1.12;
  };
  return {
    material,
    resize,
    render: () => renderer.render(scene, camera),
    dispose: () => {
      points?.geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}

// ——— YouTube's films: its player without its controls, through its IFrame API ———
type YTPlayer = { playVideo(): void; pauseVideo(): void; seekTo(s: number, ahead: boolean): void; getCurrentTime(): number; getDuration(): number; destroy(): void };
type YTNamespace = { Player: new (el: HTMLElement, options: object) => YTPlayer };
let youtubeApi: Promise<YTNamespace> | null = null;
function loadYouTube() {
  const w = window as unknown as { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void };
  youtubeApi ??= new Promise((resolve) => {
    if (w.YT?.Player) return resolve(w.YT);
    w.onYouTubeIframeAPIReady = () => resolve(w.YT!);
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.append(script);
  });
  return youtubeApi;
}

// ——— the timeline: a line of red particles, lit as far as the film has played; touched or dragged, it seeks ———
const dots = new Map<string, HTMLCanvasElement>();
function dot(r: number, g: number, b: number) {
  const key = `${r},${g},${b}`;
  let sprite = dots.get(key);
  if (!sprite) {
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const ctx = sprite.getContext('2d')!;
    const glow = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    for (let i = 0; i <= 8; i++) glow.addColorStop(i / 8, `rgba(${r}, ${g}, ${b}, ${Math.exp(-((i / 8) ** 2) * 3.5) * (1 - i / 8)})`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 32, 32);
    dots.set(key, sprite);
  }
  return sprite;
}
function Timeline({ progress, playing, onSeek }: { progress: () => number; playing: boolean; onSeek: (at: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ progress, playing });
  useEffect(() => {
    live.current = { progress, playing };
  });
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d')!;
    const seeds = Array.from({ length: 420 }, () => [Math.random(), Math.random()]);
    let frame = 0;
    const draw = (now: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const [w, h] = [el.clientWidth, el.clientHeight];
      if (el.width !== Math.round(w * dpr)) [el.width, el.height] = [Math.round(w * dpr), Math.round(h * dpr)];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const at = clamp01(live.current.progress());
      const count = Math.min(seeds.length, Math.round(w / 1.1));
      const time = now / 1000;
      for (let i = 0; i < count; i++) {
        const a = i / count;
        const [seed, seed2] = seeds[i];
        const lit = clamp01((at - a) * 300);
        const head = at > 0 ? Math.exp(-(((a - at) * 40) ** 2)) : 0;
        const wave = Math.sin(a * 50 + time * 3) * (live.current.playing ? 1.6 : 0.5);
        const size = 5 + 4 * lit + 7 * head + seed2 * 2;
        const [r, g, b] = head > 0.3 ? [255, 160, 175] : lit ? [255, 45, 85] : [150, 30, 55];
        ctx.globalAlpha = Math.min(1, (lit ? 1 : 0.45) + 0.6 * head);
        ctx.drawImage(dot(r, g, b), 8 + a * (w - 16) - size / 2, h / 2 + (seed - 0.5) * 6 + wave * lit - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  const seek = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    onSeek(clamp01((e.clientX - box.left - 8) / (box.width - 16)));
  };
  return (
    <canvas
      ref={canvas}
      role="slider"
      aria-label={t.music.seek}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress() * 100)}
      data-control
      className="h-10 min-w-0 flex-1 touch-none"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        seek(e);
      }}
      onPointerMove={(e) => e.buttons && seek(e)}
    />
  );
}

// The feed. It is in the page (hidden) as soon as the Video section comes near, so `start` can play the first film
// in the very tap on PLAY (phones let a page play sound only in a tap); `open` shows it. It sits right in the body,
// over everything (the sections round it keep their own layers).
export const VideoFeed = forwardRef<FeedHandle, { films: FeedFilm[]; open: boolean; onClose: (end: boolean) => void }>(function VideoFeed({ films, open, onClose }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tube = useRef<YTPlayer | null>(null);
  const engine = useRef<ReturnType<typeof particles> | null>(null);
  const posters = useRef(new Map<string, THREE.Texture>());
  const snapshot = useRef<{ canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } | null>(null);
  const swipe = useRef({ y: 0, at: 0, moved: false, dragging: false, way: 1, progress: 0, anim: 0 });
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(true); // YouTube: until it plays, a tap goes to its own button
  const [moving, setMoving] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(films[0].seconds);
  const [swiped, setSwiped] = useState(false);
  const film = films[index];
  const last = index === films.length - 1;
  const over = useRef(() => {}); // the last film has played: the feed is over

  const source = (f: FeedFilm) => `/video/${f.slug}.mp4`;
  useImperativeHandle(
    ref,
    () => ({
      start: () => {
        const el = video.current;
        if (!el || films[index].youtube) return;
        if (el.getAttribute('src') !== source(films[index])) el.src = source(films[index]);
        el.currentTime = 0;
        void el.play().catch(() => {});
      },
    }),
    [films, index],
  );

  // open: the page stays put behind; closed: the film stops
  useEffect(() => {
    if (!open) {
      video.current?.pause();
      tube.current?.pauseVideo();
      return;
    }
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = 'hidden';
    document.querySelectorAll('#music audio').forEach((audio) => (audio as HTMLAudioElement).pause());
    return () => {
      html.style.overflow = overflow;
    };
  }, [open]);

  // the particles' canvas, made once the feed opens
  useEffect(() => {
    const el = canvas.current;
    if (!open || !el || engine.current) return;
    try {
      engine.current = particles(el);
      engine.current.resize(window.innerWidth, window.innerHeight);
    } catch {
      engine.current = null; // no WebGL: films just change
    }
    const resize = () => engine.current?.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [open]);
  useEffect(() => () => engine.current?.dispose(), []);

  // YouTube's films: its player in place (asked to play; if the phone won't, its own button shows)
  useEffect(() => {
    if (!open || !film.youtube || !holder.current) return;
    let alive = true;
    setStarted(false);
    const place = document.createElement('div');
    holder.current.append(place);
    void loadYouTube().then((YT) => {
      if (!alive) return;
      tube.current = new YT.Player(place, {
        host: 'https://www.youtube-nocookie.com',
        videoId: film.youtube,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, controls: 0, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, fs: 0, disablekb: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.playVideo();
            setLength(e.target.getDuration() || film.seconds);
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) setStarted(true);
            setPlaying(e.data === 1);
            if (e.data === 0) over.current(); // (ended)
          },
        },
      });
    });
    const poll = window.setInterval(() => tube.current && setTime(tube.current.getCurrentTime?.() ?? 0), 250);
    return () => {
      alive = false;
      window.clearInterval(poll);
      tube.current?.destroy();
      tube.current = null;
      place.remove();
    };
  }, [open, film.youtube, film.seconds]);

  // a film's picture, for the particles: the frame on the screen now, or its poster
  const poster = (f: FeedFilm) => {
    let texture = posters.current.get(f.slug);
    if (!texture) {
      texture = new THREE.TextureLoader().load(f.poster);
      texture.colorSpace = THREE.SRGBColorSpace;
      posters.current.set(f.slug, texture);
    }
    return texture;
  };
  const frameNow = () => {
    const el = video.current;
    if (film.youtube || !el || el.readyState < 2) return poster(film);
    const snap = (snapshot.current ??= (() => {
      const c = document.createElement('canvas');
      return { canvas: c, texture: new THREE.CanvasTexture(c) };
    })());
    const scale = Math.min(1, 540 / el.videoWidth);
    snap.canvas.width = Math.round(el.videoWidth * scale);
    snap.canvas.height = Math.round(el.videoHeight * scale);
    snap.canvas.getContext('2d')!.drawImage(el, 0, 0, snap.canvas.width, snap.canvas.height);
    snap.texture.colorSpace = THREE.SRGBColorSpace;
    snap.texture.needsUpdate = true;
    return snap.texture;
  };

  // the swipe: the particles follow the finger; let go far enough (or fast) and the next film comes, else the
  // film goes back together
  const draw = () => {
    const s = swipe.current;
    const e = engine.current;
    if (!e) return;
    e.material.uniforms.uProgress.value = s.progress;
    e.material.uniforms.uTime.value = performance.now() / 1000;
    e.render();
  };
  const begin = (way: number) => {
    const s = swipe.current;
    const e = engine.current;
    const next = films[index + way];
    if (!e || !next) return false;
    s.way = way;
    e.material.uniforms.uWay.value = way;
    e.material.uniforms.tA.value = frameNow();
    e.material.uniforms.tB.value = poster(next);
    e.material.uniforms.uFitA.value.fromArray(fit(film, window.innerWidth, window.innerHeight));
    e.material.uniforms.uFitB.value.fromArray(fit(next, window.innerWidth, window.innerHeight));
    setMoving(true);
    return true;
  };
  const settle = (to: number, done: () => void) => {
    const s = swipe.current;
    const from = s.progress;
    const t0 = performance.now();
    cancelAnimationFrame(s.anim);
    const step = () => {
      const k = clamp01((performance.now() - t0) / 380);
      s.progress = from + (to - from) * (1 - (1 - k) ** 3);
      draw();
      if (k < 1) s.anim = requestAnimationFrame(step);
      else done();
    };
    s.anim = requestAnimationFrame(step);
  };
  const go = (to: number) => {
    const next = films[to];
    const el = video.current;
    setIndex(to);
    setTime(0);
    setLength(next.seconds);
    setSwiped(true);
    // in the finger's own lift, so the phone lets it play with its sound
    if (!next.youtube && el) {
      el.src = source(next);
      void el.play().catch(() => {});
    } else el?.pause();
  };
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-control]')) return;
    const s = swipe.current;
    s.y = e.clientY;
    s.at = performance.now();
    s.moved = s.dragging = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = swipe.current;
    if (!e.buttons && e.pointerType === 'mouse') return;
    const dy = e.clientY - s.y;
    if (!s.moved && Math.abs(dy) > 10) {
      s.moved = true;
      s.dragging = begin(dy < 0 ? 1 : -1); // (not past the first film or the last)
    }
    if (!s.dragging) return;
    s.progress = clamp01((-dy * s.way) / window.innerHeight);
    draw();
  };
  const onUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    if (!s.dragging) {
      if (!s.moved && !(e.target as HTMLElement).closest('[data-control]') && started) toggle();
      else if (s.moved && last && s.y - e.clientY > 60) close(true); // up past the last film: the feed is over
      return;
    }
    s.dragging = false;
    const speed = Math.abs(e.clientY - s.y) / Math.max(1, performance.now() - s.at);
    const to = index + s.way;
    if (s.progress > 0.18 || speed > 0.6) {
      go(to);
      settle(1, () => setMoving(false));
    } else settle(0, () => setMoving(false));
  };

  const toggle = () => {
    if (film.youtube) return playing ? tube.current?.pauseVideo() : tube.current?.playVideo();
    const el = video.current;
    if (el) void (el.paused ? el.play() : el.pause());
  };
  const progress = () => {
    if (film.youtube) return tube.current?.getCurrentTime ? tube.current.getCurrentTime() / (tube.current.getDuration() || length) : 0;
    const el = video.current;
    return el && el.duration ? el.currentTime / el.duration : 0;
  };
  const seek = (at: number) => {
    const to = at * length;
    if (film.youtube) tube.current?.seekTo(to, true);
    else if (video.current) video.current.currentTime = to;
    setTime(to);
  };
  const close = (end = false) => {
    video.current?.pause();
    tube.current?.pauseVideo();
    onClose(end);
    if (!end) return;
    // over: from the first film again, next time
    setIndex(0);
    setTime(0);
    setLength(films[0].seconds);
  };
  useEffect(() => {
    over.current = () => last && close(true);
  });
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && films[index + (e.key === 'ArrowDown' ? 1 : -1)]) go(index + (e.key === 'ArrowDown' ? 1 : -1));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={film.title}
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] touch-none select-none overscroll-contain bg-black transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none invisible opacity-0'}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <video
        ref={video}
        playsInline
        preload="metadata"
        poster={films[index].youtube ? undefined : films[index].poster}
        className={`absolute inset-0 h-full w-full ${covers(film) ? 'object-cover' : 'object-contain'} ${film.youtube ? 'hidden' : ''}`}
        loop={!last}
        onEnded={() => over.current()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setLength(e.currentTarget.duration || film.seconds)}
      />
      {/* (YouTube's player the picture's size, so its own title and logo sit on the picture, not on the feed's) */}
      {film.youtube && (
        <div
          ref={holder}
          className="absolute inset-x-0 top-1/2 max-h-full -translate-y-1/2 [&>iframe]:h-full [&>iframe]:w-full"
          style={{ aspectRatio: `${film.width} / ${film.height}`, pointerEvents: started ? 'none' : 'auto' }}
        />
      )}
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" style={{ visibility: moving ? 'visible' : 'hidden' }} />

      {/* paused: PLAY in the middle, red */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span
          className="grid h-20 w-20 place-items-center rounded-full text-white shadow-[0_0_40px_rgba(255,45,85,0.55)] transition-[opacity,transform] duration-300"
          style={{ background: RED, opacity: open && started && !playing && !moving ? 1 : 0, transform: open && started && !playing && !moving ? 'scale(1)' : 'scale(0.6)' }}
        >
          <Play className="h-8 w-8 translate-x-0.5" fill="currentColor" />
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 pb-8" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <span className="text-xs tabular-nums tracking-widest text-white/70">
          {index + 1} / {films.length}
        </span>
        <button
          type="button"
          data-control
          onClick={() => close()}
          aria-label={t.buttons.close}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pt-16" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        {!swiped && <p className="mb-3 text-center text-[11px] uppercase tracking-[0.25em] text-white/60 [animation:fade-in_0.6s_ease-out]">{t.video.swipe}</p>}
        <p className="truncate text-lg font-black uppercase leading-tight text-white">{film.title}</p>
        {film.credit && <p className="mt-0.5 truncate text-xs uppercase tracking-[0.18em] text-white/60">{film.credit}</p>}
        <div className="pointer-events-auto mt-2 flex items-center gap-2">
          <button
            type="button"
            data-control
            onClick={toggle}
            aria-label={playing ? t.buttons.pause : t.buttons.play}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white"
            style={{ background: RED }}
          >
            {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4 translate-x-px" fill="currentColor" />}
          </button>
          <Timeline progress={progress} playing={playing} onSeek={seek} />
          <span className="shrink-0 text-xs tabular-nums text-white/70">
            {clock(time)} / {clock(length)}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
});

// Works out each track's spectrum ahead of time for the Music section's stage (three/MusicStage.tsx), so the
// player can play the music straight out of an <audio> element, which phones keep playing when the screen
// locks (sound run through Web Audio stops there). It is what the page's AnalyserNode would have heard: a
// Blackman-windowed FFT of 4096 samples, smoothed 0.72 frame to frame (at 60 fps), -88 to -18 dB, then the stage's
// 48 bands from 35 Hz to 16 kHz, each the mean of its bins, the highs lifted.
// Writes public/music/NNN.bands next to NNN.m4a: 30 frames a second, 48 bytes each (0-255).
// Usage: node scripts/prepare-bands.mjs [first last]    (needs ffmpeg)
import { spawnSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';

const DIR = 'public/music';
const RATE = 44_100;
const N = 4096;
const SMOOTHING = 0.72;
const [MIN_DB, MAX_DB] = [-88, -18];
const BANDS = 48;
const [LOW, HIGH] = [35, 16_000];
const FPS = 30; // stored
const STEP = 2; // analysed at 60 fps (the smoothing's pace), every second frame kept

// the FFT's tables
const bits = Math.log2(N);
const reversed = new Uint32Array(N);
for (let i = 0; i < N; i++) {
  let r = 0;
  for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
  reversed[i] = r;
}
const cos = new Float64Array(N / 2);
const sin = new Float64Array(N / 2);
for (let i = 0; i < N / 2; i++) {
  cos[i] = Math.cos((2 * Math.PI * i) / N);
  sin[i] = -Math.sin((2 * Math.PI * i) / N);
}
const blackman = new Float64Array(N);
for (let i = 0; i < N; i++) blackman[i] = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / N) + 0.08 * Math.cos((4 * Math.PI * i) / N);
const re = new Float64Array(N);
const im = new Float64Array(N);
function fft() {
  for (let i = 0; i < N; i++) {
    const j = reversed[i];
    if (j > i) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= N; size *= 2) {
    const half = size / 2;
    const stride = N / size;
    for (let start = 0; start < N; start += size) {
      for (let k = 0; k < half; k++) {
        const [c, s] = [cos[k * stride], sin[k * stride]];
        const a = start + k;
        const b = a + half;
        const tr = re[b] * c - im[b] * s;
        const ti = re[b] * s + im[b] * c;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
}

// the stage's bands over the analyser's bins
const hz = RATE / 2 / (N / 2);
const edges = Array.from({ length: BANDS }, (_, b) => {
  const lo = Math.floor((LOW * (HIGH / LOW) ** (b / BANDS)) / hz);
  const hi = Math.max(lo + 1, Math.ceil((LOW * (HIGH / LOW) ** ((b + 1) / BANDS)) / hz));
  return [lo, hi];
});

function bands(samples) {
  const smooth = new Float64Array(N / 2);
  const bytes = new Uint8Array(N / 2);
  const frames = Math.floor((samples.length / RATE) * FPS);
  const out = new Uint8Array(frames * BANDS);
  for (let f = 0; f < frames * STEP; f++) {
    const end = Math.round(((f + 1) / (FPS * STEP)) * RATE); // the samples up to this moment
    for (let i = 0; i < N; i++) {
      const at = end - N + i;
      re[i] = (at >= 0 && at < samples.length ? samples[at] : 0) * blackman[i];
      im[i] = 0;
    }
    fft();
    for (let k = 0; k < N / 2; k++) {
      smooth[k] = SMOOTHING * smooth[k] + (1 - SMOOTHING) * (Math.hypot(re[k], im[k]) / N);
      const db = 20 * Math.log10(smooth[k] || 1e-12);
      bytes[k] = Math.max(0, Math.min(255, Math.floor((255 / (MAX_DB - MIN_DB)) * (db - MIN_DB))));
    }
    if (f % STEP !== STEP - 1) continue;
    const row = ((f + 1) / STEP - 1) * BANDS;
    edges.forEach(([lo, hi], b) => {
      let sum = 0;
      for (let k = lo; k < hi; k++) sum += bytes[k];
      const v = Math.min(1, Math.pow(sum / (hi - lo) / 255, 1.5) * (1 + 2.2 * (b / BANDS) ** 1.5));
      out[row + b] = Math.round(v * 255);
    });
  }
  return out;
}

const tracks = readdirSync(DIR).filter((name) => name.endsWith('.m4a')).sort();
const [first = 0, last = tracks.length - 1] = process.argv.slice(2).map(Number);
for (const name of tracks.slice(first, last + 1)) {
  const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', `${DIR}/${name}`, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (decoded.status !== 0) throw new Error(`${name}: ${decoded.stderr}`);
  const samples = new Float32Array(Math.floor(decoded.stdout.byteLength / 4));
  new Uint8Array(samples.buffer).set(decoded.stdout.subarray(0, samples.length * 4));
  const data = bands(samples);
  writeFileSync(`${DIR}/${name.replace('.m4a', '.bands')}`, data);
  console.log(`${name}: ${(samples.length / RATE).toFixed(0)} s, ${data.length} bytes`);
}

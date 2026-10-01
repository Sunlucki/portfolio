const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The page glides to `to` (slower than the browser's own smooth scroll, so the particles can be seen on their
// way), unless a finger or the wheel takes over; then `done`.
export function glide(to: number, done: () => void, ms = 1800) {
  const from = window.scrollY;
  const t0 = performance.now();
  let stopped = still;
  const stop = () => (stopped = true);
  window.addEventListener('touchstart', stop, { once: true, passive: true });
  window.addEventListener('wheel', stop, { once: true, passive: true });
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / ms);
    if (!stopped) window.scrollTo({ top: from + (to - from) * (k < 0.5 ? 4 * k ** 3 : 1 - (2 - 2 * k) ** 3 / 2), behavior: 'instant' });
    if (k < 1 && !stopped) requestAnimationFrame(step);
    else {
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('wheel', stop);
      done();
    }
  };
  if (!still) return requestAnimationFrame(step);
  window.scrollTo({ top: to, behavior: 'instant' });
  done();
}

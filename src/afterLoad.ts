// Runs `run` once the page has loaded and the browser is idle (at the latest `timeout` ms after the load): for what is
// fetched or set up ahead of need, so it never competes with the page's own first files and its first paint. Returns
// a function that calls it off.
export function afterLoad(run: () => void, timeout = 2000) {
  let off = false;
  const go = () => !off && run();
  const start = () => (window.requestIdleCallback ? window.requestIdleCallback(go, { timeout }) : window.setTimeout(go, 300));
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
  return () => {
    off = true;
    window.removeEventListener('load', start);
  };
}

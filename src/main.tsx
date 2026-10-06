import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// The fonts, served from the site itself (no third-party stylesheet holding up the first paint): Kanit; Montserrat for
// Russian and Ukrainian (i18n/langs.ts); Caveat for the handwritten words, only their letters
// (scripts/prepare-caveat.mjs). Each comes in pieces by alphabet (Latin, Latin Extended, Cyrillic...), a piece fetched
// only when a page uses its letters.
import '@fontsource/kanit/300.css';
import '@fontsource/kanit/400.css';
import '@fontsource/kanit/500.css';
import '@fontsource/kanit/600.css';
import '@fontsource/kanit/700.css';
import '@fontsource/kanit/800.css';
import '@fontsource/kanit/900.css';
import '@fontsource-variable/montserrat/wght.css';
import './fonts/caveat.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

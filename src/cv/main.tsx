import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// the landing's fonts, served from the site (src/main.tsx)
import '@fontsource/kanit/300.css';
import '@fontsource/kanit/400.css';
import '@fontsource/kanit/500.css';
import '@fontsource/kanit/600.css';
import '@fontsource/kanit/700.css';
import '@fontsource/kanit/800.css';
import '@fontsource/kanit/900.css';
import '@fontsource-variable/montserrat/wght.css';
import '../index.css';
import './cv.css';
import { CvPage } from './CvPage';

// The page arrives already written (scripts/cv/prerender.mjs saved it from the built page, so its words read without
// JavaScript); React draws it again over that, alive.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CvPage />
  </StrictMode>,
);

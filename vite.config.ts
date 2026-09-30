import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import de from './src/i18n/de.ts'
import en, { type Copy } from './src/i18n/en.ts'
import fr from './src/i18n/fr.ts'
import it from './src/i18n/it.ts'
import { LANGS, MONTSERRAT, OG_LOCALES, fontOf, langPath, type Lang } from './src/i18n/langs.ts'
import pl from './src/i18n/pl.ts'
import ru from './src/i18n/ru.ts'
import uk from './src/i18n/uk.ts'

const SITE = 'https://sunlucki.pl'
const COPIES: Record<Lang, Copy> = { en, ru, uk, pl, de, it, fr }
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// the handwritten "Why?" over the handle in About and the word the hero's finger writes, in every language: just
// those letters of Caveat
const HINTS = encodeURIComponent([...new Set(LANGS.flatMap((lang) => [...COPIES[lang].about.hint, ...COPIES[lang].hero.swipe]))].join(''))

// What search engines and link previews read of a language's page: its title and description, where its
// translations are, the share card, and who it's about (schema.org).
function head(lang: Lang) {
  const t = COPIES[lang]
  const url = `${SITE}${langPath(lang)}`
  const person = {
    '@type': 'Person',
    '@id': `${SITE}/#person`,
    name: 'Bogdan Nenadović',
    alternateName: ['SUNLUCKI', 'Bohdan Nenadovych', 'Богдан Ненадович'],
    jobTitle: t.role,
    description: t.meta.description,
    url: `${SITE}/`,
    image: `${SITE}/og.jpg`,
    address: { '@type': 'PostalAddress', addressLocality: 'Poznań', addressCountry: 'PL' },
    worksFor: { '@type': 'Organization', name: 'SIMBIA sp. z o.o.', url: 'https://simbia.eu' },
    knowsAbout: [
      'Full-stack development', 'Product design', 'Design engineering', 'TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL',
      'SwiftUI', 'iOS development', 'Three.js', 'WebGL', 'AI integration', 'LLM', 'KSeF', 'Payments integration', 'UI/UX design',
      'Motion design', 'Video production', 'Branding',
    ],
    sameAs: [
      'https://www.linkedin.com/in/sunlucki',
      'https://github.com/Sunlucki',
      'https://www.behance.net/styleicon',
      'https://soundcloud.com/sunlucki',
      'https://music.apple.com/us/artist/sunlucki/1695520105',
    ],
  }
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Bogdan Nenadović', inLanguage: [...LANGS], publisher: { '@id': `${SITE}/#person` } },
      { '@type': 'ProfilePage', '@id': `${url}#page`, url, name: t.meta.title, inLanguage: lang, isPartOf: { '@id': `${SITE}/#website` }, mainEntity: { '@id': `${SITE}/#person` } },
    ],
  }
  return [
    `<title>${escape(t.meta.title)}</title>`,
    `<meta name="description" content="${escape(t.meta.description)}" />`,
    `<meta name="author" content="Bogdan Nenadović" />`,
    `<link rel="canonical" href="${url}" />`,
    ...LANGS.map((other) => `<link rel="alternate" hreflang="${other}" href="${SITE}${langPath(other)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}/" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="Bogdan Nenadović" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${escape(t.meta.title)}" />`,
    `<meta property="og:description" content="${escape(t.meta.ogDescription)}" />`,
    `<meta property="og:image" content="${SITE}/og.jpg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escape(t.name)}" />`,
    `<meta property="og:locale" content="${OG_LOCALES[lang]}" />`,
    ...LANGS.filter((other) => other !== lang).map((other) => `<meta property="og:locale:alternate" content="${OG_LOCALES[other]}" />`),
    `<meta property="profile:first_name" content="Bogdan" />`,
    `<meta property="profile:last_name" content="Nenadović" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(t.meta.title)}" />`,
    `<meta name="twitter:description" content="${escape(t.meta.ogDescription)}" />`,
    `<meta name="twitter:image" content="${SITE}/og.jpg" />`,
    ...(fontOf(lang) === 'Montserrat' ? [`<link rel="stylesheet" href="${MONTSERRAT}" />`] : []),
    `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&text=${HINTS}&display=swap" />`,
    `<script type="application/ld+json">${JSON.stringify(graph)}</script>`,
  ].join('\n    ')
}

const SEO = /<!-- seo -->[\s\S]*?<!-- \/seo -->/
const seo = (lang: Lang) => `<!-- seo -->\n    ${head(lang)}\n    <!-- /seo -->`

// The page for each language: index.html (English) with its head filled in, and once the build is written a copy
// for every other language at ru/index.html and so on; with a sitemap of them all, each listing its translations.
function languages(): Plugin {
  return {
    name: 'languages',
    transformIndexHtml: { order: 'post', handler: (html) => html.replace(SEO, seo('en')) },
    writeBundle({ dir = 'dist' }) {
      const html = readFileSync(join(dir, 'index.html'), 'utf8')
      for (const lang of LANGS.filter((lang) => lang !== 'en')) {
        mkdirSync(join(dir, lang), { recursive: true })
        writeFileSync(join(dir, lang, 'index.html'), html.replace('<html lang="en">', `<html lang="${lang}">`).replace(SEO, seo(lang)))
      }
      const day = new Date().toISOString().slice(0, 10)
      const links = [
        ...LANGS.map((lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE}${langPath(lang)}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`,
      ].join('\n')
      const urls = LANGS.map((lang) => `  <url>\n    <loc>${SITE}${langPath(lang)}</loc>\n    <lastmod>${day}</lastmod>\n${links}\n  </url>`).join('\n')
      writeFileSync(
        join(dir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), languages()],
})

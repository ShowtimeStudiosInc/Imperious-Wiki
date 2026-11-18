// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// SITE and BASE come from the GitHub Action (see .github/workflows/deploy.yml).
// For a custom domain, set SITE to the domain and BASE to "/".
const site = process.env.SITE || 'https://showtimestudiosinc.github.io';
const base = process.env.BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Imperious Authorities',
      description: 'The rulebook and setting wiki for the Imperious Authorities roleplay.',
      logo: { light: './src/assets/logo-dark.png', dark: './src/assets/logo-white.png', alt: 'Imperious Authorities logo' },
      favicon: '/favicon.png',
      customCss: ['./src/styles/starlight.css'],
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: new URL((base.endsWith('/') ? base : base + '/') + 'images/brand/og-logo.png', site).href } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;500;600&display=swap' } },
      ],
      sidebar: [
        { label: 'Gem-Types', link: '/gem-types/' },
        { label: 'Start Here', items: [{ autogenerate: { directory: 'start-here' } }] },
        { label: 'Rules', items: [{ autogenerate: { directory: 'rules' } }] },
        { label: 'Lore', items: [{ autogenerate: { directory: 'lore' } }] },
      ],
    }),
  ],
});

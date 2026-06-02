// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://housegatitos.com',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: {
    format: 'directory',  // genera /slug/index.html en lugar de /slug.html
  },
});

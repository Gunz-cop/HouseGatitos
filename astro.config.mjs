// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://housegatitos.com',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  image: {
    service: {
      entrypoint: 'astro/assets/services/cloudflare'
    }
  },
  build: {
    format: 'directory',  // genera /slug/index.html en lugar de /slug.html
  },
});


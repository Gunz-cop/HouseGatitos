// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { getPosts, SITE_URL } from './src/lib/posts.js';

const postsByUrl = new Map(
  getPosts().map((post) => [
    `${SITE_URL}/${post.silo.slug}/${post.slug}/`,
    post.updated || post.published || post.datePublished,
  ])
);

export default defineConfig({
  site: 'https://housegatitos.com',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      serialize(item) {
        const lastmod = postsByUrl.get(item.url);
        if (lastmod) {
          item.lastmod = new Date(lastmod);
        }
        return item;
      },
    }),
  ],
  image: {
    service: {
      entrypoint: 'astro/assets/services/cloudflare'
    }
  },
  build: {
    format: 'directory',  // genera /slug/index.html en lugar de /slug.html
  },
});

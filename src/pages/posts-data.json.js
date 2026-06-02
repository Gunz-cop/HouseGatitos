// src/pages/posts-data.json.js
// Genera /posts-data.json en el build de Astro

import { getPosts } from '../lib/posts.js';

export async function GET() {
  const posts = getPosts();
  const data = posts.map(p => ({
    slug:          p.slug,
    title:         p.title,
    description:   p.description,
    silo:          p.silo,
    categories:    p.categories,
    datePublished: p.datePublished,
    featuredImg:   p.featuredImg,
  }));

  return new Response(JSON.stringify(data, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}

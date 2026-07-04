/**
 * src/lib/posts.js
 * Lee los posts desde los archivos Markdown individuales en src/content/posts/.
 * Corre en Node (tiempo de build de Astro) — usa fs directamente.
 */

import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const SITE_URL = 'https://housegatitos.com';
const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

function parseFrontmatter(yamlContent) {
  const obj = {};
  const lines = yamlContent.split(/\r?\n/);
  let currentKey = null;
  let inSilo = false;

  for (let line of lines) {
    const rawLine = line;
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('-')) {
      if (currentKey === 'categories') {
        const val = line.substring(1).trim().replace(/^['"]|['"]$/g, '');
        obj.categories.push(val);
      }
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.substring(0, colonIdx).trim();
    let val = line.substring(colonIdx + 1).trim();

    const isIndented = rawLine.startsWith('  ') || rawLine.startsWith('\t');

    if (isIndented && inSilo) {
      if (val === 'null') {
        obj.silo[key] = null;
      } else {
        try {
          obj.silo[key] = JSON.parse(val);
        } catch {
          obj.silo[key] = val.replace(/^['"]|['"]$/g, '');
        }
      }
      continue;
    }

    currentKey = key;
    inSilo = (key === 'silo');

    if (inSilo) {
      obj.silo = {};
      continue;
    }

    if (key === 'categories') {
      obj.categories = [];
      continue;
    }

    if (val === 'null') {
      obj[key] = null;
    } else {
      try {
        obj[key] = JSON.parse(val);
      } catch {
        obj[key] = val.replace(/^['"]|['"]$/g, '');
      }
    }
  }
  return obj;
}

function parseMarkdownFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`File ${filePath} is missing frontmatter boundary`);
  }
  const yamlContent = match[1];
  const bodyContent = match[2];
  const metadata = parseFrontmatter(yamlContent);
  return {
    ...metadata,
    content: marked.parse(bodyContent)
  };
}

let _posts = null;

export function getPosts() {
  // Solo usar caché en producción para permitir recarga en caliente en desarrollo
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD && _posts) {
    return _posts;
  }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    try {
      const post = parseMarkdownFile(filePath);
      if (!post.slug) {
        post.slug = file.replace(/\.md$/, '');
      }
      if (!post.datePublished && post.published) {
        post.datePublished = post.published.substring(0, 10);
      }
      
      // Mapear rutas de imágenes optimizadas (card y thumb)
      if (post.featuredImg && post.featuredImg.startsWith('/assets/images/')) {
        const baseName = path.parse(post.featuredImg).name;
        const cardPath = `/assets/images/optimized/${baseName}-card.webp`;
        const thumbPath = `/assets/images/optimized/${baseName}-thumb.webp`;
        const cardFile = path.join(PUBLIC_DIR, cardPath.replace(/^\//, ''));
        const thumbFile = path.join(PUBLIC_DIR, thumbPath.replace(/^\//, ''));

        post.featuredImgCard = fs.existsSync(cardFile) ? cardPath : post.featuredImg;
        post.featuredImgThumb = fs.existsSync(thumbFile) ? thumbPath : post.featuredImg;
      } else {
        post.featuredImgCard = post.featuredImg;
        post.featuredImgThumb = post.featuredImg;
      }

      posts.push(post);
    } catch (err) {
      console.error(`Error parsing post ${file}:`, err);
    }
  }

  // Ordenar por fecha de publicación descendente
  posts.sort((a, b) => b.published.localeCompare(a.published));

  _posts = posts;
  return _posts;
}

export function buildJsonLdPost(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/${post.silo.slug}/${post.slug}/` },
    headline: post.title,
    description: post.description,
    image: post.featuredImg
      ? (post.featuredImg.startsWith('http') ? post.featuredImg : `${SITE_URL}${post.featuredImg}`)
      : `${SITE_URL}/assets/images/House Gatitos.webp`,
    datePublished: post.published,
    dateModified: post.updated,
    author: { '@type': 'Organization', name: 'Equipo de House Gatitos', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'House Gatitos',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/images/House Gatitos-01.png` }
    },
    inLanguage: 'es',
    isPartOf: { '@type': 'Blog', name: 'House Gatitos', url: SITE_URL }
  };
}

export function buildBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function buildItemListJsonLd({ name, url, posts }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url,
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/${post.silo.slug}/${post.slug}/`,
      name: post.title
    }))
  };
}

export function buildHowToJsonLd(post, steps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: post.description,
    image: post.featuredImg
      ? (post.featuredImg.startsWith('http') ? post.featuredImg : `${SITE_URL}${post.featuredImg}`)
      : `${SITE_URL}/assets/images/House Gatitos.webp`,
    totalTime: 'PT15M',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text
    }))
  };
}

export function buildFaqJsonLd(htmlContent) {
  const faqs = [];
  const detailsRegex = /<details[^>]*>([\s\S]*?)<\/details>/gi;
  let match;
  
  while ((match = detailsRegex.exec(htmlContent)) !== null) {
    const detailsBody = match[1];
    const summaryMatch = detailsBody.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
    if (!summaryMatch) continue;
    
    const question = decodeHtmlEntities(summaryMatch[1].replace(/<[^>]+>/g, '').trim());
    let answerHtml = detailsBody.replace(/<summary[^>]*>[\s\S]*?<\/summary>/gi, '').trim();
    const answerText = decodeHtmlEntities(answerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    
    if (question && answerText) {
      faqs.push({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answerText
        }
      });
    }
  }
  
  if (faqs.length === 0) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs
  };
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

export function slugifyExport(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export { SITE_URL };

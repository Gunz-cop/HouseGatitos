/**
 * src/lib/posts.js
 * Parsea el feed.atom de Blogger y devuelve los posts.
 * Corre en Node (tiempo de build de Astro) — usa fs directamente.
 */

import fs from 'fs'
import path from 'path'

const SITE_URL = 'https://housegatitos.com'
const ALBUM_DIR = path.join(process.cwd(), 'Blogger/Albums/House Gatitos')
const FEED_PATH = path.join(
  process.cwd(),
  'Blogger/Blogs/House Gatitos 🐾 _ Consejos, cuidados y curiosidad/feed.atom'
)

// ── Silos ────────────────────────────────────────────────────────────────────
const SILO_MAP = {
  'Razas':                { id: 'razas',   name: 'Razas y Morfología',            slug: 'razas',         icon: '🐱' },
  'Tipos de Siames':      { id: 'razas',   name: 'Razas y Morfología',            slug: 'razas',         icon: '🐱' },
  'Gatos Exoticos':       { id: 'razas',   name: 'Razas y Morfología',            slug: 'razas',         icon: '🐱' },
  'Galerias de Imagenes': { id: 'razas',   name: 'Razas y Morfología',            slug: 'razas',         icon: '🐱' },
  'Salud':                { id: 'salud',   name: 'Salud y Síntomas',              slug: 'salud',         icon: '🩺' },
  'Cuidado':              { id: 'salud',   name: 'Salud y Síntomas',              slug: 'salud',         icon: '🩺' },
  'Educacion':            { id: 'salud',   name: 'Salud y Síntomas',              slug: 'salud',         icon: '🩺' },
  'Guias y Tutoriales':   { id: 'guias',   name: 'Guías y Recursos',              slug: 'guias',         icon: '📚' },
  'Reseñas':              { id: 'guias',   name: 'Guías y Recursos',              slug: 'guias',         icon: '📚' },
  'House Gatitos':        { id: 'guias',   name: 'Guías y Recursos',              slug: 'guias',         icon: '📚' },
  'Curiosidades':         { id: 'cultura', name: 'Curiosidades y Cultura Felina', slug: 'curiosidades',  icon: '✨' },
  'Amor de Gato':         { id: 'cultura', name: 'Curiosidades y Cultura Felina', slug: 'curiosidades',  icon: '✨' },
  'Literatura':           { id: 'cultura', name: 'Curiosidades y Cultura Felina', slug: 'curiosidades',  icon: '✨' },
  'Escritores':           { id: 'cultura', name: 'Curiosidades y Cultura Felina', slug: 'curiosidades',  icon: '✨' },
  'Historias':            { id: 'cultura', name: 'Curiosidades y Cultura Felina', slug: 'curiosidades',  icon: '✨' },
  'Cantantes':            { id: 'cultura', name: 'Curiosidades y Cultura Felina', slug: 'curiosidades',  icon: '✨' },
}

function assignSilo(categories) {
  for (const cat of categories) {
    if (SILO_MAP[cat]) return SILO_MAP[cat]
  }
  return { id: 'guias', name: 'Guías y Recursos', slug: 'guias', icon: '📚' }
}

// ── Álbum local ──────────────────────────────────────────────────────────────
let _localFiles = null
let _localFilesLower = null

function getLocalFiles() {
  if (!_localFiles) {
    _localFiles = fs.existsSync(ALBUM_DIR) ? fs.readdirSync(ALBUM_DIR) : []
    _localFilesLower = _localFiles.map(f => f.toLowerCase())
  }
  return { files: _localFiles, lower: _localFilesLower }
}

function findLocalImage(bloggerUrl) {
  try {
    let decoded = bloggerUrl.replace(/\+/g, ' ')
    decoded = decodeURIComponent(decoded)
    const parts = decoded.split('/')
    const filename = parts[parts.length - 1]
    const filenameLower = filename.toLowerCase()
    const { files, lower } = getLocalFiles()

    let idx = lower.indexOf(filenameLower)
    if (idx !== -1) return files[idx]

    const base = filename.replace(/\.[^.]+$/, '').substring(0, 35).toLowerCase()
    idx = lower.findIndex(f => f.toLowerCase().startsWith(base))
    if (idx !== -1) return files[idx]

    return null
  } catch { return null }
}

function rewriteImageUrls(html) {
  return html.replace(
    /https:\/\/blogger\.googleusercontent\.com\/img\/[^\s"'<>]+/g,
    (url) => {
      const local = findLocalImage(url)
      if (local) return `/assets/images/${local}`
      return url
    }
  )
}

// ── Parser XML ───────────────────────────────────────────────────────────────
function getTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'm'))
  return m ? m[1].trim() : ''
}

// ── Slugify ──────────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function extractSlugFromFilename(filename) {
  if (!filename) return null
  const parts = filename.split('/')
  const base = parts[parts.length - 1]
  return base.replace(/\.html$/, '').replace(/\s+/g, '-')
}

// ── Cache ────────────────────────────────────────────────────────────────────
let _posts = null

export function getPosts() {
  if (_posts) return _posts

  const feedContent = fs.readFileSync(FEED_PATH, 'utf8')
  const rawEntries = feedContent.split('<entry>').slice(1)
  const posts = []

  for (const entry of rawEntries) {
    const type   = getTag(entry, 'blogger:type') || 'POST'
    const status = getTag(entry, 'blogger:status') || 'LIVE'
    if (type !== 'POST' || status !== 'LIVE') continue

    const title     = getTag(entry, 'title')
    const content   = getTag(entry, 'content')
    const published = getTag(entry, 'published') || ''
    const updated   = getTag(entry, 'updated') || published
    const filename  = getTag(entry, 'blogger:filename')
    const metaDesc  = getTag(entry, 'blogger:metaDescription')

    const catMatches = [...entry.matchAll(/scheme='tag:blogger\.com[^']*' term='([^']+)'/g)]
    const categories = catMatches.map(m => m[1])
    const silo       = assignSilo(categories)

    const slugFromFile = extractSlugFromFilename(filename)
    const slug = slugFromFile || slugify(title)

    const imgMatch = content.match(/https:\/\/blogger\.googleusercontent\.com\/img\/[^\s"'<>]+/)
    const featuredImgUrl = imgMatch ? imgMatch[0] : null
    const featuredLocal  = featuredImgUrl ? findLocalImage(featuredImgUrl) : null

    const description = metaDesc ||
      content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 160)

    const processedContent = rewriteImageUrls(
      content
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
    )

    posts.push({
      slug,
      title,
      description,
      content: processedContent,
      published,
      updated,
      datePublished: published.substring(0, 10),
      categories,
      silo,
      filename,
      featuredImg: featuredLocal ? `/assets/images/${featuredLocal}` : null,
    })
  }

  _posts = posts
  return _posts
}

// ── JSON-LD helpers ───────────────────────────────────────────────────────────
export function buildJsonLdPost(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/${post.slug}/` },
    headline: post.title,
    description: post.description,
    image: post.featuredImg
      ? `${SITE_URL}${post.featuredImg}`
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
  }
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
  }
}

export function slugifyExport(text) {
  return slugify(text)
}

export { SITE_URL }

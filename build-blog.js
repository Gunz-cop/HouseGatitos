/**
 * build-blog.js
 * Parsea el feed.atom de Blogger y genera:
 *  - Un archivo src/index.html (home) con estructura de Centro de Soluciones
 *  - Una carpeta dist/<slug>/index.html por cada post
 *  - dist/_redirects (redirecciones 301 de URLs antiguas a nuevas)
 *  - dist/sitemap.xml
 *  - public/search-index.json para búsqueda instantánea
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Rutas ────────────────────────────────────────────────────────────────────
const FEED_PATH = path.join(
  __dirname,
  'Blogger/Blogs/House Gatitos 🐾 _ Consejos, cuidados y curiosidad/feed.atom'
)
const ALBUM_DIR = path.join(__dirname, 'Blogger/Albums/House Gatitos')
const SRC_DIR   = path.join(__dirname, 'src')
const PUBLIC_DIR = path.join(__dirname, 'public')
const DIST_DIR  = PUBLIC_DIR // Todo se genera en public para que Vite lo sirva en desarrollo
const SITE_URL  = 'https://housegatitos.com'

// ─── Asegurar directorios ──────────────────────────────────────────────────────
for (const dir of [SRC_DIR, PUBLIC_DIR, DIST_DIR, path.join(PUBLIC_DIR, 'assets/images')]) {
  fs.mkdirSync(dir, { recursive: true })
}

// ─── Leer álbum local ─────────────────────────────────────────────────────────
const localFiles = fs.existsSync(ALBUM_DIR) ? fs.readdirSync(ALBUM_DIR) : []
const localFilesLower = localFiles.map(f => f.toLowerCase())

function findLocalImage(bloggerUrl) {
  try {
    let decoded = bloggerUrl.replace(/\+/g, ' ')
    decoded = decodeURIComponent(decoded)
    const parts = decoded.split('/')
    const filename = parts[parts.length - 1]
    const filenameLower = filename.toLowerCase()
    
    let idx = localFilesLower.indexOf(filenameLower)
    if (idx !== -1) return localFiles[idx]
    
    // Fuzzy: prefijo de 35 chars
    const base = filename.replace(/\.[^.]+$/, '').substring(0, 35).toLowerCase()
    idx = localFilesLower.findIndex(f => f.toLowerCase().startsWith(base))
    if (idx !== -1) return localFiles[idx]
    
    return null
  } catch { return null }
}

// ─── Mapa de imágenes utilizadas (para copiar al build) ──────────────────────
const usedImages = new Set()

function rewriteImageUrls(html) {
  return html.replace(
    /https:\/\/blogger\.googleusercontent\.com\/img\/[^\s"'<>]+/g,
    (url) => {
      const local = findLocalImage(url)
      if (local) {
        usedImages.add(local)
        return `/assets/images/${local}`
      }
      return url // Mantener URL externa si no hay local
    }
  )
}

// ─── Parser XML simple ────────────────────────────────────────────────────────
function getTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'm'))
  return m ? m[1].trim() : ''
}

function getAttr(xml, tag, attr) {
  const m = xml.match(new RegExp(`<${tag}[^>]*${attr}='([^']*)'`))
  return m ? m[1] : ''
}

// ─── Slugify ──────────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function escHtml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function extractSlugFromFilename(filename) {
  // filename es algo como /2021/02/freddie-mercury-y-su-infinito-amor-por.html
  if (!filename) return null
  const parts = filename.split('/')
  const base = parts[parts.length - 1]
  return base.replace(/\.html$/, '')
}

// ─── Clasificación de Silos ───────────────────────────────────────────────────
const SILO_MAP = {
  'Razas':          { id: 'razas',           name: 'Razas y Morfología',           slug: 'razas',            icon: '🐱' },
  'Tipos de Siames':{ id: 'razas',           name: 'Razas y Morfología',           slug: 'razas',            icon: '🐱' },
  'Gatos Exoticos': { id: 'razas',           name: 'Razas y Morfología',           slug: 'razas',            icon: '🐱' },
  'Galerias de Imagenes': { id: 'razas',     name: 'Razas y Morfología',           slug: 'razas',            icon: '🐱' },
  'Salud':          { id: 'salud',           name: 'Salud y Síntomas',             slug: 'salud',            icon: '🩺' },
  'Cuidado':        { id: 'salud',           name: 'Salud y Síntomas',             slug: 'salud',            icon: '🩺' },
  'Educacion':      { id: 'salud',           name: 'Salud y Síntomas',             slug: 'salud',            icon: '🩺' },
  'Guias y Tutoriales': { id: 'guias',       name: 'Guías y Recursos',             slug: 'guias',            icon: '📚' },
  'Reseñas':        { id: 'guias',           name: 'Guías y Recursos',             slug: 'guias',            icon: '📚' },
  'House Gatitos':  { id: 'guias',           name: 'Guías y Recursos',             slug: 'guias',            icon: '📚' },
  'Curiosidades':   { id: 'cultura',         name: 'Curiosidades y Cultura Felina',slug: 'curiosidades',     icon: '✨' },
  'Amor de Gato':   { id: 'cultura',         name: 'Curiosidades y Cultura Felina',slug: 'curiosidades',     icon: '✨' },
  'Literatura':     { id: 'cultura',         name: 'Curiosidades y Cultura Felina',slug: 'curiosidades',     icon: '✨' },
  'Escritores':     { id: 'cultura',         name: 'Curiosidades y Cultura Felina',slug: 'curiosidades',     icon: '✨' },
  'Historias':      { id: 'cultura',         name: 'Curiosidades y Cultura Felina',slug: 'curiosidades',     icon: '✨' },
  'Cantantes':      { id: 'cultura',         name: 'Curiosidades y Cultura Felina',slug: 'curiosidades',     icon: '✨' },
}

function assignSilo(categories) {
  for (const cat of categories) {
    if (SILO_MAP[cat]) return SILO_MAP[cat]
  }
  return { id: 'guias', name: 'Guías y Recursos', slug: 'guias', icon: '📚' }
}

// ─── Parsear feed.atom ────────────────────────────────────────────────────────
console.log('📖 Leyendo feed.atom...')
const feedContent = fs.readFileSync(FEED_PATH, 'utf8')
const rawEntries = feedContent.split('<entry>').slice(1)

const posts = []
const redirects = []

for (const entry of rawEntries) {
  const type   = getTag(entry, 'blogger:type') || 'POST'
  const status = getTag(entry, 'blogger:status') || 'LIVE'
  if (type !== 'POST' || status !== 'LIVE') continue

  const title       = getTag(entry, 'title')
  const content     = getTag(entry, 'content')
  const published   = getTag(entry, 'published') || ''
  const updated     = getTag(entry, 'updated') || published
  const filename    = getTag(entry, 'blogger:filename')
  const metaDesc    = getTag(entry, 'blogger:metaDescription')

  // Categorías
  const catMatches  = [...entry.matchAll(/scheme='tag:blogger\.com[^']*' term='([^']+)'/g)]
  const categories  = catMatches.map(m => m[1])
  const silo        = assignSilo(categories)

  // Slug
  const slugFromFile = extractSlugFromFilename(filename)
  const slug = slugFromFile || slugify(title)

  // Imagen destacada: primera img del contenido
  const imgMatch = content.match(/https:\/\/blogger\.googleusercontent\.com\/img\/[^\s"'<>]+/)
  const featuredImgUrl = imgMatch ? imgMatch[0] : null
  const featuredLocal = featuredImgUrl ? findLocalImage(featuredImgUrl) : null
  if (featuredLocal) usedImages.add(featuredLocal)

  // Descripción
  const description = metaDesc || 
    content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 160)

  // Reescribir URLs de imágenes a locales
  const processedContent = rewriteImageUrls(
    // Decodificar HTML entities del atom feed
    content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  )

  // Fecha
  const datePublished = published.substring(0, 10)

  posts.push({
    slug,
    title,
    description,
    content: processedContent,
    published,
    updated,
    datePublished,
    categories,
    silo,
    filename,
    featuredImg: featuredLocal ? `/assets/images/${featuredLocal}` : null,
  })

  // Agregar redirección 301 de URL vieja a nueva slug limpio
  if (filename) {
    redirects.push(`${filename}  /${slug}/  301`)
    // También manejar variantes sin www y con www
    // Blogger a veces genera URLs con año/mes
    const withWww = filename // En Cloudflare todo llega sin www (configuramos redirect)
    redirects.push(`${withWww}  /${slug}/  301`)
  }
}

console.log(`✅ ${posts.length} posts procesados`)
console.log(`🔗 ${redirects.length} redirecciones generadas`)

// ─── Generar Search Index ─────────────────────────────────────────────────────
const searchIndex = posts.map(p => ({
  slug:  p.slug,
  title: p.title,
  description: p.description,
  silo: p.silo.id,
  siloName: p.silo.name,
  categories: p.categories,
  datePublished: p.datePublished,
  featuredImg: p.featuredImg,
}))

fs.writeFileSync(
  path.join(PUBLIC_DIR, 'search-index.json'),
  JSON.stringify(searchIndex, null, 2)
)
console.log('✅ search-index.json generado')

// ─── Leer Plantillas ──────────────────────────────────────────────────────────
const TEMPLATES_DIR = path.join(__dirname, 'templates')

function readTemplate(name) {
  const p = path.join(TEMPLATES_DIR, name)
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8')
  return null
}

// ─── Helpers de plantillas ────────────────────────────────────────────────────
function buildJsonLdPost(post) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${post.slug}/`
    },
    "headline": post.title,
    "description": post.description,
    "image": post.featuredImg ? `${SITE_URL}${post.featuredImg}` : `${SITE_URL}/assets/images/House Gatitos.webp`,
    "datePublished": post.published,
    "dateModified": post.updated,
    "author": {
      "@type": "Organization",
      "name": "Equipo de House Gatitos",
      "url": SITE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": "House Gatitos",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/assets/images/House Gatitos-01.png`
      }
    },
    "inLanguage": "es",
    "isPartOf": {
      "@type": "Blog",
      "name": "House Gatitos",
      "url": SITE_URL
    }
  }, null, 2)
}

function buildBreadcrumbJsonLd(post) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": post.silo.name, "item": `${SITE_URL}/${post.silo.slug}/` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": `${SITE_URL}/${post.slug}/` }
    ]
  }, null, 2)
}

// ─── Generar páginas de posts ─────────────────────────────────────────────────
const POST_TEMPLATE = readTemplate('post.html')
if (!POST_TEMPLATE) {
  console.error('❌ No se encontró templates/post.html')
  process.exit(1)
}

let generatedCount = 0
for (const post of posts) {
  const postDir = path.join(DIST_DIR, post.slug)
  fs.mkdirSync(postDir, { recursive: true })

  // Posts relacionados del mismo silo (máx. 3)
  const related = posts
    .filter(p => p.silo.id === post.silo.id && p.slug !== post.slug)
    .slice(0, 3)

  const relatedHtml = related.map(r => `
    <a href="/${r.slug}/" class="related-card">
      ${r.featuredImg ? `<img src="${r.featuredImg}" alt="${r.title}" loading="lazy">` : '<div class="related-card-placeholder"></div>'}
      <p>${r.title}</p>
    </a>
  `).join('')

  const html = POST_TEMPLATE
    .replace(/\{\{SITE_URL\}\}/g, SITE_URL)
    .replace(/\{\{TITLE\}\}/g, post.title)
    .replace(/\{\{DESCRIPTION\}\}/g, post.description)
    .replace(/\{\{SLUG\}\}/g, post.slug)
    .replace(/\{\{CANONICAL\}\}/g, `${SITE_URL}/${post.slug}/`)
    .replace(/\{\{DATE_PUBLISHED\}\}/g, post.datePublished)
    .replace(/\{\{DATE_FULL\}\}/g, post.published)
    .replace(/\{\{DATE_MODIFIED\}\}/g, post.updated)
    .replace(/\{\{SILO_NAME\}\}/g, post.silo.name)
    .replace(/\{\{SILO_SLUG\}\}/g, post.silo.slug)
    .replace(/\{\{SILO_ICON\}\}/g, post.silo.icon)
    .replace(/\{\{FEATURED_IMG\}\}/g, post.featuredImg || '/assets/images/House Gatitos.webp')
    .replace(/\{\{FEATURED_IMG_ALT\}\}/g, post.title)
    .replace(/\{\{CONTENT\}\}/g, post.content)
    .replace(/\{\{RELATED_POSTS\}\}/g, relatedHtml)
    .replace(/\{\{JSONLD_POST\}\}/g, buildJsonLdPost(post))
    .replace(/\{\{JSONLD_BREADCRUMB\}\}/g, buildBreadcrumbJsonLd(post))
    .replace(/\{\{CATEGORIES\}\}/g, post.categories.map(c =>
      `<a href="/categoria/${slugify(c)}/" class="tag">${c}</a>`
    ).join(''))

  fs.writeFileSync(path.join(postDir, 'index.html'), html)
  generatedCount++
}

console.log(`✅ ${generatedCount} páginas de posts generadas`)

// ─── Generar _redirects ───────────────────────────────────────────────────────
const uniqueRedirects = [...new Set(redirects)]
// Agregar redirect www → non-www (lo gestiona Cloudflare normalmente, pero por si acaso)
uniqueRedirects.push(`/search/*  /  302`)
uniqueRedirects.push(`/p/:page  /  302`)

fs.writeFileSync(
  path.join(DIST_DIR, '_redirects'),
  uniqueRedirects.join('\n') + '\n'
)
console.log(`✅ _redirects generado con ${uniqueRedirects.length} reglas`)

// ─── Generar Sitemap ───────────────────────────────────────────────────────────
const sitemapUrls = [
  `<url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
  ...posts.map(p => `<url><loc>${SITE_URL}/${p.slug}/</loc><lastmod>${p.updated.substring(0,10)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`),
  ...['razas', 'salud', 'guias', 'curiosidades'].map(s =>
    `<url><loc>${SITE_URL}/${s}/</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`
  )
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`

fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap)
console.log('✅ sitemap.xml generado')

// ─── Robots.txt ───────────────────────────────────────────────────────────────
const robots = `User-agent: *
Allow: /

Disallow: /assets/
Allow: /assets/images/

Sitemap: ${SITE_URL}/sitemap.xml
`
fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robots)

// ─── Generar _headers (caché Cloudflare Pages) ───────────────────────────────
const headers = `# House Gatitos — HTTP Headers para Cloudflare Pages

# Imágenes: caché agresiva (1 año, immutable)
/assets/images/*
  Cache-Control: public, max-age=31536000, immutable

# JS y CSS: caché con hash (Vite los versiona automáticamente)
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# HTML: revalidar siempre (sin caché de página)
/*.html
  Cache-Control: no-cache

# JSON: caché corta
/*.json
  Cache-Control: public, max-age=3600

# Seguridad
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
`
fs.writeFileSync(path.join(DIST_DIR, '_headers'), headers)
console.log('✅ _headers generado')

// ─── Copiar imágenes usadas al dist ───────────────────────────────────────────
const imgDistDir = path.join(DIST_DIR, 'assets/images')
fs.mkdirSync(imgDistDir, { recursive: true })

let copiedCount = 0
for (const imgFile of usedImages) {
  const src = path.join(ALBUM_DIR, imgFile)
  const dest = path.join(imgDistDir, imgFile)
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.copyFileSync(src, dest)
    copiedCount++
  }
}

// Copiar logo e imágenes esenciales del álbum
const essentialFiles = [
  'House Gatitos.webp',
  'House Gatitos-01.png',
  'House Gatitos-02.png',
  'House Gatitos-AMP.png',
  'favicon.ico',
]
for (const ef of essentialFiles) {
  const src = path.join(ALBUM_DIR, ef)
  const dest = path.join(imgDistDir, ef)
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.copyFileSync(src, dest)
    copiedCount++
  }
  // También copiar favicon al raíz del dist
  if (ef === 'favicon.ico') {
    const faviconSrc = path.join(__dirname, 'Blogger/Blogs/House Gatitos 🐾 _ Consejos, cuidados y curiosidad/favicon.ico')
    if (fs.existsSync(faviconSrc)) {
      fs.copyFileSync(faviconSrc, path.join(DIST_DIR, 'favicon.ico'))
    }
  }
}

console.log(`✅ ${copiedCount} imágenes procesadas e integradas`)

// ─── Generar páginas de silos ─────────────────────────────────────────────────
const SILO_TEMPLATE = readTemplate('silo.html')
let generatedSilosCount = 0
if (SILO_TEMPLATE) {
  const silosInfo = {
    razas: { name: 'Razas y Morfología', icon: '🐱', desc: 'Fichas completas de razas de gatos domésticas y exóticas. Aprende sobre sus características, comportamiento y cuidados específicos.' },
    salud: { name: 'Salud y Síntomas', icon: '🩺', desc: 'Respuestas prácticas ante síntomas, nutrición y prevención. Aprende a detectar anomalías y cuidar el bienestar físico de tu felino.' },
    guias: { name: 'Guías y Recursos', icon: '📚', desc: 'Tutoriales detallados, guías prácticas y herramientas para facilitarte el cuidado del gato en el día a día.' },
    curiosidades: { name: 'Curiosidades y Cultura', icon: '✨', desc: 'Conoce la historia, arte, literatura y anécdotas del vínculo emocional único entre humanos y gatos.' }
  }

  for (const [siloId, info] of Object.entries(silosInfo)) {
    const siloSlug = siloId === 'cultura' ? 'curiosidades' : siloId
    const siloDir = path.join(PUBLIC_DIR, siloSlug)
    fs.mkdirSync(siloDir, { recursive: true })

    const siloPosts = posts.filter(p => p.silo.id === siloId)

    const postsListHtml = siloPosts.map(p => `
      <a href="/${p.slug}/" class="post-card animate-in" data-silo="${p.silo.id}">
        <div class="post-card-img">
          ${p.featuredImg
            ? `<img src="${p.featuredImg}" alt="${escHtml(p.title)}" loading="lazy" width="400" height="225" onerror="this.parentElement.innerHTML='<div class=&quot;post-card-placeholder&quot;>${p.silo.icon}</div>'">`
            : `<div class="post-card-placeholder">${p.silo.icon}</div>`
          }
        </div>
        <div class="post-card-body">
          <p class="post-card-silo">${p.silo.icon} ${escHtml(p.silo.name)}</p>
          <h3 class="post-card-title">${escHtml(p.title)}</h3>
          <p class="post-card-desc">${escHtml(p.description)}</p>
          <time class="post-card-date" datetime="${p.datePublished}">${p.datePublished}</time>
        </div>
      </a>
    `).join('')

    const jsonLdBreadcrumb = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": info.name, "item": `${SITE_URL}/${siloSlug}/` }
      ]
    }, null, 2)

    let html = SILO_TEMPLATE
      .replace(/\{\{SITE_URL\}\}/g, SITE_URL)
      .replace(/\{\{SILO_NAME\}\}/g, info.name)
      .replace(/\{\{SILO_ICON\}\}/g, info.icon)
      .replace(/\{\{SILO_DESC\}\}/g, info.desc)
      .replace(/\{\{SILO_SLUG\}\}/g, siloSlug)
      .replace(/\{\{CANONICAL\}\}/g, `${SITE_URL}/${siloSlug}/`)
      .replace(/\{\{POSTS_LIST\}\}/g, postsListHtml)
      .replace(/\{\{JSONLD_BREADCRUMB\}\}/g, jsonLdBreadcrumb)

    // Navbar highlights
    html = html.replace('{{#if_razas}}', siloId === 'razas' ? 'class="active"' : '')
               .replace('{{#if_salud}}', siloId === 'salud' ? 'class="active"' : '')
               .replace('{{#if_guias}}', siloId === 'guias' ? 'class="active"' : '')
               .replace('{{#if_curiosidades}}', siloId === 'cultura' ? 'class="active"' : '')

    fs.writeFileSync(path.join(siloDir, 'index.html'), html)
    generatedSilosCount++
  }
}

// ─── Generar página de la calculadora ─────────────────────────────────────────
const CALC_TEMPLATE = readTemplate('calculator.html')
let generatedCalc = false
if (CALC_TEMPLATE) {
  const calcDir = path.join(PUBLIC_DIR, 'calculadora-comida-gatos')
  fs.mkdirSync(calcDir, { recursive: true })

  const html = CALC_TEMPLATE.replace(/\{\{SITE_URL\}\}/g, SITE_URL)

  fs.writeFileSync(path.join(calcDir, 'index.html'), html)
  generatedCalc = true
}

// ─── Copiar style.css para desarrollo local ───────────────────────────────────
const srcCss = path.join(SRC_DIR, 'style.css')
const destCss = path.join(PUBLIC_DIR, 'style.css')
let copiedCss = false
if (fs.existsSync(srcCss)) {
  fs.copyFileSync(srcCss, destCss)
  copiedCss = true
}

// ─── Pasar datos al src para que Vite los use ────────────────────────────────
// Guardar posts JSON para uso en la home
fs.writeFileSync(
  path.join(PUBLIC_DIR, 'posts-data.json'),
  JSON.stringify(posts.map(p => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    silo: p.silo,
    categories: p.categories,
    datePublished: p.datePublished,
    featuredImg: p.featuredImg,
  })), null, 2)
)

console.log('\n🎉 Build del blog completado exitosamente!')
console.log(`   Posts generados: ${posts.length}`)
console.log(`   Silos generados: ${generatedSilosCount}`)
console.log(`   Calculadora generada: ${generatedCalc ? 'Sí' : 'No'}`)
console.log(`   CSS copiado a public: ${copiedCss ? 'Sí' : 'No'}`)
console.log(`   Redirecciones generadas: ${uniqueRedirects.length}`)
console.log(`   Imágenes procesadas: ${copiedCount}`)

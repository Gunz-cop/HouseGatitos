# House Gatitos 🐾

**Centro de Soluciones y Cuidado Felino**

> Guia para agentes e IDEs con IA: si vas a generar prompts o imagenes para articulos, lee primero `AGENTS.md`.

Blog estático construido con **Vite + HTML/CSS/Vanilla JS**, desplegado en **Cloudflare Pages** con CI/CD desde **GitHub**.

---

## Tecnología

| Capa | Tecnología |
|---|---|
| Build tool | Vite 5 |
| Frontend | HTML + CSS + Vanilla JS (sin frameworks) |
| Generador de contenido | Node.js (`build-blog.js`) |
| Fuente de datos | `Blogger/Blogs/.../feed.atom` |
| Imágenes | `Blogger/Albums/House Gatitos/` |
| Hosting | Cloudflare Pages |
| Repositorio | GitHub |
| Dominio | housegatitos.com |

---

## Estructura del Proyecto

```
HouseGatitos/
├── Blogger/               ← Exportación original de Blogger
│   ├── Albums/House Gatitos/    ← Imágenes locales (~750 archivos)
│   └── Blogs/House Gatitos.../
│       └── feed.atom            ← Fuente de datos (75 posts)
├── src/
│   ├── index.html         ← Home (Centro de Soluciones)
│   └── style.css          ← CSS global premium
├── templates/
│   └── post.html          ← Plantilla de artículo
├── public/
│   ├── search-index.json  ← Índice de búsqueda (generado)
│   └── posts-data.json    ← Datos de posts para la home (generado)
├── dist/                  ← Output de build (para Cloudflare)
│   ├── index.html
│   ├── [slug]/index.html  ← Cada post en su propia carpeta
│   ├── _redirects         ← Redirecciones 301 de URLs antiguas
│   ├── sitemap.xml
│   └── robots.txt
├── build-blog.js          ← Script que parsea el feed y genera HTML
├── vite.config.js
└── package.json
```

---

## Desarrollo local

```bash
# Instalar dependencias (solo la primera vez)
npm install

# Generar posts + servir en modo dev
npm run dev
```

Esto ejecuta primero `build-blog.js` (genera dist/ con posts, _redirects, sitemap) y luego Vite en modo dev.

---

## Build de producción

```bash
npm run build
```

La carpeta `dist/` contiene el sitio listo para subir a Cloudflare Pages.

---

## Configuración en Cloudflare Pages

En el dashboard de Cloudflare Pages, usa estas opciones:

| Parámetro | Valor |
|---|---|
| **Framework preset** | None (Custom) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` |
| **Node.js version** | `20` |

---

## SEO

- ✅ URLs limpias (`/nombre-del-post/`) sin fechas ni `.html`
- ✅ Redirecciones 301 de URLs antiguas de Blogger
- ✅ Etiquetas canónicas en cada página
- ✅ JSON-LD `BlogPosting` con autor "Equipo de House Gatitos"
- ✅ JSON-LD `WebSite` y `Organization` en la Home
- ✅ Breadcrumbs semánticos con JSON-LD
- ✅ Sitemap XML con fechas de modificación
- ✅ Open Graph y Twitter Card en todos los posts

---

## Autor del contenido

**Equipo de House Gatitos** — así figura en todos los metadatos y datos estructurados del sitio.

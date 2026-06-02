# House Gatitos — Configuración para Cloudflare Pages
# Este archivo documenta los ajustes que debes configurar en el dashboard de Cloudflare Pages.
# NO reemplaza la configuración en el dashboard — es solo de referencia.

# ── Configuración de Build en Cloudflare Pages Dashboard ──
# Framework preset: None (Custom)
# Build command:    npm run build
# Build output dir: dist
# Root directory:   /
# Node.js version:  20

# ── Variables de entorno (si las necesitas en el futuro) ──
# Puedes añadir variables en Cloudflare Pages > Settings > Environment variables

# ── Headers globales para máxima caché y seguridad ──
# Cloudflare Pages lee el archivo _headers en la raíz de /dist

# El archivo _headers se genera automáticamente durante el build.
# Si necesitas añadir headers personalizados, edita el bloque de código
# en build-blog.js que genera el archivo _headers.

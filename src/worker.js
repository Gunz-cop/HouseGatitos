const CANONICAL_HOST = 'housegatitos.com';
const SITE_URL = `https://${CANONICAL_HOST}`;

const DIRECT_REDIRECTS = new Map([
  ['/2025/08/comportamiento-felino-etapas-vida.html', '/guias/comportamiento-felino/'],
  ['/comportamiento-felino/', '/guias/comportamiento-felino/'],
  ['/comportamiento-felino-etapas-vida/', '/guias/comportamiento-felino/'],
  ['/2025/08/lenguaje-corporal-gato-guia.html', '/curiosidades/lenguaje-corporal-gatos/'],
  ['/lenguaje-corporal-gatos/', '/curiosidades/lenguaje-corporal-gatos/'],
  ['/lenguaje-corporal-gato-guia/', '/curiosidades/lenguaje-corporal-gatos/'],
  ['/2025/08/gato-azul-ruso-caracteristicas-cuidados.html', '/razas/gato-azul-ruso/'],
  ['/gato-azul-ruso/', '/razas/gato-azul-ruso/'],
  ['/gato-azul-ruso-caracteristicas-cuidados/', '/razas/gato-azul-ruso/'],
  ['/2025/08/gato-abisinio-historia-caracteristicas.html', '/razas/gato-abisinio/'],
  ['/gato-abisinio/', '/razas/gato-abisinio/'],
  ['/gato-abisinio-historia-caracteristicas/', '/razas/gato-abisinio/'],
  ['/2025/08/checklist-cuidados-diarios-gato.html', '/salud/cuidados-diarios-gato/'],
  ['/checklist-cuidados-diarios-gato/', '/salud/cuidados-diarios-gato/'],
  ['/cuidados-diarios-gato/', '/salud/cuidados-diarios-gato/'],
  ['/2025/08/como-cuidar-gatitos-recien-nacidos-sin-madre.html', '/salud/como-cuidar-gatitos-recien-nacidos-sin-madre/'],
  ['/como-cuidar-gatitos-recien-nacidos-sin-madre/', '/salud/como-cuidar-gatitos-recien-nacidos-sin-madre/'],
  ['/2025/08/gato-ragdoll-caracteristicas-cuidados.html', '/razas/gato-ragdoll/'],
  ['/gato-ragdoll/', '/razas/gato-ragdoll/'],
  ['/gato-ragdoll-caracteristicas-cuidados/', '/razas/gato-ragdoll/'],
  ['/2021/09/Gato-Maine-Coon.html', '/razas/gato-maine-coon/'],
  ['/Gato-Maine-Coon/', '/razas/gato-maine-coon/'],
  ['/2022/05/Gato-Tailandes.html', '/razas/gato-tailandes/'],
  ['/Gato-Tailandes/', '/razas/gato-tailandes/'],
  ['/razas/Gato-Tailandes/', '/razas/gato-tailandes/'],
  ['/2022/02/Obesidad-en-gatos.html', '/salud/obesidad-en-gatos/'],
  ['/Obesidad-en-gatos/', '/salud/obesidad-en-gatos/'],
  ['/salud/Obesidad-en-gatos/', '/salud/obesidad-en-gatos/'],
]);

function redirectTo(url, targetPath, status = 301) {
  return Response.redirect(`${SITE_URL}${targetPath}${url.search}`, status);
}

function withSeoHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'index, follow');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (headers.get('content-type')?.includes('text/html')) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.protocol !== 'https:' || url.hostname !== CANONICAL_HOST) {
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
      const directPath = DIRECT_REDIRECTS.get(url.pathname);
      if (directPath) {
        url.pathname = directPath;
      }
      return Response.redirect(url.toString(), 301);
    }

    const directPath = DIRECT_REDIRECTS.get(url.pathname);
    if (directPath) {
      return redirectTo(url, directPath);
    }

    if (url.pathname === '/healthz') {
      return Response.json({
        ok: true,
        site: CANONICAL_HOST,
        checkedAt: new Date().toISOString(),
      });
    }

    if (url.pathname === '/api/geo') {
      const country = request.cf?.country || request.headers.get('cf-ipcountry') || 'unknown';
      return new Response(JSON.stringify({ country }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    const response = await env.ASSETS.fetch(request);
    return withSeoHeaders(response);
  },
};

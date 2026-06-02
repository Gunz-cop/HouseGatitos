import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'

const __dir = resolve(fileURLToPath(new URL('.', import.meta.url)))

export default defineConfig({
  root: 'src',
  plugins: [
    {
      name: 'mpa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Extraer la ruta sin parámetros de búsqueda o hashes
          const urlPath = req.url.split('?')[0].split('#')[0]
          
          // Si no tiene extensión (ej: /freddie-mercury-y-su-infinito-amor-por/)
          if (!urlPath.includes('.')) {
            const cleanPath = urlPath.endsWith('/') ? urlPath : urlPath + '/'
            // Determinar la ruta física en el directorio public
            const publicFile = resolve(__dir, 'public', cleanPath.substring(1), 'index.html')
            
            if (fs.existsSync(publicFile)) {
              // Reescribir la URL interna para que apunte al index.html correspondiente
              req.url = cleanPath + 'index.html' + req.url.substring(urlPath.length)
            }
          }
          next()
        })
      }
    }
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: false,
    copyPublicDir: true,
    rollupOptions: {
      input: resolve(__dir, 'src/index.html'),
      output: {
        // Nombrar el CSS como style.css (no con hash) para que los posts puedan referenciarlo
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'style.css'
          return 'assets/[name]-[hash][extname]'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    minify: 'esbuild',
    cssMinify: true,
  },
  publicDir: resolve(__dir, 'public'),
})

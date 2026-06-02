import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dir = resolve(fileURLToPath(new URL('.', import.meta.url)))

export default defineConfig({
  root: 'src',
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

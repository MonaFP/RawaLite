import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './', // Relative Pfade für Electron loadFile() Kompatibilität
  plugins: [react()],
  resolve: {
    alias: {
    '@': new URL('./src', import.meta.url).pathname,
    '@components': new URL('./src/components', import.meta.url).pathname,
    '@pages': new URL('./src/pages', import.meta.url).pathname,
    },
  },
  build: {
    outDir: 'dist-web',
    assetsDir: 'assets',
    manifest: true,
    // Cache building fixes for v1.0.42
    rollupOptions: {
      cache: false, // Disable persistent cache to prevent stale builds
    },
    minify: 'esbuild', // Consistent minification
    target: 'es2022' // Align with tsconfig
  },
  server: { port: 5174 },
  // Additional cache fixes
  optimizeDeps: {
    force: false, // Let Vite handle dep optimization
    exclude: ['electron'] // Don't try to optimize electron
  },
  // Clear cache on config change
  clearScreen: false
})

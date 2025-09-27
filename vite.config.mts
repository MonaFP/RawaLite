// vite.config.mts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// -------------------------------------------------------------
// RawaLite Vite-Konfiguration
// - DEV: lockere CSP-Header NUR für HMR/WebSocket
// - PROD: keine Header von Vite -> strenge CSP aus index.html greift
// -------------------------------------------------------------

export default defineConfig(() => {
  // Zentrale CSP-Konfiguration (identisch zu electron/main.ts)
  const CSP_BASE = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:";

  return {
    plugins: [
      react(),
      // 👉 weitere Plugins hier einfügen (falls vorhanden)
    ],

    // ---- DEV-Server-Header: einheitliche CSP-Konfiguration ----
    server: {
      // host/port optional anpassen
      // host: true,
      // port: 5173,
      headers: {
        'Content-Security-Policy': CSP_BASE
      }
    },

    // ---- Preview-Server (optional) ----
    preview: {
      headers: {} // keine CSP-Header hier; index.html regelt CSP
    },

    // ---- Build-Optionen (belasse schlank; electron handled bundling) ----
    build: {
      target: 'esnext',
      // Relative paths for Electron compatibility
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          // Ensure relative paths in generated HTML
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    },

    // ---- Base path for Electron ----
    base: './',

    // ---- Resolve/Aliasse (TypeScript path mapping) ----
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
        '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
        '@contexts': fileURLToPath(new URL('./src/contexts', import.meta.url)),
        '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
        '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
        '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
        '@persistence': fileURLToPath(new URL('./src/persistence', import.meta.url))
      }
    },

    // ---- OptimizeDeps (nur wenn ihr spezielle Targets braucht) ----
    // optimizeDeps: {
    //   esbuildOptions: { target: 'es2020' }
    // }
  };
});

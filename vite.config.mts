// vite.config.mts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// -------------------------------------------------------------
// RawaLite Vite-Konfiguration
// - DEV: lockere CSP-Header NUR für HMR/WebSocket
// - PROD: keine Header von Vite -> strenge CSP aus index.html greift
// -------------------------------------------------------------

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  // DEV-CSP (nur das Nötigste für HMR/WS; keine externen Domains)
  const devCsp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'",        // nötig für HMR in DEV
    "connect-src 'self' ws: http://localhost:*", // HMR/WebSocket
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:"
  ].join('; ');

  return {
    plugins: [
      react(),
      // 👉 weitere Plugins hier einfügen (falls vorhanden)
    ],

    // ---- DEV-Server-Header: nur im Development-Mode setzen ----
    server: {
      // host/port optional anpassen
      // host: true,
      // port: 5173,
      headers: isDev ? { 'Content-Security-Policy': devCsp } : {}
    },

    // ---- Preview-Server (optional) ----
    preview: {
      headers: {} // keine CSP-Header hier; index.html regelt CSP
    },

    // ---- Build-Optionen (belasse schlank; electron handled bundling) ----
    build: {
      target: 'esnext',
      // outDir, sourcemap etc. falls nötig hier ergänzen
    },

    // ---- Resolve/Aliasse (falls ihr @/… nutzt) ----
    // resolve: {
    //   alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    // },

    // ---- OptimizeDeps (nur wenn ihr spezielle Targets braucht) ----
    // optimizeDeps: {
    //   esbuildOptions: { target: 'es2020' }
    // }
  };
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
    '@': new URL('./src', import.meta.url).pathname,
    '@components': new URL('./src/components', import.meta.url).pathname,
    '@pages': new URL('./src/pages', import.meta.url).pathname,
    },
  },
  server: { port: 5173 },
})

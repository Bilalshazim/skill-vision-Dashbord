import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // In sviluppo /api va al backend locale, come fa serve-combined in
  // produzione, così il cookie httpOnly della sessione è della stessa origine.
  server: {
    proxy: { '/api': { target: process.env.BACKEND_DEV_URL || 'http://localhost:4000', changeOrigin: false, xfwd: true } },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  preview: {
    // `vite preview` is what serves the production build on Railway (see
    // package.json "start"). Vite blocks unrecognized Host headers by
    // default (DNS-rebinding protection), so the deployed Railway domain
    // must be listed explicitly rather than disabling the check outright.
    // PREVIEW_ALLOWED_HOSTS is a comma-separated list for adding a future
    // custom domain without another code change.
    allowedHosts: [
      'skill-vision-production-6a42.up.railway.app',
      ...(process.env.PREVIEW_ALLOWED_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean) ?? []),
    ],
  },
})

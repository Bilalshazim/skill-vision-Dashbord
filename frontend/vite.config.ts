import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// The legacy static shell (login/landing) lives one level up from this Vite
// project — see legacyShellDevServer() below for why that matters in dev.
const shellRoot = path.resolve(import.meta.dirname, '..')

const SHELL_MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
}

// Vite's project root is this frontend/ folder, so by default it resolves
// "/" and "/index.html" to ITS OWN index.html (the React SPA shell) — never
// to the real legacy shell at <repo root>/index.html, which sits outside
// this root entirely. That's why the dev server used to open the React Home
// directly at "/" and render blank at "/index.html" (index.html loads, but
// no React Route matches that literal pathname).
//
// shell-bridge.ts's SHELL_ENTRY_URL ('/index.html') and both module auth
// guards already assume the legacy shell answers at that URL, so the fix is
// to make the dev server actually serve it there — a pre-hook middleware
// that answers the legacy shell's own document + its css/js/assets requests
// from <repo root>, and defers everything else (React routes, HMR, module
// requests) to Vite as usual.
function legacyShellDevServer(): Plugin {
  return {
    name: 'legacy-shell-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' || !req.url) return next()
        const urlPath = req.url.split('?')[0]

        const isShellDocument = urlPath === '/' || urlPath === '/index.html'
        const isShellAsset = /^\/(?:css|js|assets)\//.test(urlPath)
        if (!isShellDocument && !isShellAsset) return next()

        const relPath = isShellDocument ? 'index.html' : urlPath.slice(1)
        const filePath = path.join(shellRoot, relPath)
        if (
          !filePath.startsWith(shellRoot + path.sep) && filePath !== shellRoot ||
          !fs.existsSync(filePath) ||
          fs.statSync(filePath).isDirectory()
        ) {
          return next()
        }

        res.setHeader('Content-Type', SHELL_MIME[path.extname(filePath)] || 'application/octet-stream')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [legacyShellDevServer(), react(), tailwindcss()],
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

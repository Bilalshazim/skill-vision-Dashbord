import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'

// Combined local server: legacy static site (index.html, js/, css/,
// assets/) at the repo root, React build mounted under /assessment and
// /recruiting — all on ONE origin, so sessionStorage/localStorage set by
// index.html's login is visible to the React app, matching how this must
// be deployed in production (see the "Deep links" / SPA-fallback finding
// in the backend's production-readiness notes).
//
// Usage (from frontend/, after `npm run build`):
//   npm run serve:combined
// then open http://localhost:8300/
//
// Args: ROOT (repo root, relative to this script) DIST (React build dir) PORT
const ROOT = process.argv[2]
const DIST = process.argv[3]
const PORT = Number(process.argv[4] || 8300)

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }

function send(res, filePath) {
  const ext = path.extname(filePath)
  const body = fs.readFileSync(filePath)
  res.writeHead(200, { 'Content-Type': (MIME[ext] || 'application/octet-stream') + (ext === '.html' || ext === '.js' || ext === '.css' ? '; charset=utf-8' : '') })
  res.end(body)
}

const CATALOG_ENABLED = process.env.VITE_ENABLE_COMPONENT_CATALOG === 'true'
const REACT_PREFIXES = ['/login', '/jd', '/recruiting', '/assessment', '/evaluate', ...(CATALOG_ENABLED ? ['/dev/components'] : [])]

function isReactRoute(urlPath) {
  const p = urlPath.length > 1 ? urlPath.replace(/\/+$/, '') : urlPath
  if (p === '/' || p === '') return true
  return REACT_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + '/'))
}

// Fase 8, modalità `backend`: l'API passa da qui (/api/* → backend), così
// browser e API hanno la stessa origine e il cookie httpOnly del refresh è
// di prima parte (SameSite=Strict). Acceso solo con BACKEND_INTERNAL_URL
// (es. l'indirizzo privato del servizio Backend su Railway); senza, /api
// non viene toccato e tutto resta come prima.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL ? new URL(process.env.BACKEND_INTERNAL_URL) : null

function proxyToBackend(req, res) {
  const target = new URL(req.url.replace(/^\/api/, '/api'), BACKEND_INTERNAL_URL)
  const lib = target.protocol === 'https:' ? https : http
  // L'IP del client per il limite dei tentativi di login: l'ultimo indirizzo
  // di X-Forwarded-For è quello aggiunto dal bordo di Railway (il client vero);
  // quelli prima li può scrivere chiunque. Si inoltra solo quello, così il
  // backend resta a TRUST_PROXY_HOPS=1 sia dietro questo proxy sia sul suo
  // dominio pubblico.
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map((x) => x.trim()).filter(Boolean)
  const forwardedFor = xff[xff.length - 1] || req.socket.remoteAddress || ''
  const upstream = lib.request(
    target,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: target.host,
        'x-forwarded-host': req.headers['x-forwarded-host'] || req.headers.host,
        'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'http',
        'x-forwarded-for': forwardedFor,
      },
    },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers)
      up.pipe(res)
    },
  )
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: { code: 'bad_gateway', message: 'Backend unreachable' } }))
  })
  req.pipe(upstream)
}

const server = http.createServer((req, res) => {
  try {
    if (BACKEND_INTERNAL_URL && (req.url === '/api' || req.url.startsWith('/api/'))) return proxyToBackend(req, res)

    const urlPath = decodeURIComponent(req.url.split('?')[0])

    if (urlPath.startsWith('/assets/') || urlPath.startsWith('/brand/')) {
      const legacy = path.join(ROOT, urlPath)
      if (fs.existsSync(legacy) && fs.statSync(legacy).isFile()) return send(res, legacy)
      const distAsset = path.join(DIST, urlPath)
      if (fs.existsSync(distAsset) && fs.statSync(distAsset).isFile()) return send(res, distAsset)
    }

    // Rotte dell'app React: si serve sempre index.html della build e
    // l'instradamento lo fa React Router. Barra finale ammessa
    // (/dev/components/ = /dev/components). La radice è l'app React (scelta
    // del modulo); il login legacy resta su /index.html e dopo l'accesso
    // rimanda qui. Il catalogo è servito solo se l'ambiente lo accende in
    // modo esplicito, con la stessa variabile che lo compila nel bundle.
    if (isReactRoute(urlPath)) {
      return send(res, path.join(DIST, 'index.html'))
    }

    let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath)
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html')
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return send(res, filePath)

    // Not in the legacy shell root — fall back to the React build's own
    // top-level static files (favicon.svg, etc.) before giving up. Vite
    // copies frontend/public/* verbatim to dist/'s root, but the ROOT-only
    // lookup above never checked there, so a bare request like
    // /favicon.svg (which every browser makes regardless of which page
    // loaded) 404'd even though the file genuinely exists in dist/.
    if (urlPath !== '/') {
      const distFallback = path.join(DIST, urlPath)
      if (fs.existsSync(distFallback) && fs.statSync(distFallback).isFile()) return send(res, distFallback)
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found: ' + urlPath)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(String(err))
  }
})

server.listen(PORT, () => console.log(`Local server running at http://localhost:${PORT}`))

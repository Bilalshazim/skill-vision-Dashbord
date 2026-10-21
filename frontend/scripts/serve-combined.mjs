import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'

// Il server del frontend in produzione (Railway, npm start) e in prova
// locale: serve la build React e passa /api al backend (stessa origine, così
// il cookie httpOnly della sessione è di prima parte). Il guscio statico
// legacy (index.html, js/, css/) è stato ritirato (Fase 8,
// PROGETTO-TUTTO-SUL-SERVER.md Parte 3): ogni pagina è l'app React.
//
// Uso (da frontend/, dopo npm run build): node scripts/serve-combined.mjs dist 8300
const DIST = process.argv[2]
const PORT = Number(process.argv[3] || 8300)

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }

function send(res, filePath) {
  const ext = path.extname(filePath)
  const body = fs.readFileSync(filePath)
  res.writeHead(200, { 'Content-Type': (MIME[ext] || 'application/octet-stream') + (ext === '.html' || ext === '.js' || ext === '.css' ? '; charset=utf-8' : '') })
  res.end(body)
}

// L'API passa da qui (/api/* → backend), così
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

    // I vecchi segnalibri del login legacy portano all'app.
    if (urlPath === '/index.html') {
      res.writeHead(302, { Location: '/' })
      return res.end()
    }

    // File della build (asset, favicon, marchio).
    const root = path.resolve(DIST)
    const filePath = path.resolve(root, '.' + urlPath)
    if (filePath.startsWith(root + path.sep) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return send(res, filePath)

    // Un file che non c'è: 404, non la pagina dell'app.
    if (path.extname(urlPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      return res.end('Not found: ' + urlPath)
    }

    // Ogni altra rotta è dell'app React: index.html della build, e
    // l'instradamento lo fa React Router.
    return send(res, path.join(DIST, 'index.html'))
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(String(err))
  }
})

server.listen(PORT, () => console.log(`Local server running at http://localhost:${PORT}`))

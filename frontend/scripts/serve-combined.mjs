import http from 'node:http'
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
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  res.end(body)
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0])

    if (urlPath.startsWith('/assets/') || urlPath.startsWith('/brand/')) {
      const legacy = path.join(ROOT, urlPath)
      if (fs.existsSync(legacy) && fs.statSync(legacy).isFile()) return send(res, legacy)
      const distAsset = path.join(DIST, urlPath)
      if (fs.existsSync(distAsset) && fs.statSync(distAsset).isFile()) return send(res, distAsset)
    }

    if (urlPath === '/assessment' || urlPath.startsWith('/assessment/') || urlPath === '/recruiting' || urlPath.startsWith('/recruiting/')) {
      return send(res, path.join(DIST, 'index.html'))
    }

    let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath)
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html')
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return send(res, filePath)

    res.writeHead(404)
    res.end('Not found: ' + urlPath)
  } catch (err) {
    res.writeHead(500)
    res.end(String(err))
  }
})

server.listen(PORT, () => console.log(`Local server running at http://localhost:${PORT}`))

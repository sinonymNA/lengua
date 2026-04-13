/**
 * Standalone static file server for when Railway deploys the client/ directory
 * as a separate service. In the monorepo Dockerfile build this file is unused
 * (Express serves the compiled assets directly).
 *
 * Set API_URL to the Railway URL of the server service so /api/ calls proxy correctly.
 * e.g. API_URL=https://lengua-server.up.railway.app
 */
import { createServer } from 'http'
import { createReadStream, existsSync, statSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PORT = process.env.PORT || 3000
const API_URL = (process.env.API_URL || '').replace(/\/$/, '')
const DIST = join(__dirname, 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
}

async function readBody(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

async function proxyApi(req, res) {
  if (!API_URL) {
    res.writeHead(502)
    return res.end(JSON.stringify({ error: 'API_URL not configured' }))
  }
  const target = `${API_URL}${req.url}`
  const body = await readBody(req)
  const headers = { ...req.headers }
  delete headers.host
  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: body.length ? body : undefined,
    })
    res.writeHead(upstream.status, Object.fromEntries(upstream.headers.entries()))
    const buf = await upstream.arrayBuffer()
    res.end(Buffer.from(buf))
  } catch (err) {
    res.writeHead(502)
    res.end(JSON.stringify({ error: 'Upstream unavailable' }))
  }
}

function serveFile(res, filePath) {
  const ext = extname(filePath)
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  createReadStream(filePath).pipe(res)
}

const server = createServer(async (req, res) => {
  const url = req.url.split('?')[0]

  // Health check
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ status: 'ok' }))
  }

  // Proxy API calls to the server service
  if (url.startsWith('/api/')) {
    return proxyApi(req, res).catch(() => {
      res.writeHead(502)
      res.end('Bad gateway')
    })
  }

  // Static files
  let filePath = join(DIST, url === '/' ? 'index.html' : url)
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(DIST, 'index.html') // SPA fallback
  }
  serveFile(res, filePath)
})

server.listen(PORT, () => console.log(`Lengua client serving on port ${PORT}`))

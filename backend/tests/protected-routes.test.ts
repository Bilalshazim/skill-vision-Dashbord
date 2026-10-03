import fs from 'node:fs'
import path from 'node:path'

import jwt from 'jsonwebtoken'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, prisma, resetDb, seedFixture } from './helpers.js'

// Fase 8 — ogni rotta protetta accetta SOLO un token d'accesso valido emesso
// dal backend (POST /auth/login). L'elenco delle rotte si legge dai file dei
// router, non da una lista scritta a mano: una rotta aggiunta domani entra nel
// controllo da sola, e una rotta nuova senza protezione fa fallire il test.

const SRC = path.resolve(import.meta.dirname, '../src')
const FAKE_ID = '00000000-0000-4000-8000-000000000000'

type RouteInfo = { method: 'get' | 'post' | 'put' | 'patch' | 'delete'; url: string; guard: 'requireAuth' | 'optionalAuth' | 'none' }

function mounts(): Record<string, string> {
  const app = fs.readFileSync(path.join(SRC, 'app.ts'), 'utf8')
  return Object.fromEntries([...app.matchAll(/app\.use\('([^']+)',\s*(\w+Router)\)/g)].map((m) => [m[2], m[1]]))
}

function routes(): RouteInfo[] {
  const out: RouteInfo[] = []
  const prefixes = mounts()
  for (const dir of fs.readdirSync(path.join(SRC, 'modules'))) {
    const file = path.join(SRC, 'modules', dir, 'routes.ts')
    if (!fs.existsSync(file)) continue
    const src = fs.readFileSync(file, 'utf8')
    const defs = [...src.matchAll(/(\w+Router)\.(get|post|put|patch|delete)\(\s*'([^']+)'/g)]
    for (let i = 0; i < defs.length; i++) {
      const [, router, method, p] = defs[i]
      const prefix = prefixes[router]
      if (!prefix) continue
      const routerLevel = new RegExp(`${router}\\.use\\(requireAuth\\)`).test(src)
      // I middleware della rotta stanno fra la sua definizione e la successiva.
      const body = src.slice(defs[i].index!, defs[i + 1]?.index ?? src.length).slice(0, 400)
      const guard = routerLevel || /\brequireAuth\b/.test(body.split('async (')[0]) ? 'requireAuth' : /\boptionalAuth\b/.test(body.split('async (')[0]) ? 'optionalAuth' : 'none'
      out.push({ method: method as RouteInfo['method'], url: prefix + p.replace(/:\w+/g, FAKE_ID), guard })
    }
  }
  return out
}

// Rotte pubbliche per scelta, ognuna con la sua protezione propria.
const PUBLIC = new Map<string, string>([
  ['POST /api/v1/auth/login', 'credenziali'],
  ['POST /api/v1/auth/refresh', 'refresh token (corpo o cookie con controllo d’origine)'],
  ['POST /api/v1/auth/logout', 'refresh token (corpo o cookie con controllo d’origine)'],
  [`GET /api/v1/cv/${FAKE_ID}/file`, 'URL firmato a tempo'],
])
const isWebhook = (r: RouteInfo) => r.url.startsWith('/api/v1/webhooks')
// /health risponde solo «vivo / database raggiungibile», senza dati: serve a Railway.
const isHealth = (r: RouteInfo) => r.url.startsWith('/health')

const call = (r: RouteInfo, headers: Record<string, string> = {}) => {
  let req = api[r.method](r.url)
  for (const [k, v] of Object.entries(headers)) req = req.set(k, v)
  return r.method === 'get' || r.method === 'delete' ? req : req.send({})
}

describe('Fase 8 — rotte protette: solo token validi emessi dal backend', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  const all = routes()

  it('trova le rotte dei router (controllo del controllo)', () => {
    expect(all.length).toBeGreaterThan(40)
    expect(all.filter((r) => r.guard === 'requireAuth').length).toBeGreaterThan(30)
  })

  it('nessuna rotta senza protezione, salvo quelle pubbliche dichiarate e i webhook firmati', () => {
    const unguarded = all.filter((r) => r.guard === 'none' && !PUBLIC.has(`${r.method.toUpperCase()} ${r.url}`) && !isWebhook(r) && !isHealth(r))
    expect(unguarded.map((r) => `${r.method.toUpperCase()} ${r.url}`)).toEqual([])
  })

  it('senza token: 401 su ogni rotta protetta', async () => {
    const wrong: string[] = []
    for (const r of all.filter((x) => x.guard === 'requireAuth')) {
      const res = await call(r)
      if (res.status !== 401) wrong.push(`${r.method.toUpperCase()} ${r.url} → ${res.status}`)
    }
    expect(wrong).toEqual([])
  })

  it('token firmato con un’altra chiave, scaduto o malformato: 401 ovunque', async () => {
    const fx = await seedFixture()
    const claims = { sub: fx.platformAdmin.id, role: 'PLATFORM_ADMIN', companyId: null }
    const forged = jwt.sign(claims, 'una-chiave-che-non-e-quella-del-server', { expiresIn: '15m' })
    const expired = jwt.sign({ ...claims, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_ACCESS_SECRET!)
    const unsigned = jwt.sign(claims, '', { algorithm: 'none' } as jwt.SignOptions)
    const wrong: string[] = []
    for (const r of all.filter((x) => x.guard === 'requireAuth')) {
      for (const [name, token] of [['altra chiave', forged], ['scaduto', expired], ['alg none', unsigned], ['malformato', 'abc.def.ghi']]) {
        const res = await call(r, { Authorization: `Bearer ${token}` })
        if (res.status !== 401) wrong.push(`${name}: ${r.method.toUpperCase()} ${r.url} → ${res.status}`)
      }
    }
    expect(wrong).toEqual([])
  })

  it('le rotte dei valutatori senza JWT e senza token del valutatore non rispondono con dati', async () => {
    for (const r of all.filter((x) => x.guard === 'optionalAuth')) {
      const res = await call(r)
      expect([401, 403], `${r.method.toUpperCase()} ${r.url}`).toContain(res.status)
    }
  })

  it('un token valido emesso dal login passa la protezione', async () => {
    const fx = await seedFixture()
    const login = await api.post('/api/v1/auth/login').send({ email: fx.platformAdmin.email, password: 'pw123456' })
    expect(login.status).toBe(200)
    const me = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${login.body.accessToken}`)
    expect(me.status).toBe(200)
    const list = await api.get('/api/v1/platforms').set('Authorization', `Bearer ${login.body.accessToken}`)
    expect(list.status).not.toBe(401)
  })

  it('un account disattivato non entra, non rinnova la sessione e non legge /auth/me', async () => {
    const fx = await seedFixture()
    const login = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    await prisma.user.update({ where: { id: fx.recruiter.id }, data: { status: 'DISABLED' } })
    expect((await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })).status).toBe(401)
    expect((await api.post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken })).status).toBe(401)
    expect((await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${login.body.accessToken}`)).status).toBe(401)
  })
})

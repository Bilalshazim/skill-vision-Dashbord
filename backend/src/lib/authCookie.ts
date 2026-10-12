import type { Request, Response } from 'express'

import { env } from './env.js'

// Fase 8 — il refresh token in un cookie httpOnly: JavaScript nel browser
// non lo può leggere, quindi un XSS non lo ruba. Il cookie vale solo per le
// rotte di autenticazione (Path) e solo dalla stessa origine (SameSite=Strict):
// per questo, in modalità `backend`, il frontend chiama l'API attraverso il
// proprio server (`/api/*`, vedi frontend/scripts/serve-combined.mjs).
export const REFRESH_COOKIE = 'sv_refresh'
const PATH = '/api/v1/auth'

function cookieAttrs(maxAge: number): string {
  const secure = env.nodeEnv === 'production' ? '; Secure' : ''
  return `; Path=${PATH}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`
}

/** Il cookie scade con la sessione: `expiresAt` è la fine della sessione. */
export function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  const maxAge = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
  res.append('Set-Cookie', `${REFRESH_COOKIE}=${encodeURIComponent(token)}${cookieAttrs(maxAge)}`)
}

export function clearRefreshCookie(res: Response): void {
  res.append('Set-Cookie', `${REFRESH_COOKIE}=${cookieAttrs(0)}`)
}

export function readRefreshCookie(req: Request): string | null {
  const header = req.headers.cookie
  if (!header) return null
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === REFRESH_COOKIE) {
      const v = decodeURIComponent(rest.join('='))
      return v || null
    }
  }
  return null
}

// Difesa CSRF per le richieste che si autenticano con il cookie: devono
// venire da un'origine nota. Ammesse: la stessa origine della richiesta
// (anche dietro il proxy del frontend, via X-Forwarded-Host) e quelle in
// AUTH_COOKIE_ORIGINS (elenco separato da virgole). Senza Origin né Referer
// la richiesta col cookie è rifiutata: un browser li manda sempre su POST.
export function cookieRequestOriginAllowed(req: Request): boolean {
  const source = req.get('origin') || req.get('referer')
  if (!source) return false
  let origin: URL
  try {
    origin = new URL(source)
  } catch {
    return false
  }
  const hosts = [req.get('x-forwarded-host'), req.get('host')].filter(Boolean).flatMap((h) => h!.split(',').map((x) => x.trim()))
  if (hosts.includes(origin.host)) return true
  return env.authCookieOrigins.includes(origin.origin)
}

import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

import { env } from './env.js'

// JWT claims — §8: sub, role, companyId, platformId. requireAuth confronta
// in più `sv` con il database, così un cambio di password chiude subito le
// sessioni aperte invece di aspettare la scadenza del token.
export type AccessTokenClaims = {
  sub: string
  role: string
  companyId: string | null
  /** User.sessionVersion al momento del login: se nel frattempo è cresciuta
   *  (cambio password, ruolo o stato) il token non vale più. Assente nei token
   *  emessi prima della colonna: conta come 0. */
  sv?: number
}

/** `maxSec`: il token non dura oltre la fine della sessione (secondi che restano). */
export function signAccessToken(claims: AccessTokenClaims, maxSec?: number): string {
  const token = jwt.sign(claims, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl as jwt.SignOptions['expiresIn'] })
  if (maxSec == null) return token
  const { exp } = jwt.decode(token) as { exp: number }
  const cap = Math.floor(Date.now() / 1000) + Math.max(1, Math.floor(maxSec))
  return exp <= cap ? token : jwt.sign({ ...claims, exp: cap }, env.jwtAccessSecret)
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenClaims
}

// Refresh tokens are opaque random strings, stored server-side as a hash
// (never the raw value) so they're individually revocable — §8.
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

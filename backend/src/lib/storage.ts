import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { env } from './env.js'

// Blueprint §7: CV storage lives behind this interface so a real object
// store (S3-compatible) is a swap-in later, not a rewrite — everything
// above this file only ever calls `storage.save`/`storage.read`/`storage.remove`.
export interface FileStorage {
  save(key: string, data: Buffer): Promise<void>
  read(key: string): Promise<Buffer>
  remove(key: string): Promise<void>
}

class LocalDiskStorage implements FileStorage {
  constructor(private root: string) {}

  private resolve(key: string): string {
    // Reject any key that would escape the storage root — a stray "../" in
    // a generated key should never happen, but this makes it a hard error
    // instead of a path-traversal bug if it ever does (§19).
    const resolved = path.resolve(this.root, key)
    if (!resolved.startsWith(path.resolve(this.root) + path.sep)) {
      throw new Error(`Refusing to resolve storage key outside root: ${key}`)
    }
    return resolved
  }

  async save(key: string, data: Buffer): Promise<void> {
    const full = this.resolve(key)
    await fs.mkdir(path.dirname(full), { recursive: true })
    await fs.writeFile(full, data)
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key))
  }

  async remove(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true })
  }
}

export const storage: FileStorage = new LocalDiskStorage(env.cvStorageRoot)

export function checksumSha256(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

export function makeStorageKey(candidateId: string, fileId: string, originalFilename: string): string {
  const ext = path.extname(originalFilename)
  return `${candidateId}/${fileId}${ext}`
}

// Short-lived signed download URLs (§7, §19) — no real object storage
// pre-signed-URL service exists locally, so this HMAC-signs a (key,
// expiry) pair; src/modules/cv verifies it the same way. Swapping in real
// object storage later means swapping this for that provider's own
// presigned-URL call — the calling code (`GET /cv/:id`) doesn't change.
export function signFileToken(fileId: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + env.fileUrlTtlSeconds * 1000
  const payload = `${fileId}.${expiresAt}`
  const sig = crypto.createHmac('sha256', env.fileUrlSecret).update(payload).digest('hex')
  return { token: `${payload}.${sig}`, expiresAt }
}

export function verifyFileToken(fileId: string, token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [tokenFileId, expiresAtRaw, sig] = parts
  if (tokenFileId !== fileId) return false
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false
  const payload = `${tokenFileId}.${expiresAtRaw}`
  const expected = crypto.createHmac('sha256', env.fileUrlSecret).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

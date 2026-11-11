import net from 'node:net'

import { env } from './env.js'

// Controllo dei file caricati da chi non ha un account (Parte C, candidature dal link pubblico).
//
// 1. Controllo di base, sempre: il contenuto è davvero quello che dice l'estensione (PDF %PDF,
//    DOCX archivio zip PK, DOC contenitore OLE) e la firma di prova EICAR si rifiuta.
// 2. Il motore antivirus (correzioni di Roberto del 2026-11-10): ClamAV, tramite il demone clamd
//    (protocollo INSTREAM su TCP, nessuna dipendenza in più). **Fail-closed**: motore spento,
//    irraggiungibile, lento oltre il limite o con una risposta che non si capisce → il file si
//    rifiuta e non arriva né in archivio né in piattaforma. L'unica eccezione è
//    ANTIVIRUS_ALLOW_BASIC=true senza motore configurato, e vale solo per le società demo
//    (`allowBasic`, deciso dalla rotta): lì resta il solo controllo di base.

export type ScanResult = { ok: true; kind: 'pdf' | 'docx' | 'doc'; engine: 'clamav' | 'basic' } | { ok: false; reason: 'infected' | 'type' | 'unavailable' }

const EICAR = 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE'

function kindOf(buf: Buffer, filename: string): 'pdf' | 'docx' | 'doc' | null {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'pdf' && buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf'
  if (ext === 'docx' && buf[0] === 0x50 && buf[1] === 0x4b) return 'docx'
  if (ext === 'doc' && buf.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))) return 'doc'
  return null
}

/** Il controllo di base: tipo di file e firma EICAR. */
export function basicCheck(buf: Buffer, filename: string): { ok: true; kind: 'pdf' | 'docx' | 'doc' } | { ok: false; reason: 'infected' | 'type' } {
  if (buf.toString('latin1').includes(EICAR)) return { ok: false, reason: 'infected' }
  const kind = kindOf(buf, filename)
  return kind ? { ok: true, kind } : { ok: false, reason: 'type' }
}

export type ClamdVerdict = 'clean' | 'infected' | 'error'

/**
 * Un file a clamd con INSTREAM: "zINSTREAM\0", poi pezzi da [lunghezza a 4 byte][dati], chiusi da
 * quattro zeri. Risposta "stream: OK" (pulito) o "stream: <nome> FOUND" (infetto); qualunque altra
 * cosa, un errore di rete o il tempo scaduto è "error", che chi chiama tratta come rifiuto.
 */
export function clamdScan(buf: Buffer, opts: { host: string; port: number; timeoutMs: number }): Promise<ClamdVerdict> {
  return new Promise((resolve) => {
    let reply = ''
    let done = false
    const finish = (v: ClamdVerdict) => {
      if (done) return
      done = true
      socket.destroy()
      resolve(v)
    }
    const socket = net.createConnection({ host: opts.host, port: opts.port })
    socket.setTimeout(opts.timeoutMs, () => finish('error'))
    socket.on('error', () => finish('error'))
    socket.on('connect', () => {
      socket.write('zINSTREAM\0')
      const CHUNK = 64 * 1024
      for (let i = 0; i < buf.length; i += CHUNK) {
        const part = buf.subarray(i, i + CHUNK)
        const size = Buffer.alloc(4)
        size.writeUInt32BE(part.length)
        socket.write(size)
        socket.write(part)
      }
      socket.write(Buffer.alloc(4))
    })
    socket.on('data', (d) => {
      reply += d.toString('utf8')
      if (reply.includes('\0') || reply.includes('\n')) settle()
    })
    socket.on('end', () => settle())
    function settle() {
      const text = reply.replace(/\0/g, '').trim()
      if (/:\s*OK$/.test(text)) return finish('clean')
      if (/FOUND$/.test(text)) return finish('infected')
      finish('error')
    }
  })
}

/** Il controllo completo. `allowBasic`: la società è demo (senza motore configurato si accetta il solo controllo di base, se ANTIVIRUS_ALLOW_BASIC=true). */
export async function scanUpload(buf: Buffer, filename: string, { allowBasic = false }: { allowBasic?: boolean } = {}): Promise<ScanResult> {
  const basic = basicCheck(buf, filename)
  if (!basic.ok) return basic
  if (env.clamavHost) {
    const verdict = await clamdScan(buf, { host: env.clamavHost, port: env.clamavPort, timeoutMs: env.clamavTimeoutMs })
    if (verdict === 'clean') return { ok: true, kind: basic.kind, engine: 'clamav' }
    return { ok: false, reason: verdict === 'infected' ? 'infected' : 'unavailable' }
  }
  if (allowBasic && env.antivirusAllowBasic) return { ok: true, kind: basic.kind, engine: 'basic' }
  return { ok: false, reason: 'unavailable' }
}

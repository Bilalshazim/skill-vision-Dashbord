import net from 'node:net'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { env } from '../src/lib/env.js'
import { basicCheck, clamdScan, scanUpload } from '../src/lib/fileScan.js'

// Il controllo dei CV dal link pubblico (Parte C) e il motore antivirus (correzioni di Roberto del
// 2026-11-10). Il motore è un clamd finto, in memoria: risponde come clamd al protocollo INSTREAM.
const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'
const PDF = Buffer.from('%PDF-1.7\n...')

let reply = 'stream: OK\0'
let received = Buffer.alloc(0)
const fake = net.createServer((sock) => {
  let buf = Buffer.alloc(0)
  sock.on('data', (d) => {
    buf = Buffer.concat([buf, d])
    // fine del flusso: quattro zeri dopo l'ultimo pezzo
    if (buf.length >= 14 && buf.subarray(-4).equals(Buffer.alloc(4))) {
      received = buf
      if (reply) sock.end(reply)
    }
  })
})
let port = 0

beforeAll(async () => {
  await new Promise<void>((r) => fake.listen(0, '127.0.0.1', () => r()))
  port = (fake.address() as net.AddressInfo).port
})
afterAll(() => fake.close())
afterEach(() => {
  reply = 'stream: OK\0'
  env.clamavHost = ''
  env.antivirusAllowBasic = false
})

describe('basicCheck', () => {
  it('accetta PDF, DOCX e DOC dalla firma del contenuto', () => {
    expect(basicCheck(PDF, 'cv.pdf')).toEqual({ ok: true, kind: 'pdf' })
    expect(basicCheck(Buffer.from([0x50, 0x4b, 0x03, 0x04]), 'cv.docx')).toEqual({ ok: true, kind: 'docx' })
    expect(basicCheck(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1]), 'cv.DOC')).toEqual({ ok: true, kind: 'doc' })
  })
  it('rifiuta EICAR e i file che non sono quello che dicono', () => {
    expect(basicCheck(Buffer.from(`%PDF-1.4\n${EICAR}`), 'cv.pdf')).toEqual({ ok: false, reason: 'infected' })
    expect(basicCheck(Buffer.from('MZ\x90\x00'), 'cv.pdf')).toEqual({ ok: false, reason: 'type' })
  })
})

describe('clamdScan (protocollo INSTREAM)', () => {
  it('manda il file a pezzi e legge "OK" come pulito', async () => {
    expect(await clamdScan(PDF, { host: '127.0.0.1', port, timeoutMs: 2000 })).toBe('clean')
    expect(received.subarray(0, 10).toString('latin1')).toBe('zINSTREAM\0')
    expect(received.readUInt32BE(10)).toBe(PDF.length)
  })
  it('legge "FOUND" come infetto', async () => {
    reply = 'stream: Win.Test.EICAR_HDB-1 FOUND\0'
    expect(await clamdScan(PDF, { host: '127.0.0.1', port, timeoutMs: 2000 })).toBe('infected')
  })
  it('una risposta che non si capisce è un errore', async () => {
    reply = 'INSTREAM size limit exceeded. ERROR\0'
    expect(await clamdScan(PDF, { host: '127.0.0.1', port, timeoutMs: 2000 })).toBe('error')
  })
  it('motore irraggiungibile o muto: errore entro il tempo', async () => {
    expect(await clamdScan(PDF, { host: '127.0.0.1', port: 1, timeoutMs: 2000 })).toBe('error')
    reply = ''
    expect(await clamdScan(PDF, { host: '127.0.0.1', port, timeoutMs: 300 })).toBe('error')
  })
})

describe('scanUpload: fail-closed', () => {
  it('con il motore: pulito passa, infetto e irraggiungibile no', async () => {
    env.clamavHost = '127.0.0.1'
    env.clamavPort = port
    expect(await scanUpload(PDF, 'cv.pdf')).toEqual({ ok: true, kind: 'pdf', engine: 'clamav' })
    reply = 'stream: Eicar FOUND\0'
    expect(await scanUpload(PDF, 'cv.pdf')).toEqual({ ok: false, reason: 'infected' })
    env.clamavPort = 1
    expect(await scanUpload(PDF, 'cv.pdf')).toEqual({ ok: false, reason: 'unavailable' })
    env.clamavPort = port
  })
  it('senza motore si rifiuta; il solo controllo di base vale solo per la demo con ANTIVIRUS_ALLOW_BASIC', async () => {
    expect(await scanUpload(PDF, 'cv.pdf')).toEqual({ ok: false, reason: 'unavailable' })
    expect(await scanUpload(PDF, 'cv.pdf', { allowBasic: true })).toEqual({ ok: false, reason: 'unavailable' })
    env.antivirusAllowBasic = true
    expect(await scanUpload(PDF, 'cv.pdf')).toEqual({ ok: false, reason: 'unavailable' })
    expect(await scanUpload(PDF, 'cv.pdf', { allowBasic: true })).toEqual({ ok: true, kind: 'pdf', engine: 'basic' })
  })
  it('EICAR si ferma prima del motore', async () => {
    env.clamavHost = '127.0.0.1'
    env.clamavPort = port
    expect(await scanUpload(Buffer.from(`%PDF-1.4\n${EICAR}`), 'cv.pdf')).toEqual({ ok: false, reason: 'infected' })
  })
})

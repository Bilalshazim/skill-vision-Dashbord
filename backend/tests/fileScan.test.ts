import { describe, expect, it } from 'vitest'

import { scanUpload } from '../src/lib/fileScan.js'

// Il controllo dei CV dal link pubblico (Parte C, Decisioni del 2026-11-09).
const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'

describe('scanUpload', () => {
  it('accetta un PDF vero', () => {
    expect(scanUpload(Buffer.from('%PDF-1.7\n...'), 'cv.pdf')).toEqual({ ok: true, kind: 'pdf' })
  })
  it('accetta DOCX e DOC dalla firma del contenuto', () => {
    expect(scanUpload(Buffer.from([0x50, 0x4b, 0x03, 0x04]), 'cv.docx')).toEqual({ ok: true, kind: 'docx' })
    expect(scanUpload(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1]), 'cv.DOC')).toEqual({ ok: true, kind: 'doc' })
  })
  it('rifiuta la firma di prova EICAR, anche dentro un PDF', () => {
    expect(scanUpload(Buffer.from(EICAR), 'cv.pdf')).toEqual({ ok: false, reason: 'infected' })
    expect(scanUpload(Buffer.from(`%PDF-1.4\n${EICAR}`), 'cv.pdf')).toEqual({ ok: false, reason: 'infected' })
  })
  it('rifiuta un file che non è quello che dice l\'estensione', () => {
    expect(scanUpload(Buffer.from('MZ\x90\x00'), 'cv.pdf')).toEqual({ ok: false, reason: 'type' })
    expect(scanUpload(Buffer.from('%PDF-1.7'), 'cv.exe')).toEqual({ ok: false, reason: 'type' })
  })
})

// Controllo dei file caricati da chi non ha un account (Decisioni del 2026-11-09, Parte C:
// candidature dal link pubblico). Due controlli, di base:
//
// 1. Il contenuto è davvero quello che dice l'estensione: PDF (%PDF), DOCX (archivio zip,
//    PK) o DOC (contenitore OLE). Un eseguibile rinominato in .pdf non passa.
// 2. La firma di prova EICAR: è la stringa che ogni antivirus riconosce come "infetta" per
//    collaudo. Rifiutarla dimostra che il punto di controllo c'è e che un file rifiutato
//    non arriva né in archivio né in piattaforma.
//
// Non è un antivirus. Il punto è uno solo (`scanUpload`): quando si collega un motore vero
// (ClamAV o un servizio esterno), si sostituisce qui senza toccare le rotte.

export type ScanResult = { ok: true; kind: 'pdf' | 'docx' | 'doc' } | { ok: false; reason: 'infected' | 'type' }

const EICAR = 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE'

function kindOf(buf: Buffer, filename: string): 'pdf' | 'docx' | 'doc' | null {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'pdf' && buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf'
  if (ext === 'docx' && buf[0] === 0x50 && buf[1] === 0x4b) return 'docx'
  if (ext === 'doc' && buf.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]))) return 'doc'
  return null
}

export function scanUpload(buf: Buffer, filename: string): ScanResult {
  if (buf.toString('latin1').includes(EICAR)) return { ok: false, reason: 'infected' }
  const kind = kindOf(buf, filename)
  return kind ? { ok: true, kind } : { ok: false, reason: 'type' }
}

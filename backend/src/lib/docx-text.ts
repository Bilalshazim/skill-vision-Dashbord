import zlib from 'node:zlib'

// Il testo di un documento Word (.docx) per la sintesi IA: un .docx è uno
// ZIP, il testo sta in word/document.xml. Basta leggere quella voce: niente
// dipendenze in più per un uso così limitato. Il vecchio .doc (binario) non
// si legge: restituisce null e chi chiama lo dice.
export function docxToText(buf: Buffer): string | null {
  const entry = readZipEntry(buf, 'word/document.xml')
  if (!entry) return null
  const xml = entry.toString('utf8')
  const text = xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br\/>|<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text || null
}

function readZipEntry(buf: Buffer, name: string): Buffer | null {
  // Fine della directory centrale: firma 0x06054b50, entro gli ultimi 64 KB.
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) return null
  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  for (let n = 0; n < count && p + 46 <= buf.length; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) return null
    const method = buf.readUInt16LE(p + 10)
    const compSize = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const localOffset = buf.readUInt32LE(p + 42)
    const entryName = buf.toString('utf8', p + 46, p + 46 + nameLen)
    if (entryName === name) {
      if (buf.readUInt32LE(localOffset) !== 0x04034b50) return null
      const start = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28)
      const data = buf.subarray(start, start + compSize)
      try {
        if (method === 0) return Buffer.from(data)
        if (method === 8) return zlib.inflateRawSync(data)
      } catch {
        return null
      }
      return null
    }
    p += 46 + nameLen + extraLen + commentLen
  }
  return null
}

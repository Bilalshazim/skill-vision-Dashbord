// Scrittore di Excel con formattazione (colori, celle unite, menu a tendina,
// riquadri fissi), come nel modello SKILL-VISION_Valutazione_5P.html: SheetJS
// nella versione libera non scrive stili né convalide. I colori qui sono quelli
// del file Excel che l'utente apre in Excel: non appartengono all'interfaccia.
type JSZipCtor = typeof import('jszip')

export type XCell = { v: string | number | null; s?: number }
export type XSheet = {
  name: string
  rows: (XCell | null | undefined)[][]
  cols?: number[]
  heights?: Record<number, number>
  merges?: string[]
  freeze?: { r: number; c: number }
  landscape?: boolean
  dv?: { sqref: string; f: string; errTitle?: string; err?: string; pTitle?: string; prompt?: string }[]
}
export const XS = { title: 1, sub: 2, gPerson: 3, gAuto: 4, gDir: 5, gPeer: 6, colHead: 7, cell: 8, cellB: 9, edit: 10, auto: 11, num: 12, head: 13, note: 14, wrap: 15, text: 16 } as const

const STYLES_XML = (() => {
  const xf = (f: number, fi: number, b: number, al: string) => `<xf numFmtId="0" fontId="${f}" fillId="${fi}" borderId="${b}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${al}</xf>`
  const C = '<alignment horizontal="center" vertical="center" wrapText="1"/>'
  const V = '<alignment vertical="center"/>'
  const fills = ['18223A', 'EAEEF4', 'C27A12', '3B4FC4', '0F8A7A', '5B6782', 'FFF6D6', 'FCEFD9', 'DDE3EC']
  const xfs = [
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    xf(2, 2, 0, '<alignment vertical="center" indent="1"/>'),
    xf(4, 3, 0, '<alignment vertical="center" wrapText="1" indent="1"/>'),
    xf(1, 7, 1, C), xf(1, 4, 1, C), xf(1, 5, 1, C), xf(1, 6, 1, C), xf(3, 10, 1, C),
    xf(0, 0, 1, V), xf(3, 0, 1, V), xf(0, 8, 1, V), xf(3, 9, 1, '<alignment horizontal="center" vertical="center"/>'), xf(0, 0, 1, '<alignment horizontal="center" vertical="center"/>'),
    xf(1, 2, 1, '<alignment vertical="center" wrapText="1"/>'), xf(4, 0, 0, '<alignment vertical="top" wrapText="1"/>'), xf(0, 0, 1, '<alignment vertical="center" wrapText="1"/>'), xf(0, 0, 0, '<alignment vertical="top" wrapText="1"/>'),
  ]
  const font = (b: number, i: number, sz: number, c: string) => `<font>${b ? '<b/>' : ''}${i ? '<i/>' : ''}<sz val="${sz}"/><color rgb="FF${c}"/><name val="Calibri"/><family val="2"/></font>`
  const bc = '<color rgb="FFC9D1DD"/>'
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<fonts count="5">${font(0, 0, 11, '18223A')}${font(1, 0, 11, 'FFFFFF')}${font(1, 0, 14, 'FFFFFF')}${font(1, 0, 11, '18223A')}${font(0, 1, 10, '3D4A63')}</fonts>` +
    `<fills count="${fills.length + 2}"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${fills.map((c) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${c}"/><bgColor indexed="64"/></patternFill></fill>`).join('')}</fills>` +
    `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin">${bc}</left><right style="thin">${bc}</right><top style="thin">${bc}</top><bottom style="thin">${bc}</bottom><diagonal/></border></borders>` +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
  )
})()

// eslint-disable-next-line no-control-regex
const xesc = (v: unknown) => String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c as '&'])
export function colL(i: number): string {
  let s = ''
  i++
  while (i > 0) {
    const m = (i - 1) % 26
    s = String.fromCharCode(65 + m) + s
    i = Math.floor((i - 1) / 26)
  }
  return s
}
function sheetXml(sh: XSheet, first: boolean): string {
  let x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
  if (sh.landscape) x += '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'
  x += `<sheetViews><sheetView workbookViewId="0"${first ? ' tabSelected="1"' : ''}>`
  const fz = sh.freeze
  if (fz && (fz.r || fz.c)) {
    const pane = fz.r && fz.c ? 'bottomRight' : fz.r ? 'bottomLeft' : 'topRight'
    x += `<pane${fz.c ? ` xSplit="${fz.c}"` : ''}${fz.r ? ` ySplit="${fz.r}"` : ''} topLeftCell="${colL(fz.c || 0)}${(fz.r || 0) + 1}" activePane="${pane}" state="frozen"/><selection pane="${pane}"/>`
  }
  x += '</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>'
  if (sh.cols?.length) x += `<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
  x += '<sheetData>'
  sh.rows.forEach((row, ri) => {
    const r = ri + 1
    const ht = sh.heights?.[ri]
    x += `<row r="${r}"${ht ? ` ht="${ht}" customHeight="1"` : ''}>`
    ;(row || []).forEach((c, ci) => {
      if (c == null) return
      const ref = colL(ci) + r
      const st = c.s != null ? ` s="${c.s}"` : ''
      if (c.v == null || c.v === '') x += `<c r="${ref}"${st}/>`
      else if (typeof c.v === 'number' && Number.isFinite(c.v)) x += `<c r="${ref}"${st}><v>${c.v}</v></c>`
      else x += `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${xesc(c.v)}</t></is></c>`
    })
    x += '</row>'
  })
  x += '</sheetData>'
  if (sh.merges?.length) x += `<mergeCells count="${sh.merges.length}">${sh.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
  if (sh.dv?.length)
    x += `<dataValidations count="${sh.dv.length}">${sh.dv.map((d) => `<dataValidation type="list" errorStyle="warning" allowBlank="1" showInputMessage="1" showErrorMessage="1" errorTitle="${xesc(d.errTitle || '')}" error="${xesc(d.err || '')}" promptTitle="${xesc(d.pTitle || '')}" prompt="${xesc(d.prompt || '')}" sqref="${d.sqref}"><formula1>${xesc(d.f)}</formula1></dataValidation>`).join('')}</dataValidations>`
  x += '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>'
  if (sh.landscape) x += '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>'
  return x + '</worksheet>'
}

export async function buildXlsx(sheets: XSheet[], names: { name: string; ref: string }[] = [], type: 'blob' | 'uint8array' = 'blob'): Promise<Blob | Uint8Array> {
  const JSZip = (await import('jszip')).default as unknown as JSZipCtor
  const z = new (JSZip as unknown as new () => import('jszip'))()
  const n = sheets.length
  const H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
  z.file('[Content_Types].xml', `${H}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`)
  z.file('_rels/.rels', `${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)
  z.file('xl/workbook.xml', `${H}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${sheets.map((s, i) => `<sheet name="${xesc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>${names.length ? `<definedNames>${names.map((d) => `<definedName name="${d.name}">${xesc(d.ref)}</definedName>`).join('')}</definedNames>` : ''}</workbook>`)
  z.file('xl/_rels/workbook.xml.rels', `${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`)
  z.file('xl/styles.xml', STYLES_XML)
  sheets.forEach((s, i) => z.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s, i === 0)))
  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  return type === 'blob' ? z.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType }) : z.generateAsync({ type: 'uint8array', compression: 'DEFLATE', mimeType })
}

// Foglio semplice: titolo, intestazione, righe.
export function simpleSheet(name: string, title: string, header: string[], rows: (string | number)[][], widths: number[]): XSheet {
  const n = header.length
  const full = (v: string, s: number): XCell[] => Array.from({ length: n }, (_, i) => ({ v: i ? '' : v, s }))
  return {
    name,
    cols: widths,
    heights: { 0: 26 },
    merges: n > 1 ? [`A1:${colL(n - 1)}1`] : [],
    freeze: { r: 2, c: 0 },
    landscape: true,
    rows: [full(title, XS.title), header.map((h) => ({ v: h, s: XS.head })), ...rows.map((r) => r.map((v, i) => ({ v, s: i === 0 ? XS.cellB : typeof v === 'number' ? XS.num : XS.wrap })))],
  }
}

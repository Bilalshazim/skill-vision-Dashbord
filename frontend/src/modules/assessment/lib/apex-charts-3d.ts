// Ported near-verbatim from js/apex-charts.js (~303 lines, shared by legacy
// Recruiting + Assessment) — a dependency-free, inline-SVG chart library.
// Legacy attaches it to `window.ApexCharts3D`; here it's a plain ES module
// so React components can call it directly. The only structural change is
// `resolveEl` taking an HTMLElement directly (React already has the node via
// a ref) instead of resolving a container id/selector string — the SVG/HTML
// generation logic itself is untouched, so rendered output is byte-for-byte
// the same markup legacy produces.
let uidCounter = 0

function escXml(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
function escAttr(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}
function fmtVal(v: number, unit?: string, dec?: number | null): string {
  return (Number(v) || 0).toFixed(dec == null ? 1 : dec) + (unit || '')
}

let _tipEl: HTMLDivElement | null = null
let _tipBound = false
function _ensureTip(): HTMLDivElement {
  if (_tipEl) return _tipEl
  _tipEl = document.createElement('div')
  _tipEl.className = 'apx-tip'
  _tipEl.setAttribute('role', 'tooltip')
  _tipEl.style.cssText =
    'position:fixed;z-index:9999;pointer-events:none;opacity:0;transition:opacity .12s ease;background:var(--panel,#FFFEF5);border:1px solid var(--line,#DBD7C7);border-radius:8px;padding:8px 10px;font-family:var(--font,inherit);font-size:11.5px;line-height:1.5;color:var(--txt,#2B2926);box-shadow:0 4px 16px rgba(13,12,10,.14);max-width:240px;left:0;top:0'
  document.body.appendChild(_tipEl)
  return _tipEl
}
function _moveTip(evt: PointerEvent) {
  if (!_tipEl) return
  const pad = 14
  let x = evt.clientX + pad
  let y = evt.clientY + pad
  const r = _tipEl.getBoundingClientRect()
  if (x + r.width > window.innerWidth - 8) x = evt.clientX - r.width - pad
  if (y + r.height > window.innerHeight - 8) y = evt.clientY - r.height - pad
  _tipEl.style.transform = `translate(${Math.max(4, x)}px, ${Math.max(4, y)}px)`
}
function _showTip(evt: PointerEvent, html: string) {
  const t = _ensureTip()
  t.innerHTML = html
  t.style.opacity = '1'
  _moveTip(evt)
}
function _hideTip() {
  if (_tipEl) _tipEl.style.opacity = '0'
}
function _ensureTipBinding() {
  if (_tipBound) return
  _tipBound = true
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest && (e.target as HTMLElement).closest('[data-tip]')
    if (t) _showTip(e as PointerEvent, t.getAttribute('data-tip') || '')
  })
  document.addEventListener('pointermove', (e) => {
    if (_tipEl && _tipEl.style.opacity === '1' && (e.target as HTMLElement).closest && (e.target as HTMLElement).closest('[data-tip]')) _moveTip(e as PointerEvent)
  })
  document.addEventListener('pointerout', (e) => {
    const t = (e.target as HTMLElement).closest && (e.target as HTMLElement).closest('[data-tip]')
    if (t && !(e.relatedTarget && t.contains(e.relatedTarget as Node))) _hideTip()
  })
}
function labelRowHtml(labels: (string | number)[], fontSize: number): string {
  const angle = (32 * Math.PI) / 180
  let maxW = 0
  labels.forEach((l) => {
    const w = String(l == null ? '' : l).length * fontSize * 0.58
    if (w > maxW) maxW = w
  })
  const dropH = Math.ceil(maxW * Math.sin(angle) + fontSize * 1.4)
  return `<div style="display:grid;grid-template-columns:repeat(${labels.length},1fr);margin-top:4px;margin-bottom:${dropH}px">
    ${labels.map((l) => `<div style="text-align:right;overflow:visible"><span style="display:inline-block;transform-origin:100% 0;transform:rotate(-32deg);white-space:nowrap;font-size:${fontSize}px;font-weight:600;color:var(--muted,#767369);padding-right:3px">${escXml(l)}</span></div>`).join('')}
  </div>`
}

export type IsometricGroup = { label: string; values: number[]; target?: number }
export function renderIsometricBars(el: HTMLElement | null, opts: { groups: IsometricGroup[]; seriesNames?: string[]; seriesColors?: string[]; max?: number; unit?: string; dec?: number | null }) {
  if (!el) return
  const groups = opts.groups || []
  if (!groups.length) {
    el.innerHTML = ''
    return
  }
  const seriesNames = opts.seriesNames || []
  // Default when no seriesColors is passed — was the brand lime; charts
  // stay off lime entirely, so this falls back to the app's designated
  // multi/single-series categorical hue instead (index.css --chart-2..5).
  const seriesColors = opts.seriesColors || ['var(--chart-2,#5B7FA6)']
  const max = opts.max || 10
  const unit = opts.unit || ''
  const dec = opts.dec == null ? 1 : opts.dec

  const uid = 'iso' + uidCounter++
  const nSeries = groups[0].values.length
  const barW = 24
  const barGap = 8
  const colGap = 26
  const dx = 8
  const dy = -9
  const chartH = 190
  const padTop = 30
  const padBottom = 10
  const groupW = nSeries * barW + (nSeries - 1) * barGap
  const colW = groupW + colGap + Math.max(0, dx)
  const totalW = colW * groups.length
  const svgH = padTop + chartH + padBottom
  const baseline = padTop + chartH

  let bars = ''
  groups.forEach((g) => {
    const gi = groups.indexOf(g)
    let x = gi * colW + colGap / 2
    const gx = x
    g.values.forEach((v, si) => {
      const bx = x
      const h = Math.max(2, (Math.min(Math.max(v, 0), max) / max) * chartH)
      const y1 = baseline - h
      const color = seriesColors[si] || seriesColors[seriesColors.length - 1]
      const frontId = `${uid}-f${si}-${gi}`
      bars += `
        <g style="filter:url(#${uid}-shadow)">
          <defs>
            <linearGradient id="${frontId}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="color-mix(in srgb, ${color} 85%, white)"/>
              <stop offset="100%" stop-color="color-mix(in srgb, ${color} 75%, black)"/>
            </linearGradient>
          </defs>
          <polygon points="${bx},${y1} ${bx + barW},${y1} ${bx + barW + dx},${y1 + dy} ${bx + dx},${y1 + dy}" fill="color-mix(in srgb, ${color} 90%, white)"/>
          <polygon points="${bx + barW},${y1} ${bx + barW + dx},${y1 + dy} ${bx + barW + dx},${baseline + dy} ${bx + barW},${baseline}" fill="color-mix(in srgb, ${color} 55%, black)"/>
          <rect x="${bx}" y="${y1}" width="${barW}" height="${h}" fill="url(#${frontId})"/>
          <text x="${bx + barW / 2 + dx / 2}" y="${y1 + dy - 6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink,#0D0C0A)">${fmtVal(v, unit, dec)}</text>
        </g>`
      x += barW + barGap
    })
    if (g.target != null) {
      const ty = baseline - (Math.min(g.target, max) / max) * chartH
      bars += `<line x1="${gx - 3}" y1="${ty}" x2="${gx + groupW + 3 + dx}" y2="${ty}" stroke="var(--ink,#0D0C0A)" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.55"/>`
    }
  })

  const legend =
    seriesNames.length > 1
      ? `<div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-bottom:8px;font-size:11px;font-weight:600;color:var(--muted,#767369)">
    ${seriesNames.map((n, i) => `<span style="display:inline-flex;align-items:center;gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:${seriesColors[i] || seriesColors[0]};display:inline-block"></i>${escXml(n)}</span>`).join('')}
  </div>`
      : ''

  el.innerHTML = `${legend}<div style="max-width:${totalW}px">
    <svg viewBox="0 0 ${totalW} ${svgH}" preserveAspectRatio="none" style="width:100%;height:${svgH}px;display:block">
      <defs><filter id="${uid}-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="rgba(13,12,10,0.3)"/></filter></defs>
      ${bars}
    </svg>
    ${labelRowHtml(groups.map((g) => g.label), 11)}
  </div>`
}

export type CapsuleItem = { label: string; value: number; color?: string; target?: number; sub?: string }
export function renderCapsuleBars(el: HTMLElement | null, opts: { items: CapsuleItem[]; max?: number; unit?: string; dec?: number | null; pillWidth?: number; gap?: number; height?: number }) {
  if (!el) return
  const items = opts.items || []
  if (!items.length) {
    el.innerHTML = ''
    return
  }
  const max = opts.max || 100
  const unit = opts.unit == null ? '%' : opts.unit
  const dec = opts.dec == null ? 0 : opts.dec
  const pillW = opts.pillWidth || 30
  const colGap = opts.gap || 30
  const trackH = opts.height || 170
  const padTop = 28
  const padBottom = 8
  const colW = pillW + colGap
  const uid = 'cap' + uidCounter++
  const totalW = colW * items.length
  const svgH = padTop + trackH + padBottom
  const baseline = padTop + trackH

  let defs = ''
  let body = ''
  items.forEach((it, i) => {
    const x = i * colW + colGap / 2
    const v = Math.max(0, Math.min(Number(it.value) || 0, max))
    const fillH = Math.max(pillW * 0.55, (v / max) * trackH)
    const clipId = `${uid}-clip${i}`
    // Was 'var(--teal, ...)' with a lime fallback hex — --teal is never
    // defined anywhere, so that fallback was the only color that ever
    // actually rendered. Charts stay off lime entirely.
    const color = it.color || 'var(--chart-2, #5B7FA6)'
    const tipText = escXml(it.label || '') + ': ' + fmtVal(v, unit, dec) + (it.target != null ? ` (target ${fmtVal(it.target, unit, dec)})` : '')
    defs += `<clipPath id="${clipId}"><rect x="${x}" y="${padTop}" width="${pillW}" height="${trackH}" rx="${pillW / 2}"/></clipPath>`
    body += `
      <g><title>${tipText}</title>
      <rect x="${x}" y="${padTop}" width="${pillW}" height="${trackH}" rx="${pillW / 2}" fill="var(--panel-2, rgba(120,120,120,.12))" stroke="var(--line,rgba(120,120,120,.25))" stroke-width="1"/>
      <g clip-path="url(#${clipId})">
        <rect x="${x}" y="${baseline - fillH}" width="${pillW}" height="${fillH}" rx="${pillW / 2}" fill="${color}"/>
      </g>
      ${it.target != null ? `<line x1="${x - 4}" y1="${baseline - (Math.min(it.target, max) / max) * trackH}" x2="${x + pillW + 4}" y2="${baseline - (Math.min(it.target, max) / max) * trackH}" stroke="var(--ink,#0D0C0A)" stroke-width="2" stroke-dasharray="2,2" opacity="0.7"/>` : ''}
      <text x="${x + pillW / 2}" y="${padTop - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink,#0D0C0A)">${fmtVal(v, unit, dec)}</text>
      </g>
    `
  })

  el.innerHTML = `<div style="max-width:${totalW}px">
    <svg viewBox="0 0 ${totalW} ${svgH}" preserveAspectRatio="none" style="width:100%;height:${svgH}px;display:block"><defs>${defs}</defs>${body}</svg>
    ${labelRowHtml(items.map((it) => it.label), 10.5)}
    ${items.some((it) => it.sub) ? `<div style="display:grid;grid-template-columns:repeat(${items.length},1fr)">${items.map((it) => `<div style="text-align:center;font-size:9px;color:var(--muted,#767369)">${it.sub ? escXml(it.sub) : ''}</div>`).join('')}</div>` : ''}
  </div>`
}

export type BarRowSeries = { value: number; color?: string; opacity?: number; name?: string }
export function renderBarRow(el: HTMLElement | null, opts: { series: BarRowSeries[]; label?: string; max?: number; unit?: string; dec?: number | null; barH?: number; gap?: number; target?: number; targetLabel?: string }) {
  if (!el) return
  const series = opts.series || []
  if (!series.length) {
    el.innerHTML = ''
    return
  }
  const max = opts.max || 100
  const unit = opts.unit == null ? '' : opts.unit
  const dec = opts.dec == null ? 1 : opts.dec
  const barH = opts.barH || 9
  const gap = opts.gap == null ? 4 : opts.gap
  const svgH = series.length * barH + Math.max(0, series.length - 1) * gap
  const label = opts.label || ''
  const targetLabel = opts.targetLabel || 'Riferimento'

  _ensureTipBinding()
  let body = ''
  series.forEach((s, i) => {
    const y = i * (barH + gap)
    const v = Math.max(0, Math.min(Number(s.value) || 0, max))
    const w = max > 0 ? Math.max(0, (v / max) * 100) : 0
    const name = s.name || 'Valore'
    const delta = opts.target != null ? v - opts.target : null
    const tipHtml =
      '' +
      (label ? `<div style="font-weight:600;margin-bottom:3px">${escXml(label)}</div>` : '') +
      `<div>${escXml(name)}: <b>${escXml(fmtVal(v, unit, dec))}</b></div>` +
      (opts.target != null ? `<div style="color:var(--muted,#767369)">${escXml(targetLabel)}: ${escXml(fmtVal(opts.target, unit, dec))} (${delta! >= 0 ? '+' : ''}${escXml(fmtVal(delta!, unit, dec))})</div>` : '')
    const ariaLabel = escXml((label ? label + ' — ' : '') + name + ': ' + fmtVal(v, unit, dec) + (opts.target != null ? `, ${targetLabel} ${fmtVal(opts.target, unit, dec)}` : ''))
    body += `<g role="img" aria-label="${ariaLabel}" data-tip="${escAttr(tipHtml)}" style="cursor:default">
      <rect x="0" y="${y}" width="100" height="${barH}" rx="${barH / 2}" fill="var(--panel-2, rgba(120,120,120,.12))"/>
      ${w > 0 ? `<rect x="0" y="${y}" width="${w}" height="${barH}" rx="${barH / 2}" fill="${s.color || 'var(--muted)'}" opacity="${s.opacity != null ? s.opacity : 1}"/>` : ''}
    </g>`
  })
  if (opts.target != null && max > 0) {
    const tx = (Math.max(0, Math.min(opts.target, max)) / max) * 100
    const tipHtml = (label ? `<div style="font-weight:600;margin-bottom:3px">${escXml(label)}</div>` : '') + `<div>${escXml(targetLabel)}: <b>${escXml(fmtVal(opts.target, unit, dec))}</b></div>`
    body += `<g data-tip="${escAttr(tipHtml)}"><line x1="${tx}" y1="-1.5" x2="${tx}" y2="${svgH + 1.5}" stroke="var(--ink,#0D0C0A)" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="2,2" opacity="0.55"/><rect x="${tx - 2.5}" y="-1.5" width="5" height="${svgH + 3}" fill="transparent"/></g>`
  }
  el.innerHTML = `<svg viewBox="0 0 100 ${svgH}" preserveAspectRatio="none" style="width:100%;height:${svgH}px;display:block;overflow:visible">${body}</svg>`
}

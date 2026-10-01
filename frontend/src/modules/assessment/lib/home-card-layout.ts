import type { CSSProperties } from 'react'

// Grid placement for the four Home cards. Cards come in row pairs
// (Il Valore + Il Capitale Umano, Le Perdite + Le Decisioni). An opened card
// takes a full row at its pair's position (so opening the right-hand card
// never pushes it down); a closed card left alone on a row spans the row
// rather than leaving an empty cell beside it.
export function homeCardLayout<K extends string>(pairs: readonly (readonly [K, K])[], open: Record<K, boolean>): Record<K, CSSProperties> {
  const seq: K[] = []
  pairs.forEach(([l, r]) => {
    if (open[r] && !open[l]) seq.push(r, l)
    else seq.push(l, r)
  })
  const full = new Set<K>()
  let pending: K | null = null
  for (const id of seq) {
    if (open[id]) {
      if (pending) full.add(pending)
      pending = null
      full.add(id)
    } else if (pending) {
      pending = null
    } else {
      pending = id
    }
  }
  if (pending) full.add(pending)
  const out = {} as Record<K, CSSProperties>
  seq.forEach((id, i) => {
    out[id] = { order: i, gridColumn: full.has(id) ? '1 / -1' : undefined }
  })
  return out
}

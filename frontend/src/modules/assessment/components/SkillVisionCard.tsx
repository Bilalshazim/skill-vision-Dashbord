import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { useId, useState } from 'react'

import { FolderCard, FolderPill } from '@/modules/assessment/components/FolderCard'
import type { FolderTone } from '@/modules/assessment/components/FolderCard'

// Open/closed state of one Skill Vision card, remembered per browser.
// Storage can throw (private mode, blocked site data): fall back to closed.
export function useSkillVisionOpen(storageKey: string): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) === 'skillvision'
    } catch {
      return false
    }
  })
  function set(next: boolean) {
    setOpen(next)
    try {
      window.localStorage.setItem(storageKey, next ? 'skillvision' : 'oggi')
    } catch {
      // not persisted — the toggle still works for this session
    }
  }
  return [open, set]
}

type Props = {
  tone: FolderTone
  Icon: PhosphorIcon
  title: string
  // Lowercase line under the title ("quello che devi sapere").
  subtitle: string
  // Bold uppercase description lines.
  lines: readonly string[]
  actions?: React.ReactNode
  // Shown beside the card only while "Skill Vision" is selected.
  panel: React.ReactNode
  panelClassName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  // Grid placement, decided by the page (see homeCardLayout()).
  style?: React.CSSProperties
}

// Home folder card with the concept's "oggi" / "Skill Vision" pills. The
// card itself only carries text; every number lives in the panel that
// "Skill Vision" opens beside it, and the block then spans a full grid row.
export function SkillVisionCard({ tone, Icon, title, subtitle, lines, actions, panel, panelClassName, open, onOpenChange, style }: Props) {
  const panelId = useId()

  return (
    <div className={`sv-block folder-tone-${tone}${open ? ' is-active' : ''}`} style={style}>
      <FolderCard
        tone={tone}
        Icon={Icon}
        title={title}
        kicker={subtitle}
        className="sv-folder"
        aside={
          <>
            <FolderPill active={!open} onClick={() => onOpenChange(false)}>
              oggi
            </FolderPill>
            <FolderPill active={open} aria-expanded={open} aria-controls={panelId} onClick={() => onOpenChange(!open)}>
              SKILL VISION
            </FolderPill>
          </>
        }
      >
        <div className="folder-lines">
          {lines.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
        {actions && <div className="folder-actions">{actions}</div>}
      </FolderCard>

      {open && (
        <div id={panelId} className={`sv-panel${panelClassName ? ` ${panelClassName}` : ''}`}>
          {panel}
        </div>
      )}
    </div>
  )
}

// Grid placement for the four Home cards. Cards come in row pairs
// (Il Valore + Il Capitale Umano, Le Perdite + Le Decisioni). An opened card
// takes a full row at its pair's position (so opening the right-hand card
// never pushes it down); a closed card left alone on a row spans the row
// rather than leaving an empty cell beside it.
export function homeCardLayout<K extends string>(pairs: readonly (readonly [K, K])[], open: Record<K, boolean>): Record<K, React.CSSProperties> {
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
  const out = {} as Record<K, React.CSSProperties>
  seq.forEach((id, i) => {
    out[id] = { order: i, gridColumn: full.has(id) ? '1 / -1' : undefined }
  })
  return out
}

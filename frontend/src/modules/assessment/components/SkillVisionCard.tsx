import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { useId, useState } from 'react'

import { FolderCard, FolderPill } from '@/modules/assessment/components/FolderCard'
import type { FolderTone } from '@/modules/assessment/components/FolderCard'

type Props = {
  // localStorage key remembering whether the panel was left open.
  storageKey: string
  tone: FolderTone
  Icon: PhosphorIcon
  title: string
  kicker: React.ReactNode
  // Card body, given whether the Skill Vision panel is open.
  body: (isActive: boolean) => React.ReactNode
  actions?: React.ReactNode
  // Shown beside the card only while "Skill Vision" is selected.
  panel: React.ReactNode
  panelClassName?: string
  className?: string
}

function readOpen(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === 'skillvision'
  } catch {
    return false
  }
}

function writeOpen(key: string, open: boolean) {
  try {
    window.localStorage.setItem(key, open ? 'skillvision' : 'oggi')
  } catch {
    // not persisted — the toggle still works for this session
  }
}

// Home folder card with the concept's "oggi" / "Skill Vision" pills (E.pdf):
// "oggi" keeps the card on its own; "Skill Vision" opens the numbers panel
// beside it, and the whole block then spans the full grid row.
export function SkillVisionCard({ storageKey, tone, Icon, title, kicker, body, actions, panel, panelClassName, className }: Props) {
  const [isActive, setIsActive] = useState(() => readOpen(storageKey))
  const panelId = useId()

  function select(open: boolean) {
    setIsActive(open)
    writeOpen(storageKey, open)
  }

  return (
    <div className={`sv-block folder-tone-${tone}${isActive ? ' is-active' : ''}`}>
      <FolderCard
        tone={tone}
        Icon={Icon}
        title={title}
        kicker={kicker}
        className={className}
        aside={
          <>
            <FolderPill active={!isActive} onClick={() => select(false)}>
              oggi
            </FolderPill>
            <FolderPill active={isActive} aria-expanded={isActive} aria-controls={panelId} onClick={() => select(!isActive)}>
              SKILL VISION
            </FolderPill>
          </>
        }
      >
        {body(isActive)}
        {actions && <div className="folder-actions">{actions}</div>}
      </FolderCard>

      {isActive && (
        <div id={panelId} className={`sv-panel${panelClassName ? ` ${panelClassName}` : ''}`}>
          {panel}
        </div>
      )}
    </div>
  )
}

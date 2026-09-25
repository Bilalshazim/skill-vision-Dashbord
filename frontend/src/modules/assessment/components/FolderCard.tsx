import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

export type FolderTone = 'valore' | 'capitale' | 'perdite' | 'decisioni'

type Props = {
  tone: FolderTone
  // Phosphor icon, drawn duotone and centered in the notch beside the tab.
  Icon: PhosphorIcon
  title: string
  kicker?: React.ReactNode
  // Top-right of the tab: pills, links.
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
}

// The Assessment Home card shape from the client concept (E.pdf): a raised
// tab carrying the title, the icon sitting in the notch to its left, and the
// body below. All four home cards use it; `tone` picks one of four variations
// of the same khaki/amber family (see .folder-tone-* in assessment-scoped.css).
export function FolderCard({ tone, Icon, title, kicker, aside, className, children }: Props) {
  return (
    <section className={`folder folder-tone-${tone}${className ? ` ${className}` : ''}`}>
      <div className="folder-head">
        <span className="folder-icon" aria-hidden="true">
          <Icon weight="duotone" />
        </span>
        <div className="folder-tab">
          {aside && <div className="folder-aside">{aside}</div>}
          <h3 className="folder-title">{title}</h3>
        </div>
      </div>
      <div className="folder-body">
        {kicker && <div className="folder-kicker">{kicker}</div>}
        {children}
      </div>
    </section>
  )
}

// Pill toggle used in folder tabs: the selected pill is yellow, the others
// white — the same pair as the concept's "oggi" / "Skill Vision".
export function FolderPill({ active, onClick, children, ...rest }: { active: boolean; onClick: () => void; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="folder-pill" aria-pressed={active} onClick={onClick} {...rest}>
      {children}
    </button>
  )
}

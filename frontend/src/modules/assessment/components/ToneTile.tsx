import type { LucideIcon } from 'lucide-react'

export type TileTone = 'peach' | 'gold' | 'green' | 'yellow' | 'red'

type Props = {
  tone: TileTone
  Icon: LucideIcon
  label: string
  value: React.ReactNode
  // Smaller trailing part of the value, e.g. "/100".
  den?: string
  sub?: React.ReactNode
  // 0-100: draws a progress bar under the value.
  pct?: number
  size?: 'lg' | 'md' | 'sm'
  className?: string
}

// Rounded number tile for the Assessment Home cards: icon badge + label,
// the value, an optional progress bar and caption. Colors per tone live in
// assessment-scoped.css (.tone-tile-*), with dark-mode equivalents.
export function ToneTile({ tone, Icon, label, value, den, sub, pct, size = 'md', className }: Props) {
  return (
    <div className={`tone-tile tone-tile-${tone} tone-tile-${size}${className ? ` ${className}` : ''}`}>
      <div className="tone-tile-head">
        <span className="tone-tile-icon" aria-hidden="true">
          <Icon />
        </span>
        <span className="tone-tile-label">{label}</span>
      </div>
      <div className="tone-tile-value">
        {value}
        {den && <span className="tone-tile-den">{den}</span>}
      </div>
      {pct !== undefined && (
        <div className="tone-tile-bar" role="presentation">
          <i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
        </div>
      )}
      {sub && <div className="tone-tile-sub">{sub}</div>}
    </div>
  )
}

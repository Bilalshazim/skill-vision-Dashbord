import { ICONS } from '@/modules/assessment/lib/legacy-taxonomy'

// Legacy stores its whole icon set as raw SVG markup strings (ICONS,
// js/assessment.js ~2153-2188) and injects them via innerHTML. Reproduced
// the same way here (a single, narrow, developer-authored — never
// user-content — dangerouslySetInnerHTML) rather than hand-converting ~30
// SVGs to JSX, which would risk subtle path/attribute transcription errors
// for zero behavioral benefit.
export function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
}

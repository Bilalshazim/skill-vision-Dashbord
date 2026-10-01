import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Ported from the single reusable openModal()/closeModal() overlay
// (js/assessment.js ~3330-3341, modules/assessment.html ~112-122) — one
// overlay/box/head/body/foot structure, closed by the × button or a click
// on the backdrop. Legacy has NO Escape-key handler for this modal (verified
// via source — only modal-close-btn's click listener and the backdrop
// click), so this deliberately doesn't add one either.
//
// Rendered through a portal at the top of the Assessment shell: opened from
// inside the sidebar (e.g. Note Metodologiche), the overlay was trapped in
// the sidebar's stacking context and the Home cards painted over it. The
// shell (not <body>) keeps the module's scoped CSS variables and styles.
export function Modal({ title, sub, wide, onClose, footer, children }: { title: string; sub?: string; wide?: boolean; onClose: () => void; footer?: ReactNode; children: ReactNode }) {
  const overlay = (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' wide' : ''}`}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {sub ? <div className="sub">{sub}</div> : null}
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
  const shell = typeof document !== 'undefined' ? document.querySelector('.sv-assessment-shell') : null
  return shell ? createPortal(overlay, shell) : overlay
}

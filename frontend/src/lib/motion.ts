import type { Transition, Variants } from 'motion/react'

// I movimenti dell'interfaccia (Instructions.md, 2026-10-30): un posto solo
// per tutti i valori, come globals.css per i colori. Si animano soltanto
// trasformazioni e opacità. Con
// "riduci movimento" del sistema restano le dissolvenze (MotionConfig in
// App.tsx) e le transizioni CSS si azzerano (globals.css). I grafici Bklit
// hanno i loro tempi in components/charts/animation.ts.

/** La pillola che scorre sotto la voce attiva del commutatore dei moduli. */
export const SNAPPY_TAB_SPRING: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 35,
  mass: 0.5,
}

/** Il cambio di modulo, Recruiting ↔ Assessment. Lo SOP aggiunge una
 *  sfocatura di 4px: tolta, il sistema non ha sfocature (regola 4,
 *  DECISIONI 2026-10-30). */
export const MODULE_SHELL_VARIANTS: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.15, ease: [0.7, 0, 0.84, 0] },
  },
}

/** Il cambio di pagina dentro un modulo. */
export const FAST_PAGE_VARIANTS: Variants = {
  initial: { opacity: 0, scale: 0.985, y: 4 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.16, ease: [0.2, 0, 0, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    y: -4,
    transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
  },
}

/** Il cambio di modulo quando l'app gira installata (PWA, webview). */
export const WEB_APP_SLIDE_VARIANTS: Variants = {
  initial: { opacity: 0, x: 16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.14, ease: [0.7, 0, 0.84, 0] },
  },
}

/** Elenchi di card che entrano una dopo l'altra, 30ms di scarto. */
export const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
}

export const STAGGER_CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
}

/** La risposta al tocco di bottoni, voci e card cliccabili. */
export const TAP_SCALE = { scale: 0.97 }

/** Vero quando l'app gira installata (PWA) o dentro una webview. */
export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
}

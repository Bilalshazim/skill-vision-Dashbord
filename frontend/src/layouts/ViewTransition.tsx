import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { FAST_PAGE_VARIANTS, MODULE_SHELL_VARIANTS, WEB_APP_SLIDE_VARIANTS, isStandaloneApp } from '@/lib/motion'

// Il cambio di vista, unico per tutta l'app: quando `viewKey` cambia la vista
// vecchia sparisce e la nuova entra. `shell` per il cambio di modulo, `page` per
// il cambio di pagina dentro un modulo. Installata come app (PWA, webview) il
// cambio di modulo scorre di lato (WEB_APP_SLIDE_VARIANTS).
//
// Solo l'entrata, niente uscita: con `AnimatePresence mode="wait"` la pagina nuova
// aspettava la fine dell'uscita della vecchia, e ogni pagina si apriva in circa 550ms
// invece di 120ms (misurato sulla build di produzione; DECISIONI, "Uscita delle
// pagine"). Aprire la pagina conta più dell'animazione.
export function ViewTransition({ viewKey, mode = 'page', className, children }: { viewKey: string; mode?: 'shell' | 'page'; className?: string; children: ReactNode }) {
  const variants = mode === 'page' ? FAST_PAGE_VARIANTS : isStandaloneApp() ? WEB_APP_SLIDE_VARIANTS : MODULE_SHELL_VARIANTS
  return (
    <motion.div key={viewKey} data-slot="view-transition" data-mode={mode} variants={variants} initial="initial" animate="animate" className={className}>
      {children}
    </motion.div>
  )
}

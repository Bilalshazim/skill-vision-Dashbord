import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'

import { FAST_PAGE_VARIANTS, MODULE_SHELL_VARIANTS, WEB_APP_SLIDE_VARIANTS, isStandaloneApp } from '@/lib/motion'

// Il cambio di vista, unico per tutta l'app: quando `viewKey` cambia la vista
// vecchia esce e la nuova entra (`mode="wait"`). `shell` per il cambio di
// modulo, `page` per il cambio di pagina dentro un modulo. Installata come
// app (PWA, webview) il cambio di modulo scorre di lato
// (WEB_APP_SLIDE_VARIANTS). `initial`: animare anche la prima comparsa.
export function ViewTransition({ viewKey, mode = 'page', initial = false, className, children }: { viewKey: string; mode?: 'shell' | 'page'; initial?: boolean; className?: string; children: ReactNode }) {
  const variants = mode === 'page' ? FAST_PAGE_VARIANTS : isStandaloneApp() ? WEB_APP_SLIDE_VARIANTS : MODULE_SHELL_VARIANTS
  return (
    <AnimatePresence mode="wait" initial={initial}>
      <motion.div key={viewKey} data-slot="view-transition" data-mode={mode} variants={variants} initial="initial" animate="animate" exit="exit" className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

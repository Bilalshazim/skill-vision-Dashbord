import type { ReactNode } from 'react'
import { motion } from 'motion/react'

import { STAGGER_CARD_VARIANTS, TAP_SCALE } from '@/lib/motion'
import { cn } from '@/lib/utils'

// Un elemento di uno StaggerList. Con `pressable` (una card che si clicca
// tutta) risponde al tocco con lo stesso 0,97 dei bottoni, senza il ritardo
// del doppio tocco sui telefoni. `className` solo per la disposizione.
export function StaggerItem({ children, pressable = false, className }: { children: ReactNode; pressable?: boolean; className?: string }) {
  return (
    <motion.div data-slot="stagger-item" variants={STAGGER_CARD_VARIANTS} whileTap={pressable ? TAP_SCALE : undefined} className={cn(pressable && 'touch-manipulation', className)}>
      {children}
    </motion.div>
  )
}

import type { ReactNode } from 'react'
import { motion } from 'motion/react'

import { STAGGER_CONTAINER_VARIANTS } from '@/lib/motion'

// Un elenco di card o di righe che entrano una dopo l'altra (30ms di scarto).
// Ogni elemento va in uno StaggerItem. Non aggiunge aspetto: `className` è
// solo la disposizione (grid, flex, gap), come per un `div`.
export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div data-slot="stagger-list" variants={STAGGER_CONTAINER_VARIANTS} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  )
}

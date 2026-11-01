import { Children, type ReactNode, isValidElement } from 'react'
import { motion } from 'motion/react'

import { StaggerItem } from '@/components/patterns/StaggerItem'
import { STAGGER_CONTAINER_VARIANTS } from '@/lib/motion'

// Un elenco o una griglia di card che entrano una dopo l'altra (30ms di
// scarto). Ogni figlio che non è già uno StaggerItem ci viene messo dentro:
// una griglia di StatCard si anima così com'è. Non aggiunge aspetto:
// `className` è solo la disposizione (grid, flex, gap), come per un `div`.
export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div data-slot="stagger-list" variants={STAGGER_CONTAINER_VARIANTS} initial="hidden" animate="show" className={className}>
      {Children.map(children, (child) => (isValidElement(child) && child.type === StaggerItem ? child : child == null || child === false ? child : <StaggerItem>{child}</StaggerItem>))}
    </motion.div>
  )
}

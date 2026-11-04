import { motion, useReducedMotion } from 'motion/react'

import { PageHeader } from '@/components/patterns/PageHeader'
import { WindowCard } from '@/components/patterns/WindowCard'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'

// La Home di Assessment (CLAUDE.md, Fase 6, tavola «Home · senza dati», Roberto
// 2026-11-03): prima voce del menu e quattro finestre a tutta altezza, visibili
// all'apertura, ognuna con l'etichetta (numero e tema), il numero in filigrana,
// titolo, sottotitolo e domanda. Nessun dato e nessun grafico: compaiono entrando
// nella finestra. All'apertura una dissolvenza breve, una dopo l'altra (solo
// opacità, e nessuna con "riduci movimento"). Al
// passaggio del mouse cambiano solo fondo e bordo. L'intestazione è della pagina,
// non del layout (`home` non ha titolo in PAGE_META_TEXT).
export default function AssessmentHomePage() {
  const { ui } = useAssessment()
  const reduced = useReducedMotion()
  return (
    <div className="flex min-h-home flex-col gap-4">
      <PageHeader level="presentation" className="mb-0" title={ui.res.homeTitle} actions={<AssessmentModeSwitch />} />
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:auto-rows-fr">
        {ui.res.windows.map((w: { slug: string; number: string; title: string; sub: string; q: string; theme: string }, i: number) => (
          <motion.div key={w.slug} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.06 }} className="min-w-0">
            <WindowCard to={`/assessment/${w.slug}`} number={w.number} theme={w.theme} title={w.title} subtitle={w.sub} question={w.q} />
          </motion.div>
        ))}
      </div>
      <p className="text-app-caption text-muted-foreground">{ui.res.homeNote}</p>
    </div>
  )
}

import { Workflow } from 'lucide-react'

import { EmptyState } from '@/components/patterns/EmptyState'
import { PageHeader } from '@/components/patterns/PageHeader'
import { InterviewAgendaCard } from '@/modules/recruiting/components/HomeSectionCards'
import { usePipelineSelection } from '@/modules/recruiting/lib/use-pipeline-selection'
import { useRecruitingHomeData } from '@/modules/recruiting/lib/use-recruiting-home-data'
import { type PipelineSection, PipelineSectionCard } from '@/modules/recruiting/pipeline/PipelineDetail'

const PAGES: Record<PipelineSection, { title: string; description: string }> = {
  preselezionati: { title: 'CV preselezionati', description: 'Candidati passati alla preselezione, con il link al test automatizzato.' },
  classifica: { title: 'Classifica dopo il test', description: 'Punteggi del test dei candidati preselezionati, in ordine di classifica.' },
  colloqui: { title: 'Prossimi colloqui', description: 'I colloqui in agenda e quelli della posizione, con la scheda di valutazione.' },
  podio: { title: 'Candidati al podio', description: 'Fra i candidati intervistati, la scelta finale per la posizione.' },
}

// Una fase dell'avanzamento della selezione con una pagina sua (indice a
// quattro livelli, documento del cliente del 2026-10-23). La posizione è
// la posizione attiva, nella barra in alto: si cambia da lì, per tutte le
// pagine insieme (lib/active-position.tsx).
export default function PipelineSectionPage({ section }: { section: PipelineSection }) {
  const { company, opening, onMutated } = usePipelineSelection()
  const page = PAGES[section]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title={page.title} description={page.description} />

      {section === 'colloqui' ? <AgendaBlock /> : null}

      {company && opening ? (
        <PipelineSectionCard section={section} company={company} opening={opening} onMutated={onMutated} />
      ) : (
        <EmptyState size="sm" icon={Workflow} description="Nessuna posizione attiva. Scegline una nella barra in alto, o aprine una da CV & Esportazione." />
      )}
    </div>
  )
}

// L'agenda di tutte le posizioni, come in "Stato dell'arte".
function AgendaBlock() {
  const data = useRecruitingHomeData()
  return (
    <div className="max-w-3xl">
      <InterviewAgendaCard data={data} />
    </div>
  )
}

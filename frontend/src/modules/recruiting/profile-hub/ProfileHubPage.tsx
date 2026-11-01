import { ArrowRight } from 'lucide-react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/patterns/EmptyState'
import { PageHeader } from '@/components/patterns/PageHeader'
import { WindowCard } from '@/components/patterns/WindowCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RecruitingHeader } from '@/modules/recruiting/components/RecruitingHeader'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'
import { RECRUITING_STEPS } from '@/modules/recruiting/results/use-recruiting-results'

// "Profilo della ricerca", la Home di Recruiting e prima voce del menu
// (CLAUDE.md, Fase 6, deciso da Roberto il 2026-10-23, "le tre slide"):
//  1. Società · Campagna · CIP, modificabili solo qui (RecruitingHeader);
//     la scelta della posizione attiva sta nella barra sopra (RecruitingContextBar);
//  2. titolo e sottotitolo;
//  3. tre card in fila con la freccia fra l'una e l'altra, numerate, con
//     titolo, sottotitolo, contenuto e verbi. Senza numeri di dati (Roberto
//     non li vuole qui); il clic apre la pagina dei risultati del passo.
// Niente riga dell'esito (2026-10-29), niente "Report AI" nella terza card.
// Prima la pagina era la scheda della posizione (prossimo passo, cosa
// cerchiamo, a che punto siamo, con i numeri): quei contenuti stanno nelle
// pagine dei risultati, nel Profilo candidato e nell'Imbuto (DECISIONI).
export default function ProfileHubPage() {
  const { company, opening } = useActivePosition()

  if (!company || !opening) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader level="page" className="mb-0" title="Profilo della ricerca" />
        <Card>
          <EmptyState
            title="Nessuna posizione aperta."
            description="Il profilo della ricerca è la scheda di una posizione. Le posizioni si aprono da CV & Esportazione."
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/recruiting/cv">
                  Apri CV & Esportazione <ArrowRight />
                </Link>
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Società · Campagna · CIP in cima, come nella tavola: si modificano solo qui. */}
      <RecruitingHeader />

      <PageHeader
        level="presentation"
        className="mb-0"
        eyebrow={`${company.name} · Recruiting`}
        title="Profilo della ricerca"
        description="Configura profilo, posizione, mansione e competenze trasversali. Il programma e le classifiche si aggiornano in tempo reale."
      />

      <ol className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
        {RECRUITING_STEPS.map((s, i) => (
          <Fragment key={s.slug}>
            {i > 0 ? (
              <li aria-hidden="true" className="hidden items-center lg:flex">
                <ArrowRight className="size-5 text-muted-foreground" />
              </li>
            ) : null}
            <li className="min-w-0">
              <WindowCard to={`/recruiting/${s.slug}`} number={s.number} title={s.title} subtitle={s.sub} content={s.content} verbs={s.verbs} />
            </li>
          </Fragment>
        ))}
      </ol>
    </div>
  )
}

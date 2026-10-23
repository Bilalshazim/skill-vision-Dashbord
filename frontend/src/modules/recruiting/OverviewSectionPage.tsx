import { useNavigate } from 'react-router-dom'

import { BandCard } from '@/components/patterns/BandCard'
import { ChartCard } from '@/components/patterns/ChartCard'
import { PageHeader } from '@/components/patterns/PageHeader'
import { IDONEITA } from '@/lib/idoneita'
import { QualityStackedBar } from '@/modules/recruiting/components/QualityStackedBar'
import { SelectionFunnelCard } from '@/modules/recruiting/components/HomeSectionCards'
import { CandidateProfileDialog } from '@/modules/recruiting/cv/CandidateProfileDialog'
import { fmtScore10, sourceLabel } from '@/modules/recruiting/lib/format'
import { QUALITY_BANDS } from '@/modules/recruiting/lib/quality-bands'
import { useRecruitingHomeData } from '@/modules/recruiting/lib/use-recruiting-home-data'

// Due riquadri di "Stato dell'arte" con una pagina loro nell'indice a
// quattro livelli (documento del cliente, 2026-10-23): l'imbuto di selezione
// (livelli 2 e 3) e i candidati per fascia di idoneità (livello 3).
// Le fasce dicono chi c'è dentro (CLAUDE.md, Fase 5): sopra la distribuzione,
// sotto una card per fascia con la soglia, quanti candidati e che quota, i
// primi tre per indice (il profilo si apre dalla riga) e "Vedi tutti" verso la
// classifica filtrata su quella fascia.
export default function OverviewSectionPage({ view }: { view: 'imbuto' | 'fasce' }) {
  const data = useRecruitingHomeData()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4">
      {view === 'imbuto' ? (
        <>
          <PageHeader level="page" className="mb-0" title="Imbuto di selezione" description="Dal CV caricato alla selezione finale: quanti candidati superano ogni fase." />
          <div className="max-w-3xl">
            <SelectionFunnelCard data={data} />
          </div>
        </>
      ) : (
        <>
          <PageHeader level="page" className="mb-0" title="Candidati per fascia di idoneità" description={`${data.rankedCount} candidati in classifica · posizione attiva: ${data.roleLabel}`} />
          <ChartCard
            title="Distribuzione per fascia"
            height="auto"
            empty={data.rankedCount ? undefined : { title: 'Nessun candidato in classifica.', description: 'La classifica si forma quando i candidati completano il test soft skill. I CV si caricano da CV & Esportazione.' }}
          >
            <QualityStackedBar buckets={data.buckets} total={data.rankedCount} />
          </ChartCard>
          {data.rankedCount ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {QUALITY_BANDS.map((b, i) => (
                <BandCard
                  key={b.key}
                  label={`${IDONEITA[b.idoneita].label} · ${b.name}`}
                  tone={IDONEITA[b.idoneita].tone}
                  description={b.threshold}
                  count={data.buckets[i].count}
                  total={data.rankedCount}
                  unit={{ one: 'candidato', many: 'candidati' }}
                  people={data.bucketCandidates[i].map(({ c, r }) => ({
                    id: c.id,
                    name: c.name,
                    meta: sourceLabel(c.src) || undefined,
                    score: fmtScore10(r.v),
                    action: <CandidateProfileDialog candidate={c} />,
                  }))}
                  onSeeAll={() => navigate(`/recruiting/ranking?fascia=${b.key}`)}
                  seeAllLabel="Vedi tutti"
                  emptyText="Nessun candidato in questa fascia."
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

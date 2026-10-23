import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { BandCard } from '@/components/patterns/BandCard'
import { ChartCard } from '@/components/patterns/ChartCard'
import { PageHeader } from '@/components/patterns/PageHeader'
import { IDONEITA } from '@/lib/idoneita'
import { QualityStackedBar } from '@/modules/recruiting/components/QualityStackedBar'
import { CandidateProfileDialog } from '@/modules/recruiting/cv/CandidateProfileDialog'
import { fmtScore10, sourceLabel } from '@/modules/recruiting/lib/format'
import { bucketize, QUALITY_BANDS } from '@/modules/recruiting/lib/quality-bands'
import { readCandidates } from '@/modules/recruiting/lib/storage'
import type { QualityBucket } from '@/modules/recruiting/lib/use-recruiting-home-data'
import { RankingScopeToggle, useRankingScope } from '@/modules/recruiting/lib/use-ranking-scope'

// Candidati per fascia di idoneità (livello 2). Le fasce dicono chi c'è dentro
// (CLAUDE.md, Fase 5): sopra la distribuzione, sotto una card per fascia con
// la soglia, quanti candidati e che quota, i primi tre per indice (il profilo
// si apre dalla riga) e "Vedi tutti" verso Risultati filtrato su quella
// fascia. Di chi: la posizione attiva o l'archivio CV, come in Risultati
// (lib/use-ranking-scope.tsx), e "Vedi tutti" porta la stessa scelta.
export default function FasceIdoneitaPage() {
  const navigate = useNavigate()
  const candidates = useMemo(() => readCandidates(), [])
  const { scope, setScope, rk, description } = useRankingScope(candidates)
  const groups = bucketize(rk)
  const buckets: QualityBucket[] = QUALITY_BANDS.map((b, i) => ({ label: b.name, tone: IDONEITA[b.idoneita].tone, count: groups[i].length }))

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Candidati per fascia di idoneità" description={`${description} · ${rk.length} in classifica`} actions={<RankingScopeToggle scope={scope} onChange={setScope} />} />
      <ChartCard
        title="Distribuzione per fascia"
        height="auto"
        empty={
          rk.length
            ? undefined
            : scope === 'posizione'
              ? { title: 'Nessun candidato di questa posizione in classifica.', description: 'La classifica si forma quando i candidati della posizione completano il test soft skill. L’archivio intero è in «Archivio CV».' }
              : { title: 'Nessun candidato in classifica.', description: 'La classifica si forma quando i candidati completano il test soft skill. I CV si caricano da CV & Esportazione.' }
        }
      >
        <QualityStackedBar buckets={buckets} total={rk.length} />
      </ChartCard>
      {rk.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {QUALITY_BANDS.map((b, i) => (
            <BandCard
              key={b.key}
              label={`${IDONEITA[b.idoneita].label} · ${b.name}`}
              tone={IDONEITA[b.idoneita].tone}
              description={b.threshold}
              count={groups[i].length}
              total={rk.length}
              unit={{ one: 'candidato', many: 'candidati' }}
              people={groups[i].map(({ c, r }) => ({
                id: c.id,
                name: c.name,
                meta: sourceLabel(c.src) || undefined,
                score: fmtScore10(r.v),
                action: <CandidateProfileDialog candidate={c} />,
              }))}
              onSeeAll={() => navigate(`/recruiting/ranking?fascia=${b.key}${scope === 'archivio' ? '&ambito=archivio' : ''}`)}
              seeAllLabel="Vedi tutti"
              emptyText="Nessun candidato in questa fascia."
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

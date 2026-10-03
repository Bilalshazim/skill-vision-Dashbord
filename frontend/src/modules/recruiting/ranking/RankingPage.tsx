import { PageHeader } from '@/components/patterns/PageHeader'
import { useEffect, useMemo, useState } from 'react'

import { DEFAULT_FLAGS, DEFAULT_ROLE, ROLES } from '@/modules/recruiting/lib/constants'
import { syncRankingFromBackend } from '@/modules/recruiting/lib/backend-sync'
import { ranking } from '@/modules/recruiting/lib/scoring'
import { readCandidates } from '@/modules/recruiting/lib/storage'
import { RankingCard } from '@/modules/recruiting/ranking/RankingCard'

// Migrated from modules/recruiting.html #scr-ranking (renderRanking()).
// Reuses the exact same ranking()/ahi() implementation Home (Phase 4)
// already uses — no second scoring implementation. No filters/sorting
// exist on this screen in the legacy app either (confirmed by inspection:
// #rkCountSpan is dead markup, immediately overwritten and never read
// elsewhere) — order is fixed, AHI descending, same as ranking() already
// produces.
export default function RankingPage() {
  // Phase 32 §2 — backend becomes the primary source for match scores: on
  // mount, reconcile every locally-known backend-linked candidate's icv
  // against the server's real ranking, THEN read local storage — so the
  // very first render already reflects backend-verified data rather than a
  // stale value from whenever the candidate was originally uploaded.
  const [syncKey, setSyncKey] = useState(0)
  useEffect(() => {
    let cancelled = false
    void syncRankingFromBackend().then((result) => {
      if (!cancelled && result.ok && result.updated > 0) setSyncKey((k) => k + 1)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const candidates = useMemo(() => {
    void syncKey // forces recompute after syncRankingFromBackend() writes — same convention as use-cv-export-data.ts's refreshKey
    return readCandidates()
  }, [syncKey])
  const rk = useMemo(() => ranking(candidates), [candidates])
  const role = ROLES[DEFAULT_ROLE]
  const flaggedCount = Object.keys(DEFAULT_FLAGS).length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Chi è il candidato migliore?" description={<>Posizione: <b className="font-semibold text-foreground">{DEFAULT_ROLE}</b> · <b className="font-semibold text-foreground">{rk.length}</b>{' '} candidati · <b className="font-semibold text-foreground">{flaggedCount}</b> skill flaggate</>} />

      {rk.length === 0 ? (
        <p className="py-6 text-app-small text-muted-foreground">
          Nessun candidato ancora in archivio. Carica i primi CV dalla pagina <b className="font-semibold text-foreground">CV & Esportazione</b>, oppure
          importa in blocco un archivio storico, per vedere qui la classifica.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rk.map(({ c, r }, i) => (
            <RankingCard key={c.id} candidate={c} result={r} position={i + 1} totalRanked={rk.length} role={role} />
          ))}
        </div>
      )}
    </div>
  )
}

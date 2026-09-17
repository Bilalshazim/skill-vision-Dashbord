import { ArrowLeftRight, FileSpreadsheet } from 'lucide-react'
import { useMemo, useState } from 'react'

import { LegacyBridgeButton } from '@/modules/recruiting/components/LegacyBridgeButton'
import { getInternalTalents, ranking } from '@/modules/recruiting/lib/scoring'
import { readCandidates } from '@/modules/recruiting/lib/storage'
import type { MatchPick } from '@/modules/recruiting/match/MatchCompare'
import { MatchCompare } from '@/modules/recruiting/match/MatchCompare'
import { MatchSlotPicker } from '@/modules/recruiting/match/MatchSlotPicker'

const CAND_SLOTS = [
  { key: 'cand_0', label: 'Candidato 1' },
  { key: 'cand_1', label: 'Candidato 2' },
]
const TALENT_SLOTS = [
  { key: 'it_0', label: 'Talento 1' },
  { key: 'it_1', label: 'Talento 2' },
  { key: 'it_2', label: 'Talento 3' },
  { key: 'it_3', label: 'Talento 4' },
  { key: 'it_4', label: 'Talento 5' },
]

// Migrated from modules/recruiting.html #scr-match ("Confronto candidati &
// talenti interni", ~366-394) — renderMatchPicker()/_buildMatchSlots()/
// _pickMatchSlot()/renderMatchCompare() (~4901-5025). Read-only: the only
// "state" is which candidate/talent sits in each of the 7 slots
// (`window._matchSel` in legacy — a plain, non-persisted global, lost on
// reload). Reproduced as local React state for the exact same reason
// Pagina A's selection Set is local state: it's ephemeral UI state, not
// data. No writes, no localStorage keys touched.
export default function MatchPage() {
  const candidates = useMemo(() => readCandidates(), [])
  const talents = useMemo(() => getInternalTalents(candidates), [candidates])
  const noCandidates = useMemo(() => ranking(candidates).length === 0, [candidates])

  const [selection, setSelection] = useState<Record<string, string>>({})

  function handleSelect(slotKey: string, id: string) {
    setSelection((prev) => ({ ...prev, [slotKey]: id }))
  }

  const picks: MatchPick[] = [
    ...CAND_SLOTS.map((s) => ({ id: selection[s.key], type: 'cand' as const })),
    ...TALENT_SLOTS.map((s) => ({ id: selection[s.key], type: 'it' as const })),
  ]
    .filter((p) => p.id)
    .map((p) => {
      const pool = p.type === 'it' ? talents : candidates
      const c = pool.find((x) => x.id === p.id)
      return c ? { c, type: p.type } : null
    })
    .filter((p): p is MatchPick => p !== null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
          <ArrowLeftRight className="size-[22px] text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Confronto candidati &amp; talenti interni</h2>
          <p className="text-[13px] text-muted-foreground">Seleziona fino a 2 candidati e 5 talenti interni per confrontarli sullo stesso schermo.</p>
        </div>
      </div>

      {noCandidates ? (
        <p className="py-6 text-[13.5px] text-muted-foreground">
          Nessun candidato in archivio. Carica i primi CV dalla pagina <b className="font-semibold text-foreground">CV & Export</b> per confrontarli
          con i vostri talenti interni.
        </p>
      ) : (
        <>
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-[22px] w-[3px] rounded-sm bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground dark:text-primary">Candidati (max 2)</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CAND_SLOTS.map((s) => (
                <MatchSlotPicker key={s.key} label={s.label} slotKey={s.key} pool={candidates} selectedId={selection[s.key] || ''} onSelect={(id) => handleSelect(s.key, id)} filled="cand" />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="h-[22px] w-[3px] rounded-sm bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground dark:text-primary">Talenti Interni — dipendenti (max 5)</span>
              {/* "Carica Excel dipendenti →" (modules/recruiting.html line
                  384) opens an admin-only panel (openAdmin(), gated on
                  isAdmin) this migration has no equivalent for — bridged,
                  not reproduced as a working React upload, same reasoning
                  as every other admin-only legacy feature. */}
              <LegacyBridgeButton icon={FileSpreadsheet} label="Carica Excel dipendenti" className="ml-auto" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {TALENT_SLOTS.map((s) => (
                <MatchSlotPicker key={s.key} label={s.label} slotKey={s.key} pool={talents} selectedId={selection[s.key] || ''} onSelect={(id) => handleSelect(s.key, id)} filled="it" />
              ))}
            </div>
          </div>

          <MatchCompare picks={picks} />
        </>
      )}
    </div>
  )
}

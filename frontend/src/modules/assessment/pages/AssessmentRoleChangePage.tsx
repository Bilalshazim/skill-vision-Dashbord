import { ArrowDown, UserRoundSearch } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/patterns/EmptyState'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Note } from '@/components/patterns/Note'
import { StaggerItem } from '@/components/patterns/StaggerItem'
import { StaggerList } from '@/components/patterns/StaggerList'
import { SelectField } from '@/components/patterns/SelectField'
import { Card, CardDescription, CardLabel } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BestChoice } from '@/modules/assessment/components/role-change/BestChoice'
import { CandidateCard } from '@/modules/assessment/components/role-change/CandidateCard'
import { CompatibilityDetail } from '@/modules/assessment/components/role-change/CompatibilityDetail'
import { LeaverSummary } from '@/modules/assessment/components/role-change/LeaverSummary'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { activeEmployees, allRolesKnown, areasList } from '@/modules/assessment/lib/calculations'
import { type RoleBrief, computeRoleChange } from '@/modules/assessment/lib/role-change'

const EMPTY: RoleBrief = { leaverId: '', role: '', tasks: '', area: '', level: '', sameArea: false }

// Cambio ruolo / trasferimenti (documento del cliente, 2026-10-13): «se
// questa persona lascia il ruolo, prima di valutare una nuova assunzione,
// chi abbiamo già in azienda che potrebbe sostituirla nel modo più
// efficace?». Si sceglie chi lascia; ruolo, attività, area e livello si
// compilano dalla sua scheda e si possono correggere. Poi, dall'alto in
// basso: chi lascia → le 3 migliori soluzioni interne (chi, perché, cosa
// manca, quanto è facile) → la scelta migliore. Ogni persona apre il
// dettaglio REQUISITI DEL RUOLO ↔ COMPETENZE DELLA PERSONA. Sotto le tre,
// l'azienda può aggiungere al confronto una persona scelta da lei (richiesta
// del cliente, 2026-10-13), con la sua posizione in classifica. Il calcolo è in
// lib/role-change.ts; questa pagina compone e non salva niente.
export default function AssessmentRoleChangePage() {
  const { state, ui, lang } = useAssessment()
  const [brief, setBrief] = useState<RoleBrief>(EMPTY)
  const [openId, setOpenId] = useState<string | null>(null)
  const [pickedId, setPickedId] = useState('')
  const people = useMemo(() => activeEmployees(state).sort((a, b) => `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`)), [state])
  const roles = useMemo(() => allRolesKnown(state), [state])
  const areas = useMemo(() => areasList(state).filter(Boolean), [state])
  const leaver = people.find((e) => e.id === brief.leaverId)
  const result = useMemo(() => (leaver && brief.role ? computeRoleChange(state, brief, lang) : null), [state, brief, lang, leaver])
  // Le persone fuori dalle tre proposte, in ordine alfabetico, per la scelta
  // dell'azienda; la posizione in classifica resta quella del calcolo.
  const top = new Set(result?.top.map((c) => c.emp.id))
  const others = (result?.ranked ?? []).filter((c) => !top.has(c.emp.id)).sort((a, b) => `${a.emp.cognome} ${a.emp.nome}`.localeCompare(`${b.emp.cognome} ${b.emp.nome}`))
  const pickedRank = result?.ranked.findIndex((c) => c.emp.id === pickedId && !top.has(c.emp.id)) ?? -1
  const picked = pickedRank >= 0 ? result!.ranked[pickedRank] : null
  const openedRank = result?.ranked.findIndex((c) => c.emp.id === openId) ?? -1
  const opened = openedRank >= 0 ? result!.ranked[openedRank] : null
  const set = (patch: Partial<RoleBrief>) => setBrief((b) => ({ ...b, ...patch }))

  function pickLeaver(id: string) {
    const e = people.find((p) => p.id === id)
    setBrief((b) => (e ? { ...b, leaverId: id, role: e.ruolo, tasks: e.mansione, area: e.area, level: e.livelloCcnl } : { ...EMPTY, sameArea: b.sameArea }))
    setOpenId(null)
    setPickedId('')
  }

  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className="gap-4">
        <div className="flex flex-col gap-1">
          <CardLabel>{ui.rcBriefTitle}</CardLabel>
          <CardDescription className="max-w-3xl text-app-body">{ui.rcQuestion}</CardDescription>
        </div>
        <FieldGrid columns={3}>
          <Field label={ui.rcLeaver}>
            <SelectField value={brief.leaverId} onValueChange={pickLeaver}>
              <option value="">{ui.rcLeaverPick}</option>
              {people.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.cognome} {e.nome} · {e.ruolo}
                </option>
              ))}
            </SelectField>
          </Field>
          <Field label={ui.rcRole}>
            <SelectField value={brief.role} onValueChange={(v) => set({ role: v })} disabled={!leaver}>
              <option value="">–</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </SelectField>
          </Field>
          <Field label={ui.rcArea}>
            <Input list="rc-areas" value={brief.area} onChange={(e) => set({ area: e.target.value })} disabled={!leaver} />
            <datalist id="rc-areas">
              {areas.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </Field>
        </FieldGrid>
        <FieldGrid columns={3}>
          <Field label={ui.rcTasks} className="sm:col-span-2">
            <Textarea rows={2} placeholder={ui.rcTasksPh} value={brief.tasks} onChange={(e) => set({ tasks: e.target.value })} disabled={!leaver} />
          </Field>
          <Field label={ui.rcLevel}>
            <Input value={brief.level} onChange={(e) => set({ level: e.target.value })} disabled={!leaver} />
          </Field>
        </FieldGrid>
        <div className="flex items-center gap-2">
          <Checkbox id="rc-same-area" checked={brief.sameArea} onCheckedChange={(c) => set({ sameArea: c === true })} disabled={!leaver} />
          <label htmlFor="rc-same-area" className="text-app-small text-foreground">
            {ui.rcSameArea}
          </label>
        </div>
      </Card>

      {!leaver || !result ? (
        <EmptyState icon={UserRoundSearch} title={ui.rcEmptyTitle} description={ui.rcEmpty} />
      ) : (
        <>
          <LeaverSummary emp={leaver} role={brief.role} tasks={brief.tasks} area={brief.area} level={brief.level} ui={ui} />
          <ArrowDown className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-app-section text-foreground">{ui.rcBestTitle}</h2>
              <Note size="caption">{ui.rcBestSub(result.pool)}</Note>
              <Note size="caption">{result.hardSource === 'persona' ? ui.rcHardFromPerson(`${leaver.nome} ${leaver.cognome}`) : ui.rcHardFromBench}</Note>
              {result.noSoftProfile ? <Note size="caption">{ui.rcNoSoftProfile(brief.role)}</Note> : null}
            </div>
            {result.top.length ? (
              <StaggerList className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {result.top.map((c, i) => (
                  <StaggerItem key={c.emp.id} pressable>
                    <CandidateCard candidate={c} rank={i} ui={ui} onOpen={() => setOpenId(c.emp.id)} />
                  </StaggerItem>
                ))}
              </StaggerList>
            ) : (
              <EmptyState size="sm" title={ui.rcNoCandidates} />
            )}
          </section>
          {result.top.length ? (
            <>
              <ArrowDown className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
              <BestChoice top={result.top} ui={ui} />
            </>
          ) : null}
          {result.ranked.length > result.top.length ? (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-app-section text-foreground">{ui.rcPickTitle}</h2>
                <Note size="caption">{ui.rcPickSub}</Note>
              </div>
              <FieldGrid columns={3}>
                <Field label={ui.rcPickLabel}>
                  <SelectField value={picked ? pickedId : ''} onValueChange={setPickedId}>
                    <option value="">{ui.rcPickNone}</option>
                    {others.map((c) => (
                      <option key={c.emp.id} value={c.emp.id}>
                        {c.emp.cognome} {c.emp.nome} · {c.emp.ruolo}
                      </option>
                    ))}
                  </SelectField>
                </Field>
              </FieldGrid>
              {picked ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <CandidateCard candidate={picked} rank={pickedRank} label={ui.rcPickedRank(pickedRank + 1, result.ranked.length)} ui={ui} onOpen={() => setOpenId(picked.emp.id)} />
                </div>
              ) : null}
            </section>
          ) : null}
          <CompatibilityDetail candidate={opened} rank={openedRank} hardFrom={result.hardSource === 'persona' ? `${leaver.nome} ${leaver.cognome}` : null} ui={ui} lang={lang} onClose={() => setOpenId(null)} />
        </>
      )}
    </div>
  )
}

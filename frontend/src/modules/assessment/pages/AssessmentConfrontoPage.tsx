import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { CompetencyHeatmap } from '@/components/patterns/CompetencyHeatmap'
import { CompetencyRows } from '@/components/patterns/CompetencyRows'
import { EmptyState } from '@/components/patterns/EmptyState'
import { PageBreadcrumb } from '@/components/patterns/PageBreadcrumb'
import { PageHeader } from '@/components/patterns/PageHeader'
import { ProfileRadar } from '@/components/patterns/ProfileRadar'
import { RoleFitRanking } from '@/components/patterns/RoleFitRanking'
import { SelectField } from '@/components/patterns/SelectField'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SelectItem } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { evaluatedEmployees, primaryScore } from '@/modules/assessment/lib/calculations'
import { fmt1it, getSoftClusters, getSoftSkills } from '@/modules/assessment/lib/legacy-utils'
import { roleSkills, softIndex } from '@/modules/assessment/lib/role-index'
import type { Employee } from '@/modules/assessment/lib/types'

const MAX_PEOPLE = 5
// Una persona per colore, la stessa in tutti i grafici. A due: ambra e magenta,
// eccezione voluta alla regola delle due serie (CLAUDE.md, Fase 6).
const COLORS_TWO = ['var(--chart-3)', 'var(--chart-2)']
const COLORS_MANY = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const dim = (color: string) => `color-mix(in oklab, ${color} 25%, transparent)`
const initials = (e: Employee) => `${e.nome[0] ?? ''}${e.cognome[0] ?? ''}`.toUpperCase()
const fullName = (e: Employee) => `${e.nome} ${e.cognome}`

// Il confronto fra persone (CLAUDE.md, Fase 6, tavole «Confronto a 2» e «Confronto
// fino a 5»): chi si confronta sta nell'indirizzo (?ids=a,b). Il ruolo di
// riferimento è quello della prima persona. In cima la classifica di adattamento;
// sotto, a due: una riga per competenza e il radar; da tre a cinque: radar, barre
// per area, heatmap delle 35. Clic su un nome: resta in evidenza, gli altri si
// attenuano. I numeri vengono solo dalle 35 competenze, mai dai sottofattori.
export default function AssessmentConfrontoPage() {
  const { state, lang, ui } = useAssessment()
  const res = ui.res
  const [params, setParams] = useSearchParams()
  const [focus, setFocus] = useState<string | null>(null)
  const [scope, setScope] = useState<'role' | 'all'>('role')

  const evaluated = useMemo(() => evaluatedEmployees(state), [state])
  const requested = (params.get('ids') ?? '').split(',').filter(Boolean)
  const people = requested.map((id) => evaluated.find((e) => e.id === id)).filter((e): e is Employee => !!e).slice(0, MAX_PEOPLE)
  const setIds = (list: string[]) => {
    setFocus(null)
    const q = new URLSearchParams(params)
    q.set('ids', list.join(','))
    setParams(q, { replace: true })
  }
  const toggleFocus = (id: string) => setFocus((f) => (f === id ? null : id))
  const ids = people.map((p) => p.id)
  const addable = evaluated.filter((e) => !ids.includes(e.id)).sort((a, b) => primaryScore(b, state, lang) - primaryScore(a, state, lang))

  const role = people[0]?.ruolo ?? ''
  const skills = useMemo(() => getSoftSkills(lang), [lang])
  const inRole = roleSkills(state, role, lang)
  // Un ruolo senza competenze scelte si confronta su tutte le 35, e lo si dice.
  const radarSkills = inRole.length ? inRole : skills.map((s) => ({ ...s, weight: 1 as const }))
  const colors = people.length === 2 ? COLORS_TWO : COLORS_MANY
  const score = (e: Employee, id: string) => e.soft[id]?.ottenuto ?? 0

  const picker = (
    <Card className="flex-row flex-wrap items-center gap-2">
      {people.map((p, i) => (
        <span key={p.id} className={`inline-flex items-center gap-2 rounded-md border border-border py-1 pr-1 pl-3 transition-opacity ${focus && focus !== p.id ? 'opacity-40' : ''}`}>
          <span aria-hidden="true" className={`size-3 ${people.length === 2 && i === 1 ? 'rotate-45' : 'rounded-full'}`} style={{ background: colors[i] }} />
          <button type="button" aria-pressed={focus === p.id} onClick={() => toggleFocus(p.id)} className="rounded-xs text-left text-app-small font-medium text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            {fullName(p)}
            <span className="block text-app-caption font-normal text-muted-foreground">{p.ruolo}</span>
          </button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={res.cmpRemove(fullName(p))} onClick={() => setIds(ids.filter((x) => x !== p.id))}>
            <X aria-hidden="true" />
          </Button>
        </span>
      ))}
      {people.length < MAX_PEOPLE ? (
        <SelectField size="sm" className="w-64" value="" placeholder={res.cmpAdd} aria-label={res.cmpAdd} onValueChange={(v) => setIds([...ids, v])}>
          {addable.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {fullName(e)} · {e.ruolo}
            </SelectItem>
          ))}
        </SelectField>
      ) : null}
    </Card>
  )

  const crumbs = [
    { label: ui.res.home, to: '/assessment/home' },
    { label: res.cmpArea, to: '/assessment/soft-risultati' },
    { label: res.cmpResults, to: '/assessment/soft-risultati' },
  ]

  if (people.length < 2) {
    return (
      <div className="flex flex-col gap-4">
        <PageBreadcrumb className="mb-0" items={crumbs} current={res.cmpCurrent} />
        <PageHeader level="page" className="mb-0" title={res.cmpEmptyHeader} />
        {picker}
        <Card>
          <EmptyState title={res.cmpEmptyTitle} description={res.cmpEmptySub} />
        </Card>
      </div>
    )
  }

  // La classifica: l'indice a 100 sulle competenze del ruolo di riferimento.
  const radarIds = radarSkills.map((s) => s.id)
  const rows = people.map((p, i) => ({ id: p.id, name: fullName(p), meta: p.ruolo, value: Math.round(softIndex(state, p, role, radarIds) ?? 0), color: colors[i] }))
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const tied = sorted.filter((r) => sorted[0].value - r.value <= 3)
  const sentence = tied.length > 1 ? res.cmpTied(tied.map((r) => r.name), tied.map((r) => r.value)) : res.cmpLeader(sorted[0].name, sorted[0].value, sorted[1].name, sorted[1].value)
  const fitLabel = res.cmpFitLabel(radarIds.length)
  const seriesColor = (i: number, id: string) => (focus && focus !== id ? dim(colors[i]) : colors[i])

  const radar = (
    <Card className="gap-3">
      <p className="label-mono text-muted-foreground">{res.cmpRadarTitle(radarIds.length)}</p>
      <ProfileRadar
        title={res.cmpRadarTitle(radarIds.length)}
        hideTable
        format={fmt1it}
        axes={radarSkills.map((s) => ({ key: s.id, label: s.name }))}
        series={people.map((p, i) => ({ label: fullName(p), color: seriesColor(i, p.id), pointShape: people.length === 2 && i === 1 ? ('diamond' as const) : undefined, dashed: people.length === 2 && i === 1, values: Object.fromEntries(radarIds.map((id) => [id, score(p, id)])) }))}
      />
    </Card>
  )

  if (people.length === 2) {
    const [a, b] = people
    const list = scope === 'role' ? radarSkills : skills.map((s) => ({ ...s, weight: 1 as const }))
    const row = (s: { id: string; name: string }) => ({ key: s.id, label: s.name, a: score(a, s.id), b: score(b, s.id) })
    const groups =
      scope === 'role'
        ? ([3, 2, 1] as const).map((w) => ({ label: res.cmpWeight[w], rows: radarSkills.filter((s) => s.weight === w).map(row) })).filter((g) => g.rows.length)
        : getSoftClusters(lang).map((c: string) => ({ label: c, rows: skills.filter((s) => s.cluster === c).map(row) }))
    const same = list.filter((s) => score(a, s.id) === score(b, s.id)).length
    const aAhead = list.filter((s) => score(a, s.id) > score(b, s.id)).length
    return (
      <div className="flex flex-col gap-4">
        <PageBreadcrumb className="mb-0" items={crumbs} current={res.cmpCurrent} />
        <PageHeader level="page" className="mb-0" eyebrow={res.cmpEyebrowTwo} title={res.cmpTitle(role)} />
        {picker}
        <RoleFitRanking label={fitLabel} sentence={sentence} rows={rows} referenceLabel={res.cmpReference} focus={focus} onFocus={toggleFocus} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ToggleGroup type="single" value={scope} onValueChange={(v) => v && setScope(v as 'role' | 'all')} aria-label={res.cmpScopeLabel}>
            <ToggleGroupItem value="role">{res.cmpScopeRole(radarIds.length)}</ToggleGroupItem>
            <ToggleGroupItem value="all">{res.cmpScopeAll(skills.length)}</ToggleGroupItem>
          </ToggleGroup>
          <p className="text-app-small text-muted-foreground">{res.cmpSummary(list.length, same, a.nome, aAhead, b.nome, list.length - same - aAhead)}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <CompetencyRows title={res.cmpCompetency} people={[{ name: fullName(a), short: initials(a), color: colors[0] }, { name: fullName(b), short: initials(b), color: colors[1] }]} groups={groups} format={fmt1it} />
          {radar}
        </div>
      </div>
    )
  }

  // Da tre a cinque persone: le barre per area, dalla persona più alta.
  const areaAvg = (p: Employee, cluster: string) => {
    const vals = skills.filter((s) => s.cluster === cluster).map((s) => score(p, s.id)).filter((v) => v > 0)
    return vals.length ? vals.reduce((n, v) => n + v, 0) / vals.length : 0
  }
  const clusters = getSoftClusters(lang) as string[]
  return (
    <div className="flex flex-col gap-4">
      <PageBreadcrumb className="mb-0" items={crumbs} current={res.cmpCurrent} />
      <PageHeader level="page" className="mb-0" eyebrow={res.cmpEyebrowMany(people.length)} title={res.cmpTitleMany(people.length)} description={res.cmpManySub} />
      {picker}
      <RoleFitRanking label={fitLabel} sentence={sentence} rows={rows} referenceLabel={res.cmpReference} focus={focus} onFocus={toggleFocus} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {radar}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {clusters.map((c) => (
            <Card key={c} className="gap-2">
              <p className="label-mono text-muted-foreground">{c}</p>
              <ul className="flex flex-col gap-1">
                {people
                  .map((p, i) => ({ p, i, v: areaAvg(p, c) }))
                  .sort((x, y) => y.v - x.v)
                  .map(({ p, i, v }) => (
                    <li key={p.id} className={`grid grid-cols-6 items-center gap-2 transition-opacity ${focus && focus !== p.id ? 'opacity-40' : ''}`}>
                      <span className="text-app-caption text-muted-foreground">{initials(p)}</span>
                      <span className="col-span-4 h-3 rounded-xs bg-muted">
                        <span className="block h-full rounded-xs" style={{ width: `${(v / 10) * 100}%`, background: colors[i] }} />
                      </span>
                      <span className="text-right text-app-caption tabular-nums text-foreground">{fmt1it(v)}</span>
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
      <CompetencyHeatmap
        title={res.cmpHeatTitle(skills.length)}
        columns={people.map((p, i) => ({ id: p.id, label: `${p.nome} ${p.cognome[0] ?? ''}.`, color: colors[i] }))}
        groups={clusters.map((c) => ({ label: c, rows: skills.filter((s) => s.cluster === c).map((s) => ({ key: s.id, label: s.name, values: people.map((p) => (score(p, s.id) > 0 ? score(p, s.id) : null)) })) }))}
        format={fmt1it}
        focus={focus}
        onFocus={toggleFocus}
      />
    </div>
  )
}

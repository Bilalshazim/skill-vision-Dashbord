import { ChartDataTable } from '@/components/patterns/ChartDataTable'
import { ProfileRadar, type RadarSeries } from '@/components/patterns/ProfileRadar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { fmtDec } from '@/lib/format'
import type { Candidate } from '@/modules/recruiting/lib/types'

export type MatchPick = { c: Candidate; type: 'cand' | 'it' }

// Le competenze trasversali sono in scala APEX 0–31.
const MAX = 31
// Un radar con troppi assi non si legge: se le competenze sono più di così, si
// mostrano quelle in cui i profili differiscono di più (le altre restano nella
// tabella completa sotto).
const MAX_AXES = 8
const MIN_AXES = 3

const score = (c: Candidate, sk: string) => c.scores?.[sk] ?? 0
const short = (s: string) => (s.length > 14 ? `${s.slice(0, 13)}…` : s)

// Gli assi di un radar: tutte le competenze se ci stanno, altrimenti le
// MAX_AXES con più scarto fra il valore più alto e il più basso.
function pickAxes(skills: string[], series: RadarSeries[]) {
  const spread = (sk: string) => {
    const vals = series.map((s) => s.values[sk] ?? 0)
    return Math.max(...vals) - Math.min(...vals)
  }
  const chosen = skills.length <= MAX_AXES ? skills : [...skills].sort((a, b) => spread(b) - spread(a) || a.localeCompare(b, 'it')).slice(0, MAX_AXES)
  return chosen.map((sk) => ({ key: sk, label: sk, short: short(sk) }))
}

const valuesOf = (c: Candidate, skills: string[]) => Object.fromEntries(skills.map((sk) => [sk, score(c, sk)]))

function averageOf(cs: Candidate[], skills: string[]) {
  return Object.fromEntries(skills.map((sk) => [sk, cs.reduce((sum, c) => sum + score(c, sk), 0) / cs.length]))
}

// Un radar con i suoi assi scelti. Meno di MIN_AXES competenze: un radar non
// ha senso, resta la tabella dei valori.
function RadarBlock({ title, note, skills, series }: { title: string; note?: string; skills: string[]; series: RadarSeries[] }) {
  const axes = pickAxes(skills, series)
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {note ? <p className="mt-0.5 text-app-caption text-muted-foreground">{note}</p> : null}
        </div>
      </CardHeader>
      <CardContent>
        {axes.length >= MIN_AXES ? (
          <ProfileRadar size="sm" title={title} max={MAX} format={(n) => fmtDec(n, 1)} axes={axes} series={series} />
        ) : (
          <ChartDataTable
            visible
            title={title}
            rowHeader="Competenza"
            columns={series.map((s) => ({ label: s.label, reference: s.reference }))}
            rows={axes.map((a) => ({ label: a.label, values: series.map((s) => s.values[a.key] ?? null) }))}
            format={(n) => fmtDec(n, 1)}
          />
        )}
      </CardContent>
    </Card>
  )
}

// Confronto candidati e talenti interni (Fase "Foglio 2", Roberto Feliciani):
// il grafico a radar al posto delle barre. Tre regole per tenerlo leggibile —
//  - fino a 2 candidati, ciascuno nel suo colore, contro la **media dei
//    talenti interni** (contorno tratteggiato): è lo stesso riferimento che il
//    vecchio confronto usava per giudicare i candidati;
//  - i talenti interni su un radar a parte, uno per colore, così nessun grafico
//    ha più di 5 serie sovrapposte;
//  - colori dalle regole dei grafici (chart-colors.ts) e legenda sotto il
//    radar; ogni valore è scritto nella tabella: il colore non è l'unico veicolo.
export function MatchCompare({ picks }: { picks: MatchPick[] }) {
  if (picks.length < 2) {
    return (
      <div className="rounded-sm border border-border bg-card p-6 text-center text-app-small text-muted-foreground">
        {picks.length === 1 ? 'Seleziona almeno un altro profilo per avviare il confronto' : 'Seleziona 2 o più profili per confrontarli'}
      </div>
    )
  }

  const skills = Array.from(new Set(picks.flatMap((p) => Object.keys(p.c.scores || {})))).sort((a, b) => a.localeCompare(b, 'it'))
  if (skills.length === 0) {
    return <div className="rounded-sm border border-border bg-card p-6 text-app-small text-muted-foreground">Nessuna competenza trasversale in comune.</div>
  }

  const candidates = picks.filter((p) => p.type === 'cand').map((p) => p.c)
  const talents = picks.filter((p) => p.type === 'it').map((p) => p.c)

  const candidateSeries: RadarSeries[] = candidates.map((c) => ({ label: c.name, values: valuesOf(c, skills) }))
  if (candidates.length && talents.length) {
    candidateSeries.unshift({ label: talents.length > 1 ? `Media dei ${talents.length} talenti interni` : `Talento interno: ${talents[0].name}`, values: averageOf(talents, skills), reference: true })
  }
  const talentSeries: RadarSeries[] = talents.map((c) => ({ label: c.name, values: valuesOf(c, skills) }))

  const showCandidates = candidates.length > 0
  // Un solo talento già nel radar dei candidati come riferimento: il radar dei talenti serve da 2 in su, o se non ci sono candidati.
  const showTalents = talents.length >= 2 || (talents.length >= 1 && !showCandidates)

  const allColumns = picks.map((p) => ({ label: p.c.name }))

  return (
    <div className="flex flex-col gap-4">
      <div className={showCandidates && showTalents ? 'grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2' : 'grid grid-cols-1 gap-4'}>
        {showCandidates && (
          <RadarBlock
            title={talents.length ? 'Candidati e media dei talenti interni' : 'Confronto fra candidati'}
            note={skills.length > MAX_AXES ? `Le ${MAX_AXES} competenze trasversali in cui i profili differiscono di più` : 'Competenze trasversali (scala APEX 0–31)'}
            skills={skills}
            series={candidateSeries}
          />
        )}
        {showTalents && (
          <RadarBlock
            title="Talenti interni"
            note={skills.length > MAX_AXES ? `Le ${MAX_AXES} competenze trasversali in cui i profili differiscono di più` : 'Competenze trasversali (scala APEX 0–31)'}
            skills={skills}
            series={talentSeries}
          />
        )}
      </div>

      <Card padding="none">
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-app-small font-semibold text-foreground">
            Tutte le competenze trasversali ({skills.length})
            <span className="label-mono text-muted-foreground">Mostra / nascondi</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-x-auto border-t border-border px-4 py-3">
            <ChartDataTable
              visible
              title="Tutte le competenze trasversali dei profili selezionati"
              rowHeader="Competenza"
              columns={allColumns}
              rows={skills.map((sk) => ({ label: sk, values: picks.map((p) => score(p.c, sk)) }))}
              format={(n) => fmtDec(n, 1)}
            />
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}

import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { fmtDec } from '@/lib/format'
import { fmtScore10 } from '@/modules/recruiting/lib/format'
import { people, useRecruitingResults } from '@/modules/recruiting/results/use-recruiting-results'

// «Chi scegliamo?» — Confrontare i finalisti (CLAUDE.md, Fase 6, tabella "Chi
// scegliamo?"). Finalisti = i candidati nello stato «In fase di
// approfondimento» (con un colloquio). Barre dei finalisti per punteggio su
// 10, il primo in evidenza. Punto di forza e rischio del primo finalista sulle
// competenze trasversali scelte nel profilo, in punti sulla scala del test.
export default function ChiScegliamoPage() {
  const { data, step, crumbs, home, demoNote } = useRecruitingResults('chi-scegliamo')
  const first = data.finalists[0]
  const scored = data.finalists.filter((f) => f.score != null)
  return (
    <ResultsPage
      crumbs={crumbs}
      number={step.number}
      title={step.title}
      question={step.sub}
      why="La scelta finale pesa più di tutte le altre, e una scelta sbagliata si scopre tardi. Mettere i finalisti fianco a fianco, con punti di forza e rischi, rende la decisione motivata."
      empty={data.finalists.length ? undefined : { title: 'Nessun finalista.', description: 'Lo diventano i candidati in colloquio.' }}
      situation={{
        text: `I finalisti sono ${data.finalists.length}. Il primo è ${first?.name ?? '—'}${first?.score != null ? `, con ${fmtScore10(first.score)}` : ''}.`,
        chart: scored.length ? (
          <CategoryBars
            title="Finalisti per punteggio, su 10"
            orientation="horizontal"
            height="auto"
            valueMax={10}
            format={(n) => fmtDec(n)}
            series={[{ key: 'v', label: 'Punteggio su 10' }]}
            rows={scored.map((f) => ({ label: f.name, values: { v: Math.floor((f.score as number) + 1e-9) / 10 } }))}
            highlight={scored[0].name}
          />
        ) : undefined,
        chartEmpty: 'Il grafico compare quando i finalisti hanno un punteggio.',
      }}
      issues={{
        items: [
          {
            title: 'Punto di forza',
            value: data.strength ? data.strength.name : 'Nessuna competenza sopra l’atteso.',
            body: data.strength ? `${fmtDec(data.strength.gap)} punti sopra l’atteso · ${first?.name}` : undefined,
          },
          {
            title: 'Rischio',
            value: data.risk ? data.risk.name : 'Nessuna competenza sotto l’atteso.',
            body: data.risk ? `${fmtDec(-data.risk.gap)} punti sotto l’atteso · ${first?.name}` : undefined,
          },
          { title: 'Colloqui in programma', value: data.interviewsPlanned ? people(data.interviewsPlanned, 'colloquio', 'colloqui') : 'Nessuno oggi.', link: { label: 'Apri', to: '/recruiting/colloqui' } },
        ],
        opportunity: 'L’opportunità: chi non viene scelto resta In riserva per la prossima ricerca.',
      }}
      impact={{ pct: data.finalistsPct, label: 'delle candidature arriva in finale', hint: 'I candidati in fase di approfondimento, sul totale delle candidature ricevute per questa posizione.' }}
      suggestion={{
        text: 'Confrontare i finalisti su punti di forza e rischi, poi chiudere con l’esito: Assunto, In riserva o Non selezionato. Per decidere puoi interpellare il Senior Advisor.',
        link: { label: 'Vai a Migliori candidati', to: '/recruiting/pagina-a' },
      }}
      deepDives={[
        { label: 'Candidati per fascia di idoneità', to: '/recruiting/fasce-idoneita' },
        { label: 'Imbuto di selezione', to: '/recruiting/imbuto-scelta' },
      ]}
      home={home}
      demoNote={demoNote}
    />
  )
}

import { ResultsPage } from '@/components/patterns/ResultsPage'
import { IDONEITA } from '@/lib/idoneita'
import { QualityStackedBar } from '@/modules/recruiting/components/QualityStackedBar'
import { fmtScore10 } from '@/modules/recruiting/lib/format'
import { QUALITY_BANDS } from '@/modules/recruiting/lib/quality-bands'
import { people, useRecruitingResults } from '@/modules/recruiting/results/use-recruiting-results'

// «Chi è più adatto?» — Valutare tutti in un unico elenco (CLAUDE.md, Fase 6,
// tabella "Chi è più adatto?"). I dati dei test vengono da Risultati (la
// classifica con i test, sulla posizione attiva). Il grafico è quello di
// «Candidati per fascia di idoneità», con il nome della fascia scritto e i
// colori di stato (DECISIONI: la barra a segmenti, non un Bar Chart, perché
// le barre di Bklit hanno un colore per serie e non per fascia).
export default function ChiEPiuAdattoPage() {
  const { data, step, crumbs, home, demoNote } = useRecruitingResults('chi-e-piu-adatto')
  const buckets = QUALITY_BANDS.map((b, i) => ({ label: b.name, tone: IDONEITA[b.idoneita].tone, count: data.buckets[i].length }))
  const hint = 'I candidati che hanno completato il test, sul totale di quelli a cui è stato inviato.'
  return (
    <ResultsPage
      crumbs={crumbs}
      number={step.number}
      title={step.title}
      question={step.sub}
      why="Un elenco unico, con CV, test e colloquio sullo stesso metro, confronta i candidati su quello che serve alla posizione e non sull’impressione del momento."
      situation={{
        text: `${people(data.completed)} ${data.completed === 1 ? 'ha' : 'hanno'} completato il test, ${data.pending} ${data.pending === 1 ? 'lo deve' : 'lo devono'} ancora fare.`,
        hint: {
          label: 'Le fasce di idoneità',
          text: 'Idoneo: indice AHI da 8,5 su 10. Da valutare: da 6,0 a meno di 8,5. Non idoneo: sotto 6,0, o una competenza essenziale sotto la soglia.',
        },
        chart: data.ranking.length ? <QualityStackedBar buckets={buckets} total={data.ranking.length} /> : undefined,
        chartEmpty: 'Le fasce compaiono quando i candidati della posizione completano il test.',
      }}
      issues={{
        items: [
          { title: 'Test completati', value: data.completed ? people(data.completed) : 'Nessuno oggi.', link: { label: 'Apri', to: '/recruiting/classifica-test' } },
          { title: 'Test in attesa', value: data.pending ? people(data.pending) : 'Nessuno oggi.', body: 'Inviati e non ancora completati.', link: { label: 'Apri', to: '/recruiting/preselezionati' } },
          {
            title: 'Primo in classifica',
            value: data.leader ? data.leader.c.name : 'Nessuno ancora: la classifica parte dal primo test completato.',
            body: data.leader ? fmtScore10(data.leader.r.v) : undefined,
            link: { label: 'Apri', to: '/recruiting/ranking' },
          },
        ],
        opportunity: 'i candidati si confrontano tutti sullo stesso test, non solo sul CV.',
      }}
      impact={{ pct: data.completedPct, label: 'dei test inviati è completato', hint }}
      suggestion={{
        text: 'Sollecitare i test in attesa, poi fissare il colloquio con i primi della classifica. Per leggere i risultati puoi interpellare il Senior Advisor.',
        link: { label: 'Vai a Risultati', to: '/recruiting/ranking' },
      }}
      deepDives={[
        { label: 'Confronto interno', to: '/recruiting/match' },
        { label: 'Stato dell’arte', to: '/recruiting/stato-dell-arte' },
        { label: 'Imbuto di selezione', to: '/recruiting/imbuto-scelta' },
      ]}
      home={home}
      demoNote={demoNote}
    />
  )
}

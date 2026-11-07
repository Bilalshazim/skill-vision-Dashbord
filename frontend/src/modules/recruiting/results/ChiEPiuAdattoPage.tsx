import { TextLink } from '@/components/patterns/EuroFigure'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { ResultsTile } from '@/components/patterns/ResultsTile'
import { fmtScore10 } from '@/modules/recruiting/lib/format'
import { CvRankingList } from '@/modules/recruiting/pagina-a/CvRankingList'
import { people, useRecruitingResults } from '@/modules/recruiting/results/use-recruiting-results'

// «Chi è più adatto?» (Decisioni del 2026-11-06): 1 Ranking, i candidati della posizione per
// match CV / profilo, il clic sul nome apre il CV, la selezione e «Invia link test» (lo stesso
// contenuto di /recruiting/pagina-a); 2 Risultati; 3 Vai ai migliori candidati; 4 L'impatto;
// 5 Cosa ti suggeriamo di fare.
export default function ChiEPiuAdattoPage() {
  const { data, step, crumbs, home, demoNote } = useRecruitingResults('chi-e-piu-adatto')
  const best = { label: 'Vai ai migliori candidati', to: '/recruiting/ranking' }
  return (
    <ResultsPage
      crumbs={crumbs}
      number={step.number}
      title={step.title}
      question={step.sub}
      why="Un elenco unico, con CV, test e colloquio sullo stesso metro, confronta i candidati su quello che serve alla posizione e non sull’impressione del momento."
      sections={[
        { title: 'Ranking', content: <CvRankingList /> },
        {
          title: 'Risultati',
          content: (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ResultsTile title="Test completati" value={data.completed ? people(data.completed) : 'Nessuno oggi.'} link={{ label: 'Apri', to: '/recruiting/classifica-test' }} />
              <ResultsTile title="Test in attesa" value={data.pending ? people(data.pending) : 'Nessuno oggi.'} body="Inviati e non ancora completati." link={{ label: 'Apri', to: '/recruiting/preselezionati' }} />
              <ResultsTile title="Primo in classifica" value={data.leader ? data.leader.c.name : 'Nessuno ancora: la classifica parte dal primo test completato.'} body={data.leader ? fmtScore10(data.leader.r.v) : undefined} link={{ label: 'Apri', to: '/recruiting/ranking' }} />
            </div>
          ),
        },
        { title: 'Vai ai migliori candidati', content: <TextLink link={best} /> },
      ]}
      impact={{ pct: data.completedPct, label: 'dei test inviati è completato', hint: 'I candidati che hanno completato il test, sul totale di quelli a cui è stato inviato.' }}
      suggestion={{ text: 'Sollecitare i test in attesa, poi fissare il colloquio con i primi della classifica. Per leggere i risultati puoi interpellare il Senior Advisor.', link: best }}
      home={home}
      demoNote={demoNote}
    />
  )
}

import { TextLink } from '@/components/patterns/EuroFigure'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { ResultsTile } from '@/components/patterns/ResultsTile'
import { fmtDec } from '@/lib/format'
import { activeRole } from '@/modules/recruiting/lib/active-role'
import { fmtScore10 } from '@/modules/recruiting/lib/format'
import { loadIvEvalRecord, loadIvNotesRecord } from '@/modules/recruiting/lib/interview-protocol'
import { useRecruitingResults } from '@/modules/recruiting/results/use-recruiting-results'

const when = (at?: number | null) => (at ? `Compilata il ${new Date(at).toLocaleDateString('it-IT')}` : 'Da fare')

// «Chi scegliamo?» è il colloquio, ed entra tutto l'ex livello 4 (Decisioni del 2026-11-06):
// 1 Colloqui, 2 Valutazioni, 3 Candidati al podio, 4 L'impatto, 5 Cosa ti suggeriamo di fare,
// con il link al Report finale. Sul podio i primi tre finalisti (i candidati in colloquio), con
// il punto di forza e il rischio sulle competenze scelte, in punti sulla scala del test.
export default function ChiScegliamoPage() {
  const { data, step, crumbs, home, demoNote } = useRecruitingResults('chi-scegliamo')
  const role = activeRole()
  const notes = loadIvNotesRecord(role)
  const evaluation = loadIvEvalRecord(role)
  const podium = data.finalists.slice(0, 3)
  return (
    <ResultsPage
      crumbs={crumbs}
      number={step.number}
      title={step.title}
      question={step.sub}
      why="La scelta finale pesa più di tutte le altre, e una scelta sbagliata si scopre tardi. Mettere i finalisti fianco a fianco, con punti di forza e rischi, rende la decisione motivata."
      sections={[
        {
          title: 'Colloqui',
          content: (
            <div className="flex flex-col gap-3">
              {data.upcoming.length ? (
                <ul className="flex max-w-prose flex-col">
                  {data.upcoming.map((iv) => (
                    <li key={iv.id} className="flex justify-between gap-4 border-b border-border py-2 text-app-body last:border-b-0">
                      <span className="text-foreground">{iv.name}</span>
                      <span className="tabular-nums text-muted-foreground">{iv.date}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-app-body text-muted-foreground">Nessun colloquio in programma per questa posizione.</p>
              )}
              <TextLink link={{ label: 'Apri Prossimi colloqui', to: '/recruiting/colloqui' }} />
            </div>
          ),
        },
        {
          title: 'Valutazioni',
          content: (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ResultsTile title="Colloqui fatti" value={`${data.interviewsDone} su ${data.interviewsDone + data.interviewsPlanned}`} body={`${data.interviewsPlanned} da fare.`} link={{ label: 'Apri', to: '/recruiting/colloqui' }} />
              <ResultsTile title="Intervista strutturata" value={when(notes?.savedAt)} link={{ label: 'Apri', to: '/recruiting/valutatori/intervista' }} />
              <ResultsTile title="Valutazione candidato" value={when(evaluation?.savedAt)} link={{ label: 'Apri', to: '/recruiting/valutatori/valutazione' }} />
            </div>
          ),
        },
        {
          title: 'Candidati al podio',
          content: podium.length ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {podium.map((f, i) => (
                  <ResultsTile
                    key={f.id}
                    title={`${i + 1}º · ${f.score != null ? fmtScore10(f.score) : 'senza punteggio'}`}
                    value={f.name}
                    list={[
                      { id: 'forza', text: f.strength ? `Punto di forza: ${f.strength.name}, ${fmtDec(f.strength.gap)} punti sopra l’atteso` : 'Nessuna competenza sopra l’atteso.' },
                      { id: 'rischio', text: f.risk ? `Rischio: ${f.risk.name}, ${fmtDec(-f.risk.gap)} punti sotto l’atteso` : 'Nessuna competenza sotto l’atteso.' },
                    ]}
                  />
                ))}
              </div>
              <TextLink link={{ label: 'Apri Candidati al podio', to: '/recruiting/podio' }} />
            </div>
          ) : (
            <p className="text-app-body text-muted-foreground">Nessun finalista: lo diventano i candidati in colloquio.</p>
          ),
        },
      ]}
      impact={{ pct: data.finalistsPct, label: 'delle candidature arriva in finale', hint: 'I candidati in fase di approfondimento, sul totale delle candidature ricevute per questa posizione.' }}
      suggestion={{
        text: 'Confrontare i finalisti su punti di forza e rischi, poi chiudere con l’esito: Assunto, In riserva o Non selezionato. Per decidere puoi interpellare il Senior Advisor.',
        link: { label: 'Vai al Report finale di valutazione', to: '/recruiting/valutatori/report' },
      }}
      home={home}
      demoNote={demoNote}
    />
  )
}

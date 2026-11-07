import { Link } from 'react-router-dom'

import { ResultsPage } from '@/components/patterns/ResultsPage'
import { ResultsTile } from '@/components/patterns/ResultsTile'
import { Button } from '@/components/ui/button'
import { useRecruitingResults } from '@/modules/recruiting/results/use-recruiting-results'

// «Chi cerchiamo?» (Decisioni del 2026-11-06): 1 Profilatura candidato, 2 Competenze
// trasversali analitiche, 3 Candidature, 4 L'impatto. Sulla posizione attiva: CV ricevuti =
// Candidatura acquisita, in linea con il profilo = Profilo in valutazione. Gli euro senza
// sottotitolo: in Recruiting lo decide Roberto.
export default function ChiCerchiamoPage() {
  const { data, step, position, crumbs, home, demoNote } = useRecruitingResults('chi-cerchiamo')
  return (
    <ResultsPage
      crumbs={crumbs}
      number={step.number}
      title={step.title}
      question={step.sub}
      why="Una ricerca parte bene se il profilo è chiaro. Requisiti e competenze definiti prima di leggere i CV rendono i candidati confrontabili e tolgono tempo alla selezione."
      sections={[
        {
          title: 'Profilatura candidato',
          content: (
            <div className="flex max-w-prose flex-col items-start gap-3">
              <p className="text-app-body text-foreground">{`Il profilo di ${position}: requisiti, competenze professionali e annuncio.`}</p>
              <Button asChild>
                <Link to="/recruiting/job-profile">Job profile & description</Link>
              </Button>
            </div>
          ),
        },
        {
          title: 'Competenze trasversali analitiche',
          content: (
            <div className="max-w-md">
              <ResultsTile
                title="Competenze scelte"
                value={data.softSkillsChosen ? `${data.softSkillsChosen} su 35` : 'Nessuna ancora.'}
                body="Le competenze del profilo e, per ognuna, il valore atteso da 1 a 10."
                link={{ label: 'Apri Competenze trasversali', to: '/recruiting/competenze-trasversali' }}
              />
            </div>
          ),
        },
        {
          title: 'Candidature',
          content: (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ResultsTile title="CV ricevuti" value={data.received ? `${data.received} CV` : 'Nessuno oggi.'} link={{ label: 'Apri', to: '/recruiting/cv-elaborati' }} />
              <ResultsTile title="In linea con il profilo" value={data.inLine ? `${data.inLine} CV` : 'Nessuno oggi.'} link={{ label: 'Apri', to: '/recruiting/preselezionati' }} />
            </div>
          ),
        },
      ]}
      impact={{ pct: data.inLinePct, label: 'dei CV ricevuti è in linea con il profilo', hint: 'I CV preselezionati, sul totale dei CV ricevuti per questa posizione.' }}
      home={home}
      demoNote={demoNote}
    />
  )
}

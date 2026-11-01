import { CompletionRing } from '@/components/patterns/CompletionRing'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { useRecruitingResults } from '@/modules/recruiting/results/use-recruiting-results'

// «Chi cerchiamo?» — Definire il candidato ideale (CLAUDE.md, Fase 6, tabella
// "Chi cerchiamo?"). Sulla posizione attiva: CV ricevuti = Candidatura
// acquisita, in linea con il profilo = Profilo in valutazione (i CV
// preselezionati). Le competenze trasversali scelte sono quelle del Profilo
// candidato. Gli euro senza sottotitolo: in Recruiting lo decide Roberto.
export default function ChiCerchiamoPage() {
  const { data, step, position, crumbs, home, demoNote } = useRecruitingResults('chi-cerchiamo')
  const hint = 'I CV preselezionati, sul totale dei CV ricevuti per questa posizione.'
  return (
    <ResultsPage
      crumbs={crumbs}
      number={step.number}
      title={step.title}
      question={step.sub}
      why="Una ricerca parte bene se il profilo è chiaro. Requisiti e competenze definiti prima di leggere i CV rendono i candidati confrontabili e tolgono tempo alla selezione."
      situation={{
        text: `Per ${position} sono arrivati ${data.received} CV: ${data.inLine} ${data.inLine === 1 ? 'è' : 'sono'} in linea con il profilo.`,
        hint: { label: 'Che cosa misura l’anello', text: hint },
        chart: data.received ? <CompletionRing value={data.inLinePct ?? 0} label="CV in linea con il profilo" center="in linea" /> : undefined,
        chartEmpty: 'L’anello compare quando arrivano i primi CV per questa posizione.',
      }}
      issues={{
        items: [
          { title: 'CV ricevuti', value: data.received ? `${data.received} CV` : 'Nessuno oggi.', link: { label: 'Apri', to: '/recruiting/cv-elaborati' } },
          { title: 'In linea con il profilo', value: data.inLine ? `${data.inLine} CV` : 'Nessuno oggi.', link: { label: 'Apri', to: '/recruiting/preselezionati' } },
          {
            title: 'Competenze trasversali scelte',
            value: data.softSkillsChosen ? `${data.softSkillsChosen} ${data.softSkillsChosen === 1 ? 'competenza' : 'competenze'}` : 'Nessuna ancora: si scelgono nel Profilo candidato.',
            link: { label: 'Apri', to: '/recruiting/job-profile' },
          },
        ],
        opportunity: 'L’opportunità: con il profilo definito, tutti i CV si misurano con lo stesso metro.',
      }}
      impact={{ pct: data.inLinePct, label: 'dei CV ricevuti è in linea con il profilo', hint }}
      suggestion={{
        text: 'Completare il profilo con le competenze trasversali prima di leggere i CV. Per sceglierle puoi interpellare il Senior Advisor.',
        link: { label: 'Vai al Profilo candidato', to: '/recruiting/job-profile' },
      }}
      deepDives={[
        { label: 'CV & Esportazione', to: '/recruiting/cv' },
        { label: 'CV elaborati', to: '/recruiting/cv-elaborati' },
        { label: 'Avanzamento della selezione', to: '/recruiting/pipeline' },
        { label: 'CV preselezionati', to: '/recruiting/preselezionati' },
        { label: 'Classifica dopo il test', to: '/recruiting/classifica-test' },
      ]}
      home={home}
      demoNote={demoNote}
    />
  )
}

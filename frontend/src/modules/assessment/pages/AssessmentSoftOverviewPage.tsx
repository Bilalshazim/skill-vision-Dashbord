import { Award, Brain } from 'lucide-react'

import { NavCard } from '@/components/patterns/NavCard'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { getSoftClusters } from '@/modules/assessment/lib/legacy-utils'

// "Competenze Trasversali" (nav id:'soft-overview') — a framework/landing
// page introducing what the Soft Skill protocol measures for this
// organization, with entry points to the two pages that used to be the
// single combined "soft" screen: entering evaluations (id:'soft') and
// viewing results (id:'soft-risultati'). See AssessmentSoftPage.tsx.
export default function AssessmentSoftOverviewPage() {
  const { lang, state } = useAssessment()
  const clusters = getSoftClusters(lang)
  const employeeCount = state.employees.length

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-6">
        <h3 className="mb-2">
          {lang === 'it' ? 'Cosa sono le Competenze Trasversali' : 'What Cross-Functional Competencies are'}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {lang === 'it'
            ? "Le Competenze Trasversali (Soft Skill) descrivono COME una persona lavora — non cosa sa fare tecnicamente. Il protocollo Skill-Vision le misura su 5 cluster comportamentali (modello Big Five), confrontando il punteggio ottenuto con quello atteso per ruolo."
            : 'Cross-Functional Competencies (Soft Skills) describe HOW a person works — not their technical know-how. The Skill-Vision protocol measures them across 5 behavioral clusters (Big Five model), comparing the achieved score against the score expected for the role.'}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {clusters.map((c) => (
            <Badge key={c}>
              {c}
            </Badge>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <NavCard to="/assessment/soft" icon={Brain} title={lang === 'it' ? 'Area Valutazioni Trasversali' : 'Cross-Functional Evaluation Area'} description={lang === 'it' ? 'Inserisci una nuova valutazione per un dipendente' : 'Enter a new evaluation for an employee'} />
        <NavCard to="/assessment/soft-risultati" icon={Award} title={lang === 'it' ? 'Risultati Valutazioni Trasversali' : 'Cross-Functional Evaluation Results'} description={lang === 'it'
                  ? `Classifiche, gap e confronti su ${employeeCount} dipendenti`
                  : `Rankings, gaps and comparisons across ${employeeCount} employees`} />
      </div>
    </div>
  )
}

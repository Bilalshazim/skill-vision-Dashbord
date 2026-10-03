import { Award, Wrench } from 'lucide-react'

import { NavCard } from '@/components/patterns/NavCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { getApex5dDimensions } from '@/modules/assessment/lib/legacy-utils'

// "Competenze Professionali" (nav id:'hard-overview') — landing page for
// the Hard Skill / APEX 5D protocol, mirroring
// AssessmentSoftOverviewPage.tsx's role for the Soft Skill side.
export default function AssessmentHardOverviewPage() {
  const { lang, state } = useAssessment()
  const dimensions = getApex5dDimensions(lang)
  const employeeCount = state.employees.length

  return (
    // Introduzione e accessi affiancati: il testo è breve, non serve la riga
    // intera (CLAUDE.md, Fase 6). Le due card di accesso si impilano a destra.
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{lang === 'it' ? 'Cosa sono le Competenze Professionali' : 'What Professional Competencies are'}</CardTitle>
        </CardHeader>
        <p className="text-muted-foreground leading-relaxed">
          {lang === 'it'
            ? 'Le Competenze Professionali (Hard Skill) descrivono cosa una persona sa fare tecnicamente nel proprio ruolo. Il protocollo APEX 5D le misura su 5 dimensioni, con valutazione multi-source (responsabile, colleghi, autovalutazione).'
            : 'Professional Competencies (Hard Skills) describe what a person can technically do in their role. The APEX 5D protocol measures them across 5 dimensions, with multi-source evaluation (manager, peers, self-assessment).'}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {dimensions.map((d) => (
            <Badge key={d.code}  title={d.desc}>
              {d.code} · {d.name}
            </Badge>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <NavCard to="/assessment/hard" icon={Wrench} title={lang === 'it' ? 'Area Valutazioni Professionali' : 'Professional Evaluation Area'} description={lang === 'it' ? 'Inserisci una nuova valutazione per un dipendente' : 'Enter a new evaluation for an employee'} />
        <NavCard className="flex-1" to="/assessment/hard-risultati" icon={Award} title={lang === 'it' ? 'Risultati Valutazioni Professionali' : 'Professional Evaluation Results'} description={lang === 'it'
                  ? `Classifiche, gap e confronti su ${employeeCount} dipendenti`
                  : `Rankings, gaps and comparisons across ${employeeCount} employees`} />
      </div>
    </div>
  )
}

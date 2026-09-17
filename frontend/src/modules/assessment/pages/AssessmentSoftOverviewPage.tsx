import { useNavigate } from 'react-router-dom'

import { Icon } from '@/modules/assessment/components/Icon'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { getSoftClusters } from '@/modules/assessment/lib/legacy-utils'

// "Competenze Trasversali" (nav id:'soft-overview') — a framework/landing
// page introducing what the Soft Skill protocol measures for this
// organization, with entry points to the two pages that used to be the
// single combined "soft" screen: entering evaluations (id:'soft') and
// viewing results (id:'soft-risultati'). See AssessmentSoftPage.tsx.
export default function AssessmentSoftOverviewPage() {
  const { lang, state } = useAssessment()
  const navigate = useNavigate()
  const clusters = getSoftClusters(lang)
  const employeeCount = state.employees.length

  return (
    <div className="flex flex-col gap-5">
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginBottom: 8 }}>
          {lang === 'it' ? 'Cosa sono le Competenze Trasversali' : 'What Cross-Functional Competencies are'}
        </h3>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
          {lang === 'it'
            ? "Le Competenze Trasversali (Soft Skill) descrivono COME una persona lavora — non cosa sa fare tecnicamente. Il protocollo Skill-Vision le misura su 5 cluster comportamentali (modello Big Five), confrontando il punteggio ottenuto con quello atteso per ruolo."
            : 'Cross-Functional Competencies (Soft Skills) describe HOW a person works — not their technical know-how. The Skill-Vision protocol measures them across 5 behavioral clusters (Big Five model), comparing the achieved score against the score expected for the role.'}
        </p>
        <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
          {clusters.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card rc-entry-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/assessment/soft')}>
          <div className="flex items-center gap-3">
            <Icon name="soft" />
            <div>
              <h4>{lang === 'it' ? 'Area Valutazioni Trasversali' : 'Cross-Functional Evaluation Area'}</h4>
              <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
                {lang === 'it' ? 'Inserisci una nuova valutazione per un dipendente' : 'Enter a new evaluation for an employee'}
              </p>
            </div>
          </div>
        </div>
        <div className="card rc-entry-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/assessment/soft-risultati')}>
          <div className="flex items-center gap-3">
            <Icon name="award" />
            <div>
              <h4>{lang === 'it' ? 'Risultati Valutazioni Trasversali' : 'Cross-Functional Evaluation Results'}</h4>
              <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
                {lang === 'it'
                  ? `Classifiche, gap e confronti su ${employeeCount} dipendenti`
                  : `Rankings, gaps and comparisons across ${employeeCount} employees`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

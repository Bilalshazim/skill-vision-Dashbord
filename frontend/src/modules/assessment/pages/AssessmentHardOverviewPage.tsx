import { useNavigate } from 'react-router-dom'

import { Icon } from '@/modules/assessment/components/Icon'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { getApex5dDimensions } from '@/modules/assessment/lib/legacy-utils'

// "Competenze Professionali" (nav id:'hard-overview') — landing page for
// the Hard Skill / APEX 5D protocol, mirroring
// AssessmentSoftOverviewPage.tsx's role for the Soft Skill side.
export default function AssessmentHardOverviewPage() {
  const { lang, state } = useAssessment()
  const navigate = useNavigate()
  const dimensions = getApex5dDimensions(lang)
  const employeeCount = state.employees.length

  return (
    <div className="flex flex-col gap-5">
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginBottom: 8 }}>{lang === 'it' ? 'Cosa sono le Competenze Professionali' : 'What Professional Competencies are'}</h3>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
          {lang === 'it'
            ? 'Le Competenze Professionali (Hard Skill) descrivono COSA una persona sa fare tecnicamente nel proprio ruolo. Il protocollo APEX 5D le misura su 5 dimensioni, con valutazione multi-source (responsabile, colleghi, autovalutazione).'
            : 'Professional Competencies (Hard Skills) describe WHAT a person can technically do in their role. The APEX 5D protocol measures them across 5 dimensions, with multi-source evaluation (manager, peers, self-assessment).'}
        </p>
        <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
          {dimensions.map((d) => (
            <span key={d.code} className="chip" title={d.desc}>
              {d.code} · {d.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card rc-entry-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/assessment/hard')}>
          <div className="flex items-center gap-3">
            <Icon name="hard" />
            <div>
              <h4>{lang === 'it' ? 'Area Valutazioni Professionali' : 'Professional Evaluation Area'}</h4>
              <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
                {lang === 'it' ? 'Inserisci una nuova valutazione per un dipendente' : 'Enter a new evaluation for an employee'}
              </p>
            </div>
          </div>
        </div>
        <div className="card rc-entry-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/assessment/hard-risultati')}>
          <div className="flex items-center gap-3">
            <Icon name="award" />
            <div>
              <h4>{lang === 'it' ? 'Risultati Valutazioni Professionali' : 'Professional Evaluation Results'}</h4>
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

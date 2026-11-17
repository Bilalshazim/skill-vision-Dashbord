import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SoftEvalModal } from '@/modules/assessment/components/SoftEvalModal'
import { SoftSkillBigFivePicker } from '@/modules/assessment/components/SoftSkillBigFivePicker'
import { SurveyLinkModal } from '@/modules/assessment/components/SurveyLinkModal'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { getSoftClusters } from '@/modules/assessment/lib/legacy-utils'

// "Competenze Trasversali" (nav id:'soft-overview'), in Dashboarding: la somministrazione.
// Roberto, 2026-11-17: qui solo l'amministrazione, mai i risultati delle valutazioni (sono in
// Reporting → Risultati valutazioni trasversali). «Invia link test» e «Nuova valutazione» sono
// passati qui da Reporting; sotto, la scelta delle competenze per persona, con il suo «Salva».
export default function AssessmentSoftOverviewPage() {
  const { lang, ui, canEdit } = useAssessment()
  const clusters = getSoftClusters(lang)
  const [showEvalModal, setShowEvalModal] = useState(false)
  const [showSurveyLink, setShowSurveyLink] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      {/* Introduzione e somministrazione affiancate: il testo è breve, non serve la riga intera. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{lang === 'it' ? 'Cosa sono le Competenze Trasversali' : 'What Cross-Functional Competencies are'}</CardTitle>
          </CardHeader>
          <p className="text-muted-foreground leading-relaxed">
            {lang === 'it'
              ? "Le Competenze Trasversali (Soft Skill) descrivono come una persona lavora — non cosa sa fare tecnicamente. Il protocollo Skill-Vision le misura su 5 cluster comportamentali (modello Big Five), confrontando il punteggio ottenuto con quello atteso per ruolo."
              : 'Cross-Functional Competencies (Soft Skills) describe how a person works — not their technical know-how. The Skill-Vision protocol measures them across 5 behavioral clusters (Big Five model), comparing the achieved score against the score expected for the role.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {clusters.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{ui.softAdminTitle}</CardTitle>
              <CardDescription>{ui.softAdminDesc}</CardDescription>
            </div>
          </CardHeader>
          {canEdit ? (
            <div className="mt-auto flex flex-wrap gap-2">
              <Button variant="default" onClick={() => setShowSurveyLink(true)}>
                <FileText aria-hidden="true" />
                {ui.surveyInviaLinkTestBtn}
              </Button>
              <Button variant="outline" onClick={() => setShowEvalModal(true)}>
                <Plus aria-hidden="true" />
                {ui.newEvaluation}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
      {/* Foglio 5 parte C: la selezione per persona, in colonne per fattore Big Five. */}
      <SoftSkillBigFivePicker />

      {showEvalModal && <SoftEvalModal onClose={() => setShowEvalModal(false)} />}
      {showSurveyLink && <SurveyLinkModal onClose={() => setShowSurveyLink(false)} />}
    </div>
  )
}

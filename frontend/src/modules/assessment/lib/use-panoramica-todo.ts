import type { ActionItem } from '@/components/patterns/ActionList'
import { allEvaluators, evStatus, norm } from '@/modules/assessment/gestione5p/model'
import { use5pState } from '@/modules/assessment/gestione5p/use5pState'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { homeStats } from '@/modules/assessment/lib/calculations'

// «Da fare adesso»: usato dal Dettaglio della Panoramica e da Dove intervenire (Decisioni di Roberto
// del 2026-11-26), calcolato una volta sola.
/** I compiti aperti, dal più urgente: persone critiche, colloqui di restituzione, valutazioni da raccogliere, schede da inviare. */
export function usePanoramicaTodo(): ActionItem[] {
  const { state, lang, ui } = useAssessment()
  const { state: s5 } = use5pState()
  const hs = homeStats(state, lang)
  // Le schede 5P: un valutatore senza risposte e non ancora segnato come inviato ha la scheda da
  // inviare; uno segnato come inviato ma con risposte mancanti ha valutazioni da raccogliere (gli
  // stessi stati di "Invio schede"). Più le valutazioni esterne in attesa.
  const evaluators = allEvaluators(s5)
  const toSend = evaluators.filter((e) => !s5.sent[norm(e.name)] && evStatus(s5, e.name).rec === 0).length
  const toCollect =
    evaluators.filter((e) => {
      const st = evStatus(s5, e.name)
      return !!s5.sent[norm(e.name)] && st.rec < st.exp
    }).length + state.evalAssignments.filter((a) => a.status === 'pending').length
  const people = ui.homeQ4PeopleUnit
  return [
    { key: 'critical', label: ui.panoTodoCritical, description: ui.panoTodoCriticalDesc, count: hs.tiers.critica.length, unit: people, to: '/assessment/valore?fascia=critica', linkLabel: ui.panoOpen },
    { key: 'feedback', label: ui.panoTodoFeedback, description: ui.panoTodoFeedbackDesc, count: hs.feedbackDue, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
    { key: 'collect', label: ui.panoTodoCollect, description: ui.panoTodoCollectDesc, count: toCollect, unit: ui.panoEvaluatorsUnit, to: '/assessment/hard-overview?tab=racc', linkLabel: ui.panoOpen },
    { key: 'send', label: ui.panoTodoSend, description: ui.panoTodoSendDesc, count: toSend, unit: ui.panoEvaluatorsUnit, to: '/assessment/hard-overview?tab=invio', linkLabel: ui.panoOpen },
  ]
}


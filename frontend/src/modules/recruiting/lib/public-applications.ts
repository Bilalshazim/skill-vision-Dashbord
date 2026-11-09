import { cvApi, publicApplicationsApi } from '@/lib/api/endpoints'
import { activeRole } from '@/modules/recruiting/lib/active-role'
import { getCachedBackendLink } from '@/modules/recruiting/lib/backend-link'
import { buildSimulatedCvData, matchCandidateToProfile } from '@/modules/recruiting/lib/cv-upload'
import { addCandidateToPool, buildDefaultJobProfile, getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { readCandidates, readCvMatchingState, writeCandidates } from '@/modules/recruiting/lib/storage'
import type { Candidate } from '@/modules/recruiting/lib/types'

const NEUTRAL_BIG_FIVE = { Estroversione: 50, Coscienziosità: 50, Apertura: 50, Amicalità: 50, 'Stabilità emotiva': 50 }

// Le candidature dal link pubblico dell'annuncio (Decisioni del 2026-11-09, Parte C), portate
// sulla posizione attiva. Candidato, iscrizione alla campagna e CV sono già sul server dal
// momento dell'invio; qui nasce il candidato nei dati di Recruiting della posizione (con nome
// ed email veri), entra nel pool con l'analisi del CV — la stessa, simulata, di un CV caricato
// da CV & Esportazione — e la candidatura si segna come portata. Una candidatura già presente
// si segna e basta: rifarlo non crea doppioni. Torna quante ne sono entrate.
let running = false

export async function importPublicApplications(): Promise<number> {
  if (running) return 0
  const { opening } = getActiveOpening(readCvMatchingState())
  const link = opening ? getCachedBackendLink(opening.id) : undefined
  if (!opening || !link) return 0
  running = true
  try {
    const pending = await publicApplicationsApi.pending(link.campaignId)
    let added = 0
    for (const app of pending) {
      const candidates = readCandidates()
      if (!candidates.some((c) => c.id === app.candidateId)) {
        const parsedCv = { ...buildSimulatedCvData(), name: app.fullName, summary: 'Candidatura dal link dell’annuncio.' }
        const match = matchCandidateToProfile(parsedCv, opening.jobProfile || buildDefaultJobProfile(activeRole()))
        const candidate: Candidate = {
          id: app.candidateId,
          name: app.fullName,
          src: 'Candidatura dal link dell’annuncio · in attesa del test delle competenze trasversali',
          icv: match.scorePercent,
          testCompleted: false,
          email: app.email,
          scores: {},
          bf: NEUTRAL_BIG_FIVE,
          backendCandidateId: app.candidateId,
          backendCampaignId: link.campaignId,
          backendCampaignCandidateId: app.campaignCandidateId,
          backendCvId: app.cvId,
        }
        writeCandidates([...candidates, candidate])
        addCandidateToPool({ id: app.candidateId, name: app.fullName, cvData: parsedCv, match, source: 'cv-pipeline' })
        try {
          await cvApi.match(app.cvId, { campaignId: link.campaignId, matchScorePercent: match.scorePercent, softSkillScores: {}, bigFive: NEUTRAL_BIG_FIVE })
        } catch (err) {
          // Il candidato c'è ed è collegato: il match sul server si ricalcola alla prossima analisi.
          console.error('[importPublicApplications] match sul server non riuscito:', err)
        }
        added++
      }
      await publicApplicationsApi.imported(app.id)
    }
    return added
  } catch (err) {
    console.error('[importPublicApplications] lettura delle candidature non riuscita:', err)
    return 0
  } finally {
    running = false
  }
}

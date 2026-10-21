import { recruitingStore, serverHasDocument, whenSaved } from '@/modules/recruiting/lib/recruiting-store'

// L'unico punto di Recruiting che tocca l'archivio del browser, e solo per
// svuotarlo (PROGETTO-TUTTO-SUL-SERVER.md, Parte 9): "Importa dati del
// browser" legge quello che le versioni precedenti vi avevano salvato, lo
// porta sul server e, a import riuscito, lo cancella. Un'area che sul server
// c'è già non si sovrascrive (è il lavoro di un collega): si salta, e la
// conferma lo dice prima. Si toglie quando tutti hanno importato.
export const RECRUITING_BROWSER_KEYS = [
  'apex5d_cv_matching_state',
  'skillvision_candidates_data',
  'apex5d_jd_templates',
  'apex5d_job_postings_summaries',
  'apex5d_salary_benefits',
  'apex5d_survey_state',
  'apex5d_interview_protocol',
  'sv_recruiting_skill_flags_v1',
  'apex5d_backend_link_map',
] as const

export const RECRUITING_AREA_LABEL: Record<(typeof RECRUITING_BROWSER_KEYS)[number], string> = {
  apex5d_cv_matching_state: 'società, posizioni e pipeline',
  skillvision_candidates_data: 'candidati',
  apex5d_jd_templates: 'modelli di profilo',
  apex5d_job_postings_summaries: 'sintesi degli annunci',
  apex5d_salary_benefits: 'RAL e benefit',
  apex5d_survey_state: 'link dei questionari',
  apex5d_interview_protocol: 'protocollo d’intervista',
  sv_recruiting_skill_flags_v1: 'pesi delle competenze',
  apex5d_backend_link_map: 'collegamenti con il server',
}

type Key = (typeof RECRUITING_BROWSER_KEYS)[number]

function read(key: string): string | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    JSON.parse(raw)
    return raw
  } catch {
    return null
  }
}

/** Cosa c'è nel browser: le aree che entrano e quelle che sul server ci sono già. */
export function browserRecruitingData(): { toImport: Key[]; skipped: Key[] } | null {
  const present = RECRUITING_BROWSER_KEYS.filter((k) => read(k) !== null)
  if (!present.length) return null
  return { toImport: present.filter((k) => !serverHasDocument(k)), skipped: present.filter((k) => serverHasDocument(k)) }
}

/** Porta sul server le aree nuove, aspetta la conferma, poi svuota il browser. */
export async function importBrowserRecruiting(): Promise<number> {
  const found = browserRecruitingData()
  if (!found) return 0
  for (const k of found.toImport) recruitingStore.setItem(k, read(k)!)
  await whenSaved()
  for (const k of RECRUITING_BROWSER_KEYS) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* niente da togliere */
    }
  }
  return found.toImport.length
}

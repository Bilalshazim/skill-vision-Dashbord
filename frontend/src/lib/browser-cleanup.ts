// Le versioni precedenti tenevano nel browser alcune preferenze dell'interfaccia
// (tema, lingua, viste delle card, società scelta, scheda aperta). Ora stanno
// sul server (lib/preferences.ts): all'avvio queste chiavi vecchie si
// cancellano, perché nel browser non resti niente (PROGETTO-TUTTO-SUL-SERVER.md).
// Solo cancellazioni, mai scritture. I dati veri (Assessment, Recruiting) non
// si toccano qui: li porta sul server l'import, che poi li cancella.
const OBSOLETE = ['sv_theme', 'sv_language', 'sv-react-theme', 'sv_assessment_company', 'sv5p_state_v1_tab']
const OBSOLETE_PREFIX = /^sv-((assessment|recruiting)-.+-view|eval-seen-.+)$/

export function removeObsoleteBrowserPreferences(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (OBSOLETE.includes(key) || OBSOLETE_PREFIX.test(key)) localStorage.removeItem(key)
    }
  } catch {
    /* archivio non disponibile: non c'è niente da togliere */
  }
}

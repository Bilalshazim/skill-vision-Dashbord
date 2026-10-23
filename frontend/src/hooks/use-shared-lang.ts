export type Lang = 'it' | 'en'

// La lingua dell'interfaccia: solo italiano per ora (CLAUDE.md cap. 7). Lo
// switch IT/EN è tolto dal guscio e dalle impostazioni; i dizionari inglesi di
// Assessment restano, per quando si tradurrà tutta la piattaforma. La vecchia
// preferenza `lang` sul server non si legge più: chi aveva scelto l'inglese
// riparte in italiano.
export function useSharedLang(): { lang: Lang } {
  return { lang: 'it' }
}

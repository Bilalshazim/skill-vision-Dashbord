// Le tre fasce di idoneità, con i nomi confermati dal cliente (CLAUDE.md
// cap. 7, "Il colore di severità"): una fascia è uno stato, quindi usa i
// token di stato, e il colore accompagna sempre la parola.
export type Idoneita = 'idoneo' | 'da-valutare' | 'non-idoneo'

export const IDONEITA: Record<Idoneita, { label: string; tone: 'success' | 'warning' | 'destructive' }> = {
  idoneo: { label: 'Idoneo', tone: 'success' },
  'da-valutare': { label: 'Da valutare', tone: 'warning' },
  'non-idoneo': { label: 'Non idoneo', tone: 'destructive' },
}

// Dal tono di severità che il codice già calcola (verde / ambra / rosso)
// alla fascia con il suo nome.
export function idoneitaFromTone(tone: 'success' | 'warning' | 'destructive'): Idoneita {
  return tone === 'success' ? 'idoneo' : tone === 'warning' ? 'da-valutare' : 'non-idoneo'
}

import type { Idoneita } from '@/lib/idoneita'
import type { Fascia } from '@/modules/recruiting/lib/scoring'

// Le quattro fasce della classifica, nello stesso ordine dei `buckets` di
// use-recruiting-home-data.ts e con le stesse soglie di fasce() (scoring.ts):
// ognuna con la sua fascia di idoneità ("Idoneo", "Da valutare", "Non
// idoneo") e la riga che dice cosa significa, con la soglia (CLAUDE.md,
// Fase 5, "Una fascia dice chi c'è dentro"). L'indice AHI si legge su 10, come
// in classifica e nel Metodo (nel codice le soglie restano 85 / 70 / 60 su
// 100). `key` è quella di fasce(), che filtra la classifica.
export const QUALITY_BANDS: { key: Fascia['key']; idoneita: Idoneita; name: string; threshold: string }[] = [
  { key: 'excellent', idoneita: 'idoneo', name: 'Assumibile subito', threshold: 'Indice AHI da 8,5 a 10 su 10' },
  { key: 'developable', idoneita: 'da-valutare', name: 'Con piano di sviluppo', threshold: 'Indice AHI da 7,0 a meno di 8,5 su 10' },
  { key: 'gap', idoneita: 'da-valutare', name: 'Gap strutturali', threshold: 'Indice AHI da 6,0 a meno di 7,0 su 10' },
  { key: 'not-recommended', idoneita: 'non-idoneo', name: 'Sconsigliato', threshold: 'Indice AHI sotto 6,0 su 10, o una competenza essenziale sotto la soglia' },
]

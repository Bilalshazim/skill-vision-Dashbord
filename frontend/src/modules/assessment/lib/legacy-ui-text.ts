// I testi dell'interfaccia di Assessment, IT ed EN (CLAUDE.md cap. 7, «Lingua»:
// l'interfaccia parte in italiano, la struttura bilingue resta). Una lingua per
// file in ui-text/; qui si esportano e si controlla che abbiano le stesse chiavi.
import { UI_EN } from '@/modules/assessment/lib/ui-text/en'
import { UI_IT } from '@/modules/assessment/lib/ui-text/it'

// Una chiave aggiunta in una lingua sola non compila.
type SameKeys<A, B> = [Exclude<keyof A, keyof B>, Exclude<keyof B, keyof A>] extends [never, never] ? true : never
const sameKeys: SameKeys<typeof UI_EN, typeof UI_IT> = true
void sameKeys

export { UI_EN, UI_IT }

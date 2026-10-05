import { Globe } from 'lucide-react'

import { Hint } from '@/components/patterns/Hint'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type Lang, useSharedLang } from '@/hooks/use-shared-lang'

// Il selettore della lingua (IT / EN) della barra superiore. Scrive la chiave
// condivisa `sv_language`, che Assessment legge per i suoi testi; il resto
// dell'interfaccia resta in italiano finché non sarà tradotto.
export function LanguageSwitch() {
  const { lang, setLang } = useSharedLang()
  return (
    <Hint label="Lingua">
      <ToggleGroup type="single" value={lang} onValueChange={(v) => v && setLang(v as Lang)} aria-label="Lingua" className="p-0.5">
        <Globe className="mx-1 size-4 text-muted-foreground" aria-hidden="true" />
        <ToggleGroupItem value="it" aria-label="Italiano">
          IT
        </ToggleGroupItem>
        <ToggleGroupItem value="en" aria-label="English">
          EN
        </ToggleGroupItem>
      </ToggleGroup>
    </Hint>
  )
}

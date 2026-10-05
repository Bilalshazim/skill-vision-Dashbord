import { Moon, Sun } from 'lucide-react'

import { Field } from '@/components/patterns/Field'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type Lang, useSharedLang } from '@/hooks/use-shared-lang'
import { type Theme, useTheme } from '@/hooks/use-theme'

// Le impostazioni del guscio: tema e lingua, i due valori condivisi fra i
// moduli (`sv_theme`, `sv_language`). Si applicano subito, senza "Salva".
// Le impostazioni proprie di Assessment restano nel modulo.
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme()
  const { lang, setLang } = useSharedLang()
  return (
    <ModalDialog
      title="Impostazioni"
      sub="Si applicano subito a tutta la piattaforma."
      onClose={onClose}
      footer={
        <Button onClick={onClose}>Chiudi</Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Tema">
          <ToggleGroup type="single" value={theme} onValueChange={(v) => v && setTheme(v as Theme)} aria-label="Tema">
            <ToggleGroupItem value="light">
              <Sun /> Chiaro
            </ToggleGroupItem>
            <ToggleGroupItem value="dark">
              <Moon /> Scuro
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <Field label="Lingua">
          <ToggleGroup type="single" value={lang} onValueChange={(v) => v && setLang(v as Lang)} aria-label="Lingua">
            <ToggleGroupItem value="it">Italiano</ToggleGroupItem>
            <ToggleGroupItem value="en">English</ToggleGroupItem>
          </ToggleGroup>
        </Field>
      </div>
    </ModalDialog>
  )
}

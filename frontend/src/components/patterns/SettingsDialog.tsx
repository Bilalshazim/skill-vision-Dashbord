import { Moon, Sun } from 'lucide-react'

import { Field } from '@/components/patterns/Field'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type Theme, useTheme } from '@/hooks/use-theme'

// Le impostazioni del guscio: il tema, condiviso fra i moduli. Si applica
// subito, senza "Salva". La lingua non si sceglie: solo italiano per ora
// (CLAUDE.md cap. 7).
// Le impostazioni proprie di Assessment restano nel modulo.
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme()
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
      </div>
    </ModalDialog>
  )
}

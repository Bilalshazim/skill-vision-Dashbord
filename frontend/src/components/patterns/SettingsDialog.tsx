import { Moon, Sun } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type Theme, useTheme } from '@/hooks/use-theme'

// Le impostazioni del guscio: il tema, condiviso fra i moduli. Si applica
// subito, senza "Salva". La lingua non si sceglie: solo italiano per ora
// (CLAUDE.md cap. 7).
// `users`: la scheda Utenti, che la Topbar passa solo allo staff di
// piattaforma. Il pattern non va a prendere dati: riceve il contenuto pronto.
// `usersDirty` fa chiedere conferma prima di chiudere con un modulo a metà.
// Le impostazioni proprie di Assessment restano nel modulo.
// `packages`: la scheda Pacchetti, anche questa solo per lo staff.
export function SettingsDialog({ onClose, users, usersDirty = false, packages }: { onClose: () => void; users?: ReactNode; usersDirty?: boolean; packages?: ReactNode }) {
  const [tab, setTab] = useState<'look' | 'users' | 'packages'>('look')
  const look = <ThemeField />
  return (
    <ModalDialog
      title="Impostazioni"
      sub={tab === 'users' ? 'Utenti della piattaforma: accessi, ruoli e password.' : tab === 'packages' ? 'Il pacchetto di Assessment acquistato da ogni società.' : 'Si applicano subito a tutta la piattaforma.'}
      size={users ? 'xl' : undefined}
      dirty={tab === 'users' && usersDirty}
      onClose={onClose}
      // Con la scheda Utenti il primario è «Nuovo utente»: Chiudi resta outline.
      footer={
        <Button variant={users ? 'outline' : 'default'} onClick={onClose}>
          Chiudi
        </Button>
      }
    >
      {users ? (
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="look">Aspetto</TabsTrigger>
            <TabsTrigger value="users">Utenti</TabsTrigger>
            {packages ? <TabsTrigger value="packages">Pacchetti</TabsTrigger> : null}
          </TabsList>
          <TabsContent value="look" className="pt-4">
            {look}
          </TabsContent>
          <TabsContent value="users" className="pt-4">
            {users}
          </TabsContent>
          {packages ? (
            <TabsContent value="packages" className="pt-4">
              {packages}
            </TabsContent>
          ) : null}
        </Tabs>
      ) : (
        look
      )}
    </ModalDialog>
  )
}

function ThemeField() {
  const { theme, setTheme } = useTheme()
  return (
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
  )
}

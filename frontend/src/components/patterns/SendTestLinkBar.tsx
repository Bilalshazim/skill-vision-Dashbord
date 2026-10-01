import { Send } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Button } from '@/components/ui/button'

// L'invio del link al test, uguale nei due moduli (CLAUDE.md cap. 7, deciso
// dal cliente): l'HR spunta i nominativi nella colonna di selezione (del
// DataTable) e invia solo a quelli. Qui il conteggio, l'azione "Invia link
// test (N)" — spenta senza selezione, con il perché scritto accanto — e la
// conferma con i nomi. A chi non è spuntato non parte niente. L'invio vero
// lo fa chi usa il pattern (`onSend`): in Recruiting il backend, in
// Assessment il meccanismo di oggi finché non c'è il progetto "Assessment
// sul server".
export function SendTestLinkBar({ selectedNames, onSend, onClear, sending = false }: { selectedNames: string[]; onSend: () => void; onClear?: () => void; sending?: boolean }) {
  const [confirming, setConfirming] = useState(false)
  const n = selectedNames.length
  const shown = selectedNames.slice(0, 5).join(', ') + (n > 5 ? ` e altri ${n - 5}` : '')
  return (
    <div data-slot="send-test-link-bar" className="flex flex-wrap items-center gap-3">
      <Button onClick={() => setConfirming(true)} disabled={n === 0 || sending}>
        <Send />
        {`Invia link test (${n})`}
      </Button>
      <p className="text-app-small text-muted-foreground" aria-live="polite">
        {n === 0 ? 'Spunta i nominativi a cui inviare il link.' : `${n} ${n === 1 ? 'nominativo selezionato' : 'nominativi selezionati'}`}
      </p>
      {n > 0 && onClear ? (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Deseleziona tutti
        </Button>
      ) : null}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Inviare il link del test a ${n} ${n === 1 ? 'persona' : 'persone'}?`}
        description={`Il link parte solo ai nominativi selezionati: ${shown}.`}
        confirmLabel="Invia link"
        onConfirm={onSend}
      />
    </div>
  )
}

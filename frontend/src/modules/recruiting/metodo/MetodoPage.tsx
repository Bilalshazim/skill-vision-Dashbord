import { Lock, Mail } from 'lucide-react'

import { EmptyState } from '@/components/patterns/EmptyState'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { isDemoMode } from '@/lib/demo-mode'

// Indirizzo a cui arrivano le richieste di accesso (lo stesso delle email ai
// candidati). Non esiste ancora un flusso di richiesta nell'applicazione: il
// bottone apre un'email già compilata.
const ACCESS_REQUEST_MAIL = 'mailto:info@skill-vision.it?subject=' + encodeURIComponent('Richiesta di accesso alla pagina Metodo')

// "Metodo" (Fase "Foglio 2", Roberto Feliciani), secondo l'ambiente:
//  - versione DEMO (`isDemoMode()`): la pagina resta vuota, senza contenuti;
//  - dashboard CLIENTE: un messaggio e il pulsante «Chiedere l'accesso».
// Il contenuto di prima (le formule della classifica) è in MetodoContent.tsx,
// non collegato: quando ci sarà un modo di concedere l'accesso, si mostra da lì.
export default function MetodoPage() {
  if (isDemoMode()) return <div aria-hidden="true" className="min-h-[50vh]" />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Metodo" />
      <Card>
        <EmptyState
          icon={Lock}
          title="Contenuto ad accesso riservato"
          description="Il metodo di calcolo della classifica è disponibile su richiesta. Scrivici e ti abilitiamo l'accesso."
          action={
            <Button asChild>
              <a href={ACCESS_REQUEST_MAIL}>
                <Mail aria-hidden="true" />
                Chiedere l&apos;accesso
              </a>
            </Button>
          }
        />
      </Card>
    </div>
  )
}

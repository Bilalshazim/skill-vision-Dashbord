import { Lock, Mail } from 'lucide-react'

import { EmptyState } from '@/components/patterns/EmptyState'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { isDemoMode } from '@/lib/demo-mode'
import { isPlatformStaff } from '@/lib/staff'
import { MetodoContent } from '@/modules/recruiting/metodo/MetodoContent'

// Indirizzo a cui arrivano le richieste di accesso (lo stesso delle email ai
// candidati). Non esiste ancora un flusso di richiesta nell'applicazione: il
// bottone apre un'email già compilata.
const ACCESS_REQUEST_MAIL = 'mailto:info@skill-vision.it?subject=' + encodeURIComponent('Richiesta di accesso alla pagina Metodo')

// "Metodo" (Fase "Foglio 2", Roberto Feliciani), secondo l'ambiente:
//  - versione DEMO (`isDemoMode()`): la pagina resta vuota, senza contenuti;
//  - dashboard CLIENTE: un messaggio e il pulsante «Chiedere l'accesso».
// Il contenuto (le formule della classifica) è in MetodoContent.tsx e lo vede
// solo lo staff (lib/staff.ts); per i clienti serve ancora una concessione.
export default function MetodoPage() {
  // Lo staff della piattaforma vede il metodo anche in demo; clienti e demo no.
  if (isPlatformStaff()) return <MetodoContent />

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

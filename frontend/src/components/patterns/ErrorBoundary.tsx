import { RotateCw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Button } from '@/components/ui/button'

// Quando una pagina si rompe mentre si disegna, l'applicazione non diventa
// bianca: al posto della pagina compare l'avviso, e il guscio (barra
// laterale, intestazione) resta in piedi per andare altrove. Copre anche il
// caso più frequente in produzione: dopo un deploy, un pezzo di pagina della
// versione precedente non esiste più e il caricamento fallisce; ricaricare
// prende la versione nuova. Gli errori dei clic e delle chiamate al server
// non passano di qui: li gestisce chi li fa, con un avviso o un toast.

/** L'aspetto dell'errore di pagina, anche per il catalogo. */
export function PageErrorFallback({ onReload }: { onReload: () => void }) {
  return (
    <div className="flex max-w-2xl flex-col items-start gap-4">
      <InlineAlert tone="destructive" title="Questa pagina non si è aperta">
        Si è verificato un errore imprevisto. Quello che era già salvato non è stato toccato. Ricarica la pagina; se l&apos;errore si ripete, segnala quale
        pagina stavi aprendo.
      </InlineAlert>
      <Button variant="outline" onClick={onReload}>
        <RotateCw aria-hidden="true" />
        Ricarica la pagina
      </Button>
    </div>
  )
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    return this.state.failed ? <PageErrorFallback onReload={() => window.location.reload()} /> : this.props.children
  }
}

// Si azzera a ogni cambio di pagina: un errore su una pagina non resta
// appeso quando si va su un'altra.
export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return <Boundary key={pathname}>{children}</Boundary>
}

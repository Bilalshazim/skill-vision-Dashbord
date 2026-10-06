import { Logo } from '@/layouts/Logo'

// L'intestazione di marca dei tre documenti dell'Area Valutatore (Intervista
// strutturata, Valutazione candidato, Report finale di valutazione): il logo
// Skill Vision sopra il titolo, con un filetto, come nei modelli del cliente.
export function SheetBrand() {
  return (
    <div className="mb-1 flex items-center border-b border-border pb-3">
      <Logo />
    </div>
  )
}

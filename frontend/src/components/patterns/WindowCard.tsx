import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

// Una finestra delle home (CLAUDE.md, Fase 6, "Le due home", approvato da
// Roberto il 2026-10-29): numero, titolo, sottotitolo e, sotto, la domanda
// (Assessment) oppure il contenuto e i verbi del passo (Profilo della ricerca
// di Recruiting). Tutta la card è un link alla pagina dei risultati. Nessun
// numero di dati, nessun grafico, nessuna icona; testo a sinistra, superficie
// neutra, bordo sottile, titolo minuscolo.
export function WindowCard({
  to,
  number,
  title,
  subtitle,
  question,
  content,
  verbs,
  className,
}: {
  to: string
  number: string
  title: string
  subtitle: string
  question?: string
  content?: string
  verbs?: string
  /** Solo per il posizionamento nella griglia. */
  className?: string
}) {
  return (
    <Link
      to={to}
      data-slot="window-card"
      className={cn(
        'flex h-full min-w-0 flex-col gap-2 rounded-lg border border-border bg-card p-6 text-left text-card-foreground outline-none transition-colors hover:border-border-strong hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      <span className="label-mono text-muted-foreground">{number}</span>
      <span className="text-app-section text-foreground">{title}</span>
      <span className="text-app-small text-muted-foreground">{subtitle}</span>
      {question ? <span className="mt-4 text-app-body text-foreground">{question}</span> : null}
      {content ? <span className="mt-4 text-app-body text-foreground">{content}</span> : null}
      {verbs ? <span className="mt-auto pt-4 text-app-small text-muted-foreground">{verbs}</span> : null}
    </Link>
  )
}

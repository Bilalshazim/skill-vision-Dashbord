import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

// Una finestra delle home (CLAUDE.md, Fase 6, "Le due home", approvato da
// Roberto il 2026-10-29; tavole «Assessment · 1 Home» e «Recruiting · 1 Home ·
// Profilo della ricerca»): numero, titolo grande (scala del sito: è una
// pagina di presentazione), sottotitolo e, in fondo, la domanda (Assessment)
// oppure il contenuto e i verbi del passo (Recruiting), con la freccia a
// destra. Tutta la card è un link alla pagina dei risultati. Nessun numero di
// dati, nessun grafico, nessuna icona oltre la freccia; testo a sinistra,
// superficie tenue, bordo sottile, titolo minuscolo.
export function WindowCard({
  to,
  number,
  title,
  subtitle,
  question,
  content,
  verbs,
  theme,
  className,
}: {
  to: string
  number: string
  title: string
  subtitle: string
  question?: string
  content?: string
  verbs?: string
  /** La tavola «Home · senza dati»: l'etichetta con numero e tema e il numero grande in filigrana; la freccia non si muove. */
  theme?: string
  /** Solo per il posizionamento nella griglia. */
  className?: string
}) {
  const footer = question ?? verbs
  return (
    <Link
      to={to}
      data-slot="window-card"
      className={cn(
        'group relative flex h-full min-h-56 min-w-0 flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card p-6 text-left text-card-foreground outline-none transition-colors hover:border-border-strong hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      {theme ? (
        <>
          <span aria-hidden="true" className="pointer-events-none absolute top-2 right-4 text-watermark font-semibold text-border select-none">
            {number}
          </span>
          <span className="label-mono relative self-start rounded-md border border-border px-2 py-1 text-muted-foreground">
            {number} · {theme}
          </span>
        </>
      ) : (
        <span className="label-mono text-muted-foreground">{number}</span>
      )}
      <span className={cn('relative text-site-h3 text-foreground md:text-site-h2', theme && 'mt-auto')}>{title}</span>
      <span className="relative text-app-body text-muted-foreground">{subtitle}</span>
      {content ? <span className="mt-4 text-app-small text-foreground">{content}</span> : null}
      <span className={cn('relative flex items-end justify-between gap-4', theme ? 'border-t border-border pt-3' : verbs ? 'mt-auto border-t border-border pt-3' : 'mt-auto pt-6')}>
        {footer ? <span className={cn('max-w-prose', question ? 'text-app-subtitle font-semibold text-foreground' : 'text-app-small font-medium text-foreground')}>{footer}</span> : <span />}
        <ArrowRight className={cn('size-4 shrink-0 text-foreground', !theme && 'transition-transform group-hover:translate-x-0.5')} aria-hidden="true" />
      </span>
    </Link>
  )
}

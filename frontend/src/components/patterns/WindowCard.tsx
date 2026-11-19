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
  accentHover,
  size = 'default',
  className,
}: {
  to: string
  number: string
  title: string
  subtitle: string
  question?: string
  content?: string
  verbs?: string
  /** La tavola «Home · senza dati»: l'etichetta con numero e tema; la freccia non si muove. */
  theme?: string
  /**
   * Home di Assessment (Roberto, 2026-11-17): al passaggio del mouse (e con il focus da tastiera)
   * bordo e titolo in lime. Il lime come testo è `chart-highlight-line`: accent-600 in chiaro,
   * accent-400 in scuro (regola 6: mai lime chiaro come testo su fondo chiaro).
   */
  accentHover?: boolean
  /** `lg`: le tre finestre della home di Recruiting, più grandi (Roberto, 2026-11-19). */
  size?: 'default' | 'lg'
  /** Solo per il posizionamento nella griglia. */
  className?: string
}) {
  const footer = question ?? verbs
  return (
    <Link
      to={to}
      data-slot="window-card"
      className={cn(
        'group flex h-full min-w-0 flex-col gap-2 rounded-lg border border-border bg-card text-left text-card-foreground outline-none transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        size === 'lg' ? 'min-h-80 gap-3 p-6 lg:min-h-96 lg:p-8' : 'min-h-56 p-6',
        accentHover ? 'hover:border-chart-highlight-line focus-visible:border-chart-highlight-line' : 'hover:border-border-strong',
        className,
      )}
    >
      {theme ? (
        <span className="label-mono self-start rounded-md border border-border px-2 py-1 text-muted-foreground">
          {number} · {theme}
        </span>
      ) : (
        <span className="label-mono text-muted-foreground">{number}</span>
      )}
      <span className={cn('text-foreground', size === 'lg' ? 'text-site-h2 md:text-site-h1' : 'text-site-h3 md:text-site-h2', theme && 'mt-auto', accentHover && 'transition-colors group-hover:text-chart-highlight-line group-focus-visible:text-chart-highlight-line')}>{title}</span>
      <span className="text-app-body text-muted-foreground">{subtitle}</span>
      {content ? <span className="mt-4 text-app-small text-foreground">{content}</span> : null}
      <span className={cn('flex items-end justify-between gap-4', theme ? 'border-t border-border pt-3' : verbs ? 'mt-auto border-t border-border pt-3' : 'mt-auto pt-6')}>
        {footer ? <span className={cn('max-w-prose', question ? 'text-app-subtitle font-semibold text-foreground' : 'text-app-small font-medium text-foreground')}>{footer}</span> : <span />}
        <ArrowRight className={cn('size-4 shrink-0 text-foreground', !theme && 'transition-transform group-hover:translate-x-0.5')} aria-hidden="true" />
      </span>
    </Link>
  )
}

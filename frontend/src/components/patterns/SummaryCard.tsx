import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Una delle quattro domande nella Sintesi della Panoramica (CLAUDE.md, Fase 6,
// "le quattro domande con il loro dato"): numero e titolo in stile label, la
// domanda, il dato principale grande con la sua unità e una riga sotto, un
// contenuto piccolo (grafico di sintesi, elenco) e in fondo il link alla
// pagina che lo sviluppa. Il numero si scrive una volta, con un'unità sola.
export function SummaryCard({
  number,
  title,
  question,
  value,
  unit,
  note,
  children,
  link,
  className,
}: {
  number: string
  title: string
  question: string
  value?: ReactNode
  unit?: ReactNode
  note?: ReactNode
  children?: ReactNode
  link: { label: string; to: string }
  /** Solo per il posizionamento nella griglia. */
  className?: string
}) {
  return (
    <Card data-slot="summary-card" className={cn('h-full gap-3', className)}>
      <p className="label-mono text-muted-foreground">
        {number} · {title}
      </p>
      <p className="text-app-subtitle font-semibold text-foreground">{question}</p>
      {value != null ? (
        <p className="flex items-baseline gap-1">
          <span className="text-site-h3 tabular-nums text-foreground">{value}</span>
          {unit ? <span className="text-app-small text-muted-foreground">{unit}</span> : null}
        </p>
      ) : null}
      {note ? <p className="text-app-small text-muted-foreground">{note}</p> : null}
      {children}
      <Link
        to={link.to}
        className="mt-auto inline-flex items-center gap-1 self-start rounded-xs pt-2 text-app-small font-medium text-foreground underline underline-offset-4 hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {link.label} <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </Card>
  )
}

import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// Una card che porta a un'altra schermata: tutta la card è un link (tastiera
// e focus compresi), con icona, titolo, descrizione e la freccia. Hover sul
// bordo, nessuna ombra.
export function NavCard({ to, icon: Icon, title, description }: { to: string; icon?: LucideIcon; title: ReactNode; description?: ReactNode }) {
  return (
    <Link
      to={to}
      data-slot="nav-card"
      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground outline-none transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {Icon ? <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-app-subtitle">{title}</span>
        {description ? <span className="mt-1 block text-app-small text-muted-foreground">{description}</span> : null}
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

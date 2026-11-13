import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ResultsLink = { label: string; to: string }

/** La cifra in euro, già calcolata e scritta: il pattern non conosce il motore. `value` assente: il segnaposto, con il motivo. */
export type ResultsEuro = {
  value: string | null
  pending?: string
  tags?: string[]
  note?: string
  detail?: string
  scenarios?: { label: string; value: string; main?: boolean }[]
  footer?: string
  link?: ResultsLink
  how?: { title: string; intro: string; rows: { label: string; value: string }[] }
}

// La cifra dell'impatto, nelle pagine dei risultati: l'importo o il segnaposto,
// i suoi segni, gli scenari e «Come è calcolato».
export function EuroFigure({ euro, note, className }: { euro?: ResultsEuro; note?: string; className?: string }) {
  const [howOpen, setHowOpen] = useState(false)
  const text = euro?.note ?? note
  return (
    <div data-slot="euro-figure" className={cn('flex min-w-0 flex-col items-start gap-2', className)}>
      <span className={cn('text-site-h2 tabular-nums md:text-site-h1', euro?.value ? 'text-foreground' : 'text-muted-foreground')}>{euro?.value ?? '€ [—]'}</span>
      <span className="flex flex-wrap gap-1">{euro?.value ? (euro.tags ?? []).map((t) => <Badge key={t}>{t}</Badge>) : <Badge>{euro?.pending ?? 'In attesa della formula'}</Badge>}</span>
      {text ? <p className="text-app-body text-muted-foreground">{text}</p> : null}
      {euro?.detail ? <p className="text-app-small text-muted-foreground">{euro.detail}</p> : null}
      {euro?.scenarios ? (
        // I tre scenari in evidenza, ognuno nel suo riquadro; quello base (l'importo grande, il
        // risultato del motore ROI) con il bordo di 2px degli stati attivi e la cifra più grande
        // (Roberto, 2026-11-16: «le cifre le evidenzierei meglio per tutti e tre i valori»).
        <dl className="grid w-full grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
          {euro.scenarios.map((s) => (
            <div key={s.label} className={cn('flex flex-col gap-1 rounded-sm p-3', s.main ? 'border-2 border-ring' : 'border border-border')}>
              <dt className="label-mono text-muted-foreground">{s.label}</dt>
              <dd className={cn('tabular-nums text-foreground', s.main ? 'text-app-title' : 'text-app-subtitle')}>{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {euro?.footer ? <p className="text-app-small text-muted-foreground">{euro.footer}</p> : null}
      {euro?.link ? <TextLink link={euro.link} /> : null}
      {euro?.how ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => setHowOpen(true)}>
          {euro.how.title}
        </Button>
      ) : null}
      {howOpen && euro?.how ? (
        <ModalDialog title={euro.how.title} sub={euro.how.intro} onClose={() => setHowOpen(false)}>
          <dl className="flex flex-col">
            {euro.how.rows.map((r) => (
              <div key={r.label} className="flex justify-between gap-6 border-b border-border py-2 text-app-small last:border-b-0 last:font-semibold">
                <dt className="text-foreground">{r.label}</dt>
                <dd className="text-right tabular-nums text-foreground">{r.value}</dd>
              </div>
            ))}
          </dl>
        </ModalDialog>
      ) : null}
    </div>
  )
}

// Un link nel testo, sottolineato, con la freccia: "Vai a Dove intervenire →".
// Non è un bottone primario: l'azione della pagina è leggere.
export function TextLink({ link, className }: { link: ResultsLink; className?: string }) {
  return (
    <Link
      to={link.to}
      className={cn('inline-flex items-center gap-1 self-start rounded-xs text-app-small font-medium text-foreground underline underline-offset-4 hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}
    >
      {link.label} <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  )
}

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Fragment, type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/patterns/EmptyState'
import { InfoTip } from '@/components/patterns/InfoTip'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type ResultsLink = { label: string; to: string }

export type ResultsIssue = {
  title: string
  /** Il dato del riquadro, già scritto ("4 persone", "Assistenza clienti"). Un riquadro senza persone lo dice a parole ("Nessuno oggi."), non con uno zero. */
  value: ReactNode
  body?: ReactNode
  /** Righe brevi sotto il dato, per esempio le prime tre persone con mansione e punteggio. */
  list?: { id: string; text: string }[]
  link?: ResultsLink
}

/** La cifra in euro, già calcolata e scritta: il pattern non conosce il motore. `value` assente: il segnaposto, con il motivo. */
export type ResultsEuro = {
  value: string | null
  pending?: string
  tags?: string[]
  note?: string
  detail?: string
  scenarios?: { label: string; value: string }[]
  footer?: string
  link?: ResultsLink
  how?: { title: string; intro: string; rows: { label: string; value: string }[] }
}

export type ResultsImpact = {
  /** La quota dai dati, in percentuale intera; `null` se non c'è il totale su cui calcolarla. Assente: la pagina non ha una quota. */
  pct?: number | null
  /** Cosa misura la quota, dopo il numero: "delle persone è sopra la norma". */
  label?: string
  /** Il testo del tooltip ⓘ: cosa vuol dire il dato. */
  hint?: ReactNode
  /** Cosa si stimerà in euro, sotto il segnaposto; in Recruiting non c'è: lo decide Roberto. */
  euroNote?: string
  /** La cifra del motore ROI. Assente: il segnaposto «In attesa della formula». */
  euro?: ResultsEuro
  /** Il valore espresso rispetto al ruolo, in percentuale intera, con il suo tooltip. */
  index?: { value: number | null; label: string; hint: ReactNode }
}

// La pagina dei risultati di una finestra (CLAUDE.md, Fase 6, "Le pagine dei
// risultati"): un'impaginazione sola per le sette pagine, sulla tavola «Le
// perdite invisibili». Dall'alto: la riga del percorso, numero, titolo e
// domanda (scala del sito: è una pagina di presentazione), «Perché è
// importante per la tua azienda?» in un riquadro tenue, le quattro sezioni
// separate da un filo — ognuna con l'etichetta in stile label, una frase
// grande e, a destra o sotto, il suo contenuto —, gli approfondimenti e in
// fondo, sulla stessa riga, la nota dei dati dimostrativi e «Torna alla home».
//
// Riceve tutto già calcolato: le frasi con i numeri si fanno dai dati nella
// pagina, qui si dispongono. `empty` sostituisce le sezioni 1–3 (nessun test
// completato) o tutte e quattro (`scope: 'all'`).
// Gli euro sono un segnaposto dichiarato finché Roberto non dà la formula.
export function ResultsPage({
  crumbs,
  number,
  title,
  question,
  actions,
  why,
  situation,
  issues,
  impact,
  suggestion,
  empty,
  deepDives,
  home,
  demoNote,
}: {
  /** Le voci prima della pagina corrente, dalla home. La corrente è `title`. */
  crumbs: ResultsLink[]
  number: string
  title: string
  question: string
  /** A destra del titolo, come in PageHeader: in Assessment il selettore CT / CP / Completo. */
  actions?: ReactNode
  why: string
  /** `text` è la frase grande; `detail` la riga sotto; `chartTitle` e `hint` stanno sopra il grafico. `chartEmpty` sostituisce il grafico quando non c'è niente da disegnare. */
  situation?: { text: ReactNode; detail?: ReactNode; chart?: ReactNode; chartTitle?: string; chartEmpty?: string; hint?: { label: string; text: ReactNode }; /** Il grafico sotto la frase, a tutta riga (il grafico a flussi). */ wide?: boolean }
  issues?: { items: ResultsIssue[]; opportunity: ReactNode; opportunityLabel?: string }
  impact?: ResultsImpact
  /** `text`: la prima frase è il titolo della sezione, il resto la riga sotto. */
  suggestion?: { text: string; link?: ResultsLink }
  empty?: { title?: string; description: string; scope?: 'data' | 'all' }
  deepDives: ResultsLink[]
  home: ResultsLink
  /** La società, quando i dati sono dimostrativi: la pagina lo dice in fondo. */
  demoNote?: string
}) {
  const [howOpen, setHowOpen] = useState(false)
  const impactSection = impact ? (
    <Section label="3 · L'impatto" className={cn('grid grid-cols-1 gap-8', impact.index ? 'lg:grid-cols-3' : 'md:grid-cols-2')}>
      {impact.pct !== undefined ? (
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2">
            <span className="text-site-h2 tabular-nums text-foreground md:text-site-h1">{impact.pct == null ? '—' : `${impact.pct}%`}</span>
            {impact.hint ? <InfoTip label={`Che cosa misura: ${impact.label}`}>{impact.hint}</InfoTip> : null}
          </p>
          <p className="text-app-body text-foreground">{impact.label}</p>
        </div>
      ) : null}
      {impact.index ? (
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2">
            <span className="text-site-h2 tabular-nums text-foreground md:text-site-h1">{impact.index.value == null ? '—' : `${impact.index.value}%`}</span>
            <InfoTip label={`Che cosa misura: ${impact.index.label}`}>{impact.index.hint}</InfoTip>
          </p>
          <p className="text-app-body text-foreground">{impact.index.label}</p>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col items-start gap-2">
        <span className={cn('text-site-h2 tabular-nums md:text-site-h1', impact.euro?.value ? 'text-foreground' : 'text-muted-foreground')}>{impact.euro?.value ?? '€ [—]'}</span>
        <span className="flex flex-wrap gap-1">
          {impact.euro?.value ? (impact.euro.tags ?? []).map((t) => <Badge key={t}>{t}</Badge>) : <Badge>{impact.euro?.pending ?? 'In attesa della formula'}</Badge>}
        </span>
        {impact.euro?.note ?? impact.euroNote ? <p className="text-app-body text-muted-foreground">{impact.euro?.note ?? impact.euroNote}</p> : null}
        {impact.euro?.detail ? <p className="text-app-small text-muted-foreground">{impact.euro.detail}</p> : null}
        {impact.euro?.scenarios ? (
          <dl className="grid w-full max-w-md grid-cols-3 gap-2 pt-1">
            {impact.euro.scenarios.map((s) => (
              <div key={s.label}>
                <dt className="label-mono text-muted-foreground">{s.label}</dt>
                <dd className="text-app-small tabular-nums text-foreground">{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {impact.euro?.footer ? <p className="text-app-small text-muted-foreground">{impact.euro.footer}</p> : null}
        {impact.euro?.link ? <TextLink link={impact.euro.link} /> : null}
        {impact.euro?.how ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setHowOpen(true)}>
            {impact.euro.how.title}
          </Button>
        ) : null}
        {howOpen && impact.euro?.how ? (
          <ModalDialog title={impact.euro.how.title} sub={impact.euro.how.intro} onClose={() => setHowOpen(false)}>
            <dl className="flex flex-col">
              {impact.euro.how.rows.map((r) => (
                <div key={r.label} className="flex justify-between gap-6 border-b border-border py-2 text-app-small last:border-b-0 last:font-semibold">
                  <dt className="text-foreground">{r.label}</dt>
                  <dd className="text-right tabular-nums text-foreground">{r.value}</dd>
                </div>
              ))}
            </dl>
          </ModalDialog>
        ) : null}
      </div>
    </Section>
  ) : null

  const emptyBlock = empty ? (
    <Card>
      <EmptyState title={empty.title} description={empty.description} />
    </Card>
  ) : null
  const hideAll = empty?.scope === 'all'
  const [suggestHead, suggestRest] = suggestion ? splitFirstSentence(suggestion.text) : ['', '']

  return (
    <article data-slot="results-page" className="flex flex-col gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((c) => (
            <Fragment key={c.to}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={c.to}>{c.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </Fragment>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="label-mono text-muted-foreground">{number}</p>
          <h1 className="text-site-h3 text-foreground md:text-site-h2">{title}</h1>
          <p className="max-w-prose text-site-body-lg text-foreground">{question}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>

      <Card padding="lg" className="max-w-4xl gap-2 bg-muted">
        <h2 className="text-app-subtitle font-semibold text-foreground">Perché è importante per la tua azienda?</h2>
        <p className="max-w-prose text-app-body text-foreground">{why}</p>
      </Card>

      {hideAll ? (
        <>
          {emptyBlock}
          {impactSection}
        </>
      ) : (
        <>
          {empty ? (
            emptyBlock
          ) : (
            <>
              {situation ? (
                <Section label="1 · La situazione oggi" className={cn('grid grid-cols-1 gap-6', !situation.wide && 'lg:grid-cols-2 lg:gap-12')}>
                  <div className="flex flex-col gap-2">
                    <h2 className="max-w-prose text-site-h4 text-foreground">{situation.text}</h2>
                    {situation.detail ? <p className="max-w-prose text-app-body text-muted-foreground">{situation.detail}</p> : null}
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    {situation.chartTitle || situation.hint ? (
                      <p className="flex items-center gap-1 text-app-small text-muted-foreground">
                        {situation.chartTitle}
                        {situation.hint ? <InfoTip label={situation.hint.label}>{situation.hint.text}</InfoTip> : null}
                      </p>
                    ) : null}
                    {situation.chart ?? (situation.chartEmpty ? <p className="text-app-small text-muted-foreground">{situation.chartEmpty}</p> : null)}
                  </div>
                </Section>
              ) : null}

              {issues ? (
                <Section label="2 · Criticità e opportunità">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {issues.items.slice(0, 3).map((it) => (
                      <Card key={it.title} className="gap-1 bg-muted">
                        {/* L'etichetta è neutra: un riquadro di criticità non è una fascia (CLAUDE.md, Fase 6). */}
                        <h3 className="label-mono text-muted-foreground">{it.title}</h3>
                        <div className="text-app-subtitle font-semibold text-foreground">{it.value}</div>
                        {it.body ? <div className="text-app-small text-muted-foreground">{it.body}</div> : null}
                        {it.list?.length ? (
                          <ul className="mt-1 flex flex-col gap-1 text-app-small text-muted-foreground">
                            {it.list.map((l) => (
                              <li key={l.id}>{l.text}</li>
                            ))}
                          </ul>
                        ) : null}
                        {it.link ? <TextLink link={it.link} className="mt-auto pt-2" /> : null}
                      </Card>
                    ))}
                  </div>
                  <p className="mt-4 max-w-prose text-app-body text-foreground">
                    <span className="font-semibold">{issues.opportunityLabel ?? 'L’opportunità:'}</span> {issues.opportunity}
                  </p>
                </Section>
              ) : null}

              {impactSection}
            </>
          )}

          {suggestion ? (
            <Section label="4 · Cosa ti suggeriamo di fare">
              <div className="flex max-w-3xl flex-col gap-2">
                <h2 className="text-site-h4 text-foreground">{suggestHead}</h2>
                {suggestRest ? <p className="text-app-body text-muted-foreground">{suggestRest}</p> : null}
                {suggestion.link ? <TextLink link={suggestion.link} className="pt-1" /> : null}
              </div>
            </Section>
          ) : null}
        </>
      )}

      {deepDives.length ? (
        <Section label="Approfondimenti">
          <ul className="flex flex-wrap gap-2">
            {deepDives.map((d) => (
              <li key={d.to}>
                <Button asChild variant="outline" size="sm">
                  <Link to={d.to}>
                    {d.label} <ArrowRight />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {demoNote ? <p className="text-app-caption text-muted-foreground">Dati dimostrativi · {demoNote}</p> : <span />}
        <Button asChild variant="ghost" size="sm">
          <Link to={home.to}>
            <ArrowLeft /> {home.label}
          </Link>
        </Button>
      </footer>
    </article>
  )
}

function Section({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6">
      <p className="label-mono text-muted-foreground">{label}</p>
      <div className={className}>{children}</div>
    </section>
  )
}

// Un link nel testo, sottolineato, con la freccia: "Vai a Dove intervenire →".
// Non è un bottone primario: l'azione della pagina è leggere.
function TextLink({ link, className }: { link: ResultsLink; className?: string }) {
  return (
    <Link
      to={link.to}
      className={cn('inline-flex items-center gap-1 self-start rounded-xs text-app-small font-medium text-foreground underline underline-offset-4 hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}
    >
      {link.label} <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  )
}

/** La prima frase e il resto: "Cominciare dalle persone critiche. I compiti…" → ["Cominciare dalle persone critiche.", "I compiti…"]. */
function splitFirstSentence(text: string): [string, string] {
  const m = text.match(/^(.+?[.!?])\s+(.*)$/s)
  return m ? [m[1], m[2]] : [text, '']
}

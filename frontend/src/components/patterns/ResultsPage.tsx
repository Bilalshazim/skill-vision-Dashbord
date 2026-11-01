import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/patterns/EmptyState'
import { InfoTip } from '@/components/patterns/InfoTip'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export type ResultsLink = { label: string; to: string }

export type ResultsIssue = {
  title: string
  /** Il dato del riquadro, già scritto ("4 persone", "1,2 punti sotto l'atteso"). Un riquadro senza persone lo dice a parole ("Nessuno oggi."), non con uno zero. */
  value: ReactNode
  body?: ReactNode
  /** Righe brevi sotto il dato, per esempio le prime tre persone con mansione e punteggio. */
  list?: { id: string; text: string }[]
  link?: ResultsLink
}

export type ResultsImpact = {
  /** La quota dai dati, in percentuale intera; `null` se non c'è il totale su cui calcolarla. */
  pct: number | null
  /** Cosa misura la quota, dopo il numero: "delle persone è sopra la norma". */
  label: string
  /** Il testo del tooltip ⓘ: cosa vuol dire il dato. */
  hint?: ReactNode
  /** Cosa si stimerà in euro, sotto il segnaposto (Assessment); assente in Recruiting, dove lo decide Roberto. */
  euroNote?: string
}

// La pagina dei risultati di una finestra (CLAUDE.md, Fase 6, "Le pagine dei
// risultati", approvate da Roberto il 2026-10-30): un'impaginazione sola per
// le sette pagine, quattro di Assessment e tre di Recruiting, sul modello «Le
// perdite invisibili». Dall'alto: la riga del percorso (ogni voce prima della
// corrente è un link), numero, titolo e domanda, «Perché è importante per la
// tua azienda?», le quattro sezioni numerate, gli approfondimenti, «Torna
// alla home» e, con dati dimostrativi, la riga che lo dichiara.
//
// Riceve tutto già calcolato: le frasi con i numeri si fanno dai dati nella
// pagina, qui si dispongono. `empty` sostituisce le sezioni 1–3 (nessun test
// completato) o tutte e quattro (`scope: 'all'`, contenuto in preparazione).
// Gli euro sono un segnaposto dichiarato finché Roberto non dà la formula.
export function ResultsPage({
  crumbs,
  number,
  title,
  question,
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
  why: string
  /** `chartEmpty`: la frase al posto del grafico quando non c'è niente da disegnare. */
  situation?: { text: ReactNode; chart?: ReactNode; chartEmpty?: string; hint?: { label: string; text: ReactNode } }
  issues?: { items: ResultsIssue[]; opportunity: ReactNode }
  impact?: ResultsImpact
  suggestion?: { text: ReactNode; link?: ResultsLink }
  empty?: { title?: string; description: string; scope?: 'data' | 'all' }
  deepDives: ResultsLink[]
  home: ResultsLink
  /** La società, quando i dati sono dimostrativi: la pagina lo dice in fondo. */
  demoNote?: string
}) {
  const emptyBlock = empty ? (
    <Card>
      <EmptyState title={empty.title} description={empty.description} />
    </Card>
  ) : null
  const hideAll = empty?.scope === 'all'

  return (
    <article data-slot="results-page" className="flex max-w-5xl flex-col gap-8">
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

      <header className="flex flex-col gap-2">
        <p className="label-mono text-muted-foreground">{number}</p>
        <h1 className="text-app-title text-foreground">{title}</h1>
        <p className="max-w-prose text-app-subtitle text-foreground">{question}</p>
      </header>

      <section>
        <PageHeader title="Perché è importante per la tua azienda?" />
        <p className="max-w-prose text-app-body text-foreground">{why}</p>
      </section>

      {hideAll ? (
        emptyBlock
      ) : (
        <>
          {empty ? (
            emptyBlock
          ) : (
            <>
              {situation ? (
                <section>
                  <PageHeader title="1 · La situazione oggi" />
                  <Card className="gap-4">
                    <p className="flex max-w-prose items-start gap-2 text-app-body text-foreground">
                      <span>{situation.text}</span>
                      {situation.hint ? <InfoTip label={situation.hint.label}>{situation.hint.text}</InfoTip> : null}
                    </p>
                    {situation.chart ?? (situation.chartEmpty ? <p className="text-app-small text-muted-foreground">{situation.chartEmpty}</p> : null)}
                  </Card>
                </section>
              ) : null}

              {issues ? (
                <section>
                  <PageHeader title="2 · Criticità e opportunità" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {issues.items.slice(0, 3).map((it) => (
                      <Card key={it.title} className="gap-2">
                        <h3 className="text-app-subtitle text-foreground">{it.title}</h3>
                        <div className="text-app-body font-medium text-foreground">{it.value}</div>
                        {it.body ? <div className="text-app-small text-muted-foreground">{it.body}</div> : null}
                        {it.list?.length ? (
                          <ul className="flex flex-col gap-1 text-app-small text-muted-foreground">
                            {it.list.map((l) => (
                              <li key={l.id}>{l.text}</li>
                            ))}
                          </ul>
                        ) : null}
                        {it.link ? <SeeMore link={it.link} className="mt-auto self-start" /> : null}
                      </Card>
                    ))}
                  </div>
                  <p className="mt-4 max-w-prose text-app-body text-foreground">{issues.opportunity}</p>
                </section>
              ) : null}

              {impact ? (
                <section>
                  <PageHeader title="3 · L'impatto" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="gap-2">
                      <p className="flex items-center gap-2">
                        <span className="font-mono text-app-title tabular-nums text-foreground">{impact.pct == null ? '—' : `${impact.pct}%`}</span>
                        {impact.hint ? <InfoTip label={`Che cosa misura: ${impact.label}`}>{impact.hint}</InfoTip> : null}
                      </p>
                      <p className="text-app-small text-muted-foreground">{impact.label}</p>
                    </Card>
                    <Card className="gap-2">
                      <p className="font-mono text-app-title text-foreground">€ [—]</p>
                      <p className="text-app-small text-muted-foreground">In attesa della formula{impact.euroNote ? ` · ${impact.euroNote}` : ''}</p>
                    </Card>
                  </div>
                </section>
              ) : null}
            </>
          )}

          {suggestion ? (
            <section>
              <PageHeader title="4 · Cosa ti suggeriamo di fare" />
              <Card className="gap-4">
                <p className="max-w-prose text-app-body text-foreground">{suggestion.text}</p>
                {suggestion.link ? (
                  <Button asChild size="sm" className="self-start">
                    <Link to={suggestion.link.to}>
                      {suggestion.link.label} <ArrowRight />
                    </Link>
                  </Button>
                ) : null}
              </Card>
            </section>
          ) : null}
        </>
      )}

      {deepDives.length ? (
        <section>
          <PageHeader title="Approfondimenti" description="Le pagine di lavoro su questo argomento." />
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
        </section>
      ) : null}

      <footer className="flex flex-col items-start gap-3 border-t border-border pt-4">
        <Button asChild variant="ghost" size="sm">
          <Link to={home.to}>
            <ArrowLeft /> {home.label}
          </Link>
        </Button>
        {demoNote ? <p className="text-app-caption text-muted-foreground">Dati dimostrativi · {demoNote} · Le cifre in euro compaiono quando la formula è definita</p> : null}
      </footer>
    </article>
  )
}

function SeeMore({ link, className }: { link: ResultsLink; className?: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className={className}>
      <Link to={link.to}>
        {link.label} <ArrowRight />
      </Link>
    </Button>
  )
}

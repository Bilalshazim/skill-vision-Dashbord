import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { CompletionRing } from '@/components/patterns/CompletionRing'
import { EmptyState } from '@/components/patterns/EmptyState'
import { EuroFigure, type ResultsEuro, type ResultsLink, TextLink } from '@/components/patterns/EuroFigure'
import { InfoTip } from '@/components/patterns/InfoTip'
import { DotRow, ScaleBar } from '@/components/patterns/MiniChart'
import { ResultsTile, type ResultsIssue } from '@/components/patterns/ResultsTile'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type { ResultsEuro, ResultsLink }

export type { ResultsIssue }

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
  /** Al posto del Ring, una fila di pallini (`n` su `total`): dove il Ring c'è già nella sezione 1 (Il potenziale). */
  dots?: { n: number; total: number }
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
  theme,
  title,
  question,
  actions,
  why,
  situation,
  issues,
  sections,
  impact,
  suggestion,
  empty,
  deepDives = [],
  home,
  demoNote,
}: {
  /** Le voci prima della pagina corrente, dalla home. La corrente è `title`. */
  crumbs: ResultsLink[]
  number: string
  /** Il tema della finestra, dopo il numero: «01 · Rendimento». */
  theme?: string
  title: string
  question: string
  /** A destra del titolo, come in PageHeader: in Assessment il selettore CT / CP / Completo. */
  actions?: ReactNode
  why: string
  /** `text` è la frase grande; `detail` la riga sotto; `chartTitle` e `hint` stanno sopra il grafico. `chartEmpty` sostituisce il grafico quando non c'è niente da disegnare. */
  situation?: { /** Senza frase la sezione mostra solo il grafico (Il valore, Decisioni del 2026-11-09). */ text?: ReactNode; detail?: ReactNode; chart?: ReactNode; chartTitle?: string; chartEmpty?: string; hint?: { label: string; text: ReactNode }; /** Il grafico sotto la frase, a tutta riga (il grafico a flussi). */ wide?: boolean }
  issues?: { items: ResultsIssue[]; opportunity: ReactNode; opportunityLabel?: string }
  /** Sezioni libere, numerate dall'1, al posto di `situation` e `issues` (le pagine di Recruiting). L'impatto e il suggerimento seguono. */
  sections?: { title: string; content: ReactNode }[]
  impact?: ResultsImpact
  /** `text`: la prima frase è il titolo della sezione, il resto la riga sotto. */
  suggestion?: { text: string; link?: ResultsLink }
  empty?: { title?: string; description: string; scope?: 'data' | 'all' }
  deepDives?: ResultsLink[]
  home: ResultsLink
  /** La società, quando i dati sono dimostrativi: la pagina lo dice in fondo. */
  demoNote?: string
}) {
  // I numeri di sezione seguono quelle che ci sono.
  const before = sections?.length ?? (situation ? 1 : 0) + (issues ? 1 : 0)
  const impactNumber = before + 1
  const suggestionNumber = before + (impact ? 2 : 1)
  // L'impatto in card affiancate (correzioni del 2026-11-09): la quota della pagina in un
  // Ring lime con il numero al centro (o una fila di pallini, dove il Ring c'è già sopra);
  // il valore espresso come barra 0–120% con l'atteso 100% tratteggiato, in inchiostro;
  // gli euro con gli scenari. Ogni percentuale ha la sua forma, nessuna scritta da sola.
  const impactCards = impact ? [impact.pct !== undefined, !!impact.index, true].filter(Boolean).length : 0
  const impactSection = impact ? (
    <Section number={impactNumber} title="L'impatto" className={cn('grid grid-cols-1 items-stretch gap-4', impactCards === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2')}>
      {impact.pct !== undefined ? (
        <Card className="h-full gap-3">
          {impact.dots && impact.pct != null ? (
            <DotRow n={impact.dots.n} total={impact.dots.total} label={impact.label ?? ''} tone="highlight" />
          ) : impact.pct != null ? (
            <CompletionRing value={impact.pct} label={impact.label ?? ''} tone="highlight" center="" className="mx-0" />
          ) : (
            <span className="text-site-h2 tabular-nums text-muted-foreground">—</span>
          )}
          <p className="flex items-start gap-2 text-app-body text-foreground">
            <span>{impact.dots && impact.pct != null ? `${impact.pct}% ${impact.label}` : impact.label}</span>
            {impact.hint ? <InfoTip label={`Che cosa misura: ${impact.label}`}>{impact.hint}</InfoTip> : null}
          </p>
        </Card>
      ) : null}
      {impact.index ? (
        <Card className="h-full gap-3">
          <p className="flex items-center gap-2">
            <span className="label-mono text-muted-foreground">{impact.index.label}</span>
            <InfoTip label={`Che cosa misura: ${impact.index.label}`}>{impact.index.hint}</InfoTip>
          </p>
          {impact.index.value == null ? (
            <span className="text-site-h2 tabular-nums text-muted-foreground">—</span>
          ) : (
            <>
              <ScaleBar label={impact.index.label} value={impact.index.value} max={120} expected={100} expectedLabel="Atteso 100%" format={(n) => `${n}%`} size="md" />
              <p className="text-app-body text-foreground">{gapText(impact.index.value - 100)}</p>
            </>
          )}
        </Card>
      ) : null}
      <Card className="h-full gap-3">
        <EuroFigure euro={impact.euro} note={impact.euroNote} />
      </Card>
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
          <p className="label-mono text-muted-foreground">{theme ? `${number} · ${theme}` : number}</p>
          <h1 className="text-site-h2 text-foreground md:text-site-h1">{title}</h1>
          <p className="max-w-prose text-site-body-lg text-foreground">{question}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>

      {/* «Perché è importante» fuori dal riquadro, come titolo e sottotitolo (correzioni di
          Roberto del 2026-11-10): H2 del sito (32px; un gradino sotto su mobile, come il resto
          della pagina) e il testo a 20px/400, interlinea 1,5 (18px su mobile), nella colonna di
          lettura. Gerarchia: H1 44 › H2 32 › titoli di sezione H3 24. */}
      <section className="flex max-w-prose flex-col gap-3">
        <h2 className="text-site-h3 text-foreground md:text-site-h2">Perché è importante per la tua azienda?</h2>
        <p className="text-site-body-lg text-foreground md:text-site-h4 md:leading-normal md:font-normal md:tracking-normal">{why}</p>
      </section>

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
              {sections?.map((s, i) => (
                <Section key={s.title} number={i + 1} title={s.title}>
                  {s.content}
                </Section>
              ))}
              {situation ? (
                <Section number={1} title="La situazione oggi" className={cn('grid grid-cols-1 gap-6', !situation.wide && 'lg:grid-cols-2 lg:gap-12')}>
                  {situation.text ? (
                    <div className="flex flex-col gap-2">
                      <p className="max-w-prose text-site-h4 text-foreground">{situation.text}</p>
                      {situation.detail ? <p className="max-w-prose text-app-body text-muted-foreground">{situation.detail}</p> : null}
                    </div>
                  ) : null}
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
                <Section number={situation ? 2 : 1} title="Criticità e opportunità">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Un verde per sezione (correzioni di Roberto del 2026-11-10): il mini grafico
                        del primo riquadro, il principale della sezione; gli altri in inchiostro. */}
                    {issues.items.slice(0, 3).map((it, i) => (
                      <ResultsTile key={it.title} {...it} chart={it.chart ? { ...it.chart, tone: i === 0 ? 'highlight' : 'mono' } : undefined} />
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
            <Section number={suggestionNumber} title="Cosa ti suggeriamo di fare">
              <div className="flex max-w-3xl flex-col gap-2">
                <p className="text-site-h4 text-foreground">{suggestHead}</p>
                {suggestRest ? <p className="text-app-body text-muted-foreground">{suggestRest}</p> : null}
                {suggestion.link ? <TextLink link={suggestion.link} className="pt-1" /> : null}
              </div>
            </Section>
          ) : null}
        </>
      )}

      {deepDives.length ? (
        <Section title="Approfondimenti">
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

// Il titolo di sezione: H3 della scala del sito, minuscolo, con il numero davanti senza
// zero (Decisioni del 2026-11-06). Si distingue dall'etichetta della finestra per
// carattere, corpo e forma.
function Section({ number, title, className, children }: { number?: number; title: string; className?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6">
      <h2 className="flex gap-2 text-site-h4 text-foreground md:text-site-h3">
        {number ? <span className="text-muted-foreground">{number}</span> : null}
        {title}
      </h2>
      <div className={className}>{children}</div>
    </section>
  )
}

/** Lo scarto dall'atteso, senza decimali: «−27% dall'atteso», «+6% oltre l'atteso», «In linea con l'atteso». */
function gapText(gap: number): string {
  if (gap === 0) return 'In linea con l’atteso'
  return gap < 0 ? `−${Math.abs(gap)}% dall’atteso` : `+${gap}% oltre l’atteso`
}

/** La prima frase e il resto: "Cominciare dalle persone critiche. I compiti…" → ["Cominciare dalle persone critiche.", "I compiti…"]. */
function splitFirstSentence(text: string): [string, string] {
  const m = text.match(/^(.+?[.!?])\s+(.*)$/s)
  return m ? [m[1], m[2]] : [text, '']
}

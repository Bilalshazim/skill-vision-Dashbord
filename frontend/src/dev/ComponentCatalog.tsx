import { ArrowRight, Download, Plus, Trash2 } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'

import { Hint } from '@/components/patterns/Hint'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardLabel, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Catalogo della libreria — /dev/components, solo in sviluppo (App.tsx lo
// monta sotto import.meta.env.DEV, e la build di produzione non lo include).
// Ogni primitiva e ogni pattern entra qui nel momento in cui è pronto, con
// tutte le varianti e tutti gli stati, in chiaro e in scuro affiancati.
// Prima di scrivere un componente nuovo, si guarda qui se esiste già.

type Entry = { name: string; level: 'Primitiva' | 'Pattern'; source: string; render: () => ReactNode }

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="label-mono text-muted-foreground">{label}</div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

const BUTTON_VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'warning', 'link'] as const

const ENTRIES: Entry[] = [
  {
    name: 'Button',
    level: 'Primitiva',
    source: 'components/ui/button.tsx',
    render: () => (
      <>
        <Row label="Varianti">
          {BUTTON_VARIANTS.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </Row>
        <Row label="Taglie">
          <Button size="lg">Grande</Button>
          <Button>Normale</Button>
          <Button size="sm">Piccolo</Button>
          <Button size="icon" variant="outline" aria-label="Aggiungi">
            <Plus />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Elimina">
            <Trash2 />
          </Button>
        </Row>
        <Row label="Con icona">
          <Button>
            Continua
            <ArrowRight />
          </Button>
          <Button variant="outline" size="sm">
            <Download />
            Esporta
          </Button>
        </Row>
        <Row label="Disabilitato — sempre con una spiegazione accanto">
          {BUTTON_VARIANTS.slice(0, 5).map((v) => (
            <Button key={v} variant={v} disabled>
              {v}
            </Button>
          ))}
          <span className="text-app-small text-muted-foreground">Disponibile dopo il salvataggio</span>
        </Row>
      </>
    ),
  },
  {
    name: 'Card',
    level: 'Primitiva',
    source: 'components/ui/card.tsx',
    render: () => (
      <>
        <Row label="Completa — padding md (default)">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div>
                <CardLabel>Competenze trasversali</CardLabel>
                <CardTitle>Riepilogo del team</CardTitle>
              </div>
              <CardAction>
                <Badge tone="success">Idoneo</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <CardDescription>Media di 23 dipendenti valutati sulle sei aree del modello.</CardDescription>
            </CardContent>
            <CardFooter>
              <Button size="sm">Apri</Button>
              <Button size="sm" variant="outline">
                Esporta
              </Button>
            </CardFooter>
          </Card>
        </Row>
        <Row label="Padding lg · none">
          <Card padding="lg" className="w-64">
            <CardTitle>Pannello largo</CardTitle>
            <CardDescription>24px di padding.</CardDescription>
          </Card>
          <Card padding="none" className="w-64">
            <div className="border-b border-border bg-muted px-4 py-2 label-mono text-muted-foreground">Contenuto a filo</div>
            <div className="px-4 py-2 text-app-small">Per tabelle ed elenchi.</div>
          </Card>
        </Row>
      </>
    ),
  },
  {
    name: 'Badge',
    level: 'Primitiva',
    source: 'components/ui/badge.tsx',
    render: () => (
      <>
        <Row label="Toni">
          <Badge>Neutro</Badge>
          <Badge tone="accent">In evidenza</Badge>
          <Badge tone="success">Idoneo</Badge>
          <Badge tone="warning">Da valutare</Badge>
          <Badge tone="destructive">Non idoneo</Badge>
        </Row>
        <Row label="Con punto">
          <Badge dot>Neutro</Badge>
          <Badge tone="success" dot>
            Test completato
          </Badge>
          <Badge tone="warning" dot>
            Link pronto
          </Badge>
          <Badge tone="destructive" dot>
            Da inviare
          </Badge>
        </Row>
      </>
    ),
  },
  {
    name: 'Tooltip',
    level: 'Primitiva',
    source: 'components/ui/tooltip.tsx',
    render: () => (
      <Row label="Al passaggio o al focus — il contenuto va in un portale, quindi segue la modalità della pagina">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Passa qui</Button>
          </TooltipTrigger>
          <TooltipContent>Non disponibile in questa build</TooltipContent>
        </Tooltip>
      </Row>
    ),
  },
  {
    name: 'Hint',
    level: 'Pattern',
    source: 'components/patterns/Hint.tsx',
    render: () => (
      <>
        <Row label="Al posto di title — su un bottone solo icona">
          <Hint label="Rimuovi dal pre-screening">
            <Button variant="destructive" size="icon-sm" aria-label="Rimuovi dal pre-screening">
              <Trash2 />
            </Button>
          </Hint>
        </Row>
        <Row label="Su un bottone disabilitato — la spiegazione resta raggiungibile">
          <Hint label="Il servizio non è disponibile in questa build">
            <Button variant="outline" size="sm" disabled>
              Seleziona più CV
            </Button>
          </Hint>
        </Row>
      </>
    ),
  },
]

function Panel({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <div className={`${mode === 'dark' ? 'dark' : ''} flex min-w-0 flex-col gap-8 bg-background p-6 text-foreground`}>
      <div className="label-mono text-muted-foreground">{mode === 'dark' ? 'Scuro' : 'Chiaro'}</div>
      {ENTRIES.map((e) => (
        <section key={e.name} id={`${e.name}-${mode}`} className="flex flex-col gap-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-app-section">{e.name}</h2>
            <span className="label-mono text-muted-foreground">{e.level}</span>
            <code className="font-mono text-app-caption text-muted-foreground">{e.source}</code>
          </div>
          {e.render()}
        </section>
      ))}
    </div>
  )
}

export default function ComponentCatalog() {
  // I due pannelli decidono da soli la modalità: il chiaro non deve
  // ereditare la classe .dark che useTheme mette su <html>.
  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')
    return () => {
      if (wasDark) root.classList.add('dark')
    }
  }, [])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="flex flex-col gap-2 border-b border-border px-6 py-6">
          <div className="label-mono text-muted-foreground">Solo sviluppo</div>
          <h1 className="text-app-title">Catalogo dei componenti</h1>
          <p className="max-w-2xl text-app-body text-muted-foreground">
            Ogni primitiva e ogni pattern della libreria, con varianti e stati, in chiaro e in scuro. Premi Tab per vedere il focus.
          </p>
          <nav className="flex flex-wrap gap-2 pt-2" aria-label="Componenti">
            {ENTRIES.map((e) => (
              <Button key={e.name} asChild variant="outline" size="sm">
                <a href={`#${e.name}-light`}>{e.name}</a>
              </Button>
            ))}
          </nav>
        </header>
        <div className="grid grid-cols-1 xl:grid-cols-2">
          <Panel mode="light" />
          <Panel mode="dark" />
        </div>
      </div>
    </TooltipProvider>
  )
}

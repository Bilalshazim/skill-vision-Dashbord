import { ArrowRight, Check, ChevronDown, CircleDollarSign, Download, Gauge, ListChecks, MapPin, Plus, Target, Trash2, TrendingUp, Users } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ChoiceCard } from '@/components/patterns/ChoiceCard'
import { SendTestLinkBar } from '@/components/patterns/SendTestLinkBar'
import { CompanySwitcher } from '@/components/patterns/CompanySwitcher'
import { CompletionRing } from '@/components/patterns/CompletionRing'
import { IdoneitaBadge } from '@/components/patterns/IdoneitaBadge'
import { ModuleSwitcher } from '@/components/patterns/ModuleSwitcher'
import { ScatterMatrix } from '@/components/patterns/ScatterMatrix'
import { ScoreGauge } from '@/components/patterns/ScoreGauge'
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '@/components/ui/sidebar'
import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ProfileRadar } from '@/components/patterns/ProfileRadar'
import { TrendChart } from '@/components/patterns/TrendChart'
import { ChartCard } from '@/components/patterns/ChartCard'
import { CrossModuleBanner } from '@/components/patterns/CrossModuleBanner'
import { DataTable } from '@/components/patterns/DataTable'
import { DistributionBar } from '@/components/patterns/DistributionBar'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FilterBar } from '@/components/patterns/FilterBar'
import { FilterToggle } from '@/components/patterns/FilterToggle'
import { FolderCard } from '@/components/patterns/FolderCard'
import { LoadingState } from '@/components/patterns/LoadingState'
import { PageHeader } from '@/components/patterns/PageHeader'
import { PersonRow } from '@/components/patterns/PersonRow'
import { PrefixedInput } from '@/components/patterns/PrefixedInput'
import { SkillVisionCard } from '@/components/patterns/SkillVisionCard'
import { StatCard } from '@/components/patterns/StatCard'
import { StepNav } from '@/components/patterns/StepNav'
import { Initials } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Hint } from '@/components/patterns/Hint'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { SelectField } from '@/components/patterns/SelectField'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardLabel, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useDirty } from '@/hooks/use-dirty'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from '@/components/patterns/LoginForm'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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

function SelectDemo() {
  const [ruolo, setRuolo] = useState('')
  const [fascia, setFascia] = useState('adeguata')
  return (
    <div className="grid w-full max-w-md gap-4">
      <Field label="Ruolo" hint="L'opzione vuota resta selezionabile: il valore salvato è una stringa vuota.">
        <SelectField value={ruolo} onValueChange={setRuolo}>
          <option value="">— Seleziona un ruolo —</option>
          {['Sales Account Manager', 'Project Manager', 'HR Specialist'].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </SelectField>
      </Field>
      <Field label="Fascia" error={fascia === 'critica' ? 'Richiede un piano di sviluppo.' : undefined}>
        <SelectField value={fascia} onValueChange={setFascia}>
          <option value="valorizzare">Talento da valorizzare</option>
          <option value="adeguata">Persona adeguata</option>
          <option value="critica">Persona critica</option>
          <option value="archiviata" disabled>
            Archiviata (non selezionabile)
          </option>
        </SelectField>
      </Field>
      <div className="flex flex-wrap gap-3">
        <SelectField value="cognome" onValueChange={() => {}} size="sm" className="w-48" aria-label="Ordina">
          <option value="cognome">Ordina: Cognome A-Z</option>
          <option value="area">Ordina: Area</option>
        </SelectField>
        <SelectField value="" onValueChange={() => {}} size="sm" className="w-48" disabled placeholder="Disabilitata" aria-label="Disabilitata">
          <option value="x">x</option>
        </SelectField>
      </div>
    </div>
  )
}

function ChoiceDemo() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  const [on, setOn] = useState(true)
  const [score, setScore] = useState(6)
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="label-mono text-muted-foreground">Checkbox — spuntata · vuota · indeterminata · disabilitata</div>
        <label className="flex items-center gap-2 text-app-body">
          <Checkbox checked={a} onCheckedChange={(c) => setA(c === true)} />
          Promosso al test
        </label>
        <label className="flex items-center gap-2 text-app-body">
          <Checkbox checked={b} onCheckedChange={(c) => setB(c === true)} />
          Mostra archiviati
        </label>
        <label className="flex items-center gap-2 text-app-body">
          <Checkbox checked="indeterminate" />
          Seleziona tutti (alcuni selezionati)
        </label>
        <label className="flex items-center gap-2 text-app-body text-muted-foreground">
          <Checkbox checked disabled />
          Approvata — serve il salvataggio sul server
        </label>
      </div>
      <div className="flex flex-col gap-3">
        <div className="label-mono text-muted-foreground">Switch — acceso · spento · disabilitato</div>
        <label className="flex items-center gap-3 text-app-body">
          <Switch checked={on} onCheckedChange={setOn} />
          Richiede feedback
        </label>
        <label className="flex items-center gap-3 text-app-body text-muted-foreground">
          <Switch disabled />
          Non modificabile in sola lettura
        </label>
      </div>
      <div className="flex flex-col gap-3">
        <div className="label-mono text-muted-foreground">Slider — 1–10, valore sempre scritto accanto</div>
        <div className="flex items-center gap-4">
          <Slider min={1} max={10} step={1} value={[score]} onValueChange={([n]) => setScore(n)} aria-label="Punteggio" />
          <span className="w-8 text-right font-mono tabular-nums">{score}</span>
        </div>
        <Slider min={1} max={10} defaultValue={[4]} disabled aria-label="Disabilitato" />
      </div>
    </div>
  )
}

function DialogDemo() {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [note, setNote] = useState('')
  const dirty = useDirty({ nome, note }, open)
  const [confirmOpen, setConfirmOpen] = useState(false)
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() => {
          setNome('')
          setNote('')
          setOpen(true)
        }}
      >
        Apri un modulo
      </Button>
      <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
        Elimina assegnazione
      </Button>
      {open && (
        <ModalDialog
          title="Nuovo dipendente"
          sub="Scrivi qualcosa, poi prova Esc, il clic fuori o ✕: chiede conferma."
          dirty={dirty}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button onClick={() => setOpen(false)}>Salva</Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Field label="Nome e cognome">
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </Field>
            <Field label="Note">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </div>
        </ModalDialog>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminare questa assegnazione?"
        description="I punteggi già inviati non verranno rimossi."
        confirmLabel="Elimina assegnazione"
        destructive
        onConfirm={() => toast.success('Assegnazione eliminata')}
      />
    </div>
  )
}

function DisclosureDemo() {
  const [view, setView] = useState('org')
  const [sort, setSort] = useState('score')
  const [skills, setSkills] = useState<string[]>(['ascolto'])
  const [step, setStep] = useState(3)
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="label-mono text-muted-foreground">Tabs — cambiano il contenuto sotto</div>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="org">Panoramica</TabsTrigger>
            <TabsTrigger value="area">Per area</TabsTrigger>
            <TabsTrigger value="rank">Classifica</TabsTrigger>
            <TabsTrigger value="off" disabled>
              Confronto
            </TabsTrigger>
          </TabsList>
          <TabsContent value="org" className="text-app-small text-muted-foreground">
            Contenuto della panoramica aziendale.
          </TabsContent>
          <TabsContent value="area" className="text-app-small text-muted-foreground">
            Contenuto per area.
          </TabsContent>
          <TabsContent value="rank" className="text-app-small text-muted-foreground">
            Contenuto della classifica.
          </TabsContent>
        </Tabs>
      </div>
      <div className="flex flex-col gap-3">
        <div className="label-mono text-muted-foreground">ToggleGroup — una vista o un filtro · più voci</div>
        <ToggleGroup type="single" value={sort} onValueChange={(v) => v && setSort(v)} aria-label="Ordina">
          <ToggleGroupItem value="score">Per punteggio</ToggleGroupItem>
          <ToggleGroupItem value="gap">Per gap</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="multiple" value={skills} onValueChange={setSkills} aria-label="Soft skill" className="border-0 bg-transparent p-0">
          {[
            ['ascolto', 'Ascolto'],
            ['decisione', 'Prendere decisioni'],
            ['team', 'Lavoro in team'],
          ].map(([id, name]) => (
            <ToggleGroupItem key={id} value={id} className="border border-border">
              {skills.includes(id) && <Check aria-hidden="true" />}
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-3">
        <div className="label-mono text-muted-foreground">Progress — il valore sempre scritto accanto</div>
        <div className="flex items-center gap-4">
          <Progress value={(step / 8) * 100} aria-label={`Passo ${step} di 8`} />
          <span className="shrink-0 font-mono text-app-small tabular-nums">{step} / 8</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setStep((n) => Math.max(0, n - 1))}>
            Indietro
          </Button>
          <Button size="sm" variant="outline" onClick={() => setStep((n) => Math.min(8, n + 1))}>
            Avanti
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="label-mono text-muted-foreground">Accordion — più sezioni, solo l'intestazione apre</div>
        <Card padding="none" className="px-4">
          <Accordion type="multiple" defaultValue={['req']}>
            <AccordionItem value="req">
              <AccordionTrigger>Requisiti chiave</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Un clic qui dentro non chiude la sezione.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="soft">
              <AccordionTrigger>Soft skills</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">Sei essenziali, quattro importanti, due utili.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
      <div className="flex flex-col gap-3">
        <div className="label-mono text-muted-foreground">Collapsible — un solo riquadro (MasterCard, Subcard)</div>
        <Collapsible className="overflow-hidden rounded-sm border border-border">
          <CollapsibleTrigger className="group flex w-full items-center gap-3 px-3 py-2 text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
            <span className="flex-1 text-app-body font-medium">Scheda intervista strutturata</span>
            <span className="text-app-small text-muted-foreground">Non compilata</span>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" aria-hidden="true" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border p-3 text-app-small text-muted-foreground">Contenuto del riquadro.</div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

const BUTTON_VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'warning', 'link'] as const

const PEOPLE = [
  { id: '1', nome: 'Antonio', cognome: 'Bianchi', area: 'Technical Area', ruolo: 'Technical Specialist', score: 3.1 },
  { id: '2', nome: 'Andrea', cognome: 'Colombo', area: 'Sales Area', ruolo: 'Sales Representative', score: 5.8 },
  { id: '3', nome: 'Sara', cognome: 'Colombo', area: 'Human Resources', ruolo: 'HR Specialist', score: 7.4 },
  { id: '4', nome: 'Elisa', cognome: 'Costa', area: 'Customer Service', ruolo: 'Customer Care Manager', score: 6.2 },
  { id: '5', nome: 'Laura', cognome: 'De Luca', area: 'Technical Area', ruolo: 'Technical Specialist', score: 8.1 },
]
const scoreTone = (n: number): 'success' | 'warning' | 'destructive' => (n >= 7 ? 'success' : n >= 5 ? 'warning' : 'destructive')

function TableDemo() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Row label="Table — righe ferme; totale su muted">
        <div className="w-full rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dimensione</TableHead>
                <TableHead className="text-right">Manager</TableHead>
                <TableHead className="text-right">Peer</TableHead>
                <TableHead className="text-right">Auto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ['A · Autonomia', 6.2, 5.8, 7.1],
                ['P · Pianificazione', 5.4, 6.0, 6.3],
              ].map(([d, a, b, c]) => (
                <TableRow key={String(d)}>
                  <TableCell>{d}</TableCell>
                  <TableCell className="text-right">{a}</TableCell>
                  <TableCell className="text-right">{b}</TableCell>
                  <TableCell className="text-right">{c}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted font-medium">
                <TableCell>Media</TableCell>
                <TableCell className="text-right">5,8</TableCell>
                <TableCell className="text-right">5,9</TableCell>
                <TableCell className="text-right">6,7</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Row>
      <Row label="Table size=sm frame minWidth=lg — dentro un dialog o un modulo">
        <Table size="sm" frame minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Area / criterio</TableHead>
              <TableHead>Peso %</TableHead>
              <TableHead>Punteggio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Competenze tecniche</TableCell>
              <TableCell>40%</TableCell>
              <TableCell>4,0</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Row>
    </div>
  )
}

function DataTableDemo() {
  const [state, setState] = useState<'dati' | 'vuoto' | 'caricamento'>('dati')
  const [q, setQ] = useState('')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(1)
  const rows = state === 'vuoto' ? [] : PEOPLE.filter((p) => `${p.nome} ${p.cognome}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="flex w-full flex-col gap-3">
      <ToggleGroup type="single" value={state} onValueChange={(v) => v && setState(v as typeof state)} aria-label="Stato">
        <ToggleGroupItem value="dati">Con dati</ToggleGroupItem>
        <ToggleGroupItem value="vuoto">Vuota</ToggleGroupItem>
        <ToggleGroupItem value="caricamento">In caricamento</ToggleGroupItem>
      </ToggleGroup>
      <FilterBar
        search={{
          value: q,
          onChange: (v) => {
            setQ(v)
            setPage(1)
          },
          placeholder: 'Cerca per nome…',
        }}
      >
        <SelectField size="sm" value="all" onValueChange={() => {}} aria-label="Area">
          <option value="all">Tutte le aree</option>
          <option value="tech">Technical Area</option>
        </SelectField>
        <FilterToggle>
          <Checkbox checked={archived} onCheckedChange={(c) => setArchived(c === true)} />
          Mostra archiviati
        </FilterToggle>
      </FilterBar>
      <DataTable
        rows={rows}
        loading={state === 'caricamento'}
        getRowId={(r) => r.id}
        onRowClick={(r) => toast(`Apre la scheda di ${r.nome} ${r.cognome}`)}
        rowLabel={(r) => `Apri la scheda di ${r.nome} ${r.cognome}`}
        pagination={{
          page,
          pageSize: 3,
          onPageChange: setPage,
          labels: { showing: (a, b, t) => `Visualizzazione ${a}–${b} di ${t}`, pageOf: (p, t) => `Pagina ${p} di ${t}`, prev: 'Pagina precedente', next: 'Pagina successiva' },
        }}
        empty={<EmptyState icon={Users} title="Nessun dipendente trovato" description="Modifica i filtri di ricerca o aggiungi un nuovo dipendente." />}
        columns={[
          {
            key: 'n',
            header: 'Dipendente',
            nowrap: true,
            cell: (r) => (
              <div className="flex items-center gap-2">
                <Initials first={r.nome} last={r.cognome} />
                <span className="font-medium">
                  {r.nome} {r.cognome}
                </span>
              </div>
            ),
          },
          { key: 'a', header: 'Area', emphasis: 'muted', nowrap: true, cell: (r) => r.area },
          { key: 'r', header: 'Ruolo', truncate: 'sm', cell: (r) => r.ruolo },
          {
            key: 's',
            header: 'Punteggio',
            align: 'end',
            cell: (r) => (
              <Badge tone={scoreTone(r.score)} dot>
                {r.score.toFixed(1)}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  )
}

function SheetDemo() {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const dirty = useDirty({ note }, open)
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setNote('')
      }}
    >
      <Button variant="outline" onClick={() => setOpen(true)}>
        Apri il pannello
      </Button>
      <SheetContent side="right" size="md" dirty={dirty}>
        <SheetHeader>
          <Initials first="Antonio" last="Bianchi" size="lg" />
          <div className="min-w-0 flex-1">
            <SheetTitle>Antonio Bianchi</SheetTitle>
            <SheetDescription>Technical Specialist · Technical Area</SheetDescription>
          </div>
        </SheetHeader>
        <SheetBody>
          <Field label="Piano di sviluppo" hint="Scrivi qualcosa, poi prova Esc, il clic fuori o ✕: chiede conferma.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button
            onClick={() => {
              setNote('')
              setOpen(false)
            }}
          >
            Salva
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function HomeCardsDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="grid w-full grid-cols-1 gap-4">
      <FolderCard icon={ListChecks} title="Le Decisioni" kicker="quello che puoi fare da subito">
        <p className="mt-4 text-app-body font-medium">Come agire da subito</p>
      </FolderCard>
      <SkillVisionCard
        icon={CircleDollarSign}
        title="Il Valore"
        subtitle="quello che devi sapere"
        lines={['Quanto valore sta generando la tua azienda']}
        open={open}
        onOpenChange={setOpen}
        actions={
          <>
            <Button size="sm">Vedi Dettagli</Button>
            <Button size="sm" variant="outline">
              Confronta Aree
            </Button>
          </>
        }
        panel={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard tone="accent" size="lg" icon={Gauge} label="Punteggio complessivo" value="60%" progress={60} />
            <StatCard icon={Target} label="Copertura ruoli" value="93%" progress={93} />
          </div>
        }
      />
    </div>
  )
}

function ChoiceCardsDemo() {
  const [areas, setAreas] = useState<Record<string, number | undefined>>({ Commerciale: 6 })
  const [dec, setDec] = useState<string[]>(['Sviluppare'])
  const [step, setStep] = useState(3)
  const [v, setV] = useState(['', 'Turnover nei ruoli chiave', ''])
  return (
    <div className="flex w-full flex-col gap-6">
      <Row label="StepNav — fatti con la spunta, corrente pieno, sotto 640px solo i pallini">
        <div className="w-full">
          <StepNav steps={['Setup', 'Valore', 'Potenziale', 'Aree', 'Rischi', 'Report']} current={step} onSelect={setStep} label="Passi dell'intervista" />
        </div>
      </Row>
      <Row label="ChoiceCard — spenta · accesa con controllo sotto">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          {['Commerciale', 'Operations'].map((a) => (
            <ChoiceCard key={a} title={a} selected={areas[a] !== undefined} onSelectedChange={(on) => setAreas((p) => ({ ...p, [a]: on ? 5 : undefined }))}>
              <div className="flex items-center gap-2 text-app-caption text-muted-foreground">
                Criticità
                <Slider min={1} max={10} value={[areas[a] ?? 5]} onValueChange={([n]) => setAreas((p) => ({ ...p, [a]: n }))} aria-label={`Criticità ${a}`} />
                <span className="text-app-small text-foreground tabular-nums">{areas[a]}</span>
              </div>
            </ChoiceCard>
          ))}
        </div>
      </Row>
      <Row label="ChoiceCard align=center — con icona e descrizione">
        <div className="grid w-full grid-cols-2 gap-3">
          {[
            ['Sviluppare', TrendingUp, 'Piani di crescita mirati'],
            ['Selezionare', Target, 'Assumere con criteri oggettivi'],
          ].map(([t, I, d]) => (
            <ChoiceCard
              key={t as string}
              align="center"
              icon={I as typeof Target}
              title={t as string}
              description={d as string}
              selected={dec.includes(t as string)}
              onSelectedChange={(on) => setDec((p) => (on ? [...p, t as string] : p.filter((x) => x !== t)))}
            />
          ))}
        </div>
      </Row>
      <Row label="PrefixedInput — numero · parola · errore">
        <div className="flex w-full flex-col gap-2">
          {v.map((x, i) => (
            <PrefixedInput
              key={i}
              lead={i + 1}
              aria-label={`Rischio ${i + 1}`}
              placeholder={`Rischio ${i + 1}`}
              aria-invalid={i === 2 && !x ? true : undefined}
              value={x}
              onChange={(e) => setV((p) => p.map((y, j) => (j === i ? e.target.value : y)))}
            />
          ))}
          <PrefixedInput lead="Altro" aria-label="Altro" placeholder="Aggiungi una voce personalizzata…" />
        </div>
      </Row>
    </div>
  )
}

function SendTestLinkDemo() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['2']))
  const names = PEOPLE.filter((p) => selected.has(p.id)).map((p) => `${p.nome} ${p.cognome}`)
  return (
    <div className="flex w-full flex-col gap-3">
      <SendTestLinkBar
        selectedNames={names}
        onClear={() => setSelected(new Set())}
        onSend={() => {
          toast(`Link inviato a ${names.length} ${names.length === 1 ? 'persona' : 'persone'}`)
          setSelected(new Set())
        }}
      />
      <DataTable
        rows={PEOPLE}
        getRowId={(r) => r.id}
        rowLabel={(r) => `${r.nome} ${r.cognome}`}
        selection={{ selected, onChange: setSelected, label: 'Seleziona tutti i nominativi' }}
        columns={[
          { key: 'n', header: 'Nominativo', nowrap: true, cell: (r) => (<div className="flex items-center gap-2"><Initials first={r.nome} last={r.cognome} /><span className="font-medium">{r.nome} {r.cognome}</span></div>) },
          { key: 'r', header: 'Mansione', emphasis: 'muted', cell: (r) => r.ruolo },
        ]}
      />
    </div>
  )
}

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
    name: 'Input',
    level: 'Primitiva',
    source: 'components/ui/input.tsx',
    render: () => (
      <>
        <Row label="Taglie — normale 15px, compatta 14px (tabelle, filtri)">
          <Input className="w-60" placeholder="Nome e cognome" aria-label="Normale" />
          <Input size="sm" className="w-48" placeholder="Cerca…" aria-label="Compatta" />
        </Row>
        <Row label="Stati">
          <Input className="w-48" defaultValue="Valore inserito" aria-label="Con valore" />
          <Input className="w-48" defaultValue="Disabilitato" disabled aria-label="Disabilitato" />
          <Input className="w-48" defaultValue="Sola lettura" readOnly aria-label="Sola lettura" />
          <Input className="w-48" defaultValue="Non valido" aria-invalid aria-label="Errore" />
        </Row>
        <Row label="Tipi">
          <Input type="number" className="w-24 text-right tabular-nums" defaultValue={7.5} aria-label="Numero" />
          <Input type="date" className="w-44" aria-label="Data" />
          <Input type="email" className="w-60" placeholder="nome@azienda.it" aria-label="Email" />
        </Row>
      </>
    ),
  },
  {
    name: 'Textarea',
    level: 'Primitiva',
    source: 'components/ui/textarea.tsx',
    render: () => (
      <Row label="Normale · disabilitata">
        <Textarea className="max-w-sm" placeholder="Note sul colloquio" aria-label="Note" />
        <Textarea className="max-w-sm" defaultValue="Testo non modificabile" disabled aria-label="Disabilitata" />
      </Row>
    ),
  },
  {
    name: 'Label',
    level: 'Primitiva',
    source: 'components/ui/label.tsx',
    render: () => (
      <Row label="Stile label: Geist Mono maiuscolo, 12px, tre o quattro parole">
        <Label>Codice posizione</Label>
        <Label>Data del colloquio</Label>
      </Row>
    ),
  },
  {
    name: 'Field',
    level: 'Pattern',
    source: 'components/patterns/Field.tsx',
    render: () => (
      <>
        <Row label="Etichetta · nota (caption) · errore (small)">
          <div className="grid w-full max-w-md gap-4">
            <Field label="Titolo ruolo" required>
              <Input defaultValue="Sales Account Manager" />
            </Field>
            <Field label="Email del valutatore" hint="Riceverà il link alla scheda di valutazione.">
              <Input type="email" placeholder="nome@azienda.it" />
            </Field>
            <Field label="Punteggio finale" error="Inserisci un valore fra 1 e 10.">
              <Input type="number" defaultValue={12} className="w-36" />
            </Field>
            <Field label="Scopo del ruolo">
              <Textarea rows={3} />
            </Field>
          </div>
        </Row>
      </>
    ),
  },
  {
    name: 'FieldGrid',
    level: 'Pattern',
    source: 'components/patterns/FieldGrid.tsx',
    render: () => (
      <Row label="Due o tre colonne da sm in su, una sotto">
        <div className="w-full max-w-lg">
          <FieldGrid>
            <Field label="Nome">
              <Input />
            </Field>
            <Field label="Cognome">
              <Input />
            </Field>
          </FieldGrid>
        </div>
      </Row>
    ),
  },
  {
    name: 'SelectField',
    level: 'Pattern',
    source: 'components/patterns/SelectField.tsx (su components/ui/select.tsx)',
    render: () => (
      <Row label="Normale in un Field · compatta · disabilitata · con opzione vuota ed errore">
        <SelectDemo />
      </Row>
    ),
  },
  {
    name: 'Scelte',
    level: 'Primitiva',
    source: 'components/ui/checkbox.tsx · switch.tsx · slider.tsx',
    render: () => (
      <Row label="Checkbox, Switch, Slider">
        <ChoiceDemo />
      </Row>
    ),
  },
  {
    name: 'Dialog',
    level: 'Pattern',
    source: 'components/patterns/ModalDialog.tsx · ConfirmDialog.tsx (su ui/dialog, ui/alert-dialog)',
    render: () => (
      <Row label="ModalDialog con dirty · ConfirmDialog (sostituisce window.confirm)">
        <DialogDemo />
      </Row>
    ),
  },
  {
    name: 'Notifiche',
    level: 'Primitiva',
    source: 'components/ui/sonner.tsx',
    render: () => (
      <Row label="Una alla volta, in basso al centro, 3,2 s · icona accanto al testo">
        <Button variant="outline" onClick={() => toast('Link copiato negli appunti', { duration: 3200 })}>
          Neutra
        </Button>
        <Button variant="outline" onClick={() => toast.success('Valutazione salvata', { duration: 3200 })}>
          Esito positivo
        </Button>
        <Button variant="outline" onClick={() => toast.error('Invio non riuscito: controlla la connessione e riprova.', { duration: 3200 })}>
          Errore
        </Button>
      </Row>
    ),
  },
  {
    name: 'Avvisi',
    level: 'Pattern',
    source: 'components/patterns/InlineAlert.tsx (su ui/alert)',
    render: () => (
      <>
        <Row label="Riquadro — quattro toni, icona e parola, colore di accompagnamento">
          <div className="grid w-full max-w-lg gap-3">
            <InlineAlert tone="info">Sola lettura in questa versione: la modifica richiede il cambio ruolo.</InlineAlert>
            <InlineAlert tone="success">Scheda salvata. La trovi in Area Valutatore.</InlineAlert>
            <InlineAlert tone="warning" title="Backend lento">
              Le azioni potrebbero richiedere qualche secondo in più.
            </InlineAlert>
            <InlineAlert tone="destructive">Impossibile collegarsi al server Recruiting. Riprova più tardi o contatta l'amministratore.</InlineAlert>
          </div>
        </Row>
        <Row label="Riga di testo sotto un'azione">
          <InlineAlert layout="text">Invio non riuscito: l'indirizzo email del candidato manca.</InlineAlert>
        </Row>
      </>
    ),
  },
  {
    name: 'Navigazione',
    level: 'Primitiva',
    source: 'components/ui/tabs.tsx · toggle-group.tsx · progress.tsx · accordion.tsx · collapsible.tsx',
    render: () => (
      <Row label="Tabs, ToggleGroup, Progress, Accordion, Collapsible">
        <DisclosureDemo />
      </Row>
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
  {
    name: 'Table',
    level: 'Primitiva',
    source: 'components/ui/table.tsx',
    render: () => <TableDemo />,
  },
  {
    name: 'DataTable',
    level: 'Pattern',
    source: 'components/patterns/DataTable.tsx · FilterBar.tsx · FilterToggle.tsx',
    render: () => <DataTableDemo />,
  },
  {
    name: 'Sheet',
    level: 'Primitiva',
    source: 'components/ui/sheet.tsx',
    render: () => (
      <Row label="Pannello a destra, taglia md, conferma se ci sono modifiche">
        <SheetDemo />
      </Row>
    ),
  },
  {
    name: 'Stati',
    level: 'Pattern',
    source: 'components/patterns/EmptyState.tsx · LoadingState.tsx · ui/skeleton.tsx · ui/spinner.tsx',
    render: () => (
      <>
        <Row label="EmptyState md — cosa comparirà e come farlo comparire">
          <div className="w-full rounded-lg border border-border bg-card">
            <EmptyState
              icon={Users}
              title="Nessun dipendente trovato"
              description="Modifica i filtri di ricerca o aggiungi un nuovo dipendente."
              action={
                <Button size="sm">
                  <Plus />
                  Aggiungi dipendente
                </Button>
              }
            />
          </div>
        </Row>
        <Row label="EmptyState sm — dentro una card">
          <EmptyState size="sm" icon={ListChecks} description="Nessun colloquio ancora programmato." />
        </Row>
        <Row label="LoadingState — distinto dallo stato vuoto">
          <div className="w-full">
            <LoadingState />
          </div>
        </Row>
        <Row label="Skeleton · Spinner">
          <Skeleton className="h-8 w-40" />
          <Spinner />
          <Button disabled>
            <Spinner />
            Salvataggio…
          </Button>
        </Row>
      </>
    ),
  },
  {
    name: 'Avatar',
    level: 'Primitiva',
    source: 'components/ui/avatar.tsx · ui/separator.tsx · patterns/PersonRow.tsx',
    render: () => (
      <>
        <Row label="Initials sm · md · lg — neutre">
          <Initials first="Antonio" last="Bianchi" size="sm" />
          <Initials first="Antonio" last="Bianchi" />
          <Initials first="Antonio" last="Bianchi" size="lg" />
        </Row>
        <Row label="Separator">
          <Separator />
        </Row>
        <Row label="PersonRow — cliccabile, con valore a destra">
          <div className="w-full max-w-md">
            {PEOPLE.slice(0, 3).map((p) => (
              <PersonRow
                key={p.id}
                first={p.nome}
                last={p.cognome}
                meta={p.ruolo}
                onClick={() => toast(`Apre ${p.nome}`)}
                trailing={
                  <Badge tone={scoreTone(p.score)} dot>
                    {p.score.toFixed(1)}
                  </Badge>
                }
              />
            ))}
          </div>
        </Row>
        <Row label="Badge con onRemove — la ✕ è un bottone">
          <Badge onRemove={() => toast('Tolto')} removeLabel="Togli Sara Colombo dal confronto">
            Sara Colombo
          </Badge>
          <Badge onRemove={() => toast('Tolto')} removeLabel="Rimuovi valutatore">
            Marco Rossi
          </Badge>
        </Row>
      </>
    ),
  },
  {
    name: 'StatCard',
    level: 'Pattern',
    source: 'components/patterns/StatCard.tsx',
    render: () => (
      <>
        <Row label="Toni — neutral · accent (uno solo per gruppo) · fasce con la parola">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard icon={Target} label="Copertura ruoli" value="93%" progress={93} />
            <StatCard tone="accent" icon={Gauge} label="Punteggio complessivo" value="60%" progress={60} />
            <StatCard tone="success" label="Livello ottimale" value="17%" progress={17} />
            <StatCard tone="warning" label="Livello moderato" value="52%" progress={52} />
            <StatCard tone="destructive" label="Livello critico" value="31%" progress={31} />
            <StatCard tone="destructive" icon={MapPin} valueKind="text" label="Area più critica" value="Customer Service" note="Gap -1,7" />
          </div>
        </Row>
        <Row label="Taglie sm · md · lg, scarto, barra con la fascia, riquadro cliccabile">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard size="sm" label="Apertura mentale" value="5,9" progress={59} progressTone="warning" delta={{ label: '-0,6', direction: 'down', tone: 'destructive' }} />
            <StatCard label="Indice CSAT" value={92} unit="%" note="Soddisfazione media del cliente" delta={{ label: '1% vs periodo precedente', direction: 'up', tone: 'success' }} />
            <StatCard label="Valutazioni inviate" value={12} onClick={() => toast('Apre il dettaglio')} />
          </div>
        </Row>
        <Row label="surface=none — metriche in riga dentro un'altra card">
          <StatCard surface="none" size="sm" label="Ruoli a rischio" value={11} note="Copertura 93%" />
          <StatCard surface="none" size="sm" label="Da valorizzare" value={4} note="17% dell'organico" />
        </Row>
      </>
    ),
  },
  {
    name: 'DistributionBar',
    level: 'Pattern',
    source: 'components/patterns/DistributionBar.tsx',
    render: () => (
      <div className="w-full">
        <DistributionBar
          label="Distribuzione per fascia"
          segments={[
            { key: 'v', label: 'Alto Potenziale', pct: 17, tone: 'success' },
            { key: 't', label: 'Alto Valore', pct: 4, tone: 'success' },
            { key: 'c', label: 'Critici', pct: 9, tone: 'destructive' },
            { key: 's', label: 'Da Sviluppare', pct: 22, tone: 'warning' },
            { key: 'a', label: 'Nella Norma', pct: 48, tone: 'muted' },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'ChartCard',
    level: 'Pattern',
    source: 'components/patterns/ChartCard.tsx',
    render: () => (
      <div className="grid w-full grid-cols-1 gap-3">
        <ChartCard
          title="Andamento punteggio organizzativo"
          description="Apr — Set"
          headline={
            <>
              <span className="text-metric-lg tabular-nums">6,0/10</span>
              <Badge tone="success">+0,1 · +1,7%</Badge>
            </>
          }
          actions={
            <ToggleGroup type="single" value="media" aria-label="Vista">
              <ToggleGroupItem value="media">Media</ToggleGroupItem>
              <ToggleGroupItem value="benchmark">Benchmark</ToggleGroupItem>
            </ToggleGroup>
          }
        >
          <TrendChart title="Andamento" height="sm" scale={{ left: [0, 10] }} series={[{ key: 'v', label: 'Punteggio medio', kind: 'area' }, { key: 'b', label: 'Benchmark', reference: true }]} points={['Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set'].map((m, i) => ({ date: new Date(2026, 3 + i, 1), label: m, values: { v: [5.4, 5.6, 5.7, 5.8, 5.9, 6.0][i], b: 7 } }))} />
        </ChartCard>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ChartCard title="In caricamento" loading />
          <ChartCard title="Vuoto" empty={{ title: 'Nessuna valutazione ancora', description: "L'andamento compare dopo la prima valutazione completata." }} />
        </div>
      </div>
    ),
  },
  {
    name: 'PageHeader',
    level: 'Pattern',
    source: 'components/patterns/PageHeader.tsx',
    render: () => (
      <div className="w-full">
        <PageHeader
          level="page"
          title="Anagrafica Risorse"
          description="Elenco dipendenti, ruoli, mansioni e requisiti di ruolo"
          actions={
            <Button>
              <Plus />
              Aggiungi dipendente
            </Button>
          }
        />
        <PageHeader eyebrow="Customer care" title="Logica competenze Customer Care" description="Carico ticket, soddisfazione e competenze." />
        <PageHeader level="subsection" title="Sedi" description="Sedi operative dell'azienda" />
      </div>
    ),
  },
  {
    name: 'FolderCard',
    level: 'Pattern',
    source: 'components/patterns/FolderCard.tsx · SkillVisionCard.tsx',
    render: () => <HomeCardsDemo />,
  },
  {
    name: 'CrossModuleBanner',
    level: 'Pattern',
    source: 'components/patterns/CrossModuleBanner.tsx',
    render: () => (
      <div className="w-full">
        <CrossModuleBanner
          heading="Una sola lettura, mai due sistemi diversi."
          body="Assessment e Recruiting condividono gli stessi indicatori e le stesse priorità."
          ctaLabel="Apri Recruiting"
          ctaTo="/recruiting"
          secondaryLabel="Report completo"
          onSecondary={() => toast('Report')}
          stats={[
            { label: 'Area più critica', value: 'Customer Service', sub: '-1,7 dal benchmark' },
            { label: 'Da valorizzare', value: 4, sub: "17% dell'organico" },
          ]}
        />
      </div>
    ),
  },
  {
    name: 'Scelte a riquadro',
    level: 'Pattern',
    source: 'components/patterns/ChoiceCard.tsx · StepNav.tsx · PrefixedInput.tsx',
    render: () => <ChoiceCardsDemo />,
  },
  {
    name: 'Grafici',
    level: 'Pattern',
    source: 'components/patterns/ProfileRadar.tsx · CategoryBars.tsx · TrendChart.tsx (Bklit)',
    render: () => (
      <div className="grid w-full grid-cols-1 gap-6">
        <Row label="ProfileRadar — persona (chart-mono) contro profilo atteso (tratteggiato)">
          <div className="w-full">
            <ProfileRadar
              title="Big Five di Antonio Bianchi"
              axes={[{ key: 'O', label: 'Apertura' }, { key: 'C', label: 'Coscienziosità' }, { key: 'E', label: 'Estroversione' }, { key: 'A', label: 'Amicalità' }, { key: 'S', label: 'Stabilità' }]}
              series={[
                { label: 'Profilo atteso', reference: true, values: { O: 6.5, C: 6.5, E: 6.5, A: 6.5, S: 6.5 } },
                { label: 'Antonio Bianchi', values: { O: 5.2, C: 7.4, E: 4.1, A: 6.8, S: 5.9 } },
              ]}
            />
          </div>
        </Row>
        <Row label="ProfileRadar — tre fonti (famiglia categorica) più il benchmark">
          <div className="w-full">
            <ProfileRadar
              title="APEX 5D per fonte"
              axes={[{ key: 'O', label: 'Apertura' }, { key: 'C', label: 'Coscienziosità' }, { key: 'E', label: 'Estroversione' }, { key: 'A', label: 'Amicalità' }, { key: 'S', label: 'Stabilità' }]}
              series={[
                { label: 'Benchmark', reference: true, values: { O: 6.5, C: 6.5, E: 6.5, A: 6.5, S: 6.5 } },
                { label: 'Manager', values: { O: 6.1, C: 7.0, E: 5.3, A: 6.2, S: 6.0 } },
                { label: 'Peer', values: { O: 5.8, C: 6.4, E: 6.0, A: 7.1, S: 5.5 } },
                { label: 'Auto', values: { O: 7.2, C: 7.5, E: 6.8, A: 7.0, S: 6.9 } },
              ]}
            />
          </div>
        </Row>
        <Row label="CategoryBars — ottenuto contro atteso, fondo scala 10">
          <div className="w-full">
            <CategoryBars
              title="Big Five aziendale"
              valueMax={10}
              series={[{ key: 'ott', label: 'Ottenuto' }, { key: 'att', label: 'Atteso', reference: true }]}
              rows={[
                { label: 'Apertura', values: { ott: 5.9, att: 6.2 } },
                { label: 'Coscienziosità', values: { ott: 6.4, att: 6.3 } },
                { label: 'Estroversione', values: { ott: 5.1, att: 6.0 } },
              ]}
            />
          </div>
        </Row>
        <Row label="TrendChart — area (una serie) e benchmark tratteggiato">
          <div className="w-full">
            <TrendChart
              title="Andamento punteggio organizzativo"
              scale={{ left: [0, 10] }}
              series={[{ key: 'v', label: 'Punteggio medio', kind: 'area' }, { key: 'b', label: 'Benchmark', reference: true }]}
              points={['Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set'].map((m, i) => ({ date: new Date(2026, 3 + i, 1), label: m, values: { v: [5.4, 5.6, 5.7, 5.8, 5.9, 6.0][i], b: 7 } }))}
            />
          </div>
        </Row>
      </div>
    ),
  },
  {
    name: 'Guscio',
    level: 'Primitiva',
    source: 'components/ui/sidebar.tsx · patterns/CompanySwitcher.tsx · patterns/ModuleSwitcher.tsx',
    render: () => (
      <SidebarProvider>
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex h-96 flex-col overflow-hidden rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground">
            <SidebarHeader>
              <CompanySwitcher group={{ name: 'Gruppo Demo' }} companies={[{ id: 'a', name: 'Acme Corp' }, { id: 'b', name: 'Beta S.p.A.' }]} activeId="a" onChange={() => {}} />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>
                      <Target />
                      Voce attiva
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Users />
                      Anagrafica
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <ListChecks />
                      <span className="flex-1">Piani di sviluppo</span>
                      <SidebarMenuBadge>10</SidebarMenuBadge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Strumenti amministrazione</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>Voce disabilitata</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>23 dipendenti registrati</SidebarFooter>
          </div>
          <div className="flex flex-col gap-4">
            <Row label="ModuleSwitcher — solo con due moduli acquistati">
              <ModuleSwitcher />
            </Row>
            <Row label="CompanySwitcher — società singola">
              <div className="w-full">
                <CompanySwitcher companies={[{ id: 'a', name: 'Demo Company S.r.l.' }]} />
              </div>
            </Row>
          </div>
        </div>
      </SidebarProvider>
    ),
  },
  {
    name: 'Fasce',
    level: 'Pattern',
    source: 'components/patterns/IdoneitaBadge.tsx · ui/badge.tsx (strong)',
    render: () => (
      <>
        <Row label="Fasce di idoneità — la parola con il tono di stato">
          <IdoneitaBadge fascia="idoneo" />
          <IdoneitaBadge fascia="da-valutare" />
          <IdoneitaBadge fascia="non-idoneo" />
        </Row>
        <Row label="Fascia più alta di performance — neutro pieno contro neutro tenue">
          <Badge tone="strong" dot>Top Talent</Badge>
          <Badge dot>Persona adeguata</Badge>
          <StatCard tone="strong" size="sm" label="Alto valore" value={3} note="13%" progress={13} />
        </Row>
      </>
    ),
  },
  {
    name: 'Indicatori',
    level: 'Pattern',
    source: 'components/patterns/ScoreGauge.tsx · CompletionRing.tsx · ScatterMatrix.tsx',
    render: () => (
      <div className="grid w-full grid-cols-1 gap-6">
        <Row label="ScoreGauge e CompletionRing, dentro uno StatCard">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard tone="accent" size="lg" icon={Gauge} label="Punteggio complessivo" value="60%">
              <ScoreGauge value={60} label="Punteggio complessivo" />
            </StatCard>
            <StatCard icon={Target} label="Copertura mansioni" value="93%">
              <CompletionRing value={93} label="Copertura mansioni" />
            </StatCard>
          </div>
        </Row>
        <Row label="ScatterMatrix — forma e colore per fascia, soglie diagonali (indice = media dei due assi)">
          <div className="w-full">
            <ScatterMatrix
              title="Matrice di classificazione"
              xLabel="Competenze Trasversali"
              yLabel="Competenze Professionali"
              groups={[
                { key: 'top', label: 'Top Talent', color: 'var(--foreground)' },
                { key: 'val', label: 'Talento da valorizzare', color: 'var(--success)' },
                { key: 'ade', label: 'Persona adeguata', color: 'var(--chart-compare)' },
                { key: 'cri', label: 'Persona critica', color: 'var(--destructive)' },
              ]}
              points={PEOPLE.map((p, i) => {
                const y = [3.4, 6.1, 7.2, 5.9, 8.4][i]
                const idx = (p.score + y) / 2
                return { id: p.id, label: `${p.nome} ${p.cognome}`, x: p.score, y, group: idx >= 8 ? 'top' : idx >= 7 ? 'val' : idx >= 5 ? 'ade' : 'cri' }
              })}
              thresholds={[
                { value: 8, label: 'Top Talent' },
                { value: 7, label: 'Talento da valorizzare' },
                { value: 5, label: 'Persona adeguata' },
              ]}
              onPointClick={(id) => toast(`Apre la scheda ${id}`)}
            />
          </div>
        </Row>
      </div>
    ),
  },
  {
    name: 'Invia link test',
    level: 'Pattern',
    source: 'components/patterns/SendTestLinkBar.tsx · DataTable (selection)',
    render: () => <SendTestLinkDemo />,
  },
  {
    name: 'Accesso',
    level: 'Pattern',
    source: 'components/patterns/LoginForm.tsx · pages/LoginPage.tsx (Fase 8)',
    render: () => (
      <div className="flex flex-col gap-6">
        <Row label="Vuoto — il bottone si accende con email e password">
          <LoginForm onSubmit={(email) => toast(`Accesso di ${email}`)} />
        </Row>
        <Row label="Credenziali errate — non dice se l'email esiste">
          <LoginForm onSubmit={() => undefined} error={{ kind: 'invalid' }} />
        </Row>
        <Row label="Troppi tentativi — dice fra quanto riprovare (Retry-After)">
          <LoginForm onSubmit={() => undefined} error={{ kind: 'locked', retryAfterSec: 840 }} />
        </Row>
        <Row label="In corso e server non raggiungibile">
          <LoginForm onSubmit={() => undefined} pending />
          <LoginForm onSubmit={() => undefined} error={{ kind: 'network' }} />
        </Row>
      </div>
    ),
  },
]

function Panel({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <div data-portal-scope className={`${mode === 'dark' ? 'dark' : ''} flex min-w-0 flex-col gap-8 bg-background p-6 text-foreground`}>
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
          <p className="max-w-2xl text-app-body text-muted-foreground">Ogni primitiva e ogni pattern della libreria, con varianti e stati, in chiaro e in scuro. Premi Tab per vedere il focus.</p>
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

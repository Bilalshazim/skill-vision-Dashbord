import { RefreshCw, Search, ShieldAlert, Unplug, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { DataTable, type DataTableColumn } from '@/components/patterns/DataTable'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Field } from '@/components/patterns/Field'
import { FilterBar } from '@/components/patterns/FilterBar'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { LoadingState } from '@/components/patterns/LoadingState'
import { PageHeader } from '@/components/patterns/PageHeader'
import { SelectField } from '@/components/patterns/SelectField'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApiError, getBackendUser } from '@/lib/api/client'
import { isBackendAuth } from '@/lib/auth/auth-mode'
import { originalSkillsApi, type OriginalSkillsCompany, type OriginalSkillsPerson, type OriginalSkillsResults } from '@/lib/api/endpoints'
import { useBackendSession } from '@/lib/api/useBackendSession'

// Anteprima in sola lettura del Comitato scientifico (già "Original Skills"; PROPOSTA-ORIGINAL-SKILLS.md):
// il server legge l'API al momento e non salva niente. Solo per gli
// amministratori della piattaforma, finché i dati non hanno una società vera
// a cui appartenere.

const isoDay = (d: Date) => d.toISOString().slice(0, 10)
const fmt = (n: number | null, digits = 2) => (n === null ? '—' : n.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits }))
const signed = (n: number | null) => (n === null ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n))}`)
const fullName = (p: OriginalSkillsPerson) => `${p.lastName} ${p.firstName}`.trim()
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—')
// Quante competenze del ruolo raggiungono il valore atteso: dice qualcosa
// senza affidarlo a un colore.
const aboveExpected = (p: OriginalSkillsPerson) => p.roleCompetencies.filter((c) => c.diff !== null && c.diff >= 0).length

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.network) return 'Impossibile contattare il server. Controlla la connessione e riprova.'
    if (err.status === 502) return 'Il Comitato scientifico non ha risposto correttamente. Riprova fra qualche minuto.'
    return err.message
  }
  return err instanceof Error ? err.message : 'Errore sconosciuto'
}

function Header() {
  return (
    <PageHeader
      level="page"
      eyebrow="Comitato scientifico"
      title="Anteprima risultati"
      description="Lettura al momento dal sistema del Comitato scientifico. Niente viene salvato nella piattaforma."
    />
  )
}

export default function OriginalSkillsPreviewPage() {
  // Stesso motivo di CipAdminPage: il ruolo va letto da uno stato che
  // si aggiorna quando la sessione è pronta.
  const backend = useBackendSession()
  // CLAUDE.md: dati di persone reali solo dietro il login vero, mai col ponte legacy.
  const isPlatformAdmin = isBackendAuth() && getBackendUser()?.role === 'PLATFORM_ADMIN'

  const [companies, setCompanies] = useState<OriginalSkillsCompany[]>([])
  const [maxDays, setMaxDays] = useState(89)
  const [disabled, setDisabled] = useState(false)
  const [setupError, setSetupError] = useState('')

  const [to, setTo] = useState(() => isoDay(new Date()))
  const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - 30 * 86_400_000)))
  const [company, setCompany] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [data, setData] = useState<OriginalSkillsResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<OriginalSkillsPerson | null>(null)

  useEffect(() => {
    if (backend.status !== 'connected' || !isPlatformAdmin) return
    let cancelled = false
    originalSkillsApi
      .companies()
      .then((r) => {
        if (cancelled) return
        setCompanies(r.companies)
        setMaxDays(r.maxRangeDays)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.code === 'service_disabled') setDisabled(true)
        else setSetupError(errorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [backend.status, isPlatformAdmin])

  const span = (Date.parse(to) - Date.parse(from)) / 86_400_000
  const rangeError = !from || !to ? 'Indica le due date.' : span < 0 ? '«Dal» deve precedere «al».' : span > maxDays ? `Al massimo ${maxDays} giorni: il Comitato scientifico non accetta intervalli più lunghi.` : ''

  async function load() {
    if (rangeError || loading) return
    setLoading(true)
    setError('')
    try {
      setData(await originalSkillsApi.results({ from, to, company: company || undefined }))
      setPage(1)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const labelOf = useMemo(() => new Map(companies.map((c) => [c.key, c.label])), [companies])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.people ?? []).filter((p) => !q || fullName(p).toLowerCase().includes(q))
  }, [data, search])

  const columns: DataTableColumn<OriginalSkillsPerson>[] = [
    {
      key: 'name',
      header: 'Persona',
      // La lente accanto al nome apre subito tutti i dati del Comitato
      // scientifico per quella persona (competenze, scarti, risultato).
      cell: (p) => (
        <span className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Apri tutti i dati di ${fullName(p)}`}
            onClick={(e) => {
              e.stopPropagation()
              setOpen(p)
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Search aria-hidden="true" />
          </Button>
          <span className="truncate">{fullName(p)}</span>
        </span>
      ),
      truncate: 'md',
    },
    { key: 'company', header: 'Società', cell: (p) => labelOf.get(p.companyKey) ?? p.companyKey, emphasis: 'muted', truncate: 'sm' },
    { key: 'site', header: 'Sede', cell: (p) => p.site || '—', emphasis: 'muted', truncate: 'sm' },
    { key: 'result', header: 'Risultato', cell: (p) => <span className="font-mono tabular-nums">{fmt(p.result, 3)}</span>, align: 'end', nowrap: true },
    {
      key: 'role',
      header: 'Ruolo ≥ atteso',
      cell: (p) => <span className="font-mono tabular-nums">{p.roleCompetencies.length ? `${aboveExpected(p)} / ${p.roleCompetencies.length}` : '—'}</span>,
      align: 'end',
      nowrap: true,
    },
    { key: 'updated', header: 'Ultima modifica', cell: (p) => day(p.updatedAt), emphasis: 'muted', nowrap: true },
  ]

  if (backend.status === 'checking') {
    return (
      <div className="flex flex-col gap-4">
        <Header />
        <LoadingState label="Verifica sessione…" />
      </div>
    )
  }

  if (!isPlatformAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <Header />
        <Card>
          <EmptyState size="sm" icon={ShieldAlert} description="Anteprima riservata agli amministratori della piattaforma." />
        </Card>
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="flex flex-col gap-4">
        <Header />
        <Card>
          <EmptyState
            icon={Unplug}
            title="Integrazione spenta"
            description="L'integrazione con il Comitato scientifico non è attiva su questo ambiente. Chiedi all'amministratore della piattaforma di attivarla."
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Header />
      {setupError && <InlineAlert>{setupError}</InlineAlert>}

      <Card padding="md">
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void load()
          }}
        >
          <Field label="Dal">
            <Input type="date" size="sm" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Al">
            <Input type="date" size="sm" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Società">
            <SelectField value={company} onValueChange={setCompany} size="sm" className="min-w-48">
              <option value="">Tutte</option>
              {companies.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </SelectField>
          </Field>
          <Button type="submit" size="sm" disabled={!!rangeError || loading}>
            <RefreshCw aria-hidden="true" />
            {data ? 'Aggiorna' : 'Leggi i risultati'}
          </Button>
        </form>
        {rangeError && (
          <InlineAlert layout="text" tone="warning" className="mt-3">
            {rangeError}
          </InlineAlert>
        )}
      </Card>

      {error && <InlineAlert>{error}</InlineAlert>}

      {data && (data.discardedRows > 0 || data.invalidRows > 0) && (
        <InlineAlert tone="info">
          {data.discardedRows > 0 && `${data.discardedRows} righe di società non richieste sono state escluse. `}
          {data.invalidRows > 0 && `${data.invalidRows} righe illeggibili sono state ignorate.`}
        </InlineAlert>
      )}

      {data && <FilterBar search={{ value: search, onChange: (v) => (setSearch(v), setPage(1)), placeholder: 'Cerca per nome' }} />}

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(p) => `${p.companyKey}:${p.interviewId}`}
        onRowClick={setOpen}
        rowLabel={(p) => `Apri le competenze di ${fullName(p)}`}
        loading={loading}
        loadingLabel="Lettura dal Comitato scientifico…"
        pagination={{
          page,
          pageSize: 25,
          onPageChange: setPage,
          labels: {
            showing: (a, b, n) => `${a}–${b} di ${n}`,
            pageOf: (p, n) => `Pagina ${p} di ${n}`,
            prev: 'Pagina precedente',
            next: 'Pagina successiva',
          },
        }}
        empty={
          <EmptyState
            icon={Users}
            title={data ? 'Nessun risultato nell’intervallo' : 'Nessuna lettura ancora'}
            description={
              data
                ? 'Il Comitato scientifico non ha questionari completati fra queste date. Allarga l’intervallo o cambia società.'
                : 'Scegli le date e premi «Leggi i risultati»: compariranno qui le persone con il loro punteggio.'
            }
          />
        }
      />

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" size="md">
          {open && <PersonDetail person={open} companyLabel={labelOf.get(open.companyKey) ?? open.companyKey} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function PersonDetail({ person, companyLabel }: { person: OriginalSkillsPerson; companyLabel: string }) {
  const role: DataTableColumn<OriginalSkillsPerson['roleCompetencies'][number]>[] = [
    { key: 'name', header: 'Competenza', cell: (c) => c.name },
    { key: 'score', header: 'Punteggio', cell: (c) => <span className="font-mono tabular-nums">{fmt(c.score)}</span>, align: 'end', nowrap: true },
    { key: 'expected', header: 'Atteso', cell: (c) => <span className="font-mono tabular-nums">{fmt(c.expected)}</span>, align: 'end', emphasis: 'muted', nowrap: true },
    { key: 'diff', header: 'Scarto', cell: (c) => <span className="font-mono tabular-nums">{signed(c.diff)}</span>, align: 'end', nowrap: true },
  ]
  const all: DataTableColumn<OriginalSkillsPerson['competencies'][number]>[] = [
    { key: 'name', header: 'Competenza', cell: (c) => c.name },
    { key: 'score', header: 'Punteggio', cell: (c) => <span className="font-mono tabular-nums">{fmt(c.score)}</span>, align: 'end', nowrap: true },
  ]
  return (
    <>
      <SheetHeader>
        <SheetTitle>{fullName(person)}</SheetTitle>
        <SheetDescription>
          {companyLabel}
          {person.site ? ` · ${person.site}` : ''} · risultato {fmt(person.result, 3)}
        </SheetDescription>
      </SheetHeader>
      <SheetBody className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h3 className="text-app-subtitle text-foreground">Competenze del ruolo</h3>
          <DataTable
            columns={role}
            rows={person.roleCompetencies}
            getRowId={(c) => c.name}
            empty={<EmptyState size="sm" description="Il Comitato scientifico non ha indicato competenze di ruolo per questa persona." />}
          />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-app-subtitle text-foreground">Tutte le competenze</h3>
          <DataTable
            columns={all}
            rows={person.competencies}
            getRowId={(c) => c.name}
            empty={<EmptyState size="sm" description="Nessuna competenza nel questionario." />}
          />
        </section>
      </SheetBody>
    </>
  )
}

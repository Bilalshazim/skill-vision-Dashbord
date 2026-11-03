import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, KeyRound, Pencil, UserPlus, Wand2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { DataTable, type DataTableColumn } from '@/components/patterns/DataTable'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Hint } from '@/components/patterns/Hint'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { PasswordInput } from '@/components/patterns/PasswordInput'
import { SelectField } from '@/components/patterns/SelectField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getBackendUser } from '@/lib/api/client'
import { companiesApi, type ManagedUser, type ManagedUserRole, usersApi } from '@/lib/api/endpoints'
import { generatePassword, PASSWORD_RULE_HINT, passwordProblem } from '@/lib/auth/passwordRules'
import { logout } from '@/lib/auth/session'

// Impostazioni → Utenti: elenco, nuovo utente, modifica, nuova password.
// Solo per lo staff Skill-Vision (PLATFORM_ADMIN): lo decide il server
// (backend modules/users), la Topbar mostra la scheda solo a loro.
// Le password non si vedono mai: il server ne tiene solo l'hash. Si può
// solo sceglierne una nuova. Cambiarla, o cambiare ruolo, società o stato,
// fa uscire subito quell'utente — anche chi la cambia per sé.
// Una password data a un altro utente è provvisoria: al primo accesso ne
// sceglie una sua (FirstAccessPage). Creando un utente la password si può
// lasciare vuota: la genera il server e si vede qui una volta sola.

// I ruoli del backend con il loro nome a schermo e cosa possono fare.
const ROLE_LABEL: Record<ManagedUserRole, string> = {
  PLATFORM_ADMIN: 'Amministratore piattaforma',
  COMPANY_ADMIN: 'Amministratore società',
  RECRUITER: 'Operatore',
  EVALUATOR: 'Valutatore',
  READONLY: 'Sola lettura',
}
const ROLE_HINT: Record<ManagedUserRole, string> = {
  PLATFORM_ADMIN: 'Vede e gestisce tutte le società e gli utenti.',
  COMPANY_ADMIN: 'Gestisce la sua società: ricerche, assessment, configurazione.',
  RECRUITER: 'Lavora su ricerche e candidati della sua società.',
  EVALUATOR: 'Compila solo le valutazioni che gli sono assegnate.',
  READONLY: 'Consulta i dati della sua società senza modificarli.',
}
const ROLES = Object.keys(ROLE_LABEL) as ManagedUserRole[]

const STATUS: Record<ManagedUser['status'], { label: string; tone: 'success' | 'neutral' | 'warning' }> = {
  ACTIVE: { label: 'Attivo', tone: 'success' },
  DISABLED: { label: 'Disattivato', tone: 'neutral' },
  INVITED: { label: 'Invitato', tone: 'warning' },
}

const USERS_KEY = ['settings', 'users'] as const
// L'elenco si aggiorna da solo mentre la scheda è aperta: chi lavora in due
// vede le modifiche dell'altro senza ricaricare.
const REFRESH_MS = 10_000

// Il server antepone il nome del campo ("password: …"): a schermo basta il motivo.
const errorText = (err: unknown) => (err instanceof Error ? err.message.replace(/^\w+: /, '') : 'Operazione non riuscita. Riprova.')

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : 'Mai')

type View = { kind: 'list' } | { kind: 'create' } | { kind: 'created'; user: ManagedUser; password: string } | { kind: 'edit'; user: ManagedUser } | { kind: 'password'; user: ManagedUser }

export function UsersSettings({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const [view, setView] = useState<View>({ kind: 'list' })
  const users = useQuery({ queryKey: USERS_KEY, queryFn: usersApi.list, refetchInterval: view.kind === 'list' ? REFRESH_MS : false, staleTime: 0 })
  const back = () => {
    onDirtyChange?.(false)
    setView({ kind: 'list' })
  }

  if (view.kind === 'create') return <UserForm onDone={back} onCreated={(user, password) => setView({ kind: 'created', user, password })} onDirtyChange={onDirtyChange} />
  if (view.kind === 'created') return <CreatedCredentials user={view.user} password={view.password} onDone={back} />
  if (view.kind === 'edit') return <UserForm user={view.user} onDone={back} onDirtyChange={onDirtyChange} />
  if (view.kind === 'password') return <PasswordForm user={view.user} onDone={back} onDirtyChange={onDirtyChange} />

  const me = getBackendUser()?.id
  const columns: DataTableColumn<ManagedUser>[] = [
    {
      key: 'name',
      header: 'Nome',
      cell: (u) => (
        <div className="flex flex-col">
          <span className="text-foreground">
            {u.fullName}
            {u.id === me ? <span className="text-muted-foreground"> · tu</span> : null}
          </span>
          {u.designation ? <span className="text-app-caption text-muted-foreground">{u.designation}</span> : null}
        </div>
      ),
    },
    {
      key: 'login',
      header: 'Accesso',
      emphasis: 'muted',
      cell: (u) => (
        <div className="flex flex-col">
          <span>{u.email}</span>
          {u.username ? <span className="text-app-caption">{u.username}</span> : null}
        </div>
      ),
    },
    { key: 'role', header: 'Ruolo', cell: (u) => ROLE_LABEL[u.role] },
    { key: 'company', header: 'Società', cell: (u) => u.company?.name ?? 'Tutte', emphasis: 'muted' },
    { key: 'status', header: 'Stato', cell: (u) =>
        u.status === 'ACTIVE' && u.mustChangePassword ? (
          <Badge tone="warning">Primo accesso</Badge>
        ) : (
          <Badge tone={STATUS[u.status].tone}>{STATUS[u.status].label}</Badge>
        ),
    },
    { key: 'last', header: 'Ultimo accesso', cell: (u) => formatDate(u.lastLoginAt), emphasis: 'muted', nowrap: true },
    {
      key: 'actions',
      header: <span className="sr-only">Azioni</span>,
      nowrap: true,
      cell: (u) => (
        <div className="flex gap-1">
          <Hint label="Modifica">
            <Button variant="ghost" size="icon-sm" onClick={() => setView({ kind: 'edit', user: u })} aria-label={`Modifica ${u.fullName}`}>
              <Pencil />
            </Button>
          </Hint>
          <Hint label="Cambia password">
            <Button variant="ghost" size="icon-sm" onClick={() => setView({ kind: 'password', user: u })} aria-label={`Cambia la password di ${u.fullName}`}>
              <KeyRound />
            </Button>
          </Hint>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-app-small text-muted-foreground">
          {users.data ? `${users.data.length} utenti. ` : ''}Le password non si vedono: se ne sceglie una nuova, che l’utente cambia al primo accesso.
        </p>
        <Button onClick={() => setView({ kind: 'create' })}>
          <UserPlus /> Nuovo utente
        </Button>
      </div>
      {users.isError ? (
        <InlineAlert tone="destructive">Elenco non disponibile: {errorText(users.error)}</InlineAlert>
      ) : (
        <DataTable
          columns={columns}
          rows={users.data ?? []}
          getRowId={(u) => u.id}
          loading={users.isPending}
          loadingLabel="Caricamento degli utenti…"
          empty="Nessun utente. Creane uno con «Nuovo utente»."
        />
      )}
    </div>
  )
}

// Dopo «Crea utente»: i dati da consegnare, con la password provvisoria.
// Si vede solo qui e solo ora: il server ne tiene l'hash.
function CreatedCredentials({ user, password, onDone }: { user: ManagedUser; password: string; onDone: () => void }) {
  const text = [`Accesso a Skill-Vision: ${window.location.origin}/login`, `Email: ${user.email}`, ...(user.username ? [`Nome utente: ${user.username}`] : []), `Password provvisoria: ${password}`].join('\n')
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Dati di accesso copiati.')
    } catch {
      toast.error('Copia non riuscita: seleziona il testo e copialo a mano.')
    }
  }
  return (
    <div className="flex flex-col gap-6">
      <BackHeader title={`Utente creato: ${user.fullName}`} sub="Consegna questi dati all’utente. Al primo accesso sceglie una password sua." onBack={onDone} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-app-body">
        <dt className="label-mono text-muted-foreground">Email</dt>
        <dd className="text-foreground">{user.email}</dd>
        {user.username ? (
          <>
            <dt className="label-mono text-muted-foreground">Nome utente</dt>
            <dd className="text-foreground">{user.username}</dd>
          </>
        ) : null}
        <dt className="label-mono text-muted-foreground">Password provvisoria</dt>
        <dd className="font-mono text-foreground select-all">{password}</dd>
      </dl>
      <InlineAlert tone="warning" layout="text">
        La password provvisoria si vede solo ora. Se la perdi, ne scegli una nuova con «Cambia password».
      </InlineAlert>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => void copy()}>
          <Copy /> Copia i dati di accesso
        </Button>
        <Button type="button" onClick={onDone}>
          Fatto
        </Button>
      </div>
    </div>
  )
}

function BackHeader({ title, sub, onBack }: { title: string; sub?: string; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft /> Tutti gli utenti
        </Button>
      </div>
      <p className="text-app-section text-foreground">{title}</p>
      {sub ? <p className="text-app-small text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function UserForm({
  user,
  onDone,
  onCreated,
  onDirtyChange,
}: {
  user?: ManagedUser
  onDone: () => void
  onCreated?: (user: ManagedUser, password: string) => void
  onDirtyChange?: (dirty: boolean) => void
}) {
  const queryClient = useQueryClient()
  const companies = useQuery({ queryKey: ['settings', 'companies'], queryFn: companiesApi.list })
  const [email, setEmail] = useState(user?.email ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [designation, setDesignation] = useState(user?.designation ?? '')
  const [role, setRole] = useState<ManagedUserRole>(user?.role ?? 'RECRUITER')
  const [companyId, setCompanyId] = useState(user?.companyId ?? '')
  const [status, setStatus] = useState<'ACTIVE' | 'DISABLED'>(user?.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE')
  const [password, setPassword] = useState('')
  const [tried, setTried] = useState(false)

  const dirty =
    email !== (user?.email ?? '') ||
    username !== (user?.username ?? '') ||
    fullName !== (user?.fullName ?? '') ||
    designation !== (user?.designation ?? '') ||
    role !== (user?.role ?? 'RECRUITER') ||
    companyId !== (user?.companyId ?? '') ||
    (!!user && status !== (user.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE')) ||
    password !== ''
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange])

  const needsCompany = role !== 'PLATFORM_ADMIN'
  const errors = {
    email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? null : 'Scrivi un indirizzo email valido.',
    username: !username.trim() || /^[a-z0-9._-]{3,40}$/i.test(username.trim()) ? null : 'Da 3 a 40 caratteri: lettere, cifre, punto, trattino o trattino basso.',
    fullName: fullName.trim() ? null : 'Scrivi nome e cognome.',
    companyId: !needsCompany || companyId ? null : 'Scegli la società.',
    // Vuota: la genera il server.
    password: user || !password ? null : passwordProblem(password),
  }
  const valid = Object.values(errors).every((e) => !e)
  const accessChanges = !!user && (role !== user.role || (needsCompany ? companyId : '') !== (user.companyId ?? '') || status !== (user.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE'))
  const self = !!user && user.id === getBackendUser()?.id

  const save = useMutation({
    mutationFn: () => {
      const body = {
        email: email.trim(),
        username: username.trim() ? username.trim().toLowerCase() : null,
        fullName: fullName.trim(),
        designation: designation.trim() || null,
        role,
        companyId: needsCompany ? companyId : null,
      }
      return user ? usersApi.update(user.id, { ...body, status }) : usersApi.create({ ...body, ...(password ? { password } : {}) })
    },
    onSuccess: async (saved) => {
      onDirtyChange?.(false)
      if (self && accessChanges) {
        toast.success('Accesso modificato: rientra con il nuovo ruolo.')
        await logout()
        window.location.replace('/login')
        return
      }
      await queryClient.invalidateQueries({ queryKey: USERS_KEY })
      if (!user && onCreated) {
        // La password da consegnare: quella scritta qui o quella generata dal server.
        const temp = (saved as { temporaryPassword?: string }).temporaryPassword ?? password
        onCreated(saved, temp)
        return
      }
      toast.success(`${saved.fullName}: modifiche salvate.`)
      onDone()
    },
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    setTried(true)
    if (valid && !save.isPending) save.mutate()
  }
  const show = (k: keyof typeof errors) => (tried ? errors[k] : null)

  return (
    <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
      <BackHeader title={user ? `Modifica ${user.fullName}` : 'Nuovo utente'} sub={user ? undefined : 'Entra con l’email o con il nome utente. La password è provvisoria: al primo accesso ne sceglie una sua.'} onBack={onDone} />
      <FieldGrid>
        <Field label="Nome e cognome" required error={show('fullName')}>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Mansione" hint="Facoltativa, solo descrittiva: i permessi vengono dal ruolo.">
          <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Es. Responsabile HR" autoComplete="off" />
        </Field>
        <Field label="Email" required error={show('email')}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Nome utente" hint="Facoltativo, per entrare senza l’email." error={show('username')}>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Es. mario.rossi" autoCapitalize="none" spellCheck={false} autoComplete="off" />
        </Field>
        <Field label="Ruolo" required hint={ROLE_HINT[role]}>
          <SelectField value={role} onValueChange={(v) => setRole(v as ManagedUserRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </SelectField>
        </Field>
        {needsCompany ? (
          <Field label="Società" required error={show('companyId')} hint={companies.isError ? 'Elenco delle società non disponibile.' : undefined}>
            <SelectField value={companyId} onValueChange={setCompanyId} placeholder={companies.isPending ? 'Caricamento…' : 'Scegli la società'}>
              {(companies.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          </Field>
        ) : null}
        {user ? (
          <Field label="Stato" hint="Un utente disattivato non può entrare. I suoi dati restano.">
            <SelectField value={status} onValueChange={(v) => setStatus(v as 'ACTIVE' | 'DISABLED')}>
              <option value="ACTIVE">Attivo</option>
              <option value="DISABLED">Disattivato</option>
            </SelectField>
          </Field>
        ) : (
          <Field label="Password provvisoria" error={show('password')} hint={`Facoltativa: se la lasci vuota la genera il sistema. ${PASSWORD_RULE_HINT}`}>
            <PasswordInput value={password} onChange={setPassword} />
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => setPassword(generatePassword())}>
                <Wand2 /> Genera
              </Button>
            </div>
          </Field>
        )}
      </FieldGrid>
      {accessChanges ? (
        <InlineAlert tone="warning" layout="text">
          {self ? 'Cambi il tuo accesso: al salvataggio esci e rientri.' : 'Cambiano i permessi: l’utente esce subito e rientra con i nuovi.'}
        </InlineAlert>
      ) : null}
      {save.isError ? <InlineAlert tone="destructive">{errorText(save.error)}</InlineAlert> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Salvataggio…' : user ? 'Salva le modifiche' : 'Crea utente'}
        </Button>
      </div>
    </form>
  )
}

function PasswordForm({ user, onDone, onDirtyChange }: { user: ManagedUser; onDone: () => void; onDirtyChange?: (dirty: boolean) => void }) {
  const queryClient = useQueryClient()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [tried, setTried] = useState(false)
  const self = user.id === getBackendUser()?.id
  useEffect(() => onDirtyChange?.(password !== '' || repeat !== ''), [password, repeat, onDirtyChange])

  const problem = passwordProblem(password)
  const mismatch = repeat !== password ? 'Le due password non coincidono.' : null

  const save = useMutation({
    mutationFn: () => usersApi.setPassword(user.id, password),
    onSuccess: async () => {
      onDirtyChange?.(false)
      if (self) {
        toast.success('Password cambiata. Rientra con la nuova.')
        await logout()
        window.location.replace('/login')
        return
      }
      toast.success(`Password di ${user.fullName} cambiata. È uscito da tutte le sessioni aperte.`)
      await queryClient.invalidateQueries({ queryKey: USERS_KEY })
      onDone()
    },
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    setTried(true)
    if (!problem && !mismatch && !save.isPending) save.mutate()
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
      <BackHeader
        title={`Nuova password per ${user.fullName}`}
        sub={self ? 'È la tua: al salvataggio esci e rientri con quella nuova.' : `${user.email} esce subito da tutte le sessioni aperte. La nuova è provvisoria: al prossimo accesso ne sceglie una sua.`}
        onBack={onDone}
      />
      <FieldGrid>
        <Field label="Nuova password" required error={tried ? problem : null} hint={PASSWORD_RULE_HINT}>
          <PasswordInput value={password} onChange={setPassword} />
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const pw = generatePassword()
                setPassword(pw)
                setRepeat(pw)
              }}
            >
              <Wand2 /> Genera
            </Button>
          </div>
        </Field>
        <Field label="Ripeti la password" required error={tried ? mismatch : null}>
          <PasswordInput value={repeat} onChange={setRepeat} />
        </Field>
      </FieldGrid>
      {save.isError ? <InlineAlert tone="destructive">{errorText(save.error)}</InlineAlert> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Salvataggio…' : 'Cambia password'}
        </Button>
      </div>
    </form>
  )
}

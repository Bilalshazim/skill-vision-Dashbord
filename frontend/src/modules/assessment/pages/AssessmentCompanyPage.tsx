import { useEffect, useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Note } from '@/components/patterns/Note'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Icon } from '@/modules/assessment/components/Icon'
import { RoiDataSection } from '@/modules/assessment/components/RoiDataSection'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { errorReason } from '@/modules/assessment/lib/server-sync'
import { useRoi } from '@/modules/assessment/lib/use-roi'
import type { AssessmentState, CompanyDetails } from '@/modules/assessment/lib/types'

// Dati aziendali, di nuovo una pagina sua sotto «Analisi predittiva» (Decisioni di Roberto del
// 2026-11-12). Dall'alto: la finestra unica «Dati dell'azienda», i Ruoli chiave come prima, il
// bilancio in fondo. Escono dalla pagina, non dai dati: il totale dipendenti per tipologia, Sedi
// e Contatti (il loro contenuto parte nella finestra unica), durata dell'esercizio, compenso,
// costo delle azioni, turnover, assenze e la riga dell'atteso (RoiDataSection).
//
// Un dato una volta sola: nome e partita IVA della società esistono già sul server (la società
// dell'account). Scriverli dalla finestra cambierebbe il nome della società ovunque, che è la
// «fonte unica» della proposta D, in attesa di Roberto: qui la finestra parte da quei dati se è
// vuota e salva nel profilo aziendale di Assessment, senza toccare la società.
//
// 2026-11-13 (Roberto): tornano tre campi per il calcolo degli euro, % turnover, % assenteismo +
// malattia e Valore del contratto, salvati nei dati del motore ROI (turn, ass, inv) e non nel
// profilo. Il «Salva» della finestra scrive profilo e dati ROI direttamente sul server e dice
// «salvati» solo dopo la risposta: in produzione il salvataggio passava dalla coda comune e non
// arrivava. Impaginazione più compatta per lo schermo di un portatile.
type RoiFields = { turn: string; ass: string; inv: string }
const fmt = (n: number | undefined) => (n == null ? '' : String(n))

export default function AssessmentCompanyPage() {
  const { state, ui, canEdit, company, saveCompanyProfile, toast } = useAssessment()
  const roi = useRoi()
  const [roiFields, setRoiFields] = useState<RoiFields | null>(null)
  // I tre campi partono dai dati salvati, quando arrivano; poi restano quelli scritti.
  useEffect(() => {
    if (roi.data && roiFields === null) setRoiFields({ turn: fmt(roi.data.turn), ass: fmt(roi.data.ass), inv: fmt(roi.data.inv) })
  }, [roi.data, roiFields])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // Un profilo mai salvato arriva dal server come {}: vale come vuoto e parte dai dati presenti.
  const raw = state.company.details
  const saved = raw && Object.keys(raw).length ? { ...EMPTY, ...raw, otherSites: Array.isArray(raw.otherSites) ? raw.otherSites : [] } : null
  const [draft, setDraft] = useState<CompanyDetails>(() => saved ?? prefill(state, company?.name, company?.vatNumber))
  const prefilled = !saved && !!(draft.name || draft.address || draft.email)
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyDetails | keyof RoiFields, string>>>({})
  const [roles, setRoles] = useState(() => ({ referente: state.company.referente, ceo: state.company.ceo, cfo: state.company.cfo }))
  const [savedNote, setSavedNote] = useState(false)

  const set = <K extends keyof CompanyDetails>(k: K, v: CompanyDetails[K]) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setSavedNote(false)
  }
  const num = (v: string): number | null => (v.trim() === '' ? null : Number(v))

  const setRoi = (k: keyof RoiFields, v: string) => {
    setRoiFields((f) => ({ ...(f ?? { turn: '', ass: '', inv: '' }), [k]: v }))
    setSavedNote(false)
  }
  // Un campo vuoto non si salva come 0: resta com'era nei dati (nessun valore inventato).
  const roiNum = (v: string | undefined) => (v == null || v.trim() === '' ? undefined : Number(v.replace(',', '.')))

  function validate(d: CompanyDetails) {
    const e: Partial<Record<keyof CompanyDetails | keyof RoiFields, string>> = {}
    for (const k of ['turn', 'ass'] as const) {
      const n = roiNum(roiFields?.[k])
      if (n !== undefined && !(Number.isFinite(n) && n >= 0 && n <= 100)) e[k] = ui.companyErrPercent
    }
    const inv = roiNum(roiFields?.inv)
    if (inv !== undefined && !(Number.isFinite(inv) && inv >= 0)) e.inv = ui.companyErrAmount
    const mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!d.name.trim()) e.name = ui.companyErrName
    if (d.email.trim() && !mail.test(d.email.trim())) e.email = ui.companyErrEmail
    if (d.pec.trim() && !mail.test(d.pec.trim())) e.pec = ui.companyErrPec
    if (d.vat.trim() && !/^\d{11}$/.test(d.vat.replace(/\s/g, ''))) e.vat = ui.companyErrVat
    const intOk = (n: number | null) => n === null || (Number.isInteger(n) && n >= 0)
    if (!intOk(d.employees)) e.employees = ui.companyErrNumber
    if (!intOk(d.toEvaluate)) e.toEvaluate = ui.companyErrNumber
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function saveDetails() {
    if (saving || !validate(draft)) return
    const clean: CompanyDetails = { ...draft, vat: draft.vat.replace(/\s/g, ''), otherSites: draft.otherSites.filter((s) => s.address.trim() || s.city.trim()) }
    setDraft(clean)
    setSaving(true)
    setSaveError(null)
    setSavedNote(false)
    try {
      await saveCompanyProfile({ ...state.company, details: clean })
      if (roiFields) {
        const saved = roi.data ?? {}
        const next = { statement: {}, months: 12, ...saved, turn: roiNum(roiFields.turn) ?? saved.turn, ass: roiNum(roiFields.ass) ?? saved.ass, inv: roiNum(roiFields.inv) ?? saved.inv }
        if (next.turn !== saved.turn || next.ass !== saved.ass || next.inv !== saved.inv) await roi.save.mutateAsync(next)
      }
      setSavedNote(true)
    } catch (err) {
      setSaveError(ui.companyDetailsSaveFailed(errorReason(err, ui.serverOffline)))
    } finally {
      setSaving(false)
    }
  }

  async function saveRoles() {
    try {
      await saveCompanyProfile({ ...state.company, ...roles })
      toast(ui.companyDetailsSaved, 'ok')
    } catch (err) {
      toast(ui.companyDetailsSaveFailed(errorReason(err, ui.serverOffline)), 'err')
    }
  }

  const text = (k: 'name' | 'address' | 'city' | 'email' | 'pec' | 'phone' | 'vat' | 'ateco', label: string, type = 'text', required = false) => (
    <Field label={label} error={errors[k]} required={required} className="gap-1">
      <Input size="sm" type={type} value={draft[k]} onChange={(e) => set(k, e.target.value)} disabled={!canEdit} />
    </Field>
  )
  const roiInput = (k: keyof RoiFields, label: string, step: string) => (
    <Field label={label} error={errors[k]} className="gap-1">
      <Input size="sm" type="number" min={0} max={k === 'inv' ? undefined : 100} step={step} inputMode="decimal" value={roiFields?.[k] ?? ''} onChange={(e) => setRoi(k, e.target.value)} disabled={!canEdit || roiFields === null} />
    </Field>
  )

  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-3">
        <CardTitle>{ui.companyDetailsTitle}</CardTitle>
        {prefilled ? <Note>{ui.companyDetailsPrefilled}</Note> : null}
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-2 xl:grid-cols-3">
          {text('name', ui.companyDetailsName, 'text', true)}
          {text('address', ui.companyDetailsAddress)}
          {text('city', ui.companyDetailsCity)}
          <div className="flex flex-col gap-2 lg:col-span-2 xl:col-span-3">
            <span className="label-mono text-muted-foreground">{ui.companyDetailsOtherSites}</span>
            {draft.otherSites.length === 0 ? <Note>{ui.companyDetailsNoSites}</Note> : null}
            {draft.otherSites.map((site, i) => (
              <div key={i} className="flex flex-wrap items-end gap-4">
                <Field label={ui.companyDetailsAddress} className="min-w-40 flex-1 gap-1">
                  <Input size="sm" value={site.address} onChange={(e) => set('otherSites', draft.otherSites.map((s, j) => (j === i ? { ...s, address: e.target.value } : s)))} disabled={!canEdit} />
                </Field>
                <Field label={ui.companyDetailsCity} className="min-w-40 flex-1 gap-1">
                  <Input size="sm" value={site.city} onChange={(e) => set('otherSites', draft.otherSites.map((s, j) => (j === i ? { ...s, city: e.target.value } : s)))} disabled={!canEdit} />
                </Field>
                {canEdit ? (
                  <Button type="button" variant="destructive" size="sm" aria-label={ui.companyDetailsRemoveSite} onClick={() => set('otherSites', draft.otherSites.filter((_, j) => j !== i))}>
                    <Icon name="trash" />
                  </Button>
                ) : null}
              </div>
            ))}
            {canEdit ? (
              <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => set('otherSites', [...draft.otherSites, { address: '', city: '' }])}>
                <Icon name="plus" />
                {ui.companyDetailsAddSite}
              </Button>
            ) : null}
          </div>
          {text('email', ui.companyDetailsEmail, 'email')}
          {text('pec', ui.companyDetailsPec, 'email')}
          {text('phone', ui.companyDetailsPhone, 'tel')}
          {text('vat', ui.companyDetailsVat)}
          {text('ateco', ui.companyDetailsAteco)}
          <Field label={ui.companyDetailsEmployees} error={errors.employees} className="gap-1">
            <Input size="sm" type="number" min={0} step={1} inputMode="numeric" value={draft.employees ?? ''} onChange={(e) => set('employees', num(e.target.value))} disabled={!canEdit} />
          </Field>
          <Field label={ui.companyDetailsToEvaluate} error={errors.toEvaluate} className="gap-1">
            <Input size="sm" type="number" min={0} step={1} inputMode="numeric" value={draft.toEvaluate ?? ''} onChange={(e) => set('toEvaluate', num(e.target.value))} disabled={!canEdit} />
          </Field>
          {roiInput('turn', ui.companyDetailsTurnover, '0.1')}
          {roiInput('ass', ui.companyDetailsAbsence, '0.1')}
          {roiInput('inv', ui.companyDetailsContract, '1')}
        </div>
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void saveDetails()} disabled={saving}>
              {saving ? ui.companyDetailsSaving : ui.companyDetailsSave}
            </Button>
            {savedNote ? (
              <span role="status" className="text-app-small text-success">
                {ui.companyDetailsSaved}
              </span>
            ) : null}
          </div>
        ) : null}
        {saveError ? <InlineAlert>{saveError}</InlineAlert> : null}
      </Card>

      <section>
        <PageHeader title={ui.companyKeyRolesTitle} description={ui.companyKeyRolesSub} level="subsection" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardTitle className="mb-2">{ui.companyReferenteLabel}</CardTitle>
            <Field label={ui.companyNameLabel} className="gap-1">
              <Input size="sm" type="text" value={roles.referente.name} onChange={(e) => setRoles((r) => ({ ...r, referente: { ...r.referente, name: e.target.value } }))} disabled={!canEdit} />
            </Field>
            <Field label={ui.companyEmailLabel} className="gap-1">
              <Input size="sm" type="email" value={roles.referente.email} onChange={(e) => setRoles((r) => ({ ...r, referente: { ...r.referente, email: e.target.value } }))} disabled={!canEdit} />
            </Field>
            <Field label={ui.companyPhoneLabel} className="gap-1">
              <Input size="sm" type="text" value={roles.referente.phone} onChange={(e) => setRoles((r) => ({ ...r, referente: { ...r.referente, phone: e.target.value } }))} disabled={!canEdit} />
            </Field>
          </Card>
          <Card>
            <CardTitle className="mb-2">{ui.companyCeoLabel}</CardTitle>
            <Field label={ui.companyNameLabel} className="gap-1">
              <Input size="sm" type="text" value={roles.ceo.name} onChange={(e) => setRoles((r) => ({ ...r, ceo: { ...r.ceo, name: e.target.value } }))} disabled={!canEdit} />
            </Field>
            <Field label={ui.companyEmailLabel} className="gap-1">
              <Input size="sm" type="email" value={roles.ceo.email} onChange={(e) => setRoles((r) => ({ ...r, ceo: { ...r.ceo, email: e.target.value } }))} disabled={!canEdit} />
            </Field>
          </Card>
          <Card>
            <CardTitle className="mb-2">{ui.companyCfoLabel}</CardTitle>
            <Field label={ui.companyNameLabel} className="gap-1">
              <Input size="sm" type="text" value={roles.cfo.name} onChange={(e) => setRoles((r) => ({ ...r, cfo: { ...r.cfo, name: e.target.value } }))} disabled={!canEdit} />
            </Field>
            <Field label={ui.companyEmailLabel} className="gap-1">
              <Input size="sm" type="email" value={roles.cfo.email} onChange={(e) => setRoles((r) => ({ ...r, cfo: { ...r.cfo, email: e.target.value } }))} disabled={!canEdit} />
            </Field>
          </Card>
        </div>
        {canEdit ? (
          <div className="mt-3 flex justify-end">
            <Button variant="default" onClick={() => void saveRoles()}>
              {ui.companySaveBtn}
            </Button>
          </div>
        ) : null}
      </section>

      <RoiDataSection />
    </div>
  )
}

const EMPTY: CompanyDetails = { name: '', address: '', city: '', otherSites: [], email: '', pec: '', phone: '', vat: '', ateco: '', employees: null, toEvaluate: null }

/**
 * La finestra parte dai dati già presenti, se non è mai stata salvata: il nome e la partita IVA
 * della società sul server, la prima sede e il primo contatto salvati prima, le altre sedi.
 * Niente si scrive finché non si preme Salva.
 */
function prefill(state: AssessmentState, companyName?: string, vatNumber?: string | null): CompanyDetails {
  const [first, ...rest] = state.company.locations
  const contact = state.company.contacts[0]
  return {
    name: companyName || state.settings.companyName || '',
    address: first?.address ?? '',
    city: first?.city ?? '',
    otherSites: rest.map((l) => ({ address: l.address, city: l.city })),
    email: contact?.email ?? '',
    pec: '',
    phone: contact?.phone ?? '',
    vat: vatNumber ?? '',
    ateco: '',
    employees: null,
    toEvaluate: null,
  }
}

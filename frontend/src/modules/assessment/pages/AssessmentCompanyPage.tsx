import { useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { Note } from '@/components/patterns/Note'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Icon } from '@/modules/assessment/components/Icon'
import { RoiDataSection } from '@/modules/assessment/components/RoiDataSection'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
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
export default function AssessmentCompanyPage() {
  const { state, setState, ui, canEdit, company } = useAssessment()
  // Un profilo mai salvato arriva dal server come {}: vale come vuoto e parte dai dati presenti.
  const raw = state.company.details
  const saved = raw && Object.keys(raw).length ? { ...EMPTY, ...raw, otherSites: Array.isArray(raw.otherSites) ? raw.otherSites : [] } : null
  const [draft, setDraft] = useState<CompanyDetails>(() => saved ?? prefill(state, company?.name, company?.vatNumber))
  const prefilled = !saved && !!(draft.name || draft.address || draft.email)
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyDetails, string>>>({})
  const [roles, setRoles] = useState(() => ({ referente: state.company.referente, ceo: state.company.ceo, cfo: state.company.cfo }))
  const [savedNote, setSavedNote] = useState(false)

  const set = <K extends keyof CompanyDetails>(k: K, v: CompanyDetails[K]) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setSavedNote(false)
  }
  const num = (v: string): number | null => (v.trim() === '' ? null : Number(v))

  function validate(d: CompanyDetails) {
    const e: Partial<Record<keyof CompanyDetails, string>> = {}
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

  function saveDetails() {
    if (!validate(draft)) return
    const clean: CompanyDetails = { ...draft, vat: draft.vat.replace(/\s/g, ''), otherSites: draft.otherSites.filter((s) => s.address.trim() || s.city.trim()) }
    setDraft(clean)
    setState((prev) => ({ ...prev, company: { ...prev.company, details: clean } }))
    setSavedNote(true)
  }

  function saveRoles() {
    setState((prev) => ({ ...prev, company: { ...prev.company, ...roles } }))
  }

  const text = (k: 'name' | 'address' | 'city' | 'email' | 'pec' | 'phone' | 'vat' | 'ateco', label: string, type = 'text', required = false) => (
    <Field label={label} error={errors[k]} required={required}>
      <Input type={type} value={draft[k]} onChange={(e) => set(k, e.target.value)} disabled={!canEdit} />
    </Field>
  )

  return (
    <div className="flex flex-col gap-8">
      <Card className="gap-4">
        <CardTitle>{ui.companyDetailsTitle}</CardTitle>
        {prefilled ? <Note>{ui.companyDetailsPrefilled}</Note> : null}
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
          {text('name', ui.companyDetailsName, 'text', true)}
          {text('address', ui.companyDetailsAddress)}
          {text('city', ui.companyDetailsCity)}
          <div className="flex flex-col gap-2 lg:col-span-2">
            <span className="label-mono text-muted-foreground">{ui.companyDetailsOtherSites}</span>
            {draft.otherSites.length === 0 ? <Note>{ui.companyDetailsNoSites}</Note> : null}
            {draft.otherSites.map((site, i) => (
              <div key={i} className="flex flex-wrap items-end gap-4">
                <Field label={ui.companyDetailsAddress} className="min-w-40 flex-1">
                  <Input value={site.address} onChange={(e) => set('otherSites', draft.otherSites.map((s, j) => (j === i ? { ...s, address: e.target.value } : s)))} disabled={!canEdit} />
                </Field>
                <Field label={ui.companyDetailsCity} className="min-w-40 flex-1">
                  <Input value={site.city} onChange={(e) => set('otherSites', draft.otherSites.map((s, j) => (j === i ? { ...s, city: e.target.value } : s)))} disabled={!canEdit} />
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
          <Field label={ui.companyDetailsEmployees} error={errors.employees}>
            <Input type="number" min={0} step={1} inputMode="numeric" value={draft.employees ?? ''} onChange={(e) => set('employees', num(e.target.value))} disabled={!canEdit} />
          </Field>
          <Field label={ui.companyDetailsToEvaluate} error={errors.toEvaluate}>
            <Input type="number" min={0} step={1} inputMode="numeric" value={draft.toEvaluate ?? ''} onChange={(e) => set('toEvaluate', num(e.target.value))} disabled={!canEdit} />
          </Field>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={saveDetails}>
              {ui.companyDetailsSave}
            </Button>
            {savedNote ? (
              <span role="status" className="text-app-small text-success">
                {ui.companyDetailsSaved}
              </span>
            ) : null}
          </div>
        ) : null}
      </Card>

      <section>
        <PageHeader title={ui.companyKeyRolesTitle} description={ui.companyKeyRolesSub} level="subsection" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardTitle className="mb-3">{ui.companyReferenteLabel}</CardTitle>
            <Field label={ui.companyNameLabel}>
              <Input type="text" value={roles.referente.name} onChange={(e) => setRoles((r) => ({ ...r, referente: { ...r.referente, name: e.target.value } }))} disabled={!canEdit} />
            </Field>
            <Field label={ui.companyEmailLabel}>
              <Input type="email" value={roles.referente.email} onChange={(e) => setRoles((r) => ({ ...r, referente: { ...r.referente, email: e.target.value } }))} disabled={!canEdit} />
            </Field>
            <Field label={ui.companyPhoneLabel}>
              <Input type="text" value={roles.referente.phone} onChange={(e) => setRoles((r) => ({ ...r, referente: { ...r.referente, phone: e.target.value } }))} disabled={!canEdit} />
            </Field>
          </Card>
          <Card>
            <CardTitle className="mb-3">{ui.companyCeoLabel}</CardTitle>
            <Field label={ui.companyNameLabel}>
              <Input type="text" value={roles.ceo.name} onChange={(e) => setRoles((r) => ({ ...r, ceo: { ...r.ceo, name: e.target.value } }))} disabled={!canEdit} />
            </Field>
            <Field label={ui.companyEmailLabel}>
              <Input type="email" value={roles.ceo.email} onChange={(e) => setRoles((r) => ({ ...r, ceo: { ...r.ceo, email: e.target.value } }))} disabled={!canEdit} />
            </Field>
          </Card>
          <Card>
            <CardTitle className="mb-3">{ui.companyCfoLabel}</CardTitle>
            <Field label={ui.companyNameLabel}>
              <Input type="text" value={roles.cfo.name} onChange={(e) => setRoles((r) => ({ ...r, cfo: { ...r.cfo, name: e.target.value } }))} disabled={!canEdit} />
            </Field>
            <Field label={ui.companyEmailLabel}>
              <Input type="email" value={roles.cfo.email} onChange={(e) => setRoles((r) => ({ ...r, cfo: { ...r.cfo, email: e.target.value } }))} disabled={!canEdit} />
            </Field>
          </Card>
        </div>
        {canEdit ? (
          <div className="mt-4 flex justify-end">
            <Button variant="default" onClick={saveRoles}>
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

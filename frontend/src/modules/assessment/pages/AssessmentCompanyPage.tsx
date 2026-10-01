import { useState } from 'react'

import { Note } from '@/components/patterns/Note'
import { Separator } from '@/components/ui/separator'
import { StatCard } from '@/components/patterns/StatCard'
import { PageHeader } from '@/components/patterns/PageHeader'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Field } from '@/components/patterns/Field'
import { Input } from '@/components/ui/input'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/modules/assessment/components/Icon'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import type { CompanyContact, CompanyLocation } from '@/modules/assessment/lib/types'

const CONTRACT_TYPES = ['dipendente', 'cocopro', 'partitaIva', 'esterno'] as const

// Migrated from renderCompany() (js/assessment.js ~5691-5830) — headcount
// tiles computed live from employees (never manually typed, so they can
// never drift), locations/contacts as repeatable rows, key-roles fields.
// Legacy edits the DOM directly and only reads it back on "Salva" — this
// uses local draft state instead (same "edit locally, then Save" timing:
// nothing is persisted to sv_assessment_state_v1 until Salva is pressed).
export default function AssessmentCompanyPage() {
  const { state, setState, ui, canEdit } = useAssessment()
  const [draft, setDraft] = useState(state.company)
  const [headcountModal, setHeadcountModal] = useState<string | null>(null)

  const counts = { dipendente: 0, cocopro: 0, partitaIva: 0, esterno: 0 } as Record<string, number>
  state.employees
    .filter((e) => !e.archived)
    .forEach((e) => {
      counts[e.tipoContratto || 'dipendente']++
    })
  const contractLabel = (type: string) =>
    ({ dipendente: ui.companyHeadcountDipendenti, cocopro: ui.companyHeadcountCocopro, partitaIva: ui.companyHeadcountPartitaIva, esterno: ui.companyHeadcountEsterni })[type] || type

  function updateLocation(i: number, patch: Partial<CompanyLocation>) {
    setDraft((prev) => ({ ...prev, locations: prev.locations.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }))
  }
  function updateContact(i: number, patch: Partial<CompanyContact>) {
    setDraft((prev) => ({ ...prev, contacts: prev.contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }))
  }

  function save() {
    setState((prev) => ({ ...prev, company: draft }))
  }

  return (
    <div>

      <PageHeader title={ui.companyHeadcountTitle} description={ui.companyHeadcountSub} level="subsection" />
      <Card>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CONTRACT_TYPES.map((type) => (
            <StatCard key={type} label={contractLabel(type)} value={counts[type]} onClick={() => setHeadcountModal(type)} />
          ))}
        </div>
      </Card>

      {headcountModal && (
        <ModalDialog
          title={ui.companyHeadcountBreakdownTitle(contractLabel(headcountModal))}
          onClose={() => setHeadcountModal(null)}
          footer={
            <Button variant="outline" onClick={() => setHeadcountModal(null)}>
              {ui.btnClose}
            </Button>
          }
        >
          {state.employees.filter((e) => !e.archived && (e.tipoContratto || 'dipendente') === headcountModal).length === 0 ? (
            <Note>{ui.companyHeadcountBreakdownEmpty}</Note>
          ) : (
            state.employees
              .filter((e) => !e.archived && (e.tipoContratto || 'dipendente') === headcountModal)
              .map((e) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span>
                    {e.nome} {e.cognome} <span className="text-app-small text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">— {e.ruolo}{e.area ? ` · ${e.area}` : ''}</span>
                  </span>
                </div>
              ))
          )}
        </ModalDialog>
      )}

      <Separator className="my-4" />
      <PageHeader title={ui.companyLocationsTitle} description={ui.companyLocationsSub} level="subsection" />
      <Card>
        {draft.locations.length === 0 && (
          <Note className="mb-2">
            {ui.companyNoLocations}
          </Note>
        )}
        {draft.locations.map((l, i) => (
          <div className="flex flex-wrap items-end gap-4" key={i}>
            <Field label={ui.companyLocationNameLabel} className="min-w-40 flex-1">
              <Input type="text" value={l.name} onChange={(e) => updateLocation(i, { name: e.target.value })} />
            </Field>
            <Field label={ui.companyLocationAddressLabel} className="min-w-40 flex-1">
              <Input type="text" value={l.address} onChange={(e) => updateLocation(i, { address: e.target.value })} />
            </Field>
            <Field label={ui.companyLocationCityLabel} className="min-w-40 flex-1">
              <Input type="text" value={l.city} onChange={(e) => updateLocation(i, { city: e.target.value })} />
            </Field>
            {canEdit && (
              <Button type="button" variant="destructive" size="sm" onClick={() => setDraft((prev) => ({ ...prev, locations: prev.locations.filter((_, idx) => idx !== i) }))}>
                <Icon name="trash" />
              </Button>
            )}
          </div>
        ))}
        {canEdit && (
          <Button className="mt-2" type="button" variant="outline" size="sm"  onClick={() => setDraft((prev) => ({ ...prev, locations: [...prev.locations, { name: '', address: '', city: '' }] }))}>
            <Icon name="plus" />
            {ui.companyAddLocationBtn}
          </Button>
        )}
      </Card>

      <Separator className="my-4" />
      <PageHeader title={ui.companyContactsTitle} description={ui.companyContactsSub} level="subsection" />
      <Card>
        {draft.contacts.length === 0 && (
          <Note className="mb-2">
            {ui.companyNoContacts}
          </Note>
        )}
        {draft.contacts.map((ct, i) => (
          <div className="flex flex-wrap items-end gap-4" key={i}>
            <Field label={ui.companyContactLabelLabel} className="min-w-40 flex-1">
              <Input type="text" value={ct.label} onChange={(e) => updateContact(i, { label: e.target.value })} />
            </Field>
            <Field label={ui.companyContactNameLabel} className="min-w-40 flex-1">
              <Input type="text" value={ct.name} onChange={(e) => updateContact(i, { name: e.target.value })} />
            </Field>
            <Field label={ui.companyContactEmailLabel} className="min-w-40 flex-1">
              <Input type="email" value={ct.email} onChange={(e) => updateContact(i, { email: e.target.value })} />
            </Field>
            <Field label={ui.companyContactPhoneLabel} className="min-w-40 flex-1">
              <Input type="text" value={ct.phone} onChange={(e) => updateContact(i, { phone: e.target.value })} />
            </Field>
            {canEdit && (
              <Button type="button" variant="destructive" size="sm" onClick={() => setDraft((prev) => ({ ...prev, contacts: prev.contacts.filter((_, idx) => idx !== i) }))}>
                <Icon name="trash" />
              </Button>
            )}
          </div>
        ))}
        {canEdit && (
          <Button className="mt-2" type="button" variant="outline" size="sm"  onClick={() => setDraft((prev) => ({ ...prev, contacts: [...prev.contacts, { label: '', name: '', email: '', phone: '' }] }))}>
            <Icon name="plus" />
            {ui.companyAddContactBtn}
          </Button>
        )}
      </Card>

      <Separator className="my-4" />
      <PageHeader title={ui.companyKeyRolesTitle} description={ui.companyKeyRolesSub} level="subsection" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardTitle className="mb-3">
            {ui.companyReferenteLabel}
          </CardTitle>
          <Field label={ui.companyNameLabel}>
            <Input type="text" value={draft.referente.name} onChange={(e) => setDraft((prev) => ({ ...prev, referente: { ...prev.referente, name: e.target.value } }))} />
          </Field>
          <Field label={ui.companyEmailLabel}>
            <Input type="email" value={draft.referente.email} onChange={(e) => setDraft((prev) => ({ ...prev, referente: { ...prev.referente, email: e.target.value } }))} />
          </Field>
          <Field label={ui.companyPhoneLabel}>
            <Input type="text" value={draft.referente.phone} onChange={(e) => setDraft((prev) => ({ ...prev, referente: { ...prev.referente, phone: e.target.value } }))} />
          </Field>
        </Card>
        <Card>
          <CardTitle className="mb-3">
            {ui.companyCeoLabel}
          </CardTitle>
          <Field label={ui.companyNameLabel}>
            <Input type="text" value={draft.ceo.name} onChange={(e) => setDraft((prev) => ({ ...prev, ceo: { ...prev.ceo, name: e.target.value } }))} />
          </Field>
          <Field label={ui.companyEmailLabel}>
            <Input type="email" value={draft.ceo.email} onChange={(e) => setDraft((prev) => ({ ...prev, ceo: { ...prev.ceo, email: e.target.value } }))} />
          </Field>
        </Card>
        <Card>
          <CardTitle className="mb-3">
            {ui.companyCfoLabel}
          </CardTitle>
          <Field label={ui.companyNameLabel}>
            <Input type="text" value={draft.cfo.name} onChange={(e) => setDraft((prev) => ({ ...prev, cfo: { ...prev.cfo, name: e.target.value } }))} />
          </Field>
          <Field label={ui.companyEmailLabel}>
            <Input type="email" value={draft.cfo.email} onChange={(e) => setDraft((prev) => ({ ...prev, cfo: { ...prev.cfo, email: e.target.value } }))} />
          </Field>
        </Card>
      </div>

      {canEdit && (
        <div className="flex justify-end mt-4">
          <Button variant="default" onClick={save}>
            {ui.companySaveBtn}
          </Button>
        </div>
      )}
    </div>
  )
}

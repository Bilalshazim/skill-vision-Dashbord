import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/modules/assessment/components/Icon'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import type { CompanyContact, CompanyLocation } from '@/modules/assessment/lib/types'

const CONTRACT_TYPES = ['dipendente', 'cocopro', 'partitaIva', 'esterno'] as const
const VARIANTS: Record<string, string> = { dipendente: 'accent', cocopro: 'success', partitaIva: 'warning', esterno: 'danger' }

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
      <div className="section-head">
        <div>
          <h2>{ui.companyPageTitle}</h2>
          <p>{ui.companyPageSub}</p>
        </div>
      </div>

      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 14 }}>{ui.companyHeadcountTitle}</h2>
          <p>{ui.companyHeadcountSub}</p>
        </div>
      </div>
      <div className="card">
        <div className="grid grid-4" style={{ gap: 10 }}>
          {CONTRACT_TYPES.map((type) => (
            <div key={type} className={`tinted-tile clickable ${VARIANTS[type]}`} style={{ textAlign: 'center', padding: '14px 10px' }} onClick={() => setHeadcountModal(type)}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>{counts[type]}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', marginTop: 2 }}>{contractLabel(type)}</div>
            </div>
          ))}
        </div>
      </div>

      {headcountModal && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setHeadcountModal(null)}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <h3>{ui.companyHeadcountBreakdownTitle(contractLabel(headcountModal))}</h3>
              </div>
              <button className="modal-close" onClick={() => setHeadcountModal(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {state.employees.filter((e) => !e.archived && (e.tipoContratto || 'dipendente') === headcountModal).length === 0 ? (
                <div className="small-note">{ui.companyHeadcountBreakdownEmpty}</div>
              ) : (
                state.employees
                  .filter((e) => !e.archived && (e.tipoContratto || 'dipendente') === headcountModal)
                  .map((e) => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                      <span>
                        {e.nome} {e.cognome} <span className="small-note">— {e.ruolo}{e.area ? ` · ${e.area}` : ''}</span>
                      </span>
                    </div>
                  ))
              )}
            </div>
            <div className="modal-foot">
              <Button variant="outline" onClick={() => setHeadcountModal(null)}>
                {ui.btnClose}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="divider" />
      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 14 }}>{ui.companyLocationsTitle}</h2>
          <p>{ui.companyLocationsSub}</p>
        </div>
      </div>
      <div className="card">
        {draft.locations.length === 0 && (
          <div className="small-note" style={{ marginBottom: 8 }}>
            {ui.companyNoLocations}
          </div>
        )}
        {draft.locations.map((l, i) => (
          <div key={i} className="field-row" style={{ alignItems: 'flex-end' }}>
            <div className="field">
              <label>{ui.companyLocationNameLabel}</label>
              <input type="text" value={l.name} onChange={(e) => updateLocation(i, { name: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1.6 }}>
              <label>{ui.companyLocationAddressLabel}</label>
              <input type="text" value={l.address} onChange={(e) => updateLocation(i, { address: e.target.value })} />
            </div>
            <div className="field">
              <label>{ui.companyLocationCityLabel}</label>
              <input type="text" value={l.city} onChange={(e) => updateLocation(i, { city: e.target.value })} />
            </div>
            {canEdit && (
              <Button type="button" variant="destructive" size="sm" onClick={() => setDraft((prev) => ({ ...prev, locations: prev.locations.filter((_, idx) => idx !== i) }))}>
                <Icon name="trash" />
              </Button>
            )}
          </div>
        ))}
        {canEdit && (
          <Button type="button" variant="outline" size="sm" style={{ marginTop: 6 }} onClick={() => setDraft((prev) => ({ ...prev, locations: [...prev.locations, { name: '', address: '', city: '' }] }))}>
            <Icon name="plus" />
            {ui.companyAddLocationBtn}
          </Button>
        )}
      </div>

      <div className="divider" />
      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 14 }}>{ui.companyContactsTitle}</h2>
          <p>{ui.companyContactsSub}</p>
        </div>
      </div>
      <div className="card">
        {draft.contacts.length === 0 && (
          <div className="small-note" style={{ marginBottom: 8 }}>
            {ui.companyNoContacts}
          </div>
        )}
        {draft.contacts.map((ct, i) => (
          <div key={i} className="field-row" style={{ alignItems: 'flex-end' }}>
            <div className="field">
              <label>{ui.companyContactLabelLabel}</label>
              <input type="text" value={ct.label} onChange={(e) => updateContact(i, { label: e.target.value })} />
            </div>
            <div className="field">
              <label>{ui.companyContactNameLabel}</label>
              <input type="text" value={ct.name} onChange={(e) => updateContact(i, { name: e.target.value })} />
            </div>
            <div className="field">
              <label>{ui.companyContactEmailLabel}</label>
              <input type="email" value={ct.email} onChange={(e) => updateContact(i, { email: e.target.value })} />
            </div>
            <div className="field">
              <label>{ui.companyContactPhoneLabel}</label>
              <input type="text" value={ct.phone} onChange={(e) => updateContact(i, { phone: e.target.value })} />
            </div>
            {canEdit && (
              <Button type="button" variant="destructive" size="sm" onClick={() => setDraft((prev) => ({ ...prev, contacts: prev.contacts.filter((_, idx) => idx !== i) }))}>
                <Icon name="trash" />
              </Button>
            )}
          </div>
        ))}
        {canEdit && (
          <Button type="button" variant="outline" size="sm" style={{ marginTop: 6 }} onClick={() => setDraft((prev) => ({ ...prev, contacts: [...prev.contacts, { label: '', name: '', email: '', phone: '' }] }))}>
            <Icon name="plus" />
            {ui.companyAddContactBtn}
          </Button>
        )}
      </div>

      <div className="divider" />
      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 14 }}>{ui.companyKeyRolesTitle}</h2>
          <p>{ui.companyKeyRolesSub}</p>
        </div>
      </div>
      <div className="grid grid-3">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>
            {ui.companyReferenteLabel}
          </div>
          <div className="field">
            <label>{ui.companyNameLabel}</label>
            <input type="text" value={draft.referente.name} onChange={(e) => setDraft((prev) => ({ ...prev, referente: { ...prev.referente, name: e.target.value } }))} />
          </div>
          <div className="field">
            <label>{ui.companyEmailLabel}</label>
            <input type="email" value={draft.referente.email} onChange={(e) => setDraft((prev) => ({ ...prev, referente: { ...prev.referente, email: e.target.value } }))} />
          </div>
          <div className="field">
            <label>{ui.companyPhoneLabel}</label>
            <input type="text" value={draft.referente.phone} onChange={(e) => setDraft((prev) => ({ ...prev, referente: { ...prev.referente, phone: e.target.value } }))} />
          </div>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>
            {ui.companyCeoLabel}
          </div>
          <div className="field">
            <label>{ui.companyNameLabel}</label>
            <input type="text" value={draft.ceo.name} onChange={(e) => setDraft((prev) => ({ ...prev, ceo: { ...prev.ceo, name: e.target.value } }))} />
          </div>
          <div className="field">
            <label>{ui.companyEmailLabel}</label>
            <input type="email" value={draft.ceo.email} onChange={(e) => setDraft((prev) => ({ ...prev, ceo: { ...prev.ceo, email: e.target.value } }))} />
          </div>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>
            {ui.companyCfoLabel}
          </div>
          <div className="field">
            <label>{ui.companyNameLabel}</label>
            <input type="text" value={draft.cfo.name} onChange={(e) => setDraft((prev) => ({ ...prev, cfo: { ...prev.cfo, name: e.target.value } }))} />
          </div>
          <div className="field">
            <label>{ui.companyEmailLabel}</label>
            <input type="email" value={draft.cfo.email} onChange={(e) => setDraft((prev) => ({ ...prev, cfo: { ...prev.cfo, email: e.target.value } }))} />
          </div>
        </div>
      </div>

      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <Button variant="default" onClick={save}>
            {ui.companySaveBtn}
          </Button>
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'

import { AddEmployeeModal } from '@/modules/assessment/components/AddEmployeeModal'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { EmployeeSoftSkillModal } from '@/modules/assessment/components/EmployeeSoftSkillModal'
import { Icon } from '@/modules/assessment/components/Icon'
import { RoleCensusModal } from '@/modules/assessment/components/RoleCensusModal'
import { SurveyLinkModal } from '@/modules/assessment/components/SurveyLinkModal'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { areasList, primaryScore, primaryScoreLabel } from '@/modules/assessment/lib/calculations'
import { fmtCurrency, fmt1, genderDisplayLabel, getSoftSkills, semanticChip } from '@/modules/assessment/lib/legacy-utils'

const PAGE_SIZE = 10

// Migrated from renderAnagrafica()/renderAnagTable() (js/assessment.js
// ~4777-4889) — search/area-filter/sort/pagination + archive/restore, same
// column set, same page size (10). Legacy's own module-level ANAG_SEARCH/
// ANAG_AREA_FILTER/ANAG_SORT/ANAG_PAGE/ANAG_SHOW_ARCHIVED are local
// component state here.
export default function AssessmentAnagraficaPage() {
  const { state, setState, lang, ui, canEdit } = useAssessment()
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('all')
  const [sort, setSort] = useState<'cognome' | 'area' | 'score'>('cognome')
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(1)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [softSkillModalId, setSoftSkillModalId] = useState<string | null>(null)
  const [archiveModalId, setArchiveModalId] = useState<string | null>(null)
  const [showRoleCensus, setShowRoleCensus] = useState(false)
  const [showSurveyLink, setShowSurveyLink] = useState(false)
  const [showAddEmployee, setShowAddEmployee] = useState(false)

  useTopbarActions(
    canEdit ? (
      <button className="btn btn-primary" onClick={() => setShowAddEmployee(true)}>
        <Icon name="plus" />
        {ui.anagAddEmployee}
      </button>
    ) : null,
    [canEdit, ui],
  )

  const SOFT_SKILLS = getSoftSkills(lang)

  const list = useMemo(() => {
    let l = showArchived ? state.employees.filter((e) => e.archived) : state.employees.filter((e) => !e.archived)
    if (areaFilter !== 'all') l = l.filter((e) => e.area === areaFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      l = l.filter((e) => (e.nome + ' ' + e.cognome + ' ' + e.email).toLowerCase().includes(q))
    }
    l = [...l]
    if (sort === 'cognome') l.sort((a, b) => a.cognome.localeCompare(b.cognome))
    if (sort === 'area') l.sort((a, b) => a.area.localeCompare(b.area))
    if (sort === 'score') l.sort((a, b) => primaryScore(b, state, lang) - primaryScore(a, state, lang))
    return l
  }, [state, lang, showArchived, areaFilter, search, sort])

  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageList = list.slice(start, start + PAGE_SIZE)

  function softAssignedLabel(empId: string) {
    const e = state.employees.find((x) => x.id === empId)!
    const totalSkills = SOFT_SKILLS.length
    const done = Object.values(e.soft || {}).filter((v) => v && v.ottenuto > 0).length
    const cls = done >= totalSkills ? 'chip-green' : done > 0 ? 'chip-amber' : 'chip-gray'
    return { cls, text: `${done}/${totalSkills}` }
  }

  function restoreEmployee(id: string) {
    if (!canEdit) return
    setState((prev) => ({ ...prev, employees: prev.employees.map((e) => (e.id === id ? { ...e, archived: null } : e)) }))
  }

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{ui.anagListTitle}</h2>
          <p>{ui.anagListSub}</p>
        </div>
        <div className="toolbar">
          {/* Was two full-width header cards ("Competenze trasversali
              richieste per ruolo" / "Link Survey") — declutter per client
              feedback: same actions, as compact icon buttons in the
              toolbar instead of standalone cards. Nothing removed
              functionally, both still open the same modals. */}
          <button type="button" className="icon-btn" title={ui.anagRoleSkillsTitle} onClick={() => setShowRoleCensus(true)}>
            <Icon name="users" />
          </button>
          <button type="button" className="icon-btn" title={ui.linkSurveyBtn} onClick={() => setShowSurveyLink(true)}>
            <Icon name="notes" />
          </button>
          <div className="search-box">
            <Icon name="search" />
            <input
              type="text"
              className="neu-input"
              placeholder={ui.anagSearchPh}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <select
            style={{ padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}
            value={areaFilter}
            onChange={(e) => {
              setAreaFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">{ui.anagAllAreas}</option>
            {areasList(state).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            style={{ padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as typeof sort)
              setPage(1)
            }}
          >
            <option value="cognome">{ui.anagSortLastName}</option>
            <option value="area">{ui.anagSortArea}</option>
            <option value="score">{ui.anagSortScore}</option>
          </select>
          <label className="checkbox-row" style={{ gap: 7, fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => {
                setShowArchived(e.target.checked)
                setPage(1)
              }}
            />
            {ui.anagShowArchived}
          </label>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {!list.length ? (
          <div className="empty-state">
            <Icon name="users" />
            <div className="t">{showArchived ? ui.anagNoArchivedFound : ui.anagNoEmployeesFound}</div>
            <div className="d">{ui.anagAdjustFilters}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>{ui.anagColEmployee}</th>
                  <th>{ui.anagColEmail}</th>
                  <th>{ui.anagColArea}</th>
                  <th>{ui.anagColDepartment}</th>
                  <th>{ui.anagColRole}</th>
                  <th>{ui.anagColDuties}</th>
                  <th>{ui.anagColGender}</th>
                  <th>{ui.anagColLevel}</th>
                  <th>{ui.anagColRal}</th>
                  <th>{ui.anagColBenefit}</th>
                  <th>{ui.anagColSoftAssigned}</th>
                  <th>{primaryScoreLabel(state, lang)}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageList.map((e) => {
                  const soft = softAssignedLabel(e.id)
                  return (
                    <tr key={e.id} onClick={() => setDrawerId(e.id)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div className="avatar">
                            {(e.nome[0] || '') + (e.cognome[0] || '')}
                          </div>
                          <b>
                            {e.nome} {e.cognome}
                          </b>
                          {e.archived && (
                            <span className="chip chip-gray" style={{ flexShrink: 0 }}>
                              {e.archived.reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-2)' }}>{e.email}</td>
                      <td>{e.area}</td>
                      <td style={{ color: 'var(--text-2)' }}>{e.reparto || '—'}</td>
                      <td>{e.ruolo}</td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-2)' }}>{e.mansione}</td>
                      <td style={{ color: 'var(--text-2)' }}>{genderDisplayLabel(e.sesso, lang) || '—'}</td>
                      <td style={{ color: 'var(--text-2)' }}>{e.livelloCcnl || '—'}</td>
                      <td style={{ color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{e.ral ? fmtCurrency(e.ral) : '—'}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-2)' }}>{e.benefit || '—'}</td>
                      <td>
                        <span
                          className={`chip ${soft.cls}`}
                          style={{ cursor: 'pointer' }}
                          title={ui.anagColSoftAssigned}
                          onClick={(ev) => {
                            ev.stopPropagation()
                            setSoftSkillModalId(e.id)
                          }}
                        >
                          <span className="dt" />
                          {soft.text}
                        </span>
                      </td>
                      <td>
                        <span className={`chip ${semanticChip(primaryScore(e, state, lang))}`}>
                          <span className="dt" />
                          {fmt1(primaryScore(e, state, lang))}
                        </span>
                      </td>
                      <td>
                        {e.archived ? (
                          <button
                            className="btn btn-sm"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              restoreEmployee(e.id)
                            }}
                          >
                            {ui.anagRestore}
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-danger-outline"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              setArchiveModalId(e.id)
                            }}
                          >
                            {ui.anagArchive}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
              <div className="small-note">{ui.anagShowing(start + 1, Math.min(start + PAGE_SIZE, total), total)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn btn-sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                  <Icon name="chevronLeft" />
                </button>
                <span className="small-note" style={{ fontWeight: 700, color: 'var(--text-1)' }}>
                  {ui.anagPageOf(currentPage, totalPages)}
                </span>
                <button className="btn btn-sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                  <Icon name="chevronRight" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
      {softSkillModalId && <EmployeeSoftSkillModal employeeId={softSkillModalId} onClose={() => setSoftSkillModalId(null)} />}
      {showRoleCensus && <RoleCensusModal onClose={() => setShowRoleCensus(false)} />}
      {showSurveyLink && <SurveyLinkModal onClose={() => setShowSurveyLink(false)} />}
      {showAddEmployee && <AddEmployeeModal onClose={() => setShowAddEmployee(false)} />}

      {archiveModalId && (
        <ArchiveModal
          employeeId={archiveModalId}
          onClose={() => setArchiveModalId(null)}
          onConfirm={(reason, note) => {
            setState((prev) => ({ ...prev, employees: prev.employees.map((e) => (e.id === archiveModalId ? { ...e, archived: { reason, note, date: new Date().toISOString().slice(0, 10) } } : e)) }))
            setArchiveModalId(null)
          }}
        />
      )}
    </div>
  )
}

function ArchiveModal({ employeeId, onClose, onConfirm }: { employeeId: string; onClose: () => void; onConfirm: (reason: string, note: string) => void }) {
  const { state, ui } = useAssessment()
  const emp = state.employees.find((e) => e.id === employeeId)
  const [reason, setReason] = useState('pensione')
  const [note, setNote] = useState('')
  if (!emp) return null
  const reasonLabel = (key: string) => ({ pensione: ui.archiveReasonPensione, licenziamento: ui.archiveReasonLicenziamento, probation: ui.archiveReasonProbation, altro: ui.archiveReasonAltro })[key] || key
  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>{ui.archiveModalTitle}</h3>
            <div className="sub">{ui.archiveModalSub(`${emp.nome} ${emp.cognome}`)}</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>{ui.archiveReasonFieldLabel}</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {['pensione', 'licenziamento', 'probation', 'altro'].map((r) => (
                <option key={r} value={r}>
                  {reasonLabel(r)}
                </option>
              ))}
            </select>
          </div>
          {reason === 'altro' && (
            <div className="field">
              <label>{ui.archiveOtherLabel}</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={ui.archiveOtherPh} />
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>
            {ui.importCancel}
          </button>
          <button
            className="btn btn-danger-outline"
            onClick={() => {
              if (reason === 'altro' && !note.trim()) return
              onConfirm(reason, reason === 'altro' ? note.trim() : '')
            }}
          >
            {ui.archiveConfirmBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

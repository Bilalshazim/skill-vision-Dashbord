import { Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Checkbox } from '@/components/ui/checkbox'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { Input } from '@/components/ui/input'
import { Hint } from '@/components/patterns/Hint'
import { Badge } from '@/components/ui/badge'
import { chipTone } from '@/modules/assessment/lib/chip-tone'
import { Initials } from '@/components/ui/avatar'
import { PageHeader } from '@/components/patterns/PageHeader'
import { DataTable } from '@/components/patterns/DataTable'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FilterBar } from '@/components/patterns/FilterBar'
import { FilterToggle } from '@/components/patterns/FilterToggle'
import { Button } from '@/components/ui/button'
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
      <Button variant="default" onClick={() => setShowAddEmployee(true)}>
        <Icon name="plus" />
        {ui.anagAddEmployee}
      </Button>
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
      <PageHeader
        title={ui.anagListTitle}
        description={ui.anagListSub}
        actions={
          <>
            {/* Was two full-width header cards ("Competenze trasversali
                richieste per ruolo" / "Link Survey") — declutter per client
                feedback: same actions, as compact icon buttons in the
                toolbar instead of standalone cards. Nothing removed
                functionally, both still open the same modals. */}
            <Hint label={ui.anagRoleSkillsTitle}>
              <Button type="button" variant="outline" size="icon" aria-label={ui.anagRoleSkillsTitle} onClick={() => setShowRoleCensus(true)}>
                <Icon name="users" />
              </Button>
            </Hint>
            <Hint label={ui.linkSurveyBtn}>
              <Button type="button" variant="outline" size="icon" aria-label={ui.linkSurveyBtn} onClick={() => setShowSurveyLink(true)}>
                <Icon name="notes" />
              </Button>
            </Hint>
            <FilterBar
              search={{
                value: search,
                onChange: (v) => {
                  setSearch(v)
                  setPage(1)
                },
                placeholder: ui.anagSearchPh,
              }}
            >
              <SelectField
                size="sm"
                value={areaFilter}
                onValueChange={(v) => {
                  setAreaFilter(v)
                  setPage(1)
                }}
              >
                <option value="all">{ui.anagAllAreas}</option>
                {areasList(state).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </SelectField>
              <SelectField
                size="sm"
                value={sort}
                onValueChange={(v) => {
                  setSort(v as typeof sort)
                  setPage(1)
                }}
              >
                <option value="cognome">{ui.anagSortLastName}</option>
                <option value="area">{ui.anagSortArea}</option>
                <option value="score">{ui.anagSortScore}</option>
              </SelectField>
              <FilterToggle>
                <Checkbox
                  checked={showArchived}
                  onCheckedChange={(c) => {
                    setShowArchived(c === true)
                    setPage(1)
                  }}
                />
                {ui.anagShowArchived}
              </FilterToggle>
            </FilterBar>
          </>
        }
      />

      <DataTable
        rows={list}
        getRowId={(e) => e.id}
        onRowClick={(e) => setDrawerId(e.id)}
        rowLabel={(e) => ui.anagOpenEmployee(`${e.nome} ${e.cognome}`)}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
          labels: { showing: ui.anagShowing, pageOf: ui.anagPageOf, prev: ui.anagPrevPage, next: ui.anagNextPage },
        }}
        empty={<EmptyState icon={Users} title={showArchived ? ui.anagNoArchivedFound : ui.anagNoEmployeesFound} description={ui.anagAdjustFilters} />}
        columns={[
          {
            key: 'name',
            header: ui.anagColEmployee,
            nowrap: true,
            cell: (e) => (
              <div className="flex items-center gap-2">
                <Initials first={e.nome} last={e.cognome} />
                <span className="font-medium">
                  {e.nome} {e.cognome}
                </span>
                {e.archived && <Badge>{e.archived.reason}</Badge>}
              </div>
            ),
          },
          { key: 'email', header: ui.anagColEmail, emphasis: 'muted', cell: (e) => e.email },
          { key: 'area', header: ui.anagColArea, nowrap: true, cell: (e) => e.area },
          { key: 'reparto', header: ui.anagColDepartment, nowrap: true, emphasis: 'muted', cell: (e) => e.reparto || '—' },
          { key: 'ruolo', header: ui.anagColRole, nowrap: true, cell: (e) => e.ruolo },
          { key: 'mansione', header: ui.anagColDuties, emphasis: 'muted', truncate: 'md', cell: (e) => e.mansione },
          { key: 'sesso', header: ui.anagColGender, nowrap: true, emphasis: 'muted', cell: (e) => genderDisplayLabel(e.sesso, lang) || '—' },
          { key: 'livello', header: ui.anagColLevel, nowrap: true, emphasis: 'muted', cell: (e) => e.livelloCcnl || '—' },
          { key: 'ral', header: ui.anagColRal, emphasis: 'muted', nowrap: true, align: 'end', cell: (e) => (e.ral ? fmtCurrency(e.ral) : '—') },
          { key: 'benefit', header: ui.anagColBenefit, emphasis: 'muted', truncate: 'sm', cell: (e) => e.benefit || '—' },
          {
            key: 'soft',
            header: ui.anagColSoftAssigned,
            cell: (e) => {
              const soft = softAssignedLabel(e.id)
              return (
                <Hint label={ui.anagColSoftAssigned}>
                  <button
                    type="button"
                    className="rounded-full"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      setSoftSkillModalId(e.id)
                    }}
                  >
                    <Badge tone={chipTone(soft.cls)} dot>
                      {soft.text}
                    </Badge>
                  </button>
                </Hint>
              )
            },
          },
          {
            key: 'score',
            header: primaryScoreLabel(state, lang),
            cell: (e) => (
              <Badge tone={chipTone(semanticChip(primaryScore(e, state, lang)))} dot>
                {fmt1(primaryScore(e, state, lang))}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: '',
            align: 'end',
            cell: (e) =>
              e.archived ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(ev) => {
                    ev.stopPropagation()
                    restoreEmployee(e.id)
                  }}
                >
                  {ui.anagRestore}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(ev) => {
                    ev.stopPropagation()
                    setArchiveModalId(e.id)
                  }}
                >
                  {ui.anagArchive}
                </Button>
              ),
          },
        ]}
      />

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
    <ModalDialog
      title={ui.archiveModalTitle}
      sub={ui.archiveModalSub(`${emp.nome} ${emp.cognome}`)}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {ui.importCancel}
          </Button>
          <Button
            variant="default"
            onClick={() => {
              if (reason === 'altro' && !note.trim()) return
              onConfirm(reason, reason === 'altro' ? note.trim() : '')
            }}
          >
            {ui.archiveConfirmBtn}
          </Button>
        </>
      }
    >
      <Field label={ui.archiveReasonFieldLabel}>
        <SelectField value={reason} onValueChange={(v) => setReason(v)}>
          {['pensione', 'licenziamento', 'probation', 'altro'].map((r) => (
            <option key={r} value={r}>
              {reasonLabel(r)}
            </option>
          ))}
        </SelectField>
      </Field>
      {reason === 'altro' && (
        <Field label={ui.archiveOtherLabel}>
          <Input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={ui.archiveOtherPh} />
        </Field>
      )}
    </ModalDialog>
  )
}

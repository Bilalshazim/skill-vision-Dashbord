import type { Absence, AbsenceCategory } from '@/modules/assessment/lib/types'

// La categoria di un'assenza. Un'assenza salvata prima nel browser ha solo il
// motivo scritto a mano: si riconduce alla categoria con la stessa regola del
// server (backend/src/modules/assessment/shape.ts, absenceCategory).
export function absenceCategoryOf(a: Absence): AbsenceCategory | '' {
  if (a.category) return a.category
  const m = (a.motivo ?? '').toLowerCase().trim()
  if (!m) return ''
  if (/ferie|vacanz/.test(m)) return 'ferie'
  if (/permess/.test(m)) return 'permesso'
  if (/formazion|corso|master/.test(m)) return 'formazione'
  if (/congedo|maternit|paternit|parental/.test(m)) return 'congedo'
  return 'altro'
}

/** Una riga dell'editor conta se ha almeno una data o un motivo. */
export const isFilledAbsence = (a: Absence) => !!(a.dal || a.al || absenceCategoryOf(a))

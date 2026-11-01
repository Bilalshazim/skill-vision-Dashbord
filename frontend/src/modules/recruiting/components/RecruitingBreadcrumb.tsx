import { useLocation } from 'react-router-dom'

import { PageBreadcrumb } from '@/components/patterns/PageBreadcrumb'
import { recruitingTrail } from '@/modules/recruiting/nav-config'

// La riga del percorso sopra ogni pagina di lavoro di Recruiting (CLAUDE.md,
// Fase 6), calcolata dal menu: parte da "Profilo della ricerca".
export function RecruitingBreadcrumb() {
  const { pathname } = useLocation()
  const trail = recruitingTrail(pathname)
  return trail ? <PageBreadcrumb items={trail.items} current={trail.current} /> : null
}

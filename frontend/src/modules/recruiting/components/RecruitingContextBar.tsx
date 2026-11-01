import { useLocation } from 'react-router-dom'

import { ContextBar } from '@/components/patterns/ContextBar'
import { SelectField } from '@/components/patterns/SelectField'
import { openingStatus, useActivePosition } from '@/modules/recruiting/lib/active-position'

/** L'unica pagina dove si cambiano società e posizione attiva (CLAUDE.md, Fase 6). */
export const PROFILE_PATH = '/recruiting/profile'

// La posizione attiva, sopra ogni pagina di Recruiting (CLAUDE.md, Fase 6):
// lo stesso stato che leggono tutte le pagine (lib/active-position.tsx).
// Si cambia solo nel Profilo della ricerca, dove la barra è intera, con la
// scelta della società e della posizione. Nelle altre pagine è il sovratitolo
// di sola lettura, "ACME CORP · SENIOR FRONTEND ENGINEER", senza campi:
// prima la scelta stava su ogni pagina, e chi navigava cambiava posizione
// senza accorgersene.
export function RecruitingContextBar() {
  const { pathname } = useLocation()
  const { company, opening, companies, setPosition } = useActivePosition()

  if (pathname !== PROFILE_PATH) {
    return (
      <ContextBar
        variant="inline"
        className="mb-4"
        items={[
          { label: 'Società', value: company?.name ?? '—' },
          { label: 'Posizione attiva', value: opening?.title ?? 'Nessuna posizione aperta' },
        ]}
      />
    )
  }

  const status = openingStatus(opening)
  return (
    <ContextBar
      className="mb-4"
      items={[
        { label: 'Società', value: company?.name ?? '—' },
        { label: 'Posizione attiva', value: opening?.title ?? 'Nessuna posizione aperta' },
        ...(status ? [{ label: 'Stato', value: status }] : []),
      ]}
      action={
        <>
          {companies.length > 1 ? (
            <SelectField id="cambia-societa" size="sm" className="w-56" value={company?.id ?? ''} onValueChange={(id) => setPosition(String(id), '')} aria-label="Cambia società">
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          ) : null}
          {company && company.jobOpenings.length > 1 ? (
            <SelectField id="cambia-posizione" size="sm" className="w-64" value={opening?.id ?? ''} onValueChange={(id) => setPosition(company.id, String(id))} aria-label="Cambia posizione">
              {company.jobOpenings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </SelectField>
          ) : null}
        </>
      }
    />
  )
}

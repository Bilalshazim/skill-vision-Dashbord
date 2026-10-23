import { ContextBar } from '@/components/patterns/ContextBar'
import { SelectField } from '@/components/patterns/SelectField'
import { openingStatus, useActivePosition } from '@/modules/recruiting/lib/active-position'

// La posizione attiva, sopra ogni pagina di Recruiting (CLAUDE.md, Fase 6):
// società, posizione e stato, con la scelta della posizione a destra. È lo
// stesso stato che leggono tutte le pagine (lib/active-position.tsx); la
// società si cambia dalla barra laterale, come negli altri moduli.
export function RecruitingContextBar() {
  const { company, opening, setPosition } = useActivePosition()
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
        company && company.jobOpenings.length > 1 ? (
          <SelectField id="cambia-posizione" size="sm" className="w-64" value={opening?.id ?? ''} onValueChange={(id) => setPosition(company.id, String(id))} aria-label="Cambia posizione">
            {company.jobOpenings.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </SelectField>
        ) : null
      }
    />
  )
}

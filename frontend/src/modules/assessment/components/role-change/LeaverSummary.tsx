import { Card, CardLabel } from '@/components/ui/card'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'
import type { Employee } from '@/modules/assessment/lib/types'

type UI = ReturnType<typeof getUI>

// In testa ai risultati, come nel documento del cliente: PERSONA CHE LASCIA
// IL RUOLO — nome, ruolo, mansione — e il contesto inserito (attività,
// area, livello). Da qui si scende alle tre soluzioni interne.
export function LeaverSummary({ emp, role, tasks, area, level, ui }: { emp: Employee; role: string; tasks: string; area: string; level: string; ui: UI }) {
  const rows: [string, string][] = [
    [ui.rcName, `${emp.nome} ${emp.cognome}`],
    [ui.rcRole, role],
    [ui.rcJobTitle, emp.mansione],
    [ui.rcArea, area],
    [ui.rcLevel, level],
  ]
  return (
    <Card padding="lg" className="gap-4">
      <CardLabel>{ui.rcLeavingTitle}</CardLabel>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex min-w-0 flex-col gap-1">
            <dt className="label-mono text-muted-foreground">{k}</dt>
            <dd className="text-app-body font-medium break-words">{v || '–'}</dd>
          </div>
        ))}
      </dl>
      {tasks.trim() ? (
        <div className="flex flex-col gap-1">
          <span className="label-mono text-muted-foreground">{ui.rcTasks}</span>
          <p className="max-w-3xl text-app-small whitespace-pre-wrap">{tasks}</p>
        </div>
      ) : null}
    </Card>
  )
}

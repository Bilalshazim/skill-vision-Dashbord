import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { EmptyState } from '@/components/patterns/EmptyState'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { LoadingState } from '@/components/patterns/LoadingState'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { companiesApi } from '@/lib/api/endpoints'
import type { AssessmentPackage } from '@/lib/api/types'

// Impostazioni → Pacchetti: quale pacchetto di Assessment ha acquistato ogni
// società. Solo per lo staff Skill-Vision (PLATFORM_ADMIN): lo decide il server
// (backend modules/companies), la Topbar mostra la scheda solo a loro. Con un
// solo pacchetto, il selettore CT / CP / Completo mostra solo quello.
const COMPANIES_KEY = ['settings', 'companies'] as const

export function PackagesSettings() {
  const queryClient = useQueryClient()
  const companies = useQuery({ queryKey: COMPANIES_KEY, queryFn: companiesApi.list })
  const save = useMutation({
    mutationFn: ({ id, value }: { id: string; value: AssessmentPackage }) => companiesApi.setAssessmentPackage(id, value),
    onSuccess: async (company) => {
      await queryClient.invalidateQueries({ queryKey: COMPANIES_KEY })
      await queryClient.invalidateQueries({ queryKey: ['assessment'] })
      toast.success(`Pacchetto aggiornato per ${company.name}`)
    },
    onError: () => toast.error('Pacchetto non aggiornato. Riprova.'),
  })

  if (companies.isPending) return <LoadingState />
  if (companies.isError) return <InlineAlert>Elenco delle società non disponibile. Riapri le impostazioni per riprovare.</InlineAlert>
  const withAssessment = companies.data.filter((c) => c.purchasedModules.includes('ASSESSMENT'))
  if (!withAssessment.length) return <EmptyState description="Nessuna società ha Assessment attivo. Le società compaiono qui quando attivano il modulo." />

  return (
    <ul className="flex flex-col divide-y divide-border">
      {withAssessment.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
          <span className="min-w-0 text-app-body text-foreground">{c.name}</span>
          <ToggleGroup
            type="single"
            value={c.assessmentPackage}
            disabled={save.isPending}
            onValueChange={(v) => v && save.mutate({ id: c.id, value: v as AssessmentPackage })}
            aria-label={`Pacchetto di ${c.name}`}
          >
            <ToggleGroupItem value="A">CT</ToggleGroupItem>
            <ToggleGroupItem value="B">CP</ToggleGroupItem>
            <ToggleGroupItem value="AB">Completo</ToggleGroupItem>
          </ToggleGroup>
        </li>
      ))}
    </ul>
  )
}

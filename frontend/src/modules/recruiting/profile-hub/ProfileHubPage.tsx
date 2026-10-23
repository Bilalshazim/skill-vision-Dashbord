import { PageHeader } from '@/components/patterns/PageHeader'
import { CoinsLossIcon, HouseValueIcon, LightbulbGemIcon } from '@/components/patterns/CardIcons'
import { NavCard } from '@/components/patterns/NavCard'
import { SkillVisionCard } from '@/components/patterns/SkillVisionCard'
import { Compass } from 'lucide-react'

import { Card, CardDescription } from '@/components/ui/card'
import { usePreference } from '@/lib/preferences'
import { RECRUITING_NAV_GROUPS } from '@/modules/recruiting/nav-config'

// "Profilo della ricerca": le tre card dei primi tre livelli del percorso
// (documento del cliente "Recruiting Module", 2026-10-23) — Chi cerchiamo,
// Chi è più adatto, Chi scegliamo. Prima erano quattro finestre (Profilo
// Candidato, Competenze trasversali, Annuncio di lavoro, Area Valutatori):
// le competenze trasversali e l'annuncio stanno ora nel Profilo Candidato,
// l'Area Valutatori è il quarto livello, nella barra laterale.
//
// Le tre card stanno sempre in una riga (richiesta del 2026-10-23). Se ne
// apre una alla volta: "Skill Vision" mostra sotto la riga le pagine del
// livello, le stesse voci della barra laterale (nav-config.ts). La card
// aperta è ricordata nelle preferenze sul server; all'inizio nessuna.
const LEVELS = [
  { key: 'cerchiamo', title: 'Chi cerchiamo', group: 'Chi cerchiamo · Livello 1', icon: HouseValueIcon, description: 'Livello 1 · Il profilo del candidato, i CV e la preselezione' },
  { key: 'adatto', title: 'Chi è più adatto', group: 'Chi è più adatto · Livello 2', icon: LightbulbGemIcon, description: 'Livello 2 · Risultati, confronto e stato della selezione' },
  { key: 'scegliamo', title: 'Chi scegliamo', group: 'Chi scegliamo · Livello 3', icon: CoinsLossIcon, description: 'Livello 3 · I migliori candidati e le fasce di idoneità' },
] as const

export default function ProfileHubPage() {
  const [openKey, setOpenKey] = usePreference<string>('sv-recruiting-profile-open-level', '')
  const openLevel = LEVELS.find((l) => l.key === openKey)
  const items = openLevel ? (RECRUITING_NAV_GROUPS.find((g) => g.label === openLevel.group)?.items ?? []) : []

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Profilo della ricerca" description={<>Dal profilo del candidato alla scelta finale, in tre livelli. La classifica si aggiorna in tempo reale.</>} />

      <div className="label-mono flex items-center gap-1.5 text-muted-foreground">
        <Compass className="size-3.5 shrink-0" aria-hidden="true" />
        Area Operativa
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        {LEVELS.map((level) => (
          <SkillVisionCard
            key={level.key}
            icon={level.icon}
            title={level.title}
            open={openKey === level.key}
            onOpenChange={(open) => setOpenKey(open ? level.key : '')}
            panelPlacement="below"
            size="tall"
            panel={null}
          />
        ))}
      </div>

      {openLevel ? (
        <Card className="gap-3">
          <CardDescription>{openLevel.description}</CardDescription>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <NavCard key={item.screen} to={item.to} icon={item.icon} title={item.label} />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}

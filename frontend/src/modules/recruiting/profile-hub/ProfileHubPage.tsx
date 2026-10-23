import { PageHeader } from '@/components/patterns/PageHeader'
import { CoinsLossIcon, HouseValueIcon, LightbulbGemIcon } from '@/components/patterns/CardIcons'
import { NavCard } from '@/components/patterns/NavCard'
import { SkillVisionCard } from '@/components/patterns/SkillVisionCard'
import { Compass } from 'lucide-react'

import { Card, CardDescription } from '@/components/ui/card'
import { usePersistedFlag } from '@/hooks/use-persisted-flag'
import { homeCardLayout } from '@/lib/home-card-layout'
import { RECRUITING_NAV_GROUPS } from '@/modules/recruiting/nav-config'

// "Profilo della ricerca": le tre card dei primi tre livelli del percorso
// (documento del cliente "Recruiting Module", 2026-10-23) — Chi cerchiamo,
// Chi è più adatto, Chi scegliamo. Prima erano quattro finestre (Profilo
// Candidato, Competenze trasversali, Annuncio di lavoro, Area Valutatori):
// le competenze trasversali e l'annuncio stanno ora nel Profilo Candidato,
// l'Area Valutatori è il quarto livello, nella barra laterale.
//
// Ogni card è una SkillVisionCard con il solo titolo e l'icona a sinistra;
// "Skill Vision" apre sulla destra le pagine del livello, le stesse voci
// della barra laterale (nav-config.ts). Aperto/chiuso è ricordato; all'inizio
// sono tutte chiuse.
const LEVELS = [
  { key: 'cerchiamo', title: 'Chi cerchiamo', group: 'Chi cerchiamo · Livello 1', icon: HouseValueIcon, description: 'Livello 1 · Il profilo del candidato, i CV e la preselezione' },
  { key: 'adatto', title: 'Chi è più adatto', group: 'Chi è più adatto · Livello 2', icon: LightbulbGemIcon, description: 'Livello 2 · Risultati, confronto e stato della selezione' },
  { key: 'scegliamo', title: 'Chi scegliamo', group: 'Chi scegliamo · Livello 3', icon: CoinsLossIcon, description: 'Livello 3 · I migliori candidati e le fasce di idoneità' },
] as const

export default function ProfileHubPage() {
  const [openCerchiamo, setOpenCerchiamo] = usePersistedFlag('sv-recruiting-profile-cerchiamo-view')
  const [openAdatto, setOpenAdatto] = usePersistedFlag('sv-recruiting-profile-adatto-view')
  const [openScegliamo, setOpenScegliamo] = usePersistedFlag('sv-recruiting-profile-scegliamo-view')
  const state = {
    cerchiamo: [openCerchiamo, setOpenCerchiamo],
    adatto: [openAdatto, setOpenAdatto],
    scegliamo: [openScegliamo, setOpenScegliamo],
  } as const
  const cardLayout = homeCardLayout([['cerchiamo', 'adatto'], ['scegliamo']] as const, { cerchiamo: openCerchiamo, adatto: openAdatto, scegliamo: openScegliamo })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Profilo della ricerca" description={<>Dal profilo del candidato alla scelta finale, in tre livelli. La classifica si aggiorna in tempo reale.</>} />

      <div className="label-mono flex items-center gap-1.5 text-muted-foreground">
        <Compass className="size-3.5 shrink-0" aria-hidden="true" />
        Area Operativa
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        {LEVELS.map((level) => {
          const [open, setOpen] = state[level.key]
          const items = RECRUITING_NAV_GROUPS.find((g) => g.label === level.group)?.items ?? []
          return (
            <SkillVisionCard
              key={level.key}
              icon={level.icon}
              title={level.title}
              open={open}
              onOpenChange={setOpen}
              style={cardLayout[level.key]}
              panel={
                <Card className="gap-3">
                  <CardDescription>{level.description}</CardDescription>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {items.map((item) => (
                      <NavCard key={item.screen} to={item.to} icon={item.icon} title={item.label} />
                    ))}
                  </div>
                </Card>
              }
            />
          )
        })}
      </div>
    </div>
  )
}

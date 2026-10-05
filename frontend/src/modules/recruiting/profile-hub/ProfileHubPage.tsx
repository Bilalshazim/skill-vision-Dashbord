import { PageHeader } from '@/components/patterns/PageHeader'
import { CoinsLossIcon, GearAlertIcon, HouseValueIcon, LightbulbGemIcon } from '@/components/patterns/CardIcons'
import { SkillVisionCard } from '@/components/patterns/SkillVisionCard'
import { Compass, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardDescription } from '@/components/ui/card'
import { usePersistedFlag } from '@/hooks/use-persisted-flag'
import { homeCardLayout } from '@/lib/home-card-layout'
import { EvaluatorAreaCard } from '@/modules/recruiting/profile-hub/EvaluatorAreaCard'
import { JobPostingSection } from '@/modules/recruiting/profile-hub/JobPostingSection'
import { SoftSkillSection } from '@/modules/recruiting/profile-hub/SoftSkillSection'
import { SurveyLinkSection } from '@/modules/recruiting/profile-hub/SurveyLinkSection'

// Migrated from modules/recruiting.html #scr-profilo ("Profilo della
// ricerca" — nav-labeled "Report", ~241-354): le quattro finestre nello
// stesso ordine di legacy (Profilo Candidato / Competenze trasversali /
// Annuncio di lavoro / Area Valutatore).
//
// Come nei disegni del cliente (Roberto Feliciani): ogni finestra è una
// SkillVisionCard con il solo titolo e l'icona a sinistra; "Skill Vision" apre
// sulla destra, nella stessa riga, il pannello con una riga di descrizione e
// quello che prima stava dentro la card (identico: stesse sezioni, stessi
// dialog). Aperto/chiuso è ricordato nel browser; all'inizio sono tutte chiuse.
export default function ProfileHubPage() {
  const [openProfilo, setOpenProfilo] = usePersistedFlag('sv-recruiting-profile-profilo-view', 'skillvision', 'oggi')
  const [openSoft, setOpenSoft] = usePersistedFlag('sv-recruiting-profile-soft-view', 'skillvision', 'oggi')
  const [openAnnuncio, setOpenAnnuncio] = usePersistedFlag('sv-recruiting-profile-annuncio-view', 'skillvision', 'oggi')
  const [openValutatore, setOpenValutatore] = usePersistedFlag('sv-recruiting-profile-valutatore-view', 'skillvision', 'oggi')
  const cardLayout = homeCardLayout(
    [
      ['profilo', 'soft'],
      ['annuncio', 'valutatore'],
    ] as const,
    { profilo: openProfilo, soft: openSoft, annuncio: openAnnuncio, valutatore: openValutatore },
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Profilo della ricerca" description={<>Configura posizione, mansione e competenze trasversali. La classifica si aggiorna in tempo reale.</>} />

      <div className="label-mono flex items-center gap-1.5 text-muted-foreground">
        <Compass className="size-3.5 shrink-0" aria-hidden="true" />
        Area Operativa
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <SkillVisionCard
          icon={HouseValueIcon}
          title="Profilo Candidato"
          open={openProfilo}
          onOpenChange={setOpenProfilo}
          style={cardLayout.profilo}
          panel={
            <Card className="gap-3">
              <CardDescription>Il profilo della ricerca in corso · Responsabilità, competenze e requisiti</CardDescription>
              <Button asChild variant="outline" className="h-auto justify-start gap-2.5 p-3 text-left">
                <Link to="/recruiting/job-profile">
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1 text-app-small font-medium text-foreground">Scheda professionale</span>
                  <span className="text-app-caption font-medium text-foreground dark:text-primary">Apri scheda →</span>
                </Link>
              </Button>
            </Card>
          }
        />

        <SkillVisionCard
          icon={LightbulbGemIcon}
          title="Competenze trasversali"
          open={openSoft}
          onOpenChange={setOpenSoft}
          style={cardLayout.soft}
          panel={
            <Card className="gap-3">
              <CardDescription>Quelle che contano per il ruolo · Link al questionario</CardDescription>
              <SoftSkillSection />
              <SurveyLinkSection />
            </Card>
          }
        />

        <SkillVisionCard
          icon={CoinsLossIcon}
          title="Annuncio di lavoro"
          open={openAnnuncio}
          onOpenChange={setOpenAnnuncio}
          style={cardLayout.annuncio}
          panel={
            <Card className="gap-3">
              <CardDescription>Il link dell’annuncio pubblicato · Riepilogo della ricerca</CardDescription>
              <JobPostingSection />
            </Card>
          }
        />

        <SkillVisionCard
          icon={GearAlertIcon}
          title="Area Valutatori"
          open={openValutatore}
          onOpenChange={setOpenValutatore}
          style={cardLayout.valutatore}
          panel={
            <Card className="gap-3">
              <CardDescription>Schede di intervista, valutazione e report · Valutatori, invii e sintesi</CardDescription>
              <EvaluatorAreaCard />
            </Card>
          }
        />
      </div>
    </div>
  )
}

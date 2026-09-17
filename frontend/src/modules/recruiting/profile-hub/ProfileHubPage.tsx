import { Brain, ClipboardList, Compass, FileText, LayoutGrid, Megaphone, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { EvaluatorAreaCard } from '@/modules/recruiting/profile-hub/EvaluatorAreaCard'
import { JobPostingSection } from '@/modules/recruiting/profile-hub/JobPostingSection'
import { MasterCard } from '@/modules/recruiting/profile-hub/MasterCard'
import { SoftSkillSection } from '@/modules/recruiting/profile-hub/SoftSkillSection'
import { SurveyLinkSection } from '@/modules/recruiting/profile-hub/SurveyLinkSection'

// Migrated from modules/recruiting.html #scr-profilo ("Profilo della
// ricerca" — nav-labeled "Report", ~241-354). Per the Phase 19 audit and
// this phase's explicit scope: the hub shell (4 master cards, accordion
// behavior, same order as legacy's #mcHomeGrid: Profilo Candidato / Soft
// skill / Annuncio di lavoro / Area Valutatore), the Profilo Candidato
// bridge to the already-migrated JD route, Soft Skill's READ-ONLY display,
// Survey Link, and Job Posting are all migrated here. The Area Valutatore /
// Protocollo di Intervista forms stay deferred to Phase 21 (see
// EvaluatorAreaCard.tsx) — that sub-feature alone rivals the entire JD
// screen in size, per the Phase 19 audit's finding.
export default function ProfileHubPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
          <LayoutGrid className="size-[22px] text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Profilo della ricerca</h2>
          <p className="max-w-[70ch] text-[13px] text-muted-foreground">Configura ruolo, mansione e soft skill. Il ranking si aggiorna in tempo reale.</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Compass className="size-3.5 shrink-0" aria-hidden="true" />
        Area Operativa
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MasterCard icon={User} title="Profilo Candidato">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate('/recruiting/job-profile')
            }}
            className="flex w-full items-center gap-2.5 rounded-md border border-border p-3 text-left transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 text-[13px] font-medium text-foreground">Scheda professionale</span>
            <span className="text-[12px] font-medium text-foreground dark:text-primary">Apri scheda →</span>
          </button>
        </MasterCard>

        <MasterCard icon={Brain} title="Soft skill">
          <SoftSkillSection />
          <SurveyLinkSection />
        </MasterCard>

        <MasterCard icon={Megaphone} title="Annuncio di lavoro">
          <JobPostingSection />
        </MasterCard>

        <MasterCard icon={ClipboardList} title="Area Valutatore">
          <EvaluatorAreaCard />
        </MasterCard>
      </div>
    </div>
  )
}

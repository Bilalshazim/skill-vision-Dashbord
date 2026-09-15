import { ClipboardList } from 'lucide-react'

import { EvaluatorWorkspace } from '@/modules/recruiting/evaluate/EvaluatorWorkspace'

// Phase 33 §4/§7 — reached from "Area Valutatore" for a shell-logged-in
// user whose account is linked to a real Evaluator record (Evaluator.userId
// — the "authenticated evaluator via JWT" path, §5.1). No token in the URL:
// EvaluatorWorkspace resolves identity via the normal bearer session, same
// as every other Recruiting screen. The accountless/scoped-token path has
// its own standalone route — see EvaluateStandalonePage.tsx — since an
// external evaluator with only a token has no shell session to render this
// layout's auth guard against.
export default function RecruitingEvaluatePage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
          <ClipboardList className="size-[22px] text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Le mie valutazioni</h2>
          <p className="max-w-[70ch] text-[13px] text-muted-foreground">Candidature che ti sono state assegnate come valutatore.</p>
        </div>
      </div>
      <EvaluatorWorkspace />
    </div>
  )
}

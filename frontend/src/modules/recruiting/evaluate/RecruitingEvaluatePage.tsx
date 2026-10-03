import { PageHeader } from '@/components/patterns/PageHeader'

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
      <PageHeader level="page" className="mb-0" title="Le mie valutazioni" description="Candidature che ti sono state assegnate come valutatore." />
      <EvaluatorWorkspace />
    </div>
  )
}

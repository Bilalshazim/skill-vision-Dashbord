import { Logo } from '@/layouts/Logo'
import { Card } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { readSharedTheme } from '@/modules/assessment/lib/shell-bridge'
import { EvaluatorWorkspace } from '@/modules/recruiting/evaluate/EvaluatorWorkspace'

// Phase 33 §4/§5 — the accountless evaluator entry point (OD-9's scoped-
// token path). Deliberately its OWN top-level route (/evaluate?
// evaluatorToken=…), outside AppShell/RecruitingLayout entirely — mirrors
// the established precedent for exactly this situation, Assessment's own
// /assessment/evaluate?evalToken=… (AssessmentEvaluatePage.tsx): "an
// external evaluator opening this link has no shell login at all", so
// nothing here can depend on the shell auth guard or global topbar. The
// scoped token itself is the sole credential — verified entirely
// server-side on every request (see resolveEvaluatorAccess() in
// backend/src/modules/evaluators/routes.ts), never by this page deciding
// anything is "allowed".
export default function EvaluateStandalonePage() {
  const [params] = useSearchParams()
  const token = params.get('evaluatorToken')
  const theme = readSharedTheme()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10" data-theme={theme}>
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-app-small text-muted-foreground">Area valutatore</p>
        </div>

        {!token ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5">
            <p className="flex items-start gap-2 text-app-small font-medium text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Link non valido: è incompleto. Chiedi a chi te l'ha inviato un link nuovo.
            </p>
          </div>
        ) : (
          <Card padding="lg">
            <EvaluatorWorkspace evaluatorToken={token} />
          </Card>
        )}
      </div>
    </div>
  )
}

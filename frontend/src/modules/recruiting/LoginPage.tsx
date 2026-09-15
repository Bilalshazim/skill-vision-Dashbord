import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api/endpoints'
import { ApiError, setBackendSession } from '@/lib/api/client'

// The standalone React frontend's own login screen — this deployment has no
// legacy shell to authenticate against (see RecruitingLayout's auth guard),
// so this is a real, direct call to the existing backend auth API
// (authApi.login / setBackendSession, both already used elsewhere — no new
// token or session handling is introduced here). On success it establishes
// the SAME backend session RecruitingAuthGuard checks for.
export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { accessToken, refreshToken, user } = await authApi.login(email, password)
      setBackendSession(accessToken, refreshToken, user)
      navigate('/recruiting', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.network
            ? 'Impossibile contattare il server. Riprova.'
            : err.message
          : 'Accesso non riuscito. Riprova.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Skill Vision</CardTitle>
          <CardDescription>Accedi per continuare</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting ? 'Accesso in corso…' : 'Accedi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

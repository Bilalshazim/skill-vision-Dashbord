import { afterEach, describe, expect, it, vi } from 'vitest'

// This file only unit-tests lib/mailer.ts's own logic in isolation
// (configured/not-configured branching, error shape) — the shortlist.test.ts
// / emailConfig.test.ts files cover it wired into real routes against the
// real test database. `vi.resetModules()` + a fresh dynamic import per test
// is required because env.ts computes `smtpConfigured` once at import time
// from process.env — the same reason every other env-dependent test in
// this suite that needs a different config re-imports rather than mutating
// the frozen `env` object in place.
describe('lib/mailer.ts — SMTP configuration boundary', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('reports not configured, and sendMail/verifySmtpConnection fail cleanly, when SMTP env vars are unset', async () => {
    vi.stubEnv('SMTP_HOST', '')
    vi.stubEnv('SMTP_USER', '')
    vi.stubEnv('SMTP_PASSWORD', '')
    vi.stubEnv('MAIL_FROM', '')
    vi.resetModules()
    const { smtpConfigured, sendMail, verifySmtpConnection } = await import('../src/lib/mailer.js')

    expect(smtpConfigured).toBe(false)

    const sendResult = await sendMail({ to: 'candidate@example.com', subject: 'x', text: 'y' })
    expect(sendResult.ok).toBe(false)
    if (!sendResult.ok) expect(sendResult.reason).toMatch(/not configured/i)

    const connResult = await verifySmtpConnection()
    expect(connResult.ok).toBe(false)
    if (!connResult.ok) expect(connResult.reason).toMatch(/not configured/i)
  })

  it('reports configured and sends successfully via the JSON transport in NODE_ENV=test', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.test.local')
    vi.stubEnv('SMTP_USER', 'test@example.com')
    vi.stubEnv('SMTP_PASSWORD', 'whatever')
    vi.stubEnv('MAIL_FROM', 'test@example.com')
    vi.resetModules()
    const { smtpConfigured, sendMail } = await import('../src/lib/mailer.js')

    expect(smtpConfigured).toBe(true)
    const result = await sendMail({ to: 'candidate@example.com', subject: 'Test', text: 'Hello' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.messageId).toBeTruthy()
  })
})

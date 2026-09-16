// Real mailer for the "INVIA LINK TEST" workflow (shortlist/routes.ts
// POST /:id/send-test) and the platform-admin test-send endpoint
// (emailConfig/routes.ts). This is the ONLY module in the codebase that
// reads env.resendApiKey — nowhere else imports it, nothing logs it, and
// no route ever returns it (mirrors the existing EmailServiceConfig
// redact() discipline for the DB-based provider abstraction, applied here
// to the real env-based one).
//
// WHY RESEND, NOT SMTP: this originally sent over real SMTP (nodemailer).
// In production, both port 465 (implicit TLS) and 587 (STARTTLS) timed
// out connecting outbound from Railway to the mailbox host — confirmed via
// backend logs (a clean ~23s "Connection timeout" on 465, a ~120s hang
// matching nodemailer's default connectionTimeout on 587) — a network-
// layer block between Railway and that host, not a credentials or config
// problem. Resend sends over HTTPS (443), which isn't subject to the same
// outbound-SMTP-port filtering. The exported interface below
// (sendMail/verifySmtpConnection/smtpConfigured) is unchanged so neither
// caller file needed to change.
import { Resend } from 'resend'

import { env, smtpConfigured } from './env.js'
import { logger } from './logger.js'

export { smtpConfigured }

let resendClient: Resend | null = null

function getClient(): Resend {
  if (!smtpConfigured) {
    throw new Error('Email sending is not configured — set RESEND_API_KEY and MAIL_FROM')
  }
  if (!resendClient) resendClient = new Resend(env.resendApiKey)
  return resendClient
}

export type SendMailAttachment = { filename: string; content: Buffer; cid?: string; contentType?: string }

export type SendMailInput = {
  to: string
  subject: string
  text: string
  html?: string
  /** Routes replies to the configured sender (company HR / Skill Vision admin), not the shared platform mailbox — see SenderConfig usage in shortlist/routes.ts. */
  replyTo?: string
  /** CID-embeddable inline images (the branded email's logo, in practice — see lib/emailTemplates.ts) or regular attachments. */
  attachments?: SendMailAttachment[]
}

export type SendMailResult = { ok: true; messageId: string } | { ok: false; reason: string }

// Never throws — every caller needs a clean success/failure result to
// decide what to persist (TestInvitation.sentStatus), not an exception to
// catch. The `reason` string is safe to store/log: Resend's error messages
// describe the failure (invalid domain, rate limit, bad address, etc.),
// never the API key itself.
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  if (!smtpConfigured) {
    return { ok: false, reason: 'Email sending is not configured on this server (missing RESEND_API_KEY/MAIL_FROM)' }
  }
  // §8 — the automated suite runs against a REAL Postgres database (see
  // tests/setup.ts) but must never attempt a real network call (no Resend
  // account exists in CI, and it would make tests flaky/slow) — same
  // discipline as logger.ts's own existing NODE_ENV==='test' branch.
  if (env.nodeEnv === 'test') {
    return { ok: true, messageId: `test-${Date.now()}` }
  }
  try {
    const { data, error } = await getClient().emails.send({
      from: `${env.mailFromName} <${env.mailFrom}>`,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentId: a.cid, contentType: a.contentType })),
    })
    if (error) return { ok: false, reason: error.message }
    return { ok: true, messageId: data!.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ mailFrom: env.mailFrom }, `Resend send failed: ${message}`)
    return { ok: false, reason: message }
  }
}

// §7/§8 — a lightweight preflight for the platform-admin test-send
// endpoint and `npm run smtp:verify`. Resend is a stateless HTTP API, so
// unlike the old SMTP transport there is no persistent connection to
// verify/handshake ahead of time — this checks the API key is present and
// correctly formed (via a real, side-effect-free API call: fetching the
// domain list) rather than actually sending anything.
export async function verifySmtpConnection(): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!smtpConfigured) {
    return { ok: false, reason: 'Email sending is not configured on this server (missing RESEND_API_KEY/MAIL_FROM)' }
  }
  if (env.nodeEnv === 'test') return { ok: true }
  try {
    const { error } = await getClient().domains.list()
    if (error) return { ok: false, reason: error.message }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, reason: message }
  }
}

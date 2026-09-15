// Real SMTP mailer for the "INVIA LINK TEST" workflow (shortlist/routes.ts
// POST /:id/send-test) and the platform-admin test-send endpoint
// (emailConfig/routes.ts). This is the ONLY module in the codebase that
// reads env.smtpPassword — nowhere else imports it, nothing logs it, and
// no route ever returns it (mirrors the existing EmailServiceConfig
// redact() discipline for the DB-based provider abstraction, applied here
// to the real env-based one).
//
// WHY ENV, NOT THE DB (EmailServiceConfig): that model's shape
// (providerName/apiEndpointUrl/apiKeySecretRef) was built for a generic
// "some external HTTP API" provider Phase 30 hadn't chosen yet. This task
// specifies a concrete SMTP mailbox with an explicit env-var contract
// ("the mailbox password will be supplied through the backend .env only")
// — forcing that through the API-shaped table would mean stuffing an SMTP
// host/port/secure triple into a field named apiEndpointUrl and lying
// about what apiKeySecretRef points to. Kept separate instead; the
// existing EmailServiceConfig table/routes are untouched.
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

import { env, smtpConfigured } from './env.js'
import { logger } from './logger.js'

export { smtpConfigured }

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!smtpConfigured) {
    throw new Error('SMTP is not configured — set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and MAIL_FROM in the backend .env')
  }
  if (!transporter) {
    transporter =
      env.nodeEnv === 'test'
        ? // §8 — the automated suite runs against a REAL Postgres database
          // (see tests/setup.ts) but must never attempt a real network SMTP
          // connection (no such server exists in CI, and it would make tests
          // flaky/slow). Nodemailer's built-in JSON transport exercises the
          // exact same success/failure code path in shortlist/routes.ts
          // (a real Transporter, a real sendMail() call, a real messageId)
          // without touching the network — same discipline as logger.ts's
          // own existing NODE_ENV==='test' branch (silent logging).
          nodemailer.createTransport({ jsonTransport: true })
        : nodemailer.createTransport({
            host: env.smtpHost,
            port: env.smtpPort,
            secure: env.smtpSecure, // true for port 465 (implicit TLS), false for STARTTLS on 587
            auth: { user: env.smtpUser, pass: env.smtpPassword },
          })
  }
  return transporter
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
// catch. The `reason` string is safe to store/log: nodemailer/SMTP error
// messages describe the failure (auth rejected, connection refused, mailbox
// unknown, etc.), never the password itself.
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  if (!smtpConfigured) {
    return { ok: false, reason: 'SMTP is not configured on this server (missing SMTP_HOST/SMTP_USER/SMTP_PASSWORD/MAIL_FROM)' }
  }
  try {
    const info = await getTransporter().sendMail({
      from: `"${env.mailFromName}" <${env.mailFrom}>`,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content, cid: a.cid, contentType: a.contentType })),
    })
    return { ok: true, messageId: info.messageId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ smtpHost: env.smtpHost, smtpUser: env.smtpUser }, `SMTP send failed: ${message}`)
    return { ok: false, reason: message }
  }
}

// §7/§8 — verifies the connection + authentication without sending
// anything, for the platform-admin test-send endpoint's preflight and for
// a standalone `npm run smtp:verify` CLI check (scripts/verify-smtp.ts).
export async function verifySmtpConnection(): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!smtpConfigured) {
    return { ok: false, reason: 'SMTP is not configured on this server (missing SMTP_HOST/SMTP_USER/SMTP_PASSWORD/MAIL_FROM)' }
  }
  try {
    await getTransporter().verify()
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, reason: message }
  }
}

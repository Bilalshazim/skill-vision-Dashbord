// Fail fast on a missing required var rather than surface a confusing error
// three layers down — this IS the "validation" §1 asks for at the config
// boundary, distinct from per-request input validation (src/middleware/validate.ts).
function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
  jwtRefreshTtlDays: 30,
  cvStorageRoot: process.env.CV_STORAGE_ROOT || './storage/files',
  fileUrlSecret: required('FILE_URL_SECRET'),
  fileUrlTtlSeconds: Number(process.env.FILE_URL_TTL_SECONDS || 300),
  testProviderWebhookSecret: process.env.TEST_PROVIDER_WEBHOOK_SECRET || '',
  // Phase 34 §16/§23 — unset (the local-dev default) keeps CORS wide open,
  // exactly as every earlier phase already behaved; set in production to a
  // comma-separated allowlist of real frontend origin(s).
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : undefined,
  // Real SMTP mailer for INVIA LINK TEST — deliberately NOT `required()`:
  // a dev/test environment must still boot without a real mailbox
  // configured (exactly the same reasoning as testProviderWebhookSecret
  // above). Kept even though lib/mailer.ts no longer sends over SMTP
  // (production found SMTP ports 465/587 both blocked outbound from
  // Railway to this host — a network-layer block, not a config problem)
  // so the old config still exists if SMTP is ever viable again.
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: (process.env.SMTP_SECURE ?? 'true') !== 'false',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  // Resend (HTTP API, port 443 — not blocked the way raw SMTP was).
  // `smtpConfigured` (below) is still the single place that decides "is
  // sending actually possible" — see lib/mailer.ts, which is the ONLY
  // module that ever reads resendApiKey; it is never read anywhere else,
  // never logged, and never included in any API response.
  resendApiKey: process.env.RESEND_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || '',
  mailFromName: process.env.MAIL_FROM_NAME || 'Skill Vision',
  // "CONSIDERAZIONI DELL'ESPERTO" (Assessment interview summary) — the ONLY
  // module that reads this is modules/assessmentAi/routes.ts; never logged,
  // never returned in any response. Not required(): the button shows a
  // clear "not configured" error rather than the server failing to boot.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
}

// Name kept as `smtpConfigured` — shortlist/routes.ts and emailConfig/routes.ts
// import it by this exact name, and neither is SMTP-specific in what it
// actually checks; renaming would touch both files for no functional
// reason. Means "is lib/mailer.ts able to send at all right now".
export const smtpConfigured = Boolean(env.resendApiKey && env.mailFrom)

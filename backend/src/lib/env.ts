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
  // above). `smtpConfigured` is the single place that decides "is sending
  // actually possible" — see lib/mailer.ts, which is the ONLY module that
  // ever reads smtpPassword; it is never read anywhere else, never logged,
  // and never included in any API response.
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: (process.env.SMTP_SECURE ?? 'true') !== 'false',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  mailFrom: process.env.MAIL_FROM || '',
  mailFromName: process.env.MAIL_FROM_NAME || 'Skill Vision',
}

export const smtpConfigured = Boolean(env.smtpHost && env.smtpUser && env.smtpPassword && env.mailFrom)

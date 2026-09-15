// §7/§8 — a backend command to verify the SMTP configuration without
// going through the API or touching any candidate/shortlist data at all.
// Usage:
//   npm run smtp:verify                       # connection + auth only
//   npm run smtp:verify -- --to you@example.com  # also sends one real test email
import { smtpConfigured, sendMail, verifySmtpConnection } from '../src/lib/mailer.js'
import { env } from '../src/lib/env.js'

async function main() {
  console.log(`SMTP_HOST=${env.smtpHost || '(unset)'}  SMTP_PORT=${env.smtpPort}  SMTP_SECURE=${env.smtpSecure}  SMTP_USER=${env.smtpUser || '(unset)'}`)
  console.log(`MAIL_FROM=${env.mailFrom || '(unset)'}  MAIL_FROM_NAME=${env.mailFromName}`)
  console.log(`configured: ${smtpConfigured}\n`)

  if (!smtpConfigured) {
    console.error('SMTP is not configured — set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and MAIL_FROM in backend/.env')
    process.exit(1)
  }

  console.log('Verifying connection + authentication…')
  const connection = await verifySmtpConnection()
  if (!connection.ok) {
    console.error(`FAILED: ${connection.reason}`)
    process.exit(1)
  }
  console.log('OK — connection and authentication succeeded.')

  const toIndex = process.argv.indexOf('--to')
  const to = toIndex >= 0 ? process.argv[toIndex + 1] : undefined
  if (!to) {
    console.log('\nNo --to address given — skipping the actual send. Pass --to <email> to send a real test email.')
    return
  }

  console.log(`\nSending a real test email to ${to}…`)
  const result = await sendMail({
    to,
    subject: 'Skill Vision — SMTP verify script',
    text: `Test email sent by backend/scripts/verify-smtp.ts at ${new Date().toISOString()}.`,
  })
  if (!result.ok) {
    console.error(`FAILED: ${result.reason}`)
    process.exit(1)
  }
  console.log(`OK — sent, messageId=${result.messageId}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

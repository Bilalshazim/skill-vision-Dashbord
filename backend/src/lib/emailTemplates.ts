// The one branded HTML/text email template for the "INVIA LINK TEST" flow
// (shortlist/routes.ts POST /:id/send-test) — replaces the previous
// inconsistent pair (a plain unbranded default vs. a text-only custom
// EmailTemplate path with no HTML at all). Both paths now render through
// THIS module, so there is exactly one visual design, not two.
//
// EMAIL-CLIENT SAFETY: table-based layout (not flexbox/grid — Outlook's
// Word rendering engine ignores both), styles inlined on every element
// that carries them (Gmail strips many <style> block rules), a `<style>`
// block used only for what truly can't be inlined (the one responsive
// @media query + a websafe font stack fallback). No JavaScript anywhere.
// The logo is a real project asset (assets/Logo/logo_black.svg) rasterized
// to PNG and sent as a CID-embedded attachment — raw SVG is unreliably
// rendered across email clients (Outlook desktop in particular), and no
// public URL exists for this dev environment to link out to instead.
import fs from 'node:fs'
import path from 'node:path'

// Resolved relative to process.cwd() (the backend/ directory every npm
// script — dev, start, test — already runs from), NOT relative to this
// compiled file's own location: `tsc` only compiles .ts sources, it does
// not copy static assets into dist/, so an import.meta.url-relative path
// would 404 in production. Same convention env.cvStorageRoot already uses
// (see lib/storage.ts) — this asset lives at backend/assets/email/logo.png,
// a sibling of src/, not inside it.
export const LOGO_PATH = path.resolve(process.cwd(), 'assets/email/logo.png')
export const LOGO_CID = 'skillvision-logo'

export type TestInvitationVars = {
  candidateName: string
  companyName: string
  jobTitle: string
  testLink: string
}

// §6/§10 — the supported placeholder set, usable in BOTH the default
// template and a company's custom EmailTemplate.subject/body. Accepts
// `{{var}}` and `{var}` (case-insensitive), a superset of the previous
// testLink-only regex this replaces.
export function applyTemplateVariables(input: string, vars: TestInvitationVars): string {
  let out = input
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{?\\s*${key}\\s*\\}?\\}`, 'gi'), value)
  }
  return out
}

const BRAND_INK = '#0D0C0A'
const BRAND_ACCENT = '#B4C614'
const BRAND_MUTED = '#6B7280'
const BRAND_BORDER = '#E5E7EB'
const BRAND_BG = '#F4F4F2'

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// `introHtml` is pre-escaped, line-break-converted HTML for the one
// paragraph block that differs between the default copy and a company's
// custom template body (see shortlist/routes.ts) — everything else
// (header, CTA, fallback link, footer) is identical in both paths, which
// is what makes this "one template", not two designs.
function renderHtml(vars: TestInvitationVars, introHtml: string): string {
  const { candidateName, companyName, jobTitle, testLink } = vars
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Invito al test di selezione</title>
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  img { -ms-interpolation-mode: bicubic; }
  @media only screen and (max-width: 600px) {
    .sv-container { width: 100% !important; }
    .sv-px { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:${BRAND_BG}; font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND_BG};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="sv-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#FFFFFF; border-radius:10px; overflow:hidden; border:1px solid ${BRAND_BORDER};">
          <tr>
            <td class="sv-px" align="center" style="padding: 32px 40px 8px 40px;">
              <img src="cid:${LOGO_CID}" width="160" alt="Skill Vision" style="display:block; border:0; outline:none; text-decoration:none; height:auto;">
            </td>
          </tr>
          <tr>
            <td class="sv-px" style="padding: 16px 40px 0 40px; font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif;">
              <h1 style="margin:0 0 4px 0; font-size:20px; line-height:28px; color:${BRAND_INK}; font-weight:700;">Ciao ${escapeHtml(candidateName)},</h1>
              <p style="margin:0 0 4px 0; font-size:13px; line-height:20px; color:${BRAND_MUTED};">Candidatura — <strong style="color:${BRAND_INK};">${escapeHtml(jobTitle)}</strong> presso <strong style="color:${BRAND_INK};">${escapeHtml(companyName)}</strong></p>
            </td>
          </tr>
          <tr>
            <td class="sv-px" style="padding: 20px 40px 0 40px; font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; font-size:14.5px; line-height:23px; color:${BRAND_INK};">
              ${introHtml}
            </td>
          </tr>
          <tr>
            <td class="sv-px" style="padding: 28px 40px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:8px; background-color:${BRAND_ACCENT};">
                    <a href="${testLink}" target="_blank" style="display:inline-block; padding:14px 32px; font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; letter-spacing:0.5px; color:${BRAND_INK}; text-decoration:none; border-radius:8px;">INIZIA IL TEST</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="sv-px" style="padding: 8px 40px 0 40px; font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; font-size:12px; line-height:18px; color:${BRAND_MUTED};">
              <p style="margin:0 0 4px 0;">Se il pulsante non funziona, copia e incolla questo link nel browser:</p>
              <p style="margin:0; word-break:break-all;"><a href="${testLink}" target="_blank" style="color:${BRAND_INK};">${testLink}</a></p>
            </td>
          </tr>
          <tr>
            <td class="sv-px" style="padding: 28px 40px 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${BRAND_BORDER};">
                <tr>
                  <td style="padding-top:20px; font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; font-size:12px; line-height:18px; color:${BRAND_MUTED};">
                    <p style="margin:0 0 4px 0; font-weight:700; color:${BRAND_INK};">Skill Vision</p>
                    <p style="margin:0 0 4px 0;">Domande su questo invito? Rispondi a questa email o scrivi a <a href="mailto:info@skill-vision.it" style="color:${BRAND_INK};">info@skill-vision.it</a>.</p>
                    <p style="margin:0; color:#9CA3AF;">Questa email è stata inviata perché la tua candidatura è in fase di valutazione per la posizione indicata sopra.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function paragraphsToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px 0;">${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

const DEFAULT_INTRO = (vars: TestInvitationVars) =>
  `Ottime notizie! Sei stato selezionato per proseguire nel processo di selezione per la posizione di ${vars.jobTitle} presso ${vars.companyName}.\n\nIl prossimo passo è completare un breve test di valutazione. Ci vorranno solo pochi minuti: clicca sul pulsante qui sotto per iniziare.`

export type RenderedEmail = { subject: string; html: string; text: string }

// The default branded template (no custom EmailTemplate configured for
// this campaign) — §4/§5/§6.
export function renderDefaultTestInvitation(vars: TestInvitationVars): RenderedEmail {
  const subject = applyTemplateVariables('Invito al test di selezione — {{jobTitle}}', vars)
  const intro = DEFAULT_INTRO(vars)
  const html = renderHtml(vars, paragraphsToHtml(intro))
  const text = renderPlainText(vars, intro)
  return { subject, html, text }
}

// §9/§10 — a company's custom EmailTemplate now ALSO renders through the
// same branded shell (logo/CTA/footer), with its own subject/body run
// through the same variable substitution — fixing the previous
// inconsistency where a custom template produced text-only, unbranded
// email. `rawBody` is the template's own wording; only the intro block of
// the shell differs from the default path.
export function renderCustomTestInvitation(subjectTemplate: string, bodyTemplate: string, vars: TestInvitationVars): RenderedEmail {
  const subject = applyTemplateVariables(subjectTemplate, vars)
  const body = applyTemplateVariables(bodyTemplate, vars)
  const html = renderHtml(vars, paragraphsToHtml(body))
  const text = renderPlainText(vars, body)
  return { subject, html, text }
}

// §7 — the plain-text fallback nodemailer sends alongside the HTML part
// (multipart/alternative), containing the SAME information: greeting,
// company/job context, intro, the link (twice — as the "button" and as
// the visible fallback, mirroring the HTML structure), and the footer.
function renderPlainText(vars: TestInvitationVars, intro: string): string {
  const { candidateName, companyName, jobTitle, testLink } = vars
  return [
    `Ciao ${candidateName},`,
    '',
    `Candidatura — ${jobTitle} presso ${companyName}`,
    '',
    intro,
    '',
    `INIZIA IL TEST: ${testLink}`,
    '',
    'Se il link sopra non funziona, copialo e incollalo nel browser:',
    testLink,
    '',
    '---',
    'Skill Vision',
    'Domande su questo invito? Rispondi a questa email o scrivi a info@skill-vision.it.',
    'Questa email è stata inviata perché la tua candidatura è in fase di valutazione per la posizione indicata sopra.',
  ].join('\n')
}

let cachedLogo: Buffer | null = null
export function readLogoBuffer(): Buffer {
  if (!cachedLogo) cachedLogo = fs.readFileSync(LOGO_PATH)
  return cachedLogo
}

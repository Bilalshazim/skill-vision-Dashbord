import { describe, expect, it } from 'vitest'

import { applyTemplateVariables, renderCustomTestInvitation, renderDefaultTestInvitation } from '../src/lib/emailTemplates.js'

const vars = { candidateName: 'Maria Rossi', companyName: 'Acme Corp', jobTitle: 'Senior Frontend Engineer', testLink: 'https://dashboard.skill-vision.it/t/abc123' }

describe('lib/emailTemplates.ts — branded "INVIA LINK TEST" email', () => {
  it('applyTemplateVariables supports both {{var}} and {var}, case-insensitively', () => {
    expect(applyTemplateVariables('Hello {{candidateName}}', vars)).toBe('Hello Maria Rossi')
    expect(applyTemplateVariables('Hello {candidateName}', vars)).toBe('Hello Maria Rossi')
    expect(applyTemplateVariables('Hello {{CANDIDATENAME}}', vars)).toBe('Hello Maria Rossi')
    expect(applyTemplateVariables('{{jobTitle}} at {{companyName}}: {{testLink}}', vars)).toBe('Senior Frontend Engineer at Acme Corp: https://dashboard.skill-vision.it/t/abc123')
  })

  describe('renderDefaultTestInvitation', () => {
    const result = renderDefaultTestInvitation(vars)

    it('subject follows "Invito al test di selezione — {jobTitle}"', () => {
      expect(result.subject).toBe('Invito al test di selezione — Senior Frontend Engineer')
    })

    it('HTML includes candidate name, company, job title, CTA, link, and a CID logo reference', () => {
      expect(result.html).toContain('Maria Rossi')
      expect(result.html).toContain('Acme Corp')
      expect(result.html).toContain('Senior Frontend Engineer')
      expect(result.html).toContain('INIZIA IL TEST')
      expect(result.html).toContain(vars.testLink)
      expect(result.html).toContain('cid:skillvision-logo')
      expect(result.html).toContain('info@skill-vision.it') // footer contact
    })

    it('is real, safe, table-based email HTML — no JavaScript, no flexbox/grid layout', () => {
      expect(result.html).not.toMatch(/<script/i)
      expect(result.html).not.toContain('display:flex')
      expect(result.html).not.toContain('display:grid')
      expect(result.html).toContain('<table')
    })

    it('plain-text fallback contains the same information as the HTML', () => {
      expect(result.text).toContain('Maria Rossi')
      expect(result.text).toContain('Acme Corp')
      expect(result.text).toContain('Senior Frontend Engineer')
      expect(result.text).toContain('INIZIA IL TEST')
      expect(result.text).toContain(vars.testLink)
      expect(result.text).not.toMatch(/<[a-z]+>/i) // genuinely plain, not HTML-with-tags-stripped-badly
    })
  })

  describe('renderCustomTestInvitation — §9/§10: a company template now ALSO gets real HTML, not text-only', () => {
    const result = renderCustomTestInvitation('Il tuo test per {{jobTitle}} è pronto', 'Ciao {{candidateName}}, completa il test qui: {{testLink}}', vars)

    it('substitutes variables in the custom subject', () => {
      expect(result.subject).toBe('Il tuo test per Senior Frontend Engineer è pronto')
    })

    it('substitutes variables in the custom body for BOTH html and text', () => {
      expect(result.html).toContain('Maria Rossi')
      expect(result.html).toContain(vars.testLink)
      expect(result.text).toContain('Maria Rossi')
      expect(result.text).toContain(vars.testLink)
    })

    it('still renders through the SAME branded shell (logo, CTA button, footer) as the default template', () => {
      expect(result.html).toContain('cid:skillvision-logo')
      expect(result.html).toContain('INIZIA IL TEST')
      expect(result.html).toContain('info@skill-vision.it')
    })
  })
})

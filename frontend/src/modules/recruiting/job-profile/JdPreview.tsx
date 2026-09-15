import type { ReactNode } from 'react'

import type { JdState } from '@/modules/recruiting/lib/jd-types'

function TagBlock({ items }: { items: { label: string }[] }) {
  if (!items.length) return <p className="text-[12px] italic text-muted-foreground">Nessuna voce selezionata</p>
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i, idx) => (
        <span key={idx} className="rounded-full border border-border bg-secondary px-3 py-1 text-[12px] text-foreground">
          {i.label}
        </span>
      ))}
    </div>
  )
}

function LevelBlock({ items, valueKey }: { items: { label: string; level?: string; valoreAtteso?: number | null }[]; valueKey: 'level' | 'valoreAtteso' }) {
  if (!items.length) return <p className="text-[12px] italic text-muted-foreground">Nessuna voce selezionata</p>
  return (
    <div className="flex flex-col">
      {items.map((i, idx) => (
        <div key={idx} className="flex items-center justify-between border-b border-border py-1 text-[12.5px] last:border-0">
          <span className="text-foreground">{i.label}</span>
          <span className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">{valueKey === 'level' ? i.level : (i.valoreAtteso ?? '—')}</span>
        </div>
      ))}
    </div>
  )
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

// Migrated from jd_renderPreview() (modules/recruiting.html ~4166-4221) — a
// pure reflection of the current React JdState, never a write path. Same
// section order and same "Nessuna voce selezionata"/"Non definito"/"Non
// definita" empty-state copy as legacy.
type CheckOrValueKey = 'responsabilita' | 'attivita' | 'softSkills' | 'titoliStudio' | 'certificazioni' | 'settori' | 'disponibilita' | 'personalita' | 'kpi' | 'valutazione'

export function JdPreview({ jd }: { jd: JdState }) {
  const checked = (key: CheckOrValueKey) => jd.sections[key].items.filter((i) => i.checked)
  const toolsActive = (key: 'competenzeTecniche' | 'lingue') => jd.sections[key].items.filter((i) => i.level && i.level !== 'Non richiesto')
  const extraActive = jd.extra.filter((r) => r.label.trim() !== '')
  const hardAll = jd.hardSkillGroups.flatMap((g) => g.items.filter((i) => i.checked).map((i) => ({ ...i, group: g.label })))

  return (
    <div>
      <div className="mb-5 border-b border-border pb-4">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Scheda professionale · Anteprima</div>
        <h2 className="mt-1 text-[19px] font-semibold">{jd.header.titolo || 'Ruolo da definire'}</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
          {jd.header.mansione && (
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Mansione</span>
              <span className="text-foreground">{jd.header.mansione}</span>
            </div>
          )}
          <div>
            <span className="block text-[10px] uppercase text-muted-foreground">Codice</span>
            <span className="text-foreground">{jd.header.codice || '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-muted-foreground">Area</span>
            <span className="text-foreground">{jd.header.area || '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-muted-foreground">Riporta a</span>
            <span className="text-foreground">{jd.header.riportaA || '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-muted-foreground">Sede</span>
            <span className="text-foreground">{jd.header.sede || '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-muted-foreground">Modalità</span>
            <span className="text-foreground">{jd.header.modalita || '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-muted-foreground">Contratto</span>
            <span className="text-foreground">{jd.header.contratto || '—'}</span>
          </div>
        </div>
      </div>

      <PreviewSection title="Scopo del ruolo">
        <p className="text-[13px] leading-relaxed text-muted-foreground">{jd.scopo || <span className="italic">Non definito</span>}</p>
      </PreviewSection>
      <PreviewSection title="Responsabilità">
        <TagBlock items={checked('responsabilita')} />
      </PreviewSection>
      <PreviewSection title="Attività principali">
        <TagBlock items={checked('attivita')} />
      </PreviewSection>
      <PreviewSection title="Hard skills">
        {hardAll.length ? (
          <div className="flex flex-col">
            {hardAll.map((i) => (
              <div key={i.id} className="flex items-center justify-between border-b border-border py-1 text-[12.5px] last:border-0">
                <span className="text-foreground">
                  {i.label} <span className="text-[10px] text-muted-foreground">— {i.group}</span>
                </span>
                <span className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">{i.level}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] italic text-muted-foreground">Nessuna voce selezionata</p>
        )}
      </PreviewSection>
      <PreviewSection title="Soft skills">
        <LevelBlock items={checked('softSkills')} valueKey="valoreAtteso" />
      </PreviewSection>
      <PreviewSection title="Competenze tecniche">
        <LevelBlock items={toolsActive('competenzeTecniche')} valueKey="level" />
      </PreviewSection>
      <PreviewSection title="Titoli di studio">
        <TagBlock items={checked('titoliStudio')} />
      </PreviewSection>
      <PreviewSection title="Certificazioni">
        <TagBlock items={checked('certificazioni')} />
      </PreviewSection>
      <PreviewSection title="Esperienza minima">
        {jd.sections.esperienza.selected ? (
          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[12px] text-foreground">{jd.sections.esperienza.selected}</span>
        ) : (
          <p className="text-[12px] italic text-muted-foreground">Non definita</p>
        )}
      </PreviewSection>
      <PreviewSection title="Settori di provenienza">
        <TagBlock items={checked('settori')} />
      </PreviewSection>
      <PreviewSection title="Lingue">
        <LevelBlock items={toolsActive('lingue')} valueKey="level" />
      </PreviewSection>
      <PreviewSection title="Disponibilità">
        <TagBlock items={checked('disponibilita')} />
      </PreviewSection>
      <PreviewSection title="Personalità ricercata">
        <TagBlock items={checked('personalita')} />
      </PreviewSection>
      <PreviewSection title="KPI">
        <TagBlock items={checked('kpi')} />
      </PreviewSection>
      <PreviewSection title="Cosa valuterà SKILL-VISION">
        <TagBlock items={checked('valutazione')} />
      </PreviewSection>
      <PreviewSection title="Richieste specifiche aggiuntive">
        {extraActive.length ? (
          <div className="flex flex-col">
            {extraActive.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-border py-1 text-[12.5px] last:border-0">
                <span className="text-foreground">
                  {r.label}
                  {r.note && <span className="text-[11px] text-muted-foreground"> — {r.note}</span>}
                </span>
                <span className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">{r.level}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] italic text-muted-foreground">Nessuna richiesta aggiunta</p>
        )}
      </PreviewSection>
    </div>
  )
}

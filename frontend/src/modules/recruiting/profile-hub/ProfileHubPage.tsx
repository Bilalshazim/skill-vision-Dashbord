import { ArrowRight, FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/patterns/EmptyState'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RecruitingHeader } from '@/modules/recruiting/components/RecruitingHeader'
import { openingStatus, useActivePosition } from '@/modules/recruiting/lib/active-position'
import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { loadJdTemplate } from '@/modules/recruiting/lib/jd'
import { ensurePipeline } from '@/modules/recruiting/lib/pipeline'
import { countStages, positionStages, type StageCounts, STAGES } from '@/modules/recruiting/lib/position-funnel'
import { readCandidates } from '@/modules/recruiting/lib/storage'
import type { JobOpening } from '@/modules/recruiting/lib/types'

// "Profilo della ricerca": la scheda della posizione attiva (CLAUDE.md, Fase
// 6, deciso il 2026-10-23). La Panoramica guarda tutte le posizioni della
// società, questa pagina una sola. Prima ripeteva il menu: tre folder card
// con il solo titolo e i link del livello sotto. Dall'alto: intestazione
// (posizione, società, stato, "Cambia posizione"), Cosa cerchiamo (dal
// Profilo Candidato, in sola lettura), A che punto siamo (l'imbuto di questa
// posizione, scritto), Il prossimo passo (una sola azione), e in fondo i dati
// della ricerca modificabili (nomi e CIP), che stavano sopra la pagina.
export default function ProfileHubPage() {
  const { company, opening } = useActivePosition()

  if (!company || !opening) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader level="page" className="mb-0" title="Profilo della ricerca" />
        <Card>
          <EmptyState title="Nessuna posizione aperta." description="Il profilo della ricerca è la scheda di una posizione. Le posizioni si aprono da CV & Esportazione." action={<SeeMore to="/recruiting/cv">Apri CV & Esportazione</SeeMore>} />
        </Card>
      </div>
    )
  }

  const byId = new Map(readCandidates().map((c) => [c.id, c]))
  const counts = countStages(positionStages(opening, byId))
  const status = openingStatus(opening)
  const step = nextStep(opening, counts)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        level="page"
        className="mb-0"
        eyebrow="Profilo della ricerca"
        title={opening.title}
        description={`${company.name}${status ? ` · ${status}` : ''}`}
        actions={
          company.jobOpenings.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const el = document.getElementById('cambia-posizione')
                el?.scrollIntoView({ block: 'center' })
                el?.focus()
              }}
            >
              Cambia posizione
            </Button>
          ) : null
        }
      />

      <section>
        <PageHeader title="Il prossimo passo" description="L'azione da fare adesso su questa posizione." />
        <Card className="max-w-3xl gap-3">
          <p className="text-app-body text-foreground">{step.text}</p>
          {step.to ? (
            <Button asChild size="sm" className="self-start">
              <Link to={step.to}>
                {step.action} <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex flex-col">
          <PageHeader title="Cosa cerchiamo" description="I requisiti chiave, dal Profilo Candidato." actions={<SeeMore to="/recruiting/job-profile">Modifica il profilo</SeeMore>} />
          <WhatWeLookFor openingTitle={opening.title} />
        </section>
        <section className="flex flex-col">
          <PageHeader title="A che punto siamo" description="Quante persone ci sono in ogni fase, con la pagina della fase." actions={<SeeMore to="/recruiting/imbuto-scelta">Apri l&apos;imbuto</SeeMore>} />
          <Card padding="none" className="flex-1">
            <ul className="flex flex-col">
              {STAGES.map((s) => (
                <li key={s.key} className="flex items-center gap-3 border-b border-border px-4 py-2 last:border-b-0">
                  <span className="min-w-0 flex-1 text-app-small text-foreground">{s.label}</span>
                  <span className="font-mono text-app-small tabular-nums text-foreground">{counts[s.key]}</span>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={s.to} aria-label={`Apri ${s.label}`}>
                      Apri <ArrowRight />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <section>
        <PageHeader title="Dati della ricerca" description="Nome della società, nome della campagna e CIP." />
        <RecruitingHeader />
      </section>
    </div>
  )
}

// Cosa cerchiamo: dal Profilo Candidato salvato. Il profilo è uno solo per
// tutta Recruiting (`DEFAULT_ROLE`: non c'è ancora un profilo per posizione,
// DECISIONI): quando il suo nome non è quello della posizione lo si dice.
function WhatWeLookFor({ openingTitle }: { openingTitle: string }) {
  const jd = loadJdTemplate(DEFAULT_ROLE)
  if (!jd) {
    return (
      <Card className="flex-1">
        <EmptyState title="Il profilo candidato non è ancora compilato." description="Scopo del ruolo, competenze, sede e contratto si definiscono in Profilo Candidato." action={<SeeMore to="/recruiting/job-profile">Compila il profilo</SeeMore>} />
      </Card>
    )
  }
  const soft = jd.sections.softSkills.items.filter((i) => i.checked).map((i) => i.label)
  const hard = jd.hardSkillGroups.flatMap((g) => g.items.filter((i) => i.checked).map((i) => i.label))
  const skills = [...soft, ...hard].slice(0, 10)
  const more = soft.length + hard.length - skills.length
  const rows: { label: string; value: ReactNode }[] = [
    { label: 'Scopo del ruolo', value: jd.scopo || '—' },
    {
      label: 'Competenze richieste',
      value: skills.length ? (
        <span className="flex flex-wrap gap-1">
          {skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
          {more > 0 ? <span className="text-app-caption text-muted-foreground">e altre {more}</span> : null}
        </span>
      ) : (
        '—'
      ),
    },
    { label: 'Sede', value: jd.header.sede || '—' },
    { label: 'Contratto', value: [jd.header.contratto, jd.header.modalita].filter(Boolean).join(' · ') || '—' },
  ]
  const profileName = jd.header.titolo || DEFAULT_ROLE
  return (
    <Card className="flex-1 gap-3">
      {profileName !== openingTitle ? (
        <p className="flex items-start gap-2 text-app-small text-muted-foreground">
          <FileText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Profilo salvato per «{profileName}»: in Recruiting c&apos;è un profilo candidato solo, non uno per posizione.
        </p>
      ) : null}
      <dl className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1">
            <dt className="label-mono text-muted-foreground">{r.label}</dt>
            <dd className="text-app-small text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

// Il prossimo passo su questa posizione: la prima cosa che ferma la
// selezione, nell'ordine delle fasi. Una sola azione, con il bottone che porta
// dove si fa.
function nextStep(opening: JobOpening, c: StageCounts): { text: string; action?: string; to?: string } {
  const p = ensurePipeline(opening)
  const toSend = p.prescreened.filter((r) => r.status === 'da_inviare' || r.status === 'link_pronto').length
  if (p.winner) return { text: `Posizione chiusa: è stato scelto ${p.winner.name}.` }
  if (!c.cv) return { text: 'Nessun CV ancora caricato per questa posizione.', action: 'Carica i CV', to: '/recruiting/cv' }
  if (!c.preselezionati) return { text: `${c.cv} CV caricati, nessuno ancora preselezionato.`, action: 'Preseleziona i CV', to: '/recruiting/preselezionati' }
  if (toSend) return { text: `${toSend} ${toSend === 1 ? 'candidato preselezionato aspetta' : 'candidati preselezionati aspettano'} il link al test.`, action: toSend === 1 ? 'Invita 1 candidato al test' : `Invita ${toSend} candidati al test`, to: '/recruiting/preselezionati' }
  const toInterview = c.completati - c.colloquio
  if (toInterview > 0) return { text: `${toInterview} ${toInterview === 1 ? 'candidato ha' : 'candidati hanno'} completato il test e ${toInterview === 1 ? 'non ha' : 'non hanno'} ancora un colloquio.`, action: 'Fissa i colloqui', to: '/recruiting/colloqui' }
  if (c.colloquio) return { text: `${c.colloquio} ${c.colloquio === 1 ? 'candidato in colloquio' : 'candidati in colloquio'}: resta da scegliere.`, action: 'Scegli il candidato', to: '/recruiting/podio' }
  const waiting = c.invitati - c.completati
  return { text: `${waiting} ${waiting === 1 ? 'candidato sta facendo' : 'candidati stanno facendo'} il test: i risultati arrivano da Original Skills.`, action: 'Vedi i preselezionati', to: '/recruiting/preselezionati' }
}

function SeeMore({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link to={to}>
        {children}
        <ArrowRight />
      </Link>
    </Button>
  )
}

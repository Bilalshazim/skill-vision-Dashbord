import { Sigma } from 'lucide-react'
import { useMemo } from 'react'

import { Card } from '@/components/ui/card'
import { BF, DEFAULT_ROLE, ROLES } from '@/modules/recruiting/lib/constants'
import { ranking } from '@/modules/recruiting/lib/scoring'
import { readCandidates } from '@/modules/recruiting/lib/storage'

// Migrated from modules/recruiting.html #scr-formule ("Come decide il
// sistema?", ~528-576) plus its two live-computed examples (renderExamples(),
// ~3293-3311, invoked by go('formule')). Purely informational/read-only —
// no writes, no forms, no localStorage keys touched. The 5 formula cards'
// copy is reproduced verbatim; only exFC/exAB (worked examples using
// TODAY's top-ranked candidate) are computed, via the exact same
// ranking()/ROLES/BF this migration already uses everywhere else — no
// second scoring implementation.
export default function MetodoPage() {
  const candidates = useMemo(() => readCandidates(), [])
  const rk = useMemo(() => ranking(candidates), [candidates])
  const top = rk[0]

  const emptyExampleText = 'Nessun candidato in archivio ancora — carica i primi CV per vedere qui un esempio calcolato sui dati reali.'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
          <Sigma className="size-[22px] text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Come decide il sistema?</h2>
          <p className="text-[13px] text-muted-foreground">Le formule del ranking, spiegate a chi firma l'assunzione. Nessuna scatola nera.</p>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-[14.5px] font-semibold">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary font-mono text-[11px] text-muted-foreground">1</span>
          Fit Competenze — FC (peso 55%)
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Misura quanto il candidato copre le skill che <b className="font-semibold text-foreground">tu hai flaggato</b> per il ruolo. Ogni skill ha un
          peso (Essenziale=3, Importante=2, Utile=1) e un target minimo sulla scala APEX /31.
        </p>
        <div className="my-3 overflow-x-auto rounded-md border border-border bg-secondary px-4 py-3 font-mono text-[15px] font-semibold text-foreground">
          FC = [ Σᵢ wᵢ · min( Sᵢ / Tᵢ , 1 ) / Σᵢ wᵢ ] × 100
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          <b className="font-semibold text-foreground">S</b>ᵢ = punteggio APEX del candidato sulla skill i · <b className="font-semibold text-foreground">T</b>
          ᵢ = target della skill (24 / 21 / 18) · <b className="font-semibold text-foreground">w</b>ᵢ = peso del flag. Il «min(...,1)» evita che
          un'eccellenza su una skill compensi una carenza su un'altra: superare il target non regala punti extra.
        </p>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
          {top ? (
            <>
              <b className="font-semibold text-foreground">Esempio con i dati reali di oggi</b> — {top.c.name}, ruolo {DEFAULT_ROLE}: FC ={' '}
              <b className="font-semibold text-foreground">{top.r.fc}</b>. Significa che copre il {top.r.fc}% del profilo che hai flaggato, con le
              essenziali che pesano il triplo delle utili.
            </>
          ) : (
            emptyExampleText
          )}
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-[14.5px] font-semibold">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary font-mono text-[11px] text-muted-foreground">2</span>
          Affinità Big Five — AB (peso 30%)
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Ogni ruolo ha un profilo di personalità ideale (percentili sui 5 fattori, con i sottofattori a supporto). L'affinità è 100 meno la distanza
          media dal profilo ideale.
        </p>
        <div className="my-3 overflow-x-auto rounded-md border border-border bg-secondary px-4 py-3 font-mono text-[15px] font-semibold text-foreground">
          AB = 100 − ( Σₖ |Pₖ − Iₖ| / 5 )
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          <b className="font-semibold text-foreground">P</b>ₖ = percentile del candidato sul fattore k (Estroversione, Coscienziosità, Apertura,
          Amicalità, Stabilità emotiva) · <b className="font-semibold text-foreground">I</b>ₖ = percentile ideale del ruolo. I sottofattori (3 per
          fattore nella demo) spiegano il "perché" del punteggio e compaiono nel dettaglio candidato.
        </p>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
          {top ? (
            <>
              <b className="font-semibold text-foreground">Esempio</b> — {top.c.name}: distanze per fattore{' '}
              {BF.map((k) => `|${top.c.bf[k]}−${ROLES[DEFAULT_ROLE].bf[k]}|=${Math.abs(top.c.bf[k] - ROLES[DEFAULT_ROLE].bf[k])}`).join(' · ')} → media{' '}
              {(BF.reduce((a, k) => a + Math.abs(top.c.bf[k] - ROLES[DEFAULT_ROLE].bf[k]), 0) / 5).toFixed(1)} → AB = <b className="font-semibold text-foreground">{top.r.ab}</b>.
            </>
          ) : (
            emptyExampleText
          )}
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-[14.5px] font-semibold">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary font-mono text-[11px] text-muted-foreground">3</span>
          Indice CV — ICV (peso 15%)
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Prodotto dal parsing ML del curriculum: anni di esperienza pertinente, coerenza del percorso, settore, segnali di competenza nel testo. Serve
          da contesto, non da giudice: per questo pesa solo il 15%.
        </p>
        <div className="my-3 overflow-x-auto rounded-md border border-border bg-secondary px-4 py-3 font-mono text-[15px] font-semibold text-foreground">
          ICV = 0.5·Esperienza + 0.3·Coerenza + 0.2·Settore &nbsp;(scala 0–100)
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-[14.5px] font-semibold">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary font-mono text-[11px] text-muted-foreground">4</span>
          APEX Hiring Index — la classifica
        </h3>
        <div className="my-3 overflow-x-auto rounded-md border border-border bg-secondary px-4 py-3 font-mono text-[15px] font-semibold text-foreground">
          AHI = 0.55 · FC + 0.30 · AB + 0.15 · ICV
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          <b className="font-semibold text-foreground">Regola di sbarramento (red flag):</b> se anche una sola skill{' '}
          <b className="font-semibold text-foreground">Essenziale</b> è sotto il 60% del target, l'AHI viene bloccato a 59 e il candidato è marcato in
          rosso. Un venditore che non comunica non si "compensa" con altro: la formula lo dice prima che lo scopriate a contratto firmato.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-semibold">Fascia AHI</th>
                <th className="py-2 font-semibold">Lettura per chi decide</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-mono font-semibold tabular-nums">85 – 100</td>
                <td className="py-2 text-muted-foreground">Assumibile subito: copre il ruolo così com'è</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-mono font-semibold tabular-nums">70 – 84</td>
                <td className="py-2 text-muted-foreground">Assumibile con piano di sviluppo mirato sui gap</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-mono font-semibold tabular-nums">60 – 69</td>
                <td className="py-2 text-muted-foreground">Solo se il mercato non offre di meglio: gap strutturali</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono font-semibold tabular-nums">&lt; 60 / red flag</td>
                <td className="py-2 text-muted-foreground">Sconsigliato per questo ruolo (può valere per altri)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-[14.5px] font-semibold">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary font-mono text-[11px] text-muted-foreground">5</span>
          Compatibilità Interna — CI (il match con i tuoi)
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Confronta il candidato con il <b className="font-semibold text-foreground">benchmark interno</b>: il dipendente già valutato APEX che
          performa meglio nel ruolo. Si calcola solo sulle skill flaggate, pesate.
        </p>
        <div className="my-3 overflow-x-auto rounded-md border border-border bg-secondary px-4 py-3 font-mono text-[14px] font-semibold text-foreground">
          CI = 100 − [ Σᵢ wᵢ · |Sᵢᶜᵃⁿᵈ − Sᵢᵇᵉⁿᶜʰ| / (Σᵢ wᵢ · 31) ] × 100
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          CI ≥ 85: il candidato "gioca allo stesso livello" dei vostri migliori. CI 70–84: compatibile, con stile diverso. CI &lt; 70: profilo distante
          da chi oggi funziona nel ruolo — non per forza un male, ma una scelta consapevole.
        </p>
      </Card>
    </div>
  )
}

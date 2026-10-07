import { useEffect, useMemo, useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { SelectField } from '@/components/patterns/SelectField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { buildEval, downloadBlank, downloadFlat, downloadSchede, downloadSchedeHTML, evalFile, mailText, saveFile, valutatori } from '@/modules/assessment/gestione5p/files'
import { type State5p, edit, people, rowCheck } from '@/modules/assessment/gestione5p/model'

// 3 · Invio schede. Ogni valutatore riceve un file che si apre con il browser
// (doppio clic, nessuna installazione): istruzioni, scala, elenco delle persone
// e, per ogni domanda, area, domanda e guida al punteggio con la barra 1–10. A
// fine compilazione scarica il file delle risposte e lo rimanda a HR.
export function InvioTab({ state, update, toast, onGo, onAnswers }: { state: State5p; update: (fn: (s: State5p) => State5p) => void; toast: (m: string) => void; onGo: (t: 'ana' | 'ass') => void; onAnswers: (f: File) => void }) {
  const vs = valutatori(state)
  const [sel, setSel] = useState('')
  const who = vs.includes(sel) ? sel : vs[0] || ''
  const nErr = people(state).filter((p) => state.assign[p.id] && rowCheck(state, p, state.assign[p.id]).e.length).length
  // L'anteprima segue il tema in uso; il file scaricato segue quello del computer di chi lo apre.
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const html = useMemo(() => (who ? buildEval(state, who, dark ? 'dark' : 'light') : ''), [state, who, dark])

  // "Invia al sistema (anteprima)" dentro la scheda carica le risposte nel passo 4.
  useEffect(() => {
    const h = (e: MessageEvent) => {
      const d = e.data as { sv5p?: { valutatore?: string } } | null
      if (d && d.sv5p) onAnswers(new File([JSON.stringify(d.sv5p)], `anteprima_${(d.sv5p.valutatore || 'valutatore').replace(/\W+/g, '_')}.json`, { type: 'application/json' }))
    }
    window.addEventListener('message', h)
    return () => window.removeEventListener('message', h)
  }, [onAnswers])

  const need = (): boolean => {
    if (!state.plan.length) toast('Completa prima le assegnazioni (passo 2)')
    return state.plan.length > 0
  }

  return (
    <section className="flex flex-col gap-4">
      {!people(state).length ? (
        <InlineAlert tone="warning">
          Prima inserisci l&apos;anagrafica e controlla le assegnazioni.{' '}
          <Button size="sm" variant="outline" onClick={() => onGo('ana')}>
            Vai all&apos;anagrafica
          </Button>
        </InlineAlert>
      ) : nErr ? (
        <InlineAlert tone="warning">
          {nErr === 1 ? '1 riga delle assegnazioni ha un errore' : `${nErr} righe delle assegnazioni hanno errori`} (per esempio una persona scelta due volte). Correggi prima di inviare le schede.{' '}
          <Button size="sm" variant="outline" onClick={() => onGo('ass')}>
            Vai alle assegnazioni
          </Button>
        </InlineAlert>
      ) : null}
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div>
          <h3 className="text-app-section text-foreground">Schede da inviare ai valutatori</h3>
          <p className="max-w-3xl text-app-small text-muted-foreground">Ogni valutatore riceve <b className="font-semibold text-foreground">un file</b> che si apre con il browser (doppio clic, nessuna installazione). Dentro trova le istruzioni, la scala, l&apos;elenco delle persone da valutare e per ogni domanda area, domanda e guida al punteggio, con una barra da 1 a 10 da cliccare. A fine compilazione scarica il file delle risposte e lo rimanda a HR.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Email a cui rimandare le risposte" className="w-64">
            <Input type="email" placeholder="hr@azienda.it" defaultValue={state.set.emailHR} onBlur={(e) => update((s) => edit(s, (d) => { d.set.emailHR = e.target.value.trim() }))} />
          </Field>
          <Field label="Scadenza" className="w-40">
            <Input placeholder="es. 31/10/2026" defaultValue={state.set.scad} onBlur={(e) => update((s) => edit(s, (d) => { d.set.scad = e.target.value.trim() }))} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={async () => { if (need() && (await downloadSchedeHTML(state))) toast('Schede scaricate') }}>Scarica tutte le schede (ZIP)</Button>
          <span className="text-app-caption text-muted-foreground">{vs.length ? `${vs.length} schede, una per valutatore, più l'elenco invii e il testo email` : 'Prima completa le assegnazioni (passo 2)'}</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Anteprima della scheda di" className="w-72">
            <SelectField value={who} onValueChange={setSel}>
              {vs.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </SelectField>
          </Field>
          <Button variant="outline" size="sm" onClick={() => who && saveFile(evalFile(who), new Blob([buildEval(state, who)], { type: 'text/html' }))}>
            Scarica solo questa
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          {who ? (
            <iframe title="Anteprima scheda valutatore" sandbox="allow-scripts allow-downloads allow-modals" srcDoc={html} className="block h-[45rem] w-full border-0 bg-background" />
          ) : (
            <p className="p-5 text-app-small text-muted-foreground">Nessuna assegnazione: completa prima il passo 2.</p>
          )}
        </div>
        <p className="text-app-caption text-muted-foreground">Nell&apos;anteprima puoi compilare davvero: in fondo, &quot;Concludi e invia&quot; → &quot;Invia al sistema (anteprima)&quot; carica le risposte nel passo 4, così vedi tutto il giro.</p>
        <details>
          <summary className="cursor-pointer text-app-small font-semibold">Testo dell&apos;email da inviare ai valutatori</summary>
          <Textarea readOnly aria-label="Testo dell'email" className="mt-2 h-56" value={mailText(state)} />
          <Button variant="outline" size="sm" className="mt-2" onClick={() => navigator.clipboard?.writeText(mailText(state)).then(() => toast('Testo copiato'), () => toast('Seleziona il testo e premi Ctrl+C'))}>
            Copia testo
          </Button>
        </details>
        <details>
          <summary className="cursor-pointer text-app-caption">Alternative: schede Excel o Microsoft/Google Forms</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => need() && void downloadSchede(state)}>
              Schede Excel precompilate (ZIP)
            </Button>
            <Button variant="outline" size="sm" onClick={() => void downloadBlank()}>
              Scheda Excel vuota
            </Button>
            <Button variant="outline" size="sm" onClick={() => void downloadFlat()}>
              Modello per Forms
            </Button>
          </div>
        </details>
      </div>
    </section>
  )
}

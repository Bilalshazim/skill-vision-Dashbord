import { InfoBubble } from '@/components/patterns/InfoBubble'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { APEX5D_GUIDE } from '@/modules/assessment/lib/apex5d-guide'
import type { AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import { getUI, levelFor } from '@/modules/assessment/lib/legacy-utils'

const SCORES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

// Una voce della scheda APEX 5D (Foglio 6): la domanda di valutazione, la
// barra numerata da 1 a 10, il livello che il voto corrisponde, le note con
// l'esempio concreto, e le due nuvolette (domanda e indice comportamentale con
// gli ancoraggi per 1, 5 e 10). `value` 0 = voce ancora senza voto. Lo
// stesso componente serve la scheda del responsabile (HardEvalModal) e la
// pagina del valutatore esterno.
export function ApexItemRow({
  item,
  value,
  note,
  lang,
  onValue,
  onNote,
}: {
  item: { cod: string; area: string; q: string }
  value: number
  note: string
  lang: AssessmentLang
  onValue: (n: number) => void
  onNote: (t: string) => void
}) {
  const ui = getUI(lang)
  const guide = APEX5D_GUIDE[item.cod]
  const level = value > 0 ? levelFor(value, lang) : null
  return (
    <div className="flex flex-col gap-2 border-b border-border py-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-app-small font-semibold text-foreground">
            {item.cod} · {item.area}
          </div>
          <div className="text-app-caption text-muted-foreground">{guide?.q ?? item.q}</div>
        </div>
        {guide ? (
          <>
            <InfoBubble label={`${ui.f6ItemQuestion} ${item.cod}`} title={ui.f6ItemQuestion}>
              <p>{guide.q}</p>
            </InfoBubble>
            <InfoBubble label={`${ui.f6ItemGuide} ${item.cod}`} title={ui.f6ItemGuide}>
              <dl className="flex flex-col gap-2">
                {(
                  [
                    ['1', guide.low],
                    ['5', guide.mid],
                    ['10', guide.high],
                  ] as const
                ).map(([n, t]) => (
                  <div key={n} className="flex gap-2">
                    <dt className="w-6 shrink-0 font-semibold tabular-nums">{n}</dt>
                    <dd className="text-muted-foreground">{t}</dd>
                  </div>
                ))}
              </dl>
            </InfoBubble>
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup type="single" value={value > 0 ? String(value) : ''} onValueChange={(v) => v && onValue(Number(v))} aria-label={`${item.cod} · 1–10`} className="flex-wrap">
          {SCORES.map((s) => (
            <ToggleGroupItem key={s} value={s} className="size-9 border border-border px-0 tabular-nums data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              {s}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="text-app-caption text-muted-foreground">{level ? `${ui.f6Level}: ${level.label}` : '—'}</span>
      </div>
      <Input type="text" size="sm" aria-label={`${ui.f6ItemNotes} ${item.cod}`} placeholder={ui.f6ItemNotesPh} value={note} onChange={(e) => onNote(e.target.value)} />
    </div>
  )
}

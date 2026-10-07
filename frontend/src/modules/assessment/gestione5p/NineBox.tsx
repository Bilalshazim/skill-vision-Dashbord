import { cn } from '@/lib/utils'
import type { Result } from '@/modules/assessment/gestione5p/model'

const LAB: Record<string, string> = { '2,2': 'Talenti chiave', '1,2': 'Alto potenziale', '0,2': 'Da sbloccare', '2,1': 'Solidi', '1,1': 'Contributori core', '0,1': 'Da sviluppare', '2,0': 'Esperti', '1,0': 'Affidabili', '0,0': 'Criticità' }
const band = (v: number | null) => (v == null ? -1 : v < 5 ? 0 : v < 7 ? 1 : 2)

// La matrice Competenze × Potenziale a nove quadranti. Asse orizzontale: media
// di A–D; verticale: E (Potenziale). Soglie 5 e 7. Ogni quadrante porta il nome
// e il numero di persone: il fondo lo accompagna soltanto.
export function NineBox({ rows, onOpen }: { rows: Result[]; onOpen: (key: string) => void }) {
  const cells: Record<string, Result[]> = {}
  rows.forEach((r) => {
    const x = band(r.comp)
    const y = band(r.pot)
    if (x < 0 || y < 0) return
    ;(cells[`${x},${y}`] = cells[`${x},${y}`] || []).push(r)
  })
  return (
    <div className="grid grid-cols-[1.75rem_repeat(3,minmax(0,1fr))] gap-1.5 text-app-caption">
      {[2, 1, 0].map((y) => (
        <div key={y} className="contents">
          <div className="flex items-center justify-center text-muted-foreground [writing-mode:vertical-rl] rotate-180">{y === 1 ? 'Potenziale ↑' : ''}</div>
          {[0, 1, 2].map((x) => {
            const list = cells[`${x},${y}`] || []
            return (
              <div key={x} className={cn('flex min-h-24 min-w-0 flex-col gap-1 rounded-md border border-border p-2', x + y >= 3 ? 'surface-success' : x === 0 && y <= 1 ? 'surface-danger' : 'bg-card')}>
                <em className="font-semibold not-italic text-muted-foreground">
                  {LAB[`${x},${y}`]} · {list.length}
                </em>
                {list.map((r) => (
                  <button key={r.k} type="button" onClick={() => onOpen(r.k)} className="text-left break-words text-foreground hover:underline">
                    {r.nome}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      ))}
      <div />
      <div className="text-center text-muted-foreground">Competenze &lt; 5</div>
      <div className="text-center text-muted-foreground">5 – 7</div>
      <div className="text-center text-muted-foreground">≥ 7 →</div>
    </div>
  )
}

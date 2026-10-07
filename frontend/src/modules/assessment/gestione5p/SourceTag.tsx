import { SOURCE_LETTER } from '@/modules/assessment/gestione5p/level-style'
import { SRC, type SourceKey } from '@/modules/assessment/gestione5p/model'

// Etichetta di una fonte (Dirigente / Peer / Autovalutazione): lettera in
// riquadro, e la parola quando serve. Il colore non è l'unico veicolo.
export function SourceTag({ source, count, long = false }: { source: SourceKey; count?: number | string; long?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-app-caption text-foreground">
      <span className="inline-flex size-5 items-center justify-center rounded-sm border border-border-strong font-mono text-[0.6875rem] font-semibold">{SOURCE_LETTER[source]}</span>
      {long ? SRC[source].lab : null}
      {count != null ? <span className="font-mono tabular-nums">{count}</span> : null}
    </span>
  )
}

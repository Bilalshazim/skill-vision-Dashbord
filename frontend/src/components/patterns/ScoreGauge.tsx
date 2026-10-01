import { Gauge } from '@/components/charts'
import { cn } from '@/lib/utils'

// Un punteggio singolo su 100 come indicatore ad arco (Bklit Gauge — G5,
// DECISIONI). Tacche piene in `chart-mono` (il lime nella tonalità giusta
// per ogni modalità), le altre su `muted`; niente sfumature. Il numero e la
// sua etichetta li scrive chi lo usa (StatCard), accanto: il valore si
// legge senza il colore. Semicerchio, da sinistra a destra.
export function ScoreGauge({ value, label, className }: { value: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div data-slot="score-gauge" role="img" aria-label={`${label}: ${Math.round(v)} su 100`} className={cn('mx-auto h-36 w-full max-w-72 overflow-hidden', className)}>
      <Gauge value={v} startAngle={180} endAngle={360} activeFill="var(--chart-mono)" inactiveFill="var(--muted)" totalNotches={30} useGradient={false} />
    </div>
  )
}

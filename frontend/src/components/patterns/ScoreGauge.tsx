import { Gauge } from '@/components/charts'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

// Un punteggio singolo come indicatore ad arco (Bklit Gauge — G5, DECISIONI),
// usato come è fatto (CLAUDE.md, Fase 5, verificato il 2026-10-23): arco
// intero (135°–405°, il default), il numero al centro in `centerValue` con
// la sua etichetta (`defaultLabel`) e l'unità in `suffix`, traccia di default
// (`--border`), nessun contenitore che lo ritagli. Unico scostamento: le
// tacche piene in `chart-mono` invece di `chart-1`, perché una serie sola
// prende `chart-mono` (regole di colore della Fase 5) — in DECISIONI.
// Il punteggio è su 10 (`max`); il numero non si ripete fuori dal grafico.
// `tone="highlight"`: l'arco in lime, se è il numero principale della pagina. Con
// `unit` il valore si scrive così com'è anche oltre il massimo (109%): si ferma solo l'arco.
// Misura fissa (il rapporto 21/16 di Bklit): il default di Bklit chiede almeno
// 300px di larghezza, che in una colonna stretta scorre. `md` 240 × 183,
// `sm` 192 × 146 per una riga di quattro card. `lg` 360 × 274, da solo su una riga (Il valore,
// Decisioni del 2026-11-09); sotto i 640px scende a 300 × 229 per non far scorrere la pagina.
export function ScoreGauge({ value, max = 10, label, size = 'md', tone = 'mono', unit, decimals = 1, className }: { value: number; max?: number; label: string; size?: 'sm' | 'md' | 'lg'; tone?: 'mono' | 'highlight'; unit?: string; decimals?: number; className?: string }) {
  const wide = useWide()
  const [w, h] = size === 'sm' ? [192, 146] : size === 'lg' ? (wide ? [360, 274] : [300, 229]) : [240, 183]
  const v = Math.max(0, Math.min(max, value))
  const factor = 10 ** decimals
  const shown = Math.round((unit ? value : v) * factor) / factor
  return (
    <div data-slot="score-gauge" role="img" aria-label={`${label}: ${shown.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${unit ?? ` su ${max}`}`} className={cn('flex justify-start', className)}>
      <Gauge
        width={w}
        height={h}
        value={(v / max) * 100}
        activeFill={tone === 'highlight' ? 'var(--chart-highlight)' : 'var(--chart-mono)'}
        centerValue={shown}
        defaultLabel={label}
        suffix={unit ?? ` /${max}`}
        formatOptions={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }}
      />
    </div>
  )
}

function useWide() {
  const query = '(min-width: 640px)'
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return wide
}

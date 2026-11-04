import { SankeyChart, SankeyLink, SankeyLinkValues, SankeyNode, SankeyTooltip } from '@/components/charts'
import { ChartDataTable } from '@/components/patterns/ChartDataTable'
import { cn } from '@/lib/utils'

// Un grafico a flussi (Bklit Sankey — CLAUDE.md, Fase 6, "Dove intervenire ·
// grafico a flussi"): lo spessore di ogni flusso è il numero. Ogni nodo porta il
// suo nome e il suo valore scritti, quindi il colore accompagna la parola e non la
// sostituisce (regola 10). Il pattern riceve valori: nessun dato dentro. I valori
// sono anche in tabella, per i lettori di schermo.
export function FlowChart({
  title,
  nodes,
  links,
  note,
  formatValue,
  className,
}: {
  title: string
  nodes: { name: string; color: string }[]
  links: { source: number; target: number; value: number }[]
  note?: string
  /** Il valore sotto il nome di ogni nodo, con la sua unità. */
  formatValue: (value: number) => string
  className?: string
}) {
  // Un nodo senza flussi non ha posto nel grafico: lo dice la nota sotto il grafico.
  const used = nodes.map((_, i) => links.some((l) => l.value > 0 && (l.source === i || l.target === i)))
  const map = new Map<number, number>()
  nodes.forEach((_, i) => used[i] && map.set(i, map.size))
  const shown = nodes.filter((_, i) => used[i])
  const data = {
    // `category`: Bklit conta i flussi in uscita dei nodi di partenza, in entrata degli altri.
    nodes: shown.map((n, i) => ({ name: n.name, category: links.some((l) => l.value > 0 && map.get(l.source) === i) ? ('source' as const) : ('outcome' as const) })),
    links: links.filter((l) => l.value > 0).map((l) => ({ source: map.get(l.source)!, target: map.get(l.target)!, value: l.value })),
  }
  const colorOf = (i: number) => shown[i]?.color ?? 'var(--chart-mono)'
  const nodeIndex = (n: unknown) => (typeof n === 'object' && n ? ((n as { index?: number }).index ?? 0) : Number(n))
  return (
    <figure data-slot="flow-chart" className={cn('flex flex-col gap-3', className)}>
      <div aria-hidden="true" className="relative w-full">
        <SankeyChart data={data} aspectRatio="5 / 2" margin={{ top: 16, right: 180, bottom: 16, left: 140 }} nodeWidth={12} nodePadding={16}>
          <SankeyLink strokeOpacity={0.35} useGradient={false} getLinkColor={(l) => colorOf(nodeIndex(l.source))} />
          <SankeyLinkValues />
          <SankeyNode getNodeColor={(_, i) => colorOf(i)} formatValue={formatValue} />
          <SankeyTooltip />
        </SankeyChart>
      </div>
      {note ? <figcaption className="text-app-small text-muted-foreground">{note}</figcaption> : null}
      <ChartDataTable
        title={title}
        rowHeader="Da"
        columns={shown.filter((_, i) => data.links.some((l) => l.target === i)).map((n) => ({ label: n.name }))}
        rows={shown
          .map((n, i) => ({ n, i }))
          .filter(({ i }) => data.links.some((l) => l.source === i))
          .map(({ n, i }) => ({
            label: n.name,
            values: shown.map((_, t) => ({ t })).filter(({ t }) => data.links.some((l) => l.target === t)).map(({ t }) => data.links.find((l) => l.source === i && l.target === t)?.value ?? 0),
          }))}
      />
    </figure>
  )
}

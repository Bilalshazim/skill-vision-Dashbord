"use client";

import { useSankey } from "./sankey-context";

// Skill Vision: il numero scritto su ogni flusso, al centro (tavola «Dove
// intervenire»). Lo spessore da solo non si legge con precisione.
export function SankeyLinkValues() {
  const { links } = useSankey();
  return (
    <g aria-hidden="true" pointerEvents="none">
      {links.map((l, i) => {
        const source = l.source as { x1?: number };
        const target = l.target as { x0?: number };
        const x = ((source.x1 ?? 0) + (target.x0 ?? 0)) / 2;
        const y = ((l.y0 ?? 0) + (l.y1 ?? 0)) / 2;
        return (
          <text className="tabular-nums" dominantBaseline="middle" fill="var(--foreground)" fontSize={12} key={i} textAnchor="middle" x={x} y={y}>
            {l.value}
          </text>
        );
      })}
    </g>
  );
}

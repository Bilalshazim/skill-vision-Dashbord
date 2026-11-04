"use client";

import { motion } from "motion/react";
import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useChart, useChartStable } from "./chart-context";

export interface BarYAxisProps {
  /** Whether to show all labels or skip some for dense data. Default: true */
  showAllLabels?: boolean;
  /** Maximum number of labels to show. Default: 20 */
  maxLabels?: number;
  /** Skill Vision: nomi allineati a sinistra (tavola «Colori dei grafici»). */
  alignLeft?: boolean;
  /** Skill Vision: il nome in grassetto, quello del valore in evidenza. */
  emphasize?: string;
}

interface BarYAxisLabelProps {
  label: string;
  y: number;
  bandHeight: number;
  isHovered: boolean;
}

function BarYAxisLabel({
  label,
  y,
  bandHeight,
  isHovered,
  alignLeft,
  emphasized,
}: BarYAxisLabelProps & { alignLeft?: boolean; emphasized?: boolean }) {
  return (
    <div
      className={alignLeft ? "absolute right-0 left-0 flex items-center justify-start pr-2" : "absolute right-0 flex items-center justify-end pr-2"}
      style={{
        top: y,
        height: bandHeight,
      }}
    >
      <motion.span
        animate={{
          opacity: 1,
          color: isHovered
            ? "var(--foreground)"
            : "var(--chart-label, var(--color-zinc-500))",
        }}
        className={cn("truncate whitespace-nowrap text-app-caption", alignLeft ? "text-left" : "text-right", emphasized && "font-semibold text-foreground")}
        initial={{
          opacity: 1,
          color: "var(--chart-label, var(--color-zinc-500))",
        }}
        style={{ maxWidth: 192 }}
        transition={{ duration: 0.15 }}
      >
        {label}
      </motion.span>
    </div>
  );
}

export function BarYAxis(props: BarYAxisProps) {
  const { containerRef, barScale } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  if (!barScale) {
    return null;
  }

  return <BarYAxisInner {...props} container={container} />;
}

const BarYAxisInner = memo(function BarYAxisInner({
  showAllLabels = true,
  maxLabels = 20,
  alignLeft,
  emphasize,
  container,
}: BarYAxisProps & { container: HTMLDivElement }) {
  const { margin, barScale, bandWidth, barXAccessor, data, hoveredBarIndex } =
    useChart();

  // Generate labels for each bar
  const labelsToShow = useMemo(() => {
    if (!(barScale && bandWidth && barXAccessor)) {
      return [];
    }

    const allLabels = data.map((d, i) => {
      const label = barXAccessor(d);
      const bandY = barScale(label) ?? 0;
      // Center the label vertically within the band
      const y = bandY + margin.top;
      return { label, y, bandHeight: bandWidth, index: i };
    });

    // If showAllLabels is true or we have fewer than maxLabels, show all
    if (showAllLabels || allLabels.length <= maxLabels) {
      return allLabels;
    }

    // Otherwise, skip some labels to avoid crowding
    const step = Math.ceil(allLabels.length / maxLabels);
    return allLabels.filter((_, i) => i % step === 0);
  }, [
    barScale,
    bandWidth,
    barXAccessor,
    data,
    margin.top,
    showAllLabels,
    maxLabels,
  ]);

  return createPortal(
    <div
      className="pointer-events-none absolute top-0 bottom-0"
      style={{
        left: 0,
        width: margin.left,
      }}
    >
      {labelsToShow.map((item) => (
        <BarYAxisLabel
          alignLeft={alignLeft}
          bandHeight={item.bandHeight}
          emphasized={emphasize === item.label}
          isHovered={hoveredBarIndex === item.index}
          key={`${item.label}-${item.y}`}
          label={item.label}
          y={item.y}
        />
      ))}
    </div>,
    container
  );
});

BarYAxis.displayName = "BarYAxis";

export default BarYAxis;

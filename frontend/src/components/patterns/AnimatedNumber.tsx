import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

import { COUNTER_SPRING } from '@/lib/motion'

const format = (n: number, decimals: number, suffix: string, grouping: boolean) =>
  `${n.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouping })}${suffix}`

// Un numero che sale al suo valore con una molla (COUNTER_SPRING), alla
// prima apertura e a ogni cambio. Scritto all'italiana ("6,0"), con i
// decimali chiesti. I lettori di schermo leggono solo il valore finale, non
// i passaggi; con "riduci movimento" il numero compare fermo. Va dentro un
// contenitore con cifre tabulari (StatCard lo è), così la larghezza non
// balla mentre conta. Da un testo già scritto: `parseDisplayedNumber`
// (lib/format.ts).
export function AnimatedNumber({ value, decimals = 0, suffix = '', grouping = true }: { value: number; decimals?: number; suffix?: string; grouping?: boolean }) {
  const reduce = useReducedMotion()
  const target = useMotionValue(0)
  const spring = useSpring(target, COUNTER_SPRING)
  const text = useTransform(spring, (v) => format(v, decimals, suffix, grouping))
  useEffect(() => {
    target.set(value)
  }, [value, target])
  const final = format(value, decimals, suffix, grouping)
  if (reduce) return <>{final}</>
  return (
    <>
      <span className="sr-only">{final}</span>
      <motion.span aria-hidden="true">{text}</motion.span>
    </>
  )
}

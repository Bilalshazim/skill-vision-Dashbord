import { LayoutGroup, motion } from 'motion/react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { createContext, useContext, useId, useState } from 'react'
import type * as React from 'react'

import { TAP_SCALE, ULTRA_TAB_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

// Gruppo di interruttori: sceglie una vista o un filtro sullo stesso
// contenuto (type="single") o accende più voci (type="multiple"). La voce
// accesa usa il fondo `accent` (neutro: in shadcn --accent non è il lime).
// Tastiera: frecce dentro il gruppo, Spazio o Invio per accendere.
//
// Con type="single" il fondo della voce accesa è una pillola sola che scorre
// sulla voce nuova (ULTRA_TAB_SPRING); con "multiple" ogni voce accesa ha il
// suo fondo. Il gruppo tiene il valore anche quando è passato solo
// `defaultValue`, per sapere dove sta la pillola. Il lime è solo della voce
// accesa: al passaggio del mouse le altre prendono il fondo neutro, altrimenti
// sembrano accese due voci insieme (verifica del 2026-11-05).

const SingleValueContext = createContext<{ single: boolean; value: string | undefined }>({ single: false, value: undefined })

type RootProps = React.ComponentProps<typeof ToggleGroupPrimitive.Root>

function ToggleGroup({ className, ...props }: RootProps) {
  const single = props.type === 'single'
  const singleProps = props as Extract<RootProps, { type: 'single' }>
  const [inner, setInner] = useState(single ? singleProps.defaultValue : undefined)
  const group = useId()
  const current = single ? (singleProps.value ?? inner) : undefined
  const rootProps: RootProps = single
    ? {
        ...singleProps,
        value: current ?? '',
        onValueChange: (v: string) => {
          if (singleProps.value === undefined) setInner(v)
          singleProps.onValueChange?.(v)
        },
      }
    : props
  return (
    <SingleValueContext.Provider value={{ single, value: current }}>
      <LayoutGroup id={group}>
        <ToggleGroupPrimitive.Root
          data-slot="toggle-group"
          className={cn('inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1', className)}
          {...rootProps}
        />
      </LayoutGroup>
    </SingleValueContext.Provider>
  )
}

function ToggleGroupItem({ className, children, value, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const ctx = useContext(SingleValueContext)
  const pill = ctx.single && ctx.value === value
  return (
    <ToggleGroupPrimitive.Item value={value} asChild {...props}>
      <motion.button
        data-slot="toggle-group-item"
        whileTap={TAP_SCALE}
        className={cn(
          'relative isolate inline-flex touch-manipulation items-center justify-center gap-2 rounded-sm px-3 py-1 text-app-small font-medium whitespace-nowrap text-muted-foreground select-none transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0',
          !ctx.single && 'data-[state=on]:bg-accent',
          ctx.single && 'data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-transparent data-[state=on]:hover:text-primary-foreground',
          className,
        )}
      >
        {pill ? <motion.span aria-hidden="true" layoutId="toggle-group-active-pill" transition={ULTRA_TAB_SPRING} className="absolute inset-0 -z-10 rounded-sm bg-primary" /> : null}
        {children}
      </motion.button>
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }

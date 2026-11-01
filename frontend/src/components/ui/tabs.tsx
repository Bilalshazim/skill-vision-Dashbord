import { LayoutGroup, motion } from 'motion/react'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { createContext, useContext, useId, useState } from 'react'
import type * as React from 'react'

import { FAST_PAGE_VARIANTS, TAP_SCALE, ULTRA_TAB_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

// Schede: cambiano il contenuto sotto. Binario `muted`, scheda attiva sulla
// superficie della card con bordo marcato: la distingue la superficie, non
// il lime (shadcn non mette il primario sulle schede). Tastiera: frecce.
//
// La superficie della scheda attiva è una pillola sola che scorre sulla
// scheda nuova (ULTRA_TAB_SPRING). Per saperlo, Tabs tiene il valore anche
// quando chi lo usa passa solo `defaultValue`; ogni Tabs ha il suo gruppo,
// così due serie di schede nella stessa pagina non si scambiano la pillola.

const TabsValueContext = createContext<string | undefined>(undefined)

function Tabs({ className, value, defaultValue, onValueChange, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [inner, setInner] = useState(defaultValue)
  const current = value ?? inner
  const group = useId()
  return (
    <TabsValueContext.Provider value={current}>
      <LayoutGroup id={group}>
        <TabsPrimitive.Root
          data-slot="tabs"
          className={cn('flex flex-col gap-4', className)}
          value={current}
          onValueChange={(v) => {
            if (value === undefined) setInner(v)
            onValueChange?.(v)
          }}
          {...props}
        />
      </LayoutGroup>
    </TabsValueContext.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn('inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-md bg-muted p-1', className)} {...props} />
}

function TabsTrigger({ className, children, value, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const active = useContext(TabsValueContext) === value
  return (
    <TabsPrimitive.Trigger value={value} asChild {...props}>
      <motion.button
        data-slot="tabs-trigger"
        whileTap={TAP_SCALE}
        className={cn(
          'relative isolate inline-flex touch-manipulation items-center justify-center gap-2 rounded-sm border border-transparent px-3 py-1 text-app-small font-medium whitespace-nowrap text-muted-foreground select-none transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0',
          className,
        )}
      >
        {active ? <motion.span aria-hidden="true" layoutId="tabs-active-pill" transition={ULTRA_TAB_SPRING} className="absolute -inset-px -z-10 rounded-sm border border-border-strong bg-card" /> : null}
        {children}
      </motion.button>
    </TabsPrimitive.Trigger>
  )
}

// Il pannello della scheda entra con FAST_PAGE_VARIANTS: Radix smonta quello
// di prima, quindi si vede l'entrata, senza attesa.
function TabsContent({ className, children, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content asChild {...props}>
      <motion.div data-slot="tabs-content" variants={FAST_PAGE_VARIANTS} initial="initial" animate="animate" className={cn('min-w-0 outline-none', className)}>
        {children}
      </motion.div>
    </TabsPrimitive.Content>
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }

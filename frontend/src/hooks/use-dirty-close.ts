import type { Dialog as DialogPrimitive } from 'radix-ui'
import { useState } from 'react'
import type * as React from 'react'

// La conferma "Chiudere senza salvare?" condivisa da Dialog e Sheet (sono lo
// stesso primitivo Radix). Con `dirty` Esc, clic fuori e ✕ aprono la
// conferma invece di chiudere; senza, chiudono come sempre.
export function useDirtyClose({
  dirty,
  onEscapeKeyDown,
  onInteractOutside,
}: {
  dirty: boolean
  onEscapeKeyDown?: React.ComponentProps<typeof DialogPrimitive.Content>['onEscapeKeyDown']
  onInteractOutside?: React.ComponentProps<typeof DialogPrimitive.Content>['onInteractOutside']
}) {
  const [confirming, setConfirming] = useState(false)
  return {
    confirming,
    setConfirming,
    contentProps: {
      onEscapeKeyDown: (e: KeyboardEvent) => {
        onEscapeKeyDown?.(e)
        if (dirty && !e.defaultPrevented) {
          e.preventDefault()
          setConfirming(true)
        }
      },
      onInteractOutside: (e: Parameters<NonNullable<React.ComponentProps<typeof DialogPrimitive.Content>['onInteractOutside']>>[0]) => {
        onInteractOutside?.(e)
        if (dirty && !e.defaultPrevented) {
          e.preventDefault()
          setConfirming(true)
        }
      },
    },
  }
}


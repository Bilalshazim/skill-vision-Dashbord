import { type ReactNode, useCallback, useRef, useState } from 'react'

import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'

type ConfirmOptions = {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

// Al posto di window.confirm, con la stessa forma nel punto di chiamata:
//   const [confirm, confirmDialog] = useConfirm()
//   if (!(await confirm({ title: '…' }))) return
// `confirmDialog` va messo una volta nel JSX del componente.
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  function settle(ok: boolean) {
    resolver.current?.(ok)
    resolver.current = null
    setOptions(null)
  }

  const element = options ? (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) settle(false)
      }}
      onConfirm={() => settle(true)}
      {...options}
    />
  ) : null

  return [confirm, element]
}

import { CircleAlert, CircleCheck, Info, Loader2, TriangleAlert } from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { useTheme } from '@/hooks/use-theme'

// Le notifiche della libreria (Sonner). Livello --z-toast, superficie
// flottante (bordo marcato, nessuna ombra), in basso al centro. Ogni tipo
// ha la sua icona accanto al testo: il colore non porta il significato da
// solo (regola 10). La modalità segue il tema dell'app.
function Toaster(props: ToasterProps) {
  const { theme } = useTheme()
  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      icons={{
        success: <CircleCheck className="size-4 text-success" />,
        error: <CircleAlert className="size-4 text-destructive" />,
        warning: <TriangleAlert className="size-4 text-warning" />,
        info: <Info className="size-4 text-muted-foreground" />,
        loading: <Loader2 className="size-4 animate-spin text-muted-foreground" />,
      }}
      style={{ zIndex: 'var(--z-toast)' } as React.CSSProperties}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-sm border border-border-strong bg-popover px-4 py-3 text-app-body text-popover-foreground',
          title: 'font-medium',
          description: 'text-app-small text-muted-foreground',
          actionButton: 'ml-auto rounded-sm bg-primary px-3 py-1 text-app-small font-medium text-primary-foreground',
          cancelButton: 'rounded-sm border border-border px-3 py-1 text-app-small',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

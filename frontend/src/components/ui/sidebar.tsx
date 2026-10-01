import { Menu } from 'lucide-react'
import { Slot } from 'radix-ui'
import { type ReactNode, useMemo, useState } from 'react'
import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { SidebarContext, useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/lib/utils'

// La barra laterale della libreria, con i token `--sidebar-*` del tema
// (API sul modello di quella di shadcn: Provider, Header, Content, Group,
// Menu, MenuButton, MenuSub, Footer, Trigger). Da `lg` in su è una colonna
// fissa sotto la barra superiore; sotto `lg` lo stesso contenuto sta in un
// pannello laterale (Sheet), per tutti e due i moduli (CLAUDE.md cap. 7,
// "Navigazione su mobile"). Voce attiva: riempimento lime con testo quasi
// nero (`--sidebar-primary`), non testo sbiadito per le altre: una voce non
// attiva è un bersaglio cliccabile.

function SidebarProvider({ children }: { children: ReactNode }) {
  const [openMobile, setOpenMobile] = useState(false)
  const value = useMemo(() => ({ openMobile, setOpenMobile }), [openMobile])
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

function Sidebar({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const { openMobile, setOpenMobile } = useSidebar()
  return (
    <>
      <aside
        data-slot="sidebar"
        aria-label={label}
        className={cn(
          'sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex',
          className,
        )}
      >
        {children}
      </aside>
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="bg-sidebar p-0 text-sidebar-foreground lg:hidden">
          <SheetTitle className="sr-only">{label}</SheetTitle>
          <SheetDescription className="sr-only">{label}</SheetDescription>
          <div className="flex h-full min-h-0 flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function SidebarTrigger({ label, className }: { label: string; className?: string }) {
  const { setOpenMobile } = useSidebar()
  return (
    <Button variant="ghost" size="icon" className={cn('lg:hidden', className)} onClick={() => setOpenMobile(true)} aria-label={label}>
      <Menu />
    </Button>
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sidebar-header" className={cn('flex flex-col gap-2 border-b border-sidebar-border p-3', className)} {...props} />
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sidebar-content" className={cn('flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3', className)} {...props} />
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sidebar-footer" className={cn('flex flex-col gap-1 border-t border-sidebar-border p-3 text-app-caption text-muted-foreground', className)} {...props} />
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sidebar-group" className={cn('flex flex-col gap-1', className)} {...props} />
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sidebar-group-label" className={cn('label-mono px-3 pt-2 pb-1 text-muted-foreground select-none', className)} {...props} />
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul data-slot="sidebar-menu" className={cn('flex flex-col gap-1', className)} {...props} />
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="sidebar-menu-item" className={cn('relative', className)} {...props} />
}

const menuButtonClass =
  'flex w-full min-w-0 items-center gap-3 rounded-sm px-3 py-2 text-left text-app-small font-medium text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground [&_svg]:size-4 [&_svg]:shrink-0'

// Una voce. `asChild` per un NavLink; su mobile chiude il pannello al clic.
function SidebarMenuButton({
  asChild = false,
  isActive = false,
  className,
  onClick,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean; isActive?: boolean }) {
  const { setOpenMobile } = useSidebar()
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(menuButtonClass, className)}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        setOpenMobile(false)
      }}
      {...props}
    />
  )
}

// Un contatore accanto alla voce (es. piani di sviluppo da fare).
function SidebarMenuBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="sidebar-menu-badge" className={cn('ml-auto rounded-full bg-secondary px-2 text-app-caption tabular-nums text-secondary-foreground', className)} {...props} />
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul data-slot="sidebar-menu-sub" className={cn('ml-5 flex flex-col gap-1 border-l border-sidebar-border pl-2', className)} {...props} />
}

export {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSub,
}

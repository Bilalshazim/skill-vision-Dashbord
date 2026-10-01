import { Avatar as AvatarPrimitive } from 'radix-ui'
import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Avatar (shadcn). Senza foto mostra le iniziali su superficie neutra: il
// lime resta al segnale, non a ogni persona in un elenco. Taglie sm 24,
// md 32, lg 40.
const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'size-6 text-app-label tracking-normal',
      md: 'size-8 text-app-label',
      lg: 'size-10 text-app-small',
    },
  },
  defaultVariants: { size: 'md' },
})

function Avatar({ className, size, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root> & VariantProps<typeof avatarVariants>) {
  return <AvatarPrimitive.Root data-slot="avatar" className={cn(avatarVariants({ size }), className)} {...props} />
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={cn('aspect-square size-full', className)} {...props} />
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return <AvatarPrimitive.Fallback data-slot="avatar-fallback" className={cn('flex size-full items-center justify-center bg-secondary font-medium text-secondary-foreground', className)} {...props} />
}

// Le iniziali di una persona. Con `last` prende la prima lettera di nome e
// cognome (Assessment); senza, la prima e l'ultima parola di `first`.
function Initials({ first, last, size, className }: { first: string; last?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const parts = first.trim().split(/\s+/)
  const text = last !== undefined ? (first[0] ?? '') + (last[0] ?? '') : (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')
  return (
    <Avatar size={size} className={className} aria-hidden="true">
      <AvatarFallback>{text.toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback, Initials }

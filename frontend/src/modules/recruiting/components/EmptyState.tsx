import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-2 py-4 text-center text-muted-foreground">
      <Icon className="size-6 opacity-60" aria-hidden="true" />
      <p className="text-[12.5px]">{text}</p>
    </div>
  )
}

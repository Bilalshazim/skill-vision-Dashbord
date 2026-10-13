import type { IconComponent } from '@/components/patterns/CompositeIcon'
import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

// La card a cartella del concept della Home di Assessment (E.pdf): una
// linguetta rialzata con i controlli (oggi / Skill Vision), l'icona nella
// tacca accanto, e sotto il corpo con il titolo grande al centro, come nei
// disegni del cliente (Foglio 3). Sui token: superficie `card`, bordo 1px, nessuna ombra;
// le quattro card si distinguono per icona e titolo, non per il fondo
// (DECISIONI, "i toni delle card"). Titolo Geist 18/600 in minuscolo
// (regola 8). `aside`: i controlli in alto a destra della linguetta.
// `kicker`: la riga sotto la linguetta. `iconSide`: da che parte sta l'icona
// (Recruiting a sinistra, Assessment a destra: così i due moduli si
// riconoscono). Bordo 2px `primary` e rilievo: eccezione alla regola 3 voluta
// da Roberto Feliciani (Fase 3), registrata in DECISIONI.md; il colore
// dell'ombra è un token. Al passaggio del mouse l'ombra diventa del lime
// del marchio (`primary`), e così il bottone "Skill Vision" (Foglio 6).
// `tint`: una tinta leggera del fondo, presa dalla famiglia dei grafici, per
// distinguere le quattro card della Home di Assessment e legarle al loro
// pannello (richiesta del cliente, 2026-10-13; DECISIONI). Senza `tint` il
// fondo resta `card`. Il fondo è opaco (la tinta si mescola con `card`),
// perché la linguetta copre il bordo del corpo.
export type FolderTint = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'chart-6'

/** Il fondo tinto di una card a cartella; serve anche al pannello che la card apre. */
export function folderTintStyle(tint?: FolderTint): CSSProperties | undefined {
  return tint ? { backgroundColor: `color-mix(in oklab, var(--${tint}) 10%, var(--card))` } : undefined
}

export function FolderCard({
  icon: Icon,
  title,
  kicker,
  aside,
  iconSide = 'start',
  tint,
  className,
  children,
}: {
  icon: IconComponent
  title: ReactNode
  kicker?: ReactNode
  aside?: ReactNode
  iconSide?: 'start' | 'end'
  tint?: FolderTint
  className?: string
  children: ReactNode
}) {
  return (
    <section data-slot="folder-card" className={cn('group/folder flex min-w-0 flex-col', className)}>
      <div className={cn('flex items-stretch', iconSide === 'end' && 'flex-row-reverse')}>
        <span className="flex w-1/4 shrink-0 items-center justify-center text-foreground" aria-hidden="true">
          <Icon className="size-12" strokeWidth={1.5} />
        </span>
        <div className="relative z-(--z-sticky) -mb-0.5 flex min-h-16 min-w-0 flex-1 items-center justify-end rounded-t-lg border-2 border-b-0 border-primary bg-card px-6 pt-2" style={folderTintStyle(tint)}>
          {aside}
        </div>
      </div>
      <div
        className={cn(
          'flex min-h-52 flex-1 flex-col items-center justify-center text-center rounded-lg border-2 border-primary bg-card px-6 pt-3 pb-6 shadow-[0_8px_16px_0_var(--border-strong)] transition-shadow group-hover/folder:shadow-[0_8px_16px_0_var(--primary)]',
          iconSide === 'end' ? 'rounded-tl-none' : 'rounded-tr-none',
        )}
        style={folderTintStyle(tint)}
      >
        <h3 className="mt-3 text-app-title break-words text-card-foreground">{title}</h3>
        {kicker ? <div className="mt-1 text-app-subtitle font-normal text-muted-foreground">{kicker}</div> : null}
        {children}
      </div>
    </section>
  )
}

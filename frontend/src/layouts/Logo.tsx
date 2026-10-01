import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

// Il marchio d'identità (CLAUDE.md cap. 7, "Il marchio"): `logo-su-chiaro.svg`
// e `logo-su-scuro.svg` (914×170, copie di assets/ in public/brand/). Il
// lettering è un tracciato, non si ricompone con un carattere. Sotto gli
// 80px di larghezza (`compact`) resta solo il simbolo. Taglie: md 24px di
// altezza (barra superiore), lg 40px (schermate a tutta pagina).
export function Logo({ compact = false, size = 'md', className }: { compact?: boolean; size?: 'md' | 'lg'; className?: string }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  if (compact) {
    return <img src={dark ? '/brand/icona_white.svg' : '/brand/icona_black.svg'} alt="Skill Vision" width={30} height={30} className={cn('size-8', className)} />
  }

  return (
    <img
      src={dark ? '/brand/logo-su-scuro.svg' : '/brand/logo-su-chiaro.svg'}
      alt="Skill Vision"
      width={914}
      height={170}
      className={cn('w-auto', size === 'md' ? 'h-6' : 'h-10', className)}
    />
  )
}

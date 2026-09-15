import { useTheme } from '@/hooks/use-theme'

// Official Skill-Vision marks (verbatim copies of assets/Logo/*.svg — see
// frontend/public/brand/, copied because this app's Vite root can't reach
// outside frontend/ at runtime). Same light/dark + full/icon variant
// selection logic as modules/recruiting.html's LOGO_LIGHT/LOGO_DARK/
// LOGO_ICON_LIGHT/LOGO_ICON_DARK swap.
export function Logo({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  if (compact) {
    return (
      <img
        src={dark ? '/brand/icona_white.svg' : '/brand/icona_black.svg'}
        alt="Skill-Vision"
        width={30}
        height={30}
        className="size-8"
      />
    )
  }

  return (
    <img
      src={dark ? '/brand/logo_white.svg' : '/brand/logo_black.svg'}
      alt="Skill-Vision"
      width={120}
      height={23}
      className="h-6 w-auto"
    />
  )
}

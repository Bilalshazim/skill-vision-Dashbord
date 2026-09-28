import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge conosce solo la scala tipografica di Tailwind: senza
// questa estensione legge `text-app-body` come un colore e, dentro cn(),
// scarta il colore vero accanto (text-primary-foreground sul bottone).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['app-title', 'app-section', 'app-subtitle', 'app-body', 'app-small', 'app-caption', 'app-label', 'metric', 'metric-lg'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

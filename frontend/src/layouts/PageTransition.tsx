import { Fragment } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

import { ViewTransition } from '@/layouts/ViewTransition'

// Il posto della pagina dentro un modulo, al posto di <Outlet />: cambiando
// pagina la vecchia esce (120ms) e la nuova entra (160ms). La chiave è
// l'indirizzo, quindi un filtro nella query non anima niente. `refreshKey`
// ridisegna la pagina senza animarla (Recruiting, quando cambiano posizione
// o dati). `useOutlet` tiene la pagina che esce sulla sua rotta mentre la
// nuova è già nell'indirizzo.
export function PageTransition({ refreshKey }: { refreshKey?: string }) {
  const location = useLocation()
  const outlet = useOutlet()
  return (
    <ViewTransition viewKey={location.pathname} mode="page" className="w-full">
      <Fragment key={refreshKey}>{outlet}</Fragment>
    </ViewTransition>
  )
}

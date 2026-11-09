import { Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { TextLink } from '@/components/patterns/EuroFigure'
import { Button } from '@/components/ui/button'
import { getBackendUser } from '@/lib/api/client'
import { publicApplicationsApi, type PublicApplicationSettings } from '@/lib/api/endpoints'
import { getCachedBackendLink } from '@/modules/recruiting/lib/backend-link'

// «Crea link» nell'annuncio del Profilo candidato (Decisioni del 2026-11-09, Parte C). Il link
// dell'annuncio porta anche il modulo di candidatura: si crea confermando la scheda, ed è
// acceso solo se la società ha compilato i contatti privacy in Amministrazione (e, per ora,
// solo per la società demo). Quando è spento, la riga sotto dice perché.
export function ApplicationLinkControl({ openingId, approved, canCreate, pending, onCreate }: { openingId?: string; approved: boolean; canCreate: boolean; pending: boolean; onCreate: () => void }) {
  const [settings, setSettings] = useState<PublicApplicationSettings | null>(null)
  const companyId = (openingId && getCachedBackendLink(openingId)?.companyId) || getBackendUser()?.companyId || ''

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    publicApplicationsApi
      .settings(companyId)
      .then((s) => !cancelled && setSettings(s))
      .catch(() => !cancelled && setSettings(null))
    return () => {
      cancelled = true
    }
  }, [companyId])

  const ready = !!settings?.ready
  const reason = !settings
    ? 'La posizione non è ancora collegata al server: salva la scheda.'
    : !settings.demo
      ? 'Per ora le candidature online sono attive solo per la società demo.'
      : !ready
        ? 'Per creare il link servono i contatti privacy (titolare ed email) in Amministrazione.'
        : !canCreate
          ? 'Salva la scheda: poi il link si può creare.'
          : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={onCreate} disabled={approved || !ready || !canCreate || pending}>
          <Link2 aria-hidden="true" />
          Crea link
        </Button>
        {approved && ready ? <span className="text-app-small text-muted-foreground">Il link qui sotto apre l’annuncio con il modulo per candidarsi: il CV arriva sulla posizione.</span> : null}
      </div>
      {!approved && reason ? <p className="text-app-caption text-muted-foreground">{reason}</p> : null}
      {settings && settings.demo && !ready ? <TextLink link={{ label: 'Vai ai contatti privacy', to: '/recruiting/admin/email' }} /> : null}
    </div>
  )
}

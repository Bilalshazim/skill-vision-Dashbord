import { Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { useConfirm } from '@/hooks/use-confirm'
import { getBackendUser } from '@/lib/api/client'
import { RECRUITING_AREA_LABEL, browserRecruitingData, importBrowserRecruiting } from '@/modules/recruiting/lib/browser-import'

const WRITE_ROLES = new Set(['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER'])

// "Importa dati del browser" nella barra laterale di Recruiting: compare solo
// se questo browser ha ancora dati delle versioni precedenti e l'utente può
// scrivere. Porta sul server le aree che lì non ci sono, poi svuota il
// browser (lib/browser-import.ts). Dopo l'import la pagina si ricarica dai
// dati del server.
export function BrowserImportEntry() {
  const [confirm, confirmDialog] = useConfirm()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const canWrite = WRITE_ROLES.has(getBackendUser()?.role ?? '')
  const found = useMemo(() => (canWrite && !done ? browserRecruitingData() : null), [canWrite, done])
  if (!found) return null

  async function run() {
    if (!found) return
    const list = (keys: typeof found.toImport) => keys.map((k) => RECRUITING_AREA_LABEL[k]).join(', ')
    const description = [
      found.toImport.length ? `Vanno sul server: ${list(found.toImport)}.` : 'Sul server ci sono già tutti questi dati.',
      found.skipped.length ? `Già presenti sul server, non si sovrascrivono (sono il lavoro dei colleghi): ${list(found.skipped)}.` : '',
      'Dopo l’import i dati vengono cancellati da questo browser.',
    ]
      .filter(Boolean)
      .join(' ')
    if (!(await confirm({ title: 'Importare i dati del browser?', description, confirmLabel: 'Importa', cancelLabel: 'Annulla' }))) return
    setBusy(true)
    try {
      const n = await importBrowserRecruiting()
      setDone(true)
      toast.success(n ? `Dati importati sul server: ${n} ${n === 1 ? 'area' : 'aree'}.` : 'Il browser è stato svuotato: i dati erano già sul server.')
      window.location.reload()
    } catch (err) {
      toast.error(`Import non riuscito: ${err instanceof Error ? err.message : String(err)}. I dati restano nel browser: riprova.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton type="button" onClick={() => void run()} disabled={busy}>
            <Upload aria-hidden="true" />
            <span className="min-w-0 flex-1">Importa dati del browser</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {confirmDialog}
    </SidebarGroup>
  )
}

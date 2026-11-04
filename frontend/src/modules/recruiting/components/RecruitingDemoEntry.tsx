import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { useConfirm } from '@/hooks/use-confirm'
import { getBackendUser } from '@/lib/api/client'
import { isDemoMode } from '@/lib/demo-mode'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'
import { DEMO_COMPANY_ID, DEMO_OPENING_TITLE, loadRecruitingDemo } from '@/modules/recruiting/lib/demo-data'
import { whenSaved } from '@/modules/recruiting/lib/recruiting-store'

const WRITE_ROLES = new Set(['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER'])

// "Carica dati dimostrativi" nella barra laterale di Recruiting, come «Ripristina
// demo» in Assessment: solo in modalità demo (lib/demo-mode.ts), solo sulla
// società demo e solo per chi può scrivere. Si carica solo con questo clic.
export function RecruitingDemoEntry() {
  const [confirm, confirmDialog] = useConfirm()
  const [busy, setBusy] = useState(false)
  const { company, setPosition } = useActivePosition()
  if (!isDemoMode() || company?.id !== DEMO_COMPANY_ID || !WRITE_ROLES.has(getBackendUser()?.role ?? '')) return null

  async function run() {
    const ok = await confirm({
      title: 'Caricare i dati dimostrativi?',
      description: `Si aggiunge ad Acme la posizione «${DEMO_OPENING_TITLE}», con candidati inventati, e diventa la posizione attiva. Le altre posizioni e gli altri candidati non cambiano. Se è già stata caricata, viene sostituita.`,
      confirmLabel: 'Carica',
      cancelLabel: 'Annulla',
    })
    if (!ok) return
    setBusy(true)
    try {
      const { companyId, openingId } = loadRecruitingDemo()
      await whenSaved()
      setPosition(companyId, openingId)
      toast.success('Dati dimostrativi caricati.')
    } catch (err) {
      toast.error(`Dati dimostrativi non caricati: ${err instanceof Error ? err.message : String(err)}. Riprova.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Strumenti amministrazione</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton type="button" onClick={() => void run()} disabled={busy}>
            <RotateCcw aria-hidden="true" />
            <span className="min-w-0 flex-1">Carica dati dimostrativi</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {confirmDialog}
    </SidebarGroup>
  )
}

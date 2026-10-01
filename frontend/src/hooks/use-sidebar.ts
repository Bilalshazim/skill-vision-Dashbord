import { createContext, useContext } from 'react'

// Stato della barra laterale condiviso fra il guscio e i suoi pezzi: su
// mobile la barra è un pannello (Sheet) che si apre e si chiude.
export type SidebarState = { openMobile: boolean; setOpenMobile: (open: boolean) => void }

export const SidebarContext = createContext<SidebarState | null>(null)

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar va usato dentro SidebarProvider')
  return ctx
}

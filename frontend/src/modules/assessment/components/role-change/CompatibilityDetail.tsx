import { StatCard } from '@/components/patterns/StatCard'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { justification } from '@/modules/assessment/components/role-change/CandidateCard'
import { ReqStatusBadge } from '@/modules/assessment/components/role-change/ReqStatusBadge'
import type { AssessmentLang, getUI } from '@/modules/assessment/lib/legacy-utils'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import type { Candidate, ReqStatus } from '@/modules/assessment/lib/role-change'
import { weightLabel } from '@/modules/assessment/lib/role-census'

type UI = ReturnType<typeof getUI>
const ORDER: ReqStatus[] = ['posseduta', 'da-sviluppare', 'mancante', 'non-valutata']

// Il dettaglio della compatibilità di una persona: REQUISITI DEL RUOLO ↔
// COMPETENZE DELLA PERSONA, un requisito per riga con il livello richiesto,
// quello della persona e lo stato (posseduta, da sviluppare, mancante). In
// testa il conteggio per stato, che si legge subito, e la motivazione.
export function CompatibilityDetail({ candidate: c, rank, ui, lang, onClose }: { candidate: Candidate | null; rank: number; ui: UI; lang: AssessmentLang; onClose: () => void }) {
  return (
    <Sheet open={!!c} onOpenChange={(open) => !open && onClose()}>
      {c ? (
        <SheetContent side="right" size="md" closeLabel={ui.closeBtn}>
          <SheetHeader>
            <div className="min-w-0 flex-1">
              <SheetTitle>
                {c.emp.nome} {c.emp.cognome} · {c.compat}%
              </SheetTitle>
              <SheetDescription>
                {ui.rcDetailTitle} — {ui.rcDetailSub}
              </SheetDescription>
            </div>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-6">
            <p className="text-app-small">{justification(c, rank, ui)}</p>
            <div className="grid grid-cols-2 gap-3">
              {ORDER.filter((s) => s !== 'non-valutata' || c.results.some((r) => r.status === s)).map((s) => (
                <StatCard key={s} size="sm" label={ui.rcStatusLabel[s]} value={c.results.filter((r) => r.status === s).length} tone={s === 'posseduta' ? 'success' : s === 'da-sviluppare' ? 'warning' : s === 'mancante' ? 'strong' : 'neutral'} />
              ))}
            </div>
            <Table frame>
              <TableHeader>
                <TableRow>
                  <TableHead>{ui.rcReq}</TableHead>
                  <TableHead className="text-right">{ui.rcRequired}</TableHead>
                  <TableHead className="text-right">{ui.rcPerson}</TableHead>
                  <TableHead>{ui.rcStatus}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.results.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell>
                      <span className="block">{r.name}</span>
                      <span className="block text-app-caption text-muted-foreground">
                        {ui.rcKind[r.kind]} · {ui.rcWeight} {weightLabel(r.weight, lang).toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{fmt1it(r.target)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{r.value == null ? '–' : fmt1it(r.value)}</TableCell>
                    <TableCell>
                      <ReqStatusBadge status={r.status} label={ui.rcStatusLabel[r.status]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SheetBody>
        </SheetContent>
      ) : null}
    </Sheet>
  )
}

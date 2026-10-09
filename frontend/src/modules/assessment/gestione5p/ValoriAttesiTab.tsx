import { Note } from '@/components/patterns/Note'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ITEMS_5P } from '@/modules/assessment/gestione5p/items'
import { CODES, PS, type State5p, edit, expCount } from '@/modules/assessment/gestione5p/model'

// Valori attesi: il livello richiesto per ogni voce, su scala 0–100 (si salva
// 1–10, come i voti). La colonna Base vale per tutti; una colonna per reparto
// la sostituisce dove il valore è diverso. Non compaiono nelle schede dei
// valutatori e si possono cambiare anche dopo la raccolta. Sono la base dello
// skill gap nella Scheda individuale. Una riga P imposta le sue cinque voci.
export function ValoriAttesiTab({ state, update }: { state: State5p; update: (fn: (s: State5p) => State5p) => void }) {
  const reparti = [...new Set(state.people.map((p) => (p.reparto || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const cols: { id: string; label: string; group: string | null }[] = [{ id: 'base', label: 'Base (tutti)', group: null }, ...reparti.map((r) => ({ id: r, label: r, group: r }))]
  const bucket = (s: State5p, group: string | null) => (group ? (s.exp.groups[group] ??= {}) : s.exp.base)
  const read = (group: string | null, c: string) => (group ? state.exp.groups[group]?.[c] : state.exp.base[c])
  const show = (v: number | undefined) => (v == null ? '' : String(Math.round(v * 10)))

  function setValues(group: string | null, codes: string[], raw: string) {
    const n = raw.trim() === '' ? null : Number(raw.replace(',', '.'))
    if (n != null && (Number.isNaN(n) || n < 10 || n > 100)) return
    update((s) =>
      edit(s, (d) => {
        const b = bucket(d, group)
        codes.forEach((c) => {
          if (n == null) delete b[c]
          else b[c] = n / 10
        })
      }),
    )
  }
  const cell = (group: string | null, codes: string[], label: string) => {
    const vals = codes.map((c) => read(group, c))
    const same = vals.every((v) => v === vals[0])
    const placeholder = group ? (codes.length === 1 ? show(state.exp.base[codes[0]]) : '') : ''
    return (
      <TableCell className="text-right">
        <Input
          size="sm"
          type="number"
          inputMode="numeric"
          min={10}
          max={100}
          step={5}
          aria-label={label}
          placeholder={placeholder || '–'}
          className="ml-auto w-24 text-right tabular-nums"
          defaultValue={same ? show(vals[0]) : ''}
          key={`${group}|${codes.join()}|${same ? vals[0] : 'x'}`}
          onBlur={(e) => {
            if (e.target.value !== (same ? show(vals[0]) : '')) setValues(group, codes, e.target.value)
          }}
        />
      </TableCell>
    )
  }

  return (
    <section className="flex max-w-5xl flex-col gap-4">
      <div>
        <h3 className="text-app-section text-foreground">Valori attesi</h3>
        <Note className="mt-1">
          Il livello richiesto per ogni voce, da 10 a 100. La colonna Base vale per tutti; una colonna per reparto la sostituisce dove il valore è diverso. Non compaiono nelle schede dei valutatori. Sono definiti {expCount(state)} valori.
        </Note>
      </div>
      <Table frame>
        <TableHeader>
          <TableRow>
            <TableHead>Voce</TableHead>
            {cols.map((c) => (
              <TableHead key={c.id} className="text-right">
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {PS.map((P) => {
            const codes = CODES.filter((c) => c[0] === P.k)
            return [
              <TableRow key={P.k} className="bg-muted">
                <TableCell className="font-medium">
                  {P.k} · {P.n}
                </TableCell>
                {cols.map((c) => cell(c.group, codes, `${P.k} ${P.n}, ${c.label}: tutte le voci`))}
              </TableRow>,
              ...codes.map((code) => {
                const it = ITEMS_5P.find((i) => i.cod === code)!
                return (
                  <TableRow key={code}>
                    <TableCell>
                      <span className="font-mono text-muted-foreground">{code}</span> {it.area}
                    </TableCell>
                    {cols.map((c) => cell(c.group, [code], `${code} ${it.area}, ${c.label}`))}
                  </TableRow>
                )
              }),
            ]
          })}
        </TableBody>
      </Table>
    </section>
  )
}

import { Note } from '@/components/patterns/Note'
import { fmtDec } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ITEMS_5P } from '@/modules/assessment/gestione5p/items'
import { CODES, PS, type State5p, cap, dn, edit, expCount, groups, people, personByName, plural, same } from '@/modules/assessment/gestione5p/model'

// 4 · Valori attesi: il livello che l'azienda considera necessario per ogni
// voce, su scala 0–10 (si salva 1–10, come i voti). Non compare nelle schede
// dei valutatori, si può impostare anche dopo la raccolta e può essere diverso
// per area o gruppo: la colonna Base vale per tutti, quelle dei gruppi solo
// dove il valore è diverso. Nei risultati diventa lo skill gap (voto − atteso).
export function ValoriAttesiTab({ state, update, toast, onGoPeople }: { state: State5p; update: (fn: (s: State5p) => State5p) => void; toast: (m: string) => void; onGoPeople: () => void }) {
  const G = groups(state)
  const cnt = (g: string) => people(state).filter((p) => (p.gruppo || '').trim() === g).length
  const none = people(state).filter((p) => !(p.gruppo || '').trim()).length
  const cols: { id: string; label: string; group: string | null }[] = [{ id: 'base', label: 'Base', group: null }, ...G.map((g) => ({ id: g, label: g, group: g }))]
  const read = (group: string | null, c: string) => (group ? state.exp.groups[group]?.[c] : state.exp.base[c])
  const show = (v: number | undefined) => (v == null ? '' : fmtDec(Math.round(v * 10) / 10))

  function setValues(group: string | null, codes: string[], raw: string) {
    const n = raw.trim() === '' ? null : Number(raw.replace(',', '.'))
    if (n != null && (Number.isNaN(n) || n < 0 || n > 10)) {
      toast('Scrivi un numero da 0 a 10')
      return
    }
    update((s) =>
      edit(s, (d) => {
        const b = group ? (d.exp.groups[group] ??= {}) : d.exp.base
        codes.forEach((c) => {
          if (n == null) delete b[c]
          else b[c] = n
        })
      }),
    )
  }
  function teamGroups() {
    let n = 0
    const next = edit(state, (d) => {
      d.people.forEach((p) => {
        if ((p.gruppo || '').trim() || !p.cog) return
        const dir = d.plan.filter((x) => x.tipo === 'DIR' && same(x.valutato, dn(p)))
        if (dir.length) {
          const boss = personByName(d, dir[0].valutatore)
          p.gruppo = `Team ${boss ? cap(boss.cog) : dir[0].valutatore}`
          n++
        } else if (p.roles.dir) {
          p.gruppo = 'Dirigenti'
          n++
        }
      })
    })
    update(() => next)
    toast(n ? `${n} persone assegnate a un gruppo` : 'Tutti hanno già un gruppo')
  }
  const cell = (group: string | null, codes: string[], label: string) => {
    const vals = codes.map((c) => read(group, c))
    const def = vals.filter((v) => v != null)
    const same5 = def.length === codes.length && def.every((v) => v === def[0])
    const value = codes.length === 1 ? show(vals[0]) : same5 ? show(def[0]) : ''
    const placeholder = codes.length === 1 ? (group ? show(state.exp.base[codes[0]]) || '–' : '–') : def.length ? 'misto' : group ? 'base' : '–'
    return (
      <TableCell key={`${group}|${codes.join()}`}>
        <Input
          size="sm"
          inputMode="decimal"
          aria-label={label}
          placeholder={placeholder}
          className="w-20 font-mono tabular-nums"
          defaultValue={value}
          key={`${group}|${codes.join()}|${value}`}
          onBlur={(e) => {
            if (e.target.value.trim() !== value) setValues(group, codes, e.target.value)
          }}
        />
      </TableCell>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h3 className="text-app-section text-foreground">Valore atteso aziendale</h3>
        <Note className="max-w-3xl">
          Per ogni voce, il livello che l&apos;azienda considera necessario, da 0 a 10. <b className="font-semibold text-foreground">Non compare nelle schede dei valutatori</b>, si può impostare anche dopo la raccolta e può essere diverso per area o gruppo. Nei risultati diventa lo <b className="font-semibold text-foreground">skill gap</b>: voto ottenuto − valore atteso.
        </Note>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-app-small text-muted-foreground">Gruppi:</span>
          {G.length ? (
            G.map((g) => (
              <Badge key={g} className="normal-case tracking-normal">
                {g} · {cnt(g)}
              </Badge>
            ))
          ) : (
            <span className="text-app-small">nessun gruppo: tutti usano la colonna Base</span>
          )}
          {none && G.length ? <Badge tone="warning">Senza gruppo · {none}</Badge> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={teamGroups}>
            Crea i gruppi dai team dei dirigenti
          </Button>
          <Button variant="outline" size="sm" onClick={onGoPeople}>
            Assegna i gruppi alle persone
          </Button>
        </div>
        <Note size="caption">
          Scrivi il valore nella colonna <b className="font-semibold">Base</b> per tutti. Nelle colonne dei gruppi scrivi solo dove il valore è diverso: le caselle vuote usano la Base (numero in grigio). La riga di ogni P imposta in un colpo le sue 5 voci. Sono definiti {plural(expCount(state), 'valore', 'valori')}.
        </Note>
      </div>
      <div className="max-h-[75vh] overflow-auto rounded-sm border border-border">
        <Table minWidth="lg">
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-muted">Voce</TableHead>
              {cols.map((c) => (
                <TableHead key={c.id}>
                  {c.label}
                  <span className="block font-sans normal-case tracking-normal">{c.group ? `${cnt(c.group)} pers.` : 'tutti'}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PS.map((P) => {
              const codes = CODES.filter((c) => c[0] === P.k)
              return [
                <TableRow key={P.k} className="bg-muted">
                  <TableCell className="sticky left-0 z-10 bg-muted font-semibold">
                    {P.k} · {P.n}
                  </TableCell>
                  {cols.map((c) => cell(c.group, codes, `${P.k} ${P.n}, ${c.label}: tutte le voci`))}
                </TableRow>,
                ...codes.map((code) => {
                  const it = ITEMS_5P.find((i) => i.cod === code)!
                  return (
                    <TableRow key={code}>
                      <TableCell className="sticky left-0 z-10 bg-card">
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
      </div>
    </section>
  )
}

# Avanzamento

Leggere questo file per primo, a ogni sessione.

## Piano

### Fase 0 — Analisi ✅ (architettura approvata; restano domande aperte)
- [x] Creare PROGRESS.md e DECISIONI.md
- [x] Analisi di Recruiting, Assessment e guscio legacy → ANALISI.md
- [x] Audit identità in sola lettura (800 difetti in `frontend/src`)
- [x] Verifica visiva del capitolo 7 (screenshot chiaro/scuro, 6 schermate)
- [x] Approvazione dell'architettura (ANALISI.md §14) — recepita in CLAUDE.md
- [x] Aggiornamento dell'analisi sui commit dal 25/09 (ANALISI §16)
- [ ] Risposte ancora aperte: divergenze §11, icona quadrata, nomi fasce,
      destino della nuova Home Assessment

### Fase 1 — Fondamenta ✅ (in attesa di revisione)
- [x] `frontend/src/index.css` sostituito da `frontend/src/globals.css`
      (import in `main.tsx`), più l'azzeramento delle ombre
- [x] Geist / Geist Mono: già caricati da Google Fonts con i soli pesi 400/500/600
- [x] `components.json` punta a `src/globals.css`
- [x] Due modalità e switch verificati (screenshot prima/dopo, 6 schermate × 2)
- [x] Ponte per Assessment (`assessment-bridge.css`), `--accent` neutralizzato
- [x] `badge.tsx` e `button.tsx` sulla scala; `rounded-md` → `rounded-sm`,
      `rounded-xl` → `rounded-lg`

### Fase 2 — Mappatura (MAPPATURA.md) ✅ (in attesa di revisione)
- [x] Ramo `assessment-home-valore-panel`: già contenuto in `main`
- [x] Inventario aggiornato: componenti, campi nativi, classi CSS di Assessment
- [x] MAPPATURA.md: campi, pattern condivisi, guscio, Home Assessment,
      dominio, grafici, da togliere, divergenze, ordine per la Fase 3
- [x] Decisioni registrate (Select, date, Esc, StatCard, Accordion,
      Tabs, tabelle, badge, toni della Home, Phosphor)
- [ ] Bloccato: valutatore esterno di Assessment (serve un modello dati
      sul backend) — MAPPATURA §8.2
### Fase 3 — La libreria di componenti (in corso)
- [x] Blocco 1: catalogo `/dev/components` + Button, Card, Badge, Tooltip,
      pattern `Hint` — sostituiti nei due moduli
- [ ] Blocco 2: Input, Textarea, Field, Label
- [ ] Blocco 3: Select + SelectField, Checkbox, Switch, Slider
- [ ] Blocco 4: Dialog (con conferma se ci sono modifiche), AlertDialog +
      ConfirmDialog, Sonner, Alert + InlineAlert
- [ ] Blocco 5: Tabs, ToggleGroup, Accordion, Collapsible, Progress
- [ ] Blocco 6: Table + DataTable, Sheet, Skeleton
- [ ] Blocco 7: pattern (PageHeader, StatCard, EmptyState, FileDrop,
      FolderCard, SkillVisionCard, CrossModuleBanner) + Phosphor → Lucide
- [ ] Blocco 8: componenti di dominio
### Fase 4 — Guscio unico (login React per primo)
### Fase 5 — Grafici (Bklit)
### Fase 6 — Schermate
### Fase 7 — Verifica

## Registro

## 2026-09-28 — Fase 3, blocco 1
- [x] Recepite da CLAUDE.md: valutatore esterno di Assessment invariato;
      navigazione mobile a pannello; dialog con modifiche non salvate
      chiedono conferma alla chiusura (prop del pattern, blocco 4).
- [x] Catalogo `/dev/components` (`src/dev/ComponentCatalog.tsx`): due
      colonne chiaro/scuro affiancate. Montato solo sotto
      `import.meta.env.DEV`: verificato che la build di produzione non lo
      contiene.
- [x] **Button**: raggio md (sm per le taglie piccole), peso 500, hover su
      `--primary-hover`, focus ring accent-600 2px offset 2px, taglia
      `icon-sm`. Via la pillola nei due moduli insieme. Sostituiti: 6 `.btn`
      e 2 `.icon-btn` in Assessment, `ActionButton` (eliminato), 19 bottoni
      fatti a mano in Recruiting, `LegacyBridgeButton` ricostruito su Button.
      Regole `.btn*`/`.icon-btn`/`.exi-cta .btn` tolte dal CSS di Assessment.
- [x] **Card**: API nuova — `padding` md (16, default) / lg / none, parti
      interne senza padding proprio, `CardLabel` e `CardAction` aggiunti.
      Recruiting: tolte le sovrascritture `p-6` / `p-0 pb-3` / `text-sm`,
      convertiti 10 riquadri fatti a mano. Assessment: 115 elementi
      `.card` / `.card-title-row` / `.card-title` / `.card-eyebrow` → Card,
      CardHeader, CardTitle, CardLabel (AST, 14 file); regole CSS tolte.
- [x] **Badge**: stile label, toni neutral/accent/success/warning/destructive
      su fondi tenui. 44 `.chip` di Assessment → Badge; `chipTone()` per le
      classi ancora nei dati. Recruiting: toni rinominati.
- [x] **Tooltip**: bordo marcato, nessuna ombra. Pattern **Hint** al posto di
      `title` su 11 bottoni (Topbar compreso).
- [!] Trovato e corretto: il reset di Assessment (`* { margin:0; padding:0 }`)
      stava fuori layer e azzerava il padding di ogni primitiva montata lì —
      `CrossModuleBanner` e `ModuleLockGate` in Assessment erano senza
      padding. Spostato nel layer `base`.
- [!] Trovato e corretto: **`text-success`, `text-warning`, `bg-success`,
      `--chart-1…6` erano vuoti in modalità chiara dalla Fase 1** — riferimento
      circolare fra primitive e utility in `globals.css`. Primitive chiare
      rinominate `-light`. A schermo ora compaiono colori di stato che prima
      mancavano (es. barre ambra dei cluster Soft).
- [!] Trovato e corretto: `cn()` scartava il colore accanto a `text-app-*`
      (tailwind-merge non conosceva la scala): in scuro il testo del bottone
      primario era chiaro sul lime. Esteso `lib/utils.ts`.
- [ ] Rimandati: 3 `.chip` cliccabili (Anagrafica, pesi in RoleCensus,
      EmployeeSoftSkillModal) → bottoni nel blocco 5; badge dei livelli con
      colore dai dati (Competenze Professionali) → Fase 5; `title` su testo
      troncato e righe di punteggio restano nativi; la voce di menu
      disabilitata di Assessment va con la Sidebar (Fase 4); la card-bottone
      di `PipelineDashboard`, i pozzetti `bg-secondary`, `MasterCard` → blocchi
      successivi; "Sistema Attivo" resta fino alla Fase 6.
- Build, `tsc -b`, oxlint (18 avvisi, gli stessi di prima) ok. Audit 794 → 753.

## 2026-09-28 — Fase 2
- [x] Completata la Fase 1 secondo il CLAUDE.md aggiornato: `--muted` →
      `--text-muted` e `--radius-*` → `--a-radius-*` in Assessment. Build ok;
      verificato a runtime che dentro lo scope `--radius-md` = 16px, `--muted`
      = fondo del sistema, card del modulo a 14px.
- [x] Ramo `assessment-home-valore-panel`: 0 commit avanti rispetto a `main`,
      niente da riallineare.
- [x] Scritto MAPPATURA.md. Nessun file del prodotto toccato per la mappatura.
- [!] Il valutatore esterno di Assessment non si può portare sul token
      backend senza un modello dati nuovo sul server: il backend ha
      valutatori solo per campagne e candidati. Fermo lì (tocca il
      salvataggio dei dati).
- [!] Nuova divergenza emersa: navigazione su mobile (striscia orizzontale
      in Recruiting, pannello laterale in Assessment). Blocca solo la Sidebar.
- [!] Trovati 6 `ErrorNote`/`ErrorBanner` e 17 costanti di classi per i campi
      duplicati dentro Recruiting: si chiudono con InlineAlert e Field.

## 2026-09-28 — Fase 1
- [x] `globals.css` installato come `frontend/src/globals.css`; `index.css`
      rimosso, la copia nella radice pure (una sola copia del tema).
- [x] Aggiunto a `globals.css` l'azzeramento di `--shadow-2xs…2xl`: lo faceva
      `index.css`, senza quel blocco tornavano 66 classi `shadow-*` di Tailwind.
      → DECISIONI.
- [x] Ponte Assessment in `modules/assessment/styles/assessment-bridge.css`,
      caricato dopo `assessment-scoped.css` nei due punti d'ingresso
      (AssessmentLayout, AssessmentEvaluatePage).
- [x] Il lime di Assessment passa da `var(--accent)` a `var(--primary)`:
      53 usi nel CSS, 7 nel TS, più la lettura runtime in `brand-chart.ts`.
      Stesso valore (accent-400) nelle due modalità. → DECISIONI.
- [x] `rounded-md` → `rounded-sm` e `rounded-xl` → `rounded-lg` in 59 file:
      stessi pixel di prima (10 e 24), ora dalla scala giusta.
- [x] `badge.tsx`: gap 4, px 8, py 4, punto `size-1.5`. `button.tsx` sm: px 12, py 4.
- [x] Build ok (`tsc -b` + `vite build`). Audit: 882 → 794.
- [x] Verifica a schermo: Recruiting (Home, Profilo, Scheda professionale) e
      Assessment (Home, Intervista, Valore), chiaro e scuro, confrontati con
      HEAD da un worktree temporaneo. Ombre calcolate: 0 ovunque (prima fino
      a 15 per pagina). Il lime dei bottoni primari resta. Switch del tema:
      `.dark` e `data-theme` restano allineati.
- [!] Cambia a schermo, come previsto: testo da `#111827` (freddo) a
      neutral-800; corpo base a 14px; in scuro `bg-secondary` passa da
      neutral-800 a neutral-700; `bg-muted` in chiaro coincide con la card.
- [!] I grafici che leggono `--chart-2` (OrgScoreTrendChart, ValoreAreaChart)
      passano dal blu `#5B7FA6` al magenta della famiglia categorica. È il
      token nuovo; la palette dei grafici si sistema in Fase 5.
- [!] Nel ponte non ci sono `--muted` e i raggi. `--muted` in Assessment è
      un colore di testo (lo legge `apex-charts-3d.ts`), in shadcn è un fondo;
      `--radius-sm/md/lg` di Assessment (8/10/14) coprono quelli del sistema
      dentro lo scope. Vanno risolti prima di montare primitive in
      Assessment (Fase 3).
- [ ] Rimandato: logo rotto nella landing legacy (`assets/Logo/…`), da
      chiudere con la sostituzione del logo su entrambe le copie del guscio.
- Nota: `legacy-assessment.css` non è importato da nessuna parte: è la copia
  di riferimento del CSS originale. Contiene ancora `var(--accent)`, senza effetto.

## 2026-09-28
- [x] Ripresa della Fase 0: l'analisi era già fatta. Verificato cosa è
      cambiato dal 25/09 — 13 commit sulla Home Assessment. Scritto ANALISI §16.
- [!] Nuova dipendenza `@phosphor-icons/react` (4 file): fuori stack, da
      portare a Lucide in Fase 3.
- [!] Audit salito da 800 a 882 difetti, quasi tutti dal CSS aggiunto alla
      Home Assessment (esadecimali, arancio fuori palette).
- Nessun file del prodotto modificato.

## 2026-09-25
- [x] Fase 0 completata. ANALISI.md scritto. Nessun file del prodotto modificato.
- [x] Audit eseguito: 800 difetti in 87 file sotto `frontend/src`
      (1.041 in tutto il repository, backend e guscio compresi).
- [x] App avviata in locale su :5199 (backend spento) solo per gli screenshot,
      poi fermata.
- [!] Trovato rotto, non causato da questa sessione: la landing legacy mostra
      un'immagine rotta al posto del logo. I file sono stati spostati da
      `assets/Logo/` ad `assets/` nella copia di lavoro (non ancora committato),
      ma `index.html` punta ancora ad `assets/Logo/…`. La copia in
      `frontend/legacy-shell/` (produzione) non è toccata. Non corretto:
      rimandato alla Fase 1 o alla sostituzione del logo.
- [!] Il capitolo 7 di CLAUDE.md e il punto `<details>` della Fase 2 non
      corrispondono al codice attuale in diverse voci (ANALISI §9, §12).

// 6 · Metodo: come si svolge in azienda, come si calcola, gli errori trovati nel
// foglio DASHBOARD del vecchio modulo, riservatezza e regole. Il testo è quello
// del modello (SKILL-VISION_Valutazione_5P.html).
const STEPS = [
  ['Anagrafica.', "HR prepara l'elenco: nome, ruolo, reparto, responsabile diretto. Si importa da Excel."],
  ['Assegnazioni.', "Una tabella con una riga per dipendente: accanto al nome ci sono il responsabile e i colleghi che lo valuteranno (l'autovalutazione è sempre inclusa). Il sistema prepara una proposta; per cambiare un valutatore si clicca sulla casella. Si può anche lavorare in Excel con i menu a tendina e reimportare."],
  ['Comunicazione.', 'Prima di distribuire le schede, incontro o email: scopo (sviluppo, non sanzione), riservatezza dei Peer, obbligo di un esempio concreto nelle NOTE, scadenza.'],
  ['Distribuzione.', "Chi gestisce la piattaforma scarica lo ZIP delle schede (passo 3) e invia a ogni valutatore, con un'email personale, il suo file Scheda_5P_Nome.html. L'elenco invii nello ZIP dice quale file va a chi."],
  ['Compilazione e ritorno.', "Il valutatore apre la scheda con un doppio clic, legge le istruzioni, vota con la barra 1–10 e alla fine scarica il file Risposte_5P_Nome.json, che rimanda all'email indicata."],
  ['Caricamento.', 'Tutti i file ricevuti si trascinano insieme nel passo 4. Il sistema legge nomi, tipo e voti, segnala errori e doppioni.'],
  ['Verifica copertura.', 'La tabella avanzamento mostra chi manca. Si sollecita, si ricaricano i nuovi file.'],
  ['Risultati e restituzione.', 'Punteggio unico per P, scheda individuale, gap di percezione, esportazione Excel per il colloquio di feedback.'],
]
const Formula = ({ children }: { children: string }) => <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-app-caption whitespace-pre">{children}</pre>
const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4">
    <h3 className="text-app-section text-foreground">{title}</h3>
    {children}
  </div>
)

export function MetodoTab() {
  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Come si svolge in azienda">
          <ol className="flex flex-col gap-3">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[2rem_1fr] gap-3 text-app-small">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary font-mono text-app-caption font-semibold text-primary-foreground">{i + 1}</span>
                <div>
                  <b className="font-semibold">{t}</b> {d}
                </div>
              </li>
            ))}
          </ol>
          <p className="text-app-caption">
            <b className="font-semibold">Per chi gestisce la piattaforma.</b> Il lavoro resta salvato nel browser di questo computer. A fine sessione premi <b className="font-semibold">Salva progetto</b> in alto: ottieni un file per ogni azienda cliente, da riaprire con <b className="font-semibold">Apri progetto</b> anche da un altro PC. Se dopo l&apos;invio cambi un&apos;assegnazione, rimanda la scheda solo ai valutatori interessati: le risposte che avevano già dato restano.
          </p>
        </Panel>
        <Panel title="Come si calcola">
          <div className="flex flex-col gap-3 text-app-small">
            <p>Per ogni scheda, il voto di una P è la media dei suoi 5 item compilati (1–10).</p>
            <Formula>P(scheda) = (item1 + … + item5) / item compilati</Formula>
            <p>Poi si fa la media per fonte, su tutte le schede ricevute da quella fonte:</p>
            <Formula>P(Dirigente), P(Peer), P(Auto) = media delle schede di quella fonte</Formula>
            <p>
              Il <b className="font-semibold">punteggio unico</b> di ogni P si ottiene in uno dei tre modi (si sceglie nella scheda Risultati):
            </p>
            <Formula>{`Media delle 3 fonti   = (Dir + Peer + Auto) / 3\nMedia semplice        = somma di tutti i voti P / n. schede\nMedia pesata          = Dir×wD + Peer×wP + Auto×wA (pesi su 100)`}</Formula>
            <p className="text-app-caption">
              Esempio: Mario riceve 1 scheda Dirigente (6), 4 Peer (8, 8, 7, 9) e la sua Auto (9). Media delle fonti = (6 + 8 + 9) / 3 = <b className="font-semibold">7,67</b>. Media semplice = (6+8+8+7+9+9) / 6 = <b className="font-semibold">7,83</b>. Con la media semplice i 4 colleghi pesano il 67% del voto e il dirigente il 17%; con la media delle fonti ogni fonte pesa un terzo, qualunque sia il numero di colleghi. Per questo il default è la media delle fonti, la stessa usata nel foglio DASHBOARD del vostro modulo.
            </p>
            <p className="text-app-caption">
              <b className="font-semibold">Punteggio 5P</b> = media delle 5 P. <b className="font-semibold">Livelli</b> (dal vostro protocollo): sotto 3 Non adeguato · 3–5 In sviluppo · 5–7 Adeguato · 7–9 Avanzato · 9 e oltre Eccellente.
            </p>
            <p className="text-app-caption">
              <b className="font-semibold">Gap di percezione</b>: differenza tra fonti. Se l&apos;autovalutazione supera di almeno 1,5 punti la media degli altri, la persona si sopravvaluta; se è più bassa di 1,5, si sottovaluta.
            </p>
          </div>
        </Panel>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Errori trovati nel foglio DASHBOARD del modulo attuale">
          <p className="text-app-caption">
            Il file <span className="font-mono">COMPETENZE_PROFESSIONALI_Assessment.xlsx</span> ha formule che puntano alle celle sbagliate. Questo sistema non le usa, ma se il foglio viene usato da solo i risultati sono errati:
          </p>
          <ul className="grid list-disc gap-1.5 pl-5 text-app-caption">
            <li>
              <b className="font-semibold">Colonna PEER</b>: per B, C, D, E legge righe spostate (es. B legge F17:F21 invece di F19:F23), quindi include celle d&apos;intestazione e salta item.
            </li>
            <li>
              <b className="font-semibold">Colonna AUTO</b>: stesso problema con uno scostamento diverso (es. B legge F18:F22).
            </li>
            <li>
              <b className="font-semibold">Riga APEX SCORE</b>: le celle Peer e Auto fanno la media della colonna Responsabile (C5:C9) invece della propria.
            </li>
            <li>
              <b className="font-semibold">Interpretazione gap</b>: quando il Responsabile dà un voto più alto dell&apos;Auto, il foglio scrive &quot;Responsabile più critico&quot;, ma è il contrario: è il dipendente a essere più critico di sé.
            </li>
            <li>Il foglio gestisce un solo collega per persona: con più Peer serve un sistema come questo.</li>
          </ul>
        </Panel>
        <Panel title="Riservatezza e regole">
          <ul className="grid list-disc gap-1.5 pl-5 text-app-caption">
            <li>I Peer restano anonimi nei report individuali: le note compaiono come &quot;Collega&quot;. Con meno di 3 colleghi la media Peer è riconoscibile e il sistema lo segnala.</li>
            <li>Informativa privacy ai dipendenti (GDPR art. 13) prima della raccolta, con scopo, tempi di conservazione e chi vede i dati.</li>
            <li>Il punteggio è un supporto: decisioni su retribuzione o carriera non vanno prese solo su di esso (GDPR art. 22) e vanno discusse nel colloquio.</li>
            <li>I file compilati contengono dati personali: tenerli in una cartella ad accesso solo HR. Questo strumento lavora nel browser e non invia i dati a nessun server.</li>
          </ul>
        </Panel>
      </div>
    </section>
  )
}

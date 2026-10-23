import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PS, type State5p, cronbach } from '@/modules/assessment/gestione5p/model'

// Metodo: il processo, come si calcola, i fondamenti scientifici del modello
// 5P, modelli analoghi, perché più valutatori, l'affidabilità sui dati
// raccolti (alfa di Cronbach), i riferimenti bibliografici, riservatezza e
// regole. Il testo è quello del modello del cliente (2026-10-12).
const STEPS: [string, string][] = [
  ['Piano.', 'HR prepara il file Excel: elenco nominativi, chi valuta come dirigente, chi valuta come collega, chi si autovaluta. La piattaforma lo importa e controlla nomi, doppioni e coperture.'],
  ['Invio.', 'Ogni valutatore riceve una sola email con la sua scheda 5P: una guida completa (modello, scala con esempi, che cosa osservare per ogni domanda, errori da evitare, domande frequenti) e l’elenco delle persone da valutare.'],
  ['Raccolta.', 'I valutatori rimandano il file delle risposte; HR li carica tutti insieme e vede chi manca.'],
  ['Media delle valutazioni.', 'Per ogni persona e ogni voce: media di tutte le valutazioni di dirigente e colleghi.'],
  ['Confronto con l’autovalutazione.', 'L’autovalutazione resta visibile ma non entra nella media: si mostra la differenza.'],
  ['Confronto con il Valore Atteso.', 'HR imposta, anche dopo la raccolta, il livello richiesto per ogni voce e per ogni area. Non è visibile ai valutatori.'],
  ['Skill Gap e report.', 'Per ogni persona e ogni voce: voto, valore atteso e distanza (+/−), con il report individuale da usare nel colloquio.'],
]
const FOUNDATIONS: [string, string, string, string][] = [
  ['A · Professionalità', 'Competenze tecniche, conoscenza dei processi, uso degli strumenti, decisioni', 'Conoscenza del lavoro e competenze (job knowledge, competency modeling)', 'McClelland, 1973; Spencer & Spencer, 1993; Schmidt & Hunter, 1998. In Italia la “professionalità” è la base del sistema di inquadramento del CCNL Metalmeccanici rinnovato il 5 febbraio 2021.'],
  ['B · Performance', 'Scadenze, qualità, contributo al team, autonomia', 'Prestazione sul compito (task performance)', 'Campbell, 1990; Borman & Motowidlo, 1993; Motowidlo & Van Scotter, 1994; Koopmans et al., 2011'],
  ['C · Predisposizione', 'Adattamento al cambiamento, stress, apprendimento, problem solving, flessibilità', 'Prestazione adattiva (adaptive performance)', 'Pulakos et al., 2000: le cinque voci di C corrispondono a dimensioni della loro tassonomia'],
  ['D · Pensiero', 'Impegno, contributo agli obiettivi, partecipazione, motivazione, clima', 'Prestazione contestuale, comportamenti di cittadinanza organizzativa, engagement', 'Organ, 1988; Borman & Motowidlo, 1993; Kahn, 1990; Schaufeli et al., 2002'],
  ['E · Potenziale', 'Uso del feedback, autoconsapevolezza, formazione, nuove tecnologie, obiettivi di sviluppo', 'Learning agility, orientamento al feedback, potenziale', 'Lombardo & Eichinger, 2000; London & Smither, 2002; Silzer & Church, 2009; De Meuse et al., 2010'],
]
const REFS = [
  'Atwater, L. E., & Yammarino, F. J. (1992). Does self–other agreement on leadership perceptions moderate the validity of leadership and performance predictions? Personnel Psychology, 45(1), 141–164.',
  'Bartram, D. (2005). The Great Eight competencies: A criterion-centric approach to validation. Journal of Applied Psychology, 90(6), 1185–1203. https://doi.org/10.1037/0021-9010.90.6.1185',
  'Borman, W. C., & Motowidlo, S. J. (1993). Expanding the criterion domain to include elements of contextual performance. In N. Schmitt & W. C. Borman (Eds.), Personnel selection in organizations (pp. 71–98). Jossey-Bass.',
  'Campbell, J. P. (1990). Modeling the performance prediction problem in industrial and organizational psychology. In M. D. Dunnette & L. M. Hough (Eds.), Handbook of industrial and organizational psychology (2nd ed., Vol. 1, pp. 687–732). Consulting Psychologists Press.',
  'Campion, M. A., Fink, A. A., Ruggeberg, B. J., Carr, L., Phillips, G. M., & Odman, R. B. (2011). Doing competencies well: Best practices in competency modeling. Personnel Psychology, 64(1), 225–262. https://doi.org/10.1111/j.1744-6570.2010.01207.x',
  'CCNL Metalmeccanica industria (Federmeccanica, Assistal, Fim-Cisl, Fiom-Cgil, Uilm-Uil), rinnovo del 5 febbraio 2021: nuovo sistema di classificazione del personale per campi di professionalità.',
  'Conway, J. M., & Huffcutt, A. I. (1997). Psychometric properties of multisource performance ratings: A meta-analysis of subordinate, supervisor, peer, and self-ratings. Human Performance, 10(4), 331–360.',
  'Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. Psychometrika, 16(3), 297–334.',
  'De Meuse, K. P., Dai, G., & Hallenbeck, G. S. (2010). Learning agility: A construct whose time has come. Consulting Psychology Journal: Practice and Research, 62(2), 119–130.',
  'Fleenor, J. W., Smither, J. W., Atwater, L. E., Braddy, P. W., & Sturm, R. E. (2010). Self–other rating agreement in leadership: A review. The Leadership Quarterly, 21(6), 1005–1034. https://doi.org/10.1016/j.leaqua.2010.10.006',
  'Harris, M. M., & Schaubroeck, J. (1988). A meta-analysis of self–supervisor, self–peer, and peer–supervisor ratings. Personnel Psychology, 41(1), 43–62.',
  'Kahn, W. A. (1990). Psychological conditions of personal engagement and disengagement at work. Academy of Management Journal, 33(4), 692–724.',
  'Koopmans, L., Bernaards, C. M., Hildebrandt, V. H., Schaufeli, W. B., de Vet, H. C. W., & van der Beek, A. J. (2011). Conceptual frameworks of individual work performance: A systematic review. Journal of Occupational and Environmental Medicine, 53(8), 856–866. https://doi.org/10.1097/JOM.0b013e318226a763',
  'Lombardo, M. M., & Eichinger, R. W. (2000). High potentials as high learners. Human Resource Management, 39(4), 321–329.',
  'London, M., & Smither, J. W. (2002). Feedback orientation, feedback culture, and the longitudinal performance management process. Human Resource Management Review, 12(1), 81–100.',
  'McClelland, D. C. (1973). Testing for competence rather than for “intelligence”. American Psychologist, 28(1), 1–14.',
  'Motowidlo, S. J., & Van Scotter, J. R. (1994). Evidence that task performance should be distinguished from contextual performance. Journal of Applied Psychology, 79(4), 475–480.',
  'Nunnally, J. C. (1978). Psychometric theory (2nd ed.). McGraw-Hill.',
  'Organ, D. W. (1988). Organizational citizenship behavior: The good soldier syndrome. Lexington Books.',
  'Pulakos, E. D., Arad, S., Donovan, M. A., & Plamondon, K. E. (2000). Adaptability in the workplace: Development of a taxonomy of adaptive performance. Journal of Applied Psychology, 85(4), 612–624. https://doi.org/10.1037/0021-9010.85.4.612',
  'Roch, S. G., Woehr, D. J., Mishra, V., & Kieszczynska, U. (2012). Rater training revisited: An updated meta-analytic review of frame-of-reference training. Journal of Occupational and Organizational Psychology, 85(2), 370–395. https://doi.org/10.1111/j.2044-8325.2011.02045.x',
  'Schaufeli, W. B., Salanova, M., González-Romá, V., & Bakker, A. B. (2002). The measurement of engagement and burnout: A two sample confirmatory factor analytic approach. Journal of Happiness Studies, 3(1), 71–92.',
  'Schmidt, F. L., & Hunter, J. E. (1998). The validity and utility of selection methods in personnel psychology: Practical and theoretical implications of 85 years of research findings. Psychological Bulletin, 124(2), 262–274.',
  'Silzer, R., & Church, A. H. (2009). The pearls and perils of identifying potential. Industrial and Organizational Psychology, 2(4), 377–412.',
  'Smith, P. C., & Kendall, L. M. (1963). Retranslation of expectations: An approach to the construction of unambiguous anchors for rating scales. Journal of Applied Psychology, 47(2), 149–155.',
  'Smither, J. W., London, M., & Reilly, R. R. (2005). Does performance improve following multisource feedback? A theoretical model, meta-analysis, and review of empirical findings. Personnel Psychology, 58(1), 33–66.',
  'Spencer, L. M., & Spencer, S. M. (1993). Competence at work: Models for superior performance. Wiley.',
  'Viswesvaran, C., Ones, D. S., & Schmidt, F. L. (1996). Comparative analysis of the reliability of job performance ratings. Journal of Applied Psychology, 81(5), 557–574.',
  'Woehr, D. J., & Huffcutt, A. I. (1994). Rater training for performance appraisal: A quantitative review. Journal of Occupational and Organizational Psychology, 67(3), 189–205. https://doi.org/10.1111/j.2044-8325.1994.tb00562.x',
]
const Formula = ({ children }: { children: string }) => <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-app-caption whitespace-pre">{children}</pre>
const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4">
    <h3 className="text-app-section text-foreground">{title}</h3>
    {children}
  </div>
)
const B = ({ children }: { children: React.ReactNode }) => <b className="font-semibold">{children}</b>

export function MetodoTab({ state }: { state: State5p }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Il processo">
          <ol className="flex flex-col gap-3">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[2rem_1fr] gap-3 text-app-small">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary font-mono text-app-caption font-semibold text-primary-foreground">{i + 1}</span>
                <div>
                  <B>{t}</B> {d}
                </div>
              </li>
            ))}
          </ol>
          <p className="text-app-caption">
            <B>Per chi gestisce la piattaforma.</B> Il lavoro si salva da solo sul server: lo ritrovi da qualunque computer, e i colleghi della stessa società vedono gli stessi dati. <B>Salva progetto</B> in alto ne fa anche una copia in un file, da riaprire con <B>Apri progetto</B>.
          </p>
        </Panel>
        <Panel title="Come si calcola">
          <div className="flex flex-col gap-3 text-app-small">
            <p>Ogni valutatore dà un voto da 1 a 10 a 25 voci, 5 per ogni P. Nei risultati si legge la media su 10, con un decimale, come in «7,2 su 10».</p>
            <Formula>{`Voto di una voce   = media dei voti di dirigente e colleghi\nVoto di una P      = media delle sue 5 voci\nVoto 5P            = media delle 5 P\nAutovalutazione    = voto dato a sé stessi, fuori dalla media\nDifferenza         = autovalutazione − voto\nSkill Gap          = voto − valore atteso`}</Formula>
            <p className="text-app-caption">
              Esempio: C4 Problem solving riceve 8 dal dirigente e 7, 7, 6, 8 da quattro colleghi. Voto = (8+7+7+6+8)/5 = <B>7,2</B>. Valore atteso 8,0 → <B>Skill Gap −0,8</B>. Se la persona si era data 9 → autovalutazione <B>9,0</B>, differenza <B>+1,8</B>: si percepisce più forte di come la vedono gli altri.
            </p>
            <p className="text-app-caption">
              Ogni scheda pesa uguale, quindi un dirigente e quattro colleghi danno cinque valutazioni dello stesso peso. Lettura dello Skill Gap: <B>0 o più</B> = livello raggiunto · <B>da −0,1 a −0,9</B> = vicino al livello · <B>−1,0 o meno</B> = da sviluppare. Lettura della differenza: entro ±0,9 percezione allineata, da +1,0 si sopravvaluta, da −1,0 si sottovaluta.
            </p>
            <p className="text-app-caption">Le voci senza voto, comprese quelle segnate «Non so valutare», non entrano nella media. Se una persona è valutata solo da sé stessa non ha un voto finale.</p>
            <p className="text-app-caption">
              <B>Livelli</B> (su 10): sotto 3,0 Non adeguato · 3,0–4,9 In sviluppo · 5,0–6,9 Adeguato · 7,0–8,9 Avanzato · 9,0 e oltre Eccellente.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Fondamenti scientifici del modello 5P">
        <p className="max-w-4xl text-app-small">
          Il nome «5P» e il raggruppamento in cinque aree sono una sintesi di SKILL-VISION: in letteratura non esiste un modello pubblicato con questo nome. Ognuna delle cinque aree, però, corrisponde a costrutti studiati e misurati da decenni nella psicologia del lavoro. Il modello non è una classificazione arbitraria: mette insieme dimensioni della prestazione individuale riconosciute dalla ricerca.
        </p>
        <Table frame minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>P</TableHead>
              <TableHead>Cosa misura</TableHead>
              <TableHead>Costrutto di riferimento</TableHead>
              <TableHead>Fonti</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FOUNDATIONS.map((r) => (
              <TableRow key={r[0]}>
                <TableCell className="font-semibold whitespace-nowrap">{r[0]}</TableCell>
                <TableCell>{r[1]}</TableCell>
                <TableCell>{r[2]}</TableCell>
                <TableCell className="text-app-caption">{r[3]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Modelli analoghi">
          <ul className="grid list-disc gap-2 pl-5 text-app-caption">
            <li><B>Koopmans et al. (2011)</B>, revisione sistematica dei modelli di prestazione individuale: quattro dimensioni ricorrenti, cioè compito, contesto, adattamento e comportamenti controproducenti. Le prime tre corrispondono a B, D e C del 5P.</li>
            <li><B>Campbell (1990)</B>: modello in otto componenti della prestazione, base di gran parte della ricerca successiva.</li>
            <li><B>Bartram (2005)</B>, «Great Eight»: otto competenze generali validate rispetto a criteri di prestazione su più studi.</li>
            <li><B>Modelli 3P.</B> Il più noto è il modello retributivo «3P» (Position, Person, Performance), diffuso nella pratica del compensation management senza un&apos;unica origine accademica. Distingue il valore del ruolo, quello della persona e quello dei risultati. È la stessa logica che il 5P applica alla valutazione: la persona (A, E) è separata dai risultati (B).</li>
            <li><B>Prestazione × potenziale</B> (matrice a 9 riquadri): la distinzione tra rendimento attuale e potenziale è discussa da Silzer &amp; Church (2009) e corrisponde alla separazione tra B e E.</li>
          </ul>
        </Panel>
        <Panel title="Perché più valutatori e perché l’autovalutazione è fuori dalla media">
          <ul className="grid list-disc gap-2 pl-5 text-app-caption">
            <li>Un solo valutatore è poco affidabile: la meta-analisi di <B>Viswesvaran, Ones &amp; Schmidt (1996)</B> stima un accordo tra valutatori di circa .52 per i responsabili e .42 per i colleghi. Fare la media di più valutatori riduce l&apos;errore.</li>
            <li>Le autovalutazioni sono in media più alte e poco correlate con quelle degli altri (<B>Harris &amp; Schaubroeck, 1988</B>; <B>Conway &amp; Huffcutt, 1997</B>): metterle nella media gonfierebbe i risultati.</li>
            <li>La differenza tra come ci si vede e come si è visti è però un&apos;informazione utile: chi si sopravvaluta tende ad avere risultati peggiori (<B>Atwater &amp; Yammarino, 1992</B>; <B>Fleenor et al., 2010</B>). Per questo il report la mostra.</li>
            <li>Il feedback da più fonti produce miglioramenti reali anche se moderati, soprattutto quando è seguito da obiettivi e colloquio (<B>Smither, London &amp; Reilly, 2005</B>).</li>
            <li>La scala usa ancoraggi comportamentali per 1, 5 e 10 (<B>Smith &amp; Kendall, 1963</B>): tutti i valutatori giudicano con lo stesso metro.</li>
            <li>Ogni scheda contiene una guida per i valutatori: che cosa significa ogni livello della scala con esempi, che cosa osservare per ogni domanda, gli errori di valutazione più comuni. Le meta-analisi sulla formazione dei valutatori indicano che dare a tutti lo stesso quadro di riferimento (frame-of-reference training) è il metodo più efficace per rendere i voti accurati (<B>Woehr &amp; Huffcutt, 1994</B>; <B>Roch et al., 2012</B>). La guida scritta ne è una versione sintetica: per valutazioni importanti conviene affiancarle un breve incontro di allineamento con i valutatori.</li>
            <li>Definire per ogni ruolo il livello richiesto e misurare la distanza è una buona pratica della modellazione delle competenze (<B>Campion et al., 2011</B>): è il Valore Atteso con lo Skill Gap.</li>
          </ul>
        </Panel>
      </div>

      <Panel title="Affidabilità sui vostri dati">
        <p className="max-w-4xl text-app-small">
          Per dimostrare la solidità dello strumento sui dati raccolti, la piattaforma calcola per ogni P l&apos;<B>alfa di Cronbach</B> (Cronbach, 1951): quanto le 5 voci di una P misurano la stessa cosa. Valori da .70 in su sono considerati accettabili, da .80 buoni (Nunnally, 1978). Il calcolo usa le valutazioni di dirigenti e colleghi complete di tutte le 5 voci.
        </p>
        <Table frame>
          <TableHeader>
            <TableRow>
              <TableHead>P</TableHead>
              <TableHead>Valutazioni usate</TableHead>
              <TableHead>Alfa</TableHead>
              <TableHead>Giudizio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PS.map((P) => {
              const c = cronbach(state, P.k)
              return (
                <TableRow key={P.k}>
                  <TableCell className="font-semibold">
                    {P.k} · {P.n}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">{c.n}</TableCell>
                  <TableCell className="font-mono font-semibold tabular-nums">{c.a == null ? '–' : c.a.toFixed(2).replace('.', ',')}</TableCell>
                  <TableCell>
                    {c.a == null ? <Badge>Servono 10 valutazioni complete</Badge> : c.a >= 0.8 ? <Badge tone="success">Buona</Badge> : c.a >= 0.7 ? <Badge tone="success">Accettabile</Badge> : <Badge tone="warning">Da verificare</Badge>}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {state.demo ? <p className="text-app-caption text-muted-foreground">Con i dati di esempio i valori sono solo illustrativi.</p> : null}
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Riferimenti bibliografici">
          <ol className="grid gap-2 text-app-caption">
            {REFS.map((r) => (
              <li key={r} className="pl-7 -indent-7">
                {r}
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Riservatezza e regole">
          <ul className="grid list-disc gap-2 pl-5 text-app-caption">
            <li>I colleghi restano anonimi: nel report le loro note compaiono come «Collega» e i voti sono uniti a quelli del dirigente in un&apos;unica media. Con meno di 3 colleghi la piattaforma lo segnala.</li>
            <li>Il Valore Atteso non compare nelle schede dei valutatori: non orienta il giudizio.</li>
            <li>Informativa privacy ai dipendenti (GDPR art. 13) prima della raccolta: scopo, tempi di conservazione, chi vede i dati.</li>
            <li>Il punteggio è un supporto. Decisioni su retribuzione o carriera non vanno prese solo su di esso (GDPR art. 22) e vanno discusse nel colloquio.</li>
            <li>I file compilati contengono dati personali: vanno tenuti in una cartella con accesso solo HR. I dati del progetto stanno sul server della piattaforma e li vede solo chi lavora nella società.</li>
          </ul>
        </Panel>
      </div>
    </section>
  )
}

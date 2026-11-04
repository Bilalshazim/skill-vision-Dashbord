// La lettura del bilancio (Excel o CSV chiave/valore): la stessa del motore ROI
// (repository Skill-Vision-ROI, core/importer.js), con la mappa delle voci e il
// formato dei numeri uguali. In più la durata dell'esercizio, che il motore non ha.

/* eslint-disable */
export const MAP: Record<string, string> = {
  "azienda":"company","ragione sociale":"company","company":"company",
  "partita iva":"piva","p iva":"piva","piva":"piva","partita iva c f":"piva","partita iva codice fiscale":"piva",
  "settore":"settore","settore di attivita":"settore","descrizione ateco":"settore","attivita":"settore",
  "codice ateco":"ateco","ateco":"ateco","codice attivita ateco":"ateco","codice attivita":"ateco",
  "esercizio":"anno","anno":"anno",
  "dipendenti":"N","numero dipendenti":"N","n dipendenti":"N","organico":"N","fte":"N",
  "investimento":"inv","investimento skill vision":"inv","costo intervento":"inv","costo assessment":"inv","corrispettivo assessment":"inv",
  "persone valutate":"nVal","dipendenti valutati":"nVal","popolazione valutata":"nVal",
  "costo azioni":"invAz","costo azioni di sviluppo":"invAz","costo formazione":"invAz","investimento azioni":"invAz",
  "posizioni in organigramma":"posPrev","posizioni previste":"posPrev","posizioni organigramma":"posPrev",
  "posizioni vacanti":"posVac",
  "accantonamenti":"acc","accantonamenti per rischi e oneri":"acc","altri accantonamenti":"acc","accantonamenti per rischi":"acc",
  "ebit dichiarato":"ebit","ebitda dichiarato":"ebitda",
  "valore competenze":"comp","competenze":"comp",
  "gap":"gap","gap medio":"gap","gap medio vs atteso":"gap","gap vs valore atteso":"gap","gap medio sotto soglia":"gap",
  "copertura ruoli":"cov","copertura":"cov",
  "turnover":"turn",
  "assenteismo":"ass","assenteismo e malattia":"ass","assenteismo malattia":"ass","assenze":"ass",
  "ricavi operativi":"ric","ricavi":"ric",
  "totale valore della produzione":"vdp","valore della produzione":"vdp","valore produzione":"vdp",
  "totale costi della produzione":"costiProd","costi della produzione":"costiProd","costi produzione":"costiProd",
  "costo del personale":"cp","costo personale":"cp",
  "salari e stipendi":"sal","salari":"sal",
  "margine operativo lordo ebitda":"ebitda","ebitda":"ebitda","margine operativo lordo":"ebitda",
  "risultato operativo ebit":"ebit","ebit":"ebit","risultato operativo":"ebit",
  "ammortamenti e svalutazioni":"amm","ammortamenti":"amm",
  "utile perdita dell esercizio":"un","utile netto":"un","utile dell esercizio":"un",
  "risultato prima delle imposte":"ante","utile ante imposte":"ante","risultato ante imposte":"ante",
  "imposte sul reddito d esercizio":"imposte","imposte":"imposte","imposte sul reddito":"imposte",
  "costo per servizi":"serv","costi per servizi":"serv",
  "roce":"roce","roce return on capital employed":"roce",
  "r o i return on investment":"roiAz","roi":"roiAz","roi return on investment":"roiAz",
  "r o s return on sales":"ros","ros":"ros","ros return on sales":"ros",
  "variazione valore della produzione":"crescita","crescita":"crescita","crescita valore produzione":"crescita",
  "durata esercizio":"mesi","durata dell esercizio":"mesi","mesi esercizio":"mesi","mesi dell esercizio":"mesi","mesi":"mesi"
}

export function norm(s: unknown): string {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[%€().,:;'"’‘“”]/g,' ')
    .replace(/[^a-z0-9 ]/g,' ')
    .replace(/\s+/g,' ').trim();
}

/* Converte un valore di cella in numero. Il formato italiano ha la precedenza:
   «25.619.746» e «31.000» sono migliaia, «4,3» e «0,125» decimali, «1.234,56» misto.
   Restano riconosciuti i formati inglesi non ambigui («24,103,607», «1,234.56», «2.4»). */
export function toNum(v: unknown): number {
  if(typeof v==='number') return v;
  if(v===null||v===undefined) return NaN;
  const tok=/^[-+]?[\d.,]*\d/.exec(String(v).replace(/[€\s ]/g,'').replace(/%/g,''));
  if(!tok) return NaN;
  /* solo la parte numerica iniziale: «4,3 p.p.» → «4,3» */
  let s=tok[0].replace(/^\+/,'');
  const hasDot=s.indexOf('.')>=0, hasComma=s.indexOf(',')>=0;
  if(hasDot && hasComma){
    /* l'ultimo separatore è quello decimale */
    if(s.lastIndexOf(',')>s.lastIndexOf('.')) s=s.replace(/\./g,'').replace(',','.');
    else s=s.replace(/,/g,'');
  } else if(hasComma){
    /* virgola come separatore delle migliaia solo nei gruppi inglesi completi (24,103,607 · 4,325) */
    if(/^-?[1-9]\d{0,2}(,\d{3})+$/.test(s)) s=s.replace(/,/g,'');
    else s=s.replace(',','.');
  } else if(hasDot){
    /* punto come separatore delle migliaia nei gruppi italiani completi (25.619.746 · 31.000) */
    if(/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,'');
  }
  const n=parseFloat(s);
  return isFinite(n)? n : NaN;
}


/* divide una riga CSV rispettando le virgolette */
function splitCsvLine(line: string, sep: string): string[] {
  const out: string[]=[]; let cur="", q=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(q){
      if(c==='"'){ if(line[i+1]==='"'){ cur+='"'; i++; } else q=false; }
      else cur+=c;
    } else if(c==='"') q=true;
    else if(c===sep){ out.push(cur.trim()); cur=""; }
    else cur+=c;
  }
  out.push(cur.trim());
  return out;
}
function countOutsideQuotes(line: string, sep: string): number {
  let n=0, q=false;
  for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"') q=!q; else if(!q && c===sep) n++; }
  return n;
}
/* CSV → righe. Separatore rilevato sulla prima riga non vuota: punto e virgola, virgola o tabulazione. */
export function parseCsv(text: unknown): string[][] {
  const clean=String(text).replace(/^\uFEFF/,'');
  const lines=clean.split(/\r?\n/);
  const first=lines.find(function(l: string){ return l.trim()!==''; })||'';
  let sep=';', best=-1;
  [';',',','\t'].forEach(function(c){ const n=countOutsideQuotes(first,c); if(n>best){ best=n; sep=c; } });
  return lines.map(function(l: string){ return splitCsvLine(l,sep); });
}


/** Dalle righe del file alle voci riconosciute: per ogni chiave, il primo numero alla sua destra. */
export function readRows(rows: unknown[][]): { values: Record<string, number>; company: string; seen: string[] } {
  const values: Record<string, number> = {}
  const seen = new Set<string>()
  const accKeys = new Set<string>()
  let company = ''
  rows.forEach((r) => {
    if (!r || r.length < 2) return
    for (let i = 0; i < r.length - 1; i++) {
      const key = norm(r[i] == null ? '' : r[i])
      if (!key) continue
      const tgt = MAP[key]
      if (!tgt) continue
      if (tgt === 'acc' ? accKeys.has(key) : seen.has(tgt)) continue
      let found = false
      for (let j = i + 1; j < r.length; j++) {
        const raw = r[j]
        if (raw === null || raw === undefined || String(raw).trim() === '') continue
        if (tgt === 'company') {
          company = String(raw).trim()
          found = true
          break
        }
        if (tgt === 'piva' || tgt === 'settore' || tgt === 'ateco') {
          found = true
          break
        }
        const n = toNum(raw)
        if (isFinite(n)) {
          if (tgt === 'acc') {
            values.acc = (seen.has('acc') ? values.acc || 0 : 0) + n
            accKeys.add(key)
          } else values[tgt] = n
          found = true
          break
        }
      }
      if (found) {
        seen.add(tgt)
        break
      }
    }
  })
  return { values, company, seen: [...seen] }
}

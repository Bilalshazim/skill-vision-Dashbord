// Il motore ROI del capitale umano: la stessa funzione di roi.skill-vision.it
// (repository Skill-Vision-ROI, src/js/core/model.js), riportata alla lettera.
// Livello 1 dati → livello 2 potenziali lordi → livello 3 beneficio atteso.
// Una formula si corregge in tutti e due i posti: model.test.ts controlla gli
// stessi valori di riferimento dei test del motore (CLAUDE.md, Fase 6, "Euro dal
// motore ROI"). Funzione pura: non conosce la dashboard.

/* eslint-disable */
export type RoiState = {
  N: number; nVal: number; inv: number; invAz: number
  comp: number; gap: number; cov: number; posPrev: number; turn: number; ass: number
  ric: number; vdp: number; costiProd: number; cp: number; sal: number
  amm: number; acc: number; ebit: number; ebitda: number; un: number; ante: number; imposte: number
  conv: 'gest' | 'prud'; base: 'hcva' | 'va' | 'ebitda' | 'cp'
  el: number; r1: number; cs: number; r2: number; qa: number; r3: number; l4on: number; posVac: number; gg: number; r4: number
}

export type RoiModel = Record<string, number> & { hasAB: boolean; posAssunta: boolean; l4active: boolean; ebitdaOK: boolean; bases: { hcva: number; va: number; ebitda: number; cp: number } }

/* Motore di calcolo: dallo stato (bilancio + assessment + ipotesi) a tutte le grandezze del business case.
   Livello 1 dati → livello 2 potenziali lordi → livello 3 beneficio atteso. Funzione pura. */

export function model(S: RoiState, over?: Partial<RoiState>): RoiModel {
  const s: RoiState = over? Object.assign({},S,over) : S;
  const m = {} as RoiModel;
  m.N = s.N>0? +s.N : 1;
  m.nVal = s.nVal>0? +s.nVal : (s.N>0? +s.N : 0);
  m.popF = s.N>0? Math.min(1, m.nVal/s.N) : 0;

  /* convenzioni contabili: EBIT ed EBITDA si ricalcolano dalle voci */
  m.hasAB = s.vdp>0 && s.costiProd>0;
  m.ebitAB = m.hasAB? s.vdp - s.costiProd : (+s.ebit||0);
  m.EBIT = m.ebitAB;
  m.EBITDA = m.EBIT + (+s.amm||0) + (s.conv==="prud"? 0 : (+s.acc||0));
  m.VA = m.EBITDA + (+s.cp||0);
  m.HCVA = m.EBIT + (+s.cp||0);
  m.costiEsterni = s.vdp - m.VA;
  m.bases = {hcva:m.HCVA, va:m.VA, ebitda:m.EBITDA, cp:+s.cp||0};
  m.base = m.bases[s.base as keyof typeof m.bases]; if(!isFinite(m.base)) m.base = m.HCVA;
  m.hcroi = s.cp>0? m.HCVA/s.cp : NaN;
  m.taxRate = (s.ante>0 && s.imposte>=0)? s.imposte/s.ante : NaN;
  m.cmed = s.cp/m.N; m.ral = s.sal/m.N; m.cpSal = s.sal>0? s.cp/s.sal : NaN;
  m.vaFte = m.VA/m.N; m.hcvaFte = m.HCVA/m.N; m.vdpFte = s.vdp/m.N; m.ebitdaFte = m.EBITDA/m.N;
  m.atteso = (+s.comp||0) + (+s.gap||0);
  m.usc = m.N * s.turn/100;
  m.posAssunta = !(s.posPrev>0);
  m.posBase = m.posAssunta? m.N : +s.posPrev;
  m.scop = m.posBase*(1 - s.cov/100);

  /* livello 2: potenziali lordi */
  m.gapVal  = Math.max(0, m.base) * s.gap/100 * m.popF;
  m.costSost = m.ral * s.cs/100;
  m.turnVal = m.usc * m.costSost;
  m.assLordo = s.cp * s.ass/100;
  m.assVal  = m.assLordo * s.qa/100;
  m.mgg     = Math.max(0, m.hcvaFte)/220;
  m.l4active = (+s.l4on===1);
  m.covVal  = m.l4active? Math.max(0,+s.posVac||0) * m.mgg * (+s.gg||0) : 0;

  /* livello 3: beneficio atteso */
  m.effL1 = (s.el/100)*(s.r1/100);
  m.l1 = m.gapVal * m.effL1;
  m.l2 = m.turnVal * s.r2/100;
  m.l3 = m.assVal  * s.r3/100;
  m.l4 = m.covVal  * s.r4/100;
  m.costBen = m.l2 + m.l3 + m.l4;
  m.prodBen = m.l1;
  m.benefit = m.costBen + m.prodBen;
  m.pool = m.gapVal + m.turnVal + m.assVal + m.covVal;

  m.invTot = (+s.inv||0) + (+s.invAz||0);
  m.net = m.benefit - m.invTot;
  m.roi = m.invTot>0? m.net/m.invTot*100 : NaN;
  m.roiCost = m.invTot>0? (m.costBen - m.invTot)/m.invTot*100 : NaN;
  m.shareL1 = m.benefit>0? m.l1/m.benefit*100 : NaN;
  m.payback = (m.benefit>0 && m.invTot>0)? m.invTot/(m.benefit/12) : Infinity;
  m.beGap = m.gapVal>0? m.invTot/m.gapVal*100 : NaN;
  m.bePool = m.pool>0? m.invTot/m.pool*100 : NaN;
  m.beBen = m.benefit>0? m.invTot/m.benefit*100 : NaN;
  m.netTax = isFinite(m.taxRate)? m.net*(1-m.taxRate) : NaN;
  m.maxAz = m.benefit - (+s.inv||0);
  m.ebitdaOK = m.EBITDA>0 && s.vdp>0;
  m.ebitdaImp = m.ebitdaOK? m.benefit/m.EBITDA*100 : NaN;
  m.ebitdaMargOld = m.ebitdaOK? m.EBITDA/s.vdp*100 : NaN;
  m.ebitdaMargNew = m.ebitdaOK? (m.EBITDA+m.benefit)/s.vdp*100 : NaN;
  m.utileImp = (s.un>0 && isFinite(m.taxRate))? m.benefit*(1-m.taxRate)/s.un*100 : NaN;
  m.invPctCp = s.cp>0? m.invTot/s.cp*100 : NaN;
  m.invPctVdp = s.vdp>0? m.invTot/s.vdp*100 : NaN;
  m.invPerFte = m.invTot/m.N;
  m.ggEbitda = m.EBITDA>0? m.invTot/(m.EBITDA/365) : NaN;

  /* piano di verifica: valori impliciti nello scenario */
  m.tgtTurn = s.turn*(1 - s.r2/100);
  m.tgtAss  = s.ass*(1 - s.r3/100);
  m.tgtGap  = s.gap*(1 - s.r1/100);
  m.tgtHcvaFte = m.hcvaFte + m.l1/m.N;
  return m;
}

/* Recruiting module logic — extracted verbatim from Recruiting.html */
// ══ THEME ══════════════════════════════════════════════════
function applyTheme(t){
  const theme=t==='light'?'light':'dark';
  document.body.classList.toggle('light-theme',theme==='light');
  // Master-theme parity: mirror the state onto <html data-theme> like the shell + Assessment.
  document.documentElement.setAttribute('data-theme',theme);
  const dot=document.getElementById('tt-dot'),lbl=document.getElementById('tt-label');
  if(dot){dot.textContent=theme==='light'?'☀️':'🌙';}
  if(lbl){lbl.textContent=theme==='light'?'Chiaro':'Scuro';}
}
function toggleTheme(){
  const cur=document.body.classList.contains('light-theme')?'light':'dark';
  const next=cur==='light'?'dark':'light';
  applyTheme(next);
  try{localStorage.setItem('sv_theme',next);}catch(e){}
}
(function(){try{applyTheme(localStorage.getItem('sv_theme')||'light');}catch(e){}})();

// ══ STORAGE ════════════════════════════════════════════════
const SK='sv_state';
function load(){try{const d=localStorage.getItem(SK);return d?JSON.parse(d):null;}catch{return null;}}
function save(){try{localStorage.setItem(SK,JSON.stringify({preventivi:ST.preventivi,fasce:ST.fasce,sessKHM:ST.sessKHM,sessSHEA:ST.sessSHEA,scontiDur:ST.scontiDur,codici:ST.codici,comitato:ST.comitato,users:ST.users,palette:ST.palette,texts:ST.texts,clientColors:ST.clientColors,emailConfig:ST.emailConfig}));}catch(e){console.warn('Storage error',e);}}

// ══ STATE ══════════════════════════════════════════════════
const USERS_DEFAULT=[
  {user:'admin',pass:'admin123',name:'Roberto Feliciani',role:'superadmin',email:'roberto@skill-vision.it',stato:'attivo'},
  {user:'roberto',pass:'sv2024',name:'Marco Bianchi',role:'admin',email:'marco@skill-vision.it',stato:'attivo'},
  {user:'operatore',pass:'op123',name:'Giulia Verdi',role:'operatore',email:'giulia@skill-vision.it',stato:'attivo'},
];

const COMITATO_DEFAULT=[
  {ini:'PR',nome:'Prof. A. Romano',ruolo:'Psychometrics & Assessment',paese:'🇮🇹 Italy',bg:'linear-gradient(135deg,#3FBF7F,#1C7A4D)'},
  {ini:'DM',nome:'Dr. M. Dubois',ruolo:'Cognitive Neuroscience',paese:'🇫🇷 France',bg:'linear-gradient(135deg,#2AA5B0,#0F7A85)'},
  {ini:'PK',nome:'Prof. K. Müller',ruolo:'Organizational Behavior',paese:'🇩🇪 Germany',bg:'linear-gradient(135deg,#6A4FA3,#4A3670)'},
  {ini:'DS',nome:'Dr. S. Patel',ruolo:'AI & People Analytics',paese:'🇬🇧 UK',bg:'linear-gradient(135deg,#E08A0B,#8A5107)'},
  {ini:'PL',nome:'Prof. L. García',ruolo:'Strategic HRM',paese:'🇪🇸 Spain',bg:'linear-gradient(135deg,#EF6B54,#BF3022)'},
  {ini:'DV',nome:'Dr. A. Van Berg',ruolo:'Talent & Competency Dev.',paese:'🇳🇱 Netherlands',bg:'linear-gradient(135deg,#D65FB8,#B0208C)'},
  {ini:'PW',nome:'Prof. J. Wang',ruolo:'Data Science & HR-Tech',paese:'🇺🇸 USA',bg:'linear-gradient(135deg,#B4C614,#8C980B)'},
];

const saved=load();
let ST={
  cu:null,
  prevMode:'a',
  currentPrevId:null, // quote currently open in modal
  editingId:null, // if set, Save Quote updates this quote instead of creating a new one
  fasce:saved?.fasce||[
    {max:19,label:'< 19',costo:19.90},{max:39,label:'20–39',costo:17.83},
    {max:59,label:'40–59',costo:16.50},{max:79,label:'60–79',costo:15.66},
    {max:99,label:'80–99',costo:14.83},{max:119,label:'100–119',costo:14.00},
    {max:149,label:'120–149',costo:12.33},{max:179,label:'150–179',costo:10.66},
    {max:209,label:'180–209',costo:10.33},{max:249,label:'210–249',costo:9.83},
    {max:289,label:'250–289',costo:9.00},{max:329,label:'290–329',costo:8.53},
    {max:369,label:'330–369',costo:8.16},{max:409,label:'370–409',costo:7.75},
    {max:449,label:'410–449',costo:7.50},
  ],
  sessKHM:saved?.sessKHM||[2,2,3,3,4,4,5,5,6,7,8,9,10,11,12],
  sessSHEA:saved?.sessSHEA||[1,2,2,2,2,3,3,3,3,4,4,5,5,6,6],
  scontiDur:saved?.scontiDur||{1:0,6:5,12:10},
  codici:saved?.codici||[
    {cod:'AB0682',pct:20,op:'Agent 1',usi:3,attivo:true},
    {cod:'RF2906',pct:25,op:'Agent 2',usi:1,attivo:true},
    {cod:'SR1010',pct:30,op:'Agent 3',usi:0,attivo:true},
    {cod:'AF3009',pct:40,op:'Agent 4',usi:2,attivo:false},
  ],
  preventivi:saved?.preventivi||[
    {id:1,rag:'TechCorp Ltd.',settore:'Technology',ref:'Mario Rossi',email:'mario@techcorp.it',dip:120,dur:12,sol:'abc',cod:'',totale:19840,data:'01/07/2026',op:'Marco Bianchi',note:''},
    {id:2,rag:'Farmavia S.p.A.',settore:'Pharmaceuticals',ref:'Anna Belli',email:'anna@farmavia.it',dip:85,dur:12,sol:'ab',cod:'RF2906',totale:8920,data:'28/06/2026',op:'Marco Bianchi',note:''},
    {id:3,rag:'BuildGroup',settore:'Construction',ref:'Luca Neri',email:'luca@build.it',dip:45,dur:6,sol:'a',cod:'',totale:4230,data:'25/06/2026',op:'Giulia Verdi',note:''},
  ],
  comitato:saved?.comitato||COMITATO_DEFAULT,
  users:saved?.users||USERS_DEFAULT,
  palette:saved?.palette||null,
  texts:saved?.texts||null,
  clientColors:saved?.clientColors||null,
  emailConfig:saved?.emailConfig||null,
};

// ══ UTILS ══════════════════════════════════════════════════
function fmt(n){return '€ '+Math.round(n).toLocaleString('en-US');}
function fmtD(n){return '€ '+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
function today(){return new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});}
function getFascia(n){for(let i=0;i<ST.fasce.length;i++)if(n<=ST.fasce[i].max)return{i,f:ST.fasce[i]};return{i:-1,f:null};}
function calcTot(dip,dur,sol,cod){
  const {f}=getFascia(dip);if(!f)return 0;
  const sc=(ST.scontiDur[dur]||0)/100;
  const bA=f.costo*dip,bB=bA*0.58,bC=bA*0.25;
  const A=bA*(1-sc)*dur,B=bB*(1-sc)*dur,C=bC*(1-sc)*dur;
  let sub=A+(sol==='ab'||sol==='abc'?B:0)+(sol==='abc'?C:0);
  const co=ST.codici.find(x=>x.cod===cod.toUpperCase()&&x.attivo);
  if(co)sub*=(1-co.pct/100);
  return Math.round(sub);
}
function notify(msg,err=false){
  const n=document.getElementById('notif');
  n.textContent=msg;n.style.background=err?'var(--rd)':'var(--g)';
  n.classList.add('show');setTimeout(()=>n.classList.remove('show'),3200);
}
function closeModals(){document.querySelectorAll('.modal-ov').forEach(m=>m.classList.remove('on'));}
document.querySelectorAll('.modal-ov').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModals();}));
function dl(name,type,content){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();}

// ══ LOGIN ══════════════════════════════════════════════════
function doLogin(){
  const u=document.getElementById('lu').value.trim();
  const p=document.getElementById('lp').value.trim();
  const found=ST.users.find(x=>x.user===u&&x.pass===p&&x.stato==='attivo');
  if(!found){document.getElementById('lerr').style.display='block';return;}
  ST.cu=found;
  document.getElementById('screen-login').style.display='none';
  document.getElementById('lerr').style.display='none';
  // All roles land on the quote generator after login; the results dashboard now lives
  // behind the "⚙ Pannello Admin" button (visible for admin/superadmin roles only).
  showPrev();
}
// Enter-key submission now handled natively by <form id="login-form"> onsubmit

function doLogout(){
  ST.cu=null;
  resetPrev();
  document.getElementById('screen-login').style.display='flex';
  document.getElementById('screen-prev').style.display='none';
  document.getElementById('app').style.display='none';
  document.getElementById('lu').value='';document.getElementById('lp').value='';
}

// ══ NAVIGATION ═════════════════════════════════════════════
function showPrev(resetEdit){
  if(resetEdit!==false){ST.editingId=null;}
  document.getElementById('edit-banner').style.display=ST.editingId?'flex':'none';
  document.getElementById('edit-id').textContent=ST.editingId||'';
  document.getElementById('screen-prev').style.display='block';
  document.getElementById('app').style.display='none';
  document.getElementById('btn-admin').style.display=(ST.cu&&ST.cu.role!=='operatore')?'block':'none';
  document.getElementById('rie-op').textContent=ST.cu?ST.cu.name:'';
  document.getElementById('data-prev').textContent=today();
  renderComitato();
  if(resetEdit!==false){setMode('a');calcola();}
}
function cancelEdit(){ST.editingId=null;showPrev();notify('Modifica annullata — nuovo modulo preventivo.');}

function showAdmin(){
  document.getElementById('screen-prev').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('sb-av').textContent=ST.cu.name.charAt(0);
  document.getElementById('sb-un').textContent=ST.cu.name;
  document.getElementById('sb-rl').textContent={superadmin:'Super Admin',admin:'Admin',operatore:'Operatore'}[ST.cu.role];
  buildSidebar();
  showPage('dashboard');
}

// ══ ROLE-BASED SIDEBAR ═════════════════════════════════════
function buildSidebar(){
  const r=ST.cu.role;let h='';
  h+=`<div class="sb-sec">Principale</div>
  <div class="ni on" onclick="showPage('dashboard',this)"><span class="ic">📊</span> Dashboard</div>
  <div class="ni" onclick="showPage('preventivi',this)"><span class="ic">📄</span> Preventivi</div>`;
  if(r==='superadmin'){
    h+=`<div class="sb-sec">Configurazione</div>
    <div class="ni" onclick="showPage('prezzi',this)"><span class="ic">💰</span> Prezzi e Fasce</div>
    <div class="ni" onclick="showPage('soluzioni',this)"><span class="ic">📦</span> Soluzioni</div>
    <div class="ni" onclick="showPage('codici',this)"><span class="ic">🔑</span> Codici Sconto</div>
    <div class="ni" onclick="showPage('comitato',this)"><span class="ic">👨‍🔬</span> Comitato Scientifico</div>
    <div class="ni" onclick="showPage('testi',this)"><span class="ic">✏️</span> Testi ed Etichette</div>
    <div class="ni" onclick="showPage('colori',this)"><span class="ic">🎨</span> Colori e Branding</div>
    <div class="sb-sec">Gestione</div>
    <div class="ni" onclick="showPage('utenti',this)"><span class="ic">👥</span> Utenti e Ruoli</div>
    <div class="ni" onclick="showPage('export',this)"><span class="ic">📤</span> Esporta Dati</div>`;
  }
  if(r==='admin'){
    h+=`<div class="sb-sec">Advisor</div>
    <div class="ni" onclick="showPage('soluzioni',this)"><span class="ic">📦</span> Soluzioni</div>
    <div class="sb-sec">Gestione</div>
    <div class="ni" onclick="showPage('export',this)"><span class="ic">📤</span> Esporta Dati</div>`;
  }
  document.getElementById('sb-nav').innerHTML=h;
}

function showPage(id,el){
  // Per-page role gate: 'soluzioni' is shared with the Advisor (admin) role via its
  // sidebar section above; everything else in this list stays superadmin-only.
  const SUPERADMIN_ONLY=['prezzi','codici','comitato','testi','colori','utenti'];
  const ADVISOR_ALLOWED=['soluzioni'];
  const role=ST.cu&&ST.cu.role;
  const blocked=(SUPERADMIN_ONLY.includes(id)&&role!=='superadmin')||(ADVISOR_ALLOWED.includes(id)&&role!=='superadmin'&&role!=='admin');
  if(blocked){
    notify('❌ Non hai i permessi per accedere a questa pagina.',true);
    id='dashboard';
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('on'));
  document.getElementById('pg-'+id).classList.add('on');
  if(el)el.classList.add('on');
  const T={dashboard:['Dashboard','Panoramica attività'],preventivi:['Preventivi','Gestisci e riapri preventivi'],prezzi:['Prezzi e Fasce','Modifica i prezzi'],soluzioni:['Soluzioni','Configura nomi e contenuti'],codici:['Codici Sconto','Gestisci i codici operatore'],comitato:['Comitato Scientifico','Modifica i membri del team'],testi:['Testi ed Etichette','Personalizza le etichette'],colori:['Colori e Branding','Modifica la palette colori'],utenti:['Utenti e Ruoli','Gestisci accessi e permessi'],export:['Esporta Dati','Scarica preventivi e configurazioni']};
  const t=T[id]||[id,''];
  document.getElementById('pg-title').textContent=t[0];
  document.getElementById('pg-sub').textContent=t[1];
  if(id==='dashboard')buildDashboard();
  if(id==='preventivi')renderPrev();
  if(id==='prezzi')buildPrezziEd();
  if(id==='soluzioni')buildSolEd();
  if(id==='codici')buildCodici();
  if(id==='comitato')buildComitatoEditor();
  if(id==='testi'){loadTestiInputs();loadEmailConfigInputs();}
  if(id==='utenti')buildUsers();
  if(id==='colori'){
    ['g','b','p','am','lt-dk','lt-c1','lt-c2','lt-br','dk-dk','dk-c1','dk-c2','dk-br','qsbg'].forEach(k=>{
      const ci=document.getElementById('col-'+k),hi=document.getElementById('col-'+k+'-h');
      if(ci)ci.oninput=()=>{if(hi)hi.value=ci.value;};
      if(hi)hi.oninput=()=>{if(ci)ci.value=hi.value;};
    });
    loadPaletteInputs();
    loadClientColorInputs();
  }
}

// ══ DASHBOARD ═════════════════════════════════════════════
function buildDashboard(){
  const r=ST.cu.role;
  const src=r==='admin'?ST.preventivi.filter(p=>p.op===ST.cu.name):ST.preventivi;
  const tot=src.reduce((a,p)=>a+p.totale,0);
  document.getElementById('dash-kpi').innerHTML=`
    <div class="kpi" style="border-top-color:var(--g)"><div class="kl">${r==='admin'?'I miei preventivi':'Preventivi totali'}</div><div class="kv">${src.length}</div><div class="ks">nel sistema</div></div>
    <div class="kpi" style="border-top-color:var(--b)"><div class="kl">Valore totale</div><div class="kv" style="font-size:18px">${fmt(tot)}</div><div class="ks">complessivo</div></div>
    <div class="kpi" style="border-top-color:var(--am)"><div class="kl">Con codice sconto</div><div class="kv">${src.filter(p=>p.cod).length}</div><div class="ks">preventivi</div></div>
    <div class="kpi" style="border-top-color:var(--g)"><div class="kl">Scontrino medio</div><div class="kv" style="font-size:18px">${src.length?fmt(tot/src.length):'—'}</div><div class="ks">a preventivo</div></div>
  `;
  const SOL={a:'SV-A',ab:'SV-B',abc:'SV-STRATEGY'};
  document.getElementById('dash-list').innerHTML=[...src].sort((a,b)=>b.id-a.id).slice(0,5).map(p=>`
    <div onclick="apriPrev(${p.id})" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--br);font-size:12px;cursor:pointer;border-radius:6px;transition:background .15s" onmouseover="this.style.background='rgba(221,238,28,.08)'" onmouseout="this.style.background=''">
      <div><div style="font-weight:600;color:var(--tx)">${p.rag}</div><div style="color:var(--tx2)">${p.data} · ${SOL[p.sol]}</div></div>
      <div style="text-align:right"><div style="font-weight:800;color:var(--g)">${fmt(p.totale)}</div><div style="font-size:10px;color:var(--g)">▶ apri</div></div>
    </div>`).join('')||'<div style="color:var(--tx2);font-size:12px;padding:10px 0">Nessun preventivo ancora.</div>';
  const s={a:0,ab:0,abc:0};src.forEach(p=>s[p.sol]=(s[p.sol]||0)+1);
  document.getElementById('dash-rie').innerHTML=`
    <div class="rr"><div class="rr-lbl">Soluzione SV-A</div><div style="font-weight:700;color:var(--g)">${s.a||0} preventivi</div></div>
    <div class="rr"><div class="rr-lbl">Soluzione SV-B</div><div style="font-weight:700;color:var(--b)">${s.ab||0} preventivi</div></div>
    <div class="rr"><div class="rr-lbl">SV-STRATEGY</div><div style="font-weight:700;color:var(--p)">${s.abc||0} preventivi</div></div>
    <div class="rr" style="border-bottom:none"><div class="rr-lbl">Dipendenti medi</div><div style="font-weight:700;color:var(--am)">${src.length?Math.round(src.reduce((a,p)=>a+p.dip,0)/src.length):0} dip.</div></div>
  `;
}

// ══ QUOTES TABLE + OPEN ═══════════════════════════
function renderPrev(list){
  const r=ST.cu.role;
  const src=list||(r==='admin'?ST.preventivi.filter(p=>p.op===ST.cu.name):ST.preventivi);
  const SOL={a:'<span class="chip cg">SV-A</span>',ab:'<span class="chip cb">SV-B</span>',abc:'<span class="chip cp">SV-STRATEGY</span>'};
  document.getElementById('prev-tbody').innerHTML=src.map(p=>`
    <tr class="prev-row-link" onclick="apriPrev(${p.id})">
      <td style="color:var(--tx2);font-weight:700">#${p.id}</td>
      <td><div style="font-weight:600;color:var(--tx)">${p.rag}</div><div style="font-size:10px;color:var(--tx2)">${p.email}</div></td>
      <td style="color:var(--tx2);font-size:11px">${p.settore}</td>
      <td>${SOL[p.sol]||p.sol}</td>
      <td style="text-align:center">${p.dip}</td>
      <td style="font-weight:800;color:var(--g)">${fmt(p.totale)}</td>
      <td style="color:var(--tx2);font-size:11px">${p.data}</td>
      <td style="color:var(--tx2);font-size:11px">${p.op}</td>
      <td onclick="event.stopPropagation()">${r==='superadmin'?`<button class="btn btn-rd" style="padding:4px 10px;font-size:11px" onclick="delPrev(${p.id})">🗑</button>`:'<span style="color:var(--tx3);font-size:11px">▶ clicca la riga</span>'}</td>
    </tr>`).join('');
}

function filterPrev(){
  const q=document.getElementById('srch-prev').value.toLowerCase();
  const r=ST.cu.role;
  const base=r==='admin'?ST.preventivi.filter(p=>p.op===ST.cu.name):ST.preventivi;
  renderPrev(base.filter(p=>(p.rag+' '+p.settore+' '+p.ref+' '+p.sol).toLowerCase().includes(q)));
}

function delPrev(id){
  if(!ST.cu||ST.cu.role!=='superadmin'){notify('❌ Solo il Super Admin può eliminare i preventivi.',true);return;}
  if(!confirm('Eliminare questo preventivo?'))return;
  ST.preventivi=ST.preventivi.filter(p=>p.id!==id);
  save();renderPrev();notify('Preventivo eliminato.');
}

// OPEN quote in detail modal
function apriPrev(id){
  const p=ST.preventivi.find(x=>x.id===id);if(!p)return;
  ST.currentPrevId=id;
  const SOL={a:'SV-A — Soft Skills + Recruiting',ab:'SV-B — Soft + Hard Skills + Recruiting',abc:'SV-STRATEGY — Pacchetto completo'};
  document.getElementById('mpv-title').textContent='📄 Preventivo #'+p.id+' — '+p.rag;
  document.getElementById('mpv-body').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;font-size:13px">
      <div style="background:var(--c2);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--tx2);margin-bottom:4px;text-transform:uppercase">Cliente</div><div style="font-weight:700;color:var(--tx)">${p.rag}</div></div>
      <div style="background:var(--c2);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--tx2);margin-bottom:4px;text-transform:uppercase">Settore</div><div style="font-weight:700;color:var(--tx)">${p.settore||'—'}</div></div>
      <div style="background:var(--c2);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--tx2);margin-bottom:4px;text-transform:uppercase">Referente</div><div style="font-weight:700;color:var(--tx)">${p.ref||'—'}</div></div>
      <div style="background:var(--c2);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--tx2);margin-bottom:4px;text-transform:uppercase">Email</div><div style="font-weight:700;color:var(--tx)">${p.email||'—'}</div></div>
      <div style="background:var(--c2);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--tx2);margin-bottom:4px;text-transform:uppercase">Dipendenti</div><div style="font-size:20px;font-weight:800;color:var(--tx)">${p.dip}</div></div>
      <div style="background:var(--c2);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--tx2);margin-bottom:4px;text-transform:uppercase">Soluzione</div><div style="font-weight:700;color:var(--b)">${SOL[p.sol]}</div></div>
      <div style="background:var(--c2);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--tx2);margin-bottom:4px;text-transform:uppercase">Codice sconto</div><div style="font-weight:700;color:${p.cod?'var(--am)':'var(--tx3)'}">${p.cod||'Nessuno'}</div></div>
      <div style="background:var(--c2);border-radius:8px;padding:10px"><div style="font-size:10px;color:var(--tx2);margin-bottom:4px;text-transform:uppercase">Data</div><div style="font-weight:700;color:var(--tx)">${p.data} · ${p.op}</div></div>
    </div>
    <div style="background:rgba(221,238,28,.1);border:1px solid rgba(221,238,28,.28);border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:11px;color:#565D05;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Totale preventivo</div>
      <div style="font-size:32px;font-weight:800;color:#565D05">${fmt(p.totale)}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:4px">Pagamento: ${p.dur===1?'Mensile':p.dur===6?'Semestrale':'Annuale'}</div>
    </div>
  `;
  document.getElementById('modal-prev-view').classList.add('on');
}

// REOPEN in quote tool (Admin/Super Admin only — enters edit mode so Save updates this quote)
function riapriPrev(){
  const p=ST.preventivi.find(x=>x.id===ST.currentPrevId);if(!p)return;
  if(!ST.cu||ST.cu.role==='operatore'){notify('❌ Non hai i permessi per modificare i preventivi.',true);return;}
  closeModals();
  ST.editingId=p.id;
  showPrev(false);
  document.getElementById('edit-banner').style.display='flex';
  document.getElementById('edit-id').textContent=p.id;
  setTimeout(()=>{
    document.getElementById('rag-soc').value=p.rag;
    document.getElementById('settore').value=p.settore||'';
    document.getElementById('nome-ref').value=p.ref||'';
    document.getElementById('email-ref').value=p.email||'';
    document.getElementById('num-dip').value=p.dip;
    document.getElementById('durata').value=p.dur;
    document.getElementById('codice-op').value=p.cod||'';
    setMode(p.sol);calcola();
    notify('✅ Preventivo #'+p.id+' riaperto!');
  },100);
}

// ══ PRICING EDITOR ════════════════════════════════════════
function buildPrezziEd(){
  document.getElementById('fasce-ed').innerHTML=ST.fasce.map((f,i)=>`<div class="rr"><div class="rr-lbl">${f.label} dip.</div><input class="ri" id="fe-${i}" value="${f.costo.toFixed(2)}"><span style="font-size:11px;color:var(--tx2)">€/dip/mese</span></div>`).join('');
  document.getElementById('khm-ed').innerHTML=ST.fasce.map((f,i)=>`<div class="rr"><div class="rr-lbl">${f.label}</div><input class="ri" id="khm-${i}" value="${ST.sessKHM[i]||0}" style="width:56px"><span style="font-size:11px;color:var(--tx2)">sess.</span></div>`).join('');
  document.getElementById('shea-ed').innerHTML=ST.fasce.map((f,i)=>`<div class="rr"><div class="rr-lbl">${f.label}</div><input class="ri" id="shea-${i}" value="${ST.sessSHEA[i]||0}" style="width:56px"><span style="font-size:11px;color:var(--tx2)">sess.</span></div>`).join('');
  document.getElementById('sc-m').value=ST.scontiDur[1]||0;
  document.getElementById('sc-s').value=ST.scontiDur[6]||5;
  document.getElementById('sc-a').value=ST.scontiDur[12]||10;
}
function saveFasce(){ST.fasce.forEach((f,i)=>{const v=parseFloat(document.getElementById('fe-'+i).value);if(!isNaN(v))f.costo=v;});save();notify('✅ Prezzi salvati!');}
function resetFasce(){if(!confirm('Ripristinare i prezzi predefiniti?'))return;[19.90,17.83,16.50,15.66,14.83,14.00,12.33,10.66,10.33,9.83,9.00,8.53,8.16,7.75,7.50].forEach((v,i)=>{ST.fasce[i].costo=v;});save();buildPrezziEd();notify('✅ Prezzi ripristinati.');}
function saveSess(){
  ST.fasce.forEach((_,i)=>{
    const k=parseInt(document.getElementById('khm-'+i).value);if(!isNaN(k))ST.sessKHM[i]=k;
    const s=parseInt(document.getElementById('shea-'+i).value);if(!isNaN(s))ST.sessSHEA[i]=s;
  });
  save();notify('✅ Sessioni salvate!');
}
function saveScontiDur(){
  ST.scontiDur[1]=parseFloat(document.getElementById('sc-m').value)||0;
  ST.scontiDur[6]=parseFloat(document.getElementById('sc-s').value)||0;
  ST.scontiDur[12]=parseFloat(document.getElementById('sc-a').value)||0;
  save();notify('✅ Sconti salvati!');
}

// ══ SOLUTIONS ════════════════════════════════════════════
const SOL_DEF=[
  {badge:'SV-A',col:'#B4C614',nome:'SV-A — Soft Skills + Recruiting',desc:'Valutazione completa delle competenze trasversali con supporto al recruiting.',coeff:100},
  {badge:'SV-B',col:'#2AA5B0',nome:'SV-B — Soft + Hard Skills + Recruiting',desc:'Copertura totale delle competenze tecniche e trasversali con supporto al recruiting.',coeff:58},
  {badge:'SV-STRATEGY',col:'#6A4FA3',nome:'SV-STRATEGY — Analisi Strategica',desc:'La soluzione più completa con analisi strategica costi-benefici del capitale umano.',coeff:25},
];
function buildSolEd(){
  document.getElementById('sol-ed').innerHTML=SOL_DEF.map((s,i)=>`
    <div class="card" style="border-left:4px solid ${s.col};margin-bottom:12px"><div class="ct">${s.badge}</div>
      <div class="form-grid">
        <div class="fg"><label>Nome soluzione</label><input id="sn-${i}" value="${s.nome}"></div>
        <div class="fg"><label>Coefficiente % di SV-A</label><input id="sc2-${i}" type="number" value="${s.coeff}" ${i===0?'readonly':''}></div>
        <div class="fg full"><label>Descrizione</label><textarea id="sd-${i}">${s.desc}</textarea></div>
      </div>
    </div>`).join('');
}
function saveSoluzioni(){SOL_DEF.forEach((s,i)=>{s.nome=document.getElementById('sn-'+i).value;s.desc=document.getElementById('sd-'+i).value;if(i>0){const v=parseFloat(document.getElementById('sc2-'+i).value);if(!isNaN(v))s.coeff=v;}});save();notify('✅ Soluzioni aggiornate!');}

// ══ CODES ═══════════════════════════════════════════════
function buildCodici(){
  document.getElementById('codici-tbody').innerHTML=ST.codici.map((c,i)=>`
    <tr><td style="font-weight:800;font-family:monospace;color:var(--am)">${c.cod}</td>
    <td><span class="chip ca">–${c.pct}%</span></td><td>${c.op}</td><td>${c.usi}</td>
    <td><span class="chip ${c.attivo?'cg':'cr'}">${c.attivo?'Attivo':'Sospeso'}</span></td>
    <td><button class="btn btn-ghost" style="padding:4px 10px;font-size:11px" onclick="toggleCod(${i})">${c.attivo?'Sospendi':'Attiva'}</button>
    <button class="btn btn-rd" style="padding:4px 10px;font-size:11px;margin-left:4px" onclick="delCod(${i})">🗑</button></td></tr>`).join('');
}
function toggleCod(i){ST.codici[i].attivo=!ST.codici[i].attivo;save();buildCodici();notify('Codice aggiornato.');}
function delCod(i){if(!confirm('Eliminare il codice '+ST.codici[i].cod+'?'))return;ST.codici.splice(i,1);save();buildCodici();notify('Codice eliminato.');}
function saveCodice(){
  const cod=document.getElementById('c-cod').value.trim().toUpperCase();
  const pct=parseInt(document.getElementById('c-pct').value)||10;
  const op=document.getElementById('c-op').value.trim();
  if(!cod){alert('Inserisci un codice.');return;}
  ST.codici.push({cod,pct,op,usi:0,attivo:true});
  save();closeModals();buildCodici();notify('✅ Codice '+cod+' aggiunto (–'+pct+'%)');
}

// ══ SCIENTIFIC COMMITTEE ══════════════════════════════════
function renderComitato(){
  document.getElementById('com-grid-display').innerHTML=ST.comitato.map(m=>`
    <div class="cm"><div class="cm-av" style="background:${m.bg}">${m.ini}</div>
    <div class="cm-n">${m.nome}</div><div class="cm-r">${m.ruolo}</div><div class="cm-c">${m.paese}</div></div>`).join('');
}

function buildComitatoEditor(){
  document.getElementById('comitato-editor').innerHTML=ST.comitato.map((m,i)=>`
    <div class="cm-edit-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:36px;height:36px;border-radius:50%;background:${m.bg};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff">${m.ini}</div>
          <span style="font-size:13px;font-weight:700;color:var(--tx)">${m.nome}</span>
        </div>
        <button class="btn btn-rd" style="padding:4px 10px;font-size:11px" onclick="rimuoviMembro(${i})">🗑 Rimuovi</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="fg"><label>Iniziali avatar</label><input id="cm-ini-${i}" value="${m.ini}" maxlength="3"></div>
        <div class="fg"><label>Nome completo</label><input id="cm-nome-${i}" value="${m.nome}"></div>
        <div class="fg"><label>Ruolo / Specializzazione</label><input id="cm-ruolo-${i}" value="${m.ruolo}"></div>
        <div class="fg"><label>Paese (con emoji bandiera)</label><input id="cm-paese-${i}" value="${m.paese}"></div>
        <div class="fg full"><label>Colore avatar (gradiente CSS)</label><input id="cm-bg-${i}" value="${m.bg}"></div>
      </div>
    </div>`).join('');
}
// Listen for shell messages (when embedded inside the SPA shell)
window.addEventListener('message', function (ev) {
  var d = ev.data || {};
  if (d.source !== 'sv-shell') return;
  if (d.type === 'settings' && d.settings) {
    try {
      if (d.settings.theme) applyTheme(d.settings.theme);
      if (d.settings.accent) {
        // map shell accent to Recruiting's primary token used in templates
        document.documentElement.style.setProperty('--g', d.settings.accent);
        document.documentElement.style.setProperty('--am', d.settings.accent);
      }
    } catch (e) {}
  }
  if (d.type === 'lang' && d.lang) {
    try { document.documentElement.setAttribute('lang', d.lang); } catch (e) {}
  }
  if (d.type === 'activate') {
    // placeholder: reflow charts or tables if needed when the frame becomes active
    try { if (typeof window.onActivate === 'function') window.onActivate(); } catch (e) {}
  }
});

function saveComitato(){
  ST.comitato=ST.comitato.map((_,i)=>({
    ini:document.getElementById('cm-ini-'+i).value.trim(),
    nome:document.getElementById('cm-nome-'+i).value.trim(),
    ruolo:document.getElementById('cm-ruolo-'+i).value.trim(),
    paese:document.getElementById('cm-paese-'+i).value.trim(),
    bg:document.getElementById('cm-bg-'+i).value.trim(),
  }));
  save();renderComitato();notify('✅ Comitato Scientifico aggiornato!');
}

function aggiungiMembro(){
  ST.comitato.push({ini:'NM',nome:'Nuovo Membro',ruolo:'Specializzazione',paese:'🌍 Paese',bg:'linear-gradient(135deg,#B4C614,#8C980B)'});
  buildComitatoEditor();
}

function rimuoviMembro(i){
  if(ST.comitato.length<=1){alert('Deve esserci almeno 1 membro nel comitato.');return;}
  if(!confirm('Rimuovere questo membro?'))return;
  ST.comitato.splice(i,1);
  buildComitatoEditor();
}

// ══ TEXT ════════════════════════════════════════════════
const TEXT_DEFAULTS={
  brand:'SKILL-VISION',
  title:'Generatore di Preventivi Soluzioni HR',
  com:'Gruppo di Lavoro — Comitato Scientifico Accademico',
  comsub:'Tutti i dati, le elaborazioni e le valutazioni sono prodotti e certificati da un team di specialisti internazionali',
  khm:'HR Generalist — SESSIONI INCLUSE di 7 ore (non continuative)',
  shea:'Senior HR Executive Advisor — SESSIONI INCLUSE di 6 ore (non continuative)',
  footer:'Preventivo SKILL-VISION',
  ahnote:'Aggiungi ore di consulenza extra oltre alle sessioni incluse. Il costo viene aggiunto automaticamente al preventivo finale.',
  ahrateHr:'Tariffa: € 55 / ora',
  ahrateShea:'Tariffa: € 120 / ora',
  footerName:'SKILL-VISION',
  footerWeb:'https://skill-vision.it',
  footerEmail:'info@skill-vision.it',
  footerPhone:'+39 333 331 2251',
  footerLinkedin:'https://www.linkedin.com/company/71681797',
  footerCta:'Transform people data into strategic decisions'
};
function loadTestiInputs(){
  const t={...TEXT_DEFAULTS,...(ST.texts||{})};
  const map={'txt-brand':'brand','txt-title':'title','txt-com':'com','txt-comsub':'comsub','txt-khm':'khm','txt-shea':'shea','txt-footer':'footer','txt-ahnote':'ahnote','txt-ahrate-hr':'ahrateHr','txt-ahrate-shea':'ahrateShea','txt-footer-name':'footerName','txt-footer-web':'footerWeb','txt-footer-email':'footerEmail','txt-footer-phone':'footerPhone','txt-footer-linkedin':'footerLinkedin','txt-footer-cta':'footerCta'};
  Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.value=t[key];});
}
function applyTexts(){
  const t={...TEXT_DEFAULTS,...(ST.texts||{})};
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
  const setNowrapTail=(id,val)=>{
    const el=document.getElementById(id);if(!el)return;
    const m=val.match(/^(.*)(\([^()]*\))\s*$/);
    if(m){el.textContent='';el.append(m[1],Object.assign(document.createElement('span'),{style:'white-space:nowrap',textContent:m[2]}));}
    else el.textContent=val;
  };
  set('pt-title',t.title);
  set('com-title-display','⚗️ '+t.com);
  set('com-sub-display',t.comsub);
  setNowrapTail('sc-lbl-khm',t.khm);
  setNowrapTail('sc-lbl-shea',t.shea);
  set('ah-note-txt',t.ahnote);
  set('ah-rate-hr-txt',t.ahrateHr);
  set('ah-rate-shea-txt',t.ahrateShea);
  set('footer-company-name',t.footerName);
  set('footer-phone',t.footerPhone);
  set('footer-cta',t.footerCta);
  const web=document.getElementById('footer-website');if(web){web.textContent='🌐 '+t.footerWeb.replace(/^https?:\/\//,'');web.href=t.footerWeb;}
  const em=document.getElementById('footer-email');if(em){em.textContent='📧 '+t.footerEmail;em.href='mailto:'+t.footerEmail;}
  const li=document.getElementById('footer-linkedin');if(li){li.href=t.footerLinkedin;}
}
function saveTesti(){
  ST.texts={
    brand:document.getElementById('txt-brand').value,
    title:document.getElementById('txt-title').value,
    com:document.getElementById('txt-com').value,
    comsub:document.getElementById('txt-comsub').value,
    khm:document.getElementById('txt-khm').value,
    shea:document.getElementById('txt-shea').value,
    footer:document.getElementById('txt-footer').value,
    ahnote:document.getElementById('txt-ahnote').value,
    ahrateHr:document.getElementById('txt-ahrate-hr').value,
    ahrateShea:document.getElementById('txt-ahrate-shea').value,
    footerName:document.getElementById('txt-footer-name').value,
    footerWeb:document.getElementById('txt-footer-web').value,
    footerEmail:document.getElementById('txt-footer-email').value,
    footerPhone:document.getElementById('txt-footer-phone').value,
    footerLinkedin:document.getElementById('txt-footer-linkedin').value,
    footerCta:document.getElementById('txt-footer-cta').value,
  };
  applyTexts();
  save();notify('✅ Testi salvati e applicati!');
}

// ══ EMAIL (EmailJS) ═══════════════════════════════════════
function loadEmailConfigInputs(){
  const cfg=ST.emailConfig||{};
  const el=(id)=>document.getElementById(id);
  if(el('txt-ej-service'))el('txt-ej-service').value=cfg.serviceId||'';
  if(el('txt-ej-template'))el('txt-ej-template').value=cfg.templateId||'';
  if(el('txt-ej-publickey'))el('txt-ej-publickey').value=cfg.publicKey||'';
}
function saveEmailConfig(){
  ST.emailConfig={
    serviceId:document.getElementById('txt-ej-service').value.trim(),
    templateId:document.getElementById('txt-ej-template').value.trim(),
    publicKey:document.getElementById('txt-ej-publickey').value.trim(),
  };
  save();
  if(ST.emailConfig.serviceId&&ST.emailConfig.templateId&&ST.emailConfig.publicKey){
    notify('✅ Configurazione email salvata! L\'invio automatico è ora attivo.');
  }else{
    notify('✅ Configurazione salvata (incompleta — invio automatico resta disattivo finché non compili tutti e 3 i campi).');
  }
}
function isEmailConfigured(){
  const c=ST.emailConfig;
  return !!(c&&c.serviceId&&c.templateId&&c.publicKey);
}
async function sendViaEmailJS(toEmail,subject,message,extraParams){
  if(typeof emailjs==='undefined')throw new Error('EmailJS SDK non caricato (controlla la connessione internet)');
  const c=ST.emailConfig;
  emailjs.init({publicKey:c.publicKey});
  return emailjs.send(c.serviceId,c.templateId,{
    to_email:toEmail,
    subject:subject,
    message:message,
    ...extraParams,
  });
}
async function testEmailConfig(){
  saveEmailConfig();
  if(!isEmailConfigured()){alert('Compila tutti e 3 i campi (Service ID, Template ID, Public Key) prima di testare.');return;}
  const testAddr=prompt('A quale indirizzo email vuoi inviare il messaggio di prova?','');
  if(!testAddr)return;
  try{
    await sendViaEmailJS(testAddr,'Test SKILL-VISION','Questa è un test dal pannello Admin. Se la ricevi, la configurazione EmailJS funziona correttamente.',{client_name:'Test',quote_total:'€ 0'});
    notify('✅ Email di prova inviata a '+testAddr+'!');
  }catch(e){
    console.error(e);
    notify('❌ Invio fallito: '+(e.text||e.message||'errore sconosciuto'),true);
  }
}

// ══ COLORS ═══════════════════════════════════════════════
function saveColori(){
  const m={g:'--g',b:'--b',p:'--p',am:'--am'};
  Object.entries(m).forEach(([k,v])=>{const h=document.getElementById('col-'+k+'-h').value;document.documentElement.style.setProperty(v,h);});
  save();notify('✅ Colori applicati in tempo reale!');
}

const CLIENT_COLOR_DEFAULTS={qsbg:'#1B1A17'};
function applyClientColors(){
  const cc={...CLIENT_COLOR_DEFAULTS,...(ST.clientColors||{})};
  document.documentElement.style.setProperty('--qsbg',cc.qsbg);
}
function loadClientColorInputs(){
  const cc={...CLIENT_COLOR_DEFAULTS,...(ST.clientColors||{})};
  ['qsbg'].forEach(k=>{
    const ci=document.getElementById('col-'+k),hi=document.getElementById('col-'+k+'-h');
    if(ci)ci.value=cc[k];if(hi)hi.value=cc[k];
  });
}
function saveClientColors(){
  ST.clientColors={
    qsbg:document.getElementById('col-qsbg-h').value,
  };
  applyClientColors();save();notify('✅ Colori applicati!');
}
function resetClientColors(){
  ST.clientColors={...CLIENT_COLOR_DEFAULTS};
  applyClientColors();loadClientColorInputs();save();notify('✅ Colori ripristinati.');
}

const PALETTE_VARS={dk:'--dk',c1:'--c1',c2:'--c2',br:'--br'};
const PALETTE_DEFAULTS={
  light:{dk:'#FFFCE0',c1:'#FFFEF5',c2:'#FAF5DF',br:'#EEEADA'},
  dark:{dk:'#0D0C0A',c1:'#1B1A17',c2:'#2B2926',br:'#45433C'}
};
function getStyleSheetRule(sel){
  for(const sheet of document.styleSheets){
    try{for(const rule of sheet.cssRules){if(rule.selectorText===sel)return rule;}}catch(e){}
  }
  return null;
}
function applyPalette(theme,pal){
  const rule=getStyleSheetRule(theme==='light'?'body.light-theme':':root');
  if(!rule)return;
  Object.entries(PALETTE_VARS).forEach(([k,cssVar])=>{
    if(pal[k])rule.style.setProperty(cssVar,pal[k]);
  });
}
function readPaletteInputs(theme){
  const prefix=theme==='light'?'lt':'dk';
  const pal={};
  Object.keys(PALETTE_VARS).forEach(k=>{
    const el=document.getElementById('col-'+prefix+'-'+k+'-h');
    if(el)pal[k]=el.value;
  });
  return pal;
}
function loadPaletteInputs(){
  ['light','dark'].forEach(theme=>{
    const prefix=theme==='light'?'lt':'dk';
    const pal=(ST.palette&&ST.palette[theme])||PALETTE_DEFAULTS[theme];
    Object.keys(PALETTE_VARS).forEach(k=>{
      const ci=document.getElementById('col-'+prefix+'-'+k),hi=document.getElementById('col-'+prefix+'-'+k+'-h');
      if(ci&&pal[k])ci.value=pal[k];
      if(hi&&pal[k])hi.value=pal[k];
    });
  });
}
function saveLightPalette(){
  const pal=readPaletteInputs('light');
  ST.palette=ST.palette||{};ST.palette.light=pal;
  applyPalette('light',pal);
  save();notify('✅ Sfondo tema chiaro applicato!');
}
function saveDarkPalette(){
  const pal=readPaletteInputs('dark');
  ST.palette=ST.palette||{};ST.palette.dark=pal;
  applyPalette('dark',pal);
  save();notify('✅ Sfondo tema scuro applicato!');
}
function resetLightPalette(){
  ST.palette=ST.palette||{};ST.palette.light={...PALETTE_DEFAULTS.light};
  applyPalette('light',ST.palette.light);
  loadPaletteInputs();save();notify('✅ Sfondo chiaro ripristinato al predefinito.');
}
function resetDarkPalette(){
  ST.palette=ST.palette||{};ST.palette.dark={...PALETTE_DEFAULTS.dark};
  applyPalette('dark',ST.palette.dark);
  loadPaletteInputs();save();notify('✅ Sfondo scuro ripristinato.');
}
function applySavedPalettes(){
  if(ST.palette){
    if(ST.palette.light)applyPalette('light',ST.palette.light);
    if(ST.palette.dark)applyPalette('dark',ST.palette.dark);
  }
}
applySavedPalettes();
applyTexts();
applyClientColors();

// ══ USERS ═══════════════════════════════════════════════
const RCOL={superadmin:'#B4C614',admin:'#2AA5B0',operatore:'#6A4FA3'};
const RLBL={superadmin:'Super Admin',admin:'Admin',operatore:'Operatore'};
function buildUsers(){
  document.getElementById('users-list').innerHTML=ST.users.map((u,i)=>`
    <div class="uc">
      <div class="u-av" style="width:38px;height:38px;border-radius:50%;background:${RCOL[u.role]||"#767369"};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0">${u.name.charAt(0)}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--tx)">${u.name} <code style="font-size:10px;color:var(--tx3)">@${u.user}</code></div>
      <div style="font-size:11px;color:var(--tx2)">${RLBL[u.role]} · ${u.email} · <span class="chip ${u.stato==='attivo'?'cg':'cr'}" style="font-size:9px">${u.stato==='attivo'?'attivo':'sospeso'}</span></div></div>
      <button class="btn btn-ghost" style="padding:5px 10px;font-size:11px" onclick="openEditUser(${i})">✎ Modifica</button>
      <button class="btn btn-ghost" style="padding:5px 10px;font-size:11px" onclick="toggleUser(${i})">${u.stato==='attivo'?'Sospendi':'Attiva'}</button>
      ${i>0?`<button class="btn btn-rd" style="padding:5px 10px;font-size:11px;margin-left:4px" onclick="delUser(${i})">🗑</button>`:''}
    </div>`).join('');
}
let U_EDIT_IDX=null;
function openNewUser(){
  if(!ST.cu||ST.cu.role!=='superadmin'){notify('❌ Solo il Super Admin può gestire gli utenti.',true);return;}
  U_EDIT_IDX=null;
  document.getElementById('u-modal-title').textContent='👤 Nuovo utente';
  document.getElementById('u-name').value='';
  document.getElementById('u-user').value='';
  document.getElementById('u-pass').value='';
  document.getElementById('u-email').value='';
  document.getElementById('u-role').value='operatore';
  document.getElementById('u-stato').value='attivo';
  document.getElementById('u-pass-hint').style.display='none';
  document.getElementById('u-save-btn').textContent='💾 Salva';
  document.getElementById('modal-user').classList.add('on');
}
function openEditUser(i){
  if(!ST.cu||ST.cu.role!=='superadmin'){notify('❌ Solo il Super Admin può gestire gli utenti.',true);return;}
  U_EDIT_IDX=i;
  const u=ST.users[i];
  document.getElementById('u-modal-title').textContent='✎ Modifica utente — '+u.name;
  document.getElementById('u-name').value=u.name;
  document.getElementById('u-user').value=u.user;
  document.getElementById('u-pass').value='';
  document.getElementById('u-email').value=u.email;
  document.getElementById('u-role').value=u.role;
  document.getElementById('u-stato').value=u.stato;
  document.getElementById('u-pass-hint').style.display='inline';
  document.getElementById('u-save-btn').textContent='💾 Aggiorna';
  document.getElementById('modal-user').classList.add('on');
}
function toggleUser(i){if(!ST.cu||ST.cu.role!=='superadmin'){notify('❌ Solo il Super Admin può gestire gli utenti.',true);return;}ST.users[i].stato=ST.users[i].stato==='attivo'?'sospeso':'attivo';save();buildUsers();notify('Utente aggiornato.');}
function delUser(i){if(!ST.cu||ST.cu.role!=='superadmin'){notify('❌ Solo il Super Admin può gestire gli utenti.',true);return;}if(!confirm('Eliminare l\'utente '+ST.users[i].name+'?'))return;ST.users.splice(i,1);save();buildUsers();notify('Utente eliminato.');}
function saveUser(){
  if(!ST.cu||ST.cu.role!=='superadmin'){notify('❌ Solo il Super Admin può creare utenti.',true);return;}
  const name=document.getElementById('u-name').value.trim();
  const user=document.getElementById('u-user').value.trim();
  const pass=document.getElementById('u-pass').value.trim();
  const email=document.getElementById('u-email').value.trim();
  const role=document.getElementById('u-role').value;
  const stato=document.getElementById('u-stato').value;
  if(U_EDIT_IDX===null){
    if(!name||!user||!pass){alert('Compila tutti i campi obbligatori.');return;}
    if(ST.users.find(u=>u.user===user)){alert('Nome utente già in uso.');return;}
    ST.users.push({name,user,pass,email,role,stato});
    save();closeModals();buildUsers();notify('✅ Utente '+name+' creato!');
  }else{
    if(!name||!user){alert('Compila tutti i campi obbligatori.');return;}
    if(ST.users.find((u,idx)=>u.user===user&&idx!==U_EDIT_IDX)){alert('Nome utente già in uso.');return;}
    const u=ST.users[U_EDIT_IDX];
    u.name=name;u.user=user;u.email=email;u.role=role;u.stato=stato;
    if(pass)u.pass=pass;
    save();closeModals();buildUsers();notify('✅ Utente '+name+' aggiornato! Codice di accesso '+(pass?'modificato.':'invariato.'));
  }
}

// ══ EXPORT ═══════════════════════════════════════════════
function getMyPrev(){return ST.cu.role==='superadmin'?ST.preventivi:ST.preventivi.filter(p=>p.op===ST.cu.name);}
function exportCSV(){
  const h=['ID','Cliente','Settore','Referente','Email','Dipendenti','Durata','Soluzione','Codice','Totale €','Data','Operatore'];
  const rows=getMyPrev().map(p=>[p.id,p.rag,p.settore,p.ref,p.email,p.dip,p.dur,p.sol,p.cod,p.totale,p.data,p.op]);
  const csv=[h,...rows].map(r=>r.map(v=>'"'+(v||'').toString().replace(/"/g,'""')+'"').join(',')).join('\n');
  dl('sv_quotes_'+today().replace(/\//g,'-')+'.csv','text/csv','\uFEFF'+csv);notify('✅ CSV scaricato!');
}
function exportXLS(){
  const h=['ID','Cliente','Settore','Referente','Email','Dipendenti','Durata','Soluzione','Codice','Totale €','Data','Operatore'];
  const rows=getMyPrev().map(p=>[p.id,p.rag,p.settore,p.ref,p.email,p.dip,p.dur,p.sol,p.cod,p.totale,p.data,p.op]);
  const xml=`<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Quotes"><Table>${[h,...rows].map(r=>`<Row>${r.map(v=>`<Cell><Data ss:Type="${typeof v==='number'?'Number':'String'}">${v||''}</Data></Cell>`).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`;
  dl('sv_quotes_'+today().replace(/\//g,'-')+'.xls','application/vnd.ms-excel',xml);notify('✅ Excel scaricato!');
}
function exportConfig(){
  const cfg=JSON.stringify({fasce:ST.fasce,sessKHM:ST.sessKHM,sessSHEA:ST.sessSHEA,codici:ST.codici,scontiDur:ST.scontiDur,comitato:ST.comitato},null,2);
  dl('sv_config_'+today().replace(/\//g,'-')+'.json','application/json',cfg);notify('✅ Configurazione esportata!');
}
function importConfig(e){
  const file=e.target.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=ev=>{
    try{
      const cfg=JSON.parse(ev.target.result);
      if(cfg.fasce)ST.fasce=cfg.fasce;if(cfg.sessKHM)ST.sessKHM=cfg.sessKHM;
      if(cfg.sessSHEA)ST.sessSHEA=cfg.sessSHEA;if(cfg.codici)ST.codici=cfg.codici;
      if(cfg.scontiDur)ST.scontiDur=cfg.scontiDur;if(cfg.comitato)ST.comitato=cfg.comitato;
      save();notify('✅ Configurazione importata con successo!');
    }catch{notify('❌ File JSON non valido.',true);}
  };r.readAsText(file);
}

// ══ QUOTE TOOL ════════════════════════════════════════════
function setMode(m){
  ST.prevMode=m;
  ['a','ab','abc'].forEach(k=>{
    const rd=document.getElementById('radio-'+k);
    const opt=document.getElementById('opt-'+k);
    const dot=rd.querySelector('.sel-dot');
    rd.className='sel-rd';opt.className='sel-opt';dot.style.display='none';
    if(k===m){rd.classList.add('chk-'+m);opt.classList.add('act-'+m);dot.style.display='block';}
  });
  calcola();
}

function calcola(){
  const n=parseInt(document.getElementById('num-dip').value)||0;
  const dur=parseInt(document.getElementById('durata').value)||12;
  const cod=document.getElementById('codice-op').value.trim().toUpperCase();
  const {i,f}=getFascia(n);
  const fd=document.getElementById('fdisplay'),nf=document.getElementById('notafascia');

  document.getElementById('rie-cliente').textContent=document.getElementById('rag-soc').value||'—';
  document.getElementById('rie-settore').textContent=document.getElementById('settore').value||'—';
  document.getElementById('rie-ref').textContent=document.getElementById('nome-ref').value||'—';
  document.getElementById('rie-email').textContent=document.getElementById('email-ref').value||'—';
  document.getElementById('data-prev').textContent=today();

  if(!f){fd.textContent='Fascia: 450+ — preventivo personalizzato richiesto';fd.style.background='#FBEED0';fd.style.color='#8A5107';nf.style.display='block';clearCalc();return;}
  fd.textContent='Fascia: '+f.label+' dip. · '+fmtD(f.costo)+'/dip/mese';fd.style.background='#EEF6D0';fd.style.color='#565D05';nf.style.display='none';

  const sH=ST.sessKHM[i]??'—',sF=ST.sessSHEA[i]??'—';
  const chkHR=document.getElementById('chk-sess-hr').checked;
  const chkFrac=document.getElementById('chk-sess-frac').checked;
  document.getElementById('sess-hr').textContent=chkHR?sH:'—';
  document.getElementById('sess-frac').textContent=chkFrac?sF:'—';
  const sHu=(chkHR&&typeof sH==='number')?sH:0;
  const sFu=(chkFrac&&typeof sF==='number')?sF:0;
  document.getElementById('rie-sess').textContent=(chkHR||chkFrac)?sHu+sFu:'—';
  document.getElementById('rie-sess-hr').textContent=chkHR?sH+' sessioni HR Generalist':'Non incluso';
  document.getElementById('rie-sess-frac').textContent=chkFrac?sF+' sessioni Senior HR Executive Advisor':'Non incluso';

  const codObj=ST.codici.find(x=>x.cod===cod&&x.attivo);
  const stEl=document.getElementById('cod-st'),rowSc=document.getElementById('row-sconto');
  if(!cod){stEl.textContent='Nessun codice';stEl.className='cod-st cod-emp';rowSc.style.display='none';}
  else if(codObj){stEl.textContent='✓ Sconto –'+codObj.pct+'% applicato';stEl.className='cod-st cod-ok';rowSc.style.display='flex';}
  else{stEl.textContent='✗ Codice non valido';stEl.className='cod-st cod-err';rowSc.style.display='none';}

  const sc=(ST.scontiDur[dur]||0)/100;
  const bA=f.costo*n,bB=bA*0.58,bC=bA*0.25;
  const Am=bA*(1-sc),Bm=bB*(1-sc),Cm=bC*(1-sc);
  const At=Am*dur,Bt=Bm*dur,Ct=Cm*dur;
  const inclB=ST.prevMode==='ab'||ST.prevMode==='abc',inclC=ST.prevMode==='abc';
  const subSol=At+(inclB?Bt:0)+(inclC?Ct:0);

  const ahHr=Math.max(0,parseInt(document.getElementById('ah-hr').value)||0);
  const ahShea=Math.max(0,parseInt(document.getElementById('ah-shea').value)||0);
  const ahHrCost=ahHr*55,ahSheaCost=ahShea*120,ahTotal=ahHrCost+ahSheaCost;
  document.getElementById('ah-hr-sub').textContent=fmt(ahHrCost);
  document.getElementById('ah-shea-sub').textContent=fmt(ahSheaCost);
  document.getElementById('ah-total').textContent=fmt(ahTotal);
  document.getElementById('rie-ah').textContent=ahTotal>0?fmt(ahTotal)+' ('+ahHr+'h HR Generalist + '+ahShea+'h Senior Advisor)':'Non aggiunto';

  const scoVal=codObj?subSol*(codObj.pct/100):0;
  const totSol=subSol-scoVal+ahTotal,perdip=n>0?(totSol/dur)/n:0;

  document.getElementById('prev-a').textContent=fmt(At);
  document.getElementById('prev-ab').textContent=fmt(At+Bt);
  document.getElementById('prev-abc').textContent=fmt(At+Bt+Ct);

  // Card A
  document.getElementById('card-a').className='sol-c sc-a act';
  document.getElementById('pA-m').innerHTML=fmt(Am)+'<span>/month</span>';
  document.getElementById('pA-a').textContent=dur>1?fmt(At)+' per '+dur+' mesi':'';
  document.getElementById('pA-u').textContent=n>0?fmtD(Am/n)+' per dipendente/mese':'';
  document.getElementById('consA').innerHTML='<strong>Sessioni incluse:</strong><br>'+(chkHR?sH+' HR Generalist SESSIONI INCLUSE di 7 ore':'HR Generalist — non selezionato')+'<br>'+(chkFrac?sF+' sessioni Senior HR Executive Advisor':'Senior HR Executive Advisor — non selezionato');

  // Card B
  if(inclB){document.getElementById('card-b').className='sol-c sc-b act';document.getElementById('not-b').style.display='none';document.getElementById('pB-m').innerHTML=fmt(Bm)+'<span>/month</span>';document.getElementById('pB-a').textContent=dur>1?fmt(Bt)+' per '+dur+' mesi':'';document.getElementById('pB-u').textContent=n>0?fmtD(Bm/n)+' per dipendente/mese (–42% vs SV-A)':'';document.getElementById('saveB').textContent='Risparmio vs SV-A: '+fmt(bA-bB)+'/mese (–42%)';}
  else{document.getElementById('card-b').className='sol-c sc-b inact';document.getElementById('not-b').style.display='block';['pB-m','pB-a','pB-u','saveB'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='';});document.getElementById('pB-m').innerHTML='<span style="font-size:13px;color:#767369">Non incluso</span>';}

  // Card C
  if(inclC){document.getElementById('card-c').className='sol-c sc-c act';document.getElementById('not-c').style.display='none';document.getElementById('pC-m').innerHTML=fmt(Cm)+'<span>/month</span>';document.getElementById('pC-a').textContent=dur>1?fmt(Ct)+' per '+dur+' mesi':'';document.getElementById('pC-u').textContent=n>0?fmtD(Cm/n)+' per dipendente/mese (–75% vs SV-A)':'';document.getElementById('saveC').textContent='Risparmio vs SV-A: '+fmt(bA-bC)+'/mese (–75%)';}
  else{document.getElementById('card-c').className='sol-c sc-c inact';document.getElementById('not-c').style.display='block';['pC-m','pC-a','pC-u','saveC'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='';});document.getElementById('pC-m').innerHTML='<span style="font-size:13px;color:#767369">Non incluso</span>';}

  // Summary
  const durL=dur===1?'Mensile':dur===6?'Semestrale':'Annuale';
  const scL=dur===1?'nessuno sconto':dur===6?'–5% incluso':'–10% incluso';
  document.getElementById('rie-dip').textContent=n;document.getElementById('rie-fascia').textContent=f.label+' dip.';
  document.getElementById('rie-dur').textContent=durL;document.getElementById('rie-sc-lbl').textContent=scL;
  document.getElementById('rie-a').textContent=dur===1?fmt(Am)+'/mese':fmt(At);
  document.getElementById('rie-b').textContent=inclB?(dur===1?fmt(Bm)+'/mese':fmt(Bt)):'Non incluso';
  document.getElementById('rie-c').textContent=inclC?(dur===1?fmt(Cm)+'/mese':fmt(Ct)):'Non incluso';
  if(codObj){document.getElementById('sconto-lbl').textContent='Sconto operatore –'+codObj.pct+'% ('+cod+')';document.getElementById('rie-sconto-val').textContent='–'+fmt(scoVal);}
  document.getElementById('rie-total').textContent=fmt(totSol);
  document.getElementById('rie-perdip').textContent=n>0?fmtD(perdip)+'/dip/mese':'—';
  document.getElementById('row-b').className='rie-row'+(inclB?'':' inact');
  document.getElementById('row-c').className='rie-row'+(inclC?'':' inact');
}

function clearCalc(){['pA-m','pA-a','pA-u','pB-m','pB-a','pB-u','pC-m','pC-a','pC-u','rie-total','rie-perdip','prev-a','prev-ab','prev-abc','ah-hr-sub','ah-shea-sub','ah-total','rie-ah'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='—';});}

function salvaPrev(){
  const rag=document.getElementById('rag-soc').value.trim();
  if(!rag){alert('Inserisci la ragione sociale del cliente.');return;}
  const n=parseInt(document.getElementById('num-dip').value)||0;
  const dur=parseInt(document.getElementById('durata').value)||12;
  const cod=document.getElementById('codice-op').value.trim().toUpperCase();
  const ahHr=Math.max(0,parseInt(document.getElementById('ah-hr').value)||0);
  const ahShea=Math.max(0,parseInt(document.getElementById('ah-shea').value)||0);
  const tot=calcTot(n,dur,ST.prevMode,cod)+ahHr*55+ahShea*120;

  if(ST.editingId){
    if(!ST.cu||ST.cu.role==='operatore'){notify('❌ Non hai i permessi per modificare i preventivi.',true);return;}
    const idx=ST.preventivi.findIndex(p=>p.id===ST.editingId);
    if(idx>-1){
      const prev=ST.preventivi[idx];
      ST.preventivi[idx]={...prev,rag,settore:document.getElementById('settore').value,
        ref:document.getElementById('nome-ref').value,email:document.getElementById('email-ref').value,
        dip:n,dur,sol:ST.prevMode,cod,totale:tot,data:today()};
      const co=ST.codici.find(x=>x.cod===cod&&x.attivo);if(co)co.usi++;
      save();notify('✅ Preventivo #'+ST.editingId+' aggiornato: '+fmt(tot));
      ST.editingId=null;
      document.getElementById('edit-banner').style.display='none';
      return;
    }
  }

  const id=Math.max(0,...ST.preventivi.map(p=>p.id))+1;
  ST.preventivi.unshift({
    id,rag,settore:document.getElementById('settore').value,
    ref:document.getElementById('nome-ref').value,email:document.getElementById('email-ref').value,
    dip:n,dur,sol:ST.prevMode,cod,totale:tot,data:today(),
    op:ST.cu?ST.cu.name:'—',note:''
  });
  // Update code usage
  const co=ST.codici.find(x=>x.cod===cod&&x.attivo);if(co)co.usi++;
  save();notify('✅ Preventivo salvato: '+fmt(tot)+' — lo trovi in Admin > Preventivi');
}

function resetPrev(){
  document.getElementById('rag-soc').value='';document.getElementById('settore').value='';
  document.getElementById('nome-ref').value='';document.getElementById('email-ref').value='';
  document.getElementById('num-dip').value=80;document.getElementById('durata').value=12;
  document.getElementById('codice-op').value='';
  document.getElementById('ah-hr').value=0;document.getElementById('ah-shea').value=0;
  document.getElementById('chk-sess-hr').checked=false;document.getElementById('chk-sess-frac').checked=false;
  ST.editingId=null;
  document.getElementById('edit-banner').style.display='none';
  setMode('a');calcola();
}

// (share-link feature removed per client request)

// ══ PDF EXPORT / SHARE ═════════════════════════════════════
function quoteFileName(){
  const rag=(document.getElementById('rag-soc').value||'Client').trim().replace(/[^a-z0-9]+/gi,'_');
  return 'SkillVision_Quote_'+rag+'_'+today().replace(/\//g,'-')+'.pdf';
}

async function buildQuotePdf(){
  if(typeof html2canvas==='undefined'||!window.jspdf)throw new Error('Librerie PDF non caricate');
  const el=document.getElementById('quote-capture');
  const canvas=await html2canvas(el,{scale:2,useCORS:true,backgroundColor:"#FFFEF5"});
  const imgData=canvas.toDataURL('image/png');
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF('p','pt','a4');
  const pageW=pdf.internal.pageSize.getWidth();
  const pageH=pdf.internal.pageSize.getHeight();
  const imgW=pageW;
  const imgH=canvas.height*imgW/canvas.width;
  let heightLeft=imgH,position=0;
  pdf.addImage(imgData,'PNG',0,position,imgW,imgH);
  heightLeft-=pageH;
  while(heightLeft>0){
    position=heightLeft-imgH;
    pdf.addPage();
    pdf.addImage(imgData,'PNG',0,position,imgW,imgH);
    heightLeft-=pageH;
  }
  return pdf;
}

async function downloadPDF(){
  const btn=document.getElementById('btn-dl-pdf');
  if(btn){btn.disabled=true;btn.textContent='⏳ Generazione...';}
  try{
    const pdf=await buildQuotePdf();
    pdf.save(quoteFileName());
    notify('✅ PDF scaricato!');
  }catch(e){
    console.error(e);
    notify('❌ Impossibile generare il PDF. Controlla la connessione e riprova.',true);
  }finally{
    if(btn){btn.disabled=false;btn.textContent='⬇️ Scarica PDF';}
  }
}

async function emailQuote(){
  const btn=document.getElementById('btn-email-pdf');
  if(btn){btn.disabled=true;btn.textContent='⏳ Preparazione...';}
  const rag=document.getElementById('rag-soc').value||'il cliente';
  const email=document.getElementById('email-ref').value||'';
  const tot=document.getElementById('rie-total').textContent;
  const subject='Preventivo SKILL-VISION per '+rag;
  const body='Salve,\n\nIn allegato il preventivo SKILL-VISION per '+rag+'.\nTotale: '+tot+'\n\nCordiali saluti.';
  try{
    if(isEmailConfigured()){
      if(!email){notify('❌ Inserisci l\'email del referente prima di inviare.',true);return;}
      const sol=document.getElementById('rie-fascia')?document.getElementById('rie-fascia').textContent:'';
      const detailMsg='Gentile referente di '+rag+',\n\nIn allegato il riepilogo del preventivo SKILL-VISION richiesto.\n\nFascia dipendenti: '+sol+'\nTotale: '+tot+'\n\nPer qualsiasi domanda restiamo a disposizione.\n\nCordiali saluti,\nSKILL-VISION';
      await sendViaEmailJS(email,subject,detailMsg,{client_name:rag,quote_total:tot});
      notify('✅ Email inviata a '+email+'!');
    }else{
      const pdf=await buildQuotePdf();
      const filename=quoteFileName();
      const blob=pdf.output('blob');
      if(navigator.canShare&&navigator.share&&(()=>{try{return navigator.canShare({files:[new File([blob],filename,{type:'application/pdf'})]});}catch{return false;}})()){
        const file=new File([blob],filename,{type:'application/pdf'});
        await navigator.share({files:[file],title:subject,text:body});
        notify('✅ Preventivo condiviso!');
      }else{
        pdf.save(filename);
        const mailto='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body+'\n\n(Allega il PDF scaricato "'+filename+'" prima di inviare.)');
        window.location.href=mailto;
        notify('📄 PDF scaricato — allegalo all\'email appena aperta. (Suggerimento: configura EmailJS in Admin → Testi per inviare automaticamente senza passaggi manuali.)');
      }
    }
  }catch(e){
    console.error(e);
    notify('❌ Impossibile inviare l\'email. Controlla la connessione e riprova.',true);
  }finally{
    if(btn){btn.disabled=false;btn.textContent='✉️ Invia per email';}
  }
}

// ══ LOADER HIDE ════════════════════════════════════════════
(function(){
  function hideLoader(){
    const el=document.getElementById('app-loader');
    if(el)el.classList.add('hide');
  }
  if(document.readyState==='complete'){hideLoader();}
  else{window.addEventListener('load',hideLoader);}
  // safety net in case 'load' never fires (e.g. slow external assets)
  setTimeout(hideLoader,4000);
})();

/* ================================================================
   SPA EMBED HOOK — added by the unified Skill Vision dashboard.
   When this module is loaded inside the SPA shell (index.html) via
   an <iframe ...?embedded=1>, the shell owns login + the top-level
   module switcher, so we bypass this module's own login screen and
   relay logout / theme requests to the parent window.
   Stand-alone use of modules/recruiting.html is unaffected.
   ================================================================ */
(function(){
  var EMBEDDED = new URLSearchParams(location.search).get('embedded') === '1';
  if(!EMBEDDED) return;
  document.body.classList.add('sv-embedded');

  function bootEmbedded(){
    var loginScreen = document.getElementById('screen-login');
    if(loginScreen) loginScreen.style.display = 'none';
    // Sign in silently as the first active user (shell already authenticated the operator).
    if(!ST.cu){
      ST.cu = ST.users.find(function(u){ return u.stato === 'attivo'; }) || ST.users[0];
    }
    // Apply any persisted Global System Settings up-front to avoid a light->dark flash.
    try{
      var raw = localStorage.getItem('sv_global_settings');
      if(raw) applyGlobalSettings(JSON.parse(raw));
    }catch(e){}
    if(typeof showPrev === 'function') showPrev();
    var loader = document.getElementById('app-loader');
    if(loader) loader.classList.add('hide');
    try{ parent.postMessage({ source:'sv-module', module:'recruiting', type:'ready' }, '*'); }catch(e){}
  }

  // The module's own inline script has already executed by the time this hook runs
  // (both are in this file), so the DOM and ST are ready.
  bootEmbedded();

  function shade(hex, amt){
    hex = String(hex||'').replace('#','');
    if(hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    if(hex.length !== 6) return '#'+hex;
    var n = [0,2,4].map(function(i){ return parseInt(hex.substr(i,2),16); });
    n = n.map(function(v){ v = amt < 0 ? v*(1+amt) : v+(255-v)*amt; return Math.max(0,Math.min(255,Math.round(v))); });
    return '#'+n.map(function(v){ return ('0'+v.toString(16)).slice(-2); }).join('');
  }

  // Apply a Global System Settings snapshot from the shell — theme, brand
  // colour, company name and surfaces — then repaint the current view.
  function applyGlobalSettings(s){
    if(!s) return;
    var rootStyle = document.documentElement.style;
    if(s.theme && typeof applyTheme === 'function'){
      applyTheme(s.theme);
      try{ localStorage.setItem('sv_theme', s.theme); }catch(e){}
    }
    if(s.accent){
      rootStyle.setProperty('--g', s.accent);
      rootStyle.setProperty('--g2', shade(s.accent, -0.18));
    }
    if(s.surface){ rootStyle.setProperty('--c1', s.surface); rootStyle.setProperty('--c2', shade(s.surface, 0.06)); }
    if(s.bg){ rootStyle.setProperty('--dk', s.bg); }
    if(s.companyName){
      ST.texts = Object.assign({}, ST.texts || {}, { footerName: s.companyName });
      if(typeof applyTexts === 'function') applyTexts();
      var footer = document.getElementById('footer-company-name');
      if(footer) footer.textContent = s.companyName;
    }
    window.SV_SCORING = s.scoring || window.SV_SCORING;
    if(typeof calcola === 'function'){ try{ calcola(); }catch(e){} }
  }

  // Parent -> module messages.
  window.addEventListener('message', function(ev){
    var d = ev.data || {};
    if(d.source !== 'sv-shell') return;
    if(d.type === 'theme' && typeof applyTheme === 'function') applyTheme(d.mode);
    if(d.type === 'settings') applyGlobalSettings(d.settings);
    if(d.type === 'activate'){
      // module just became visible again — recompute the live quote view
      if(typeof calcola === 'function'){ try{ calcola(); }catch(e){} }
      if(typeof renderComitato === 'function'){ try{ renderComitato(); }catch(e){} }
    }
    if(d.type === 'navigate'){
      if(d.page === 'preventivatore'){ showPrev(); }
      else if(typeof showAdmin === 'function'){
        showAdmin();
        if(typeof showPage === 'function') showPage(d.page);
      }
    }
  });

  // Route this module's "log out" control back to the shell.
  var _logout = window.doLogout;
  window.doLogout = function(){
    try{ parent.postMessage({ source:'sv-module', module:'recruiting', type:'logout' }, '*'); }catch(e){ if(_logout) _logout(); }
  };
})();

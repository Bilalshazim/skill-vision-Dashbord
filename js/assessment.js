/* Assessment module logic — extracted verbatim from assessment.html */
/* =========================================================================
   SKILL-VISION — COMPETENCY ASSESSMENT (HR Decision Dashboard)
   Module A: Soft Skills (Soft Skills + Big Five)
   Module B: Hard Skills (APEX 5D — Multi-source Protocol)
   ========================================================================= */

/* ---------------------- SAFE STORAGE ----------------------
   Some browsers (notably Safari) throw a SecurityError on any localStorage/sessionStorage
   access when a page is opened directly from disk (file:// = "opaque origin"). Since this app
   calls storage synchronously at the top level during boot (theme, accent, language, login),
   one uncaught throw there would abort the entire script — including wiring up the login form's
   submit handler. safeStorage never throws: it detects a working store once, and transparently
   falls back to an in-memory-only store (data just won't survive a refresh) if storage is blocked. */
const safeStorage = (() => {
  const mem = {};
  function works(store){
    try{ const k = '__sv_probe__'; store.setItem(k, '1'); store.removeItem(k); return true; }catch(e){ return false; }
  }
  let localOk = false, sessionOk = false;
  try{ localOk = typeof localStorage !== 'undefined' && works(localStorage); }catch(e){ localOk = false; }
  try{ sessionOk = typeof sessionStorage !== 'undefined' && works(sessionStorage); }catch(e){ sessionOk = false; }
  return {
    get(key){ try{ return localOk ? localStorage.getItem(key) : (key in mem ? mem[key] : null); }catch(e){ return key in mem ? mem[key] : null; } },
    set(key, val){ try{ if(localOk){ localStorage.setItem(key, val); return; } }catch(e){} mem[key] = val; },
    remove(key){ try{ if(localOk){ localStorage.removeItem(key); return; } }catch(e){} delete mem[key]; },
    sessionGet(key){ const k = 's:'+key; try{ return sessionOk ? sessionStorage.getItem(key) : (k in mem ? mem[k] : null); }catch(e){ return k in mem ? mem[k] : null; } },
    sessionSet(key, val){ const k = 's:'+key; try{ if(sessionOk){ sessionStorage.setItem(key, val); return; } }catch(e){} mem[k] = val; },
  };
})();

/* ---------------------- THEME (light/dark) ---------------------- */
const THEME_KEY = 'sv_theme';
function applyTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  safeStorage.set(THEME_KEY, mode);
}
function toggleTheme(){
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}
function initTheme(){
  const saved = safeStorage.get(THEME_KEY);
  applyTheme(saved || 'light');
}
initTheme();

/* ---------------------- SETTINGS: custom accent color ---------------------- */
const ACCENT_KEY = 'sv_accent_custom';
const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
function hexToRgb(hex){
  hex = (hex||'').replace('#','');
  if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  const num = parseInt(hex,16) || 0;
  return { r:(num>>16)&255, g:(num>>8)&255, b:num&255 };
}
function rgbToHex(r,g,b){
  return '#' + [r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
}
function darkenColor(hex, amount=0.16){
  const {r,g,b} = hexToRgb(hex);
  return rgbToHex(r*(1-amount), g*(1-amount), b*(1-amount));
}
function toHexColor(v, fallback='#1e5eff'){
  v = (v||'').trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : fallback;
}
function mixColor(hexA, hexB, t){
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex(a.r+(b.r-a.r)*t, a.g+(b.g-a.g)*t, a.b+(b.b-a.b)*t);
}
function applyCustomAccent(hex, persist=true){
  hex = toHexColor(hex, '#1e5eff');
  const { r, g, b } = hexToRgb(hex);
  const root = document.documentElement.style;
  root.setProperty('--accent', hex);
  root.setProperty('--accent-dark', darkenColor(hex, 0.16));
  root.setProperty('--accent-soft', `rgba(${r},${g},${b},0.14)`);
  root.setProperty('--accent-soft-2', `rgba(${r},${g},${b},0.26)`);
  if(persist) safeStorage.set(ACCENT_KEY, hex);
}
function resetCustomAccent(){
  const root = document.documentElement.style;
  ['--accent','--accent-dark','--accent-soft','--accent-soft-2'].forEach(p=>root.removeProperty(p));
  safeStorage.remove(ACCENT_KEY);
}
function initCustomAccent(){
  const saved = safeStorage.get(ACCENT_KEY);
  if(saved) applyCustomAccent(saved, false);
}

/* ---------------------- SETTINGS: custom Module B (success) color ---------------------- */
const SUCCESS_KEY = 'sv_success_custom';
function applyCustomSuccess(hex, persist=true){
  hex = toHexColor(hex, '#17925b');
  const { r, g, b } = hexToRgb(hex);
  const root = document.documentElement.style;
  root.setProperty('--success', hex);
  root.setProperty('--success-dark', darkenColor(hex, 0.14));
  root.setProperty('--success-soft', `rgba(${r},${g},${b},0.16)`);
  if(persist) safeStorage.set(SUCCESS_KEY, hex);
}
function resetCustomSuccess(){
  const root = document.documentElement.style;
  ['--success','--success-dark','--success-soft'].forEach(p=>root.removeProperty(p));
  safeStorage.remove(SUCCESS_KEY);
}
function initCustomSuccess(){
  const saved = safeStorage.get(SUCCESS_KEY);
  if(saved) applyCustomSuccess(saved, false);
}

/* ---------------------- SETTINGS: module color sync (A & B share one color) ---------------------- */
const MODULE_SYNC_KEY = 'sv_module_sync';
function isModuleColorSynced(){ return safeStorage.get(MODULE_SYNC_KEY) === '1'; }

function lightenColor(hex, amount=0.12){
  const {r,g,b} = hexToRgb(hex);
  return rgbToHex(r+(255-r)*amount, g+(255-g)*amount, b+(255-b)*amount);
}
const BG_KEY = 'sv_bg_custom';
function applyCustomBg(hex, persist=true){
  hex = toHexColor(hex, '#f5f7fa');
  const root = document.documentElement.style;
  root.setProperty('--bg', hex);
  if(!safeStorage.get(SURFACE_KEY)){
    root.setProperty('--surface', lightenColor(hex, 0.16));
    root.setProperty('--surface-alt', lightenColor(hex, 0.08));
  }
  if(persist) safeStorage.set(BG_KEY, hex);
}
function resetCustomBg(){
  const root = document.documentElement.style;
  root.removeProperty('--bg');
  if(!safeStorage.get(SURFACE_KEY)){ ['--surface','--surface-alt'].forEach(p=>root.removeProperty(p)); }
  safeStorage.remove(BG_KEY);
}
function initCustomBg(){
  const saved = safeStorage.get(BG_KEY);
  if(saved) applyCustomBg(saved, false);
}

/* ---------------------- SETTINGS: custom card / panel color (independent of page background) ---------------------- */
const SURFACE_KEY = 'sv_surface_custom';
function applyCustomSurface(hex, persist=true){
  hex = toHexColor(hex, '#ffffff');
  const root = document.documentElement.style;
  root.setProperty('--surface', hex);
  root.setProperty('--surface-alt', mixColor(hex, toHexColor(cssVar('--bg'), '#f5f7fa'), 0.5));
  if(persist) safeStorage.set(SURFACE_KEY, hex);
}
function resetCustomSurface(){
  safeStorage.remove(SURFACE_KEY);
  const root = document.documentElement.style;
  ['--surface','--surface-alt'].forEach(p=>root.removeProperty(p));
  applyCustomBg(toHexColor(cssVar('--bg'), '#f5f7fa'), false);
}
function initCustomSurface(){
  const saved = safeStorage.get(SURFACE_KEY);
  if(saved) applyCustomSurface(saved, false);
}

/* ---------------------- SETTINGS: custom text (font) color ---------------------- */
const TEXT_KEY = 'sv_text_custom';
function applyCustomText(hex, persist=true){
  hex = toHexColor(hex, '#10192b');
  const bgHex = toHexColor(cssVar('--bg'), '#f5f7fa');
  const root = document.documentElement.style;
  root.setProperty('--text-1', hex);
  root.setProperty('--text-2', mixColor(hex, bgHex, 0.38));
  root.setProperty('--text-3', mixColor(hex, bgHex, 0.58));
  if(persist) safeStorage.set(TEXT_KEY, hex);
}
function resetCustomText(){
  const root = document.documentElement.style;
  ['--text-1','--text-2','--text-3'].forEach(p=>root.removeProperty(p));
  safeStorage.remove(TEXT_KEY);
}
function initCustomText(){
  const saved = safeStorage.get(TEXT_KEY);
  if(saved) applyCustomText(saved, false);
}

/* ---------------------- SETTINGS: interface font family ---------------------- */
const FONT_KEY = 'sv_font_custom';
const FONT_OPTIONS = [
  { id:'inter', label:'Inter (Default)', stack:"'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
  { id:'system', label:'System Default', stack:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { id:'arial', label:'Arial', stack:"Arial, 'Helvetica Neue', Helvetica, sans-serif" },
  { id:'helvetica', label:'Helvetica', stack:"'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { id:'segoe', label:'Segoe UI', stack:"'Segoe UI', Tahoma, Geneva, sans-serif" },
  { id:'roboto', label:'Roboto', stack:"Roboto, Arial, sans-serif" },
  { id:'verdana', label:'Verdana', stack:"Verdana, Geneva, sans-serif" },
  { id:'tahoma', label:'Tahoma', stack:"Tahoma, Geneva, sans-serif" },
  { id:'trebuchet', label:'Trebuchet MS', stack:"'Trebuchet MS', 'Lucida Grande', sans-serif" },
  { id:'georgia', label:'Georgia', stack:"Georgia, 'Times New Roman', serif" },
  { id:'times', label:'Times New Roman', stack:"'Times New Roman', Times, serif" },
  { id:'garamond', label:'Garamond', stack:"Garamond, Georgia, serif" },
  { id:'courier', label:'Courier New', stack:"'Courier New', Courier, monospace" },
];
function fontStack(id){ const f = FONT_OPTIONS.find(x=>x.id===id); return f ? f.stack : FONT_OPTIONS[0].stack; }
function applyCustomFont(id, persist=true){
  const root = document.documentElement.style;
  if(!id || id==='inter'){ root.removeProperty('--font'); }
  else { root.setProperty('--font', fontStack(id)); }
  if(persist){ if(!id || id==='inter') safeStorage.remove(FONT_KEY); else safeStorage.set(FONT_KEY, id); }
}
function resetCustomFont(){ applyCustomFont('inter', true); }
function initCustomFont(){
  const saved = safeStorage.get(FONT_KEY);
  if(saved) applyCustomFont(saved, false);
}

initCustomBg();
initCustomSurface();
initCustomText();
initCustomAccent();
initCustomSuccess();
initCustomFont();

/* ---------------------- SETTINGS: language preference ---------------------- */
const LANG_KEY = 'sv_language';
function applyLanguage(lang){
  document.documentElement.setAttribute('lang', lang==='it' ? 'it' : 'en');
  safeStorage.set(LANG_KEY, lang);
}
function initLanguage(){
  applyLanguage(safeStorage.get(LANG_KEY) || 'it');
}
initLanguage();

// Listen for shell messages (when embedded inside the SPA shell)
window.addEventListener('message', function (ev) {
  var d = ev.data || {};
  if (d.source !== 'sv-shell') return;
  if (d.type === 'settings' && d.settings) {
    try {
      if (d.settings.theme) applyTheme(d.settings.theme);
      if (d.settings.accent) applyCustomAccent(d.settings.accent, false);
      if (d.settings.bg) applyCustomBg(d.settings.bg, false);
      if (d.settings.surface) applyCustomSurface(d.settings.surface, false);
      if (d.settings.textColor) applyCustomText(d.settings.textColor, false);
    } catch (e) {}
  }
  if (d.type === 'lang' && d.lang) {
    try { applyLanguage(d.lang); } catch (e) {}
  }
  if (d.type === 'activate') {
    try { if (typeof window.onActivate === 'function') window.onActivate(); } catch (e) {}
  }
});

const UI_EN = {
  brandTagline: 'COMPETENCY ASSESSMENT',
  activeModules: 'Active modules',
  moduleASoft: 'Soft Skills',
  moduleBHard: 'Hard Skills',
  methodologyNotes: 'Methodology notes',
  resetDemo: 'Reset demo',
  employeesRecorded: (n) => n + (n===1 ? ' employee recorded' : ' employees recorded'),
  loginUsername: 'Username',
  loginPassword: 'Password',
  loginUsernamePh: 'Enter your Username',
  loginPasswordPh: 'Enter your Password',
  loginRememberMe: 'Remember me',
  loginForgotPassword: 'Forgot password?',
  loginSignIn: 'Sign In',
  loginError: 'Incorrect username or password.',
  primaryScoreSoft: 'Soft Skills Score',
  primaryScoreHard: 'APEX 5D Score',
  primaryScoreOverall: 'Overall Value (A+B)',
  settingsTitle: 'Settings',
  settingsSub: 'Language, appearance, and login users',
  settingsClose: 'Close',
  tabLanguage: 'Language',
  tabColor: 'Color',
  tabUsers: 'Users',
  tabTesting: 'Testing',
  testsSettingsHint: 'Soft Skills test inventory, shown as a totalizer on the Home page. These fields are manually editable for now and are structured to be replaced by a live API sync later.',
  testsAcquiredLabel: 'Tests acquired',
  testsDispatchedLabel: 'Tests dispatched',
  testsRemainingLabel: 'Remaining',
  testsUsedPct: (pct) => `${pct}% of acquired tests dispatched`,
  toastTestsUpdated: 'Test totals updated',
  tabSurvey: 'Survey',
  surveyLinkLabel: 'External survey link',
  surveyLinkPh: 'https://…',
  surveyLinkHint: 'Storage slot for the link to the external survey used to collect Soft Skills responses. Not consumed anywhere in this dashboard yet — kept here for reference and future integration.',
  toastSurveyLinkSaved: 'Survey link saved',
  tabSoftTargets: 'Soft Skill Targets',
  softTargetsHint: 'Company-wide expected/target score (1–10) for each soft skill, used as the baseline when a new employee is added — mirrors the fixed 6.5 benchmark used for Hard Skills. A role\'s focus skills get +2 on top of this baseline. Existing employees keep their own per-skill Expected values, editable from the Soft Skills evaluation form.',
  toastSoftTargetsSaved: 'Soft skill targets updated',
  interfaceLanguage: 'Interface language',
  languageHint: 'Switching language instantly translates the dashboard\'s labels, menus, data taxonomy, and the AI Assistant\'s answers. A few free-text areas you\'ve typed yourself (like the Initial Analysis notes) are not auto-translated.',
  tabFont: 'Font',
  moduleColorsLabel: 'Module colors',
  moduleSyncLabel: 'Use one color for both modules',
  moduleBothHint: 'Applies to Soft Skills and Hard Skills alike — badges, buttons, and charts across every page.',
  accentLabel: 'Soft Skills color',
  accentHint: 'Used for Soft Skills badges, charts, buttons, links, and highlights across the app. Applies immediately, in both light and dark mode.',
  successLabel: 'Hard Skills color',
  successHint: 'Used for Hard Skills badges plus positive/success indicators (gains, checkmarks, "good" status) throughout the app.',
  resetToDefault: 'Reset to default',
  bgLabel: 'Background color',
  bgHint: 'The page background behind every screen. Cards follow this color automatically unless you set a custom card color below.',
  surfaceLabel: 'Card color',
  surfaceHint: 'Background of cards, panels, and tables — independent from the page background. Reset to let cards follow the background color again.',
  textLabel: 'Font color',
  textHint: 'Main text color across every page. Secondary and muted text shades adjust automatically to stay readable.',
  fontLabel: 'Interface font',
  fontHint: 'Changes the font family used across the whole app, on every page. Applies immediately.',
  fontPreviewLabel: 'Preview',
  usersHint: 'These credentials control who can sign in to this dashboard from the login screen.',
  newUsername: 'New username',
  newPassword: 'New password',
  addUser: 'Add user',
  atLeastOneUserTitle: 'At least one user must remain',
  toastAccentUpdated: 'Soft Skills color updated',
  toastAccentReset: 'Soft Skills color reset to default',
  toastSuccessUpdated: 'Hard Skills color updated',
  toastSuccessReset: 'Hard Skills color reset to default',
  toastModuleColorsReset: 'Module colors reset to default',
  toastBgUpdated: 'Background color updated',
  toastBgReset: 'Background color reset to default',
  toastSurfaceUpdated: 'Card color updated',
  toastSurfaceReset: 'Card color reset to default',
  toastTextUpdated: 'Font color updated',
  toastTextReset: 'Font color reset to default',
  toastFontUpdated: 'Interface font updated',
  toastFontReset: 'Interface font reset to default',
  toastLanguageIt: 'Language set to Italiano',
  toastLanguageEn: 'Language set to English',
  toastEnterUserPass: 'Enter both a username and password.',
  toastUserExists: 'That username already exists.',
  toastUserAdded: 'User added',
  toastUserRemoved: 'User removed',
  toastUserUpdated: 'User updated',
  toastAtLeastOneUser: 'At least one user must remain.',
  confirmRemoveUser: (name) => `Remove user "${name}"?`,
  editUserTitle: 'Edit user',
  saveChanges: 'Save changes',
  cancelEdit: 'Cancel',
  roleLabel: 'Role',
  roleAdmin: 'Admin (full access)',
  roleViewer: 'Viewer (read-only)',
  toastAtLeastOneAdmin: 'At least one admin must remain.',
  viewerReadOnly: 'Your account is read-only. Ask an admin to make this change.',
  evaluatorsTitle: 'Evaluators',
  evaluatorsHint: 'People who conduct Manager/Peer evaluations for Hard Skills. Add them here, then pick who evaluated each employee when saving an evaluation.',
  noEvaluators: 'No evaluators added yet.',
  newEvaluatorName: 'Evaluator name',
  addEvaluator: 'Add evaluator',
  removeEvaluator: 'Remove evaluator',
  confirmRemoveEvaluator: (name) => `Remove evaluator "${name}"? Employees already scored by them will keep their scores.`,
  toastEvaluatorAdded: 'Evaluator added',
  toastEvaluatorRemoved: 'Evaluator removed',
  toastEnterEvaluatorName: 'Enter the evaluator\'s name.',
  toastEvaluatorExists: 'That evaluator is already on the list.',
  evaluatorNameLabel: 'Evaluator name',
  evaluatorNamePh: 'Who is entering this evaluation?',
  evaluatorEmailLabel: 'Evaluator email',
  evaluatorEmailPh: 'evaluator@company.com',
  evaluatorSelfNote: 'Self-assessment — no separate evaluator needed.',
  toastEnterEvaluatorFirst: 'Enter the name of the person entering this evaluation.',
  evalSendEmailBtn: 'Send email',
  evalEmailSubject: 'Your competency evaluation link',
  evalEmailBody: (name, link) => `Hello ${name},\n\nYou have been assigned an evaluation on the Skill-Vision platform. Please use the secure link below to access only your assigned sheet:\n\n${link}\n\nThank you.`,
  toastNoEvaluatorEmail: 'Enter the evaluator\'s email before sending.',
  evaluatedByPrefix: 'Evaluated by',
  importButton: 'Upload Data',
  importModalTitle: 'Import Assessment Data',
  importModalSub: 'Upload an Excel file exported from the client organizational chart or the APEX 5D evaluation workbook',
  dzTitle: 'Drag & drop an .xlsx or .ods file here',
  dzSub: 'or click to browse your files',
  importCancel: 'Cancel',
  importConfirm: 'Confirm Import',
  importBack: 'Choose another file',
  importReadError: 'Could not read this file. Make sure it is a valid .xlsx, .xls, or .ods export.',
  importNoSheets: 'No recognizable sheets found in this file. Expected sheets like "DATI SURVEY" / "ORGANIGRAMMA" (organizational data) or "RESPONSABILE" / "PEER (Collega)" / "AUTOVALUTAZIONE" (assessment scores).',
  importPreviewTitle: 'Preview before importing',
  importAnagFound: (n, sheet) => `${n} employee record${n===1?'':'s'} found in sheet "${sheet}"`,
  importAnagNone: 'No organizational data sheet detected',
  importAssessFound: (n) => `${n} evaluation row${n===1?'':'s'} found across the assessment sheets`,
  importAssessNone: 'No assessment score sheet detected',
  importAssessBySource: (resp, peer, auto) => `Responsabile: ${resp} · Peer: ${peer} · Autovalutazione: ${auto}`,
  importFallbackNote: 'Some columns could not be matched to a known question — they were mapped in sheet order as a best-effort guess (A1…E5). Please double-check the imported scores.',
  importUnmappedNote: (n) => `${n} column${n===1?'':'s'} could not be matched and were ignored.`,
  importSuccessToast: (created, updated, matched) => {
    const parts = [];
    if(created) parts.push(`${created} new employee${created===1?'':'s'}`);
    if(updated) parts.push(`${updated} employee${updated===1?'':'s'} updated`);
    if(matched) parts.push(`${matched} evaluation${matched===1?'':'s'} imported`);
    return parts.length ? ('Import complete: ' + parts.join(', ') + '.') : 'Import complete: no matching records found.';
  },
  importUnmatchedToast: (n) => `${n} evaluation row${n===1?'':'s'} could not be matched to an existing employee and ${n===1?'was':'were'} skipped.`,

  /* ---- HOME PAGE ---- */
  homeStatusTitle: 'Overall Company Status',
  homeStatusSub: 'Executive summary of key HR indicators and operational priorities.',
  homeActiveFilter: 'Active Filter:',
  homeSystemActive: 'System Active',
  homeConfigActiveEyebrow: 'Active Configuration',
  homeSwitchHint: 'Switch between modules to update every indicator below. <b>Overall Value (A+B)</b> is only available when both modules are active together.',
  homeModuleALabel: 'Soft Skills',
  homeModuleBLabel: 'Hard Skills',
  homeModuleCompleteLabel: 'Complete (A + B)',
  homeKpiFeedback: 'Feedback to Deliver',
  homeKpiFeedbackSub: 'debrief meetings flagged',
  homeKpiTalent: 'Talent (Top + to Develop)',
  homeKpiTalentSub: (n) => `out of ${n} employees`,
  homeKpiRisk: 'People at Risk',
  homeKpiRiskSub: 'needing development or critical',
  homeKpiAreas: 'Areas Monitored',
  homeKpiAreasSub: 'company functions recorded',
  homeTotalizerTitle: 'Soft Skills Test Usage',
  homeTotalizerSub: 'Tests acquired vs. dispatched to date',
  homeCardExpandHint: 'Click to view details',
  statusGood: 'Good Status',
  statusModerate: 'Moderate Status',
  statusBelow: 'Below Target',
  homeQ1Title: 'Are we doing well or badly?',
  homeQ1Sub: 'Overall indicator of company competency status against expected levels.',
  homeQ1Score: 'Overall Score',
  homeQ1Coverage: 'Role Coverage',
  homeQ1Gap: 'Benchmark Gap',
  homeQ1LevelAchieved: 'Competency Level Achieved',
  homeQ1Green: 'Green',
  homeQ1GreenSub: 'Optimal Level',
  homeQ1Yellow: 'Yellow',
  homeQ1YellowSub: 'Moderate Level',
  homeQ1Red: 'Red',
  homeQ1RedSub: 'Critical Level',
  homeQ2Title: 'Where is the problem?',
  homeQ2CriticalIssues: (n) => `${n} Critical Issues`,
  homeQ2Sub: 'Breakdown of the main issues across areas, roles, competencies, and gaps.',
  homeQ2MostCriticalArea: 'Most Critical Area',
  homeQ2RoleAtRisk: 'Role at Risk',
  homeQ2WeakestCompetency: 'Weakest Competency',
  homeQ2Gap: (v) => `Gap ${v}`,
  homeQ2SevereGapLabel: 'Employees with severe gap:',
  homeQ2People: (n) => `${n} people`,
  homeQ2ViewDetail: 'View Detailed Analysis →',
  homeQ3Title: 'Who creates value and who creates risk?',
  homeQ3ResourceMapping: 'Resource Mapping',
  homeQ3Sub: 'Identification and categorization of key company resources.',
  homeQ3OpenMatrix: 'Open Overall Value Matrix →',
  quadHighPotential: 'High Potential',
  quadReadyToGrow: 'Ready to grow',
  quadHighValue: 'High Value',
  quadOperationalPillars: 'Operational pillars',
  quadCritical: 'Critical',
  quadUrgentAction: 'Urgent action needed',
  quadAtRisk: 'At Risk',
  quadNeedsSupport: 'Needs support',
  homeQ4Title: 'What should we do right now?',
  homeQ4AiPriorities: 'AI Priorities',
  homeQ4Sub: 'Automatically generated list of priority actions to optimize human capital.',
  homeQ4RealTime: 'Suggestions generated in real time',
  homeQ4Export: 'Export Action Plan →',
  azioniTraining: 'Training',
  azioniTrainingDesc: (skill) => `Close the gap on "${skill}"`,
  azioniCoaching: 'Coaching',
  azioniCoachingDesc: 'Accelerate the growth of high-potential employees',
  azioniReorgShort: 'Reorganization',
  azioniReorgFull: 'Replacements / Reorganizations',
  azioniReorgDesc: 'Assess the role or the position',
  azioniTalentShort: 'Talent',
  azioniTalentFull: 'Talent Development',
  azioniTalentDesc: 'Retention and career growth plans',
  worstSkillFallback: 'key competencies',
  exportPlanCsvHeader: 'Priority;Description;Employees Involved',
  toastActionPlanExported: 'Action plan exported',
  tierModalNoEmpTitle: 'No employees in this tier',
  tierModalNoEmpDesc: 'No employee currently falls into this category.',
  tierModalCount: (n) => `${n} employees`,
  btnClose: 'Close',

  /* ---- EMPLOYEE DIRECTORY ---- */
  anagAddEmployee: 'Add Employee',
  anagListTitle: 'Employee List',
  anagListSub: 'Complete directory of the recorded employee population. Click a row to open the employee profile.',
  anagSearchPh: 'Search by name or email…',
  anagSortLastName: 'Sort: Last Name A-Z',
  anagSortArea: 'Sort: Area',
  anagSortScore: 'Sort: Score',
  anagRoleSkillsTitle: 'Soft skill requirements by role',
  anagRoleSkillsSub: 'Register your company roles, select the required soft skills for each role and set the expected values.',
  anagSelectRole: 'Select role',
  roleCensusTitle: 'Company role census',
  roleCensusSub: 'Create roles and configure the soft skills required for each one, using the same weighting used in Recruiting.',
  createRoleBtn: 'Create role',
  newRoleTitleLabel: 'Job title',
  newRoleTitlePh: 'e.g. Sales Account Manager',
  newRoleSaveBtn: 'Save role',
  toastEnterRoleTitle: 'Enter a job title first',
  toastRoleCreated: 'Role created',
  toastRoleDuplicate: 'A role with this title already exists',
  weightEssenziale: 'Essential',
  weightImportante: 'Important',
  weightUtile: 'Useful',
  weightNone: 'Not selected',
  rcEssenzialiLabel: 'Essential',
  rcImportantiLabel: 'Important',
  rcUtiliLabel: 'Useful',
  rcExpectedLabel: 'Expected value',
  rcNoRoleSelected: 'Select or create a role to configure its soft skills.',
  /* ---- LINK SURVEY (send the external Soft Skills questionnaire link to employees) ---- */
  linkSurveyBtn: 'Survey link',
  linkSurveyHint: 'Send the questionnaire link to employees',
  surveyLinkModalTitle: 'Send questionnaire link',
  surveyLinkModalSub: 'Select the employees who should receive the Soft Skills assessment questionnaire.',
  surveyNoLinkConfiguredTitle: 'No survey link configured yet',
  surveyNoLinkConfiguredBody: 'Set the external survey link in Settings → Survey before sending it to employees.',
  surveyOpenSettingsBtn: 'Open Settings',
  surveySenderLabel: 'Send from',
  surveySenderReferenteOption: (name,email) => `Company contact person${name?' — '+name:''} ${email?`<${email}>`:'(email not set — configure it in Company Data)'}`,
  surveySenderAdminOption: (email) => `Skill-Vision admin ${email?`<${email}>`:'(email not set — configure it in Settings → Survey)'}`,
  surveySenderMissingWarning: 'The selected sender has no email address configured yet. Set it before sending.',
  surveySelectAllLabel: 'Select all',
  surveyColName: 'Full name',
  surveyColEmail: 'Company email',
  surveyNoEmailBadge: 'No email on file',
  surveyInviaBtn: 'Send link',
  toastSelectAtLeastOneEmployeeSurvey: 'Select at least one employee to send the survey to.',
  toastSurveyLinkMissing: 'Configure the external survey link in Settings → Survey first.',
  toastSurveySenderMissing: 'Configure the sender email before sending.',
  toastSurveySent: (n) => `Email draft${n===1?'':'s'} opened in your mail client for ${n} employee${n===1?'':'s'}. Review and send from there.`,
  toastSurveySkippedNoEmail: (n) => `${n} selected employee${n===1?'':'s'} skipped — no email on file.`,
  emailApiSectionTitle: 'Email sending service',
  emailApiSectionHint: 'Endpoint for a production email-sending API (your own backend, or a service like SendGrid/Postmark/SES behind a small proxy). Required for "Invia link" to actually deliver email — without it, nothing is sent and the app will say so plainly.',
  emailApiEndpointLabel: 'API endpoint URL',
  emailApiEndpointPh: 'https://your-backend.example.com/api/send-survey-emails',
  emailApiKeyLabel: 'API key / token (optional)',
  emailApiKeyPh: 'Sent as a Bearer token, if provided',
  emailApiKeyHint: 'Stored locally in this browser only, exactly like every other setting on this page — this app has no server of its own.',
  toastSurveyApiNotConfigured: 'No email-sending service is configured yet. Set the API endpoint in Settings → Survey, or use the manual email-draft fallback below.',
  toastSurveySending: (n) => `Sending to ${n} employee${n===1?'':'s'}…`,
  toastSurveySendAllOk: (n) => `${n} email${n===1?'':'s'} sent successfully.`,
  toastSurveySendAllFailed: 'Sending failed — the email service did not confirm delivery for any recipient.',
  toastSurveyApiError: (msg) => `Could not reach the email service: ${msg}`,
  surveySendResultsTitle: 'Send results',
  surveySendResultsSub: (ok,fail) => `${ok} sent successfully, ${fail} failed.`,
  surveySendResultsOkLabel: 'Sent',
  surveySendResultsFailLabel: 'Failed',
  surveyMailtoFallbackBtn: 'Open email drafts instead (mailto)',
  surveyMailtoFallbackHint: 'No email service is connected. This opens one compose window per recipient in your own mail client — you still click send yourself. It is not automatic delivery.',
  toastSurveyMailtoOpened: (n) => `Draft${n===1?'':'s'} opened in your mail client for ${n} recipient${n===1?'':'s'}.`,
  surveySenderMode: 'Sender configuration',
  surveySenderModeReferente: 'Company contact person',
  surveySenderModeAdmin: 'Skill-Vision admin',
  adminSenderEmailLabel: 'Skill-Vision admin email',
  adminSenderEmailPh: 'admin@skill-vision.it',
  surveyEmailSubjectLabel: 'Questionnaire email — subject',
  surveyEmailBodyLabel: 'Questionnaire email — body',
  surveyEmailTemplateHint: 'Editable template used when sending the questionnaire link. {{NOME}} and {{LINK}} are replaced per employee. The client will supply the final wording — replace the placeholder text below once available.',
  preTestLetterLabel: 'Mandatory cover letter ("Letter to Collaborators")',
  preTestLetterHint: 'Sent to every collaborator ahead of the short note above, before the survey link. Use {{LINK}} where the questionnaire link should appear — if removed, the link is still appended automatically.',
  anagAllAreas: 'All areas',
  anagColEmployee: 'Employee',
  anagColEmail: 'Email',
  anagColArea: 'Area',
  anagColDepartment: 'Department',
  anagColRole: 'Role',
  anagColDuties: 'Duties',
  anagColGender: 'Gender',
  anagColLevel: 'Level (CCNL)',
  anagColRal: 'RAL',
  anagColBenefit: 'Benefits',
  anagColSoftAssigned: 'Soft Skill assigned',
  anagArchive: 'Archive',
  anagRestore: 'Restore',
  anagShowArchived: 'Show archived',
  anagNoArchivedFound: 'No archived employees',
  anagShowing: (a,b,total) => `Showing ${a}–${b} of ${total} employees`,
  anagPageOf: (p,total) => `Page ${p} of ${total}`,
  anagNoEmployeesFound: 'No employees found',
  anagAdjustFilters: 'Adjust the search filters or add a new employee.',
  addEmpFirstName: 'First Name',
  addEmpLastName: 'Last Name',
  addEmpEmail: 'Company Email',
  addEmpArea: 'Area',
  addEmpAreaPh: 'E.g. Sales Area',
  addEmpDept: 'Department',
  addEmpDeptPh: 'E.g. Northern Region',
  addEmpRole: 'Role (Job/Role Mapping)',
  addEmpRolePh: 'E.g. Account Manager',
  addEmpRoleEmptyOption: '— Select a role —',
  addEmpNoRolesHint: 'No roles configured yet. Open "Soft skill requirements by role" and create a role before registering an employee.',
  toastSelectRoleFirst: 'Select a role before registering the employee.',
  addEmpDuties: 'Duties Performed',
  addEmpDutiesPh: 'Brief description of daily activities',
  genderLabel: 'Gender',
  genderUnspecified: 'Prefer not to say',
  genderFemale: 'Female',
  genderMale: 'Male',
  genderOther: 'Other',
  ccnlLevelLabel: 'CCNL Level',
  ccnlLevelPh: 'E.g. Impiegato 3° livello',
  ralLabel: 'Gross Annual Salary (RAL)',
  ralPh: 'E.g. 32000',
  benefitLabel: 'Benefits',
  benefitPh: 'E.g. Meal vouchers, company car',
  contractTypeLabel: 'Contract Type',
  contractTypeDipendente: 'Employee (payroll)',
  contractTypeCocopro: 'Co.co.co.',
  contractTypePartitaIva: 'VAT / self-employed',
  contractTypeEsterno: 'External / outsourced',
  scheduledAbsencesLabel: 'Scheduled absences',
  absenceFromLabel: 'From',
  absenceToLabel: 'To',
  absenceReasonLabel: 'Reason',
  absenceReasonPh: 'E.g. Summer leave',
  noScheduledAbsences: 'No scheduled absences',
  addAbsenceBtn: 'Add absence',
  removeAbsenceBtn: 'Remove absence',
  addEmpNote: 'The employee is created with the expected Soft Skills profile for the selected role (Essential/Important/Useful classification and expected value, from the role census). Professional Competencies and obtained scores start at 0 until evaluators enter real evaluations from the Soft Skills and Hard Skills modules.',
  profileRoleExpectedTitle: 'Expected profile for the role',
  profileRoleExpectedSub: (role) => `Soft skills required for "${role}" — classification and expected value, as defined in the role census.`,
  addEmpModalTitle: 'New Employee',
  addEmpModalSub: 'Fill in the personal and organizational details',
  toastEnterNameFirst: 'Enter at least a first and last name.',
  toastEmployeeAdded: 'Employee added',
  editProfileBtn: 'Edit',
  toastProfileUpdated: 'Profile updated',
  archiveModalTitle: 'Archive Employee',
  archiveModalSub: (name) => `Archiving ${name} removes them from the active list but keeps their full evaluation history.`,
  archiveReasonFieldLabel: 'Reason',
  archiveReasonPensione: 'Retirement',
  archiveReasonLicenziamento: 'Termination',
  archiveReasonProbation: 'Did not pass probation period',
  archiveReasonAltro: 'Other',
  archiveOtherLabel: 'Please specify',
  archiveOtherPh: 'Reason for archiving',
  archiveConfirmBtn: 'Archive',
  toastArchiveOtherRequired: 'Enter a reason before archiving.',
  toastEmployeeArchived: 'Employee archived',
  toastEmployeeRestored: 'Employee restored',
  profileArchivedBanner: (reason,date) => `Archived — ${reason} (${date})`,

  /* ---- COMPANY PROFILE ---- */
  companyPageTitle: 'Company Profile',
  companyPageSub: 'Locations, contacts, headcount by type, and key company roles.',
  companyHeadcountTitle: 'Total employees by type',
  companyHeadcountSub: 'Computed live from the Employee Directory. Click a tile to see who is behind that count.',
  companyHeadcountBreakdownTitle: (label) => `Employees — ${label}`,
  companyHeadcountBreakdownEmpty: 'No employees recorded in this category yet.',
  companyHeadcountDipendenti: 'Employees (payroll)',
  companyHeadcountCocopro: 'Co.co.co.',
  companyHeadcountPartitaIva: 'VAT / self-employed',
  companyHeadcountEsterni: 'External / outsourced',
  companyLocationsTitle: 'Locations',
  companyLocationsSub: 'Company sites and offices.',
  companyLocationNameLabel: 'Location name',
  companyLocationAddressLabel: 'Address',
  companyLocationCityLabel: 'City',
  companyAddLocationBtn: 'Add location',
  companyRemoveLocationBtn: 'Remove',
  companyNoLocations: 'No locations recorded yet.',
  companyContactsTitle: 'Contacts',
  companyContactsSub: 'General company contacts.',
  companyContactLabelLabel: 'Role / label',
  companyContactNameLabel: 'Name',
  companyContactEmailLabel: 'Email',
  companyContactPhoneLabel: 'Phone',
  companyAddContactBtn: 'Add contact',
  companyRemoveContactBtn: 'Remove',
  companyNoContacts: 'No contacts recorded yet.',
  companyKeyRolesTitle: 'Key company roles',
  companyKeyRolesSub: 'Company contact person, CEO, and CFO.',
  companyReferenteLabel: 'Company contact person',
  companyCeoLabel: 'CEO',
  companyCfoLabel: 'CFO',
  companyNameLabel: 'Name',
  companyEmailLabel: 'Email',
  companyPhoneLabel: 'Phone',
  companySaveBtn: 'Save company profile',
  toastCompanySaved: 'Company profile saved.',

  /* ---- INITIAL ANALYSIS ---- */
  analisiFieldProblematiche: 'Perceived issues',
  analisiFieldCriticita: 'Identified critical issues',
  analisiFieldObiettivi: 'Project objectives',
  analisiFieldAspettative: 'Management expectations',
  analisiNotDocumented: 'Not yet documented.',
  analisiPageTitle: 'Initial project analysis',
  analisiPageSub: 'Snapshot of the starting situation gathered with management.',
  analisiEditingNote: 'You are editing this section — remember to save your changes.',
  analisiClickEditNote: 'Click "Edit" above to update it at any time.',
  analisiEditBtn: 'Edit',
  analisiSaveBtn: 'Save',
  toastAnalisiSaved: 'Initial analysis saved',

  /* ---- SHARED (reused across Soft/Hard/Overall Value pages) ---- */
  newEvaluation: 'New Evaluation',
  colArea: 'Area',
  colRole: 'Role',
  colEmployee: 'Employee',
  colObtained: 'Obtained',
  colExpected: 'Expected',
  colGap: 'Gap',
  colGapVsExpected: 'Gap vs Expected',
  colScore: 'Score',
  colCompetency: 'Competency',
  colDimension: 'Dimension',
  colOverallScore: 'Overall score',
  chartObtained: 'Obtained',
  chartExpected: 'Expected',
  legendHighest: 'Highest in row',
  legendLowest: 'Lowest in row',
  legendAligned: 'Aligned (overlap)',
  toastFirstAddEmployee: 'First add an employee in the Employee Directory.',
  btnSaveEvaluation: 'Save evaluation',
  noEmployeesTitle: 'No employees',
  noEmployeesDesc: 'Add an employee in the Employee Directory.',
  matchUpTo5: 'Match (up to 5)',
  toastMaxMatch: 'Maximum of 5 employees in the comparison.',

  /* ---- SOFT SKILLS (MODULE A) ---- */
  softTabOrg: 'Company overview',
  softTabArea: 'By area',
  softTabAlfa: 'Alphabetical order',
  softTabIndividuale: 'Individual',
  softTabRanking: 'Ranking',
  softClusterAvgTitle: 'Average score by competency cluster',
  softClusterAvgNote: 'Each card\'s trend badge shows the delta versus the average EXPECTED value configured for company roles.',
  softBigFiveOrgTitle: 'Aggregated Big Five profile (company)',
  softWorstSkillsTitle: 'Soft skills with the largest gap versus expected',
  softAreaEmpCount: (n) => `(${n} employees)`,
  softColLastName: 'Last Name',
  softColFirstName: 'First Name',
  softSelectEmployee: 'Select employee',
  softBigFiveProfile: 'Big Five Profile',
  softSummaryTitle: 'Summary',
  softOverallScoreLabel: (att) => `Overall soft skill score (expected ${att})`,
  softAllSkillsDetail: 'Detail of all 35 soft skills',
  softSortByScore: 'Sort by Score',
  softSortByGap: 'Sort by Gap',
  softSelectUpTo5: 'Select up to 5 employees to compare',
  softAddToComparison: '+ Add employee to comparison…',
  softNoEmpSelectedTitle: 'No employees selected',
  softNoEmpSelectedDesc: 'Add at least 2 employees to start the comparison.',
  softEvalEmployeeLabel: 'Employee being evaluated',
  softEvalModalTitle: 'New Evaluation — Soft Skills',
  softEvalModalSub: 'Enter the obtained and expected score (1–10, decimals allowed, e.g. 6.3) for each soft skill',
  toastSoftEvalSaved: 'Soft skill evaluation saved',

  /* ---- HARD SKILLS (MODULE B) ---- */
  hardProtocolNote: 'Scale 1–10: 1-2 Not Adequate · 3-4 Developing · 5-6 Adequate · 7-8 Advanced · 9-10 Excellent.',
  evalByManagerPrefix: 'Manager',
  evalByPeerPrefix: 'Peer',
  evalBySelfPrefix: 'Self',
  hardMultiSourceTitle: 'Multi-source comparison by dimension',
  hardApex5dProfile: 'APEX 5D Profile',
  hardOverallApexLabel: 'Overall APEX 5D score (average of 3 sources)',
  hardColDimension: 'APEX 5D Dimension',
  hardColManager: 'Manager',
  hardColPeer: 'Peer',
  hardColSelf: 'Self-Assessment',
  hardColOverallAvg: 'Overall Average',
  hardColLevel: 'Level',
  hardApexScoreRow: 'APEX 5D SCORE',
  hardApexScoreCol: 'APEX 5D Score',
  hardGapAnalysisTitle: 'Perception gap analysis (delta between evaluation sources)',
  hardColGapMgrSelf: 'Gap Manager–Self',
  hardColGapPeerSelf: 'Gap Peer–Self',
  hardColGapMgrPeer: 'Gap Manager–Peer',
  hardColInterpretation: 'Interpretation',
  hardEvaluateeLabel: 'Evaluatee — employee being evaluated',
  hardEvaluatorSourceLabel: 'Evaluator — evaluation source',
  hardItemsNote: 'Each item is scored 1–10. The <b>Expected</b> column shows the company-wide target (6.5) used as the benchmark throughout Hard Skills.',
  hardEvalModalTitle: 'New Evaluation — Hard Skills (APEX 5D)',
  hardEvalModalSub: '25 items across 5 dimensions · Scale 1–10',
  hardDimensionPrefix: 'Dimension',
  hardExpChip: 'Exp. 6.5',
  toastHardEvalSaved: (sourceLabel) => `APEX 5D evaluation saved (${sourceLabel})`,

  /* ---- RESTRICTED EVALUATOR LINK SCREEN ---- */
  reInvalidLinkTitle: 'Link not valid',
  reInvalidLinkDesc: 'This evaluation link is invalid, has expired, or the assignment no longer exists. Contact the person who sent it to you for a new link.',
  reThankYouTitle: 'Thank you — evaluation submitted',
  reThankYouDesc: (date) => `Your evaluation was recorded${date ? ' on ' + date : ''}. You can close this page now.`,
  reFormTitle: 'APEX 5D Evaluation',
  reFormDesc: (name, sourceLabel) => `You are completing a ${sourceLabel} evaluation for ${name}. Rate each item from 1 (low) to 10 (high).`,
  reSubmitBtn: 'Submit evaluation',
  reDefaultPeriodLabel: 'Current period',

  /* ---- ADMIN EVALUATION MANAGER (MODULE B) ---- */
  evalManagerBtn: 'Evaluation Manager',
  evalManagerTitle: 'Evaluation Manager',
  evalManagerSub: 'Assign Manager / Peer / Self-Assessment templates and generate evaluator links',
  evalSentLabel: 'Inviate (Sent)',
  evalReceivedLabel: 'Ricevute (Received)',
  evalAssignTitle: 'New assignment',
  evalTemplateLabel: 'Template',
  evalPeriodLabel: 'Period',
  evalNewPeriodLabel: 'New period',
  evalNewPeriodPh: 'E.g. Q1 2027 review',
  evalAddPeriodBtn: 'Add period',
  evalTargetsLabel: 'Employees to evaluate',
  evalCreateBtn: 'Create assignment(s)',
  evalAssignmentsListTitle: 'All assignments',
  evalColTarget: 'Employee',
  evalColTemplate: 'Template',
  evalColEvaluator: 'Evaluator',
  evalColPeriod: 'Period',
  evalColStatus: 'Status',
  evalStatusCompleted: 'Completed',
  evalStatusPending: 'Pending',
  evalCopyLinkBtn: 'Copy link',
  evalMarkDoneBtn: 'Mark done',
  evalNoAssignments: 'No assignments yet.',
  evalLinkTrustNote: 'This data lives only in this browser (no server), so the link only works when opened in this same browser — e.g. a new tab here, or sent to a colleague using this same shared computer/profile. It will not work from another device. It is not a substitute for a real authenticated distribution system.',
  evalLinkModalTitle: 'Evaluator link',
  evalBreakdownTitle: 'Evaluations breakdown',
  toastEnterPeriodLabel: 'Enter a label for the new period.',
  toastPeriodAdded: 'Period added',
  toastSelectAtLeastOneTarget: 'Select at least one employee to evaluate.',
  toastAssignmentsCreated: (n) => `${n} assignment${n===1?'':'s'} created`,
  toastLinkCopied: 'Link copied to clipboard',
  toastAssignmentMarkedDone: 'Assignment marked as completed',
  confirmDeleteAssignment: 'Delete this assignment? This does not remove any scores already submitted.',

  /* ---- LONGITUDINAL GAP TRACKING ---- */
  longiTitle: 'Gap / Improvement Over Time',
  longiDesc: 'Compares two evaluation periods for this employee, per APEX dimension. Populated automatically as evaluators complete assignments through the Evaluation Manager.',
  longiNotEnoughData: 'Not enough data yet — this employee needs completed evaluations in at least two different periods to show a trend.',
  longiPeriodA: 'Period A',
  longiPeriodB: 'Period B',
  longiDeltaCol: 'Delta',

  /* ---- OVERALL VALUE (MODULE A + B) ---- */
  valoreSubBoth: 'Integration of Soft Skills + Hard Skills',
  valoreSubAOnly: 'Soft Skills only',
  valoreSubBOnly: 'Hard Skills only',
  valoreExportCsv: 'Export CSV',
  valoreScatterTitle: 'Overall Value Ranking',
  valoreBubbleSizeNote: 'Employees ordered by combined score, marker color = performance tier',
  valoreTierDistTitle: 'Score distribution by classification',
  valoreOnlyModuleNote: (moduleLabel) => `Only ${moduleLabel} is active, so the index below reflects that module only. Activate both modules from the sidebar to calculate the blended Overall Value (50/50).`,
  valoreModuleALabel: 'Soft Skills',
  valoreModuleBLabel: 'Hard Skills',
  valoreClassificationTitle: 'Performance Classes',
  valoreIndexBoth: '50% Soft Skills + 50% Hard Skills',
  valoreIndexAOnly: 'Soft Skills score only',
  valoreIndexBOnly: 'Hard Skills score only',
  valoreIndexNote: (indexDesc) => `Index = ${indexDesc}. Thresholds: Top Talent ≥8.3 · Talent to Develop ≥7.0 · Solid Performer ≥5.5 · Needs Development ≥4.0 · Critical &lt;4.0.`,
  valoreMatrixTitle: 'Classification matrix',
  valoreMatrixSub: '— employees grouped by tier',
  valoreByEmployeeTitle: 'Overall value by employee',
  colSoftA: 'Soft (A)',
  colHardB: 'Hard (B)',
  colCombined: 'Combined',
  colClassification: 'Classification',
  valoreAxisHard: 'Employee Rank',
  valoreAxisSoft: 'Overall Value Score',
  csvHeaderValore: 'Last Name;First Name;Area;Role;Soft;Hard;Combined;Classification',

  /* ---- EMPLOYEE PROFILE DRAWER ---- */
  profileEmployeeType: 'Employee',
  profileDebriefPending: 'Debrief pending',
  profileEmailLabel: 'Email:',
  profileDeptLabel: 'Department:',
  profileDutiesLabel: 'Duties:',
  profileModuleATitle: 'Soft Skills',
  profileObtainedExpected: (att) => `/10 obtained &nbsp;·&nbsp; expected ${att}`,
  profileTop3Strengths: 'Top 3 strengths',
  profileDevAreas: 'Development areas',
  profileModuleBTitle: 'APEX 5D — Hard Skills',
  profileOverallApexScoreLine: '/10 overall APEX 5D score',
  profileLastAssessmentLabel: 'Last assessment date',
  profileNoAssessmentYet: 'No assessment completed yet',
  profilePrevAssessmentsBtn: 'Previous assessments',
  prevAssessModalTitle: (name) => `Previous assessments · Professional Competencies — ${name}`,
  prevAssessModalSub: 'History of completed assessments and comparison between periods.',
  prevAssessModalTitleSoft: (name) => `Previous assessments · Transversal Competencies — ${name}`,
  prevAssessModalSubSoft: 'History of completed transversal competency assessments.',
  prevAssessColDate: 'Date',
  prevAssessColPeriod: 'Period',
  prevAssessLatestBadge: 'Latest',
  reportBtn: 'Download report',
  toastReportOpening: 'Opening the print dialog — choose "Save as PDF" to download.',
  toastNoReportData: 'No completed assessment yet — nothing to report.',
  reportTitle: 'Assessment Report',
  reportProvisionalNote: 'Provisional data report generated by the platform. The final graphic template will be supplied by the company handling the assessment results — this page is a functional placeholder, not the final design.',
  reportGeneratedOn: (d) => `Generated on ${d}`,
  reportEmployeeInfoTitle: 'Employee',
  reportSectionHistory: 'Assessment history',
  /* ---- External assessment-result import (Excel period selector + PDF integration seam) ---- */
  importAssessPeriodLabel: 'Assign imported results to period',
  sourceLabelImportXlsx: 'Bulk Excel import',
  sourceLabelExternalPdf: 'External PDF (imported)',
  importPdfHint: 'Have a results PDF from an external provider instead?',
  importPdfLinkLabel: 'Import from PDF',
  pdfImportModalTitle: 'Import assessment result from PDF',
  pdfImportModalSub: 'Architecture preview — real PDF parsing is not yet connected. See the note below.',
  pdfImportNotReadyNote: 'Automatic PDF data extraction is not implemented yet: the external company has not yet supplied a sample PDF or its field/label layout, and this app does not assume one. Once that sample is provided, the extraction step below can be implemented without changing anything else in this flow. For now, you can validate the rest of the pipeline (employee matching, saving a new historical record, updating the profile) by entering already-known values manually.',
  pdfImportDzTitle: 'Select a PDF file',
  pdfImportDzSub: 'The file is read, but its content is not parsed yet (see note above)',
  pdfImportReading: 'Reading file…',
  pdfImportUnsupportedNote: (name) => `"${name}" was read, but automatic extraction is not yet available for this format. Enter the values manually below to continue.`,
  pdfImportManualTitle: 'Manual entry (already-extracted values)',
  pdfImportManualSub: 'Use this to record a result you already have from the external report, per APEX 5D dimension (1–10).',
  pdfImportSubmitBtn: 'Save assessment result',
  toastPdfImportNoMatch: 'No employee matches that email or name.',
  toastPdfImportMissingScores: 'Enter a score (1–10) for every dimension.',
  toastPdfImportSaved: (name) => `Assessment result saved for ${name}.`,
  prevAssessColSource: 'Source',
  tagMgr: 'Mgr',
  tagPeer: 'Peer',
  tagSelf: 'Self',
  profileFeedbackDevPlanTitle: 'Feedback &amp; Development Plan',
  profileSaveFeedbackBtn: 'Save feedback and plan',
  toastFeedbackUpdated: 'Feedback updated',

  /* ---- DEV PLAN FIELDS (shared: profile drawer + Feedback page) ---- */
  devPlanAzioniLabel: 'Improvement Actions',
  devPlanAzioniPh: 'Concrete actions to close identified gaps…',
  devPlanFormazioneLabel: 'Training',
  devPlanFormazionePh: 'Courses, certifications, learning paths…',
  devPlanCoachingLabel: 'Coaching',
  devPlanCoachingPh: 'Mentoring, 1:1 coaching, shadowing…',
  devPlanObiettiviLabel: 'Future Goals',
  devPlanObiettiviPh: 'Objectives for the next review cycle…',
  feedbackSwitchLabel: 'Feedback interview needed',

  /* ---- FEEDBACK & DEVELOPMENT PLAN PAGE ---- */
  feedbackPageTitle: 'Feedback &amp; Development Plan',
  feedbackPageSub: 'For each employee: whether a debrief meeting is needed, and a structured development plan.',
  btnSave: 'Save',
  toastSaved: 'Saved',

  /* ---- AI ASSISTANT ---- */
  aiQAreeCritiche: 'Which company areas have the most critical gaps?',
  aiQPromotionReady: 'Show me the Top Talent ready for promotion.',
  aiQUrgentTraining: 'Who needs urgent training interventions?',
  aiQSoftSkillsSummary: 'Generate a summary of the overall Soft Skills status.',
  aiQAndamento: 'How is the company doing overall?',
  aiQAreeCriticheShort: 'What are the most critical areas?',
  aiQTopTalent: 'Who are the Top Talent to develop?',
  aiQRischio: 'Who represents a risk to the organization?',
  aiQGapCompetenze: 'Which competencies have the largest gap?',
  aiQRanking: 'What is the full ranking of employees?',
  aiQFormazione: 'What training priorities do you suggest?',
  aiQColloqui: 'How many people need a debrief meeting?',
  aiQAree: 'How are employees distributed by area?',
  aiQBigFive: 'What is the company\'s aggregated Big Five profile?',
  aiQuickQuestions: 'Quick questions',
  aiMoreQuestions: 'More questions',
  aiInputPh: 'Ask about company data, roles, skills, or ranking…',
  aiSendBtn: 'Send',
  aiGreeting: 'Hi, I\'m the assistant for the Competency Assessment dashboard. Ask me about company data, roles, skills, gaps, or ranking — for example how an area is performing, who the top talent is, or who needs training. Use the quick-question buttons on the left, or type a free-form question below.',

  /* ---- AI ASSISTANT: local canned-answer templates ---- */
  aiThinkingMsg: 'Analyzing the data…',
  aiCantInterpretMsg: 'I couldn\'t interpret the response. Try rephrasing the question or use the suggested buttons.',
  aiCantReachMsg: 'I can\'t reach the natural language engine right now. Try rephrasing the question using words like "areas", "gap", "ranking", "risk", "training", or use the suggested buttons on the left.',
  aiRelInLine: 'in line with',
  aiRelSlightlyBelow: 'slightly below',
  aiRelBelow: 'below',
  aiAndamentoTemplate: (avgScore, scoreLabel, rel, benchmark, talentCount, total, riskCount, feedbackDue) =>
    `The company average score (${scoreLabel}) is ${avgScore}/10, ${rel} the internal benchmark of ${benchmark}.\nTalent (Top + to Develop): ${talentCount} out of ${total}.\nPeople at risk (needing development + critical): ${riskCount}.\nDebrief meetings flagged: ${feedbackDue}.`,
  aiAreeCriticheIntro: 'The areas with the lowest average score are:',
  aiAreeCriticheLine: (rank, area, avgVal, count) => `${rank}. ${area} — average ${avgVal}/10 (${count} employees)`,
  aiTopTalentIntro: 'High-value employees:',
  aiNoTopTalent: 'At the moment, no employees fall into the Top Talent or Talent to Develop tiers with the current data.',
  aiRischioIntro: 'Employees that require attention:',
  aiNoRischio: 'No employees currently fall into the critical or needs-development tiers.',
  aiDebriefFlaggedSuffix: ' · debrief flagged',
  aiSoftGapIntro: 'Soft skills with the largest average gap versus expected:',
  aiSoftGapLine: (name, ottenuto, atteso, gap) => `• ${name}: obtained ${ottenuto} vs expected ${atteso} (Δ ${gap})`,
  aiHardGapIntro: 'Weakest APEX 5D dimensions:',
  aiHardGapLine: (name, avgVal) => `• ${name}: average ${avgVal}/10`,
  aiNoModuleForGap: 'Activate at least one module to analyze competency gaps.',
  aiRankingIntro: (scoreLabel) => `Ranking (${scoreLabel}):`,
  aiFormazioneIntro: 'Suggested operational priorities:',
  aiColloquiIntro: (count) => `${count} employees need a debrief meeting:`,
  aiNoColloqui: 'No debrief meetings are currently flagged.',
  aiAreeLine: (area, count, avgVal) => `• ${area}: ${count} employees — average score ${avgVal}/10`,
  aiNoModuleA: 'Activate Soft Skills to calculate the aggregated Big Five profile.',
  aiBigFiveIntro: 'Company\'s aggregated Big Five profile:',
  aiNoPromotion: 'No employees currently reach the Top Talent tier (≥8.3/10), so none are flagged as promotion-ready yet.',
  aiPromotionIntro: 'Top Talent ready for promotion (score ≥8.3/10):',
  aiNoUrgentTraining: 'No employees currently require urgent training: everyone is at an adequate level or above.',
  aiUrgentTrainingIntro: (count) => `${count} employees need urgent training intervention (Needs Development or Critical tier):`,
  aiWorstCompetencyLine: (name, gap) => `\n\nThe competency with the largest gap company-wide is "${name}" (Δ ${gap}) — a good starting point for a training plan.`,
  aiNoEmployeesSoft: 'No employees recorded yet, so there is no Soft Skills data to summarize.',
  aiSoftSummaryTemplate: (overall, count, clusterLines, worst) =>
    `Overall Soft Skills status: ${overall}/10 average across ${count} employees.\n\nBy cluster:\n${clusterLines}\n\nSoft skills with the largest gap versus expected:\n${worst}`,

  /* ---- MISC / SYSTEM TOASTS ---- */
  toastDataSaved: 'Data saved',
  toastSaveError: 'Save error: data kept only for this session.',
  toastAtLeastOneModule: 'At least one module must remain active.',
  toastEnableModule: 'Enable the corresponding module to access this section.',
  methodologyModalTitle: 'Methodology notes',
  methodologyModalSub: 'How this dashboard\'s indicators are calculated',
  methodologyGotIt: 'Got it',
  methodologyDataShown: '<b>Data shown:</b> this instance contains automatically generated demo data (names, scores, and evaluations are fictitious) to show the dashboard already populated and working. Replace it with real data from the Employee Directory section and with the evaluations filled in for Soft Skills and Hard Skills.',
  methodologyModuleA: '<b>Soft Skills — Big Five:</b> each of the 35 soft skills in the SKILL-VISION protocol is associated with one of the 5 Big Five dimensions (Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Stability) according to an internal mapping developed by SKILL-VISION; the score per dimension is the average of the scores obtained on the associated skills.',
  methodologyModuleB: '<b>Hard Skills — APEX 5D:</b> each dimension (Professionalism, Performance, Aptitude, Mindset, Potential) is calculated as the average of 5 items, for each of the 3 evaluation sources (Manager, Peer, Self-Assessment). The Overall Average is the simple average of the 3 sources; the APEX 5D Score is the average of the 5 Overall Averages.',
  methodologyOverall: '<b>Overall Value:</b> when both modules are active, the combined index is the simple (50/50) average between the Soft Skills score and the Hard Skills score. The classification thresholds (Top Talent, Talent to Develop, Solid Performer, Needs Development, Critical Performer) are configured on a 1–10 scale and can be recalibrated based on the client\'s benchmarks.',
  methodologyStorage: '<b>Data storage:</b> the information entered in this dashboard (employee directory, evaluations, initial analysis, feedback) is shared among everyone who opens this same tool — useful for having Managers, Peers, and HR collaborate on the same data set, but worth keeping in mind before entering confidential information.',
  confirmResetDemo: 'This will replace ALL current data (employee directory, evaluations, initial analysis, feedback) with a new demo data set. Continue?',
  evaluatorNameExamplePh: 'E.g. Marco Rossi',
  gapAligned: 'Aligned perceptions',
  gapModerate: 'Moderate gap',
  gapSignificant: 'Significant gap',

  /* ---- CUSTOMER CARE LOGIC ---- */
  ccEyebrow: 'CUSTOMER CARE',
  ccPageTitle: 'Customer Care competency logic',
  ccPageSub: 'Ticket workload, satisfaction, and the competencies behind Customer Care service quality.',
  ccDemoNote: 'Operational figures (tickets, response time, CSAT) are simulated demo data; agent competencies come from the Soft Skills evaluations.',
  ccTabOverview: 'Ticket & CSAT overview',
  ccTabAgents: 'Agent competencies',
  ccTabMatrix: 'Assistance matrix',
  ccExportCsv: 'Export CSV',
  ccNoAgentsTitle: 'No Customer Care agents',
  ccNoAgentsDesc: 'Add employees in the Customer Service area from the Employee Directory.',
  ccKpiFrt: 'First response time',
  ccKpiFrtSub: 'Average, first reply to a ticket',
  ccKpiCsat: 'CSAT score',
  ccKpiCsatSub: 'Average customer satisfaction',
  ccKpiVolume: 'Ticket volume',
  ccKpiVolumeSub: 'Handled in the last 30 days',
  ccKpiMatch: 'Skill match rate',
  ccKpiMatchSub: 'Competency obtained vs expected',
  ccDeltaVsPrev: 'vs previous period',
  ccDeltaVsTarget: 'vs target',
  ccUnitMin: ' min',
  ccTrendTitle: 'CSAT and ticket resolution — last 8 weeks',
  ccTrendCsat: 'CSAT %',
  ccTrendResolved: 'Tickets resolved',
  ccWeekPrefix: 'Wk',
  ccAgentTableTitle: 'Agent performance & competencies',
  ccColAgent: 'Agent',
  ccColTickets: 'Tickets',
  ccColFrt: 'First response',
  ccColCsat: 'CSAT',
  ccColResolution: 'Resolution rate',
  ccColMatch: 'Skill match',
  ccColOverall: 'CC competency avg',
  ccAgentsChartTitle: 'Skill match by agent',
  ccMatrixTitle: 'Assistance coverage matrix',
  ccMatrixSub: 'Customer Care competencies × agents',
  ccMatrixNote: 'Each cell is the obtained score; the colour flags the gap versus the value expected for the role.',
  ccMatrixColCompetency: 'Competency',
  ccMatrixColOrgAvg: 'Team avg',
  ccMatrixStrong: 'Strong (≥ 8)',
  ccMatrixToDevelop: 'To develop (< 6)',
};
const UI_IT = {
  brandTagline: 'VALUTAZIONE DELLE COMPETENZE',
  activeModules: 'Moduli attivi',
  moduleASoft: 'Competenze Trasversali',
  moduleBHard: 'Competenze Professionali',
  methodologyNotes: 'Note metodologiche',
  resetDemo: 'Reset demo',
  employeesRecorded: (n) => n + (n===1 ? ' dipendente registrato' : ' dipendenti registrati'),
  loginUsername: 'Nome utente',
  loginPassword: 'Password',
  loginUsernamePh: 'Inserisci il tuo nome utente',
  loginPasswordPh: 'Inserisci la tua password',
  loginRememberMe: 'Ricordami',
  loginForgotPassword: 'Password dimenticata?',
  loginSignIn: 'Accedi',
  loginError: 'Nome utente o password non corretti.',
  primaryScoreSoft: 'Punteggio Soft Skills',
  primaryScoreHard: 'Punteggio APEX 5D',
  primaryScoreOverall: 'Valore Complessivo (A+B)',
  settingsTitle: 'Impostazioni',
  settingsSub: 'Lingua, aspetto e utenti di accesso',
  settingsClose: 'Chiudi',
  tabLanguage: 'Lingua',
  tabColor: 'Colore',
  tabUsers: 'Utenti',
  tabTesting: 'Test',
  testsSettingsHint: 'Inventario test delle Competenze Trasversali, mostrato come totalizzatore nella Home. Questi campi sono al momento modificabili manualmente e sono strutturati per essere sostituiti in futuro da una sincronizzazione API in tempo reale.',
  testsAcquiredLabel: 'Test acquistati',
  testsDispatchedLabel: 'Test erogati',
  testsRemainingLabel: 'Residui',
  testsUsedPct: (pct) => `${pct}% dei test acquistati è stato erogato`,
  toastTestsUpdated: 'Totali test aggiornati',
  tabSurvey: 'Survey',
  surveyLinkLabel: 'Link survey esterno',
  surveyLinkPh: 'https://…',
  surveyLinkHint: 'Slot di archiviazione per il link al survey esterno usato per raccogliere le risposte delle Competenze Trasversali. Non ancora utilizzato in nessun punto di questa dashboard — conservato qui come riferimento e per una futura integrazione.',
  toastSurveyLinkSaved: 'Link survey salvato',
  tabSoftTargets: 'Target Soft Skill',
  softTargetsHint: 'Punteggio atteso/target aziendale (1–10) per ciascuna soft skill, usato come base quando si aggiunge un nuovo dipendente — rispecchia il benchmark fisso di 6,5 usato per le Competenze Professionali. Le competenze prioritarie del ruolo ricevono +2 su questa base. I dipendenti già presenti mantengono i propri valori Atteso per singola competenza, modificabili dal modulo di valutazione delle Competenze Trasversali.',
  toastSoftTargetsSaved: 'Target delle soft skill aggiornati',
  interfaceLanguage: 'Lingua dell\'interfaccia',
  languageHint: 'Il cambio di lingua traduce istantaneamente le etichette, i menu, la tassonomia dei dati e le risposte dell\'Assistente AI. Alcune aree di testo libero scritte da te (come le note dell\'Analisi Iniziale) non vengono tradotte automaticamente.',
  tabFont: 'Carattere',
  moduleColorsLabel: 'Colori dei moduli',
  moduleSyncLabel: 'Usa un unico colore per entrambi i moduli',
  moduleBothHint: 'Si applica sia alle Competenze Trasversali che alle Competenze Professionali — badge, pulsanti e grafici in tutte le pagine.',
  accentLabel: 'Colore Competenze Trasversali',
  accentHint: 'Usato per i badge, i grafici, i pulsanti, i link e le evidenziazioni delle Competenze Trasversali in tutta l\'app. Si applica immediatamente, sia in modalità chiara che scura.',
  successLabel: 'Colore Competenze Professionali',
  successHint: 'Usato per i badge delle Competenze Professionali e per gli indicatori positivi/di successo (guadagni, spunte, stato "buono") in tutta l\'app.',
  resetToDefault: 'Ripristina predefinito',
  bgLabel: 'Colore di sfondo',
  bgHint: 'Lo sfondo della pagina dietro ogni schermata. Le card seguono automaticamente questo colore, a meno che tu non imposti un colore card personalizzato qui sotto.',
  surfaceLabel: 'Colore delle card',
  surfaceHint: 'Sfondo di card, pannelli e tabelle — indipendente dallo sfondo della pagina. Ripristina per far seguire di nuovo alle card il colore di sfondo.',
  textLabel: 'Colore del testo',
  textHint: 'Colore principale del testo in tutte le pagine. Le sfumature secondarie e attenuate si adattano automaticamente per restare leggibili.',
  fontLabel: 'Carattere dell\'interfaccia',
  fontHint: 'Cambia il carattere tipografico usato in tutta l\'app, in ogni pagina. Si applica immediatamente.',
  fontPreviewLabel: 'Anteprima',
  usersHint: 'Queste credenziali controllano chi può accedere a questa dashboard dalla schermata di login.',
  newUsername: 'Nuovo nome utente',
  newPassword: 'Nuova password',
  addUser: 'Aggiungi utente',
  atLeastOneUserTitle: 'Deve rimanere almeno un utente',
  toastAccentUpdated: 'Colore Competenze Trasversali aggiornato',
  toastAccentReset: 'Colore Competenze Trasversali ripristinato al valore predefinito',
  toastSuccessUpdated: 'Colore Competenze Professionali aggiornato',
  toastSuccessReset: 'Colore Competenze Professionali ripristinato al valore predefinito',
  toastModuleColorsReset: 'Colori dei moduli ripristinati al valore predefinito',
  toastBgUpdated: 'Colore di sfondo aggiornato',
  toastBgReset: 'Colore di sfondo ripristinato al valore predefinito',
  toastSurfaceUpdated: 'Colore delle card aggiornato',
  toastSurfaceReset: 'Colore delle card ripristinato al valore predefinito',
  toastTextUpdated: 'Colore del testo aggiornato',
  toastTextReset: 'Colore del testo ripristinato al valore predefinito',
  toastFontUpdated: 'Carattere dell\'interfaccia aggiornato',
  toastFontReset: 'Carattere dell\'interfaccia ripristinato al valore predefinito',
  toastLanguageIt: 'Lingua impostata su Italiano',
  toastLanguageEn: 'Lingua impostata su Inglese',
  toastEnterUserPass: 'Inserisci sia il nome utente che la password.',
  toastUserExists: 'Questo nome utente esiste già.',
  toastUserAdded: 'Utente aggiunto',
  toastUserRemoved: 'Utente rimosso',
  toastUserUpdated: 'Utente aggiornato',
  toastAtLeastOneUser: 'Deve rimanere almeno un utente.',
  confirmRemoveUser: (name) => `Rimuovere l'utente "${name}"?`,
  editUserTitle: 'Modifica utente',
  saveChanges: 'Salva modifiche',
  cancelEdit: 'Annulla',
  roleLabel: 'Ruolo',
  roleAdmin: 'Admin (accesso completo)',
  roleViewer: 'Visualizzatore (sola lettura)',
  toastAtLeastOneAdmin: 'Deve rimanere almeno un admin.',
  viewerReadOnly: 'Il tuo account è di sola lettura. Chiedi a un admin di apportare questa modifica.',
  evaluatorsTitle: 'Valutatori',
  evaluatorsHint: 'Le persone che effettuano le valutazioni Responsabile/Peer per le Competenze Professionali. Aggiungile qui, poi scegli chi ha valutato ciascun dipendente quando salvi una valutazione.',
  noEvaluators: 'Nessun valutatore ancora aggiunto.',
  newEvaluatorName: 'Nome valutatore',
  addEvaluator: 'Aggiungi valutatore',
  removeEvaluator: 'Rimuovi valutatore',
  confirmRemoveEvaluator: (name) => `Rimuovere il valutatore "${name}"? I dipendenti già valutati da questa persona manterranno i punteggi.`,
  toastEvaluatorAdded: 'Valutatore aggiunto',
  toastEvaluatorRemoved: 'Valutatore rimosso',
  toastEnterEvaluatorName: 'Inserisci il nome del valutatore.',
  toastEvaluatorExists: 'Questo valutatore è già presente nell\'elenco.',
  evaluatorNameLabel: 'Nome valutatore',
  evaluatorNamePh: 'Chi sta inserendo questa valutazione?',
  evaluatorEmailLabel: 'Email valutatore',
  evaluatorEmailPh: 'valutatore@azienda.com',
  evaluatorSelfNote: 'Autovalutazione — non serve un valutatore separato.',
  toastEnterEvaluatorFirst: 'Inserisci il nome di chi sta inserendo questa valutazione.',
  evalSendEmailBtn: 'Invia e-mail',
  evalEmailSubject: 'Il tuo link per la valutazione delle competenze',
  evalEmailBody: (name, link) => `Ciao ${name},\n\nTi è stata assegnata una valutazione sulla piattaforma Skill-Vision. Utilizza il link sicuro qui sotto per accedere esclusivamente alla scheda a te assegnata:\n\n${link}\n\nGrazie.`,
  toastNoEvaluatorEmail: 'Inserisci l\'email del valutatore prima di inviare.',
  evaluatedByPrefix: 'Valutato da',
  importButton: 'Importa Dati',
  importModalTitle: 'Importa Dati di Valutazione',
  importModalSub: 'Carica un file Excel esportato dall\'organigramma del cliente o dal workbook di valutazione APEX 5D',
  dzTitle: 'Trascina qui un file .xlsx o .ods',
  dzSub: 'oppure clicca per selezionarlo dai tuoi file',
  importCancel: 'Annulla',
  importConfirm: 'Conferma Importazione',
  importBack: 'Scegli un altro file',
  importReadError: 'Impossibile leggere questo file. Assicurati che sia un export .xlsx, .xls o .ods valido.',
  importNoSheets: 'Nessun foglio riconosciuto in questo file. Sono attesi fogli come "DATI SURVEY" / "ORGANIGRAMMA" (dati organizzativi) oppure "RESPONSABILE" / "PEER (Collega)" / "AUTOVALUTAZIONE" (punteggi di valutazione).',
  importPreviewTitle: 'Anteprima prima dell\'importazione',
  importAnagFound: (n, sheet) => `${n} ${n===1?'dipendente trovato':'dipendenti trovati'} nel foglio "${sheet}"`,
  importAnagNone: 'Nessun foglio di dati organizzativi rilevato',
  importAssessFound: (n) => `${n} ${n===1?'riga di valutazione trovata':'righe di valutazione trovate'} nei fogli di assessment`,
  importAssessNone: 'Nessun foglio di punteggi di valutazione rilevato',
  importAssessBySource: (resp, peer, auto) => `Responsabile: ${resp} · Peer: ${peer} · Autovalutazione: ${auto}`,
  importFallbackNote: 'Alcune colonne non corrispondevano a una domanda nota — sono state mappate nell\'ordine del foglio come stima (A1…E5). Verifica i punteggi importati.',
  importUnmappedNote: (n) => `${n} ${n===1?'colonna non è stata riconosciuta ed è stata ignorata':'colonne non sono state riconosciute e sono state ignorate'}.`,
  importSuccessToast: (created, updated, matched) => {
    const parts = [];
    if(created) parts.push(`${created} ${created===1?'nuovo dipendente':'nuovi dipendenti'}`);
    if(updated) parts.push(`${updated} ${updated===1?'dipendente aggiornato':'dipendenti aggiornati'}`);
    if(matched) parts.push(`${matched} ${matched===1?'valutazione importata':'valutazioni importate'}`);
    return parts.length ? ('Importazione completata: ' + parts.join(', ') + '.') : 'Importazione completata: nessun dato corrispondente trovato.';
  },
  importUnmatchedToast: (n) => `${n} ${n===1?'riga di valutazione non è stata abbinata a un dipendente esistente ed è stata saltata':'righe di valutazione non sono state abbinate a un dipendente esistente e sono state saltate'}.`,

  /* ---- HOME PAGE ---- */
  homeStatusTitle: 'Stato Generale dell\'Azienda',
  homeStatusSub: 'Sintesi esecutiva dei principali indicatori HR e delle priorità operative.',
  homeActiveFilter: 'Filtro Attivo:',
  homeSystemActive: 'Sistema Attivo',
  homeConfigActiveEyebrow: 'Configurazione Attiva',
  homeSwitchHint: 'Passa da un modulo all\'altro per aggiornare tutti gli indicatori sottostanti. Il <b>Valore Complessivo (A+B)</b> è disponibile solo quando entrambi i moduli sono attivi contemporaneamente.',
  homeModuleALabel: 'Competenze Trasversali',
  homeModuleBLabel: 'Competenze Professionali',
  homeModuleCompleteLabel: 'Completo (A + B)',
  homeKpiFeedback: 'Feedback da Erogare',
  homeKpiFeedbackSub: 'colloqui di restituzione segnalati',
  homeKpiTalent: 'Talenti (Top + da Valorizzare)',
  homeKpiTalentSub: (n) => `su ${n} dipendenti`,
  homeKpiRisk: 'Persone a Rischio',
  homeKpiRiskSub: 'da sviluppare o critiche',
  homeKpiAreas: 'Aree Monitorate',
  homeKpiAreasSub: 'funzioni aziendali registrate',
  homeTotalizerTitle: 'Utilizzo Test Competenze Trasversali',
  homeTotalizerSub: 'Test acquistati rispetto ai test erogati finora',
  homeCardExpandHint: 'Clicca per i dettagli',
  statusGood: 'Stato Positivo',
  statusModerate: 'Stato Moderato',
  statusBelow: 'Sotto Target',
  homeQ1Title: 'Stiamo andando bene o male?',
  homeQ1Sub: 'Indicatore generale dello stato delle competenze aziendali rispetto ai livelli attesi.',
  homeQ1Score: 'Punteggio Complessivo',
  homeQ1Coverage: 'Copertura Ruoli',
  homeQ1Gap: 'Benchmark Gap',
  homeQ1LevelAchieved: 'Livello di Competenza Raggiunto',
  homeQ1Green: 'Verde',
  homeQ1GreenSub: 'Livello Ottimale',
  homeQ1Yellow: 'Giallo',
  homeQ1YellowSub: 'Livello Moderato',
  homeQ1Red: 'Rosso',
  homeQ1RedSub: 'Livello Critico',
  homeQ2Title: 'Dove sta il problema?',
  homeQ2CriticalIssues: (n) => `${n} Criticità`,
  homeQ2Sub: 'Analisi delle principali criticità per aree, ruoli, competenze e gap.',
  homeQ2MostCriticalArea: 'Area più Critica',
  homeQ2RoleAtRisk: 'Ruolo a Rischio',
  homeQ2WeakestCompetency: 'Competenza più Debole',
  homeQ2Gap: (v) => `Gap ${v}`,
  homeQ2SevereGapLabel: 'Dipendenti con gap severo:',
  homeQ2People: (n) => `${n} persone`,
  homeQ2ViewDetail: 'Vedi Analisi Dettagliata →',
  homeQ3Title: 'Chi crea valore e chi crea rischio?',
  homeQ3ResourceMapping: 'Mappatura Risorse',
  homeQ3Sub: 'Individuazione e categorizzazione delle risorse chiave aziendali.',
  homeQ3OpenMatrix: 'Apri Matrice Valore Complessivo →',
  quadHighPotential: 'Alto Potenziale',
  quadReadyToGrow: 'Pronti a crescere',
  quadHighValue: 'Alto Valore',
  quadOperationalPillars: 'Pilastri operativi',
  quadCritical: 'Critici',
  quadUrgentAction: 'Azione urgente necessaria',
  quadAtRisk: 'A Rischio',
  quadNeedsSupport: 'Necessita supporto',
  homeQ4Title: 'Cosa dobbiamo fare subito?',
  homeQ4AiPriorities: 'Priorità AI',
  homeQ4Sub: 'Elenco generato automaticamente delle azioni prioritarie per ottimizzare il capitale umano.',
  homeQ4RealTime: 'Suggerimenti generati in tempo reale',
  homeQ4Export: 'Esporta Piano d\'Azione →',
  azioniTraining: 'Formazione',
  azioniTrainingDesc: (skill) => `Colma il gap su "${skill}"`,
  azioniCoaching: 'Coaching',
  azioniCoachingDesc: 'Accelera la crescita dei dipendenti ad alto potenziale',
  azioniReorgShort: 'Riorganizzazione',
  azioniReorgFull: 'Sostituzioni / Riorganizzazioni',
  azioniReorgDesc: 'Valuta il ruolo o la posizione',
  azioniTalentShort: 'Talento',
  azioniTalentFull: 'Valorizzazione Talenti',
  azioniTalentDesc: 'Piani di retention e crescita di carriera',
  worstSkillFallback: 'competenze chiave',
  exportPlanCsvHeader: 'Priorità;Descrizione;Dipendenti Coinvolti',
  toastActionPlanExported: 'Piano d\'azione esportato',
  tierModalNoEmpTitle: 'Nessun dipendente in questa fascia',
  tierModalNoEmpDesc: 'Nessun dipendente rientra attualmente in questa categoria.',
  tierModalCount: (n) => `${n} dipendenti`,
  btnClose: 'Chiudi',

  /* ---- ANAGRAFICA RISORSE ---- */
  anagAddEmployee: 'Aggiungi Dipendente',
  anagListTitle: 'Elenco Dipendenti',
  anagListSub: 'Anagrafica completa della popolazione dipendenti registrata. Clicca una riga per aprire il profilo del dipendente.',
  anagSearchPh: 'Cerca per nome o email…',
  anagSortLastName: 'Ordina: Cognome A-Z',
  anagSortArea: 'Ordina: Area',
  anagSortScore: 'Ordina: Punteggio',
  anagRoleSkillsTitle: 'Competenze trasversali richieste per ruolo',
  anagRoleSkillsSub: 'Censisci i ruoli aziendali, seleziona le soft skills richieste per il ciascun ruolo e associa i valori attesi',
  anagSelectRole: 'Seleziona ruolo',
  roleCensusTitle: 'Censimento dei ruoli aziendali',
  roleCensusSub: 'Crea i ruoli e configura le soft skill richieste per ciascuno, con la stessa logica di pesatura usata nel Recruiting.',
  createRoleBtn: 'Crea ruolo',
  newRoleTitleLabel: 'Titolo del ruolo',
  newRoleTitlePh: 'Es. Sales Account Manager',
  newRoleSaveBtn: 'Salva ruolo',
  toastEnterRoleTitle: 'Inserisci prima un titolo del ruolo',
  toastRoleCreated: 'Ruolo creato',
  toastRoleDuplicate: 'Esiste già un ruolo con questo titolo',
  weightEssenziale: 'Essenziale',
  weightImportante: 'Importante',
  weightUtile: 'Utile',
  weightNone: 'Non selezionata',
  rcEssenzialiLabel: 'Essenziali',
  rcImportantiLabel: 'Importanti',
  rcUtiliLabel: 'Utili',
  rcExpectedLabel: 'Valore atteso',
  rcNoRoleSelected: 'Seleziona o crea un ruolo per configurarne le soft skill.',
  /* ---- LINK SURVEY (invio del link al questionario esterno Competenze Trasversali) ---- */
  linkSurveyBtn: 'Link survey',
  linkSurveyHint: 'Invia il link del questionario ai dipendenti',
  surveyLinkModalTitle: 'Invia link del questionario',
  surveyLinkModalSub: 'Seleziona i dipendenti a cui inviare il questionario di valutazione delle Competenze Trasversali.',
  surveyNoLinkConfiguredTitle: 'Nessun link survey configurato',
  surveyNoLinkConfiguredBody: 'Configura il link al survey esterno in Impostazioni → Survey prima di inviarlo ai dipendenti.',
  surveyOpenSettingsBtn: 'Apri Impostazioni',
  surveySenderLabel: 'Invia da',
  surveySenderReferenteOption: (name,email) => `Referente aziendale${name?' — '+name:''} ${email?`<${email}>`:'(email non configurata — impostala in Dati Aziendali)'}`,
  surveySenderAdminOption: (email) => `Admin Skill-Vision ${email?`<${email}>`:'(email non configurata — impostala in Impostazioni → Survey)'}`,
  surveySenderMissingWarning: 'Il mittente selezionato non ha ancora un indirizzo email configurato. Impostalo prima di inviare.',
  surveySelectAllLabel: 'Seleziona tutti',
  surveyColName: 'Nome e Cognome',
  surveyColEmail: 'E-mail aziendale',
  surveyNoEmailBadge: 'Email mancante',
  surveyInviaBtn: 'Invia link',
  toastSelectAtLeastOneEmployeeSurvey: 'Seleziona almeno un dipendente a cui inviare il survey.',
  toastSurveyLinkMissing: 'Configura prima il link al survey esterno in Impostazioni → Survey.',
  toastSurveySenderMissing: 'Configura l\'email del mittente prima di inviare.',
  toastSurveySent: (n) => `Bozza email aperta nel tuo client di posta per ${n} dipendente${n===1?'':'i'}. Controlla e invia da lì.`,
  toastSurveySkippedNoEmail: (n) => `${n} dipendente${n===1?'':'i'} selezionat${n===1?'o':'i'} escluso${n===1?'':'i'} — email non presente in anagrafica.`,
  emailApiSectionTitle: 'Servizio di invio email',
  emailApiSectionHint: 'Endpoint per un\'API di invio email in produzione (un tuo backend, oppure un servizio come SendGrid/Postmark/SES dietro un piccolo proxy). Necessario perché "Invia link" invii davvero le email — senza, non viene inviato nulla e l\'app lo segnala chiaramente.',
  emailApiEndpointLabel: 'URL endpoint API',
  emailApiEndpointPh: 'https://tuo-backend.esempio.com/api/send-survey-emails',
  emailApiKeyLabel: 'Chiave/token API (opzionale)',
  emailApiKeyPh: 'Inviata come Bearer token, se presente',
  emailApiKeyHint: 'Salvata solo localmente in questo browser, esattamente come le altre impostazioni di questa pagina — questa app non ha un proprio server.',
  toastSurveyApiNotConfigured: 'Nessun servizio di invio email ancora configurato. Imposta l\'endpoint API in Impostazioni → Survey, oppure usa il fallback manuale con le bozze email qui sotto.',
  toastSurveySending: (n) => `Invio a ${n} dipendente${n===1?'':'i'} in corso…`,
  toastSurveySendAllOk: (n) => `${n} email inviat${n===1?'a':'e'} con successo.`,
  toastSurveySendAllFailed: 'Invio fallito — il servizio email non ha confermato la consegna per nessun destinatario.',
  toastSurveyApiError: (msg) => `Impossibile raggiungere il servizio email: ${msg}`,
  surveySendResultsTitle: 'Risultati invio',
  surveySendResultsSub: (ok,fail) => `${ok} inviat${ok===1?'a':'e'} con successo, ${fail} fallit${fail===1?'a':'e'}.`,
  surveySendResultsOkLabel: 'Inviata',
  surveySendResultsFailLabel: 'Fallita',
  surveyMailtoFallbackBtn: 'Apri bozze email (mailto)',
  surveyMailtoFallbackHint: 'Nessun servizio email collegato. Questo apre una finestra di composizione per destinatario nel tuo client di posta — l\'invio va comunque confermato da te. Non è un invio automatico.',
  toastSurveyMailtoOpened: (n) => `Bozz${n===1?'a aperta':'e aperte'} nel tuo client di posta per ${n} destinatari${n===1?'o':''}.`,
  surveySenderMode: 'Configurazione mittente',
  surveySenderModeReferente: 'Referente aziendale',
  surveySenderModeAdmin: 'Admin Skill-Vision',
  adminSenderEmailLabel: 'Email admin Skill-Vision',
  adminSenderEmailPh: 'admin@skill-vision.it',
  surveyEmailSubjectLabel: 'Email questionario — oggetto',
  surveyEmailBodyLabel: 'Email questionario — testo',
  surveyEmailTemplateHint: 'Modello modificabile usato per l\'invio del link al questionario. {{NOME}} e {{LINK}} vengono sostituiti per ciascun dipendente. Il testo definitivo sarà fornito dal cliente — sostituisci il testo segnaposto qui sotto non appena disponibile.',
  preTestLetterLabel: 'Lettera di accompagnamento obbligatoria ("Lettera ai Collaboratori")',
  preTestLetterHint: 'Inviata a ogni collaboratore prima della breve nota qui sopra, insieme al link del questionario. Usa {{LINK}} nel punto in cui deve comparire il link — se lo rimuovi, viene comunque aggiunto in fondo automaticamente.',
  anagAllAreas: 'Tutte le aree',
  anagColEmployee: 'Dipendente',
  anagColEmail: 'Email',
  anagColArea: 'Area',
  anagColDepartment: 'Reparto',
  anagColRole: 'Ruolo',
  anagColDuties: 'Mansioni',
  anagColGender: 'Genere',
  anagColLevel: 'Livello (CCNL)',
  anagColRal: 'RAL',
  anagColBenefit: 'Benefit',
  anagColSoftAssigned: 'Soft Skill assegnate',
  anagArchive: 'Archivia',
  anagRestore: 'Ripristina',
  anagShowArchived: 'Mostra archiviati',
  anagNoArchivedFound: 'Nessun dipendente archiviato',
  anagShowing: (a,b,total) => `Visualizzazione ${a}–${b} di ${total} dipendenti`,
  anagPageOf: (p,total) => `Pagina ${p} di ${total}`,
  anagNoEmployeesFound: 'Nessun dipendente trovato',
  anagAdjustFilters: 'Modifica i filtri di ricerca o aggiungi un nuovo dipendente.',
  addEmpFirstName: 'Nome',
  addEmpLastName: 'Cognome',
  addEmpEmail: 'Email Aziendale',
  addEmpArea: 'Area',
  addEmpAreaPh: 'Es. Area Vendite',
  addEmpDept: 'Reparto',
  addEmpDeptPh: 'Es. Regione Nord',
  addEmpRole: 'Ruolo (Job/Role Mapping)',
  addEmpRolePh: 'Es. Account Manager',
  addEmpRoleEmptyOption: '— Seleziona un ruolo —',
  addEmpNoRolesHint: 'Nessun ruolo configurato. Apri "Competenze trasversali richieste per ruolo" e crea un ruolo prima di registrare un dipendente.',
  toastSelectRoleFirst: 'Seleziona un ruolo prima di registrare il dipendente.',
  addEmpDuties: 'Mansioni Svolte',
  addEmpDutiesPh: 'Breve descrizione delle attività quotidiane',
  genderLabel: 'Sesso',
  genderUnspecified: 'Preferisco non specificare',
  genderFemale: 'Femminile',
  genderMale: 'Maschile',
  genderOther: 'Altro',
  ccnlLevelLabel: 'Livello CCNL',
  ccnlLevelPh: 'Es. Impiegato 3° livello',
  ralLabel: 'RAL (Retribuzione Annua Lorda)',
  ralPh: 'Es. 32000',
  benefitLabel: 'Benefit riconosciuti',
  benefitPh: 'Es. Buoni pasto, auto aziendale',
  contractTypeLabel: 'Tipo Rapporto',
  contractTypeDipendente: 'Dipendente (forza lavoro)',
  contractTypeCocopro: 'Co.co.co.',
  contractTypePartitaIva: 'Partita IVA',
  contractTypeEsterno: 'Esterno / outsourcing',
  scheduledAbsencesLabel: 'Assenze programmate',
  absenceFromLabel: 'Dal',
  absenceToLabel: 'Al',
  absenceReasonLabel: 'Motivo',
  absenceReasonPh: 'Es. Ferie estive',
  noScheduledAbsences: 'Nessuna assenza programmata',
  addAbsenceBtn: 'Aggiungi assenza',
  removeAbsenceBtn: 'Rimuovi assenza',
  addEmpNote: 'Il dipendente viene creato con il profilo atteso di Competenze Trasversali previsto per il ruolo selezionato (classificazione Essenziale/Importante/Utile e valore atteso, dal censimento dei ruoli). Le Competenze Professionali e i punteggi ottenuti partono da 0 finché i valutatori non inseriscono valutazioni reali dai moduli Competenze Trasversali e Competenze Professionali.',
  profileRoleExpectedTitle: 'Profilo atteso per il ruolo',
  profileRoleExpectedSub: (role) => `Competenze trasversali richieste per "${role}" — classificazione e valore atteso, come definiti nel censimento dei ruoli.`,
  addEmpModalTitle: 'Nuovo Dipendente',
  addEmpModalSub: 'Inserisci i dati anagrafici e organizzativi',
  toastEnterNameFirst: 'Inserisci almeno nome e cognome.',
  toastEmployeeAdded: 'Dipendente aggiunto',
  editProfileBtn: 'Modifica',
  toastProfileUpdated: 'Profilo aggiornato',
  archiveModalTitle: 'Archivia Dipendente',
  archiveModalSub: (name) => `Archiviare ${name} lo rimuove dall'elenco attivo mantenendo l'intero storico delle valutazioni.`,
  archiveReasonFieldLabel: 'Motivo',
  archiveReasonPensione: 'Pensione',
  archiveReasonLicenziamento: 'Licenziamento',
  archiveReasonProbation: 'Non superamento periodo di prova',
  archiveReasonAltro: 'Altro',
  archiveOtherLabel: 'Specifica',
  archiveOtherPh: 'Motivo dell\'archiviazione',
  archiveConfirmBtn: 'Archivia',
  toastArchiveOtherRequired: 'Inserisci un motivo prima di archiviare.',
  toastEmployeeArchived: 'Dipendente archiviato',
  toastEmployeeRestored: 'Dipendente ripristinato',
  profileArchivedBanner: (reason,date) => `Archiviato — ${reason} (${date})`,

  /* ---- PROFILO AZIENDA ---- */
  companyPageTitle: 'Profilo Azienda',
  companyPageSub: 'Sedi, contatti, organico per tipologia e ruoli chiave aziendali.',
  companyHeadcountTitle: 'Totale dipendenti per tipologia',
  companyHeadcountSub: 'Calcolato automaticamente dall\'Anagrafica Risorse. Clicca su una voce per vedere i dipendenti che la compongono.',
  companyHeadcountBreakdownTitle: (label) => `Dipendenti — ${label}`,
  companyHeadcountBreakdownEmpty: 'Nessun dipendente registrato in questa categoria.',
  companyHeadcountDipendenti: 'Dipendenti (forza lavoro)',
  companyHeadcountCocopro: 'Co.co.co.',
  companyHeadcountPartitaIva: 'Partita IVA',
  companyHeadcountEsterni: 'Esterni / outsourcing',
  companyLocationsTitle: 'Sedi',
  companyLocationsSub: 'Sedi e uffici aziendali.',
  companyLocationNameLabel: 'Nome sede',
  companyLocationAddressLabel: 'Indirizzo',
  companyLocationCityLabel: 'Città',
  companyAddLocationBtn: 'Aggiungi sede',
  companyRemoveLocationBtn: 'Rimuovi',
  companyNoLocations: 'Nessuna sede registrata.',
  companyContactsTitle: 'Contatti',
  companyContactsSub: 'Contatti aziendali generali.',
  companyContactLabelLabel: 'Ruolo / etichetta',
  companyContactNameLabel: 'Nome',
  companyContactEmailLabel: 'Email',
  companyContactPhoneLabel: 'Telefono',
  companyAddContactBtn: 'Aggiungi contatto',
  companyRemoveContactBtn: 'Rimuovi',
  companyNoContacts: 'Nessun contatto registrato.',
  companyKeyRolesTitle: 'Ruoli chiave aziendali',
  companyKeyRolesSub: 'Referente aziendale, CEO e CFO.',
  companyReferenteLabel: 'Referente aziendale',
  companyCeoLabel: 'CEO',
  companyCfoLabel: 'CFO',
  companyNameLabel: 'Nome',
  companyEmailLabel: 'Email',
  companyPhoneLabel: 'Telefono',
  companySaveBtn: 'Salva profilo azienda',
  toastCompanySaved: 'Profilo azienda salvato.',

  /* ---- ANALISI INIZIALE ---- */
  analisiFieldProblematiche: 'Problematiche percepite',
  analisiFieldCriticita: 'Criticità rilevate',
  analisiFieldObiettivi: 'Obiettivi del progetto',
  analisiFieldAspettative: 'Aspettative del management',
  analisiNotDocumented: 'Non ancora documentato.',
  analisiPageTitle: 'Analisi iniziale del progetto',
  analisiPageSub: 'Fotografia della situazione di partenza raccolta insieme al management.',
  analisiEditingNote: 'Stai modificando questa sezione — ricordati di salvare le modifiche.',
  analisiClickEditNote: 'Clicca "Modifica" in alto per aggiornarla in qualsiasi momento.',
  analisiEditBtn: 'Modifica',
  analisiSaveBtn: 'Salva',
  toastAnalisiSaved: 'Analisi iniziale salvata',

  /* ---- CONDIVISE (usate in Competenze Trasversali/Professionali/Valore Complessivo) ---- */
  newEvaluation: 'Nuova Valutazione',
  colArea: 'Area',
  colRole: 'Ruolo',
  colEmployee: 'Dipendente',
  colObtained: 'Ottenuto',
  colExpected: 'Atteso',
  colGap: 'Gap',
  colGapVsExpected: 'Gap vs Atteso',
  colScore: 'Punteggio',
  colCompetency: 'Competenza',
  colDimension: 'Dimensione',
  colOverallScore: 'Punteggio complessivo',
  chartObtained: 'Ottenuto',
  chartExpected: 'Atteso',
  legendHighest: 'Il più alto nella riga',
  legendLowest: 'Il più basso nella riga',
  legendAligned: 'Allineato (sovrapposizione)',
  toastFirstAddEmployee: 'Aggiungi prima un dipendente nell\'Anagrafica Risorse.',
  btnSaveEvaluation: 'Salva valutazione',
  noEmployeesTitle: 'Nessun dipendente',
  noEmployeesDesc: 'Aggiungi un dipendente nell\'Anagrafica Risorse.',
  matchUpTo5: 'Confronto (fino a 5)',
  toastMaxMatch: 'Massimo 5 dipendenti nel confronto.',

  /* ---- COMPETENZE TRASVERSALI (MODULO A) ---- */
  softTabOrg: 'Panoramica aziendale',
  softTabArea: 'Per area',
  softTabAlfa: 'Ordine alfabetico',
  softTabIndividuale: 'Individuale',
  softTabRanking: 'Classifica',
  softClusterAvgTitle: 'Punteggio medio per cluster di competenze',
  softClusterAvgNote: 'Il badge di ciascuna card mostra lo scostamento rispetto al valore ATTESO medio configurato per i ruoli aziendali.',
  softBigFiveOrgTitle: 'Profilo Big Five aggregato (azienda)',
  softWorstSkillsTitle: 'Soft skill con il gap maggiore rispetto all\'atteso',
  softAreaEmpCount: (n) => `(${n} dipendenti)`,
  softColLastName: 'Cognome',
  softColFirstName: 'Nome',
  softSelectEmployee: 'Seleziona dipendente',
  softBigFiveProfile: 'Profilo Big Five',
  softSummaryTitle: 'Sintesi',
  softOverallScoreLabel: (att) => `Punteggio soft skill complessivo (atteso ${att})`,
  softAllSkillsDetail: 'Dettaglio di tutte le 35 soft skill',
  softSortByScore: 'Ordina per Punteggio',
  softSortByGap: 'Ordina per Gap',
  softSelectUpTo5: 'Seleziona fino a 5 dipendenti da confrontare',
  softAddToComparison: '+ Aggiungi dipendente al confronto…',
  softNoEmpSelectedTitle: 'Nessun dipendente selezionato',
  softNoEmpSelectedDesc: 'Aggiungi almeno 2 dipendenti per avviare il confronto.',
  softEvalEmployeeLabel: 'Dipendente da valutare',
  softEvalModalTitle: 'Nuova Valutazione — Competenze Trasversali',
  softEvalModalSub: 'Inserisci il punteggio ottenuto e atteso (1–10, decimali ammessi, es. 6.3) per ogni soft skill',
  toastSoftEvalSaved: 'Valutazione soft skill salvata',

  /* ---- COMPETENZE PROFESSIONALI (MODULO B) ---- */
  hardProtocolNote: 'Scala 1–10: 1-2 Non Adeguato · 3-4 In Sviluppo · 5-6 Adeguato · 7-8 Avanzato · 9-10 Eccellente.',
  evalByManagerPrefix: 'Responsabile',
  evalByPeerPrefix: 'Peer',
  evalBySelfPrefix: 'Auto',
  hardMultiSourceTitle: 'Confronto multi-fonte per dimensione',
  hardApex5dProfile: 'Profilo APEX 5D',
  hardOverallApexLabel: 'Punteggio APEX 5D complessivo (media delle 3 fonti)',
  hardColDimension: 'Dimensione APEX 5D',
  hardColManager: 'Responsabile',
  hardColPeer: 'Peer',
  hardColSelf: 'Autovalutazione',
  hardColOverallAvg: 'Media Complessiva',
  hardColLevel: 'Livello',
  hardApexScoreRow: 'PUNTEGGIO APEX 5D',
  hardApexScoreCol: 'Punteggio APEX 5D',
  hardGapAnalysisTitle: 'Analisi del gap percettivo (delta tra le fonti di valutazione)',
  hardColGapMgrSelf: 'Gap Responsabile–Auto',
  hardColGapPeerSelf: 'Gap Peer–Auto',
  hardColGapMgrPeer: 'Gap Responsabile–Peer',
  hardColInterpretation: 'Interpretazione',
  hardEvaluateeLabel: 'Valutato — dipendente da valutare',
  hardEvaluatorSourceLabel: 'Valutatore — fonte di valutazione',
  hardItemsNote: 'Ogni voce è valutata da 1 a 10. La colonna <b>Atteso</b> mostra il target aziendale (6,5) usato come benchmark in tutte le Competenze Professionali.',
  hardEvalModalTitle: 'Nuova Valutazione — Competenze Professionali (APEX 5D)',
  hardEvalModalSub: '25 voci su 5 dimensioni · Scala 1–10',
  hardDimensionPrefix: 'Dimensione',
  hardExpChip: 'Att. 6,5',
  toastHardEvalSaved: (sourceLabel) => `Valutazione APEX 5D salvata (${sourceLabel})`,

  /* ---- SCHERMATA VALUTATORE CON LINK RISERVATO ---- */
  reInvalidLinkTitle: 'Link non valido',
  reInvalidLinkDesc: 'Questo link di valutazione non è valido, è scaduto oppure l\'assegnazione non esiste più. Contatta chi te lo ha inviato per ottenere un nuovo link.',
  reThankYouTitle: 'Grazie — valutazione inviata',
  reThankYouDesc: (date) => `La tua valutazione è stata registrata${date ? ' il ' + date : ''}. Ora puoi chiudere questa pagina.`,
  reFormTitle: 'Valutazione APEX 5D',
  reFormDesc: (name, sourceLabel) => `Stai completando una valutazione di tipo ${sourceLabel} per ${name}. Valuta ogni voce da 1 (basso) a 10 (alto).`,
  reSubmitBtn: 'Invia valutazione',
  reDefaultPeriodLabel: 'Periodo corrente',

  /* ---- GESTIONE VALUTAZIONI ADMIN (MODULO B) ---- */
  evalManagerBtn: 'Gestione Valutazioni',
  evalManagerTitle: 'Gestione Valutazioni',
  evalManagerSub: 'Assegna i template Responsabile / Peer / Autovalutazione e genera i link per i valutatori',
  evalSentLabel: 'Inviate',
  evalReceivedLabel: 'Ricevute',
  evalAssignTitle: 'Nuova assegnazione',
  evalTemplateLabel: 'Template',
  evalPeriodLabel: 'Periodo',
  evalNewPeriodLabel: 'Nuovo periodo',
  evalNewPeriodPh: 'Es. Revisione Q1 2027',
  evalAddPeriodBtn: 'Aggiungi periodo',
  evalTargetsLabel: 'Dipendenti da valutare',
  evalCreateBtn: 'Crea assegnazione/i',
  evalAssignmentsListTitle: 'Tutte le assegnazioni',
  evalColTarget: 'Dipendente',
  evalColTemplate: 'Template',
  evalColEvaluator: 'Valutatore',
  evalColPeriod: 'Periodo',
  evalColStatus: 'Stato',
  evalStatusCompleted: 'Completata',
  evalStatusPending: 'In attesa',
  evalCopyLinkBtn: 'Copia link',
  evalMarkDoneBtn: 'Segna completata',
  evalNoAssignments: 'Nessuna assegnazione ancora.',
  evalLinkTrustNote: 'Questi dati esistono solo in questo browser (nessun server), quindi il link funziona solo se aperto in questo stesso browser — ad es. una nuova scheda qui, oppure condiviso con un collega che usa questo stesso computer/profilo condiviso. Non funzionerà da un altro dispositivo. Non sostituisce un vero sistema di distribuzione autenticato.',
  evalLinkModalTitle: 'Link per il valutatore',
  evalBreakdownTitle: 'Riepilogo valutazioni',
  toastEnterPeriodLabel: 'Inserisci un\'etichetta per il nuovo periodo.',
  toastPeriodAdded: 'Periodo aggiunto',
  toastSelectAtLeastOneTarget: 'Seleziona almeno un dipendente da valutare.',
  toastAssignmentsCreated: (n) => `${n} ${n===1?'assegnazione creata':'assegnazioni create'}`,
  toastLinkCopied: 'Link copiato negli appunti',
  toastAssignmentMarkedDone: 'Assegnazione segnata come completata',
  confirmDeleteAssignment: 'Eliminare questa assegnazione? I punteggi già inviati non verranno rimossi.',

  /* ---- MONITORAGGIO GAP LONGITUDINALE ---- */
  longiTitle: 'Gap / Miglioramento nel Tempo',
  longiDesc: 'Confronta due periodi di valutazione per questo dipendente, per ogni dimensione APEX. Si popola automaticamente man mano che i valutatori completano le assegnazioni dalla Gestione Valutazioni.',
  longiNotEnoughData: 'Dati non ancora sufficienti — questo dipendente necessita di valutazioni completate in almeno due periodi diversi per mostrare un andamento.',
  longiPeriodA: 'Periodo A',
  longiPeriodB: 'Periodo B',
  longiDeltaCol: 'Delta',

  /* ---- VALORE COMPLESSIVO (MODULO A + B) ---- */
  valoreSubBoth: 'Integrazione di Competenze Trasversali + Competenze Professionali',
  valoreSubAOnly: 'Solo Competenze Trasversali',
  valoreSubBOnly: 'Solo Competenze Professionali',
  valoreExportCsv: 'Esporta CSV',
  valoreScatterTitle: 'Classifica per Valore Complessivo',
  valoreBubbleSizeNote: 'Dipendenti ordinati per punteggio complessivo, colore del punto = fascia di performance',
  valoreTierDistTitle: 'Distribuzione dei punteggi per classificazione',
  valoreOnlyModuleNote: (moduleLabel) => `Solo ${moduleLabel} è attivo, quindi l'indice sottostante riflette solo quel modulo. Attiva entrambi i moduli dalla barra laterale per calcolare il Valore Complessivo combinato (50/50).`,
  valoreModuleALabel: 'Competenze Trasversali',
  valoreModuleBLabel: 'Competenze Professionali',
  valoreClassificationTitle: 'Classi di performance',
  valoreIndexBoth: '50% Competenze Trasversali + 50% Competenze Professionali',
  valoreIndexAOnly: 'Solo punteggio Competenze Trasversali',
  valoreIndexBOnly: 'Solo punteggio Competenze Professionali',
  valoreIndexNote: (indexDesc) => `Indice = ${indexDesc}. Soglie: Top Talent ≥8,3 · Talento da Valorizzare ≥7,0 · Persona Adeguata ≥5,5 · Persona da Sviluppare ≥4,0 · Critica &lt;4,0.`,
  valoreMatrixTitle: 'Matrice di classificazione',
  valoreMatrixSub: '— dipendenti raggruppati per fascia',
  valoreByEmployeeTitle: 'Valore complessivo per dipendente',
  colSoftA: 'Trasversali (A)',
  colHardB: 'Professionali (B)',
  colCombined: 'Combinato',
  colClassification: 'Classificazione',
  valoreAxisHard: 'Classifica Dipendenti',
  valoreAxisSoft: 'Punteggio Valore Complessivo',
  csvHeaderValore: 'Cognome;Nome;Area;Ruolo;Trasversali;Professionali;Combinato;Classificazione',

  /* ---- SCHEDA PROFILO DIPENDENTE ---- */
  profileEmployeeType: 'Dipendente',
  profileDebriefPending: 'Colloquio in sospeso',
  profileEmailLabel: 'Email:',
  profileDeptLabel: 'Reparto:',
  profileDutiesLabel: 'Mansioni:',
  profileModuleATitle: 'Competenze Trasversali',
  profileObtainedExpected: (att) => `/10 ottenuto &nbsp;·&nbsp; atteso ${att}`,
  profileTop3Strengths: 'Top 3 punti di forza',
  profileDevAreas: 'Aree di sviluppo',
  profileModuleBTitle: 'APEX 5D — Competenze Professionali',
  profileOverallApexScoreLine: '/10 punteggio APEX 5D complessivo',
  profileLastAssessmentLabel: 'Data ultima rilevazione',
  profileNoAssessmentYet: 'Nessuna valutazione ancora completata',
  profilePrevAssessmentsBtn: 'Precedenti valutazioni',
  prevAssessModalTitle: (name) => `Precedenti valutazioni · Competenze Professionali — ${name}`,
  prevAssessModalSub: 'Storico delle valutazioni completate e confronto tra periodi.',
  prevAssessModalTitleSoft: (name) => `Precedenti valutazioni · Competenze Trasversali — ${name}`,
  prevAssessModalSubSoft: 'Storico delle valutazioni completate delle competenze trasversali.',
  prevAssessColDate: 'Data',
  prevAssessColPeriod: 'Periodo',
  prevAssessLatestBadge: 'Più recente',
  reportBtn: 'Scarica report',
  toastReportOpening: 'Apertura della finestra di stampa — scegli "Salva come PDF" per scaricare.',
  toastNoReportData: 'Nessuna valutazione completata — niente da riportare.',
  reportTitle: 'Report di Valutazione',
  reportProvisionalNote: 'Report dati provvisorio generato dalla piattaforma. Il modello grafico definitivo sarà fornito dall\'azienda incaricata dell\'elaborazione dei risultati — questa pagina è un segnaposto funzionale, non il design definitivo.',
  reportGeneratedOn: (d) => `Generato il ${d}`,
  reportEmployeeInfoTitle: 'Dipendente',
  reportSectionHistory: 'Storico valutazioni',
  /* ---- Importazione risultati di valutazione esterni (selettore periodo Excel + integrazione PDF) ---- */
  importAssessPeriodLabel: 'Assegna i risultati importati al periodo',
  sourceLabelImportXlsx: 'Importazione massiva Excel',
  sourceLabelExternalPdf: 'PDF esterno (importato)',
  importPdfHint: 'Hai invece un PDF risultati fornito da un\'azienda esterna?',
  importPdfLinkLabel: 'Importa da PDF',
  pdfImportModalTitle: 'Importa risultato di valutazione da PDF',
  pdfImportModalSub: 'Anteprima architetturale — il parsing reale del PDF non è ancora collegato. Leggi la nota qui sotto.',
  pdfImportNotReadyNote: 'L\'estrazione automatica dei dati dal PDF non è ancora implementata: l\'azienda esterna non ha ancora fornito un PDF di esempio né la struttura dei suoi campi/etichette, e questa applicazione non ne presuppone una. Una volta fornito quel campione, il passaggio di estrazione qui sotto potrà essere implementato senza modificare nient\'altro in questo flusso. Nel frattempo puoi validare il resto della pipeline (identificazione del dipendente, salvataggio di un nuovo record storico, aggiornamento del profilo) inserendo manualmente valori già noti.',
  pdfImportDzTitle: 'Seleziona un file PDF',
  pdfImportDzSub: 'Il file viene letto, ma il suo contenuto non viene ancora analizzato (vedi nota sopra)',
  pdfImportReading: 'Lettura del file…',
  pdfImportUnsupportedNote: (name) => `"${name}" è stato letto, ma l'estrazione automatica non è ancora disponibile per questo formato. Inserisci i valori manualmente qui sotto per continuare.`,
  pdfImportManualTitle: 'Inserimento manuale (valori già estratti)',
  pdfImportManualSub: 'Usa questa sezione per registrare un risultato che hai già ricevuto dal report esterno, per dimensione APEX 5D (1–10).',
  pdfImportSubmitBtn: 'Salva risultato di valutazione',
  toastPdfImportNoMatch: 'Nessun dipendente corrisponde a questa email o nome.',
  toastPdfImportMissingScores: 'Inserisci un punteggio (1–10) per ogni dimensione.',
  toastPdfImportSaved: (name) => `Risultato di valutazione salvato per ${name}.`,
  prevAssessColSource: 'Origine',
  tagMgr: 'Resp',
  tagPeer: 'Peer',
  tagSelf: 'Auto',
  profileFeedbackDevPlanTitle: 'Feedback e Piano di Sviluppo',
  profileSaveFeedbackBtn: 'Salva feedback e piano',
  toastFeedbackUpdated: 'Feedback aggiornato',

  /* ---- CAMPI PIANO DI SVILUPPO (condivisi: scheda profilo + pagina Feedback) ---- */
  devPlanAzioniLabel: 'Azioni di Miglioramento',
  devPlanAzioniPh: 'Azioni concrete per colmare i gap individuati…',
  devPlanFormazioneLabel: 'Formazione',
  devPlanFormazionePh: 'Corsi, certificazioni, percorsi di apprendimento…',
  devPlanCoachingLabel: 'Coaching',
  devPlanCoachingPh: 'Mentoring, coaching individuale, affiancamento…',
  devPlanObiettiviLabel: 'Obiettivi Futuri',
  devPlanObiettiviPh: 'Obiettivi per il prossimo ciclo di valutazione…',
  feedbackSwitchLabel: 'Colloquio di restituzione necessario',

  /* ---- PAGINA FEEDBACK E PIANO DI SVILUPPO ---- */
  feedbackPageTitle: 'Feedback e Piano di Sviluppo',
  feedbackPageSub: 'Per ogni dipendente: se è necessario un colloquio di restituzione e un piano di sviluppo strutturato.',
  btnSave: 'Salva',
  toastSaved: 'Salvato',

  /* ---- ASSISTENTE AI ---- */
  aiQAreeCritiche: 'Quali aree aziendali hanno i gap più critici?',
  aiQPromotionReady: 'Mostrami i Top Talent pronti per la promozione.',
  aiQUrgentTraining: 'Chi ha bisogno di interventi formativi urgenti?',
  aiQSoftSkillsSummary: 'Genera una sintesi dello stato generale delle Competenze Trasversali.',
  aiQAndamento: 'Come sta andando l\'azienda nel complesso?',
  aiQAreeCriticheShort: 'Quali sono le aree più critiche?',
  aiQTopTalent: 'Chi sono i Talenti da valorizzare?',
  aiQRischio: 'Chi rappresenta un rischio per l\'organizzazione?',
  aiQGapCompetenze: 'Quali competenze hanno il gap maggiore?',
  aiQRanking: 'Qual è la classifica completa dei dipendenti?',
  aiQFormazione: 'Quali priorità formative suggerisci?',
  aiQColloqui: 'Quante persone hanno bisogno di un colloquio di restituzione?',
  aiQAree: 'Come sono distribuiti i dipendenti per area?',
  aiQBigFive: 'Qual è il profilo Big Five aggregato dell\'azienda?',
  aiQuickQuestions: 'Domande rapide',
  aiMoreQuestions: 'Altre domande',
  aiInputPh: 'Chiedi informazioni su dati aziendali, ruoli, competenze o classifiche…',
  aiSendBtn: 'Invia',
  aiGreeting: 'Ciao, sono l\'assistente della dashboard di Valutazione delle Competenze. Chiedimi informazioni su dati aziendali, ruoli, competenze, gap o classifiche — ad esempio come sta andando un\'area, chi sono i talenti migliori o chi ha bisogno di formazione. Usa i pulsanti con le domande rapide a sinistra, oppure scrivi una domanda libera qui sotto.',

  /* ---- ASSISTENTE AI: modelli di risposta locale ---- */
  aiThinkingMsg: 'Sto analizzando i dati…',
  aiCantInterpretMsg: 'Non sono riuscito a interpretare la risposta. Prova a riformulare la domanda oppure usa i pulsanti suggeriti.',
  aiCantReachMsg: 'Al momento non riesco a raggiungere il motore di linguaggio naturale. Prova a riformulare la domanda usando parole come "aree", "gap", "classifica", "rischio", "formazione", oppure usa i pulsanti suggeriti a sinistra.',
  aiRelInLine: 'in linea con',
  aiRelSlightlyBelow: 'leggermente sotto',
  aiRelBelow: 'sotto',
  aiAndamentoTemplate: (avgScore, scoreLabel, rel, benchmark, talentCount, total, riskCount, feedbackDue) =>
    `Il punteggio medio aziendale (${scoreLabel}) è ${avgScore}/10, ${rel} il benchmark interno di ${benchmark}.\nTalenti (Top + da valorizzare): ${talentCount} su ${total}.\nPersone a rischio (da sviluppare + critiche): ${riskCount}.\nColloqui di debrief segnalati: ${feedbackDue}.`,
  aiAreeCriticheIntro: 'Le aree con il punteggio medio più basso sono:',
  aiAreeCriticheLine: (rank, area, avgVal, count) => `${rank}. ${area} — media ${avgVal}/10 (${count} dipendenti)`,
  aiTopTalentIntro: 'Dipendenti ad alto valore:',
  aiNoTopTalent: 'Al momento nessun dipendente rientra nelle classi Top Talent o Talento da Valorizzare con i dati attuali.',
  aiRischioIntro: 'Dipendenti che richiedono attenzione:',
  aiNoRischio: 'Al momento nessun dipendente rientra nelle classi critica o da sviluppare.',
  aiDebriefFlaggedSuffix: ' · debrief segnalato',
  aiSoftGapIntro: 'Soft skill con il gap medio maggiore rispetto all\'atteso:',
  aiSoftGapLine: (name, ottenuto, atteso, gap) => `• ${name}: ottenuto ${ottenuto} contro atteso ${atteso} (Δ ${gap})`,
  aiHardGapIntro: 'Dimensioni APEX 5D più deboli:',
  aiHardGapLine: (name, avgVal) => `• ${name}: media ${avgVal}/10`,
  aiNoModuleForGap: 'Attiva almeno un modulo per analizzare i gap di competenza.',
  aiRankingIntro: (scoreLabel) => `Classifica (${scoreLabel}):`,
  aiFormazioneIntro: 'Priorità operative suggerite:',
  aiColloquiIntro: (count) => `${count} dipendenti necessitano di un colloquio di debrief:`,
  aiNoColloqui: 'Al momento nessun colloquio di debrief è segnalato.',
  aiAreeLine: (area, count, avgVal) => `• ${area}: ${count} dipendenti — punteggio medio ${avgVal}/10`,
  aiNoModuleA: 'Attiva le Competenze Trasversali per calcolare il profilo Big Five aggregato.',
  aiBigFiveIntro: 'Profilo Big Five aggregato dell\'azienda:',
  aiNoPromotion: 'Al momento nessun dipendente raggiunge la classe Top Talent (≥8,3/10), quindi nessuno è ancora segnalato come pronto per la promozione.',
  aiPromotionIntro: 'Top Talent pronti per la promozione (punteggio ≥8,3/10):',
  aiNoUrgentTraining: 'Al momento nessun dipendente richiede formazione urgente: tutti sono a un livello adeguato o superiore.',
  aiUrgentTrainingIntro: (count) => `${count} dipendenti necessitano di un intervento formativo urgente (classe Da Sviluppare o Critica):`,
  aiWorstCompetencyLine: (name, gap) => `\n\nLa competenza con il gap più ampio a livello aziendale è "${name}" (Δ ${gap}) — un buon punto di partenza per un piano formativo.`,
  aiNoEmployeesSoft: 'Non sono ancora stati registrati dipendenti, quindi non ci sono dati Soft Skills da riepilogare.',
  aiSoftSummaryTemplate: (overall, count, clusterLines, worst) =>
    `Stato generale Soft Skills: media ${overall}/10 su ${count} dipendenti.\n\nPer cluster:\n${clusterLines}\n\nSoft skill con il gap maggiore rispetto all\'atteso:\n${worst}`,

  /* ---- VARIE / MESSAGGI DI SISTEMA ---- */
  toastDataSaved: 'Dati salvati',
  toastSaveError: 'Errore di salvataggio: i dati sono mantenuti solo per questa sessione.',
  toastAtLeastOneModule: 'Deve rimanere attivo almeno un modulo.',
  toastEnableModule: 'Attiva il modulo corrispondente per accedere a questa sezione.',
  methodologyModalTitle: 'Note metodologiche',
  methodologyModalSub: 'Come vengono calcolati gli indicatori di questa dashboard',
  methodologyGotIt: 'Capito',
  methodologyDataShown: '<b>Dati mostrati:</b> questa istanza contiene dati demo generati automaticamente (nomi, punteggi e valutazioni sono fittizi) per mostrare la dashboard già popolata e funzionante. Sostituiscili con dati reali dalla sezione Anagrafica Risorse e con le valutazioni compilate per Competenze Trasversali e Competenze Professionali.',
  methodologyModuleA: '<b>Competenze Trasversali — Big Five:</b> ciascuna delle 35 soft skill del protocollo SKILL-VISION è associata a una delle 5 dimensioni Big Five (Apertura, Coscienziosità, Estroversione, Amicalità, Stabilità Emotiva) secondo una mappatura interna sviluppata da SKILL-VISION; il punteggio per dimensione è la media dei punteggi ottenuti sulle competenze associate.',
  methodologyModuleB: '<b>Competenze Professionali — APEX 5D:</b> ciascuna dimensione (Professionalità, Performance, Attitudine, Mindset, Potenziale) è calcolata come media di 5 voci, per ciascuna delle 3 fonti di valutazione (Responsabile, Peer, Autovalutazione). La Media Complessiva è la media semplice delle 3 fonti; il Punteggio APEX 5D è la media delle 5 Medie Complessive.',
  methodologyOverall: '<b>Valore Complessivo:</b> quando entrambi i moduli sono attivi, l\'indice combinato è la media semplice (50/50) tra il punteggio delle Competenze Trasversali e quello delle Competenze Professionali. Le soglie di classificazione (Top Talent, Talento da Valorizzare, Persona Adeguata, Persona da Sviluppare, Persona Critica) sono configurate su una scala 1–10 e possono essere ricalibrate in base ai benchmark del cliente.',
  methodologyStorage: '<b>Archiviazione dati:</b> le informazioni inserite in questa dashboard (anagrafica dipendenti, valutazioni, analisi iniziale, feedback) sono condivise tra tutti coloro che aprono lo stesso strumento — utile per far collaborare Responsabili, Peer e HR sullo stesso set di dati, ma da tenere presente prima di inserire informazioni riservate.',
  confirmResetDemo: 'Questo sostituirà TUTTI i dati attuali (anagrafica dipendenti, valutazioni, analisi iniziale, feedback) con un nuovo set di dati demo. Continuare?',
  evaluatorNameExamplePh: 'Es. Marco Rossi',
  gapAligned: 'Percezioni allineate',
  gapModerate: 'Gap moderato',
  gapSignificant: 'Gap significativo',

  /* ---- LOGICA CUSTOMER CARE ---- */
  ccEyebrow: 'CUSTOMER CARE',
  ccPageTitle: 'Logica competenze Customer Care',
  ccPageSub: 'Carico ticket, soddisfazione e competenze alla base della qualità del servizio Customer Care.',
  ccDemoNote: 'I dati operativi (ticket, tempo di risposta, CSAT) sono dati demo simulati; le competenze degli agent provengono dalle valutazioni Soft Skills.',
  ccTabOverview: 'Panoramica Ticket & CSAT',
  ccTabAgents: 'Competenze Agent',
  ccTabMatrix: 'Matrice di Assistenza',
  ccExportCsv: 'Esporta CSV',
  ccNoAgentsTitle: 'Nessun agent Customer Care',
  ccNoAgentsDesc: "Aggiungi risorse nell'area Customer Service dall'Anagrafica.",
  ccKpiFrt: 'Tempo di prima risposta',
  ccKpiFrtSub: 'Media, prima risposta a un ticket',
  ccKpiCsat: 'Indice CSAT',
  ccKpiCsatSub: 'Soddisfazione media del cliente',
  ccKpiVolume: 'Volume ticket',
  ccKpiVolumeSub: 'Gestiti negli ultimi 30 giorni',
  ccKpiMatch: 'Tasso di match competenze',
  ccKpiMatchSub: 'Competenza ottenuta vs attesa',
  ccDeltaVsPrev: 'vs periodo precedente',
  ccDeltaVsTarget: 'vs obiettivo',
  ccUnitMin: ' min',
  ccTrendTitle: 'CSAT e risoluzione ticket — ultime 8 settimane',
  ccTrendCsat: 'CSAT %',
  ccTrendResolved: 'Ticket risolti',
  ccWeekPrefix: 'Sett.',
  ccAgentTableTitle: 'Performance e competenze degli agent',
  ccColAgent: 'Agent',
  ccColTickets: 'Ticket',
  ccColFrt: 'Prima risposta',
  ccColCsat: 'CSAT',
  ccColResolution: 'Tasso di risoluzione',
  ccColMatch: 'Match competenze',
  ccColOverall: 'Media competenze CC',
  ccAgentsChartTitle: 'Match competenze per agent',
  ccMatrixTitle: 'Matrice di copertura assistenza',
  ccMatrixSub: 'Competenze Customer Care × agent',
  ccMatrixNote: 'Ogni cella è il punteggio ottenuto; il colore segnala lo scostamento rispetto al valore atteso per il ruolo.',
  ccMatrixColCompetency: 'Competenza',
  ccMatrixColOrgAvg: 'Media team',
  ccMatrixStrong: 'Forte (≥ 8)',
  ccMatrixToDevelop: 'Da sviluppare (< 6)',
};
let UI = UI_IT;

function applyChromeLanguage(){
  document.querySelectorAll('.login-brand .t2, .sidebar-brand .t2').forEach(el => el.textContent = UI.brandTagline);
  const modPill = document.getElementById('module-pill-label-text'); if(modPill) modPill.textContent = UI.activeModules;
  const pA = document.getElementById('pill-A-label'); if(pA) pA.textContent = UI.moduleASoft;
  const pB = document.getElementById('pill-B-label'); if(pB) pB.textContent = UI.moduleBHard;
  const lu = document.getElementById('login-label-username'); if(lu) lu.textContent = UI.loginUsername;
  const lp = document.getElementById('login-label-password'); if(lp) lp.textContent = UI.loginPassword;
  const lr = document.getElementById('login-label-remember'); if(lr) lr.textContent = UI.loginRememberMe;
  const lf = document.getElementById('loginForgotPassword'); if(lf) lf.textContent = UI.loginForgotPassword;
  const ls = document.getElementById('login-submit-btn'); if(ls) ls.textContent = UI.loginSignIn;
  const lui = document.getElementById('loginUsername'); if(lui) lui.placeholder = UI.loginUsernamePh;
  const lpi = document.getElementById('loginPassword'); if(lpi) lpi.placeholder = UI.loginPasswordPh;
  const ib = document.getElementById('import-data-btn'); if(ib) ib.innerHTML = ICONS.upload + UI.importButton;
  updateLangToggleBtn();
  if(typeof STATE !== 'undefined' && STATE) updateSidebarFooter();
}

// Always-visible topbar language toggle (Section 1 fix): unlike the Settings modal, this control is
// never gated behind canEdit(), so viewer-role users — who have no access to Settings at all — can
// still switch Italiano/English. Settings' own language dropdown (renderLanguageSettings) stays as a
// secondary entry point for admins and shares the same handleLanguageChange() handler.
function updateLangToggleBtn(){
  const btn = document.getElementById('lang-toggle-btn');
  if(!btn) return;
  const current = safeStorage.get(LANG_KEY) || 'it';
  btn.innerHTML = ICONS.globe + `<span style="margin-left:5px; font-weight:700; font-size:11px;">${current.toUpperCase()}</span>`;
}
function toggleLanguageQuick(){
  const current = safeStorage.get(LANG_KEY) || 'it';
  handleLanguageChange(current==='it' ? 'en' : 'it');
}

// Reassigns every bilingual taxonomy/config binding and re-renders the whole app in the chosen language.
// AREAS_CONFIG (employee area/role names) is intentionally excluded: those strings are stored as literal
// values on each employee record and used as object keys elsewhere, so translating them would break
// lookups against already-generated demo data.
function applyLanguageData(lang){
  const isIt = lang === 'it';
  UI = isIt ? UI_IT : UI_EN;
  NAV_CONFIG = isIt ? NAV_CONFIG_IT : NAV_CONFIG_EN;
  SOFT_SKILLS = isIt ? SOFT_SKILLS_IT : SOFT_SKILLS_EN;
  SOFT_CLUSTERS = isIt ? SOFT_CLUSTERS_IT : SOFT_CLUSTERS_EN;
  BIGFIVE_DIMS = isIt ? BIGFIVE_DIMS_IT : BIGFIVE_DIMS_EN;
  APEX5D_DIMENSIONS = isIt ? APEX5D_DIMENSIONS_IT : APEX5D_DIMENSIONS_EN;
  APEX_SOURCES = isIt ? APEX_SOURCES_IT : APEX_SOURCES_EN;
  LEVEL_ANCHORS = isIt ? LEVEL_ANCHORS_IT : LEVEL_ANCHORS_EN;
  TIER_DEFS = isIt ? TIER_DEFS_IT : TIER_DEFS_EN;
  PAGE_META = buildPageMeta(lang);
  applyChromeLanguage();
  if(typeof STATE !== 'undefined' && STATE){
    renderNav();
    const meta = PAGE_META[CURRENT_PAGE];
    const titleEl = document.getElementById('page-title');
    const subEl = document.getElementById('page-sub');
    if(meta){
      if(titleEl) titleEl.textContent = meta.title;
      if(subEl) subEl.textContent = meta.sub;
    }
    rerenderCurrentPage();
  }
}

/* ---------------------- SETTINGS: login users (add/remove) ---------------------- */
const USERS_KEY = 'sv_users';
let EDITING_USER_INDEX = null;
// Role model: 'admin' (full access) or 'viewer' (read-only: no editing, no import, no settings).
// Users saved before roles existed have no `role` field — normalized to 'admin' on every read so
// existing accounts keep their original full access.
let CURRENT_USER_ROLE = 'admin';
const CURRENT_USER_KEY = 'sv_current_user';
function canEdit(){ return CURRENT_USER_ROLE !== 'viewer'; }
function applyRolePermissions(){
  const ib = document.getElementById('import-data-btn'); if(ib) ib.style.display = canEdit() ? '' : 'none';
  const sb = document.getElementById('settings-btn'); if(sb) sb.style.display = canEdit() ? '' : 'none';
  const pA = document.getElementById('pill-A'); if(pA) pA.style.pointerEvents = canEdit() ? '' : 'none';
  const pB = document.getElementById('pill-B'); if(pB) pB.style.pointerEvents = canEdit() ? '' : 'none';
}
function loadUsers(){
  try{
    const raw = safeStorage.get(USERS_KEY);
    if(raw){
      const arr = JSON.parse(raw);
      if(Array.isArray(arr) && arr.length) return arr.map(u => ({ username: u.username, password: u.password, role: u.role === 'viewer' ? 'viewer' : 'admin' }));
    }
  }catch(e){}
  const seed = [{ username:'Roberto', password:'ADVISOR2026', role:'admin' }];
  safeStorage.set(USERS_KEY, JSON.stringify(seed));
  return seed;
}
function saveUsers(list){ safeStorage.set(USERS_KEY, JSON.stringify(list)); }

/* ---------------------- ICONS (minimal stroke SVGs) ---------------------- */
const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.6-3.6 3.3-6 6.5-6s5.9 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.6"/><path d="M15.7 14.2c2.5.4 4.4 2.5 4.8 5.3"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h3"/></svg>',
  soft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7"/></svg>',
  hard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"/><path d="M3 7.5V16l9 4.5 9-4.5V7.5"/><path d="M7.5 9.75v6.5M16.5 9.75v6.5"/></svg>',
  value: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M8.5 9.3c0-1.3 1.3-2.3 3-2.3s3.2 1 3.2 2.4c0 3.1-6.7 1.6-6.7 4.8 0 1.4 1.4 2.4 3.5 2.4s3.5-1 3.5-2.4"/></svg>',
  feedback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11.5h8M8 8.2h5.5"/></svg>',
  ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5l2.6-1.5M17.2 9l2.6-1.5"/><circle cx="12" cy="12" r="4.2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13m0 0-4.5-4.5M12 16l4.5-4.5"/><path d="M4.5 18.5v1a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2 5.3M20 6v5h-5"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>',
  alertTriangle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l1.8 5.6L19.4 9l-5.6 1.8L12 16l-1.8-5.2L4.6 9l5.6-1.4L12 2z"/><path d="M19 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9 .9-2.6z"/></svg>',
  award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5.5"/><path d="M8.5 13 7 21l5-2.5L17 21l-1.5-8"/></svg>',
  alertCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><path d="M12 16.5h.01"/></svg>',
  userX: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="8" r="3.5"/><path d="M2.5 20c.7-3.8 3.6-6.3 7.5-6.3s6.8 2.5 7.5 6.3"/><path d="M17 8l4 4M21 8l-4 4"/></svg>',
  checkSquare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12l2.5 2.5L16 9"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4.5 19.5 9.5 8 21H3v-5L14.5 4.5Z"/><path d="M12.5 6.5l5 5"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106a1.53 1.53 0 0 1-.947 2.287c-1.561.379-1.561 2.6 0 2.978a1.53 1.53 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.53 1.53 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.53 1.53 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.53 1.53 0 0 1 .947-2.287c1.561-.378 1.561-2.6 0-2.978a1.53 1.53 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.53 1.53 0 0 1-2.287-.947z"/><circle cx="10" cy="10" r="3"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9s1.3-6.3 3.8-9Z"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.9-.5-1.4 0-1.1.9-2 2-2h1.5c1.9 0 3.5-1.6 3.5-3.5C20 6.6 16.4 3 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="9.5" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/></svg>',
  font: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
  userGear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.7-3.8 3.4-6.3 6.5-6.3 1 0 1.9.2 2.8.7"/><circle cx="18" cy="17.5" r="3"/><path d="M18 15v-1M18 20v-1M15.8 16.2l-.9-.5M20.9 18.8l-.9-.5M15.8 18.8l-.9.5M20.9 16.2l-.9.5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V3m0 0-4.5 4.5M12 3l4.5 4.5"/><path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/></svg>',
  fileSpreadsheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M8 12h8M8 15.5h8M8 19h5"/></svg>',
  headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 13.5A1.5 1.5 0 0 1 5.5 12H7a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 16.5Z"/><path d="M20 13.5a1.5 1.5 0 0 0-1.5-1.5H17a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1.5a1.5 1.5 0 0 0 1.5-1.5Z"/><path d="M20 17v1.5a3.5 3.5 0 0 1-3.5 3.5H12"/></svg>',
};

/* ---------------------- NAVIGATION CONFIGURATION ---------------------- */
const NAV_CONFIG_EN = [
  { type:'link', id:'home', label:'Home', icon:'home', requires:null },
  { type:'link', id:'company', label:'Company Data', icon:'users', requires:null },
  { type:'link', id:'analisi', label:'Initial Project Analysis', icon:'notes', requires:null },
  { type:'link', id:'anagrafica', label:'Employee Directory', icon:'users', requires:null },
  { type:'group', groupId:'results', label:'Results', icon:'soft', items:[
    { id:'soft', label:'Soft Skills', requires:'A' },
    { id:'hard', label:'Hard Skills', requires:'B' },
  ]},
  { type:'link', id:'valore', label:'Overall Value', icon:'value', requires:null },
  { type:'link', id:'customercare', label:'Customer Care Logic', icon:'headset', requires:null },
  { type:'link', id:'feedback', label:'Feedback & Development Plan', icon:'feedback', requires:null, badge:true },
  { type:'link', id:'ai', label:'AI Assistant', icon:'ai', requires:null },
  { type:'action', id:'methodology', label:'Methodology Notes', icon:'notes', action:'openMethodologyModal' },
  { type:'section', label:'Admin Tools', editOnly:true },
  { type:'action', id:'import', label:'Resource Data Upload', icon:'upload', action:'openImportModal', editOnly:true },
  { type:'action', id:'reset', label:'Reset Demo', icon:'refresh', action:'confirmResetDemo', editOnly:true },
];
const NAV_CONFIG_IT = [
  { type:'link', id:'home', label:'Home', icon:'home', requires:null },
  { type:'link', id:'company', label:'Dati Aziendali', icon:'users', requires:null },
  { type:'link', id:'analisi', label:'Analisi Iniziale del Progetto', icon:'notes', requires:null },
  { type:'link', id:'anagrafica', label:'Anagrafica', icon:'users', requires:null },
  { type:'group', groupId:'results', label:'Risultati', icon:'soft', items:[
    { id:'soft', label:'Competenze Trasversali', requires:'A' },
    { id:'hard', label:'Competenze Professionali', requires:'B' },
  ]},
  { type:'link', id:'valore', label:'Valori Complessivi', icon:'value', requires:null },
  { type:'link', id:'customercare', label:'Logica Customer Care', icon:'headset', requires:null },
  { type:'link', id:'feedback', label:'Feedback e Piano di Sviluppo', icon:'feedback', requires:null, badge:true },
  { type:'link', id:'ai', label:'Assistenza AI', icon:'ai', requires:null },
  { type:'action', id:'methodology', label:'Note Metodologiche', icon:'notes', action:'openMethodologyModal' },
  { type:'section', label:'Strumenti Amministrazione', editOnly:true },
  { type:'action', id:'import', label:'Caricamento Dati Risorse', icon:'upload', action:'openImportModal', editOnly:true },
  { type:'action', id:'reset', label:'Reset Demo', icon:'refresh', action:'confirmResetDemo', editOnly:true },
];
let NAV_CONFIG = NAV_CONFIG_IT;

/* ---------------------- TAXONOMY — 35 SOFT SKILLS (Module A) ----------------------
   Source: SOFT SKILLS AND SUB-FACTORS — 5 clusters, per the SKILL-VISION protocol */
const SOFT_SKILLS_EN = [
  // PERSONAL COMPETENCIES
  {id:'ps1', name:'Altruism at Work', cluster:'Personal Competencies', dim:'A'},
  {id:'ps2', name:'Self-Control', cluster:'Personal Competencies', dim:'S'},
  {id:'ps3', name:'Autonomy', cluster:'Personal Competencies', dim:'C'},
  {id:'ps4', name:'Self-Confidence', cluster:'Personal Competencies', dim:'S'},
  {id:'ps5', name:'Flexibility/Adaptability', cluster:'Personal Competencies', dim:'O'},
  {id:'ps6', name:'Work Dedication', cluster:'Personal Competencies', dim:'C'},
  {id:'ps7', name:'Innovation', cluster:'Personal Competencies', dim:'O'},
  {id:'ps8', name:'Emotional Intelligence', cluster:'Personal Competencies', dim:'A'},
  {id:'ps9', name:'Motivation and Personal Effectiveness', cluster:'Personal Competencies', dim:'C'},
  {id:'ps10', name:'Persistence', cluster:'Personal Competencies', dim:'C'},
  {id:'ps11', name:'Precision and Discipline', cluster:'Personal Competencies', dim:'C'},
  {id:'ps12', name:'Stress Resistance', cluster:'Personal Competencies', dim:'S'},
  {id:'ps13', name:'Sensitivity Training', cluster:'Personal Competencies', dim:'A'},
  // ACHIEVEMENT COMPETENCIES
  {id:'re1', name:'Attention to Detail', cluster:'Achievement Competencies', dim:'C'},
  {id:'re2', name:'Goal Achievement', cluster:'Achievement Competencies', dim:'C'},
  {id:'re3', name:'Controlling', cluster:'Achievement Competencies', dim:'C'},
  {id:'re4', name:'Information Management', cluster:'Achievement Competencies', dim:'C'},
  {id:'re5', name:'Results/Commitment', cluster:'Achievement Competencies', dim:'C'},
  {id:'re6', name:'Initiative', cluster:'Achievement Competencies', dim:'E'},
  // SOCIAL COMPETENCIES
  {id:'so1', name:'Cooperation', cluster:'Social Competencies', dim:'A'},
  {id:'so2', name:'Customer Experience', cluster:'Social Competencies', dim:'A'},
  {id:'so3', name:'Customer Orientation', cluster:'Social Competencies', dim:'A'},
  {id:'so4', name:'Social Orientation', cluster:'Social Competencies', dim:'E'},
  {id:'so5', name:'Relationship Sensitivity', cluster:'Social Competencies', dim:'A'},
  // INFLUENCING COMPETENCIES
  {id:'in1', name:'Communication', cluster:'Influencing Competencies', dim:'E'},
  {id:'in2', name:'Influence and Persuasion', cluster:'Influencing Competencies', dim:'E'},
  {id:'in3', name:'Leadership', cluster:'Influencing Competencies', dim:'E'},
  // MANAGERIAL COMPETENCIES
  {id:'ma1', name:'Decision Making', cluster:'Managerial Competencies', dim:'C'},
  {id:'ma2', name:'Delegation', cluster:'Managerial Competencies', dim:'E'},
  {id:'ma3', name:'Directing', cluster:'Managerial Competencies', dim:'E'},
  {id:'ma4', name:'Analytical Thinking', cluster:'Managerial Competencies', dim:'O'},
  {id:'ma5', name:'Planning and Organization', cluster:'Managerial Competencies', dim:'C'},
  {id:'ma6', name:'Problem Solving', cluster:'Managerial Competencies', dim:'O'},
  {id:'ma7', name:'Strategy', cluster:'Managerial Competencies', dim:'O'},
  {id:'ma8', name:'Teamwork', cluster:'Managerial Competencies', dim:'A'},
];
const SOFT_SKILLS_IT = [
  // COMPETENZE PERSONALI
  {id:'ps1', name:'Altruismo sul lavoro', cluster:'Competenze Personali', dim:'A'},
  {id:'ps2', name:'Autocontrollo', cluster:'Competenze Personali', dim:'S'},
  {id:'ps3', name:'Autonomia', cluster:'Competenze Personali', dim:'C'},
  {id:'ps4', name:'Fiducia in se stessi', cluster:'Competenze Personali', dim:'S'},
  {id:'ps5', name:'Flessibilità/Adattabilità', cluster:'Competenze Personali', dim:'O'},
  {id:'ps6', name:'Dedizione al lavoro', cluster:'Competenze Personali', dim:'C'},
  {id:'ps7', name:'Innovazione', cluster:'Competenze Personali', dim:'O'},
  {id:'ps8', name:'Intelligenza emotiva', cluster:'Competenze Personali', dim:'A'},
  {id:'ps9', name:'Motivazione ed efficacia personale', cluster:'Competenze Personali', dim:'C'},
  {id:'ps10', name:'Persistenza', cluster:'Competenze Personali', dim:'C'},
  {id:'ps11', name:'Precisione e disciplina', cluster:'Competenze Personali', dim:'C'},
  {id:'ps12', name:'Resistenza allo stress', cluster:'Competenze Personali', dim:'S'},
  {id:'ps13', name:'Formazione sulla sensibilità', cluster:'Competenze Personali', dim:'A'},
  // COMPETENZE DI REALIZZAZIONE
  {id:'re1', name:'Attenzione ai dettagli', cluster:'Competenze di Realizzazione', dim:'C'},
  {id:'re2', name:'Conseguimento degli obiettivi', cluster:'Competenze di Realizzazione', dim:'C'},
  {id:'re3', name:'Controllo', cluster:'Competenze di Realizzazione', dim:'C'},
  {id:'re4', name:'Gestione delle informazioni', cluster:'Competenze di Realizzazione', dim:'C'},
  {id:'re5', name:'Risultati/Impegno', cluster:'Competenze di Realizzazione', dim:'C'},
  {id:'re6', name:'Spirito di iniziativa', cluster:'Competenze di Realizzazione', dim:'E'},
  // COMPETENZE SOCIALI
  {id:'so1', name:'Cooperazione', cluster:'Competenze Sociali', dim:'A'},
  {id:'so2', name:'Esperienza del cliente', cluster:'Competenze Sociali', dim:'A'},
  {id:'so3', name:'Orientamento al cliente', cluster:'Competenze Sociali', dim:'A'},
  {id:'so4', name:'Orientamento sociale', cluster:'Competenze Sociali', dim:'E'},
  {id:'so5', name:'Sensibilità verso le relazioni', cluster:'Competenze Sociali', dim:'A'},
  // COMPETENZE DI INFLUENZA
  {id:'in1', name:'Comunicazione', cluster:'Competenze di Influenza', dim:'E'},
  {id:'in2', name:'Influenza e persuasione', cluster:'Competenze di Influenza', dim:'E'},
  {id:'in3', name:'Leadership', cluster:'Competenze di Influenza', dim:'E'},
  // COMPETENZE MANAGERIALI
  {id:'ma1', name:'Prendere decisioni', cluster:'Competenze Manageriali', dim:'C'},
  {id:'ma2', name:'Delega', cluster:'Competenze Manageriali', dim:'E'},
  {id:'ma3', name:'Direzione', cluster:'Competenze Manageriali', dim:'E'},
  {id:'ma4', name:'Pensiero analitico', cluster:'Competenze Manageriali', dim:'O'},
  {id:'ma5', name:'Pianificazione e organizzazione', cluster:'Competenze Manageriali', dim:'C'},
  {id:'ma6', name:'Risoluzione dei problemi', cluster:'Competenze Manageriali', dim:'O'},
  {id:'ma7', name:'Strategia', cluster:'Competenze Manageriali', dim:'O'},
  {id:'ma8', name:'Lavoro di squadra', cluster:'Competenze Manageriali', dim:'A'},
];
let SOFT_SKILLS = SOFT_SKILLS_IT;
const SOFT_CLUSTERS_EN = ['Personal Competencies','Achievement Competencies','Social Competencies','Influencing Competencies','Managerial Competencies'];
const SOFT_CLUSTERS_IT = ['Competenze Personali','Competenze di Realizzazione','Competenze Sociali','Competenze di Influenza','Competenze Manageriali'];
let SOFT_CLUSTERS = SOFT_CLUSTERS_IT;

const BIGFIVE_DIMS_EN = {
  O: {key:'O', label:'Openness', short:'Openness'},
  C: {key:'C', label:'Conscientiousness', short:'Conscient.'},
  E: {key:'E', label:'Extraversion', short:'Extrav.'},
  A: {key:'A', label:'Agreeableness', short:'Agreeabl.'},
  S: {key:'S', label:'Emotional Stability', short:'Stability'},
};
const BIGFIVE_DIMS_IT = {
  O: {key:'O', label:'Apertura Mentale', short:'Apertura'},
  C: {key:'C', label:'Coscienziosità', short:'Coscienz.'},
  E: {key:'E', label:'Estroversione', short:'Estrov.'},
  A: {key:'A', label:'Amicalità', short:'Amicalità'},
  S: {key:'S', label:'Stabilità Emotiva', short:'Stabilità'},
};
let BIGFIVE_DIMS = BIGFIVE_DIMS_IT;
const BIGFIVE_ORDER = ['O','C','E','A','S'];

/* ---------------------- TAXONOMY — APEX 5D (Module B) ----------------------
   Source: COMPETENZE PROFESSIONALI Assessment.xlsx — SKILL-VISION S.r.l. Protocol
   5 dimensions x 5 items, multi-source evaluation (Manager / Peer / Self-assessment) */
const APEX5D_DIMENSIONS_EN = [
  { code:'A', name:'Professionalism', desc:'Technical skills, knowledge, tools, decisions', items:[
    {cod:'A1', area:'Technical Skills', q:'To what extent does the employee possess and apply the technical skills required by their role?'},
    {cod:'A2', area:'Process Knowledge', q:'How well do they know the processes, procedures, and company policies relevant to their function?'},
    {cod:'A3', area:'Use of Tools', q:'How effectively do they use the tools, software, and technologies required for the role?'},
    {cod:'A4', area:'Decisions and Communication', q:'How effective are they at making well-founded decisions and communicating them clearly?'},
    {cod:'A5', area:'Knowledge Creation and Sharing', q:'To what extent do they generate new knowledge and transfer it to the team?'},
  ]},
  { code:'B', name:'Performance', desc:'Measurable goals, quality, deadlines, autonomy', items:[
    {cod:'B1', area:'Meeting Deadlines and Goals', q:'How often and how reliably does the employee meet assigned deadlines?'},
    {cod:'B2', area:'Quality of Work', q:'To what extent does the work produced meet or exceed the company\'s quality standards?'},
    {cod:'B3', area:'Contribution to Team Goals', q:'To what extent do they actively contribute to achieving collective goals?'},
    {cod:'B4', area:'Operational Autonomy', q:'How capable are they of working independently without requiring constant supervision?'},
    {cod:'B5', area:'Professional Growth and Development', q:'To what extent do they show concrete commitment to improving their skills?'},
  ]},
  { code:'C', name:'Aptitude', desc:'Adaptability, flexibility, continuous learning', items:[
    {cod:'C1', area:'Adaptability to Change', q:'How effectively do they adapt to organizational, role, or process changes?'},
    {cod:'C2', area:'Workload and Stress Management', q:'How do they handle situations of high workload or pressure?'},
    {cod:'C3', area:'Continuous Learning', q:'How quickly and thoroughly do they acquire new skills and procedures?'},
    {cod:'C4', area:'Problem Solving and Creativity', q:'How effective are they at identifying problems and finding innovative solutions?'},
    {cod:'C5', area:'Role Flexibility', q:'To what extent are they willing and able to take on functions different from their usual role?'},
  ]},
  { code:'D', name:'Mindset', desc:'Engagement, motivation, relationships, contribution', items:[
    {cod:'D1', area:'Commitment and Dedication to the Role', q:'How much consistent commitment and ownership of their responsibilities do they show?'},
    {cod:'D2', area:'Contribution to Company Goals', q:'To what extent do their actions concretely contribute to achieving company goals?'},
    {cod:'D3', area:'Active Participation', q:'With what quality do they participate in meetings, initiatives, and company projects?'},
    {cod:'D4', area:'Motivation and Mission Orientation', q:'How much intrinsic motivation and alignment with the company culture and mission do they show?'},
    {cod:'D5', area:'Interpersonal Relationships and Climate', q:'How effectively do they build positive relationships and contribute to a healthy work climate?'},
  ]},
  { code:'E', name:'Potential', desc:'Improvability, feedback, self-development, new technologies', items:[
    {cod:'E1', area:'Receiving and Using Feedback', q:'How do they use the feedback received to concretely change their behavior?'},
    {cod:'E2', area:'Self-Assessment Ability', q:'How accurate and critical is their perception of their own strengths and areas for improvement?'},
    {cod:'E3', area:'Training and Continuing Education', q:'How proactively do they take part in training activities and stay up to date in their field?'},
    {cod:'E4', area:'Adoption of New Technologies', q:'How quickly and effectively do they adopt new technologies and tools introduced in the company?'},
    {cod:'E5', area:'Personal Development Goals', q:'To what extent do they set personal and professional growth goals and work to achieve them?'},
  ]},
];
const APEX5D_DIMENSIONS_IT = [
  { code:'A', name:'Professionalità', desc:'Competenze tecniche, conoscenze, strumenti, decisioni', items:[
    {cod:'A1', area:'Competenze tecniche', q:'In che misura il dipendente possiede e applica le competenze tecniche richieste dal suo ruolo?'},
    {cod:'A2', area:'Conoscenza dei processi', q:'Quanto conosce i processi, le procedure e le policy aziendali rilevanti per la sua funzione?'},
    {cod:'A3', area:'Utilizzo di strumenti', q:'Con quale efficacia utilizza gli strumenti, i software e le tecnologie necessari al ruolo?'},
    {cod:'A4', area:'Decisioni e comunicazione', q:'Quanto è efficace nel prendere decisioni fondate e nel comunicarle in modo chiaro?'},
    {cod:'A5', area:'Creazione e condivisione di conoscenza', q:'In che misura genera nuove conoscenze e le trasferisce al team?'},
  ]},
  { code:'B', name:'Performance', desc:'Obiettivi misurabili, qualità, scadenze, autonomia', items:[
    {cod:'B1', area:'Rispetto di scadenze e obiettivi', q:'Con quale frequenza e affidabilità il dipendente rispetta le scadenze assegnate?'},
    {cod:'B2', area:'Qualità del lavoro', q:'Quanto il lavoro prodotto soddisfa o supera gli standard qualitativi aziendali?'},
    {cod:'B3', area:'Contributo agli obiettivi di team', q:'In che misura contribuisce attivamente al raggiungimento degli obiettivi collettivi?'},
    {cod:'B4', area:'Autonomia operativa', q:'Quanto è capace di lavorare in autonomia senza richiedere supervisione continua?'},
    {cod:'B5', area:'Crescita e sviluppo professionale', q:'In che misura dimostra un impegno concreto nel migliorare le proprie competenze?'},
  ]},
  { code:'C', name:'Attitudine', desc:'Adattabilità, flessibilità, apprendimento continuo', items:[
    {cod:'C1', area:'Adattabilità al cambiamento', q:'Con quale efficacia si adatta a cambiamenti organizzativi, di ruolo o di processo?'},
    {cod:'C2', area:'Gestione del carico e dello stress', q:'Come gestisce situazioni di elevato carico lavorativo o pressione?'},
    {cod:'C3', area:'Apprendimento continuo', q:'Con quale velocità e profondità acquisisce nuove competenze e procedure?'},
    {cod:'C4', area:'Problem solving e creatività', q:'Quanto è efficace nell\'identificare problemi e trovare soluzioni innovative?'},
    {cod:'C5', area:'Flessibilità di ruolo', q:'In che misura è disponibile e capace di ricoprire funzioni diverse dal suo ruolo abituale?'},
  ]},
  { code:'D', name:'Mentalità', desc:'Coinvolgimento, motivazione, relazioni, contributo', items:[
    {cod:'D1', area:'Impegno e dedizione al ruolo', q:'Quanto impegno costante e ownership delle proprie responsabilità dimostra?'},
    {cod:'D2', area:'Contributo agli obiettivi aziendali', q:'In che misura le sue azioni contribuiscono concretamente al raggiungimento degli obiettivi aziendali?'},
    {cod:'D3', area:'Partecipazione attiva', q:'Con quale qualità partecipa a riunioni, iniziative e progetti aziendali?'},
    {cod:'D4', area:'Motivazione e orientamento alla missione', q:'Quanta motivazione intrinseca e allineamento con la cultura e la missione aziendale dimostra?'},
    {cod:'D5', area:'Relazioni interpersonali e clima', q:'Con quale efficacia costruisce relazioni positive e contribuisce a un clima di lavoro sano?'},
  ]},
  { code:'E', name:'Potenziale', desc:'Miglioramento, feedback, autosviluppo, nuove tecnologie', items:[
    {cod:'E1', area:'Ricezione e utilizzo del feedback', q:'Come utilizza il feedback ricevuto per modificare concretamente il proprio comportamento?'},
    {cod:'E2', area:'Capacità di autovalutazione', q:'Quanto è accurata e critica la sua percezione dei propri punti di forza e delle aree di miglioramento?'},
    {cod:'E3', area:'Formazione e aggiornamento continuo', q:'Con quale proattività partecipa ad attività formative e si mantiene aggiornato nel proprio settore?'},
    {cod:'E4', area:'Adozione di nuove tecnologie', q:'Con quale rapidità ed efficacia adotta nuove tecnologie e strumenti introdotti in azienda?'},
    {cod:'E5', area:'Obiettivi di sviluppo personale', q:'In che misura si pone obiettivi di crescita personale e professionale e lavora per raggiungerli?'},
  ]},
];
let APEX5D_DIMENSIONS = APEX5D_DIMENSIONS_IT;
const APEX_SOURCES_EN = [
  {key:'resp', label:'Manager'},
  {key:'peer', label:'Peer (Colleague)'},
  {key:'auto', label:'Self-Assessment'},
];
const APEX_SOURCES_IT = [
  {key:'resp', label:'Responsabile'},
  {key:'peer', label:'Peer (Collega)'},
  {key:'auto', label:'Autovalutazione'},
];
let APEX_SOURCES = APEX_SOURCES_IT;
const LEVEL_ANCHORS_EN = [
  {min:1,max:2,label:'Not Adequate', color:'var(--danger)'},
  {min:3,max:4,label:'Developing', color:'var(--warning)'},
  {min:5,max:6,label:'Adequate', color:'var(--accent)'},
  {min:7,max:8,label:'Advanced', color:'var(--success)'},
  {min:9,max:10,label:'Excellent', color:'var(--gold)'},
];
const LEVEL_ANCHORS_IT = [
  {min:1,max:2,label:'Non adeguato', color:'var(--danger)'},
  {min:3,max:4,label:'In sviluppo', color:'var(--warning)'},
  {min:5,max:6,label:'Adeguato', color:'var(--accent)'},
  {min:7,max:8,label:'Avanzato', color:'var(--success)'},
  {min:9,max:10,label:'Eccellente', color:'var(--gold)'},
];
let LEVEL_ANCHORS = LEVEL_ANCHORS_IT;

/* ---------------------- COMPANY AREAS / ROLES (demo) ---------------------- */
const AREAS_CONFIG = [
  { area:'Sales Area', roles:['Account Manager','Sales Representative','Business Developer'] },
  { area:'Technical Area', roles:['Technical Specialist','Technical Team Leader','Process Analyst'] },
  { area:'Administration', roles:['Administrative Clerk','Administrative Coordinator'] },
  { area:'Production', roles:['Production Operator','Line Supervisor'] },
  { area:'Customer Service', roles:['Customer Support Representative','Customer Care Manager'] },
  { area:'Human Resources', roles:['HR Specialist','HR Business Partner'] },
];

/* ---------------------- UTILITY ---------------------- */
const uid = (p='id') => p + '_' + Math.random().toString(36).slice(2,9);
const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const round1 = (n) => Math.round(n*10)/10;
const fmt1 = (n) => (isFinite(n) ? round1(n).toFixed(1) : '–');
// Same one-decimal rounding as fmt1, but with an Italian decimal comma — used where the display
// is explicitly meant to read "-0,8" rather than "-0.8" (e.g. the Benchmark Gap card).
const fmt1it = (n) => (isFinite(n) ? round1(n).toLocaleString('it-IT', {minimumFractionDigits:1, maximumFractionDigits:1}) : '–');
const fmtCurrency = (n) => (isFinite(n) ? '€ ' + Math.round(n).toLocaleString('it-IT') : '–');
const initials = (nome, cognome) => ((nome||' ')[0]+(cognome||' ')[0]).toUpperCase();
const esc = (s) => String(s==null?'':s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function genderDisplayLabel(sesso){
  return { F: UI.genderFemale, M: UI.genderMale, Altro: UI.genderOther }[sesso] || '';
}
function contractTypeDisplayLabel(tipo){
  return { dipendente: UI.contractTypeDipendente, cocopro: UI.contractTypeCocopro, partitaIva: UI.contractTypePartitaIva, esterno: UI.contractTypeEsterno }[tipo] || UI.contractTypeDipendente;
}

function levelFor(score){
  for(const l of LEVEL_ANCHORS){ if(score>=l.min && score<=l.max) return l; }
  return LEVEL_ANCHORS[0];
}
function semanticChip(score, thresholds={good:7,mid:5}){
  if(score>=thresholds.good) return 'chip-green';
  if(score>=thresholds.mid) return 'chip-amber';
  return 'chip-red';
}
function toast(msg, type=''){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (type?(' '+type):'');
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(()=>{ t.className=''; }, 3200);
}

/* ============================= DESIGN SYSTEM HELPERS ============================= */

// Filterable data table (per-column search row) — wraps simple-datatables.
// Usage: render your <table id="..."> as usual, then call initFilterDataTable('that-id').
function initFilterDataTable(tableId, opts={}){
  const el = document.getElementById(tableId);
  if(!el || typeof simpleDatatables === 'undefined' || typeof simpleDatatables.DataTable === 'undefined') return null;
  return new simpleDatatables.DataTable('#'+tableId, Object.assign({
    tableRender: (_data, table, type) => {
      if(type === 'print') return table;
      const tHead = table.childNodes[0];
      const filterHeaders = {
        nodeName: 'TR',
        attributes: { class: 'search-filtering-row' },
        childNodes: tHead.childNodes[0].childNodes.map((_th, index) => ({
          nodeName: 'TH',
          childNodes: [{
            nodeName: 'INPUT',
            attributes: { class: 'datatable-input', type: 'search', 'data-columns': '['+index+']' }
          }]
        }))
      };
      tHead.childNodes.push(filterHeaders);
      return table;
    }
  }, opts));
}

// Reads any CSS custom property off :root (e.g. cssVar('--accent')).
function cssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
// Reads the app's --accent color (Skill Vision lime) for use as an ApexCharts series color.
function getBrandColor(){
  return cssVar('--accent') || '#B4C614';
}
// Reads any CSS custom property as an rgba() string (for Chart.js fill colors), so custom
// Module A/B colors from Settings cascade into canvas-rendered charts too.
function cssVarRgba(name, alpha, fallbackHex){
  const { r, g, b } = hexToRgb(toHexColor(cssVar(name), fallbackHex));
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ---------------------- BRAND CHART PALETTE (global) ----------------------
   Skill Vision manual: lime accent on a Neutral-950 surface. Registered as Chart.js
   global defaults so every chart in every module inherits light-on-dark tick/legend
   text and lime-tinted gridlines without per-call theming. cssVar('--accent') already
   resolves to the lime, so individual configs keep working. */
const BRAND_CHART = {
  lime: () => (document.documentElement.getAttribute('data-theme') === 'dark' ? '#DDEE1C' : '#B4C614'),
  limeSoft: 'rgba(221,238,28,0.14)',
  grid: 'rgba(221,238,28,0.1)',
  text: '#ABA79A',   // Neutral-400 — readable on the dark surface
  strong: '#FAF5DF', // Neutral-100
  guide: '#8C8779',  // neutral dashed reference line
};
if(typeof Chart !== 'undefined'){
  Chart.defaults.color = BRAND_CHART.text;
  Chart.defaults.borderColor = BRAND_CHART.grid;
  Chart.defaults.font.family = "'Gudea', -apple-system, 'Segoe UI', Roboto, sans-serif";
}

// Queue of {id, value, benchmark} for the compact ApexCharts bar rendered inside each stat tile.
// statTileHtml() only returns markup (with an empty placeholder div); the chart itself can only be
// instantiated once that markup is actually in the DOM, so callers must invoke
// renderQueuedStatTileCharts() right after setting .innerHTML with any statTileHtml() output.
let STAT_TILE_SEQ = 0;
let STAT_TILE_QUEUE = [];
let STAT_TILE_CHARTS = []; // live ApexCharts instances, destroyed and replaced on every flush
function renderStatTileChart(elId, value, benchmark, max=10){
  const el = document.getElementById(elId);
  if(!el || typeof ApexCharts === 'undefined') return null;
  const color = value>=benchmark ? cssVar('--success') : (value>=benchmark-1 ? cssVar('--warning') : cssVar('--danger'));
  const chart = new ApexCharts(el, {
    chart: { type:'bar', height:24, sparkline:{enabled:true}, animations:{enabled:true, easing:'easeout', speed:650} },
    series: [{ data:[value] }],
    plotOptions: { bar: { horizontal:true, barHeight:'62%', borderRadius:3 } },
    colors: [color],
    xaxis: { max },
    tooltip: { enabled:false },
  });
  chart.render();
  return chart;
}
function renderQueuedStatTileCharts(){
  STAT_TILE_CHARTS.forEach(c => { try{ c.destroy(); }catch(e){} });
  STAT_TILE_CHARTS = [];
  const queue = STAT_TILE_QUEUE;
  STAT_TILE_QUEUE = [];
  queue.forEach(q => { const c = renderStatTileChart(q.id, q.value, q.benchmark); if(c) STAT_TILE_CHARTS.push(c); });
}

// Renders a compact ApexCharts area sparkline (for use inside .stat-card .stat-chart).
// series: array of numbers. categories: array of x-axis labels (hidden by default).
function renderApexAreaChart(elId, series, categories, opts={}){
  const el = document.getElementById(elId);
  if(!el || typeof ApexCharts === 'undefined') return null;
  const brandColor = getBrandColor();
  const options = Object.assign({
    chart: { height:'100%', maxWidth:'100%', type:'area', fontFamily:'Inter, sans-serif', dropShadow:{enabled:false}, toolbar:{show:false} },
    tooltip: { enabled:true, x:{show:false} },
    fill: { type:'gradient', gradient:{ opacityFrom:.55, opacityTo:0, shade:brandColor, gradientToColors:[brandColor] } },
    dataLabels: { enabled:false },
    stroke: { width:3, curve:'smooth' },
    grid: { show:false, strokeDashArray:4, padding:{left:2,right:2,top:0} },
    series: [{ name: opts.seriesName || 'Value', data: series, color: brandColor }],
    xaxis: { categories: categories||[], labels:{show:false}, axisBorder:{show:false}, axisTicks:{show:false} },
    yaxis: { show:false },
  }, opts.overrides||{});
  const chart = new ApexCharts(el, options);
  chart.render();
  return chart;
}

// iOS-style checkbox markup — variant: '' (accent/blue), 'success', 'danger', 'warning'.
function iosCheckboxHtml(id, checked, variant, onchangeJs){
  const cls = variant ? ('ios-checkbox ' + variant) : 'ios-checkbox';
  return `<label class="${cls}">
    <input type="checkbox" id="${id}" ${checked?'checked':''} ${onchangeJs?`onchange="${onchangeJs}"`:''}>
    <div class="checkbox-wrapper">
      <div class="checkbox-bg"></div>
      <svg class="checkbox-icon" viewBox="0 0 24 24" fill="none">
        <path class="check-path" d="M4 12L10 18L20 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </div>
  </label>`;
}

// Animated cloud/sync loader — adapted from Uiverse.io by andrew-manzyk.
// Note: uses fixed internal SVG ids (#cloud, #shapes, #lines, #clipping, #roundness),
// so only render one instance at a time per page until wired to a specific spot that needs more.
function loaderHtml(){
  return `<div class="sv-loader">
    <svg id="cloud" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <filter id="roundness"><feGaussianBlur in="SourceGraphic" stdDeviation="1.5"></feGaussianBlur><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -10"></feColorMatrix></filter>
        <mask id="shapes"><g fill="white"><polygon points="50 37.5 80 75 20 75 50 37.5"></polygon><circle cx="20" cy="60" r="15"></circle><circle cx="80" cy="60" r="15"></circle><g><circle cx="20" cy="60" r="15"></circle><circle cx="20" cy="60" r="15"></circle><circle cx="20" cy="60" r="15"></circle></g></g></mask>
        <mask id="clipping" clipPathUnits="userSpaceOnUse"><g id="lines" filter="url(#roundness)"><g mask="url(#shapes)" stroke="white">
          <line x1="-50" y1="-40" x2="150" y2="-40"></line><line x1="-50" y1="-31" x2="150" y2="-31"></line><line x1="-50" y1="-22" x2="150" y2="-22"></line><line x1="-50" y1="-13" x2="150" y2="-13"></line><line x1="-50" y1="-4" x2="150" y2="-4"></line><line x1="-50" y1="5" x2="150" y2="5"></line><line x1="-50" y1="14" x2="150" y2="14"></line><line x1="-50" y1="23" x2="150" y2="23"></line><line x1="-50" y1="32" x2="150" y2="32"></line><line x1="-50" y1="41" x2="150" y2="41"></line><line x1="-50" y1="50" x2="150" y2="50"></line><line x1="-50" y1="59" x2="150" y2="59"></line><line x1="-50" y1="68" x2="150" y2="68"></line><line x1="-50" y1="77" x2="150" y2="77"></line><line x1="-50" y1="86" x2="150" y2="86"></line><line x1="-50" y1="95" x2="150" y2="95"></line><line x1="-50" y1="104" x2="150" y2="104"></line><line x1="-50" y1="113" x2="150" y2="113"></line><line x1="-50" y1="122" x2="150" y2="122"></line><line x1="-50" y1="131" x2="150" y2="131"></line><line x1="-50" y1="140" x2="150" y2="140"></line>
        </g></g></mask>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx="0" ry="0" mask="url(#clipping)"></rect>
      <g>
        <path d="M33.52,68.12 C35.02,62.8 39.03,58.52 44.24,56.69 C49.26,54.93 54.68,55.61 59.04,58.4 C59.04,58.4 56.24,60.53 56.24,60.53 C55.45,61.13 55.68,62.37 56.63,62.64 C56.63,62.64 67.21,65.66 67.21,65.66 C67.98,65.88 68.75,65.3 68.74,64.5 C68.74,64.5 68.68,53.5 68.68,53.5 C68.67,52.51 67.54,51.95 66.75,52.55 C66.75,52.55 64.04,54.61 64.04,54.61 C57.88,49.79 49.73,48.4 42.25,51.03 C35.2,53.51 29.78,59.29 27.74,66.49 C27.29,68.08 28.22,69.74 29.81,70.19 C30.09,70.27 30.36,70.31 30.63,70.31 C31.94,70.31 33.14,69.44 33.52,68.12Z"></path>
        <path d="M69.95,74.85 C68.35,74.4 66.7,75.32 66.25,76.92 C64.74,82.24 60.73,86.51 55.52,88.35 C50.51,90.11 45.09,89.43 40.73,86.63 C40.73,86.63 43.53,84.51 43.53,84.51 C44.31,83.91 44.08,82.67 43.13,82.4 C43.13,82.4 32.55,79.38 32.55,79.38 C31.78,79.16 31.02,79.74 31.02,80.54 C31.02,80.54 31.09,91.54 31.09,91.54 C31.09,92.53 32.22,93.09 33.01,92.49 C33.01,92.49 35.72,90.43 35.72,90.43 C39.81,93.63 44.77,95.32 49.84,95.32 C52.41,95.32 55,94.89 57.51,94.01 C64.56,91.53 69.99,85.75 72.02,78.55 C72.47,76.95 71.54,75.3 69.95,74.85Z"></path>
      </g>
    </svg>
  </div>`;
}


/* ============================= APPLICATION STATE ============================= */
const STORAGE_KEY = 'sv_assessment_state_v1';
let STATE = null;         // current state (employees, settings, roleProfiles, analisiIniziale)
let CURRENT_PAGE = 'home';
let NAV_OPEN_GROUPS = {};
let HOME_OPEN_CARDS = { q1:false, q2:false, q3:false, q4:false }; // home KPI accordion — collapsed by default: only the title shows until the user clicks to expand
let MATCH_SELECTION = []; // for the "Match" view
let CHART_REGISTRY = {};  // to destroy/recreate Chart.js charts

function destroyCharts(){
  Object.values(CHART_REGISTRY).forEach(c => { try{ c.destroy(); }catch(e){} });
  CHART_REGISTRY = {};
}

/* ---------------------- DEMO DATA GENERATION ----------------------
   No real data: a fictitious population used to show the dashboard fully
   working. The client will replace this data with a real import
   (Employee Directory + evaluations), keeping the same structure. */
const DEMO_NOMI = ['Marco','Giulia','Alessandro','Francesca','Andrea','Chiara','Matteo','Sara','Davide','Elena','Luca','Valentina','Simone','Martina','Federico','Alessia','Riccardo','Silvia','Giovanni','Laura','Stefano','Elisa','Nicola','Federica','Antonio','Ilaria'];
const DEMO_COGNOMI = ['Bianchi','Ferrari','Russo','Colombo','Ricci','Marino','Greco','Bruno','Gallo','Conti','De Luca','Costa','Fontana','Rinaldi','Moretti','Rizzo','Barbieri','Villa','Longo','Mancini','Grasso','Pellegrini','Leone','Rossi','Romano','Ferrara'];

// "focus" skills per role family — used to differentiate the EXPECTED value per role
const ROLE_FOCUS_SKILLS = {
  'Account Manager': ['in1','in2','so3','ma1','ps9'],
  'Sales Representative': ['in1','in2','in3','so3','ps10'],
  'Business Developer': ['in2','ma7','ma6','ps7','so4'],
  'Technical Specialist': ['re1','re4','ma4','ps11','ma6'],
  'Technical Team Leader': ['ma3','ma2','in1','ma1','so5'],
  'Process Analyst': ['ma4','re4','re1','ma6','ps11'],
  'Administrative Clerk': ['re1','re3','ps11','re4','ps6'],
  'Administrative Coordinator': ['ma1','ma5','ma3','re2','so1'],
  'Production Operator': ['re3','ps11','ps2','re5','ps12'],
  'Line Supervisor': ['ma3','ma1','re2','so1','ps12'],
  'Customer Support Representative': ['so2','so3','in1','ps8','ps2'],
  'Customer Care Manager': ['so2','so3','ma3','in1','ma1'],
  'HR Specialist': ['so5','ps8','in1','so1','ps13'],
  'HR Business Partner': ['ma1','so5','in2','ma3','ps8'],
};

function seedRandom(seed){
  // simple deterministic PRNG (mulberry32) for reproducible demo data
  let t = seed;
  return function(){
    t |= 0; t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickArchetype(rnd){
  const r = rnd();
  if(r < 0.09) return 'top';
  if(r < 0.34) return 'high';
  if(r < 0.74) return 'solid';
  if(r < 0.93) return 'developing';
  return 'critical';
}
const ARCHETYPE_BASE = { top:9.0, high:7.7, solid:6.2, developing:4.7, critical:3.1 };

function genEmployeeScores(rnd, archetype, roleFocus){
  const base = ARCHETYPE_BASE[archetype];
  // --- soft skills ---
  const soft = {};
  SOFT_SKILLS.forEach(s => {
    const noise = (rnd()-0.5)*2.4;
    const ottenuto = clamp(Math.round(base + noise), 1, 10);
    const isFocus = roleFocus.includes(s.id);
    const atteso = isFocus ? 8 : 6;
    soft[s.id] = { ottenuto, atteso };
  });
  // --- hard skills (APEX 5D) — 3 sources ---
  const sourceBias = { resp: 0, peer: (rnd()-0.5)*0.7, auto: 0.3 + rnd()*1.1 };
  const hard = { resp:{}, peer:{}, auto:{} };
  APEX5D_DIMENSIONS.forEach(dim => {
    dim.items.forEach(it => {
      APEX_SOURCES.forEach(src => {
        const noise = (rnd()-0.5)*2.2;
        const v = clamp(Math.round(base + sourceBias[src.key] + noise), 1, 10);
        hard[src.key][it.cod] = v;
      });
    });
  });
  return { soft, hard };
}

const CCNL_LEVELS_DEMO = ['Impiegato 2° livello', 'Impiegato 3° livello', 'Impiegato 4° livello', 'Impiegato 5° livello', 'Quadro'];
const BENEFIT_OPTIONS_DEMO = ['Buoni pasto', 'Auto aziendale', 'Assicurazione sanitaria', 'Smart working', 'Buoni pasto, Assicurazione sanitaria'];

/* Mandatory pre-test cover letter — embedded into every survey-link email (see
   fillSurveyEmailTemplate()) so a collaborator always receives it together with their soft-skill
   questionnaire link. Assessment → "Lettera ai Collaboratori" (internal staff); the Recruiting
   module has its own separate "Lettera ai Candidati" for external candidates (see
   CANDIDATE_LETTER_TEMPLATE in recruiting.html). {{LINK}} is substituted with the real survey
   link wherever it appears. */
const COLLABORATOR_LETTER_TEMPLATE = `LETTERA AI COLLABORATORI

Gentile Collaboratore,
la Tua Azienda, in collaborazione con SKILL-VISION, società di consulenza aziendale con oltre vent'anni di esperienza, ha avviato un progetto dedicato alla conoscenza e alla valorizzazione delle competenze delle proprie persone.
L'obiettivo è semplice e importante: conoscere meglio le caratteristiche, le attitudini e le competenze di ciascun collaboratore, per favorire una migliore valorizzazione delle persone all'interno dell'organizzazione.
Conoscere le proprie competenze, infatti, può aiutare a individuare attività e responsabilità più in sintonia con le proprie caratteristiche, favorendo sia le esigenze dell'Azienda sia, soprattutto, la crescita professionale di ciascuno.

Il questionario
Ti verrà richiesto di compilare un questionario dedicato alle competenze trasversali (Soft Skills) e ad alcuni aspetti legati, tra gli altri, all'Intelligenza Emotiva.
La compilazione richiede circa 10-12 minuti ma il tempo che ci impiegherai non sarà influente.
Non è una prova da superare e non esistono risposte giuste o sbagliate.
Ciò che conta maggiormente è rispondere in modo spontaneo, sincero e autentico, scegliendo le risposte che descrivono realmente il Tuo modo di essere e di comportarti.
Il test è stato progettato per il mondo del lavoro e validato in ambito universitario.
I risultati saranno elaborati attraverso un sistema esperto e successivamente rappresentati sulla piattaforma SKILL-VISION.
Il sistema è inoltre in grado di rilevare eventuali incongruenze o contraddizioni nelle risposte: per questo motivo, cercare di fornire la risposta che si ritiene "più corretta" potrebbe rendere il risultato meno rappresentativo.
Più sarai spontaneo e sincero, più il risultato potrà rappresentare fedelmente le Tue caratteristiche e diventare uno strumento utile per il Tuo percorso professionale.
Il test presenta un'affidabilità dichiarata superiore al 92%.

Perché le Soft Skills sono importanti?
Le Soft Skills sono l'insieme delle nostre abilità personali e interpersonali: il modo in cui comunichiamo, collaboriamo, affrontiamo le difficoltà, gestiamo le situazioni, prendiamo decisioni e ci adattiamo ai cambiamenti.
Non riguardano quindi soltanto ciò che sappiamo fare dal punto di vista tecnico, ma come utilizziamo le nostre capacità nel contesto professionale.
Conoscere queste caratteristiche può rappresentare un valore sia per la persona sia per l'organizzazione.
Per il collaboratore significa avere una maggiore consapevolezza dei propri punti di forza e delle aree sulle quali poter crescere.
Per l'Azienda significa poter valorizzare meglio le persone, favorendo l'incontro tra competenze, attitudini, ruoli e responsabilità.
In altre parole: la persona giusta nel ruolo giusto.

Come compilare il test
Troverai una serie di affermazioni e dovrai semplicemente scegliere quelle che senti più vicine al Tuo modo di essere, pertanto Ti consigliamo di:
• rispondere con spontaneità;
• essere sincero;
• non cercare di immaginare quale possa essere la risposta "migliore";
• non lasciarti condizionare da ciò che pensi possa essere più apprezzato.
Non devi dimostrare nulla: devi semplicemente raccontare, attraverso le Tue risposte, chi sei professionalmente.
La qualità del risultato dipende soprattutto dalla Tua autenticità.

Prima di iniziare
Accedi al questionario attraverso il link che Ti è stato fornito e, se possibile, compila in modo completo la prima pagina, inserendo anche una fotografia.
A questo punto sei pronto per iniziare.

🔗 Link al questionario: {{LINK}}

Prenditi qualche minuto per Te: conoscere meglio le proprie competenze è il primo passo per poterle valorizzare.
Grazie per la collaborazione e per il tempo che vorrai dedicare a questa iniziativa.
Buona compilazione!

Cosa sono le Soft Skills?
Sono un insieme di abilità personali e interpersonali che influenzano il nostro modo di interagire con gli altri, affrontare le situazioni professionali e gestire la nostra vita lavorativa.
Non sono quindi competenze tecniche specifiche del mestiere, ma caratteristiche e capacità personali che utilizziamo ogni giorno nel lavoro.
Perché sono importanti?
Le Soft Skills sono importanti tanto per il collaboratore quanto per l'Azienda.
Sono infatti determinanti nella capacità di collaborare, comunicare, adattarsi ai cambiamenti, affrontare problemi e costruire relazioni professionali efficaci.
Perché identificarle e valorizzarle?
Conoscere le proprie competenze trasversali permette di acquisire una maggiore consapevolezza dei propri punti di forza e delle proprie aree di sviluppo.
Per l'organizzazione significa poter valorizzare meglio le persone e favorire una maggiore coerenza tra competenze, attitudini, ruoli e responsabilità.
L'obiettivo è creare una situazione nella quale ciascuno possa esprimere al meglio il proprio potenziale.

Privacy
I dati inseriti saranno trattati nel rispetto della normativa vigente in materia di protezione dei dati personali e del Regolamento Europeo GDPR (UE) 2016/679.
I risultati saranno visionati esclusivamente da personale autorizzato e qualificato e utilizzati per le finalità previste dal progetto, nel rispetto della normativa sulla privacy.

SKILL-VISION
Human Capital Intelligence - Conoscere le persone. Comprendere il potenziale. Creare valore.
info@skill-vision.it · www.skill-vision.it`;
function generateDemoData(){
  const rnd = seedRandom(20260724);
  const evaluators = ['Giulia Bianchi', 'Marco Rossi', 'Elena Ferrari', 'Davide Conti'];
  const employees = [];
  let ni=0, ci=0;
  AREAS_CONFIG.forEach(areaCfg => {
    areaCfg.roles.forEach(role => {
      const count = 1 + Math.floor(rnd()*2.4); // 1-3 employees per role
      for(let k=0;k<count;k++){
        const nome = DEMO_NOMI[Math.floor(rnd()*DEMO_NOMI.length)];
        const cognome = DEMO_COGNOMI[Math.floor(rnd()*DEMO_COGNOMI.length)];
        const archetype = pickArchetype(rnd);
        const roleFocus = ROLE_FOCUS_SKILLS[role] || [];
        const scores = genEmployeeScores(rnd, archetype, roleFocus);
        // RAL loosely scaled by archetype so the Valore Complessivo bubble matrix (Phase 4) has realistic spread
        const ralBase = archetype==='top' ? 42000 : archetype==='critical' ? 26000 : 30000;
        const ral = Math.round((ralBase + rnd()*20000) / 500) * 500;
        const assenzeProgrammate = rnd() < 0.2 ? [{
          dal: '2026-08-10', al: '2026-08-24', motivo: 'Ferie estive'
        }] : [];
        const emp = {
          id: uid('emp'),
          nome, cognome,
          email: (nome+'.'+cognome).toLowerCase().replace(/\s+/g,'') + '@democompany.com',
          area: areaCfg.area,
          reparto: '',
          ruolo: role,
          mansione: 'Attività operative e di supporto per ' + role.toLowerCase(),
          tipoProfilo: 'Employee',
          // Weighted so the vast majority are payroll employees, matching a typical org's mix (Section 1 fix:
          // the Dati Aziendali headcount tiles are now computed from these records instead of manual numbers).
          tipoContratto: (() => { const t = rnd(); return t < 0.84 ? 'dipendente' : t < 0.90 ? 'cocopro' : t < 0.96 ? 'partitaIva' : 'esterno'; })(),
          sesso: rnd() < 0.5 ? 'F' : 'M',
          livelloCcnl: CCNL_LEVELS_DEMO[Math.floor(rnd()*CCNL_LEVELS_DEMO.length)],
          ral,
          benefit: BENEFIT_OPTIONS_DEMO[Math.floor(rnd()*BENEFIT_OPTIONS_DEMO.length)],
          assenzeProgrammate,
          archived: null,
          soft: scores.soft,
          hard: scores.hard,
          hardEvaluatedBy: { resp: evaluators[Math.floor(rnd()*evaluators.length)], peer: evaluators[Math.floor(rnd()*evaluators.length)], auto: nome+' '+cognome },
          hardHistory: [],
          softHistory: [],
          feedbackNeeded: (archetype==='critical' || archetype==='developing' || rnd()<0.15),
          developmentPlan: { azioni:'', formazione:'', coaching:'', obiettivi:'' },
          _archetype: archetype,
        };
        employees.push(emp);
      }
    });
  });
  const roleProfiles = {};
  Object.keys(ROLE_FOCUS_SKILLS).forEach(role => { roleProfiles[role] = { requiredSkills: ROLE_FOCUS_SKILLS[role] }; });

  return {
    settings: { modulo: 'AB', companyName: 'Demo Company S.r.l.', testsAcquired: 50, testsDispatched: 32, surveyLink: '', softSkillTargets: {},
      surveySenderMode: 'referente', adminSenderEmail: '',
      actionNotes: {},
      preTestLetter: COLLABORATOR_LETTER_TEMPLATE,
      surveyEmailSubject: 'Questionario di valutazione delle competenze',
      surveyEmailBody: 'Ciao {{NOME}},\n\n[Testo standard da inserire — verrà fornito dal cliente]\n\nPer completare il questionario di valutazione delle Competenze Trasversali, utilizza il link seguente:\n\n{{LINK}}\n\nGrazie.',
      emailApiEndpoint: '', emailApiKey: '' },
    employees,
    evaluators,
    roleProfiles,
    evalAssignments: [],
    evalPeriods: [{ id: uid('period'), label: UI.reDefaultPeriodLabel, date: new Date().toISOString().slice(0,10) }],
    analisiIniziale: {
      problematiche: 'Difficoltà a mappare in modo oggettivo le competenze effettive dei dipendenti rispetto al proprio ruolo. Divari percepiti tra autovalutazione e valutazione del responsabile in alcune aree.',
      criticita: 'Elevato turnover nell\'area Customer Service. Difficoltà di comunicazione trasversale tra l\'Area Tecnica e l\'Area Commerciale.',
      obiettiviProgetto: 'Ottenere un quadro oggettivo delle competenze trasversali e professionali sull\'intera popolazione aziendale, individuare i talenti da valorizzare e le aree con priorità di intervento formativo.',
      aspettative: 'Il management si aspetta uno strumento che le Risorse Umane possano utilizzare in autonomia, con indicatori di facile lettura e suggerimenti operativi concreti su formazione, coaching e riorganizzazione.',
    },
    company: {
      locations: [
        { name: 'Sede Centrale', address: 'Via Roma 12', city: 'Milano' },
      ],
      contacts: [
        { label: 'Risorse Umane', name: 'Laura Moretti', email: 'hr@democompany.com', phone: '+39 02 1234567' },
      ],
      referente: { name: 'Laura Moretti', email: 'hr@democompany.com', phone: '+39 02 1234567' },
      ceo: { name: 'Alberto Colombo', email: 'ceo@democompany.com' },
      cfo: { name: 'Sara Ricci', email: 'cfo@democompany.com' },
    },
  };
}

/* ---------------------- PERSISTENCE (localStorage via safeStorage, shared data) ---------------------- */
async function loadState(){
  try{
    const raw = safeStorage.get(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed && Array.isArray(parsed.employees)){
        if(!Array.isArray(parsed.evaluators)) parsed.evaluators = [];
        if(!Array.isArray(parsed.evalAssignments)) parsed.evalAssignments = [];
        if(!Array.isArray(parsed.evalPeriods) || !parsed.evalPeriods.length) parsed.evalPeriods = [{ id: uid('period'), label: UI.reDefaultPeriodLabel, date: new Date().toISOString().slice(0,10) }];
        parsed.employees.forEach(e => {
          if(!e.hardEvaluatedBy) e.hardEvaluatedBy = { resp:'', peer:'', auto:'' };
          if(e.sesso===undefined) e.sesso = '';
          if(e.tipoContratto===undefined) e.tipoContratto = 'dipendente';
          if(e.livelloCcnl===undefined) e.livelloCcnl = '';
          if(e.ral===undefined) e.ral = 0;
          if(e.benefit===undefined) e.benefit = '';
          if(!Array.isArray(e.assenzeProgrammate)) e.assenzeProgrammate = [];
          if(e.archived===undefined) e.archived = null;
          if(!Array.isArray(e.hardHistory)) e.hardHistory = [];
          if(!Array.isArray(e.softHistory)) e.softHistory = [];
        });
        if(!parsed.settings) parsed.settings = { modulo:'AB', companyName:'Demo Company S.r.l.' };
        if(parsed.settings.testsAcquired===undefined) parsed.settings.testsAcquired = 0;
        if(parsed.settings.testsDispatched===undefined) parsed.settings.testsDispatched = 0;
        if(parsed.settings.surveyLink===undefined) parsed.settings.surveyLink = '';
        if(parsed.settings.surveySenderMode===undefined) parsed.settings.surveySenderMode = 'referente';
        if(parsed.settings.adminSenderEmail===undefined) parsed.settings.adminSenderEmail = '';
        if(parsed.settings.surveyEmailSubject===undefined) parsed.settings.surveyEmailSubject = 'Questionario di valutazione delle competenze';
        if(parsed.settings.surveyEmailBody===undefined) parsed.settings.surveyEmailBody = 'Ciao {{NOME}},\n\n[Testo standard da inserire — verrà fornito dal cliente]\n\nPer completare il questionario di valutazione delle Competenze Trasversali, utilizza il link seguente:\n\n{{LINK}}\n\nGrazie.';
        if(parsed.settings.emailApiEndpoint===undefined) parsed.settings.emailApiEndpoint = '';
        if(parsed.settings.emailApiKey===undefined) parsed.settings.emailApiKey = '';
        if(parsed.settings.preTestLetter===undefined) parsed.settings.preTestLetter = COLLABORATOR_LETTER_TEMPLATE;
        if(!parsed.settings.actionNotes) parsed.settings.actionNotes = {};
        if(!parsed.settings.softSkillTargets) parsed.settings.softSkillTargets = {};
        if(!parsed.company) parsed.company = { locations:[], contacts:[], referente:{name:'',email:'',phone:''}, ceo:{name:'',email:''}, cfo:{name:'',email:''} };
        if(!Array.isArray(parsed.company.locations)) parsed.company.locations = [];
        if(!Array.isArray(parsed.company.contacts)) parsed.company.contacts = [];
        if(!parsed.company.referente) parsed.company.referente = { name:'', email:'', phone:'' };
        if(!parsed.company.ceo) parsed.company.ceo = { name:'', email:'' };
        if(!parsed.company.cfo) parsed.company.cfo = { name:'', email:'' };
        parsed.evalAssignments.forEach(a => { if(a.evaluatorEmail===undefined) a.evaluatorEmail = ''; });
        return parsed;
      }
    }
  }catch(e){ /* corrupted or missing on first launch: fall back to demo data */ }
  const demo = generateDemoData();
  await saveState(demo, true);
  return demo;
}
let SAVE_PENDING = false;
async function saveState(state = STATE, silent=false){
  SAVE_PENDING = true;
  try{
    safeStorage.set(STORAGE_KEY, JSON.stringify(state));
    SAVE_PENDING = false;
    if(!silent) toast(UI.toastDataSaved, 'ok');
    return true;
  }catch(e){
    SAVE_PENDING = false;
    if(!silent) toast(UI.toastSaveError, 'err');
    return false;
  }
}
function persist(silent=true){ saveState(STATE, silent); }


/* ============================= CALCULATION FUNCTIONS ============================= */
function moduleActive(letter){
  const m = STATE.settings.modulo;
  if(m==='AB') return true;
  return m === letter;
}
function bothActive(){ return STATE.settings.modulo === 'AB'; }

function computeSoftSummary(emp){
  const perSkill = SOFT_SKILLS.map(s => {
    const rec = emp.soft[s.id] || {ottenuto:0, atteso:6};
    return { ...s, ottenuto: rec.ottenuto, atteso: rec.atteso, gap: round1(rec.ottenuto - rec.atteso) };
  });
  const perCluster = SOFT_CLUSTERS.map(c => {
    const items = perSkill.filter(s => s.cluster===c);
    return { cluster:c, ottenuto: round1(avg(items.map(i=>i.ottenuto))), atteso: round1(avg(items.map(i=>i.atteso))), items };
  });
  const overallOttenuto = round1(avg(perSkill.map(s=>s.ottenuto)));
  const overallAtteso = round1(avg(perSkill.map(s=>s.atteso)));
  return { perSkill, perCluster, overallOttenuto, overallAtteso, gapOverall: round1(overallOttenuto-overallAtteso) };
}

function computeBigFive(emp){
  const out = {};
  BIGFIVE_ORDER.forEach(dim => {
    const ids = SOFT_SKILLS.filter(s=>s.dim===dim).map(s=>s.id);
    const vals = ids.map(id => (emp.soft[id]||{ottenuto:0}).ottenuto);
    out[dim] = round1(avg(vals));
  });
  out.overall = round1(avg(BIGFIVE_ORDER.map(d=>out[d])));
  return out;
}
// Expected-side companion to computeBigFive(), for plotting Obtained vs Expected on the same radar.
function computeBigFiveExpected(emp){
  const out = {};
  BIGFIVE_ORDER.forEach(dim => {
    const ids = SOFT_SKILLS.filter(s=>s.dim===dim).map(s=>s.id);
    const vals = ids.map(id => (emp.soft[id]||{atteso:6}).atteso);
    out[dim] = round1(avg(vals));
  });
  out.overall = round1(avg(BIGFIVE_ORDER.map(d=>out[d])));
  return out;
}

function computeHardSummary(emp){
  const dims = APEX5D_DIMENSIONS.map(dim => {
    const perSource = {};
    APEX_SOURCES.forEach(src => {
      const vals = dim.items.map(it => (emp.hard[src.key]||{})[it.cod] || 0);
      perSource[src.key] = round1(avg(vals));
    });
    const mediaTotale = round1(avg(APEX_SOURCES.map(s=>perSource[s.key])));
    const gapRespAuto = round1(perSource.resp - perSource.auto);
    const gapPeerAuto = round1(perSource.peer - perSource.auto);
    const gapRespPeer = round1(perSource.resp - perSource.peer);
    return { code:dim.code, name:dim.name, desc:dim.desc, perSource, mediaTotale, gapRespAuto, gapPeerAuto, gapRespPeer };
  });
  const apexScore = round1(avg(dims.map(d=>d.mediaTotale)));
  return { dims, apexScore };
}

function gapInterpretation(delta){
  const a = Math.abs(delta);
  if(a < 0.8) return {label:UI.gapAligned, tag:'gap-ok'};
  if(a < 1.8) return {label:UI.gapModerate, tag:'gap-warn'};
  return {label:UI.gapSignificant, tag:'gap-bad'};
}
// For Match views: per-row cell classes highlighting the top/bottom performer, or overlap when everyone is aligned.
function matchCellClasses(values){
  if(values.length < 2) return values.map(()=>'');
  const max = Math.max(...values), min = Math.min(...values);
  if(round1(max-min) <= 0.5) return values.map(()=>'match-overlap');
  return values.map(v => v===max ? 'match-high' : (v===min ? 'match-low' : ''));
}

const TIER_DEFS_EN = [
  { key:'top', label:'Top Talent', min:8.3, chip:'chip-gold' },
  { key:'valorizzare', label:'Talent to Develop', min:7.0, chip:'chip-green' },
  { key:'adeguata', label:'Solid Performer', min:5.5, chip:'chip-blue' },
  { key:'sviluppo', label:'Needs Development', min:4.0, chip:'chip-amber' },
  { key:'critica', label:'Critical Performer', min:-1, chip:'chip-red' },
];
const TIER_DEFS_IT = [
  { key:'top', label:'Top Talent', min:8.3, chip:'chip-gold' },
  { key:'valorizzare', label:'Talento da Valorizzare', min:7.0, chip:'chip-green' },
  { key:'adeguata', label:'Persona Adeguata', min:5.5, chip:'chip-blue' },
  { key:'sviluppo', label:'Persona da Sviluppare', min:4.0, chip:'chip-amber' },
  { key:'critica', label:'Persona Critica', min:-1, chip:'chip-red' },
];
let TIER_DEFS = TIER_DEFS_IT;
function tierFor(score){
  for(const t of TIER_DEFS){ if(score >= t.min) return t; }
  return TIER_DEFS[TIER_DEFS.length-1];
}

// Employee's "primary" score based on active modules (for ranking, home, overall value)
function primaryScore(emp){
  const m = STATE.settings.modulo;
  if(m==='A') return computeSoftSummary(emp).overallOttenuto;
  if(m==='B') return computeHardSummary(emp).apexScore;
  // AB: simple 50/50 average between Module A and Module B
  const soft = computeSoftSummary(emp).overallOttenuto;
  const hard = computeHardSummary(emp).apexScore;
  return round1(soft*0.5 + hard*0.5);
}
function primaryScoreLabel(){
  const m = STATE.settings.modulo;
  if(m==='A') return UI.primaryScoreSoft;
  if(m==='B') return UI.primaryScoreHard;
  return UI.primaryScoreOverall;
}

function allEmployees(){ return STATE.employees; }
// Employees not archived (left the company) — used for the Anagrafica active-list view.
// NOTE: org-wide analytics (Home/Valore/Soft/Hard pages) still read STATE.employees directly today
// and therefore still include archived employees; narrowing those is a separate, larger change.
function activeEmployees(){ return STATE.employees.filter(e => !e.archived); }
function filterByArea(area){ return STATE.employees.filter(e=>e.area===area); }
function areasList(){ return [...new Set(STATE.employees.map(e=>e.area))]; }
function repartiList(){ return [...new Set(STATE.employees.map(e=>e.reparto).filter(Boolean))]; }

function rankedEmployees(){
  return [...STATE.employees].map(e => ({ emp:e, score: primaryScore(e) })).sort((a,b)=>b.score-a.score);
}

function classifyPopulation(){
  const counts = {}; TIER_DEFS.forEach(t=>counts[t.key]=[]);
  STATE.employees.forEach(e => {
    const s = primaryScore(e);
    const t = tierFor(s);
    counts[t.key].push(e);
  });
  return counts;
}

// Most critical areas/competencies at company level (for home + suggestions)
function orgCriticalAreas(n=3){
  const areas = areasList().map(area => {
    const emps = filterByArea(area);
    const scores = emps.map(e=>primaryScore(e));
    return { area, avg: round1(avg(scores)), count: emps.length };
  }).sort((a,b)=>a.avg-b.avg);
  return areas.slice(0,n);
}
function orgWorstSoftSkills(n=5){
  const rows = SOFT_SKILLS.map(s => {
    const vals = STATE.employees.map(e => (e.soft[s.id]||{ottenuto:0,atteso:6}));
    const ott = round1(avg(vals.map(v=>v.ottenuto)));
    const att = round1(avg(vals.map(v=>v.atteso)));
    return { ...s, ottenuto: ott, atteso: att, gap: round1(ott-att) };
  }).sort((a,b)=>a.gap-b.gap);
  return rows.slice(0,n);
}
function orgWorstHardDims(n=3){
  const rows = APEX5D_DIMENSIONS.map(dim => {
    const vals = STATE.employees.map(e => computeHardSummary(e).dims.find(d=>d.code===dim.code).mediaTotale);
    return { code:dim.code, name:dim.name, avg: round1(avg(vals)) };
  }).sort((a,b)=>a.avg-b.avg);
  return rows.slice(0,n);
}

function homeStats(){
  const ranked = rankedEmployees();
  const orgAvg = round1(avg(ranked.map(r=>r.score)));
  const benchmark = 7.0; // internal reference threshold, shown as a benchmark for comparison
  const tiers = classifyPopulation();
  const riskCount = tiers.critica.length + tiers.sviluppo.length;
  const valueCount = tiers.top.length + tiers.valorizzare.length;
  const feedbackDue = STATE.employees.filter(e=>e.feedbackNeeded).length;
  // largest perception gaps (only if Module B is active)
  let biggestGaps = [];
  if(moduleActive('B')){
    STATE.employees.forEach(e => {
      const hs = computeHardSummary(e);
      hs.dims.forEach(d => {
        biggestGaps.push({ emp:e, dim:d.name, gap: Math.abs(d.gapRespAuto) });
      });
    });
    biggestGaps.sort((a,b)=>b.gap-a.gap);
    biggestGaps = biggestGaps.slice(0,3);
  }
  return { orgAvg, benchmark, tiers, riskCount, valueCount, feedbackDue, ranked, biggestGaps };
}

function priorityActions(){
  const hs = homeStats();
  const actions = [];
  const critAreas = orgCriticalAreas(2);
  critAreas.forEach(a => {
    if(a.avg < 6.0) actions.push({ icon:'📌', text: `Schedule a targeted training program for the <b>${esc(a.area)}</b> area (average ${fmt1(a.avg)}/10).` });
  });
  if(moduleActive('A')){
    const worst = orgWorstSoftSkills(2);
    worst.forEach(w => { if(w.gap < -1) actions.push({ icon:'🎯', text: `Invest in <b>${esc(w.name)}</b>: average gap of ${fmt1(w.gap)} points versus the expected level.` }); });
  }
  if(hs.tiers.critica.length){
    actions.push({ icon:'🗣️', text: `Schedule feedback debrief meetings with the <b>${hs.tiers.critica.length}</b> people in the critical tier.` });
  }
  if(hs.tiers.top.length){
    actions.push({ icon:'⭐', text: `Define a retention/development plan for the <b>${hs.tiers.top.length}</b> Top Talent identified.` });
  }
  if(hs.biggestGaps.length){
    const g = hs.biggestGaps[0];
    actions.push({ icon:'🔍', text: `Look into the perception gap for ${esc(g.emp.nome)} ${esc(g.emp.cognome)} on ${esc(g.dim)} (Δ ${fmt1(g.gap)}).` });
  }
  if(!actions.length) actions.push({ icon:'✅', text:'No significant issues found: maintain periodic monitoring.' });
  return actions.slice(0,5);
}


/* ============================= NAVIGATION & SHELL ============================= */
const PAGE_META_TEXT_EN = {
  home:       { title:'Home', sub:'Overall organization status' },
  company:    { title:'Company Profile', sub:'Locations, contacts, headcount by type, and key company roles' },
  anagrafica: { title:'Employee Directory', sub:'Employee list, roles, duties, and role requirements' },
  analisi:    { title:'Initial Analysis', sub:'Starting situation of the assessment project' },
  soft:       { title:'Soft Skills', sub:'Soft Skills & Big Five' },
  hard:       { title:'Hard Skills', sub:'Multi-source APEX 5D Protocol' },
  valore:     { title:'Overall Individual Value', sub:'Integration of Soft Skills + Hard Skills' },
  customercare:{ title:'Customer Care Logic', sub:'Customer Care competency management and analysis' },
  feedback:   { title:'Feedback & Development Plan', sub:'Individual debrief and growth actions' },
  ai:         { title:'AI Assistant', sub:'Query the dashboard in natural language' },
};
const PAGE_META_TEXT_IT = {
  home:       { title:'Home', sub:"Stato generale dell'organizzazione" },
  company:    { title:'Profilo Azienda', sub:'Sedi, contatti, organico per tipologia e ruoli chiave aziendali' },
  anagrafica: { title:'Anagrafica Risorse', sub:'Elenco dipendenti, ruoli, mansioni e requisiti di ruolo' },
  analisi:    { title:'Analisi Iniziale', sub:'Situazione di partenza del progetto di assessment' },
  soft:       { title:'Competenze Trasversali', sub:'Soft Skills & Big Five' },
  hard:       { title:'Competenze Professionali', sub:'Protocollo APEX 5D multi-source' },
  valore:     { title:'Valore Complessivo della Persona', sub:'Integrazione Competenze Trasversali + Competenze Professionali' },
  customercare:{ title:'Logica Customer Care', sub:'Gestione e analisi delle competenze Customer Care' },
  feedback:   { title:'Feedback e Piano di Sviluppo', sub:'Restituzione individuale e azioni di crescita' },
  ai:         { title:'Assistente AI', sub:'Interroga la dashboard in linguaggio naturale' },
};
const PAGE_META_BASE = {
  home:       { requires:null, render:()=>renderHome() },
  company:    { requires:null, render:()=>renderCompany() },
  anagrafica: { requires:null, render:()=>renderAnagrafica() },
  analisi:    { requires:null, render:()=>renderAnalisi() },
  soft:       { requires:'A', render:()=>renderSoft() },
  hard:       { requires:'B', render:()=>renderHard() },
  valore:     { requires:null, render:()=>renderValore() },
  customercare:{ requires:null, render:()=>renderCustomerCare() },
  feedback:   { requires:null, render:()=>renderFeedback() },
  ai:         { requires:null, render:()=>renderAI() },
};
function buildPageMeta(lang){
  const text = lang==='it' ? PAGE_META_TEXT_IT : PAGE_META_TEXT_EN;
  const out = {};
  Object.keys(PAGE_META_BASE).forEach(k => { out[k] = Object.assign({}, PAGE_META_BASE[k], text[k]); });
  return out;
}
let PAGE_META = buildPageMeta('it');

function getModuleFlags(){ const m = STATE.settings.modulo; return { A: m==='A'||m==='AB', B: m==='B'||m==='AB' }; }
function moduleRequirementMet(req){ if(!req) return true; if(req==='AB') return bothActive(); return moduleActive(req); }
function toggleModule(letter){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const f = getModuleFlags();
  let A=f.A, B=f.B;
  if(letter==='A') A=!A; else B=!B;
  if(!A && !B){ toast(UI.toastAtLeastOneModule, 'err'); return; }
  STATE.settings.modulo = (A&&B) ? 'AB' : (A ? 'A' : 'B');
  persist();
  afterModuleChange();
}
function afterModuleChange(){
  updateModulePills();
  renderNav();
  const meta = PAGE_META[CURRENT_PAGE];
  if(meta && !moduleRequirementMet(meta.requires)) navigateTo('home');
  else rerenderCurrentPage();
}
function updateModulePills(){
  const f = getModuleFlags();
  document.getElementById('pill-A').classList.toggle('active', f.A);
  document.getElementById('pill-B').classList.toggle('active', f.B);
  updateModuleTint();
}
/* Applies the Module A/B tint (flat color or blended gradient) to the page content area, and shows a
   redundant text pill next to the page title so the active module is never signaled by color alone. */
function updateModuleTint(){
  const content = document.getElementById('content');
  if(!content) return;
  const f = getModuleFlags();
  content.classList.remove('module-a-active','module-b-active','module-ab-active');
  let pillHtml = '';
  if(f.A && f.B){ content.classList.add('module-ab-active'); pillHtml = `<span class="module-title-pill ab">${esc(UI.homeModuleCompleteLabel)}</span>`; }
  else if(f.A){ content.classList.add('module-a-active'); pillHtml = `<span class="module-title-pill a">${esc(UI.moduleASoft)}</span>`; }
  else if(f.B){ content.classList.add('module-b-active'); pillHtml = `<span class="module-title-pill b">${esc(UI.moduleBHard)}</span>`; }
  const titleEl = document.getElementById('page-title');
  if(titleEl){
    const base = titleEl.querySelector('.title-text') ? titleEl.querySelector('.title-text').textContent : titleEl.textContent.trim();
    titleEl.innerHTML = `<span class="title-text">${esc(base)}</span>${pillHtml}`;
  }
}
function updateSidebarFooter(){
  document.getElementById('sf-company').textContent = STATE.settings.companyName;
  document.getElementById('sf-count').textContent = UI.employeesRecorded(STATE.employees.length);
}
function setTopbarActions(html){ document.getElementById('topbar-actions').innerHTML = html; }

function navBadgeFor(pageId){
  if(pageId==='feedback' && STATE && STATE.employees){
    const n = STATE.employees.filter(e=>e.feedbackNeeded).length;
    if(n>0) return `<span class="badge">${n}</span>`;
  }
  return '';
}
function toggleNavGroup(groupId){
  NAV_OPEN_GROUPS[groupId] = !NAV_OPEN_GROUPS[groupId];
  renderNav();
}
function toggleHomeCard(key){
  HOME_OPEN_CARDS[key] = !HOME_OPEN_CARDS[key];
  const body = document.getElementById('home-quad-body-'+key);
  const chevron = document.getElementById('home-quad-chevron-'+key);
  if(body) body.classList.toggle('open', HOME_OPEN_CARDS[key]);
  if(chevron) chevron.classList.toggle('open', HOME_OPEN_CARDS[key]);
}
function renderNav(){
  const nav = document.getElementById('mainnav');
  let html='';
  NAV_CONFIG.forEach(entry => {
    if(entry.type==='section'){
      if(entry.editOnly && !canEdit()) return;
      html += `<div class="nav-section-title">${esc(entry.label)}</div>`;
      return;
    }
    if(entry.type==='link'){
      if(!moduleRequirementMet(entry.requires)) return;
      html += `<div class="nav-item ${entry.id===CURRENT_PAGE?'active':''}" onclick="navigateTo('${entry.id}')">`+
              `<span class="ic">${ICONS[entry.icon]}</span>${esc(entry.label)}${entry.badge?navBadgeFor(entry.id):''}</div>`;
      return;
    }
    if(entry.type==='action'){
      if(entry.editOnly && !canEdit()) return;
      html += `<div class="nav-item" onclick="${entry.action}()">`+
              `<span class="ic">${ICONS[entry.icon]}</span>${esc(entry.label)}</div>`;
      return;
    }
    // group
    const visibleItems = entry.items.filter(it => moduleRequirementMet(it.requires));
    if(!visibleItems.length) return;
    const containsActive = visibleItems.some(it => it.id===CURRENT_PAGE);
    const isOpen = containsActive || !!NAV_OPEN_GROUPS[entry.groupId];
    html += `<div class="nav-item" onclick="toggleNavGroup('${entry.groupId}')">`+
            `<span class="ic">${ICONS[entry.icon]}</span>${esc(entry.label)}<span class="chevron ${isOpen?'open':''}">${ICONS.chevron}</span></div>`+
            `<div class="nav-sublist ${isOpen?'open':''}">`+
            visibleItems.map(it => `<div class="nav-subitem ${it.id===CURRENT_PAGE?'active':''}" onclick="navigateTo('${it.id}')">${esc(it.label)}</div>`).join('')+
            `</div>`;
  });
  nav.innerHTML = html;
}

function toggleMobileSidebar(force){
  const sb = document.getElementById('app-sidebar');
  const ov = document.getElementById('sidebar-overlay');
  const open = force!==undefined ? force : !sb.classList.contains('mobile-open');
  sb.classList.toggle('mobile-open', open);
  ov.classList.toggle('open', open);
}

function navigateTo(id){
  if(!PAGE_META[id]) return;
  if(!moduleRequirementMet(PAGE_META[id].requires)){ toast(UI.toastEnableModule, 'err'); return; }
  CURRENT_PAGE = id;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.getElementById('page-title').textContent = PAGE_META[id].title;
  document.getElementById('page-sub').textContent = PAGE_META[id].sub;
  setTopbarActions('');
  destroyCharts();
  renderNav();
  PAGE_META[id].render();
  updateModuleTint();
  document.getElementById('content').scrollTop = 0;
  toggleMobileSidebar(false);
}
function rerenderCurrentPage(){ if(PAGE_META[CURRENT_PAGE]) PAGE_META[CURRENT_PAGE].render(); }

/* ---------------------- MODAL helper ---------------------- */
function openModal(title, sub, bodyHtml, footHtml, wide=false){
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-sub').textContent = sub||'';
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-foot').innerHTML = footHtml||'';
  document.getElementById('modal-box').classList.toggle('wide', !!wide);
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal(){ document.getElementById('modal-overlay').classList.remove('open'); }

/* ---------------------- DRAWER helper (employee profile) ---------------------- */
let DRAWER_EMP_ID = null;
let DRAWER_EDIT_MODE = false;
function openDrawer(empId){
  const emp = STATE.employees.find(e=>e.id===empId);
  if(!emp) return;
  DRAWER_EMP_ID = empId;
  DRAWER_EDIT_MODE = false;
  document.getElementById('drawer-avatar').textContent = initials(emp.nome, emp.cognome);
  document.getElementById('drawer-name').textContent = emp.nome + ' ' + emp.cognome;
  document.getElementById('drawer-role').textContent = emp.ruolo + ' · ' + emp.area + (emp.reparto ? ' · ' + emp.reparto : '');
  document.getElementById('drawer-body').innerHTML = buildEmployeeProfileHtml(emp);
  renderQueuedStatTileCharts();
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}
function refreshDrawer(){
  const emp = STATE.employees.find(e=>e.id===DRAWER_EMP_ID);
  if(!emp) return;
  document.getElementById('drawer-avatar').textContent = initials(emp.nome, emp.cognome);
  document.getElementById('drawer-name').textContent = emp.nome + ' ' + emp.cognome;
  document.getElementById('drawer-role').textContent = emp.ruolo + ' · ' + emp.area + (emp.reparto ? ' · ' + emp.reparto : '');
  document.getElementById('drawer-body').innerHTML = buildEmployeeProfileHtml(emp);
  renderQueuedStatTileCharts();
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}

/* ============================= SETTINGS (language, color, users) ============================= */
let SETTINGS_TAB = 'language';
function openSettingsModal(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  SETTINGS_TAB = 'language';
  const body = `
    <div class="segmented" style="margin-bottom:16px;">
      <button class="${SETTINGS_TAB==='language'?'active':''}" onclick="setSettingsTab('language')">${ICONS.globe}${UI.tabLanguage}</button>
      <button class="${SETTINGS_TAB==='color'?'active':''}" onclick="setSettingsTab('color')">${ICONS.palette}${UI.tabColor}</button>
      <button class="${SETTINGS_TAB==='font'?'active':''}" onclick="setSettingsTab('font')">${ICONS.font}${UI.tabFont}</button>
      <button class="${SETTINGS_TAB==='users'?'active':''}" onclick="setSettingsTab('users')">${ICONS.userGear}${UI.tabUsers}</button>
      <button class="${SETTINGS_TAB==='testing'?'active':''}" onclick="setSettingsTab('testing')">${ICONS.checkSquare}${UI.tabTesting}</button>
      <button class="${SETTINGS_TAB==='survey'?'active':''}" onclick="setSettingsTab('survey')">${ICONS.notes}${UI.tabSurvey}</button>
      <button class="${SETTINGS_TAB==='softTargets'?'active':''}" onclick="setSettingsTab('softTargets')">${ICONS.value}${UI.tabSoftTargets}</button>
    </div>
    <div id="settings-tab-body">${renderSettingsTabBody()}</div>
  `;
  openModal(UI.settingsTitle, UI.settingsSub, body, `<button class="btn" onclick="closeModal()">${UI.settingsClose}</button>`, true);
}
function setSettingsTab(tab){
  SETTINGS_TAB = tab;
  document.querySelectorAll('#modal-body .segmented button').forEach((btn,i) => {
    btn.classList.toggle('active', ['language','color','font','users','testing','survey','softTargets'][i]===tab);
  });
  document.getElementById('settings-tab-body').innerHTML = renderSettingsTabBody();
}
function renderSettingsTabBody(){
  if(SETTINGS_TAB==='color') return renderColorSettings();
  if(SETTINGS_TAB==='font') return renderFontSettings();
  if(SETTINGS_TAB==='users') return renderUsersSettings();
  if(SETTINGS_TAB==='testing') return renderTestingSettings();
  if(SETTINGS_TAB==='survey') return renderSurveySettings();
  if(SETTINGS_TAB==='softTargets') return renderSoftTargetsSettings();
  return renderLanguageSettings();
}

function renderLanguageSettings(){
  const current = safeStorage.get(LANG_KEY) || 'it';
  return `
    <div class="field">
      <label>${UI.interfaceLanguage}</label>
      <select id="settings-lang-select" onchange="handleLanguageChange(this.value)" style="width:100%; padding:9px 11px; border:1px solid var(--border-strong); border-radius:var(--radius-sm); background:var(--surface);">
        <option value="it" ${current==='it'?'selected':''}>Italiano</option>
        <option value="en" ${current==='en'?'selected':''}>English</option>
      </select>
      <div class="hint">${UI.languageHint}</div>
    </div>
  `;
}
function handleLanguageChange(lang){
  applyLanguage(lang);
  applyLanguageData(lang);
  toast(lang==='it' ? UI.toastLanguageIt : UI.toastLanguageEn, 'ok');
  // Only refresh the Settings modal in place if it's already open on the language tab (e.g. the
  // admin used the dropdown there) — the topbar quick-toggle (toggleLanguageQuick) must not force
  // Settings open, since it's reachable by viewer-role users who can't open Settings at all.
  const modalOpen = document.getElementById('modal-overlay').classList.contains('open');
  if(modalOpen && SETTINGS_TAB==='language' && canEdit()) openSettingsModal();
}

const SWATCH_STYLE = "width:52px; height:38px; border:1px solid var(--border-strong); border-radius:8px; padding:2px; background:var(--surface); cursor:pointer; flex-shrink:0;";
function renderColorSettings(){
  const currentAccent = toHexColor(cssVar('--accent'));
  const currentSuccess = toHexColor(cssVar('--success'), '#17925b');
  const currentBg = toHexColor(cssVar('--bg'));
  const currentSurface = toHexColor(cssVar('--surface'), '#ffffff');
  const currentText = toHexColor(cssVar('--text-1'), '#10192b');
  const synced = isModuleColorSynced();
  return `
    <div class="field">
      <label>${UI.moduleColorsLabel}</label>
      <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:12px; color:var(--text-2); margin-bottom:12px; cursor:pointer;">
        <input type="checkbox" id="settings-module-sync" ${synced?'checked':''} onchange="handleModuleSyncToggle(this.checked)" style="width:15px; height:15px; accent-color:var(--accent); cursor:pointer;">
        ${UI.moduleSyncLabel}
      </label>
      ${synced ? `
        <div style="display:flex; align-items:center; gap:12px;">
          <input type="color" id="settings-module-both-input" value="${currentAccent}" style="${SWATCH_STYLE}" onchange="handleAccentChange(this.value)">
          <span class="small-note">${UI.moduleBothHint}</span>
        </div>
        <button class="btn btn-sm" style="margin-top:12px;" onclick="handleModuleResetBoth()">${UI.resetToDefault}</button>
      ` : `
        <div class="field-row">
          <div class="field" style="margin-bottom:0;">
            <label style="font-weight:600;">${UI.accentLabel}</label>
            <div style="display:flex; align-items:center; gap:10px;">
              <input type="color" id="settings-accent-input" value="${currentAccent}" style="${SWATCH_STYLE}" onchange="handleAccentChange(this.value)">
            </div>
            <button class="btn btn-sm" style="margin-top:10px;" onclick="handleAccentReset()">${UI.resetToDefault}</button>
          </div>
          <div class="field" style="margin-bottom:0;">
            <label style="font-weight:600;">${UI.successLabel}</label>
            <div style="display:flex; align-items:center; gap:10px;">
              <input type="color" id="settings-success-input" value="${currentSuccess}" style="${SWATCH_STYLE}" onchange="handleSuccessChange(this.value)">
            </div>
            <button class="btn btn-sm" style="margin-top:10px;" onclick="handleSuccessReset()">${UI.resetToDefault}</button>
          </div>
        </div>
        <div class="small-note" style="margin-top:10px;">${UI.accentHint}</div>
      `}
    </div>
    <div class="divider"></div>
    <div class="field">
      <label>${UI.bgLabel}</label>
      <div style="display:flex; align-items:center; gap:12px;">
        <input type="color" id="settings-bg-input" value="${currentBg}" style="${SWATCH_STYLE}" onchange="handleBgChange(this.value)">
        <span class="small-note">${UI.bgHint}</span>
      </div>
      <button class="btn btn-sm" style="margin-top:12px;" onclick="handleBgReset()">${UI.resetToDefault}</button>
    </div>
    <div class="divider"></div>
    <div class="field">
      <label>${UI.surfaceLabel}</label>
      <div style="display:flex; align-items:center; gap:12px;">
        <input type="color" id="settings-surface-input" value="${currentSurface}" style="${SWATCH_STYLE}" onchange="handleSurfaceChange(this.value)">
        <span class="small-note">${UI.surfaceHint}</span>
      </div>
      <button class="btn btn-sm" style="margin-top:12px;" onclick="handleSurfaceReset()">${UI.resetToDefault}</button>
    </div>
    <div class="divider"></div>
    <div class="field">
      <label>${UI.textLabel}</label>
      <div style="display:flex; align-items:center; gap:12px;">
        <input type="color" id="settings-text-input" value="${currentText}" style="${SWATCH_STYLE}" onchange="handleTextChange(this.value)">
        <span class="small-note">${UI.textHint}</span>
      </div>
      <button class="btn btn-sm" style="margin-top:12px;" onclick="handleTextReset()">${UI.resetToDefault}</button>
    </div>
  `;
}
function handleAccentChange(hex){
  applyCustomAccent(hex, true);
  if(isModuleColorSynced()) applyCustomSuccess(hex, true);
  toast(UI.toastAccentUpdated, 'ok');
  rerenderCurrentPage();
}
function handleAccentReset(){
  resetCustomAccent();
  if(isModuleColorSynced()) resetCustomSuccess();
  setSettingsTab('color');
  toast(UI.toastAccentReset, 'ok');
  rerenderCurrentPage();
}
function handleSuccessChange(hex){ applyCustomSuccess(hex, true); toast(UI.toastSuccessUpdated, 'ok'); rerenderCurrentPage(); }
function handleSuccessReset(){ resetCustomSuccess(); setSettingsTab('color'); toast(UI.toastSuccessReset, 'ok'); rerenderCurrentPage(); }
function handleModuleSyncToggle(checked){
  if(checked){ safeStorage.set(MODULE_SYNC_KEY, '1'); applyCustomSuccess(cssVar('--accent'), true); }
  else{ safeStorage.remove(MODULE_SYNC_KEY); }
  setSettingsTab('color');
  rerenderCurrentPage();
}
function handleModuleResetBoth(){
  resetCustomAccent(); resetCustomSuccess();
  setSettingsTab('color');
  toast(UI.toastModuleColorsReset, 'ok');
  rerenderCurrentPage();
}
function handleBgChange(hex){ applyCustomBg(hex, true); toast(UI.toastBgUpdated, 'ok'); rerenderCurrentPage(); }
function handleBgReset(){ resetCustomBg(); setSettingsTab('color'); toast(UI.toastBgReset, 'ok'); rerenderCurrentPage(); }
function handleSurfaceChange(hex){ applyCustomSurface(hex, true); toast(UI.toastSurfaceUpdated, 'ok'); rerenderCurrentPage(); }
function handleSurfaceReset(){ resetCustomSurface(); setSettingsTab('color'); toast(UI.toastSurfaceReset, 'ok'); rerenderCurrentPage(); }
function handleTextChange(hex){ applyCustomText(hex, true); toast(UI.toastTextUpdated, 'ok'); rerenderCurrentPage(); }
function handleTextReset(){ resetCustomText(); setSettingsTab('color'); toast(UI.toastTextReset, 'ok'); rerenderCurrentPage(); }

function renderFontSettings(){
  const current = safeStorage.get(FONT_KEY) || 'inter';
  return `
    <div class="field">
      <label>${UI.fontLabel}</label>
      <select id="settings-font-select" onchange="handleFontChange(this.value)" style="width:100%; padding:9px 11px; border:1px solid var(--border-strong); border-radius:var(--radius-sm); background:var(--surface);">
        ${FONT_OPTIONS.map(f => `<option value="${f.id}" ${current===f.id?'selected':''}>${esc(f.label)}</option>`).join('')}
      </select>
      <div class="hint">${UI.fontHint}</div>
    </div>
    <div class="divider"></div>
    <div class="field">
      <label>${UI.fontPreviewLabel}</label>
      <div class="card" style="padding:16px;">
        <div style="font-size:19px; font-weight:800; margin-bottom:4px;">SKILL-VISION Competency Assessment</div>
        <div style="font-size:13px; color:var(--text-2);">The quick brown fox jumps over the lazy dog — 0123456789</div>
      </div>
    </div>
    <button class="btn btn-sm" style="margin-top:14px;" onclick="handleFontReset()">${UI.resetToDefault}</button>
  `;
}
function handleFontChange(id){ applyCustomFont(id, true); toast(UI.toastFontUpdated, 'ok'); }
function handleFontReset(){ resetCustomFont(); setSettingsTab('font'); toast(UI.toastFontReset, 'ok'); }

/* Module A test totalizer settings — admin-editable placeholders for tests acquired/dispatched,
   prepared so a future API integration can populate STATE.settings.testsAcquired/testsDispatched directly. */
function renderTestingSettings(){
  const acquired = Number(STATE.settings.testsAcquired) || 0;
  const dispatched = Number(STATE.settings.testsDispatched) || 0;
  return `
    <div class="small-note" style="margin-bottom:12px;">${UI.testsSettingsHint}</div>
    <div class="field-row">
      <div class="field"><label>${UI.testsAcquiredLabel}</label><input type="number" min="0" step="1" id="settings-tests-acquired" value="${acquired}"></div>
      <div class="field"><label>${UI.testsDispatchedLabel}</label><input type="number" min="0" step="1" id="settings-tests-dispatched" value="${dispatched}"></div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="saveTestingSettings()">${UI.saveChanges}</button>
  `;
}
function saveTestingSettings(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const acquired = Math.max(0, parseInt(document.getElementById('settings-tests-acquired').value, 10) || 0);
  const dispatched = Math.max(0, parseInt(document.getElementById('settings-tests-dispatched').value, 10) || 0);
  STATE.settings.testsAcquired = acquired;
  STATE.settings.testsDispatched = dispatched;
  persist();
  toast(UI.toastTestsUpdated, 'ok');
  if(CURRENT_PAGE==='home') rerenderCurrentPage();
}

/* External survey link — a storage slot only; nothing in this app currently consumes it, it's
   just kept available for whatever distributes the soft-skills survey to respondents. */
function renderSurveySettings(){
  const link = STATE.settings.surveyLink || '';
  const mode = STATE.settings.surveySenderMode || 'referente';
  const referenteEmail = (STATE.company && STATE.company.referente && STATE.company.referente.email) || '';
  return `
    <div class="field">
      <label>${UI.surveyLinkLabel}</label>
      <input type="url" id="settings-survey-link" value="${esc(link)}" placeholder="${esc(UI.surveyLinkPh)}" style="width:100%; padding:9px 11px; border:1px solid var(--border-strong); border-radius:var(--radius-sm); background:var(--surface);">
      <div class="hint">${UI.surveyLinkHint}</div>
    </div>

    <div class="divider"></div>
    <div class="field">
      <label>${UI.preTestLetterLabel}</label>
      <textarea id="settings-pre-test-letter" rows="10" style="font-family:var(--font-mono); font-size:12px;">${esc(STATE.settings.preTestLetter||'')}</textarea>
      <div class="hint">${UI.preTestLetterHint}</div>
    </div>

    <div class="divider"></div>
    <div class="card-title" style="margin-bottom:10px;">${UI.surveySenderMode}</div>
    <div class="field">
      <label class="checkbox-row" style="gap:8px; margin-bottom:6px;"><input type="radio" name="settings-sender-mode" value="referente" ${mode==='referente'?'checked':''}>${UI.surveySenderModeReferente}${referenteEmail?` — ${esc(referenteEmail)}`:` (${esc(UI.surveySenderMissingWarning)})`}</label>
      <label class="checkbox-row" style="gap:8px;"><input type="radio" name="settings-sender-mode" value="admin" ${mode==='admin'?'checked':''}>${UI.surveySenderModeAdmin}</label>
    </div>
    <div class="field">
      <label>${UI.adminSenderEmailLabel}</label>
      <input type="email" id="settings-admin-sender-email" value="${esc(STATE.settings.adminSenderEmail||'')}" placeholder="${esc(UI.adminSenderEmailPh)}">
    </div>

    <div class="divider"></div>
    <div class="field">
      <label>${UI.surveyEmailSubjectLabel}</label>
      <input type="text" id="settings-survey-email-subject" value="${esc(STATE.settings.surveyEmailSubject||'')}">
    </div>
    <div class="field">
      <label>${UI.surveyEmailBodyLabel}</label>
      <textarea id="settings-survey-email-body" rows="6" style="font-family:var(--font-mono); font-size:12.5px;">${esc(STATE.settings.surveyEmailBody||'')}</textarea>
      <div class="hint">${UI.surveyEmailTemplateHint}</div>
    </div>

    <div class="divider"></div>
    <div class="card-title" style="margin-bottom:6px;">${UI.emailApiSectionTitle}</div>
    <div class="small-note" style="margin-bottom:10px;">${UI.emailApiSectionHint}</div>
    <div class="field">
      <label>${UI.emailApiEndpointLabel}</label>
      <input type="url" id="settings-email-api-endpoint" value="${esc(STATE.settings.emailApiEndpoint||'')}" placeholder="${esc(UI.emailApiEndpointPh)}">
    </div>
    <div class="field">
      <label>${UI.emailApiKeyLabel}</label>
      <input type="password" id="settings-email-api-key" value="${esc(STATE.settings.emailApiKey||'')}" placeholder="${esc(UI.emailApiKeyPh)}" autocomplete="off">
      <div class="hint">${UI.emailApiKeyHint}</div>
    </div>

    <button class="btn btn-primary btn-sm" onclick="saveSurveyLink()">${UI.saveChanges}</button>
  `;
}
function saveSurveyLink(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  STATE.settings.surveyLink = document.getElementById('settings-survey-link').value.trim();
  STATE.settings.preTestLetter = document.getElementById('settings-pre-test-letter').value;
  const modeInput = document.querySelector('input[name="settings-sender-mode"]:checked');
  STATE.settings.surveySenderMode = modeInput ? modeInput.value : 'referente';
  STATE.settings.adminSenderEmail = document.getElementById('settings-admin-sender-email').value.trim();
  STATE.settings.surveyEmailSubject = document.getElementById('settings-survey-email-subject').value.trim();
  STATE.settings.surveyEmailBody = document.getElementById('settings-survey-email-body').value;
  STATE.settings.emailApiEndpoint = document.getElementById('settings-email-api-endpoint').value.trim();
  STATE.settings.emailApiKey = document.getElementById('settings-email-api-key').value.trim();
  persist();
  toast(UI.toastSurveyLinkSaved, 'ok');
}

/* Company-wide default "expected" (atteso) values for the 35 soft skills (Section 3 gap fix): mirrors
   the fixed 6.5 benchmark Module B uses, but for Module A — and, unlike Module B's constant, this one
   is admin-editable. Applied as the baseline for newly added employees (submitAddEmployee); a role's
   focus skills still get a +2 bump on top of this baseline. Existing employees' per-skill "Expected"
   values are edited individually from the Soft Skills evaluation form, as before. */
function softSkillTargetDefault(skillId){
  const t = (STATE.settings.softSkillTargets||{})[skillId];
  return (typeof t === 'number') ? t : 6;
}
function renderSoftTargetsSettings(){
  const clusters = {};
  SOFT_SKILLS.forEach(s => { (clusters[s.cluster] = clusters[s.cluster]||[]).push(s); });
  const body = Object.keys(clusters).map(cl => `
    <div class="cluster-block">
      <div class="cluster-title">${esc(cl)}</div>
      ${clusters[cl].map(s => `
        <div class="score-row">
          <div class="sname">${esc(s.name)}</div>
          <input type="number" min="1" max="10" step="1" id="soft-target-${s.id}" value="${softSkillTargetDefault(s.id)}" style="width:70px; padding:6px 8px; border:1px solid var(--border-strong); border-radius:var(--radius-sm); background:var(--surface); text-align:center;">
        </div>
      `).join('')}
    </div>
  `).join('');
  return `
    <div class="small-note" style="margin-bottom:12px;">${UI.softTargetsHint}</div>
    <div style="max-height:420px; overflow-y:auto; padding-right:4px;">${body}</div>
    <button class="btn btn-primary btn-sm" style="margin-top:14px;" onclick="saveSoftTargets()">${UI.saveChanges}</button>
  `;
}
function saveSoftTargets(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  if(!STATE.settings.softSkillTargets) STATE.settings.softSkillTargets = {};
  SOFT_SKILLS.forEach(s => {
    const el = document.getElementById('soft-target-'+s.id);
    if(el) STATE.settings.softSkillTargets[s.id] = Math.min(10, Math.max(1, parseInt(el.value,10) || 6));
  });
  persist();
  toast(UI.toastSoftTargetsSaved, 'ok');
}

function roleSelectHtml(id, selected){
  return `<select id="${id}"><option value="admin" ${selected!=='viewer'?'selected':''}>${UI.roleAdmin}</option><option value="viewer" ${selected==='viewer'?'selected':''}>${UI.roleViewer}</option></select>`;
}
function renderUsersSettings(){
  const users = loadUsers();
  return `
    <div class="small-note" style="margin-bottom:12px;">${UI.usersHint}</div>
    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
      ${users.map((u,i)=> i===EDITING_USER_INDEX ? `
        <div style="display:flex; flex-direction:column; gap:8px; padding:9px 12px; border:1px solid var(--accent); border-radius:var(--radius-sm);">
          <div class="field-row">
            <div class="field"><label>${UI.newUsername}</label><input type="text" id="edit-username-${i}" value="${esc(u.username)}"></div>
            <div class="field"><label>${UI.newPassword}</label><input type="text" id="edit-password-${i}" value="${esc(u.password)}"></div>
            <div class="field"><label>${UI.roleLabel}</label>${roleSelectHtml('edit-role-'+i, u.role)}</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-primary btn-sm" onclick="saveEditUser(${i})">${UI.saveChanges}</button>
            <button class="btn btn-sm" onclick="cancelEditUser()">${UI.cancelEdit}</button>
          </div>
        </div>
      ` : `
        <div style="display:flex; align-items:center; gap:10px; padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm);">
          <span class="icon-chip accent" style="width:30px; height:30px;">${ICONS.userGear}</span>
          <div style="flex:1;">
            <div style="font-weight:700; font-size:12.8px;">${esc(u.username)}</div>
            <div style="font-size:11px; color: var(--text-3); font-weight:600;">${u.role==='viewer'?UI.roleViewer:UI.roleAdmin}</div>
          </div>
          <button class="btn btn-sm" title="${UI.editUserTitle}" onclick="startEditUser(${i})">${ICONS.edit}</button>
          <button class="btn btn-sm btn-danger-outline" onclick="removeUserRow(${i})" ${users.length<=1?`disabled title="${UI.atLeastOneUserTitle}"`:''}>${ICONS.trash}</button>
        </div>
      `).join('')}
    </div>
    ${EDITING_USER_INDEX===null ? `
    <div class="field-row">
      <div class="field"><label>${UI.newUsername}</label><input type="text" id="settings-new-username"></div>
      <div class="field"><label>${UI.newPassword}</label><input type="text" id="settings-new-password"></div>
      <div class="field"><label>${UI.roleLabel}</label>${roleSelectHtml('settings-new-role', 'admin')}</div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="addUserRow()">${ICONS.plus}${UI.addUser}</button>
    ` : ''}
  `;
}
function addUserRow(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const uEl = document.getElementById('settings-new-username');
  const pEl = document.getElementById('settings-new-password');
  const rEl = document.getElementById('settings-new-role');
  const username = uEl.value.trim();
  const password = pEl.value.trim();
  const role = rEl && rEl.value==='viewer' ? 'viewer' : 'admin';
  if(!username || !password){ toast(UI.toastEnterUserPass, 'err'); return; }
  const users = loadUsers();
  if(users.some(u=>u.username.toLowerCase()===username.toLowerCase())){ toast(UI.toastUserExists, 'err'); return; }
  users.push({ username, password, role });
  saveUsers(users);
  setSettingsTab('users');
  toast(UI.toastUserAdded, 'ok');
}
function removeUserRow(i){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const users = loadUsers();
  if(users.length<=1){ toast(UI.toastAtLeastOneUser, 'err'); return; }
  if(users[i].role!=='viewer' && users.filter(u=>u.role!=='viewer').length<=1){ toast(UI.toastAtLeastOneAdmin, 'err'); return; }
  if(!confirm(UI.confirmRemoveUser(users[i].username))) return;
  users.splice(i,1);
  if(EDITING_USER_INDEX===i) EDITING_USER_INDEX = null;
  saveUsers(users);
  setSettingsTab('users');
  toast(UI.toastUserRemoved, 'ok');
}
function startEditUser(i){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  EDITING_USER_INDEX = i;
  setSettingsTab('users');
}
function cancelEditUser(){
  EDITING_USER_INDEX = null;
  setSettingsTab('users');
}
function saveEditUser(i){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const uEl = document.getElementById('edit-username-'+i);
  const pEl = document.getElementById('edit-password-'+i);
  const rEl = document.getElementById('edit-role-'+i);
  const username = uEl.value.trim();
  const password = pEl.value.trim();
  const role = rEl && rEl.value==='viewer' ? 'viewer' : 'admin';
  if(!username || !password){ toast(UI.toastEnterUserPass, 'err'); return; }
  const users = loadUsers();
  if(users.some((u,idx)=> idx!==i && u.username.toLowerCase()===username.toLowerCase())){ toast(UI.toastUserExists, 'err'); return; }
  if(role==='viewer' && users[i].role!=='viewer' && users.filter((u,idx)=>idx!==i && u.role!=='viewer').length===0){ toast(UI.toastAtLeastOneAdmin, 'err'); return; }
  const sessionUsername = safeStorage.sessionGet(CURRENT_USER_KEY);
  const wasCurrentUser = sessionUsername && users[i].username.toLowerCase() === sessionUsername.toLowerCase();
  users[i] = { username, password, role };
  saveUsers(users);
  if(wasCurrentUser){ CURRENT_USER_ROLE = role; safeStorage.sessionSet(CURRENT_USER_KEY, username); }
  EDITING_USER_INDEX = null;
  setSettingsTab('users');
  toast(UI.toastUserUpdated, 'ok');
  if(wasCurrentUser){ applyRolePermissions(); renderNav(); navigateTo(CURRENT_PAGE); }
}

/* ============================= EXCEL IMPORT (SheetJS) ============================= */
// Normalizes header/sheet-name text for fuzzy matching: lowercase, strip accents, collapse punctuation to spaces.
function normalizeHeader(s){
  return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
const ANAG_FIELD_ALIASES = {
  nome: ['nome','first name','firstname'],
  cognome: ['cognome','last name','lastname','surname'],
  nomeCompleto: ['nome e cognome','nominativo','full name','dipendente','nome completo','name'],
  email: ['email','e mail','indirizzo email','company email','mail'],
  area: ['area','area aziendale','area organigramma','divisione','business area'],
  reparto: ['reparto','dipartimento','department'],
  ruolo: ['ruolo','qualifica','job title','posizione','role','mansione aziendale'],
  mansione: ['mansione','descrizione mansione','attivita svolte','job description','duties','compiti'],
  manager: ['responsabile','manager','responsabile diretto','superiore','capo'],
  seniority: ['seniority','anzianita','anni di servizio','tenure','anzianita aziendale'],
};
// Given a sheet's header row (array of raw header strings), returns { field: originalHeaderText }.
// Two-pass header matching: exact match first (so a compound label like "Nome e Cognome" is claimed by
// nomeCompleto before the shorter "nome" alias can swallow it), then substring match — but only against
// short header cells, so long free-text question sentences (assessment sheets) never falsely match a
// generic single-word alias like "ruolo" or "dipendente" that happens to appear inside the sentence.
function matchAnagFieldColumns(headers){
  const colMap = {};
  const used = new Set();
  const fields = Object.keys(ANAG_FIELD_ALIASES);
  headers.forEach(h => {
    if(used.has(h)) return;
    const n = normalizeHeader(h);
    if(!n) return;
    for(const field of fields){
      if(colMap[field]) continue;
      if(ANAG_FIELD_ALIASES[field].some(alias => n===alias)){ colMap[field] = h; used.add(h); break; }
    }
  });
  headers.forEach(h => {
    if(used.has(h)) return;
    const n = normalizeHeader(h);
    if(!n || n.length > 40) return;
    for(const field of fields){
      if(colMap[field]) continue;
      if(ANAG_FIELD_ALIASES[field].some(alias => n.includes(alias))){ colMap[field] = h; used.add(h); break; }
    }
  });
  return colMap;
}
function anagSheetName(workbook){
  return workbook.SheetNames.find(name => {
    const n = normalizeHeader(name);
    return n.includes('dati survey') || n.includes('organigramma') || n.includes('anagrafica') || n.includes('survey');
  });
}
function parseAnagraficaWorkbook(workbook){
  const sheetName = anagSheetName(workbook);
  if(!sheetName) return { rows:[], sheetName:null };
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval:'', raw:false });
  if(!raw.length) return { rows:[], sheetName };
  const headers = Object.keys(raw[0]);
  const colMap = matchAnagFieldColumns(headers);
  const rows = raw.map(r => {
    let nome = colMap.nome ? String(r[colMap.nome]).trim() : '';
    let cognome = colMap.cognome ? String(r[colMap.cognome]).trim() : '';
    if(!nome && !cognome && colMap.nomeCompleto){
      const full = String(r[colMap.nomeCompleto]).trim();
      const parts = full.split(/\s+/);
      nome = parts.shift() || '';
      cognome = parts.join(' ');
    }
    return {
      nome, cognome,
      email: colMap.email ? String(r[colMap.email]).trim() : '',
      area: colMap.area ? String(r[colMap.area]).trim() : '',
      reparto: colMap.reparto ? String(r[colMap.reparto]).trim() : '',
      ruolo: colMap.ruolo ? String(r[colMap.ruolo]).trim() : '',
      mansione: colMap.mansione ? String(r[colMap.mansione]).trim() : '',
      manager: colMap.manager ? String(r[colMap.manager]).trim() : '',
      seniority: colMap.seniority ? String(r[colMap.seniority]).trim() : '',
    };
  }).filter(r => r.nome || r.cognome || r.email);
  return { rows, sheetName };
}

// Builds a lookup from normalized column header text -> APEX 5D item code (A1..E5),
// covering both English and Italian labels regardless of the app's current UI language.
function buildApexHeaderLookup(){
  const map = {};
  [APEX5D_DIMENSIONS_EN, APEX5D_DIMENSIONS_IT].forEach(dims => {
    dims.forEach(dim => {
      dim.items.forEach(it => {
        map[normalizeHeader(it.cod)] = it.cod;
        map[normalizeHeader(it.area)] = it.cod;
        map[normalizeHeader(it.cod + ' ' + it.area)] = it.cod;
        map[normalizeHeader(it.q)] = it.cod;
      });
    });
  });
  return map;
}
const APEX_ITEM_ORDER = ['A1','A2','A3','A4','A5','B1','B2','B3','B4','B5','C1','C2','C3','C4','C5','D1','D2','D3','D4','D5','E1','E2','E3','E4','E5'];
function sourceFromSheetName(name){
  const n = normalizeHeader(name);
  if(n.includes('responsabile') || n.includes('manager')) return 'resp';
  if(n.includes('peer') || n.includes('collega')) return 'peer';
  if(n.includes('autovalutazione') || n.includes('self')) return 'auto';
  return null;
}
function parseAssessmentWorkbook(workbook){
  const apexLookup = buildApexHeaderLookup();
  const rows = [];
  let usedFallback = false;
  let unmappedCols = 0;
  const sheetsFound = [];
  workbook.SheetNames.forEach(sheetName => {
    const source = sourceFromSheetName(sheetName);
    if(!source) return;
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval:'', raw:true });
    if(!raw.length) return;
    const headers = Object.keys(raw[0]);
    const idColMap = matchAnagFieldColumns(headers);
    const idCols = [idColMap.nomeCompleto, idColMap.email, idColMap.nome, idColMap.cognome].filter(Boolean);
    // Map each remaining column to an APEX item code, either by known question/area text or by position fallback.
    const scoreCols = headers.filter(h => !idCols.includes(h));
    const directMap = {};
    scoreCols.forEach(h => { const cod = apexLookup[normalizeHeader(h)]; if(cod) directMap[h] = cod; });
    let colToCod = directMap;
    if(Object.keys(directMap).length === 0 && scoreCols.length > 0 && scoreCols.length <= APEX_ITEM_ORDER.length){
      colToCod = {};
      scoreCols.forEach((h,i) => { colToCod[h] = APEX_ITEM_ORDER[i]; });
      usedFallback = true;
    } else {
      unmappedCols += scoreCols.filter(h => !directMap[h]).length;
    }
    let rowCount = 0;
    raw.forEach(r => {
      let nome = idColMap.nome ? String(r[idColMap.nome]).trim() : '';
      let cognome = idColMap.cognome ? String(r[idColMap.cognome]).trim() : '';
      if(!nome && !cognome && idColMap.nomeCompleto){
        const full = String(r[idColMap.nomeCompleto]).trim();
        const parts = full.split(/\s+/);
        nome = parts.shift() || '';
        cognome = parts.join(' ');
      }
      const email = idColMap.email ? String(r[idColMap.email]).trim() : '';
      if(!nome && !cognome && !email) return;
      const items = {};
      Object.keys(colToCod).forEach(h => {
        const v = Number(r[h]);
        if(!isNaN(v) && r[h]!=='') items[colToCod[h]] = clamp(Math.round(v), 1, 10);
      });
      if(Object.keys(items).length === 0) return;
      rows.push({ source, nome, cognome, email, items });
      rowCount++;
    });
    sheetsFound.push({ sheetName, source, rowCount });
  });
  return { rows, sheetsFound, usedFallback, unmappedCols };
}

/* Shared employee-identity matching for every external-data path (bulk Excel anagrafica/assessment import,
   and the PDF result import below): email first, full-name fallback — the exact rule already used here
   before this was factored out, kept identical so existing imports behave the same. */
function findEmployeeByIdentity(nome, cognome, email){
  const emailKey = (email||'').trim().toLowerCase();
  const fullKey = ((nome||'')+' '+(cognome||'')).trim().toLowerCase();
  let emp = null;
  if(emailKey) emp = STATE.employees.find(e => (e.email||'').trim().toLowerCase()===emailKey);
  if(!emp && fullKey) emp = STATE.employees.find(e => (e.nome+' '+e.cognome).trim().toLowerCase()===fullKey);
  return emp || null;
}
function mergeImportedAnagrafica(rows){
  let created=0, updated=0;
  rows.forEach(r => {
    const emp = findEmployeeByIdentity(r.nome, r.cognome, r.email);
    if(emp){
      if(r.nome) emp.nome = r.nome;
      if(r.cognome) emp.cognome = r.cognome;
      if(r.email) emp.email = r.email;
      if(r.area) emp.area = r.area;
      if(r.reparto) emp.reparto = r.reparto;
      if(r.ruolo) emp.ruolo = r.ruolo;
      if(r.mansione) emp.mansione = r.mansione;
      if(r.manager) emp.manager = r.manager;
      if(r.seniority) emp.seniority = r.seniority;
      updated++;
    } else {
      const ruolo = r.ruolo || 'Unassigned';
      const req = (STATE.roleProfiles[ruolo] && STATE.roleProfiles[ruolo].requiredSkills) || ROLE_FOCUS_SKILLS[ruolo] || [];
      if(!STATE.roleProfiles[ruolo]) STATE.roleProfiles[ruolo] = { requiredSkills: req };
      const soft = {}; SOFT_SKILLS.forEach(s => { const base = softSkillTargetDefault(s.id); soft[s.id] = { ottenuto:6, atteso: req.includes(s.id) ? Math.min(10, base+2) : base }; });
      const hard = { resp:{}, peer:{}, auto:{} };
      APEX5D_DIMENSIONS.forEach(d=>d.items.forEach(it=>{ APEX_SOURCES.forEach(src=>{ hard[src.key][it.cod]=6; }); }));
      STATE.employees.push({
        id: uid('emp'), nome: r.nome||'', cognome: r.cognome||'', email: r.email||'',
        area: r.area||'Unassigned', reparto: r.reparto||'', ruolo, mansione: r.mansione||'', tipoProfilo:'Employee',
        manager: r.manager||'', seniority: r.seniority||'',
        sesso:'', livelloCcnl:'', ral:0, benefit:'', assenzeProgrammate:[], archived:null,
        soft, hard, hardEvaluatedBy:{ resp:'', peer:'', auto:'' }, hardHistory:[], softHistory:[], feedbackNeeded:false, developmentPlan:{ azioni:'', formazione:'', coaching:'', obiettivi:'' },
        createdAt: new Date().toISOString(),
      });
      created++;
    }
  });
  return { created, updated };
}
function mergeImportedAssessment(rows, periodId){
  let matched=0, unmatched=0;
  const touchedEmpIds = new Set();
  rows.forEach(r => {
    const emp = findEmployeeByIdentity(r.nome, r.cognome, r.email);
    if(!emp){ unmatched++; return; }
    if(!emp.hard[r.source]) emp.hard[r.source] = {};
    Object.keys(r.items).forEach(cod => { emp.hard[r.source][cod] = r.items[cod]; });
    touchedEmpIds.add(emp.id);
    matched++;
  });
  // One hardHistory snapshot per employee actually touched by this import — same shape submitHardEval /
  // submitRestrictedEval already push, so a bulk import integrates with "data ultima rilevazione",
  // "precedenti valutazioni", historical comparison and "scarica report" with no further code changes.
  // A single snapshot per employee (not one per row) even if the workbook mixes resp/peer/auto sheets for
  // the same person, mirroring "one completed assessment = one history entry".
  if(touchedEmpIds.size){
    const period = (STATE.evalPeriods||[]).find(p=>p.id===periodId);
    touchedEmpIds.forEach(id => {
      const emp = STATE.employees.find(e=>e.id===id);
      if(!emp) return;
      if(!Array.isArray(emp.hardHistory)) emp.hardHistory = [];
      const hsm = computeHardSummary(emp);
      emp.hardHistory.push({
        module: 'professional',
        periodId, periodLabel: period?period.label:'', date: new Date().toISOString(),
        source: 'import_xlsx', apexScore: hsm.apexScore,
        dims: hsm.dims.map(d=>({code:d.code, name:d.name, score:d.mediaTotale})),
      });
    });
  }
  return { matched, unmatched };
}

let IMPORT_PENDING = null; // { anag: {rows, sheetName}, assess: {rows, sheetsFound, usedFallback, unmappedCols} }
function openImportModal(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  IMPORT_PENDING = null;
  const body = `
    <div class="dropzone" id="import-dropzone" onclick="document.getElementById('import-file-input').click()">
      ${ICONS.upload}
      <div class="dz-title">${UI.dzTitle}</div>
      <div class="dz-sub">${UI.dzSub}</div>
    </div>
    <input type="file" id="import-file-input" accept=".xlsx,.xls,.ods" style="display:none;" onchange="onImportFileSelected(this.files[0])">
    <div class="small-note" style="margin-top:10px;">${esc(UI.importPdfHint)} <a href="javascript:void(0)" onclick="closeModal(); openPdfImportModal();" style="color:var(--link); font-weight:700; text-decoration:none;">${esc(UI.importPdfLinkLabel)}</a></div>
    <div id="import-modal-extra"></div>
  `;
  openModal(UI.importModalTitle, UI.importModalSub, body, `<button class="btn" onclick="closeModal()">${UI.importCancel}</button>`, true);
  const dz = document.getElementById('import-dropzone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('dragover');
    if(e.dataTransfer.files && e.dataTransfer.files[0]) onImportFileSelected(e.dataTransfer.files[0]);
  });
}
async function onImportFileSelected(file){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  if(!file) return;
  try{
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type:'array' });
    const anag = parseAnagraficaWorkbook(workbook);
    const assess = parseAssessmentWorkbook(workbook);
    if(!anag.rows.length && !assess.rows.length){
      toast(UI.importNoSheets, 'err');
      return;
    }
    IMPORT_PENDING = { anag, assess, fileName: file.name };
    renderImportPreview();
  }catch(e){
    console.error(e);
    toast(UI.importReadError, 'err');
  }
}
function renderImportPreview(){
  const { anag, assess } = IMPORT_PENDING;
  const bySource = { resp:0, peer:0, auto:0 };
  assess.sheetsFound.forEach(s => { bySource[s.source] = (bySource[s.source]||0) + s.rowCount; });
  let html = `<div class="small-note" style="margin-bottom:12px;"><b>${UI.importPreviewTitle}</b></div>`;
  html += `<div class="import-summary-row"><span>${anag.sheetName ? UI.importAnagFound(anag.rows.length, anag.sheetName) : UI.importAnagNone}</span>${anag.rows.length?`<span class="n">${anag.rows.length}</span>`:''}</div>`;
  html += `<div class="import-summary-row"><span>${assess.rows.length ? UI.importAssessFound(assess.rows.length) : UI.importAssessNone}</span>${assess.rows.length?`<span class="n">${assess.rows.length}</span>`:''}</div>`;
  if(assess.rows.length){
    html += `<div class="small-note" style="margin-bottom:12px;">${UI.importAssessBySource(bySource.resp||0, bySource.peer||0, bySource.auto||0)}</div>`;
  }
  if(assess.usedFallback) html += `<div class="small-note" style="color:var(--warning); margin-bottom:8px;">${ICONS.alertTriangle}&nbsp;${UI.importFallbackNote}</div>`;
  if(assess.unmappedCols > 0) html += `<div class="small-note" style="color:var(--text-3); margin-bottom:8px;">${UI.importUnmappedNote(assess.unmappedCols)}</div>`;
  if(assess.rows.length){
    const periods = ensureDefaultPeriod();
    html += `<div class="field" style="max-width:320px;"><label>${esc(UI.importAssessPeriodLabel)}</label><select id="import-assess-period">${periods.map(p=>`<option value="${p.id}" ${p===periods[periods.length-1]?'selected':''}>${esc(p.label)}</option>`).join('')}</select></div>`;
  }
  document.getElementById('import-modal-extra').innerHTML = html;
  const foot = `<button class="btn" onclick="openImportModal()">${UI.importBack}</button><button class="btn btn-primary" onclick="commitImport()">${UI.importConfirm}</button>`;
  document.getElementById('modal-foot').innerHTML = foot;
}
function commitImport(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  if(!IMPORT_PENDING) return;
  const { anag, assess } = IMPORT_PENDING;
  const periodSel = document.getElementById('import-assess-period');
  const periodId = periodSel ? periodSel.value : (ensureDefaultPeriod()[0]||{}).id;
  const a = anag.rows.length ? mergeImportedAnagrafica(anag.rows) : { created:0, updated:0 };
  const b = assess.rows.length ? mergeImportedAssessment(assess.rows, periodId) : { matched:0, unmatched:0 };
  persist();
  updateSidebarFooter();
  rerenderCurrentPage();
  closeModal();
  IMPORT_PENDING = null;
  toast(UI.importSuccessToast(a.created, a.updated, b.matched), 'ok');
  if(b.unmatched > 0) setTimeout(() => toast(UI.importUnmatchedToast(b.unmatched), 'err'), 400);
}

/* ============================= EXTERNAL PDF ASSESSMENT-RESULT IMPORT =============================
   Architecture for "PDF result → employee assessment record", per the client's final requirement. No PDF
   format is assumed here — extractAssessmentDataFromPdf() is the single seam where real parsing goes once
   the external company supplies a sample PDF and its field/label layout; today it honestly reports that it
   cannot parse anything yet, rather than guessing. Everything AFTER extraction is fully built and reuses
   what already exists in this file:
     - findEmployeeByIdentity()      — the same email/name matching mergeImportedAnagrafica/Assessment use
     - emp.hardHistory                — the exact snapshot array/shape submitHardEval, submitRestrictedEval
                                         and mergeImportedAssessment already push to (source:'external_pdf'
                                         here, so imported results are visually distinguishable — see
                                         assessmentSourceLabel below — without a second/parallel data model)
     - getEmployeePeriodSnapshots(), buildPeriodCompareTableHtml(), buildAssessmentReportPayload() —
       unchanged; a hardHistory push from here is automatically "the latest assessment", automatically
       shows up in "precedenti valutazioni" and the comparison view, and is automatically included by
       "scarica report" — no further integration code was needed for any of those.
   The manual-entry form below lets the whole pipeline (identify → store → update profile → preserve
   history) be exercised and validated today, standing in for the extraction step until it's implemented. */
function assessmentSourceLabel(source){
  const bySource = APEX_SOURCES.find(s=>s.key===source);
  if(bySource) return bySource.label;
  if(source==='import_xlsx') return UI.sourceLabelImportXlsx;
  if(source==='external_pdf') return UI.sourceLabelExternalPdf;
  return source||'—';
}
/* Reads the file (proving the upload/plumbing works) but does not attempt to parse its contents: no
   PDF-parsing library is loaded, and the external company's real layout is not yet known. Replace this
   function's body with real extraction once a sample PDF and its field mapping are supplied — every
   caller already expects { supported:true, rows:[{nome,cognome,email,periodLabel,date,dims:[{code,score}]}] }
   on success, so nothing downstream needs to change. */
async function extractAssessmentDataFromPdf(file){
  await file.arrayBuffer();
  return { supported:false, reason:'pdf_format_not_yet_supplied' };
}
function openPdfImportModal(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const periods = ensureDefaultPeriod();
  const body = `
    <div class="survey-warning-box" style="margin-bottom:14px;">${esc(UI.pdfImportNotReadyNote)}</div>
    <div class="dropzone" id="pdf-import-dropzone" onclick="document.getElementById('pdf-import-file-input').click()">
      ${ICONS.upload}
      <div class="dz-title">${esc(UI.pdfImportDzTitle)}</div>
      <div class="dz-sub">${esc(UI.pdfImportDzSub)}</div>
    </div>
    <input type="file" id="pdf-import-file-input" accept=".pdf" style="display:none;" onchange="onPdfFileSelected(this.files[0])">
    <div id="pdf-import-status" class="small-note" style="margin:10px 0;"></div>
    <div class="divider"></div>
    <div class="card-title" style="margin-bottom:4px;">${esc(UI.pdfImportManualTitle)}</div>
    <div class="small-note" style="margin-bottom:12px;">${esc(UI.pdfImportManualSub)}</div>
    <div class="field-row">
      <div class="field"><label>${esc(UI.addEmpEmail)}</label><input type="email" id="pi-email" placeholder="mario.rossi@azienda.it"></div>
      <div class="field"><label>${esc(UI.addEmpFirstName)} ${esc(UI.addEmpLastName)}</label><input type="text" id="pi-fullname" placeholder="Mario Rossi"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>${esc(UI.evalPeriodLabel)}</label><select id="pi-period">${periods.map(p=>`<option value="${p.id}" ${p===periods[periods.length-1]?'selected':''}>${esc(p.label)}</option>`).join('')}</select></div>
      <div class="field"><label>${esc(UI.prevAssessColDate)}</label><input type="date" id="pi-date" value="${new Date().toISOString().slice(0,10)}"></div>
    </div>
    <div class="grid grid-3" style="gap:8px; margin-top:6px;">
      ${APEX5D_DIMENSIONS.map(d=>`<div class="field"><label>${esc(d.code)} · ${esc(d.name)}</label><input type="number" min="1" max="10" step="0.1" id="pi-dim-${d.code}" placeholder="1–10"></div>`).join('')}
    </div>
  `;
  openModal(UI.pdfImportModalTitle, UI.pdfImportModalSub, body, `<button class="btn" onclick="closeModal()">${UI.importCancel}</button><button class="btn btn-primary" onclick="submitPdfManualImport()">${esc(UI.pdfImportSubmitBtn)}</button>`, true);
}
async function onPdfFileSelected(file){
  if(!file) return;
  const statusEl = document.getElementById('pdf-import-status');
  statusEl.textContent = UI.pdfImportReading;
  const result = await extractAssessmentDataFromPdf(file);
  if(!result.supported){
    statusEl.innerHTML = `<span style="color:var(--warning); font-weight:700;">${esc(UI.pdfImportUnsupportedNote(file.name))}</span>`;
  }
}
function submitPdfManualImport(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const email = document.getElementById('pi-email').value.trim();
  const fullname = document.getElementById('pi-fullname').value.trim();
  const parts = fullname.split(/\s+/).filter(Boolean);
  const nome = parts[0]||'', cognome = parts.slice(1).join(' ');
  const emp = findEmployeeByIdentity(nome, cognome, email);
  if(!emp){ toast(UI.toastPdfImportNoMatch, 'err'); return; }
  const periodId = document.getElementById('pi-period').value;
  const dateVal = document.getElementById('pi-date').value;
  const period = (STATE.evalPeriods||[]).find(p=>p.id===periodId);
  const dims = APEX5D_DIMENSIONS.map(d => {
    const v = parseFloat(document.getElementById('pi-dim-'+d.code).value);
    return { code:d.code, name:d.name, score: isNaN(v)?null:clamp(v,1,10) };
  });
  if(dims.some(d=>d.score==null)){ toast(UI.toastPdfImportMissingScores, 'err'); return; }
  const apexScore = round1(avg(dims.map(d=>d.score)));
  if(!Array.isArray(emp.hardHistory)) emp.hardHistory = [];
  emp.hardHistory.push({
    module: 'professional',
    periodId, periodLabel: period?period.label:'',
    date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
    source: 'external_pdf', apexScore, dims,
  });
  persist();
  closeModal();
  toast(UI.toastPdfImportSaved(emp.nome+' '+emp.cognome), 'ok');
  if(DRAWER_EMP_ID===emp.id) refreshDrawer();
  rerenderCurrentPage();
}

/* ============================= METHODOLOGY NOTES & RESET ============================= */
function openMethodologyModal(){
  const body = `
    <div class="small-note" style="margin-bottom:12px;">${UI.methodologyDataShown}</div>
    <div class="small-note" style="margin-bottom:12px;">${UI.methodologyModuleA}</div>
    <div class="small-note" style="margin-bottom:12px;">${UI.methodologyModuleB}</div>
    <div class="small-note" style="margin-bottom:12px;">${UI.methodologyOverall}</div>
    <div class="small-note">${UI.methodologyStorage}</div>
  `;
  openModal(UI.methodologyModalTitle, UI.methodologyModalSub, body, `<button class="btn btn-primary" onclick="closeModal()">${UI.methodologyGotIt}</button>`);
}
async function confirmResetDemo(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  if(!confirm(UI.confirmResetDemo)) return;
  const demo = generateDemoData();
  STATE = demo;
  await saveState(STATE, false);
  updateSidebarFooter();
  SOFT_MATCH = []; HARD_MATCH = [];
  navigateTo('home');
}

/* ============================= BOOT ============================= */
async function boot(){
  STATE = await loadState();
  const savedLang = safeStorage.get(LANG_KEY) || 'it';
  applyLanguageData(savedLang);

  // A ?evalToken= link takes over the whole page — no login, no nav, just that one assignment's form.
  const evalToken = new URLSearchParams(location.search).get('evalToken');
  if(evalToken){
    const assignment = (STATE.evalAssignments||[]).find(a=>a.token===evalToken);
    enterRestrictedEvaluatorMode(assignment || null);
    return;
  }

  document.getElementById('settings-btn').innerHTML = ICONS.settings;
  document.getElementById('import-data-btn').innerHTML = ICONS.upload + UI.importButton;
  updateSidebarFooter();
  updateModulePills();
  document.getElementById('pill-A').addEventListener('click', ()=>toggleModule('A'));
  document.getElementById('pill-B').addEventListener('click', ()=>toggleModule('B'));
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e)=>{ if(e.target.id==='modal-overlay') closeModal(); });
  document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);
  document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);
  applyRolePermissions();
  renderNav();
  navigateTo('home');

  // Cross-tab sync: this app has no backend, only localStorage, so an admin tab with the Evaluation
  // Manager open and an evaluator tab opened from a generated link (Section 3) are two independent
  // in-memory copies of STATE. Without this, whichever tab calls persist() last silently overwrites
  // the other's changes. Reload STATE (and the current page) whenever another tab writes it.
  window.addEventListener('storage', (e) => {
    if(e.key !== STORAGE_KEY || !e.newValue) return;
    try{
      const parsed = JSON.parse(e.newValue);
      if(parsed && Array.isArray(parsed.employees)){
        STATE = parsed;
        updateSidebarFooter();
        rerenderCurrentPage();
      }
    }catch(err){ /* ignore malformed writes from another tab */ }
  });
}
boot();


/* ============================= REUSABLE COMPONENTS ============================= */
function avatarHtml(emp, size=30){
  const style = size!==30 ? `style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.38)}px;"` : '';
  return `<div class="avatar" ${style}>${esc(initials(emp.nome, emp.cognome))}</div>`;
}
function employeeMiniRow(emp, score, chipClass, onclickJs){
  return `<div style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px dashed var(--border);cursor:pointer;" onclick="${onclickJs||`openDrawer('${emp.id}')`}">
    ${avatarHtml(emp)}
    <div style="flex:1;min-width:0;">
      <div style="font-weight:700;font-size:12.6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(emp.nome)} ${esc(emp.cognome)}</div>
      <div style="font-size:11px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(emp.ruolo)}</div>
    </div>
    <span class="chip ${chipClass}"><span class="dt"></span>${fmt1(score)}</span>
  </div>`;
}
// Compact ApexCharts-style stat tile: value + label + trend badge (delta vs benchmark).
// extraHtml (optional): extra sub-content rendered below the header, e.g. a gap-interpretation tag.
function statTileHtml(label, value, benchmark, extraHtml=''){
  const delta = round1(value - benchmark);
  const up = delta >= 0;
  const chartId = 'stat-chart-' + (STAT_TILE_SEQ++);
  STAT_TILE_QUEUE.push({ id: chartId, value, benchmark });
  return `<div class="stat-card compact">
    <div class="stat-head">
      <div>
        <h5 class="stat-value">${fmt1(value)}</h5>
        <p class="stat-label">${esc(label)}</p>
      </div>
      <div class="stat-trend ${up?'up':'down'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v13m0-13 4 4m-4-4-4 4"/></svg>
        ${up?'+':''}${fmt1(delta)}
      </div>
    </div>
    <div id="${chartId}" class="stat-mini-chart"></div>
    ${extraHtml}
  </div>`;
}
function emptyState(title, desc, iconKey='notes'){
  return `<div class="empty-state">${ICONS[iconKey]}<div class="t">${esc(title)}</div><div class="d">${esc(desc)}</div></div>`;
}

// Structured development plan: shared between the Feedback page and the employee drawer.
function devPlanFields(){
  return [
    { key:'azioni', label:UI.devPlanAzioniLabel, placeholder:UI.devPlanAzioniPh },
    { key:'formazione', label:UI.devPlanFormazioneLabel, placeholder:UI.devPlanFormazionePh },
    { key:'coaching', label:UI.devPlanCoachingLabel, placeholder:UI.devPlanCoachingPh },
    { key:'obiettivi', label:UI.devPlanObiettiviLabel, placeholder:UI.devPlanObiettiviPh },
  ];
}
function devPlanFieldsHtml(prefix, plan){
  return devPlanFields().map(f => `
    <div class="field" style="margin-bottom:10px;">
      <label style="font-size:11px;">${esc(f.label)}</label>
      <textarea id="${prefix}-${f.key}" class="neu-input" style="width:100%; min-height:60px; line-height:1.5; resize:vertical;" placeholder="${esc(f.placeholder)}">${esc((plan && plan[f.key]) || '')}</textarea>
    </div>
  `).join('');
}
function readDevPlanFields(prefix){
  const out = {};
  devPlanFields().forEach(f => { out[f.key] = document.getElementById(`${prefix}-${f.key}`).value; });
  return out;
}
function feedbackSwitchHtml(id, checked){
  return `<div class="switch-row" style="margin-bottom:12px;">
    <label class="switch"><input type="checkbox" id="${id}" ${checked?'checked':''}><span class="slider"></span></label>
    <div class="lbl"><div class="l1">${UI.feedbackSwitchLabel}</div></div>
  </div>`;
}

/* ============================= HOME ============================= */
// Roles with the lowest average score (for Box 2 — "Role at Risk")
function orgCriticalRoles(n=3){
  const roles = [...new Set(STATE.employees.map(e=>e.ruolo))];
  const rows = roles.map(ruolo => {
    const emps = STATE.employees.filter(e=>e.ruolo===ruolo);
    const scores = emps.map(e=>primaryScore(e));
    return { ruolo, avg: round1(avg(scores)), count: emps.length };
  }).sort((a,b)=>a.avg-b.avg);
  return rows.slice(0,n);
}
// % of known roles covered by at least one employee at "adequate" level or above (for Box 1 — "Role Coverage")
function roleCoveragePct(){
  const roles = allRolesKnown();
  if(!roles.length) return 0;
  const adequate = new Set();
  STATE.employees.forEach(e => { if(primaryScore(e) >= 5.5) adequate.add(e.ruolo); });
  const covered = roles.filter(r => adequate.has(r)).length;
  return Math.round(covered/roles.length*100);
}
// Competency with the largest gap in the active modules (for Box 2 — "Weakest Competency")
function worstCompetenza(f){
  const candidates = [];
  if(f.A){
    const s = orgWorstSoftSkills(1)[0];
    if(s) candidates.push({ name:s.name, gap:s.gap });
  }
  if(f.B){
    const d = orgWorstHardDims(1)[0];
    if(d) candidates.push({ name:d.name, gap: round1(d.avg-7) });
  }
  if(!candidates.length) return null;
  candidates.sort((a,b)=>a.gap-b.gap);
  return candidates[0];
}

function quadDefs(){
  return [
    { key:'valorizzare', label:UI.quadHighPotential, variant:'success', icon:'sparkles', caption:UI.quadReadyToGrow },
    { key:'top', label:UI.quadHighValue, variant:'accent', icon:'award', caption:UI.quadOperationalPillars },
    { key:'critica', label:UI.quadCritical, variant:'danger', icon:'userX', caption:UI.quadUrgentAction },
    { key:'sviluppo', label:UI.quadAtRisk, variant:'warning', icon:'alertCircle', caption:UI.quadNeedsSupport },
  ];
}

function setModuleExclusive(mode){
  STATE.settings.modulo = mode;
  persist();
  afterModuleChange();
}

function exportActionPlan(){
  const hs = homeStats();
  const f = getModuleFlags();
  const worstSkill = worstCompetenza(f);
  const worstSkillLabel = worstSkill ? worstSkill.name : UI.worstSkillFallback;
  const rows = [
    [UI.azioniTraining, UI.azioniTrainingDesc(worstSkillLabel), hs.tiers.sviluppo.length],
    [UI.azioniCoaching, UI.azioniCoachingDesc, hs.tiers.valorizzare.length],
    [UI.azioniReorgFull, UI.azioniReorgDesc, hs.tiers.critica.length],
    [UI.azioniTalentFull, UI.azioniTalentDesc, hs.tiers.top.length],
  ];
  let csv = UI.exportPlanCsvHeader + '\n';
  rows.forEach(r => { csv += r.join(';') + '\n'; });
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='action_plan.csv'; a.click();
  URL.revokeObjectURL(url);
  toast(UI.toastActionPlanExported, 'ok');
}

/* Module A totalizer: tests acquired vs. dispatched. Reads STATE.settings.testsAcquired/testsDispatched —
   admin-editable today from Settings › Testing; a future API integration only needs to replace those two
   STATE reads with a fetch, the markup/pct logic below stays the same. */
function renderModuleATotalizer(){
  const acquired = Number(STATE.settings.testsAcquired) || 0;
  const dispatched = Number(STATE.settings.testsDispatched) || 0;
  const pct = acquired > 0 ? Math.min(100, Math.round(dispatched/acquired*100)) : 0;
  return `
    <div class="card" style="margin-bottom:18px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; flex-wrap:wrap;">
        <div>
          <div class="card-eyebrow" style="margin-bottom:2px;">${UI.homeTotalizerTitle}</div>
          <div class="small-note">${UI.homeTotalizerSub}</div>
        </div>
        <span class="module-title-pill a">${esc(UI.moduleASoft)}</span>
      </div>
      <div class="grid grid-3" style="gap:10px; margin-bottom:12px;">
        <div class="neu-tile">
          <div class="card-eyebrow">${UI.testsAcquiredLabel}</div>
          <div class="kpi-value" style="font-size:22px;">${acquired}</div>
        </div>
        <div class="neu-tile">
          <div class="card-eyebrow">${UI.testsDispatchedLabel}</div>
          <div class="kpi-value" style="font-size:22px;">${dispatched}</div>
        </div>
        <div class="neu-tile">
          <div class="card-eyebrow">${UI.testsRemainingLabel}</div>
          <div class="kpi-value" style="font-size:22px;">${Math.max(0, acquired-dispatched)}</div>
        </div>
      </div>
      <div class="pbar" style="height:10px;"><i style="width:${pct}%; background:var(--accent);"></i></div>
      <div class="small-note" style="margin-top:6px;">${UI.testsUsedPct(pct)}</div>
    </div>
  `;
}
function renderHome(){
  const el = document.getElementById('page-home');
  const hs = homeStats();
  const f = getModuleFlags();
  const totalEmp = STATE.employees.length;
  const modeLabel = bothActive() ? UI.homeModuleCompleteLabel : (f.A ? UI.homeModuleALabel : UI.homeModuleBLabel);

  setTopbarActions(`<span class="chip chip-green" style="gap:7px;"><span class="pulse-dot"></span>${UI.homeSystemActive}</span>`);

  // BOX 1 — Are we doing well or badly?
  const overallPct = Math.round(hs.orgAvg/10*100);
  const roleCovPct = roleCoveragePct();
  const avgGap = round1(hs.orgAvg - hs.benchmark);
  // Gap% = ((Result - ExpectedValue) / ExpectedValue) * 100 — computed from the unrounded
  // difference so the displayed percentage matches the displayed raw gap as closely as possible.
  const avgGapPct = hs.benchmark ? round1(((hs.orgAvg - hs.benchmark) / hs.benchmark) * 100) : 0;
  const green = hs.ranked.filter(r=>r.score>=7).length;
  const amber = hs.ranked.filter(r=>r.score>=5 && r.score<7).length;
  const red = hs.ranked.filter(r=>r.score<5).length;
  const gPct = totalEmp ? Math.round(green/totalEmp*100) : 0;
  const aPct = totalEmp ? Math.round(amber/totalEmp*100) : 0;
  const rPct = 100 - gPct - aPct;
  const statusTier = hs.orgAvg>=hs.benchmark ? {label:UI.statusGood, variant:'success'} : (hs.orgAvg>=hs.benchmark-1 ? {label:UI.statusModerate, variant:'warning'} : {label:UI.statusBelow, variant:'danger'});

  // BOX 2 — Where is the problem?
  const worstArea = orgCriticalAreas(1)[0];
  const worstRole = orgCriticalRoles(1)[0];
  const worstSkill = worstCompetenza(f);
  const severeCount = hs.ranked.filter(r => round1(r.score-hs.benchmark) <= -2).length;
  const detailPage = bothActive() ? 'valore' : (f.A ? 'soft' : 'hard');
  const rowDotClass = gapVal => gapVal<=-2 ? 'var(--danger)' : (gapVal<0 ? 'var(--warning)' : 'var(--success)');

  // BOX 3 — Who creates value and who creates risk?
  const tiers = hs.tiers;

  // BOX 4 — What should we do right now?
  const worstSkillLabel = worstSkill ? worstSkill.name : UI.worstSkillFallback;
  const azioni = [
    { key:'training', label:UI.azioniTraining, desc:UI.azioniTrainingDesc(esc(worstSkillLabel)), count: tiers.sviluppo.length, variant:'warning' },
    { key:'coaching', label:UI.azioniCoaching, desc:UI.azioniCoachingDesc, count: tiers.valorizzare.length, variant:'success' },
    { key:'reorg', label:UI.azioniReorgShort, desc:UI.azioniReorgDesc, count: tiers.critica.length, variant:'danger' },
    { key:'talent', label:UI.azioniTalentShort, desc:UI.azioniTalentDesc, count: tiers.top.length, variant:'accent' },
  ];

  el.innerHTML = `
    <div class="section-head">
      <div>
        <h2>${UI.homeStatusTitle}</h2>
        <p>${UI.homeStatusSub}</p>
      </div>
      <div class="small-note" style="text-align:right;">${UI.homeActiveFilter} <b style="color:var(--text-1);">${esc(modeLabel)}</b></div>
    </div>

    <div class="card" style="margin-bottom:18px; display:flex; align-items:center; gap:24px; flex-wrap:wrap;">
      <div class="merge-diagram" style="margin:0; flex-shrink:0;">
        <div class="merge-circle merge-a ${bothActive() ? '' : (f.A ? 'merge-emphasized' : 'merge-dimmed')}" onclick="setModuleExclusive('A')" title="${esc(UI.homeModuleALabel)}">
          <span class="n">${fmt1(computeAvgMetric('soft'))}</span>
          <span>${esc(UI.homeModuleALabel)}</span>
        </div>
        <div class="merge-plus" onclick="setModuleExclusive('AB')" title="${esc(UI.homeModuleCompleteLabel)}">+</div>
        <div class="merge-circle merge-b ${bothActive() ? '' : (f.B ? 'merge-emphasized' : 'merge-dimmed')}" onclick="setModuleExclusive('B')" title="${esc(UI.homeModuleBLabel)}">
          <span class="n">${fmt1(computeAvgMetric('hard'))}</span>
          <span>${esc(UI.homeModuleBLabel)}</span>
        </div>
      </div>
      <div style="flex:1; min-width:220px;">
        <div class="card-eyebrow">${UI.homeConfigActiveEyebrow}</div>
        <div style="font-size:16px; font-weight:800; margin:2px 0 8px 0;">${esc(modeLabel)}</div>
        <div class="small-note" style="max-width:480px;">${UI.homeSwitchHint}</div>
        <div class="segmented" style="margin-top:12px;">
          <button class="${!bothActive() && f.A ? 'active':''}" onclick="setModuleExclusive('A')">${UI.homeModuleALabel}</button>
          <button class="${!bothActive() && f.B ? 'active':''}" onclick="setModuleExclusive('B')">${UI.homeModuleBLabel}</button>
          <button class="${bothActive()?'active':''}" onclick="setModuleExclusive('AB')">${UI.homeModuleCompleteLabel}</button>
        </div>
      </div>
    </div>

    <div class="home-hero">
      <div class="quad quad-accent-1">
        <div class="blur-decor" style="background:var(--success-soft);"></div>
        <div style="position:relative; z-index:1; display:flex; flex-direction:column; flex:1;">
          <div class="quad-header" onclick="toggleHomeCard('q1')" aria-expanded="${HOME_OPEN_CARDS.q1?'true':'false'}" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="icon-chip success">${ICONS.activity}</span>
              <h3 style="text-transform:none; margin-bottom:0; font-size:18px;">${UI.homeQ1Title}</h3>
            </div>
            <div style="display:flex; align-items:center; gap:10px; flex-shrink:0;">
              <span class="quad-collapse-hint">${UI.homeCardExpandHint}</span>
              <span id="home-quad-chevron-q1" class="quad-chevron ${HOME_OPEN_CARDS.q1?'open':''}">${ICONS.chevron}</span>
            </div>
          </div>

          <div id="home-quad-body-q1" class="home-quad-body ${HOME_OPEN_CARDS.q1?'open':''}">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
            <span class="chip chip-${statusTier.variant==='success'?'green':statusTier.variant==='warning'?'amber':'red'}">${esc(statusTier.label)}</span>
          </div>
          <p class="small-note" style="margin-bottom:14px;">${UI.homeQ1Sub}</p>
          <div class="grid grid-3" style="gap:10px; margin-bottom:14px;">
            <div class="neu-tile" style="text-align:center;">
              <div class="card-eyebrow">${UI.homeQ1Score}</div>
              <div class="kpi-value" style="font-size:23px;">${overallPct}%</div>
            </div>
            <div class="neu-tile" style="text-align:center;">
              <div class="card-eyebrow">${UI.homeQ1Coverage}</div>
              <div class="kpi-value" style="font-size:23px;">${roleCovPct}%</div>
            </div>
            <div class="neu-tile" style="text-align:center;">
              <div class="card-eyebrow">${UI.homeQ1Gap}</div>
              <div class="kpi-value" style="font-size:18px; color:${avgGap<0?'var(--danger)':'var(--success)'};">${avgGap>0?'+':''}${fmt1it(avgGap)} = ${avgGapPct>0?'+':''}${fmt1it(avgGapPct)}%</div>
            </div>
          </div>

          <div style="margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; font-size:11.5px; font-weight:700; color:var(--text-2); margin-bottom:6px;">
              <span>${UI.homeQ1LevelAchieved}</span><span>${overallPct}%</span>
            </div>
            <div class="pbar" style="height:10px;"><i style="width:${overallPct}%; background:var(--success);"></i></div>
          </div>

          <div class="grid grid-3" style="gap:8px;">
            <div class="tinted-tile success" style="text-align:center; padding:10px;">
              <div style="font-weight:800; font-size:13px; color:var(--success);">${gPct}% ${esc(UI.homeQ1Green)}</div>
              <div class="small-note" style="font-size:10px; margin-top:2px;">${UI.homeQ1GreenSub}</div>
            </div>
            <div class="tinted-tile warning" style="text-align:center; padding:10px;">
              <div style="font-weight:800; font-size:13px; color:var(--warning);">${aPct}% ${esc(UI.homeQ1Yellow)}</div>
              <div class="small-note" style="font-size:10px; margin-top:2px;">${UI.homeQ1YellowSub}</div>
            </div>
            <div class="tinted-tile danger" style="text-align:center; padding:10px;">
              <div style="font-weight:800; font-size:13px; color:var(--danger);">${rPct}% ${esc(UI.homeQ1Red)}</div>
              <div class="small-note" style="font-size:10px; margin-top:2px;">${UI.homeQ1RedSub}</div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div class="quad quad-accent-2">
        <div class="quad-header" onclick="toggleHomeCard('q2')" aria-expanded="${HOME_OPEN_CARDS.q2?'true':'false'}" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="icon-chip danger">${ICONS.alertTriangle}</span>
            <h3 style="text-transform:none; margin-bottom:0; font-size:18px;">${UI.homeQ2Title}</h3>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-shrink:0;">
            <span class="quad-collapse-hint">${UI.homeCardExpandHint}</span>
            <span id="home-quad-chevron-q2" class="quad-chevron ${HOME_OPEN_CARDS.q2?'open':''}">${ICONS.chevron}</span>
          </div>
        </div>

        <div id="home-quad-body-q2" class="home-quad-body ${HOME_OPEN_CARDS.q2?'open':''}">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <span class="chip chip-red">${esc(UI.homeQ2CriticalIssues(severeCount))}</span>
        </div>
        <p class="small-note" style="margin-bottom:12px;">${UI.homeQ2Sub}</p>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--surface-alt);">
            <span style="width:9px; height:9px; border-radius:50%; background:${worstArea?rowDotClass(round1(worstArea.avg-hs.benchmark)):'var(--text-3)'}; flex-shrink:0;"></span>
            <div style="flex:1; min-width:0;"><div class="small-note"><b>${UI.homeQ2MostCriticalArea}</b></div><div style="font-weight:700; font-size:12.8px; margin-top:2px;">${esc(worstArea ? worstArea.area : '—')}</div></div>
            <span class="chip chip-red" style="flex-shrink:0;">${esc(UI.homeQ2Gap(worstArea ? fmt1(round1(worstArea.avg-hs.benchmark)) : '—'))}</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--surface-alt);">
            <span style="width:9px; height:9px; border-radius:50%; background:${worstRole?rowDotClass(round1(worstRole.avg-hs.benchmark)):'var(--text-3)'}; flex-shrink:0;"></span>
            <div style="flex:1; min-width:0;"><div class="small-note"><b>${UI.homeQ2RoleAtRisk}</b></div><div style="font-weight:700; font-size:12.8px; margin-top:2px;">${esc(worstRole ? worstRole.ruolo : '—')}</div></div>
            <span class="chip chip-red" style="flex-shrink:0;">${esc(UI.homeQ2Gap(worstRole ? fmt1(round1(worstRole.avg-hs.benchmark)) : '—'))}</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--surface-alt);">
            <span style="width:9px; height:9px; border-radius:50%; background:${worstSkill?rowDotClass(worstSkill.gap):'var(--text-3)'}; flex-shrink:0;"></span>
            <div style="flex:1; min-width:0;"><div class="small-note"><b>${UI.homeQ2WeakestCompetency}</b></div><div style="font-weight:700; font-size:12.8px; margin-top:2px;">${esc(worstSkill ? worstSkill.name : '—')}</div></div>
            <span class="chip chip-red" style="flex-shrink:0;">${worstSkill ? (worstSkill.gap>0?'+':'')+fmt1(worstSkill.gap) : '—'}</span>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:12px; padding-top:12px; border-top:1px solid var(--border);">
          <span class="small-note">${UI.homeQ2SevereGapLabel} <b style="color:var(--text-1);">${esc(UI.homeQ2People(severeCount))}</b></span>
          <a class="linklike" style="font-size:11.5px;" onclick="navigateTo('${detailPage}')">${UI.homeQ2ViewDetail}</a>
        </div>
        </div>
      </div>

      <div class="quad quad-accent-3">
        <div class="quad-header" onclick="toggleHomeCard('q3')" aria-expanded="${HOME_OPEN_CARDS.q3?'true':'false'}" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="icon-chip accent">${ICONS.users}</span>
            <h3 style="text-transform:none; margin-bottom:0; font-size:18px;">${UI.homeQ3Title}</h3>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-shrink:0;">
            <span class="quad-collapse-hint">${UI.homeCardExpandHint}</span>
            <span id="home-quad-chevron-q3" class="quad-chevron ${HOME_OPEN_CARDS.q3?'open':''}">${ICONS.chevron}</span>
          </div>
        </div>

        <div id="home-quad-body-q3" class="home-quad-body ${HOME_OPEN_CARDS.q3?'open':''}">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <span class="chip chip-gray">${UI.homeQ3ResourceMapping}</span>
        </div>
        <p class="small-note" style="margin-bottom:12px;">${UI.homeQ3Sub}</p>
        <div class="grid grid-2" style="gap:10px;">
          ${quadDefs().map(q => {
            const count = tiers[q.key].length;
            return `<div class="tinted-tile clickable ${q.variant}" onclick="event.stopPropagation(); openTierModal('${q.key}')">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                <span style="font-size:11.5px; font-weight:700; color:var(--${q.variant==='accent'?'accent-dark':q.variant});">${esc(q.label)}</span>
                <span style="width:16px; height:16px; color:var(--${q.variant==='accent'?'accent-dark':q.variant});">${ICONS[q.icon]}</span>
              </div>
              <div style="font-size:22px; font-weight:800; color:var(--text-1);">${count}</div>
              <div class="small-note" style="font-size:10.5px; margin-top:2px;">${esc(q.caption)}</div>
            </div>`;
          }).join('')}
        </div>

        <div style="text-align:right; margin-top:12px; padding-top:12px; border-top:1px solid var(--border);">
          <a class="linklike" style="font-size:11.5px;" onclick="event.stopPropagation(); navigateTo('valore')">${UI.homeQ3OpenMatrix}</a>
        </div>
        </div>
      </div>

      <div class="quad quad-accent-4">
        <div class="quad-header" onclick="toggleHomeCard('q4')" aria-expanded="${HOME_OPEN_CARDS.q4?'true':'false'}" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="icon-chip warning">${ICONS.checkSquare}</span>
            <h3 style="text-transform:none; margin-bottom:0; font-size:18px;">${UI.homeQ4Title}</h3>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-shrink:0;">
            <span class="quad-collapse-hint">${UI.homeCardExpandHint}</span>
            <span id="home-quad-chevron-q4" class="quad-chevron ${HOME_OPEN_CARDS.q4?'open':''}">${ICONS.chevron}</span>
          </div>
        </div>

        <div id="home-quad-body-q4" class="home-quad-body ${HOME_OPEN_CARDS.q4?'open':''}">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <span class="chip chip-gray">${UI.homeQ4AiPriorities}</span>
        </div>
        <p class="small-note" style="margin-bottom:12px;">${UI.homeQ4Sub}</p>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${azioni.map(a => `<div style="display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border:1px solid var(--border); border-radius:var(--radius-sm);">
            <span class="action-tag ${a.variant}" style="margin-top:1px;">${esc(a.label)}</span>
            <div style="flex:1; min-width:0;">
              <textarea class="small-note action-note-input" rows="1" ${canEdit()?'':'readonly'} oninput="autoGrowActionNote(this); saveActionNote('${a.key}', this.value)">${(STATE.settings.actionNotes && STATE.settings.actionNotes[a.key]) ? esc(STATE.settings.actionNotes[a.key]) : a.desc}</textarea>
            </div>
            <span class="chip chip-gray" style="flex-shrink:0;">${a.count}</span>
          </div>`).join('')}
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:12px; padding-top:12px; border-top:1px solid var(--border);">
          <span class="small-note">${UI.homeQ4RealTime}</span>
          <a class="linklike" style="font-size:11.5px;" onclick="event.stopPropagation(); exportActionPlan()">${UI.homeQ4Export}</a>
        </div>
        </div>
      </div>
    </div>

    <div class="grid grid-4" style="margin-bottom:18px;">
      <div class="card"><div class="card-eyebrow">${UI.homeKpiFeedback}</div><div class="kpi-value">${hs.feedbackDue}</div><div class="kpi-label">${UI.homeKpiFeedbackSub}</div></div>
      <div class="card"><div class="card-eyebrow">${UI.homeKpiTalent}</div><div class="kpi-value" style="color:var(--success);">${hs.tiers.top.length + hs.tiers.valorizzare.length}</div><div class="kpi-label">${UI.homeKpiTalentSub(STATE.employees.length)}</div></div>
      <div class="card"><div class="card-eyebrow">${UI.homeKpiRisk}</div><div class="kpi-value" style="color:var(--danger);">${hs.tiers.critica.length + hs.tiers.sviluppo.length}</div><div class="kpi-label">${UI.homeKpiRiskSub}</div></div>
      <div class="card"><div class="card-eyebrow">${UI.homeKpiAreas}</div><div class="kpi-value">${areasList().length}</div><div class="kpi-label">${UI.homeKpiAreasSub}</div></div>
    </div>

    ${f.A ? renderModuleATotalizer() : ''}
  `;
  updateModuleTint();
  el.querySelectorAll('.action-note-input').forEach(autoGrowActionNote);
}
/* Editable "Cosa dobbiamo fare subito?" action notes — each row's text starts pre-filled with the
   auto-generated suggestion (a.desc) but is a real, persisted textarea: typing overwrites it with
   a custom note, saved per action key (training/coaching/reorg/talent) in STATE.settings.actionNotes.
   Clearing it back to empty reverts to showing the auto-generated suggestion again on next render. */
function saveActionNote(key, value){
  if(!canEdit()) return;
  if(!STATE.settings.actionNotes) STATE.settings.actionNotes = {};
  STATE.settings.actionNotes[key] = value;
  persist();
}
function autoGrowActionNote(el){
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
function openTierModal(tierKey){
  const tierDef = TIER_DEFS.find(t=>t.key===tierKey);
  const quadDef = quadDefs().find(q=>q.key===tierKey);
  const emps = classifyPopulation()[tierKey] || [];
  const body = emps.length
    ? emps.map(e => employeeMiniRow(e, primaryScore(e), semanticChip(primaryScore(e)))).join('')
    : emptyState(UI.tierModalNoEmpTitle, UI.tierModalNoEmpDesc, 'users');
  openModal(`${esc(quadDef.label)} · ${esc(tierDef.label)}`, UI.tierModalCount(emps.length), `<div>${body}</div>`, `<button class="btn" onclick="closeModal()">${UI.btnClose}</button>`);
}
function computeAvgMetric(type){
  if(type==='soft') return avg(STATE.employees.map(e=>computeSoftSummary(e).overallOttenuto));
  return avg(STATE.employees.map(e=>computeHardSummary(e).apexScore));
}


/* ============================= EMPLOYEE DIRECTORY ============================= */
let ANAG_SEARCH = '';
let ANAG_AREA_FILTER = 'all';
let ANAG_SORT = 'cognome';
let ANAG_PAGE = 1;
let ANAG_SHOW_ARCHIVED = false;
const ANAG_PAGE_SIZE = 10;

function allRolesKnown(){
  const s = new Set(Object.keys(ROLE_FOCUS_SKILLS));
  Object.keys(STATE.roleProfiles||{}).forEach(r=>s.add(r));
  STATE.employees.forEach(e=>s.add(e.ruolo));
  return [...s].sort((a,b)=>a.localeCompare(b));
}
/* Roles available when registering a NEW employee: strictly the roles already configured through the
   role-census (STATE.roleProfiles — same records edited in openRoleCensusModal), so the "Ruolo" dropdown
   never offers a role with no soft-skill configuration behind it. No second/hard-coded role list. */
function censusRolesList(){
  return Object.keys(STATE.roleProfiles||{}).sort((a,b)=>a.localeCompare(b));
}

function renderAnagrafica(){
  const el = document.getElementById('page-anagrafica');
  setTopbarActions(canEdit() ? `<button class="btn btn-primary" onclick="openAddEmployeeModal()">${ICONS.plus}${UI.anagAddEmployee}</button>` : '');

  el.innerHTML = `
    <div class="rc-entry-row">
      <div class="card rc-entry-card" onclick="openRoleCensusModal()" role="button" tabindex="0" onkeydown="if(event.key==='Enter')openRoleCensusModal()">
        <div class="rc-entry-icon">${ICONS.users}</div>
        <div class="rc-entry-text">
          <h3>${esc(UI.anagRoleSkillsTitle)}</h3>
          <p>${esc(UI.anagRoleSkillsSub)}</p>
        </div>
        <div class="rc-entry-arrow">${ICONS.chevronRight}</div>
      </div>
      <button class="card rc-linksurvey-btn" onclick="openSurveyLinkModal()" type="button">
        <div class="rc-entry-icon">${ICONS.notes}</div>
        <div class="rc-linksurvey-text">
          <span class="rc-linksurvey-title">${esc(UI.linkSurveyBtn)}</span>
          <span class="rc-linksurvey-hint">${esc(UI.linkSurveyHint)}</span>
        </div>
      </button>
    </div>

    <div class="section-head">
      <div><h2>${UI.anagListTitle}</h2><p>${UI.anagListSub}</p></div>
      <div class="toolbar">
        <div class="search-box">${ICONS.search}<input type="text" id="anag-search" class="neu-input" placeholder="${esc(UI.anagSearchPh)}" value="${esc(ANAG_SEARCH)}"></div>
        <select id="anag-area-filter" style="padding:8px 12px; border:1px solid var(--border-strong); border-radius:8px; font-size:12.5px; font-weight:600;"></select>
        <select id="anag-sort" style="padding:8px 12px; border:1px solid var(--border-strong); border-radius:8px; font-size:12.5px; font-weight:600;">
          <option value="cognome" ${ANAG_SORT==='cognome'?'selected':''}>${UI.anagSortLastName}</option>
          <option value="area" ${ANAG_SORT==='area'?'selected':''}>${UI.anagSortArea}</option>
          <option value="score" ${ANAG_SORT==='score'?'selected':''}>${UI.anagSortScore}</option>
        </select>
        <label class="checkbox-row" style="gap:7px; font-size:12.5px; font-weight:600; color:var(--text-2);">
          <input type="checkbox" id="anag-show-archived" ${ANAG_SHOW_ARCHIVED?'checked':''}>${UI.anagShowArchived}
        </label>
      </div>
    </div>
    <div class="card" style="padding:0;">
      <div class="table-wrap" id="anag-table-wrap"></div>
    </div>
  `;

  // area filter options
  const areaSel = document.getElementById('anag-area-filter');
  areaSel.innerHTML = `<option value="all">${esc(UI.anagAllAreas)}</option>` + areasList().map(a=>`<option value="${esc(a)}" ${ANAG_AREA_FILTER===a?'selected':''}>${esc(a)}</option>`).join('');
  areaSel.value = ANAG_AREA_FILTER;
  areaSel.addEventListener('change', e => { ANAG_AREA_FILTER = e.target.value; ANAG_PAGE = 1; renderAnagTable(); });
  document.getElementById('anag-search').addEventListener('input', e => { ANAG_SEARCH = e.target.value; ANAG_PAGE = 1; renderAnagTable(); });
  document.getElementById('anag-sort').addEventListener('change', e => { ANAG_SORT = e.target.value; ANAG_PAGE = 1; renderAnagTable(); });
  document.getElementById('anag-show-archived').addEventListener('change', e => { ANAG_SHOW_ARCHIVED = e.target.checked; ANAG_PAGE = 1; renderAnagTable(); });

  renderAnagTable();
}

function softAssignedChipHtml(e){
  const total = SOFT_SKILLS.length;
  const done = Object.values(e.soft||{}).filter(v=>v && v.ottenuto>0).length;
  const cls = done>=total ? 'chip-green' : done>0 ? 'chip-amber' : 'chip-gray';
  return `<span class="chip ${cls}"><span class="dt"></span>${done}/${total}</span>`;
}
function renderAnagTable(){
  const wrap = document.getElementById('anag-table-wrap');
  let list = ANAG_SHOW_ARCHIVED ? STATE.employees.filter(e=>e.archived) : STATE.employees.filter(e=>!e.archived);
  if(ANAG_AREA_FILTER!=='all') list = list.filter(e=>e.area===ANAG_AREA_FILTER);
  if(ANAG_SEARCH.trim()){
    const q = ANAG_SEARCH.trim().toLowerCase();
    list = list.filter(e => (e.nome+' '+e.cognome+' '+e.email).toLowerCase().includes(q));
  }
  if(ANAG_SORT==='cognome') list.sort((a,b)=>a.cognome.localeCompare(b.cognome));
  if(ANAG_SORT==='area') list.sort((a,b)=>a.area.localeCompare(b.area));
  if(ANAG_SORT==='score') list.sort((a,b)=>primaryScore(b)-primaryScore(a));

  if(!list.length){ wrap.innerHTML = emptyState(ANAG_SHOW_ARCHIVED ? UI.anagNoArchivedFound : UI.anagNoEmployeesFound, UI.anagAdjustFilters, 'users'); return; }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total/ANAG_PAGE_SIZE));
  if(ANAG_PAGE > totalPages) ANAG_PAGE = totalPages;
  if(ANAG_PAGE < 1) ANAG_PAGE = 1;
  const start = (ANAG_PAGE-1)*ANAG_PAGE_SIZE;
  const pageList = list.slice(start, start+ANAG_PAGE_SIZE);

  wrap.innerHTML = `<table class="dtable">
    <thead><tr><th>${UI.anagColEmployee}</th><th>${UI.anagColEmail}</th><th>${UI.anagColArea}</th><th>${UI.anagColDepartment}</th><th>${UI.anagColRole}</th><th>${UI.anagColDuties}</th><th>${UI.anagColGender}</th><th>${UI.anagColLevel}</th><th>${UI.anagColRal}</th><th>${UI.anagColBenefit}</th><th>${UI.anagColSoftAssigned}</th><th>${esc(primaryScoreLabel())}</th><th></th></tr></thead>
    <tbody>
      ${pageList.map(e => `<tr onclick="openDrawer('${e.id}')">
        <td><div style="display:flex; align-items:center; gap:9px;">${avatarHtml(e)}<b>${esc(e.nome)} ${esc(e.cognome)}</b>${e.archived?`<span class="chip chip-gray" style="flex-shrink:0;">${esc(archiveReasonLabel(e.archived.reason))}</span>`:''}</div></td>
        <td style="color:var(--text-2);">${esc(e.email)}</td>
        <td>${esc(e.area)}</td>
        <td style="color:var(--text-2);">${esc(e.reparto)||'—'}</td>
        <td>${esc(e.ruolo)}</td>
        <td style="max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-2);">${esc(e.mansione)}</td>
        <td style="color:var(--text-2);">${esc(genderDisplayLabel(e.sesso))||'—'}</td>
        <td style="color:var(--text-2);">${esc(e.livelloCcnl)||'—'}</td>
        <td style="color:var(--text-2); white-space:nowrap;">${e.ral ? fmtCurrency(e.ral) : '—'}</td>
        <td style="max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-2);">${esc(e.benefit)||'—'}</td>
        <td>${softAssignedChipHtml(e)}</td>
        <td><span class="chip ${semanticChip(primaryScore(e))}"><span class="dt"></span>${fmt1(primaryScore(e))}</span></td>
        <td>${e.archived
          ? `<button class="btn btn-sm" onclick="event.stopPropagation(); restoreEmployee('${e.id}')">${UI.anagRestore}</button>`
          : `<button class="btn btn-sm btn-danger-outline" onclick="event.stopPropagation(); openArchiveModal('${e.id}')">${UI.anagArchive}</button>`}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-top:1px solid var(--border); flex-wrap:wrap; gap:10px;">
    <div class="small-note">${esc(UI.anagShowing(start+1, Math.min(start+ANAG_PAGE_SIZE, total), total))}</div>
    <div style="display:flex; align-items:center; gap:10px;">
      <button class="btn btn-sm" ${ANAG_PAGE<=1?'disabled':''} onclick="anagGoPage(${ANAG_PAGE-1})">${ICONS.chevronLeft}</button>
      <span class="small-note" style="font-weight:700; color:var(--text-1);">${esc(UI.anagPageOf(ANAG_PAGE, totalPages))}</span>
      <button class="btn btn-sm" ${ANAG_PAGE>=totalPages?'disabled':''} onclick="anagGoPage(${ANAG_PAGE+1})">${ICONS.chevronRight}</button>
    </div>
  </div>`;
}
function anagGoPage(p){ ANAG_PAGE = p; renderAnagTable(); }

/* ============================= ROLE CENSUS (soft skill weighting by role) =============================
   Reuses the same 3-tier weighting model as the Recruiting job-description screen (Essenziale = peso 3,
   Importante = peso 2, Utile = peso 1, same click-cycle order) so soft-skill scores stay comparable
   between candidates (Recruiting) and employees (Assessment). Legacy STATE.roleProfiles[role].requiredSkills
   (a flat list, no weight) is migrated in place the first time a role is opened here: every already-required
   skill becomes "Essenziale", matching the fixed EXPECTED value (8) it used before this feature existed. */
const SKILL_WEIGHT_LEVELS = {
  3: { labelKey:'weightEssenziale', chip:'chip-blue',  min:6, countKey:'rcEssenzialiLabel' },
  2: { labelKey:'weightImportante', chip:'chip-amber', min:4, countKey:'rcImportantiLabel' },
  1: { labelKey:'weightUtile',      chip:'chip-green', min:2, countKey:'rcUtiliLabel' },
};
const SKILL_WEIGHT_CYCLE = [0,3,2,1]; // click order: none → Essenziale → Importante → Utile → none

function ensureRoleProfile(role){
  if(!STATE.roleProfiles[role]) STATE.roleProfiles[role] = { requiredSkills: [] };
  const rp = STATE.roleProfiles[role];
  if(!rp.skillWeights){
    rp.skillWeights = {};
    (rp.requiredSkills||[]).forEach(id => { rp.skillWeights[id] = 3; });
  }
  if(!rp.skillExpected){
    rp.skillExpected = {};
    Object.keys(rp.skillWeights).forEach(id => { rp.skillExpected[id] = 8; });
  }
  rp.requiredSkills = Object.keys(rp.skillWeights);
  return rp;
}

function roleSkillCounts(role){
  const rp = ensureRoleProfile(role);
  const counts = {3:0, 2:0, 1:0};
  Object.values(rp.skillWeights).forEach(w => { if(counts[w]!=null) counts[w]++; });
  return counts;
}

function applyRoleSkillToEmployees(role, skillId){
  const rp = STATE.roleProfiles[role];
  const weight = rp.skillWeights[skillId];
  const expected = weight ? (rp.skillExpected[skillId]!=null ? rp.skillExpected[skillId] : 8) : 6;
  STATE.employees.filter(e=>e.ruolo===role).forEach(e => {
    if(!e.soft[skillId]) e.soft[skillId] = { ottenuto:6, atteso:6 };
    e.soft[skillId].atteso = expected;
  });
}

let ROLE_CENSUS_SELECTED = null;
let ROLE_CENSUS_CREATING = false;

function openRoleCensusModal(){
  const roles = allRolesKnown();
  ROLE_CENSUS_SELECTED = roles.includes(ROLE_CENSUS_SELECTED) ? ROLE_CENSUS_SELECTED : (roles[0] || null);
  ROLE_CENSUS_CREATING = false;
  openModal(UI.roleCensusTitle, UI.roleCensusSub, renderRoleCensusBodyHtml(), `<button class="btn" onclick="closeModal()">${UI.settingsClose}</button>`, true);
}

function renderRoleCensusBody(){
  const body = document.getElementById('modal-body');
  if(body) body.innerHTML = renderRoleCensusBodyHtml();
}

function renderRoleCensusBodyHtml(){
  const roles = allRolesKnown();
  const editable = canEdit();

  const roleBarHtml = `
    <div class="rc-role-bar">
      <div class="field" style="flex:1; min-width:220px; max-width:320px;">
        <label>${UI.anagSelectRole}</label>
        <select id="rc-role-select" ${roles.length?'':'disabled'} onchange="selectRoleCensus(this.value)">
          ${roles.map(r=>`<option value="${esc(r)}" ${r===ROLE_CENSUS_SELECTED?'selected':''}>${esc(r)}</option>`).join('')}
        </select>
      </div>
      ${editable ? (ROLE_CENSUS_CREATING ? `
        <div class="field" style="flex:1; min-width:200px; max-width:280px;">
          <label>${UI.newRoleTitleLabel}</label>
          <input type="text" id="rc-new-role-input" class="neu-input" placeholder="${esc(UI.newRoleTitlePh)}">
        </div>
        <button class="btn btn-primary" onclick="confirmCreateRole()">${UI.newRoleSaveBtn}</button>
        <button class="btn" onclick="cancelCreateRole()">${UI.importCancel}</button>
      ` : `<button class="btn btn-primary" onclick="startCreateRole()">${ICONS.plus}${UI.createRoleBtn}</button>`) : ''}
    </div>
  `;

  if(!ROLE_CENSUS_SELECTED){
    return roleBarHtml + `<div class="small-note">${esc(UI.rcNoRoleSelected)}</div>`;
  }

  const rp = ensureRoleProfile(ROLE_CENSUS_SELECTED);
  const counts = roleSkillCounts(ROLE_CENSUS_SELECTED);
  const countsHtml = [3,2,1].map(w => {
    const lvl = SKILL_WEIGHT_LEVELS[w];
    const n = counts[w];
    const ok = n >= lvl.min;
    return `<span class="chip rc-count-item ${ok?'chip-green':'chip-red'}"><span class="dt"></span>${esc(UI[lvl.countKey])} ${n}/${lvl.min}</span>`;
  }).join('');

  const skillsHtml = SOFT_CLUSTERS.map(cluster => {
    const items = SOFT_SKILLS.filter(s=>s.cluster===cluster);
    const rows = items.map(s => {
      const w = rp.skillWeights[s.id] || 0;
      const lvl = SKILL_WEIGHT_LEVELS[w];
      const chipClass = lvl ? lvl.chip : 'chip-gray';
      const label = lvl ? UI[lvl.labelKey] : UI.weightNone;
      const attesoField = w
        ? `<input type="number" class="neu-input rc-atteso-input" min="1" max="10" step="0.1" value="${rp.skillExpected[s.id]!=null?rp.skillExpected[s.id]:8}" ${editable?'':'disabled'} onchange="setRoleSkillExpected('${esc(ROLE_CENSUS_SELECTED)}','${s.id}', this.value)" title="${esc(UI.rcExpectedLabel)}">`
        : `<span class="rc-atteso-placeholder">—</span>`;
      return `<div class="rc-skill-row">
        <span class="rc-skill-name">${esc(s.name)}</span>
        <span class="chip ${chipClass} rc-weight-badge" ${editable?`onclick="cycleRoleSkillWeight('${esc(ROLE_CENSUS_SELECTED)}','${s.id}')"`:''}><span class="dt"></span>${esc(label)}</span>
        ${attesoField}
      </div>`;
    }).join('');
    return `<div class="cluster-block"><div class="cluster-title">${esc(cluster)}</div>${rows}</div>`;
  }).join('');

  return roleBarHtml + `<div class="rc-counts">${countsHtml}</div>` + skillsHtml;
}

function selectRoleCensus(role){
  ROLE_CENSUS_SELECTED = role;
  ROLE_CENSUS_CREATING = false;
  renderRoleCensusBody();
}
function startCreateRole(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  ROLE_CENSUS_CREATING = true;
  renderRoleCensusBody();
  setTimeout(()=>{ const inp=document.getElementById('rc-new-role-input'); if(inp) inp.focus(); }, 0);
}
function cancelCreateRole(){
  ROLE_CENSUS_CREATING = false;
  renderRoleCensusBody();
}
function confirmCreateRole(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const inp = document.getElementById('rc-new-role-input');
  const name = (inp ? inp.value : '').trim();
  if(!name){ toast(UI.toastEnterRoleTitle, 'err'); return; }
  if(allRolesKnown().some(r=>r.toLowerCase()===name.toLowerCase())){ toast(UI.toastRoleDuplicate, 'err'); return; }
  ensureRoleProfile(name);
  ROLE_CENSUS_SELECTED = name;
  ROLE_CENSUS_CREATING = false;
  persist();
  renderRoleCensusBody();
  toast(UI.toastRoleCreated, 'ok');
}
function cycleRoleSkillWeight(role, skillId){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const rp = ensureRoleProfile(role);
  const cur = rp.skillWeights[skillId] || 0;
  const idx = SKILL_WEIGHT_CYCLE.indexOf(cur);
  const nx = SKILL_WEIGHT_CYCLE[(idx+1)%SKILL_WEIGHT_CYCLE.length];
  if(nx===0){ delete rp.skillWeights[skillId]; delete rp.skillExpected[skillId]; }
  else{ rp.skillWeights[skillId] = nx; if(rp.skillExpected[skillId]==null) rp.skillExpected[skillId] = 8; }
  rp.requiredSkills = Object.keys(rp.skillWeights);
  applyRoleSkillToEmployees(role, skillId);
  persist();
  renderRoleCensusBody();
}
function setRoleSkillExpected(role, skillId, val){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const rp = ensureRoleProfile(role);
  if(!rp.skillWeights[skillId]) return;
  const n = clamp(parseFloat(val) || 8, 1, 10);
  rp.skillExpected[skillId] = n;
  applyRoleSkillToEmployees(role, skillId);
  persist();
}

/* ============================= LINK SURVEY (send the external Soft Skills survey link to employees) =============================
   Reuses STATE.employees as-is — the existing `email` field (no duplicate field, nothing new to type in) and,
   for ordering, the existing insertion order of the array (new employees are always .push()ed, i.e. array
   order already IS registration order) refined with the `createdAt` timestamp now stamped on newly created/
   imported employees (see submitAddEmployee / mergeImportedAnagrafica) — never touching already-stored records.
   Reuses the existing STATE.settings.surveyLink slot (already present, previously unused — see
   renderSurveySettings) and the same "compose via mailto, the admin reviews and hits send in their own mail
   client" pattern already used by sendAssignmentEmail() for Hard Skills evaluators, since this app has no
   backend/email service (a pure client-side, localStorage-only tool — see evalLinkTrustNote). Sender identity
   reuses STATE.company.referente (Company Data → "Referente aziendale") for option 1; option 2 is a new,
   empty-by-default STATE.settings.adminSenderEmail — nothing hard-coded. */
let SURVEY_SELECTED_IDS = new Set();

function employeesOrderedByRecency(){
  return STATE.employees
    .map((e, idx) => ({ e, idx }))
    .sort((a,b) => {
      const at = a.e.createdAt ? new Date(a.e.createdAt).getTime() : a.idx;
      const bt = b.e.createdAt ? new Date(b.e.createdAt).getTime() : b.idx;
      return bt - at; // most recently registered first
    })
    .map(x => x.e);
}

function resolveSurveySender(){
  const mode = STATE.settings.surveySenderMode || 'referente';
  if(mode === 'admin') return { mode, email: (STATE.settings.adminSenderEmail||'').trim(), name: UI.surveySenderModeAdmin };
  const ref = (STATE.company && STATE.company.referente) || {};
  return { mode, email: (ref.email||'').trim(), name: ref.name || UI.surveySenderModeReferente };
}

function openSurveyLinkModal(){
  SURVEY_SELECTED_IDS = new Set();
  openModal(UI.surveyLinkModalTitle, UI.surveyLinkModalSub, renderSurveyLinkBodyHtml(), `<button class="btn" onclick="closeModal()">${UI.btnClose}</button>`, true);
}
function refreshSurveyLinkModal(){
  const body = document.getElementById('modal-body');
  if(body) body.innerHTML = renderSurveyLinkBodyHtml();
}
function renderSurveyLinkBodyHtml(){
  const link = (STATE.settings.surveyLink||'').trim();
  const sender = resolveSurveySender();
  const apiConfigured = !!(STATE.settings.emailApiEndpoint||'').trim();
  const employees = employeesOrderedByRecency().filter(e=>!e.archived);
  const allSelected = employees.length>0 && employees.every(e=>SURVEY_SELECTED_IDS.has(e.id));

  const warningHtml = !link ? `
    <div class="survey-warning-box">
      <div><b>${esc(UI.surveyNoLinkConfiguredTitle)}</b>${esc(UI.surveyNoLinkConfiguredBody)}</div>
    </div>
    <button class="btn btn-sm" style="margin-bottom:14px;" onclick="closeModal(); openSettingsModal(); setSettingsTab('survey');">${esc(UI.surveyOpenSettingsBtn)}</button>
  ` : '';

  const senderMissing = !sender.email;
  const senderBoxHtml = `
    <div class="survey-sender-box">
      <div><b>${esc(UI.surveySenderLabel)}:</b> ${sender.mode==='admin' ? esc(UI.surveySenderAdminOption(sender.email)) : esc(UI.surveySenderReferenteOption(sender.name, sender.email))}</div>
      <select onchange="setSurveySenderMode(this.value)">
        <option value="referente" ${sender.mode==='referente'?'selected':''}>${esc(UI.surveySenderModeReferente)}</option>
        <option value="admin" ${sender.mode==='admin'?'selected':''}>${esc(UI.surveySenderModeAdmin)}</option>
      </select>
    </div>
    ${senderMissing ? `<div class="survey-warning-box">${esc(UI.surveySenderMissingWarning)}</div>` : ''}
  `;

  const rowsHtml = employees.length ? employees.map(e => {
    const checked = SURVEY_SELECTED_IDS.has(e.id);
    const hasEmail = !!(e.email && e.email.trim());
    return `<div class="survey-emp-row ${checked?'selected':''}">
      ${iosCheckboxHtml('survey-emp-'+e.id, checked, '', `toggleSurveyEmployee('${e.id}', this.checked)`)}
      ${avatarHtml(e)}
      <div style="flex:1;">
        <div class="survey-emp-name">${esc(e.nome)} ${esc(e.cognome)}</div>
        <div class="survey-emp-email">${hasEmail ? esc(e.email) : `<span class="chip chip-gray">${esc(UI.surveyNoEmailBadge)}</span>`}</div>
      </div>
    </div>`;
  }).join('') : `<div class="small-note" style="padding:14px;">${esc(UI.anagNoEmployeesFound)}</div>`;

  return `
    ${warningHtml}
    ${senderBoxHtml}
    <div class="survey-emp-list">
      ${employees.length ? `<div class="survey-emp-selectall">${iosCheckboxHtml('survey-select-all', allSelected, '', `toggleSurveySelectAll(this.checked)`)}<label for="survey-select-all" style="cursor:pointer;">${esc(UI.surveySelectAllLabel)} (${employees.length})</label></div>` : ''}
      ${rowsHtml}
    </div>
    <div style="display:flex; justify-content:flex-end; align-items:center; gap:10px; margin-top:16px; flex-wrap:wrap;">
      ${!apiConfigured ? `<span class="small-note" style="color:var(--warning);">${esc(UI.toastSurveyApiNotConfigured)}</span>` : ''}
      ${!apiConfigured ? `<button class="btn btn-sm" id="survey-mailto-fallback-btn" onclick="sendSurveyLinksViaMailtoFallback()" title="${esc(UI.surveyMailtoFallbackHint)}">${esc(UI.surveyMailtoFallbackBtn)}</button>` : ''}
      <button class="btn btn-primary" id="survey-send-btn" onclick="submitSendSurveyLinks()">${esc(UI.surveyInviaBtn)}</button>
    </div>
  `;
}
function toggleSurveyEmployee(id, checked){
  if(checked) SURVEY_SELECTED_IDS.add(id); else SURVEY_SELECTED_IDS.delete(id);
  refreshSurveyLinkModal();
}
function toggleSurveySelectAll(checked){
  const employees = employeesOrderedByRecency().filter(e=>!e.archived);
  if(checked) employees.forEach(e=>SURVEY_SELECTED_IDS.add(e.id));
  else SURVEY_SELECTED_IDS.clear();
  refreshSurveyLinkModal();
}
function setSurveySenderMode(mode){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  STATE.settings.surveySenderMode = mode;
  persist();
  refreshSurveyLinkModal();
}
/* The mandatory pre-test letter (Settings → Survey) is prepended to every survey email ahead of
   the admin's own short note, so a collaborator can't receive the link without also receiving the
   instructions — this is the single choke point both the real API send and the mailto fallback
   go through (see prepareSurveySendRecipients()), so neither path can skip it. */
function fillSurveyEmailTemplate(name, link){
  const subject = STATE.settings.surveyEmailSubject || UI.surveyEmailSubjectLabel;
  const bodyTpl = STATE.settings.surveyEmailBody || '{{LINK}}';
  const body = bodyTpl.replace(/\{\{NOME\}\}/g, name).replace(/\{\{LINK\}\}/g, link);
  const letterTpl = STATE.settings.preTestLetter || COLLABORATOR_LETTER_TEMPLATE;
  const letter = letterTpl.indexOf('{{LINK}}')!==-1 ? letterTpl.split('{{LINK}}').join(link) : letterTpl + '\n\n🔗 Link al questionario: ' + link;
  return { subject, body: letter + '\n\n---\n\n' + body };
}
/* Shared validation + recipient-building for both the real API send and the manual mailto fallback below,
   so the two paths can never disagree about who gets emailed or with what content. Returns null (after
   toasting the specific problem) if nothing valid can be sent. */
function prepareSurveySendRecipients(){
  const link = (STATE.settings.surveyLink||'').trim();
  if(!link){ toast(UI.toastSurveyLinkMissing, 'err'); return null; }
  const sender = resolveSurveySender();
  if(!sender.email){ toast(UI.toastSurveySenderMissing, 'err'); return null; }
  if(!SURVEY_SELECTED_IDS.size){ toast(UI.toastSelectAtLeastOneEmployeeSurvey, 'err'); return null; }

  const selected = STATE.employees.filter(e=>SURVEY_SELECTED_IDS.has(e.id));
  const withEmail = selected.filter(e=>e.email && e.email.trim());
  const skipped = selected.length - withEmail.length;
  if(!withEmail.length){ toast(UI.toastSurveySkippedNoEmail(skipped), 'err'); return null; }
  if(skipped>0) toast(UI.toastSurveySkippedNoEmail(skipped), 'err');

  const recipients = withEmail.map(e => {
    const name = e.nome+' '+e.cognome;
    const { subject, body } = fillSurveyEmailTemplate(name, link);
    return { id: e.id, nome: e.nome, cognome: e.cognome, name, email: e.email.trim(), subject, body };
  });
  return { link, sender, recipients };
}

/* ============================= REAL email delivery (Part 1: API-based "Invia link") =============================
   This app is a single static HTML file with no server of its own (confirmed throughout this project — see
   evalLinkTrustNote / the PDF-import notes below), so it cannot send email directly: browser JavaScript has
   no SMTP access, and a bare fetch() to a third-party email API from the browser would expose that API's
   credentials to anyone who opens devtools. The correct, honest integration point is a backend endpoint
   this app POSTs to — STATE.settings.emailApiEndpoint (configured in Settings → Survey, alongside the
   optional bearer-token STATE.settings.emailApiKey) — which is responsible for actually calling a real
   email provider (SendGrid/Postmark/SES/an internal SMTP relay/etc.) and reporting per-recipient success.
   Until that endpoint is configured and reachable, this function refuses to claim anything was sent — see
   toastSurveyApiNotConfigured — and the UI offers the manual mailto fallback instead (a real, working, but
   non-automatic alternative, kept rather than removed). Expected request/response contract, documented here
   because there is no backend project to read it from:
     POST {endpoint}  (Authorization: Bearer {apiKey} if configured)
     body: { sender:{mode,email,name}, surveyLink, recipients:[{id,nome,cognome,email,subject,body}] }
     success response: { results:[{id, email, success:true|false, error?}] }  (preferred — enables accurate
       partial-failure reporting), OR any 2xx with no parseable body (treated as "request accepted", reported
       to the user as such, not as confirmed per-recipient delivery — see the modal's wording). Any non-2xx
       or network failure is reported as a failure, never as success. */
async function submitSendSurveyLinks(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const endpoint = (STATE.settings.emailApiEndpoint||'').trim();
  if(!endpoint){ toast(UI.toastSurveyApiNotConfigured, 'err'); return; }
  const prepared = prepareSurveySendRecipients();
  if(!prepared) return;
  const { sender, link, recipients } = prepared;

  const btn = document.getElementById('survey-send-btn');
  if(btn){ btn.disabled = true; btn.textContent = UI.toastSurveySending(recipients.length); }
  toast(UI.toastSurveySending(recipients.length), 'ok');

  let outcome;
  try{
    const headers = { 'Content-Type': 'application/json' };
    const apiKey = (STATE.settings.emailApiKey||'').trim();
    if(apiKey) headers['Authorization'] = 'Bearer ' + apiKey;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sender, surveyLink: link, recipients }),
    });
    let payload = null;
    try{ payload = await res.json(); }catch(e){ /* non-JSON or empty body — handled below */ }
    if(!res.ok){
      outcome = { ok:false, results: recipients.map(r=>({id:r.id, email:r.email, success:false, error: (payload&&payload.error) || `HTTP ${res.status}`})) };
    } else if(payload && Array.isArray(payload.results)){
      // Preferred path: the backend told us exactly who succeeded and who didn't.
      outcome = { ok:true, results: payload.results };
    } else {
      // The request was accepted (2xx) but the backend didn't report per-recipient status — we only know
      // the request itself succeeded, not that every email was delivered. Reported as such, not oversold.
      outcome = { ok:true, results: recipients.map(r=>({id:r.id, email:r.email, success:true})), unconfirmed:true };
    }
  }catch(err){
    outcome = { ok:false, networkError:true, results: recipients.map(r=>({id:r.id, email:r.email, success:false, error: err.message})) };
  }

  if(btn){ btn.disabled = false; btn.textContent = UI.surveyInviaBtn; }

  const okCount = outcome.results.filter(r=>r.success).length;
  const failCount = outcome.results.length - okCount;
  if(outcome.networkError){
    toast(UI.toastSurveyApiError(outcome.results[0].error), 'err');
  } else if(okCount===0){
    toast(UI.toastSurveySendAllFailed, 'err');
  } else if(failCount===0){
    toast(UI.toastSurveySendAllOk(okCount), 'ok');
  }
  openSurveySendResultsModal(recipients, outcome.results);
}
function openSurveySendResultsModal(recipients, results){
  const byId = {}; recipients.forEach(r=>{ byId[r.id]=r; });
  const okCount = results.filter(r=>r.success).length;
  const failCount = results.length - okCount;
  const rows = results.map(r => {
    const rec = byId[r.id] || {};
    return `<div class="survey-emp-row">
      <span class="chip ${r.success?'chip-green':'chip-red'}"><span class="dt"></span>${r.success?esc(UI.surveySendResultsOkLabel):esc(UI.surveySendResultsFailLabel)}</span>
      <div style="flex:1;">
        <div class="survey-emp-name">${esc(rec.name||r.email)}</div>
        <div class="survey-emp-email">${esc(r.email)}${!r.success && r.error ? ` — ${esc(r.error)}` : ''}</div>
      </div>
    </div>`;
  }).join('');
  const body = `<div class="small-note" style="margin-bottom:12px;">${esc(UI.surveySendResultsSub(okCount, failCount))}</div><div class="survey-emp-list">${rows}</div>`;
  openModal(UI.surveySendResultsTitle, '', body, `<button class="btn btn-primary" onclick="openSurveyLinkModal()">${UI.btnClose}</button>`, true);
}

/* ============================= Manual fallback (mailto) ============================= */
/* Kept, not removed: opens one real mailto: compose per recipient (personalized subject/body, reply-to =
   configured sender) in the user's own mail client — they still click send themselves. Explicitly NOT
   presented as "sent"; only offered when no API endpoint is configured, as a working stand-in until one is. */
function sendSurveyLinksViaMailtoFallback(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const prepared = prepareSurveySendRecipients();
  if(!prepared) return;
  const { sender, recipients } = prepared;

  recipients.forEach((r, i) => {
    const mailto = `mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent(r.subject)}&body=${encodeURIComponent(r.body)}&replyto=${encodeURIComponent(sender.email)}`;
    setTimeout(() => { if(i===0) window.location.href = mailto; else window.open(mailto, '_blank'); }, i*350);
  });
  toast(UI.toastSurveyMailtoOpened(recipients.length), 'ok');
}

/* ---------------------- Scheduled absences editor (shared by Add Employee + drawer inline edit) ----------------------
   Rows are plain uncontrolled inputs, so every add/remove first syncs typed values from the DOM into the
   draft array — otherwise a row the user was mid-typing would be lost when the rows list re-renders. */
let ABSENCE_DRAFTS = {}; // ctx -> [{dal,al,motivo}]
function absenceDraft(ctx){ if(!ABSENCE_DRAFTS[ctx]) ABSENCE_DRAFTS[ctx] = []; return ABSENCE_DRAFTS[ctx]; }
function resetAbsenceDraft(ctx, initial){ ABSENCE_DRAFTS[ctx] = (initial||[]).map(a=>({dal:a.dal||'', al:a.al||'', motivo:a.motivo||''})); }
function syncAbsenceDraftFromDom(ctx){
  absenceDraft(ctx).forEach((row,i) => {
    const dal = document.getElementById(`absence-${ctx}-${i}-dal`);
    const al = document.getElementById(`absence-${ctx}-${i}-al`);
    const motivo = document.getElementById(`absence-${ctx}-${i}-motivo`);
    if(dal) row.dal = dal.value;
    if(al) row.al = al.value;
    if(motivo) row.motivo = motivo.value;
  });
}
function absencesFieldInnerHtml(ctx){
  const draft = absenceDraft(ctx);
  const rows = draft.length ? draft.map((a,i) => `
    <div class="field-row" style="align-items:flex-end;">
      <div class="field"><label>${UI.absenceFromLabel}</label><input type="date" id="absence-${ctx}-${i}-dal" value="${esc(a.dal)}"></div>
      <div class="field"><label>${UI.absenceToLabel}</label><input type="date" id="absence-${ctx}-${i}-al" value="${esc(a.al)}"></div>
      <div class="field" style="flex:1.6;"><label>${UI.absenceReasonLabel}</label><input type="text" id="absence-${ctx}-${i}-motivo" value="${esc(a.motivo)}" placeholder="${esc(UI.absenceReasonPh)}"></div>
      <button type="button" class="btn btn-sm btn-danger-outline" onclick="removeAbsenceRow('${ctx}', ${i})" aria-label="${esc(UI.removeAbsenceBtn)}">${ICONS.trash}</button>
    </div>
  `).join('') : `<div class="small-note" style="margin-bottom:8px;">${UI.noScheduledAbsences}</div>`;
  return `<label>${UI.scheduledAbsencesLabel}</label><div id="absences-rows-${ctx}">${rows}</div><button type="button" class="btn btn-sm" style="margin-top:6px;" onclick="addAbsenceRow('${ctx}')">${ICONS.plus}${UI.addAbsenceBtn}</button>`;
}
function absencesEditorHtml(ctx){
  return `<div class="field" id="absences-field-${ctx}">${absencesFieldInnerHtml(ctx)}</div>`;
}
function addAbsenceRow(ctx){
  syncAbsenceDraftFromDom(ctx);
  absenceDraft(ctx).push({dal:'', al:'', motivo:''});
  document.getElementById('absences-field-'+ctx).innerHTML = absencesFieldInnerHtml(ctx);
}
function removeAbsenceRow(ctx, idx){
  syncAbsenceDraftFromDom(ctx);
  absenceDraft(ctx).splice(idx,1);
  document.getElementById('absences-field-'+ctx).innerHTML = absencesFieldInnerHtml(ctx);
}
function readAbsenceDraft(ctx){
  syncAbsenceDraftFromDom(ctx);
  return absenceDraft(ctx).filter(a => a.dal || a.al || a.motivo.trim());
}

function openAddEmployeeModal(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const areas = areasList();
  const reparti = repartiList();
  const censusRoles = censusRolesList();
  resetAbsenceDraft('add', []);
  const body = `
    <div class="field-row"><div class="field"><label>${UI.addEmpFirstName}</label><input type="text" id="f-nome"></div><div class="field"><label>${UI.addEmpLastName}</label><input type="text" id="f-cognome"></div></div>
    <div class="field"><label>${UI.addEmpEmail}</label><input type="email" id="f-email"></div>
    <div class="field-row">
      <div class="field"><label>${UI.addEmpArea}</label><input type="text" id="f-area" list="dl-aree" placeholder="${esc(UI.addEmpAreaPh)}"><datalist id="dl-aree">${areas.map(a=>`<option value="${esc(a)}">`).join('')}</datalist></div>
      <div class="field"><label>${UI.addEmpDept}</label><input type="text" id="f-reparto" list="dl-reparti" placeholder="${esc(UI.addEmpDeptPh)}"><datalist id="dl-reparti">${reparti.map(r=>`<option value="${esc(r)}">`).join('')}</datalist></div>
    </div>
    <div class="field">
      <label>${UI.addEmpRole}</label>
      <select id="f-ruolo" ${censusRoles.length?'':'disabled'}>
        <option value="">${esc(UI.addEmpRoleEmptyOption)}</option>
        ${censusRoles.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('')}
      </select>
      ${!censusRoles.length ? `<div class="hint">${esc(UI.addEmpNoRolesHint)}</div>` : ''}
    </div>
    <div class="field"><label>${UI.addEmpDuties}</label><textarea id="f-mansione" placeholder="${esc(UI.addEmpDutiesPh)}"></textarea></div>
    <div class="divider"></div>
    <div class="field-row">
      <div class="field"><label>${UI.genderLabel}</label><select id="f-sesso">
        <option value="">${UI.genderUnspecified}</option>
        <option value="F">${UI.genderFemale}</option>
        <option value="M">${UI.genderMale}</option>
        <option value="Altro">${UI.genderOther}</option>
      </select></div>
      <div class="field"><label>${UI.ccnlLevelLabel}</label><input type="text" id="f-ccnl" placeholder="${esc(UI.ccnlLevelPh)}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>${UI.ralLabel}</label><input type="number" min="0" step="500" id="f-ral" placeholder="${esc(UI.ralPh)}"></div>
      <div class="field"><label>${UI.benefitLabel}</label><input type="text" id="f-benefit" placeholder="${esc(UI.benefitPh)}"></div>
    </div>
    <div class="field"><label>${UI.contractTypeLabel}</label><select id="f-tipo-contratto">
      <option value="dipendente">${UI.contractTypeDipendente}</option>
      <option value="cocopro">${UI.contractTypeCocopro}</option>
      <option value="partitaIva">${UI.contractTypePartitaIva}</option>
      <option value="esterno">${UI.contractTypeEsterno}</option>
    </select></div>
    ${absencesEditorHtml('add')}
    <div class="small-note">${UI.addEmpNote}</div>
  `;
  const foot = `<button class="btn" onclick="closeModal()">${UI.importCancel}</button><button class="btn btn-primary" onclick="submitAddEmployee()">${UI.anagAddEmployee}</button>`;
  openModal(UI.addEmpModalTitle, UI.addEmpModalSub, body, foot);
}
function submitAddEmployee(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const nome = document.getElementById('f-nome').value.trim();
  const cognome = document.getElementById('f-cognome').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const area = document.getElementById('f-area').value.trim() || 'Unassigned';
  const reparto = document.getElementById('f-reparto').value.trim();
  const ruolo = document.getElementById('f-ruolo').value;
  const mansione = document.getElementById('f-mansione').value.trim();
  const sesso = document.getElementById('f-sesso').value;
  const livelloCcnl = document.getElementById('f-ccnl').value.trim();
  const ral = Math.max(0, parseInt(document.getElementById('f-ral').value, 10) || 0);
  const benefit = document.getElementById('f-benefit').value.trim();
  const tipoContratto = document.getElementById('f-tipo-contratto').value;
  const assenzeProgrammate = readAbsenceDraft('add');
  if(!nome || !cognome){ toast(UI.toastEnterNameFirst, 'err'); return; }
  if(!ruolo || !STATE.roleProfiles[ruolo]){ toast(UI.toastSelectRoleFirst, 'err'); return; }

  // Employee profile initialization (role census → employee): the selected role's soft-skill weighting
  // (Essenziale/Importante/Utile + valore atteso), configured in openRoleCensusModal, is reused as-is — no
  // second role/skill data source. "ottenuto" and every Hard Skills (Competenze Professionali) score start
  // at 0: nothing has been assessed yet, so nothing is invented.
  const rp = ensureRoleProfile(ruolo);
  const soft = {}; SOFT_SKILLS.forEach(s => {
    const weighted = rp.skillWeights[s.id];
    const atteso = weighted ? (rp.skillExpected[s.id]!=null ? rp.skillExpected[s.id] : 8) : softSkillTargetDefault(s.id);
    soft[s.id] = { ottenuto:0, atteso };
  });
  const hard = { resp:{}, peer:{}, auto:{} };
  APEX5D_DIMENSIONS.forEach(d=>d.items.forEach(it=>{ APEX_SOURCES.forEach(src=>{ hard[src.key][it.cod]=0; }); }));

  const emp = { id:uid('emp'), nome, cognome, email, area, reparto, ruolo, mansione, tipoProfilo:'Employee',
    sesso, tipoContratto, livelloCcnl, ral, benefit, assenzeProgrammate, archived:null,
    soft, hard, hardEvaluatedBy:{ resp:'', peer:'', auto:'' }, hardHistory:[], softHistory:[], feedbackNeeded:false, developmentPlan:{ azioni:'', formazione:'', coaching:'', obiettivi:'' },
    createdAt: new Date().toISOString() };
  STATE.employees.push(emp);
  persist();
  closeModal();
  toast(UI.toastEmployeeAdded, 'ok');
  updateSidebarFooter();
  rerenderCurrentPage();
}
/* ---------------------- Archival workflow (replaces permanent delete) ----------------------
   Archiving keeps the employee record (and all their evaluation history) but marks it inactive:
   filtered out of the Anagrafica active list, still reachable via the "show archived" toggle. */
const ARCHIVE_REASONS = ['pensione', 'licenziamento', 'probation', 'altro'];
function archiveReasonLabel(key){
  return { pensione: UI.archiveReasonPensione, licenziamento: UI.archiveReasonLicenziamento, probation: UI.archiveReasonProbation, altro: UI.archiveReasonAltro }[key] || key;
}
function openArchiveModal(id){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const emp = STATE.employees.find(e=>e.id===id);
  if(!emp) return;
  const body = `
    <div class="field">
      <label>${UI.archiveReasonFieldLabel}</label>
      <select id="archive-reason" onchange="updateArchiveReasonField()">
        ${ARCHIVE_REASONS.map(r=>`<option value="${r}">${esc(archiveReasonLabel(r))}</option>`).join('')}
      </select>
    </div>
    <div class="field" id="archive-other-field" style="display:none;">
      <label>${UI.archiveOtherLabel}</label>
      <input type="text" id="archive-other-text" placeholder="${esc(UI.archiveOtherPh)}">
    </div>
  `;
  const foot = `<button class="btn" onclick="closeModal()">${UI.importCancel}</button><button class="btn btn-danger-outline" onclick="submitArchiveEmployee('${id}')">${UI.archiveConfirmBtn}</button>`;
  openModal(UI.archiveModalTitle, UI.archiveModalSub(emp.nome+' '+emp.cognome), body, foot);
}
function updateArchiveReasonField(){
  const reason = document.getElementById('archive-reason').value;
  document.getElementById('archive-other-field').style.display = reason==='altro' ? '' : 'none';
}
function submitArchiveEmployee(id){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const emp = STATE.employees.find(e=>e.id===id);
  if(!emp) return;
  const reason = document.getElementById('archive-reason').value;
  const note = reason==='altro' ? document.getElementById('archive-other-text').value.trim() : '';
  if(reason==='altro' && !note){ toast(UI.toastArchiveOtherRequired, 'err'); return; }
  emp.archived = { reason, note, date: new Date().toISOString().slice(0,10) };
  persist();
  closeModal();
  closeDrawer();
  updateSidebarFooter();
  rerenderCurrentPage();
  toast(UI.toastEmployeeArchived, 'ok');
}
function restoreEmployee(id){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const emp = STATE.employees.find(e=>e.id===id);
  if(!emp) return;
  emp.archived = null;
  persist();
  rerenderCurrentPage();
  toast(UI.toastEmployeeRestored, 'ok');
}

/* ============================= EMPLOYEE PROFILE (drawer) ============================= */
/* "Profilo atteso per il ruolo": reads the employee's role census profile live via emp.ruolo →
   STATE.roleProfiles (SKILL_WEIGHT_LEVELS / ensureRoleProfile, defined with the role census above) —
   nothing is copied onto the employee besides the atteso value already synced by applyRoleSkillToEmployees,
   so editing a role's weighting later is reflected here immediately without touching hardHistory or any
   already-recorded ottenuto score. Renders nothing if the role has no soft-skill weighting configured. */
function employeeRoleExpectedProfileHtml(emp){
  const rp = STATE.roleProfiles[emp.ruolo];
  const weightedIds = rp && rp.skillWeights ? Object.keys(rp.skillWeights) : [];
  if(!weightedIds.length) return '';
  const rows = SOFT_SKILLS.filter(s=>weightedIds.includes(s.id)).map(s => {
    const w = rp.skillWeights[s.id];
    const lvl = SKILL_WEIGHT_LEVELS[w];
    const expected = rp.skillExpected[s.id]!=null ? rp.skillExpected[s.id] : 8;
    return `<div class="rc-skill-row">
      <span class="rc-skill-name">${esc(s.name)}</span>
      <span class="chip ${lvl?lvl.chip:'chip-gray'}"><span class="dt"></span>${lvl?esc(UI[lvl.labelKey]):''}</span>
      <span class="small-note" style="min-width:104px; text-align:right; flex-shrink:0;">${esc(UI.rcExpectedLabel)}: <b>${fmt1(expected)}</b></span>
    </div>`;
  }).join('');
  return `<div class="card-eyebrow" style="margin-top:6px;">${esc(UI.profileRoleExpectedTitle)}</div>
    <div class="small-note" style="margin-bottom:8px;">${esc(UI.profileRoleExpectedSub(emp.ruolo))}</div>
    ${rows}
    <div class="divider"></div>`;
}
function buildEmployeeProfileHtml(emp){
  if(DRAWER_EDIT_MODE) return buildEmployeeEditFormHtml(emp);

  const f = getModuleFlags();
  const tier = tierFor(primaryScore(emp));
  let html = '';

  if(emp.archived){
    html += `<div class="tinted-tile warning" style="margin-bottom:16px;">
      <div style="font-weight:700; font-size:12.8px; color:var(--warning);">${esc(UI.profileArchivedBanner(archiveReasonLabel(emp.archived.reason), emp.archived.date))}</div>
      ${emp.archived.note ? `<div class="small-note" style="margin-top:4px;">${esc(emp.archived.note)}</div>` : ''}
      ${canEdit() ? `<button class="btn btn-sm" style="margin-top:10px;" onclick="restoreEmployee('${emp.id}')">${UI.anagRestore}</button>` : ''}
    </div>`;
  } else if(canEdit()){
    html += `<div style="display:flex; gap:8px; margin-bottom:16px;">
      <button class="btn btn-sm" onclick="toggleDrawerEdit(true)">${ICONS.edit}${UI.editProfileBtn}</button>
      <button class="btn btn-sm btn-danger-outline" onclick="openArchiveModal('${emp.id}')">${UI.anagArchive}</button>
    </div>`;
  }

  html += `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;">
    <span class="chip ${tier.chip}"><span class="dt"></span>${esc(tier.label)}</span>
    <span class="chip chip-gray">${esc(emp.tipoProfilo||UI.profileEmployeeType)}</span>
    ${emp.feedbackNeeded?`<span class="chip chip-red"><span class="dt"></span>${UI.profileDebriefPending}</span>`:''}
  </div>
  <div class="small-note" style="margin-bottom:10px;"><b>${UI.profileEmailLabel}</b> ${esc(emp.email)||'—'} &nbsp;·&nbsp; <b>${UI.profileDeptLabel}</b> ${esc(emp.reparto)||'—'} &nbsp;·&nbsp; <b>${UI.profileDutiesLabel}</b> ${esc(emp.mansione)||'—'}</div>
  <div class="small-note" style="margin-bottom:16px;"><b>${UI.genderLabel}</b> ${esc(genderDisplayLabel(emp.sesso))||'—'} &nbsp;·&nbsp; <b>${UI.contractTypeLabel}</b> ${esc(contractTypeDisplayLabel(emp.tipoContratto))} &nbsp;·&nbsp; <b>${UI.ccnlLevelLabel}</b> ${esc(emp.livelloCcnl)||'—'} &nbsp;·&nbsp; <b>${UI.ralLabel}</b> ${emp.ral?fmtCurrency(emp.ral):'—'} &nbsp;·&nbsp; <b>${UI.benefitLabel}</b> ${esc(emp.benefit)||'—'}</div>
  ${(emp.assenzeProgrammate&&emp.assenzeProgrammate.length) ? `<div class="small-note" style="margin-bottom:16px;"><b>${UI.scheduledAbsencesLabel}</b> ${emp.assenzeProgrammate.map(a=>esc(`${a.dal||'—'} → ${a.al||'—'}${a.motivo?' ('+a.motivo+')':''}`)).join('; ')}</div>` : ''}`;

  if(f.A){
    const ss = computeSoftSummary(emp);
    const bf = computeBigFive(emp);
    const softHist = getEmployeeSoftHistorySorted(emp);
    const lastSoftSnap = softHist.length ? softHist[softHist.length-1] : null;
    html += employeeRoleExpectedProfileHtml(emp);
    html += `<div class="card-eyebrow" style="margin-top:6px;">${UI.profileModuleATitle}</div>
    <div class="small-note" style="margin-bottom:6px;">
      <b>${esc(UI.profileLastAssessmentLabel)}:</b> ${lastSoftSnap ? esc(lastSoftSnap.date.slice(0,10)) : esc(UI.profileNoAssessmentYet)}
      ${softHist.length>1 ? ` &nbsp;·&nbsp; <a href="javascript:void(0)" onclick="openPreviousSoftAssessmentsModal('${emp.id}')" style="color:var(--link); font-weight:700; text-decoration:none;">${esc(UI.profilePrevAssessmentsBtn)}</a>` : ''}
      ${lastSoftSnap && !f.B ? ` &nbsp;·&nbsp; <a href="javascript:void(0)" onclick="downloadEmployeeReport('${emp.id}')" style="color:var(--link); font-weight:700; text-decoration:none;">${ICONS.download}${esc(UI.reportBtn)}</a>` : ''}
    </div>
    <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:10px;"><div style="font-size:22px;font-weight:800;">${fmt1(ss.overallOttenuto)}</div><div class="small-note">${UI.profileObtainedExpected(fmt1(ss.overallAtteso))}</div></div>
    <div class="grid grid-2" style="gap:8px;">${BIGFIVE_ORDER.map(d=>statTileHtml(BIGFIVE_DIMS[d].label, bf[d], 6.5)).join('')}</div>
    <div class="card-eyebrow" style="margin-top:14px;">${UI.profileTop3Strengths}</div>
    <div class="grid grid-2" style="gap:8px;">${[...ss.perSkill].sort((a,b)=>b.gap-a.gap).slice(0,3).map(s=>statTileHtml(s.name, s.ottenuto, s.atteso)).join('')}</div>
    <div class="card-eyebrow" style="margin-top:14px;">${UI.profileDevAreas}</div>
    <div class="grid grid-2" style="gap:8px;">${[...ss.perSkill].sort((a,b)=>a.gap-b.gap).slice(0,3).map(s=>statTileHtml(s.name, s.ottenuto, s.atteso)).join('')}</div>
    <div class="divider"></div>`;
  }
  if(f.B){
    const hsm = computeHardSummary(emp);
    const assessSnapshots = getEmployeePeriodSnapshots(emp);
    const lastAssessSnap = assessSnapshots.length ? assessSnapshots[assessSnapshots.length-1] : null;
    html += `<div class="card-eyebrow">${UI.profileModuleBTitle}</div>
    <div class="small-note" style="margin-bottom:6px;">
      <b>${esc(UI.profileLastAssessmentLabel)}:</b> ${lastAssessSnap ? esc(lastAssessSnap.date.slice(0,10)) : esc(UI.profileNoAssessmentYet)}
      ${lastAssessSnap && lastAssessSnap.periodLabel ? ` &nbsp;·&nbsp; ${esc(lastAssessSnap.periodLabel)}` : ''}
      ${assessSnapshots.length>1 ? ` &nbsp;·&nbsp; <a href="javascript:void(0)" onclick="openPreviousAssessmentsModal('${emp.id}')" style="color:var(--link); font-weight:700; text-decoration:none;">${esc(UI.profilePrevAssessmentsBtn)}</a>` : ''}
      ${lastAssessSnap ? ` &nbsp;·&nbsp; <a href="javascript:void(0)" onclick="downloadEmployeeReport('${emp.id}')" style="color:var(--link); font-weight:700; text-decoration:none;">${ICONS.download}${esc(UI.reportBtn)}</a>` : ''}
      ${lastAssessSnap ? ` &nbsp;·&nbsp; ${esc(assessmentSourceLabel(lastAssessSnap.source))}` : ''}
    </div>
    <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:10px;"><div style="font-size:22px;font-weight:800;">${fmt1(lastAssessSnap ? lastAssessSnap.apexScore : hsm.apexScore)}</div><div class="small-note">${UI.profileOverallApexScoreLine}</div></div>
    <div class="grid grid-2" style="gap:8px;">${hsm.dims.map(d=>{
      const gi = gapInterpretation(d.gapRespAuto);
      const tag = `<div style="margin-top:8px;"><span class="gap-tag ${gi.tag}">${esc(UI.tagMgr)} ${fmt1(d.perSource.resp)} · ${esc(UI.tagPeer)} ${fmt1(d.perSource.peer)} · ${esc(UI.tagSelf)} ${fmt1(d.perSource.auto)} — ${esc(gi.label)}</span></div>`;
      return statTileHtml(d.code+' · '+d.name, d.mediaTotale, 6.5, tag);
    }).join('')}</div>
    <div class="divider"></div>`;
  }

  html += `<div class="card-eyebrow" style="margin-bottom:8px;">${UI.profileFeedbackDevPlanTitle}</div>
  ${feedbackSwitchHtml('drw-feedback', emp.feedbackNeeded)}
  ${devPlanFieldsHtml('drw', emp.developmentPlan)}
  <button class="btn btn-primary btn-sm" onclick="saveEmployeeFeedback('${emp.id}')">${UI.profileSaveFeedbackBtn}</button>`;

  return html;
}
function toggleDrawerEdit(edit){
  DRAWER_EDIT_MODE = edit;
  const emp = STATE.employees.find(e=>e.id===DRAWER_EMP_ID);
  if(edit && emp) resetAbsenceDraft('edit-'+emp.id, emp.assenzeProgrammate);
  refreshDrawer();
}
/* Inline edit form for the drawer — clicking an employee's name opens the drawer, and Edit here
   is the entry point for correcting their record (Section 2's "click a name to edit or remove"). */
function buildEmployeeEditFormHtml(emp){
  const areas = areasList();
  const reparti = repartiList();
  const roles = allRolesKnown();
  const ctx = 'edit-'+emp.id;
  return `
    <div class="field-row"><div class="field"><label>${UI.addEmpFirstName}</label><input type="text" id="edit-nome" value="${esc(emp.nome)}"></div><div class="field"><label>${UI.addEmpLastName}</label><input type="text" id="edit-cognome" value="${esc(emp.cognome)}"></div></div>
    <div class="field"><label>${UI.addEmpEmail}</label><input type="email" id="edit-email" value="${esc(emp.email)}"></div>
    <div class="field-row">
      <div class="field"><label>${UI.addEmpArea}</label><input type="text" id="edit-area" list="dl-aree-edit" value="${esc(emp.area)}"><datalist id="dl-aree-edit">${areas.map(a=>`<option value="${esc(a)}">`).join('')}</datalist></div>
      <div class="field"><label>${UI.addEmpDept}</label><input type="text" id="edit-reparto" list="dl-reparti-edit" value="${esc(emp.reparto)}"><datalist id="dl-reparti-edit">${reparti.map(r=>`<option value="${esc(r)}">`).join('')}</datalist></div>
    </div>
    <div class="field"><label>${UI.addEmpRole}</label><input type="text" id="edit-ruolo" list="dl-ruoli-edit" value="${esc(emp.ruolo)}"><datalist id="dl-ruoli-edit">${roles.map(r=>`<option value="${esc(r)}">`).join('')}</datalist></div>
    <div class="field"><label>${UI.addEmpDuties}</label><textarea id="edit-mansione">${esc(emp.mansione)}</textarea></div>
    <div class="divider"></div>
    <div class="field-row">
      <div class="field"><label>${UI.genderLabel}</label><select id="edit-sesso">
        <option value="" ${!emp.sesso?'selected':''}>${UI.genderUnspecified}</option>
        <option value="F" ${emp.sesso==='F'?'selected':''}>${UI.genderFemale}</option>
        <option value="M" ${emp.sesso==='M'?'selected':''}>${UI.genderMale}</option>
        <option value="Altro" ${emp.sesso==='Altro'?'selected':''}>${UI.genderOther}</option>
      </select></div>
      <div class="field"><label>${UI.ccnlLevelLabel}</label><input type="text" id="edit-ccnl" value="${esc(emp.livelloCcnl)}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>${UI.ralLabel}</label><input type="number" min="0" step="500" id="edit-ral" value="${emp.ral||0}"></div>
      <div class="field"><label>${UI.benefitLabel}</label><input type="text" id="edit-benefit" value="${esc(emp.benefit)}"></div>
    </div>
    <div class="field"><label>${UI.contractTypeLabel}</label><select id="edit-tipo-contratto">
      <option value="dipendente" ${emp.tipoContratto==='dipendente'?'selected':''}>${UI.contractTypeDipendente}</option>
      <option value="cocopro" ${emp.tipoContratto==='cocopro'?'selected':''}>${UI.contractTypeCocopro}</option>
      <option value="partitaIva" ${emp.tipoContratto==='partitaIva'?'selected':''}>${UI.contractTypePartitaIva}</option>
      <option value="esterno" ${emp.tipoContratto==='esterno'?'selected':''}>${UI.contractTypeEsterno}</option>
    </select></div>
    ${absencesEditorHtml(ctx)}
    <div style="display:flex; gap:8px; margin-top:6px;">
      <button class="btn btn-primary btn-sm" onclick="saveEmployeeProfileEdit('${emp.id}')">${UI.saveChanges}</button>
      <button class="btn btn-sm" onclick="toggleDrawerEdit(false)">${UI.cancelEdit}</button>
    </div>
  `;
}
function saveEmployeeProfileEdit(id){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const emp = STATE.employees.find(e=>e.id===id);
  if(!emp) return;
  const nome = document.getElementById('edit-nome').value.trim();
  const cognome = document.getElementById('edit-cognome').value.trim();
  if(!nome || !cognome){ toast(UI.toastEnterNameFirst, 'err'); return; }
  emp.nome = nome;
  emp.cognome = cognome;
  emp.email = document.getElementById('edit-email').value.trim();
  emp.area = document.getElementById('edit-area').value.trim() || 'Unassigned';
  emp.reparto = document.getElementById('edit-reparto').value.trim();
  emp.ruolo = document.getElementById('edit-ruolo').value.trim() || 'Unassigned';
  emp.mansione = document.getElementById('edit-mansione').value.trim();
  emp.sesso = document.getElementById('edit-sesso').value;
  emp.livelloCcnl = document.getElementById('edit-ccnl').value.trim();
  emp.ral = Math.max(0, parseInt(document.getElementById('edit-ral').value, 10) || 0);
  emp.benefit = document.getElementById('edit-benefit').value.trim();
  emp.tipoContratto = document.getElementById('edit-tipo-contratto').value;
  emp.assenzeProgrammate = readAbsenceDraft('edit-'+id);
  persist();
  DRAWER_EDIT_MODE = false;
  updateSidebarFooter();
  refreshDrawer();
  rerenderCurrentPage();
  toast(UI.toastProfileUpdated, 'ok');
}
function saveEmployeeFeedback(id){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const emp = STATE.employees.find(e=>e.id===id);
  if(!emp) return;
  emp.feedbackNeeded = document.getElementById('drw-feedback').checked;
  emp.developmentPlan = readDevPlanFields('drw');
  persist();
  toast(UI.toastFeedbackUpdated, 'ok');
  if(CURRENT_PAGE==='feedback') rerenderCurrentPage();
}


/* ============================= COMPANY PROFILE ============================= */
function renderCompany(){
  const el = document.getElementById('page-company');
  const c = STATE.company;
  setTopbarActions('');
  el.innerHTML = `
    <div class="section-head"><div><h2>${UI.companyPageTitle}</h2><p>${UI.companyPageSub}</p></div></div>

    <div class="section-head"><div><h2 style="font-size:14px;">${UI.companyHeadcountTitle}</h2><p>${UI.companyHeadcountSub}</p></div></div>
    <div class="card">
      <div class="grid grid-4" style="gap:10px;">${companyHeadcountTilesHtml()}</div>
    </div>

    <div class="divider"></div>
    <div class="section-head"><div><h2 style="font-size:14px;">${UI.companyLocationsTitle}</h2><p>${UI.companyLocationsSub}</p></div></div>
    <div class="card" id="co-locations-field">${companyLocationsInnerHtml()}</div>

    <div class="divider"></div>
    <div class="section-head"><div><h2 style="font-size:14px;">${UI.companyContactsTitle}</h2><p>${UI.companyContactsSub}</p></div></div>
    <div class="card" id="co-contacts-field">${companyContactsInnerHtml()}</div>

    <div class="divider"></div>
    <div class="section-head"><div><h2 style="font-size:14px;">${UI.companyKeyRolesTitle}</h2><p>${UI.companyKeyRolesSub}</p></div></div>
    <div class="grid grid-3">
      <div class="card">
        <div class="card-title" style="margin-bottom:10px;">${UI.companyReferenteLabel}</div>
        <div class="field"><label>${UI.companyNameLabel}</label><input type="text" id="co-ref-name" value="${esc(c.referente.name)}"></div>
        <div class="field"><label>${UI.companyEmailLabel}</label><input type="email" id="co-ref-email" value="${esc(c.referente.email)}"></div>
        <div class="field"><label>${UI.companyPhoneLabel}</label><input type="text" id="co-ref-phone" value="${esc(c.referente.phone)}"></div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:10px;">${UI.companyCeoLabel}</div>
        <div class="field"><label>${UI.companyNameLabel}</label><input type="text" id="co-ceo-name" value="${esc(c.ceo.name)}"></div>
        <div class="field"><label>${UI.companyEmailLabel}</label><input type="email" id="co-ceo-email" value="${esc(c.ceo.email)}"></div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:10px;">${UI.companyCfoLabel}</div>
        <div class="field"><label>${UI.companyNameLabel}</label><input type="text" id="co-cfo-name" value="${esc(c.cfo.name)}"></div>
        <div class="field"><label>${UI.companyEmailLabel}</label><input type="email" id="co-cfo-email" value="${esc(c.cfo.email)}"></div>
      </div>
    </div>

    ${canEdit() ? `<div style="display:flex; justify-content:flex-end; margin-top:18px;"><button class="btn btn-primary" onclick="saveCompany()">${UI.companySaveBtn}</button></div>` : ''}
  `;
}
/* Dati Aziendali headcount (Section 1): counts are computed live from Anagrafica Risorse — via
   emp.tipoContratto — instead of being manually typed, so a tile can never drift from the actual
   employee list. Each tile opens a modal listing the employees behind that count. */
const CONTRACT_TYPES = ['dipendente', 'cocopro', 'partitaIva', 'esterno'];
function contractTypeLabel(type){
  return { dipendente: UI.companyHeadcountDipendenti, cocopro: UI.companyHeadcountCocopro, partitaIva: UI.companyHeadcountPartitaIva, esterno: UI.companyHeadcountEsterni }[type] || type;
}
function companyHeadcountCounts(){
  const counts = { dipendente:0, cocopro:0, partitaIva:0, esterno:0 };
  STATE.employees.filter(e=>!e.archived).forEach(e => { counts[e.tipoContratto||'dipendente']++; });
  return counts;
}
function companyHeadcountTilesHtml(){
  const counts = companyHeadcountCounts();
  const variants = { dipendente:'accent', cocopro:'success', partitaIva:'warning', esterno:'danger' };
  return CONTRACT_TYPES.map(type => `
    <div class="tinted-tile clickable ${variants[type]}" style="text-align:center; padding:14px 10px;" onclick="openHeadcountBreakdownModal('${type}')">
      <div style="font-size:22px; font-weight:800; color:var(--text-1);">${counts[type]}</div>
      <div style="font-size:11.5px; font-weight:700; color:var(--text-2); margin-top:2px;">${esc(contractTypeLabel(type))}</div>
    </div>
  `).join('');
}
function openHeadcountBreakdownModal(type){
  const emps = STATE.employees.filter(e=>!e.archived && (e.tipoContratto||'dipendente')===type);
  const rows = emps.length ? emps.map(e => `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border);">
      <span>${esc(e.nome+' '+e.cognome)} <span class="small-note">— ${esc(e.ruolo)}${e.area?' · '+esc(e.area):''}</span></span>
    </div>
  `).join('') : `<div class="small-note">${UI.companyHeadcountBreakdownEmpty}</div>`;
  openModal(UI.companyHeadcountBreakdownTitle(contractTypeLabel(type)), '', rows, `<button class="btn" onclick="closeModal()">${UI.btnClose}</button>`);
}
function companyLocationsInnerHtml(){
  const locs = STATE.company.locations;
  const rows = locs.length ? locs.map((l,i) => `
    <div class="field-row" style="align-items:flex-end;">
      <div class="field"><label>${UI.companyLocationNameLabel}</label><input type="text" id="co-loc-${i}-name" value="${esc(l.name)}"></div>
      <div class="field" style="flex:1.6;"><label>${UI.companyLocationAddressLabel}</label><input type="text" id="co-loc-${i}-address" value="${esc(l.address)}"></div>
      <div class="field"><label>${UI.companyLocationCityLabel}</label><input type="text" id="co-loc-${i}-city" value="${esc(l.city)}"></div>
      ${canEdit() ? `<button type="button" class="btn btn-sm btn-danger-outline" onclick="removeCompanyLocationRow(${i})">${ICONS.trash}</button>` : ''}
    </div>
  `).join('') : `<div class="small-note" style="margin-bottom:8px;">${UI.companyNoLocations}</div>`;
  return `${rows}${canEdit() ? `<button type="button" class="btn btn-sm" style="margin-top:6px;" onclick="addCompanyLocationRow()">${ICONS.plus}${UI.companyAddLocationBtn}</button>` : ''}`;
}
function companyContactsInnerHtml(){
  const contacts = STATE.company.contacts;
  const rows = contacts.length ? contacts.map((ct,i) => `
    <div class="field-row" style="align-items:flex-end;">
      <div class="field"><label>${UI.companyContactLabelLabel}</label><input type="text" id="co-ct-${i}-label" value="${esc(ct.label)}"></div>
      <div class="field"><label>${UI.companyContactNameLabel}</label><input type="text" id="co-ct-${i}-name" value="${esc(ct.name)}"></div>
      <div class="field"><label>${UI.companyContactEmailLabel}</label><input type="email" id="co-ct-${i}-email" value="${esc(ct.email)}"></div>
      <div class="field"><label>${UI.companyContactPhoneLabel}</label><input type="text" id="co-ct-${i}-phone" value="${esc(ct.phone)}"></div>
      ${canEdit() ? `<button type="button" class="btn btn-sm btn-danger-outline" onclick="removeCompanyContactRow(${i})">${ICONS.trash}</button>` : ''}
    </div>
  `).join('') : `<div class="small-note" style="margin-bottom:8px;">${UI.companyNoContacts}</div>`;
  return `${rows}${canEdit() ? `<button type="button" class="btn btn-sm" style="margin-top:6px;" onclick="addCompanyContactRow()">${ICONS.plus}${UI.companyAddContactBtn}</button>` : ''}`;
}
function syncCompanyDraftFromDom(){
  STATE.company.locations.forEach((l,i) => {
    const name = document.getElementById(`co-loc-${i}-name`), address = document.getElementById(`co-loc-${i}-address`), city = document.getElementById(`co-loc-${i}-city`);
    if(name) l.name = name.value; if(address) l.address = address.value; if(city) l.city = city.value;
  });
  STATE.company.contacts.forEach((ct,i) => {
    const label = document.getElementById(`co-ct-${i}-label`), name = document.getElementById(`co-ct-${i}-name`), email = document.getElementById(`co-ct-${i}-email`), phone = document.getElementById(`co-ct-${i}-phone`);
    if(label) ct.label = label.value; if(name) ct.name = name.value; if(email) ct.email = email.value; if(phone) ct.phone = phone.value;
  });
}
function addCompanyLocationRow(){
  if(!canEdit()) return;
  syncCompanyDraftFromDom();
  STATE.company.locations.push({name:'', address:'', city:''});
  document.getElementById('co-locations-field').innerHTML = companyLocationsInnerHtml();
}
function removeCompanyLocationRow(idx){
  if(!canEdit()) return;
  syncCompanyDraftFromDom();
  STATE.company.locations.splice(idx,1);
  document.getElementById('co-locations-field').innerHTML = companyLocationsInnerHtml();
}
function addCompanyContactRow(){
  if(!canEdit()) return;
  syncCompanyDraftFromDom();
  STATE.company.contacts.push({label:'', name:'', email:'', phone:''});
  document.getElementById('co-contacts-field').innerHTML = companyContactsInnerHtml();
}
function removeCompanyContactRow(idx){
  if(!canEdit()) return;
  syncCompanyDraftFromDom();
  STATE.company.contacts.splice(idx,1);
  document.getElementById('co-contacts-field').innerHTML = companyContactsInnerHtml();
}
function saveCompany(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  syncCompanyDraftFromDom();
  STATE.company.referente = { name: document.getElementById('co-ref-name').value, email: document.getElementById('co-ref-email').value, phone: document.getElementById('co-ref-phone').value };
  STATE.company.ceo = { name: document.getElementById('co-ceo-name').value, email: document.getElementById('co-ceo-email').value };
  STATE.company.cfo = { name: document.getElementById('co-cfo-name').value, email: document.getElementById('co-cfo-email').value };
  persist();
  toast(UI.toastCompanySaved, 'ok');
}

/* ============================= INITIAL ANALYSIS ============================= */
let ANALISI_EDIT_MODE = false;
function analisiFields(){
  return [
    { id:'ai-problematiche', key:'problematiche', title:UI.analisiFieldProblematiche },
    { id:'ai-criticita', key:'criticita', title:UI.analisiFieldCriticita },
    { id:'ai-obiettivi', key:'obiettiviProgetto', title:UI.analisiFieldObiettivi },
    { id:'ai-aspettative', key:'aspettative', title:UI.analisiFieldAspettative },
  ];
}
function analisiFieldHtml(field, value){
  if(ANALISI_EDIT_MODE){
    return `<div class="card">
      <div class="card-title" style="margin-bottom:10px;">${esc(field.title)}</div>
      <textarea id="${field.id}" class="neu-input" style="width:100%; min-height:140px; line-height:1.55; resize:vertical;">${esc(value)}</textarea>
    </div>`;
  }
  const hasValue = value && value.trim().length;
  return `<div class="card">
    <div class="card-title" style="margin-bottom:10px;">${esc(field.title)}</div>
    <div style="font-size:12.8px; line-height:1.65; white-space:pre-wrap; color:${hasValue?'var(--text-1)':'var(--text-3)'}; ${hasValue?'':'font-style:italic;'}">${hasValue?esc(value):UI.analisiNotDocumented}</div>
  </div>`;
}
function renderAnalisi(){
  const el = document.getElementById('page-analisi');
  const a = STATE.analisiIniziale;
  const editing = ANALISI_EDIT_MODE;

  setTopbarActions(editing || !canEdit() ? '' : `<button class="btn btn-primary" onclick="toggleAnalisiEdit(true)">${ICONS.edit}${UI.analisiEditBtn}</button>`);

  el.innerHTML = `
    <div class="section-head"><div><h2>${UI.analisiPageTitle}</h2><p>${UI.analisiPageSub} ${editing ? UI.analisiEditingNote : UI.analisiClickEditNote}</p></div></div>
    <div class="grid grid-2">
      ${analisiFields().map(f => analisiFieldHtml(f, a[f.key])).join('')}
    </div>
    ${editing ? `<div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
      <button class="btn" onclick="toggleAnalisiEdit(false)">${UI.importCancel}</button>
      <button class="btn btn-primary" onclick="saveAnalisi()">${UI.analisiSaveBtn}</button>
    </div>` : ''}
  `;
}
function toggleAnalisiEdit(on){
  if(on && !canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  ANALISI_EDIT_MODE = on;
  renderAnalisi();
}
function saveAnalisi(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  STATE.analisiIniziale = {
    problematiche: document.getElementById('ai-problematiche').value,
    criticita: document.getElementById('ai-criticita').value,
    obiettiviProgetto: document.getElementById('ai-obiettivi').value,
    aspettative: document.getElementById('ai-aspettative').value,
  };
  persist();
  ANALISI_EDIT_MODE = false;
  renderAnalisi();
  toast(UI.toastAnalisiSaved, 'ok');
}

/* ============================= MODULE A — SOFT SKILLS ============================= */
let SOFT_VIEW = 'org';
let SOFT_SELECTED_EMP = null;
let SOFT_MATCH = [];
let SOFT_RANK_SORT = 'score';

function renderSoft(){
  const el = document.getElementById('page-soft');
  setTopbarActions(canEdit() ? `<button class="btn btn-primary" onclick="openSoftEvalModal()">${ICONS.plus}${UI.newEvaluation}</button>` : '');
  el.innerHTML = `
    <div class="view-tabs">
      <div class="view-tab ${SOFT_VIEW==='org'?'active':''}" onclick="setSoftView('org')">${UI.softTabOrg}</div>
      <div class="view-tab ${SOFT_VIEW==='area'?'active':''}" onclick="setSoftView('area')">${UI.softTabArea}</div>
      <div class="view-tab ${SOFT_VIEW==='alfa'?'active':''}" onclick="setSoftView('alfa')">${UI.softTabAlfa}</div>
      <div class="view-tab ${SOFT_VIEW==='individuale'?'active':''}" onclick="setSoftView('individuale')">${UI.softTabIndividuale}</div>
      <div class="view-tab ${SOFT_VIEW==='ranking'?'active':''}" onclick="setSoftView('ranking')">${UI.softTabRanking}</div>
      <div class="view-tab ${SOFT_VIEW==='match'?'active':''}" onclick="setSoftView('match')">${UI.matchUpTo5}</div>
    </div>
    <div id="soft-view-body"></div>
  `;
  renderSoftViewBody();
}
function setSoftView(v){ SOFT_VIEW = v; renderSoft(); }

function renderSoftViewBody(){
  const body = document.getElementById('soft-view-body');
  destroyCharts();
  if(SOFT_VIEW==='org') return renderSoftOrgView(body);
  if(SOFT_VIEW==='area') return renderSoftAreaView(body);
  if(SOFT_VIEW==='alfa') return renderSoftAlfaView(body);
  if(SOFT_VIEW==='individuale') return renderSoftIndividualeView(body);
  if(SOFT_VIEW==='ranking') return renderSoftRankingView(body);
  if(SOFT_VIEW==='match') return renderSoftMatchView(body);
}

function renderSoftOrgView(body){
  const clusterAvgs = SOFT_CLUSTERS.map(c => {
    const items = SOFT_SKILLS.filter(s=>s.cluster===c);
    const ott = avg(STATE.employees.flatMap(e=>items.map(i=>(e.soft[i.id]||{ottenuto:0}).ottenuto)));
    const att = avg(STATE.employees.flatMap(e=>items.map(i=>(e.soft[i.id]||{atteso:6}).atteso)));
    return { cluster:c, ott:round1(ott), att:round1(att) };
  });
  const bfOrg = {}; const bfOrgAtteso = {}; BIGFIVE_ORDER.forEach(d=>{
    const ids = SOFT_SKILLS.filter(s=>s.dim===d).map(s=>s.id);
    bfOrg[d] = round1(avg(STATE.employees.flatMap(e=>ids.map(id=>(e.soft[id]||{ottenuto:0}).ottenuto))));
    bfOrgAtteso[d] = round1(avg(STATE.employees.flatMap(e=>ids.map(id=>(e.soft[id]||{atteso:6}).atteso))));
  });
  body.innerHTML = `
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title-row"><div class="card-title">${UI.softClusterAvgTitle}</div></div>
        <div class="grid grid-2" style="gap:8px;">${clusterAvgs.map(c=>statTileHtml(c.cluster, c.ott, c.att)).join('')}</div>
        <div class="small-note" style="margin-top:10px;">${UI.softClusterAvgNote}</div>
      </div>
      <div class="card">
        <div class="card-title-row"><div class="card-title">${UI.softBigFiveOrgTitle}</div></div>
        <div style="max-width:380px; margin:0 auto;"><canvas id="chart-bigfive-org" height="260"></canvas></div>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-title-row"><div class="card-title">${UI.softWorstSkillsTitle}</div></div>
      <div class="grid grid-3" style="gap:8px;">${orgWorstSoftSkills(8).map(s=>statTileHtml(s.name, s.ottenuto, s.atteso)).join('')}</div>
    </div>
  `;
  renderQueuedStatTileCharts();
  const ctx = document.getElementById('chart-bigfive-org');
  CHART_REGISTRY.bfOrg = new Chart(ctx, { type:'radar', data:{
    labels: BIGFIVE_ORDER.map(d=>BIGFIVE_DIMS[d].label),
    datasets:[
      { label:UI.chartObtained, data: BIGFIVE_ORDER.map(d=>bfOrg[d]), backgroundColor:cssVarRgba('--accent',0.14,'#B4C614'), borderColor:cssVar('--accent')||'#B4C614', pointBackgroundColor:cssVar('--accent')||'#B4C614' },
      { label:UI.chartExpected, data: BIGFIVE_ORDER.map(d=>bfOrgAtteso[d]), backgroundColor:'rgba(0,0,0,0)', borderColor:BRAND_CHART.guide, borderDash:[4,4], pointBackgroundColor:BRAND_CHART.guide, pointRadius:2 },
    ]
  }, options:{ scales:{ r:{ min:0, max:10, ticks:{stepSize:2}, grid:{color:BRAND_CHART.grid}, angleLines:{color:BRAND_CHART.grid}, pointLabels:{font:{size:11}} } }, plugins:{legend:{display:true, position:'bottom', labels:{boxWidth:10, font:{size:11}}}} } });
}

function renderSoftAreaView(body){
  const areas = areasList();
  body.innerHTML = `<div class="grid grid-2">` + areas.map(area => {
    const emps = filterByArea(area);
    const ott = round1(avg(emps.map(e=>computeSoftSummary(e).overallOttenuto)));
    return `<div class="card">
      <div class="card-title-row"><div class="card-title">${esc(area)} <span class="muted">${esc(UI.softAreaEmpCount(emps.length))}</span></div><span class="chip ${semanticChip(ott)}" style="margin-left:auto;"><span class="dt"></span>${fmt1(ott)}</span></div>
      ${emps.map(e=>employeeMiniRow(e, computeSoftSummary(e).overallOttenuto, semanticChip(computeSoftSummary(e).overallOttenuto))).join('')}
    </div>`;
  }).join('') + `</div>`;
}

function renderSoftAlfaView(body){
  const list = [...STATE.employees].sort((a,b)=>a.cognome.localeCompare(b.cognome));
  body.innerHTML = `<div class="card" style="padding:0;"><div class="table-wrap"><table class="dtable">
    <thead><tr><th>${UI.softColLastName}</th><th>${UI.softColFirstName}</th><th>${UI.colArea}</th><th>${UI.colRole}</th><th>${UI.colObtained}</th><th>${UI.colExpected}</th><th>${UI.colGap}</th></tr></thead>
    <tbody>${list.map(e=>{ const s=computeSoftSummary(e); const gi=gapInterpretation(s.gapOverall);
      return `<tr onclick="openDrawer('${e.id}')"><td><b>${esc(e.cognome)}</b></td><td>${esc(e.nome)}</td><td>${esc(e.area)}</td><td>${esc(e.ruolo)}</td><td>${fmt1(s.overallOttenuto)}</td><td>${fmt1(s.overallAtteso)}</td><td><span class="gap-tag ${gi.tag}">${fmt1(s.gapOverall)}</span></td></tr>`;
    }).join('')}</tbody></table></div></div>`;
}

function renderSoftIndividualeView(body){
  if(!SOFT_SELECTED_EMP && STATE.employees.length) SOFT_SELECTED_EMP = STATE.employees[0].id;
  const emp = STATE.employees.find(e=>e.id===SOFT_SELECTED_EMP);
  body.innerHTML = `
    <div class="field" style="max-width:360px; margin-bottom:16px;"><label>${UI.softSelectEmployee}</label>
      <select id="soft-emp-select">${STATE.employees.map(e=>`<option value="${e.id}" ${e.id===SOFT_SELECTED_EMP?'selected':''}>${esc(e.cognome)} ${esc(e.nome)} — ${esc(e.ruolo)}</option>`).join('')}</select>
    </div>
    <div id="soft-individuale-body"></div>
  `;
  document.getElementById('soft-emp-select').addEventListener('change', e => { SOFT_SELECTED_EMP = e.target.value; renderSoftIndividualeBody(); });
  renderSoftIndividualeBody();
}
function renderSoftIndividualeBody(){
  const emp = STATE.employees.find(e=>e.id===SOFT_SELECTED_EMP);
  const target = document.getElementById('soft-individuale-body');
  if(!emp){ target.innerHTML = emptyState(UI.noEmployeesTitle, UI.noEmployeesDesc); return; }
  const ss = computeSoftSummary(emp);
  const bf = computeBigFive(emp);
  const bfAtteso = computeBigFiveExpected(emp);
  target.innerHTML = `
    <div class="grid grid-2" style="margin-bottom:16px;">
      <div class="card">
        <div class="card-title-row"><div class="card-title">${UI.softBigFiveProfile}</div></div>
        <div style="max-width:340px;margin:0 auto;"><canvas id="chart-bf-ind" height="250"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title-row"><div class="card-title">${UI.softSummaryTitle}</div></div>
        <div class="kpi-value">${fmt1(ss.overallOttenuto)}</div>
        <div class="kpi-label">${esc(UI.softOverallScoreLabel(fmt1(ss.overallAtteso)))}</div>
        <div class="divider"></div>
        <div class="grid grid-2" style="gap:8px;">${ss.perCluster.map(c=>statTileHtml(c.cluster, c.ottenuto, c.atteso)).join('')}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title-row"><div class="card-title">${UI.softAllSkillsDetail}</div></div>
      ${SOFT_CLUSTERS.map(c=>`<div class="cluster-block"><div class="cluster-title">${esc(c)}</div>
        <div class="grid grid-3" style="gap:8px;">${ss.perSkill.filter(s=>s.cluster===c).map(s=>statTileHtml(s.name, s.ottenuto, s.atteso)).join('')}</div>
      </div>`).join('')}
    </div>
  `;
  renderQueuedStatTileCharts();
  const ctx = document.getElementById('chart-bf-ind');
  CHART_REGISTRY.bfInd = new Chart(ctx, { type:'radar', data:{
    labels: BIGFIVE_ORDER.map(d=>BIGFIVE_DIMS[d].label),
    datasets:[
      { label:emp.nome+' ('+UI.chartObtained+')', data: BIGFIVE_ORDER.map(d=>bf[d]), backgroundColor:cssVarRgba('--accent',0.14,'#B4C614'), borderColor:cssVar('--accent')||'#B4C614', pointBackgroundColor:cssVar('--accent')||'#B4C614' },
      { label:UI.chartExpected, data: BIGFIVE_ORDER.map(d=>bfAtteso[d]), backgroundColor:'rgba(0,0,0,0)', borderColor:BRAND_CHART.guide, borderDash:[4,4], pointBackgroundColor:BRAND_CHART.guide, pointRadius:2 },
    ]
  }, options:{ scales:{ r:{ min:0, max:10, ticks:{stepSize:2}, grid:{color:BRAND_CHART.grid}, angleLines:{color:BRAND_CHART.grid}, pointLabels:{font:{size:11}} } }, plugins:{legend:{display:true, position:'bottom', labels:{boxWidth:10, font:{size:11}}}} } });
}

function setSoftRankSort(mode){ SOFT_RANK_SORT = mode; renderSoftViewBody(); }
function renderSoftRankingView(body){
  const list = [...STATE.employees].map(e=>{ const ss=computeSoftSummary(e); return {e, s:ss.overallOttenuto, gap:ss.gapOverall}; });
  list.sort((a,b)=> SOFT_RANK_SORT==='gap' ? (b.gap-a.gap) : (b.s-a.s));
  body.innerHTML = `
    <div class="segmented" style="margin-bottom:14px;">
      <button class="${SOFT_RANK_SORT==='score'?'active':''}" onclick="setSoftRankSort('score')">${UI.softSortByScore}</button>
      <button class="${SOFT_RANK_SORT==='gap'?'active':''}" onclick="setSoftRankSort('gap')">${UI.softSortByGap}</button>
    </div>
    <div class="card" style="padding:0;"><div class="table-wrap"><table class="dtable">
    <thead><tr><th>#</th><th>${UI.colEmployee}</th><th>${UI.colArea}</th><th>${UI.colRole}</th><th>${UI.colScore}</th><th>${UI.colGapVsExpected}</th></tr></thead>
    <tbody>${list.map((r,i)=>`<tr onclick="openDrawer('${r.e.id}')"><td>${i+1}</td><td><div style="display:flex;align-items:center;gap:8px;">${avatarHtml(r.e)}<b>${esc(r.e.nome)} ${esc(r.e.cognome)}</b></div></td><td>${esc(r.e.area)}</td><td>${esc(r.e.ruolo)}</td><td><span class="chip ${semanticChip(r.s)}"><span class="dt"></span>${fmt1(r.s)}</span></td><td><span class="gap-tag ${gapInterpretation(r.gap).tag}">${r.gap>0?'+':''}${fmt1(r.gap)}</span></td></tr>`).join('')}</tbody>
  </table></div></div>`;
}

function renderSoftMatchView(body){
  body.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title-row"><div class="card-title">${UI.softSelectUpTo5}</div></div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <select id="soft-match-add" style="padding:8px 12px;border:1px solid var(--border-strong);border-radius:8px;">
          <option value="">${UI.softAddToComparison}</option>
          ${STATE.employees.filter(e=>!SOFT_MATCH.includes(e.id)).map(e=>`<option value="${e.id}">${esc(e.cognome)} ${esc(e.nome)}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
        ${SOFT_MATCH.map(id=>{ const e=STATE.employees.find(x=>x.id===id); if(!e) return ''; return `<span class="chip chip-blue">${esc(e.nome)} ${esc(e.cognome)} <span style="cursor:pointer;margin-left:4px;" onclick="removeSoftMatch('${id}')">✕</span></span>`; }).join('')}
      </div>
    </div>
    ${SOFT_MATCH.length ? renderSoftMatchTable() : emptyState(UI.softNoEmpSelectedTitle, UI.softNoEmpSelectedDesc, 'soft')}
  `;
  document.getElementById('soft-match-add').addEventListener('change', e => { if(e.target.value) addSoftMatch(e.target.value); });
}
function addSoftMatch(id){ if(SOFT_MATCH.length>=5){ toast(UI.toastMaxMatch, 'err'); return; } SOFT_MATCH.push(id); renderSoftViewBody(); }
function removeSoftMatch(id){ SOFT_MATCH = SOFT_MATCH.filter(x=>x!==id); renderSoftViewBody(); }
function renderSoftMatchTable(){
  const emps = SOFT_MATCH.map(id=>STATE.employees.find(e=>e.id===id)).filter(Boolean);
  const overallVals = emps.map(e=>computeSoftSummary(e).overallOttenuto);
  const overallCls = matchCellClasses(overallVals);
  let rows = SOFT_CLUSTERS.map(c => `<tr><td colspan="${emps.length+1}" style="background:var(--surface-alt); font-weight:800; font-size:11px; text-transform:uppercase; letter-spacing:.4px; color:var(--accent-dark);">${esc(c)}</td></tr>` +
    SOFT_SKILLS.filter(s=>s.cluster===c).map(s => {
      const vals = emps.map(e=>(e.soft[s.id]||{ottenuto:0}).ottenuto);
      const cls = matchCellClasses(vals);
      return `<tr><td>${esc(s.name)}</td>${vals.map((v,i)=>`<td class="${cls[i]}">${fmt1(v)}</td>`).join('')}</tr>`;
    }).join('')
  ).join('');
  return `<div class="card match-col" style="padding:0;"><div class="table-wrap"><table class="dtable">
    <thead><tr><th>${UI.colCompetency}</th>${emps.map(e=>`<th>${esc(e.nome)} ${esc(e.cognome[0])}.</th>`).join('')}</tr></thead>
    <tbody>
      <tr style="background:var(--accent-soft);"><td><b>${UI.colOverallScore}</b></td>${overallVals.map((v,i)=>`<td class="${overallCls[i]}"><b>${fmt1(v)}</b></td>`).join('')}</tr>
      ${rows}
    </tbody>
  </table></div>
  <div style="padding:10px 16px; display:flex; gap:16px; flex-wrap:wrap; border-top:1px solid var(--border);">
    <span class="small-note"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--success);margin-right:5px;"></span>${UI.legendHighest}</span>
    <span class="small-note"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--danger);margin-right:5px;"></span>${UI.legendLowest}</span>
    <span class="small-note"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);margin-right:5px;"></span>${UI.legendAligned}</span>
  </div>
  </div>`;
}

/* --- Soft skill evaluation form --- */
function openSoftEvalModal(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  if(!STATE.employees.length){ toast(UI.toastFirstAddEmployee, 'err'); return; }
  const body = `
    <div class="field"><label>${UI.softEvalEmployeeLabel}</label><select id="se-emp">${STATE.employees.map(e=>`<option value="${e.id}">${esc(e.cognome)} ${esc(e.nome)} — ${esc(e.ruolo)}</option>`).join('')}</select></div>
    <div id="se-skills"></div>
  `;
  const foot = `<button class="btn" onclick="closeModal()">${UI.importCancel}</button><button class="btn btn-primary" onclick="submitSoftEval()">${UI.btnSaveEvaluation}</button>`;
  openModal(UI.softEvalModalTitle, UI.softEvalModalSub, body, foot, true);
  document.getElementById('se-emp').addEventListener('change', renderSoftEvalSkills);
  renderSoftEvalSkills();
}
function renderSoftEvalSkills(){
  const empId = document.getElementById('se-emp').value;
  const emp = STATE.employees.find(e=>e.id===empId);
  const el = document.getElementById('se-skills');
  // Decimal obtained/expected inputs (e.g. 6.3) for all 35 soft skills, mirroring the Recruiting
  // Dashboard's VALORE ATTESO input format — replaces the old integer-only obtained slider.
  el.innerHTML = SOFT_CLUSTERS.map(c => `<div class="cluster-block"><div class="cluster-title">${esc(c)}</div>` +
    SOFT_SKILLS.filter(s=>s.cluster===c).map(s => {
      const rec = emp.soft[s.id] || {ottenuto:6, atteso:6};
      return `<div class="score-row">
        <div class="sname" style="flex:1;">${esc(s.name)}</div>
        <div style="display:flex; align-items:center; gap:5px;">
          <label class="small-note" style="font-size:10.5px;">${UI.colObtained}</label>
          <input class="neu-input soft-eval-input" type="number" min="1" max="10" step="0.1" value="${rec.ottenuto}" data-skill="${s.id}" data-field="ottenuto" style="width:66px; padding:6px 8px;">
        </div>
        <div style="display:flex; align-items:center; gap:5px;">
          <label class="small-note" style="font-size:10.5px;">${UI.colExpected}</label>
          <input class="neu-input soft-eval-input" type="number" min="1" max="10" step="0.1" value="${rec.atteso}" data-skill="${s.id}" data-field="atteso" style="width:66px; padding:6px 8px;">
        </div>
      </div>`;
    }).join('') + `</div>`
  ).join('');
}
function submitSoftEval(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const empId = document.getElementById('se-emp').value;
  const emp = STATE.employees.find(e=>e.id===empId);
  document.querySelectorAll('#se-skills input[data-skill]').forEach(inp => {
    const skillId = inp.dataset.skill;
    const field = inp.dataset.field;
    const val = Math.min(10, Math.max(1, round1(parseFloat(inp.value)) || 1));
    if(!emp.soft[skillId]) emp.soft[skillId] = { ottenuto:6, atteso:6 };
    emp.soft[skillId][field] = val;
  });
  // Transversal-competencies "data ultima rilevazione" snapshot: independent of emp.hardHistory
  // (Competenze Professionali) — this is the only place emp.softHistory is written, so a professional
  // assessment can never touch this date and vice versa.
  if(!Array.isArray(emp.softHistory)) emp.softHistory = [];
  const ss = computeSoftSummary(emp);
  emp.softHistory.push({
    module: 'transversal',
    date: new Date().toISOString(),
    source: 'manual',
    overallOttenuto: ss.overallOttenuto,
    overallAtteso: ss.overallAtteso,
  });
  persist();
  closeModal();
  toast(UI.toastSoftEvalSaved, 'ok');
  rerenderCurrentPage();
}


/* ============================= MODULE B — HARD SKILLS (APEX 5D) ============================= */
let HARD_VIEW = 'individuale';
let HARD_SELECTED_EMP = null;
let HARD_MATCH = [];
let HARD_RANK_SORT = 'score';

function evaluatorsList(){ return STATE.evaluators || []; }
function renderEvaluatorsPanel(){
  const el = document.getElementById('hard-evaluators-panel');
  if(!el) return;
  const list = evaluatorsList();
  el.innerHTML = `
    <div class="card-title-row"><div class="card-title">${UI.evaluatorsTitle}</div></div>
    <div class="small-note" style="margin-bottom:10px;">${UI.evaluatorsHint}</div>
    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:${canEdit()?'12px':'0'};">
      ${list.length ? list.map((name,i)=>`<span class="chip chip-gray" style="gap:7px;">${esc(name)}${canEdit()?` <span style="cursor:pointer; font-weight:800;" onclick="removeEvaluatorRow(${i})" title="${UI.removeEvaluator}">✕</span>`:''}</span>`).join('') : `<span class="small-note">${UI.noEvaluators}</span>`}
    </div>
    ${canEdit() ? `<div style="display:flex; gap:8px; align-items:flex-end; flex-wrap:wrap;">
      <div class="field" style="flex:1; min-width:200px; margin-bottom:0;"><label>${UI.newEvaluatorName}</label><input type="text" id="new-evaluator-name" placeholder="${esc(UI.evaluatorNameExamplePh)}"></div>
      <button class="btn btn-sm btn-primary" onclick="addEvaluatorRow()">${ICONS.plus}${UI.addEvaluator}</button>
    </div>` : ''}
  `;
}
function addEvaluatorRow(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const el = document.getElementById('new-evaluator-name');
  const name = el.value.trim();
  if(!name){ toast(UI.toastEnterEvaluatorName, 'err'); return; }
  if(!STATE.evaluators) STATE.evaluators = [];
  if(STATE.evaluators.some(n=>n.toLowerCase()===name.toLowerCase())){ toast(UI.toastEvaluatorExists, 'err'); return; }
  STATE.evaluators.push(name);
  persist();
  renderEvaluatorsPanel();
  toast(UI.toastEvaluatorAdded, 'ok');
}
function removeEvaluatorRow(i){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const list = evaluatorsList();
  if(!confirm(UI.confirmRemoveEvaluator(list[i]))) return;
  STATE.evaluators.splice(i,1);
  persist();
  renderEvaluatorsPanel();
  toast(UI.toastEvaluatorRemoved, 'ok');
}
/* ============================= RESTRICTED EVALUATOR MODE (Section 3) =============================
   Reached only via a ?evalToken= link generated by the Evaluation Manager (see openEvalManagerModal
   below). Takes over the whole page — no sidebar, no nav, no other employees or evaluators ever
   rendered here — so a single assignment is the only thing this screen can ever show or touch. */
function enterRestrictedEvaluatorMode(assignment){
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('eval-restricted-screen').classList.add('open');
  renderRestrictedEvalScreen(assignment);
}
function restrictedEvalBrandHtml(){
  return `<div class="login-brand" style="margin-bottom:28px;">
    <img class="brand-logo theme-logo-light" src="../assets/skillvision-logo-black.png" alt="SkillVision">
    <img class="brand-logo theme-logo-dark" src="../assets/skillvision-logo-white.png" alt="SkillVision">
    <div class="t2">COMPETENCY ASSESSMENT</div>
  </div>`;
}
function renderRestrictedEvalScreen(assignment){
  const el = document.getElementById('eval-restricted-inner');
  if(!assignment){
    el.innerHTML = `${restrictedEvalBrandHtml()}<div class="card"><div class="card-title">${UI.reInvalidLinkTitle}</div><p class="small-note" style="margin-top:8px;">${UI.reInvalidLinkDesc}</p></div>`;
    return;
  }
  const emp = STATE.employees.find(e=>e.id===assignment.targetEmployeeId);
  if(!emp){
    el.innerHTML = `${restrictedEvalBrandHtml()}<div class="card"><div class="card-title">${UI.reInvalidLinkTitle}</div><p class="small-note" style="margin-top:8px;">${UI.reInvalidLinkDesc}</p></div>`;
    return;
  }
  const sourceLabel = APEX_SOURCES.find(s=>s.key===assignment.templateType).label;

  if(assignment.status==='completed'){
    el.innerHTML = `${restrictedEvalBrandHtml()}
      <div class="card" style="text-align:center; padding:40px 24px;">
        <span class="icon-chip success" style="width:44px; height:44px; margin:0 auto 16px auto;">${ICONS.checkSquare}</span>
        <div class="card-title" style="margin-bottom:8px;">${UI.reThankYouTitle}</div>
        <p class="small-note">${UI.reThankYouDesc(assignment.completedAt ? assignment.completedAt.slice(0,10) : '')}</p>
      </div>`;
    return;
  }

  el.innerHTML = `${restrictedEvalBrandHtml()}
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title">${UI.reFormTitle}</div>
      <p class="small-note" style="margin-top:6px;">${UI.reFormDesc(esc(emp.nome+' '+emp.cognome), esc(sourceLabel))}</p>
    </div>
    <div id="re-items"></div>
    <div style="margin-top:16px; text-align:right;">
      <button class="btn btn-primary" onclick="submitRestrictedEval('${assignment.id}')">${UI.reSubmitBtn}</button>
    </div>
  `;
  const itemsEl = document.getElementById('re-items');
  itemsEl.innerHTML = APEX5D_DIMENSIONS.map(dim => `<div class="cluster-block">
      <div class="cluster-title">${esc(UI.hardDimensionPrefix)} ${esc(dim.code)} — ${esc(dim.name)} <span style="text-transform:none; font-weight:500; color:var(--text-3);">· ${esc(dim.desc)}</span></div>
      ${dim.items.map(it => {
        const val = (emp.hard[assignment.templateType]||{})[it.cod] || 6;
        return `<div class="score-row" title="${esc(it.q)}"><div class="sname">${esc(it.cod)} · ${esc(it.area)}</div><input class="sslider" type="range" min="1" max="10" step="1" value="${val}" data-item="${it.cod}" oninput="this.parentElement.querySelector('.sval').textContent=this.value"><div class="sval">${val}</div></div>`;
      }).join('')}
    </div>`).join('');
}
function submitRestrictedEval(assignmentId){
  const assignment = STATE.evalAssignments.find(a=>a.id===assignmentId);
  if(!assignment || assignment.status==='completed') return;
  const emp = STATE.employees.find(e=>e.id===assignment.targetEmployeeId);
  if(!emp) return;
  const source = assignment.templateType;
  if(!emp.hard[source]) emp.hard[source] = {};
  document.querySelectorAll('#re-items input[data-item]').forEach(inp => {
    emp.hard[source][inp.dataset.item] = parseInt(inp.value,10);
  });
  if(!emp.hardEvaluatedBy) emp.hardEvaluatedBy = { resp:'', peer:'', auto:'' };
  emp.hardEvaluatedBy[source] = source==='auto' ? (emp.nome+' '+emp.cognome) : (assignment.evaluatorName||'');
  if(source!=='auto' && assignment.evaluatorName){
    if(!STATE.evaluators) STATE.evaluators = [];
    if(!STATE.evaluators.some(n=>n.toLowerCase()===assignment.evaluatorName.toLowerCase())) STATE.evaluators.push(assignment.evaluatorName);
  }
  // Longitudinal snapshot (Section 3 gap tracking): a per-period record independent of the live
  // emp.hard scores above, so later periods can be diffed against earlier ones per dimension.
  const period = (STATE.evalPeriods||[]).find(p=>p.id===assignment.periodId);
  if(!Array.isArray(emp.hardHistory)) emp.hardHistory = [];
  const hsm = computeHardSummary(emp);
  emp.hardHistory.push({
    module: 'professional',
    periodId: assignment.periodId,
    periodLabel: period ? period.label : '',
    date: new Date().toISOString(),
    source,
    apexScore: hsm.apexScore,
    dims: hsm.dims.map(d=>({code:d.code, name:d.name, score:d.mediaTotale})),
  });

  assignment.status = 'completed';
  assignment.completedAt = new Date().toISOString();
  saveState(STATE, true);
  renderRestrictedEvalScreen(assignment);
}

/* ============================= ADMIN EVALUATION MANAGER (Section 3) ============================= */
function ensureDefaultPeriod(){
  if(!Array.isArray(STATE.evalPeriods) || !STATE.evalPeriods.length){
    STATE.evalPeriods = [{ id: uid('period'), label: UI.reDefaultPeriodLabel, date: new Date().toISOString().slice(0,10) }];
  }
  return STATE.evalPeriods;
}
function buildAssignmentLink(token){
  return location.href.split('?')[0] + '?evalToken=' + token;
}
function openEvalManagerModal(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  ensureDefaultPeriod();
  openModal(UI.evalManagerTitle, UI.evalManagerSub, renderEvalManagerBody(), `<button class="btn" onclick="closeModal()">${UI.btnClose}</button>`, true);
}
function refreshEvalManagerModal(){
  document.getElementById('modal-body').innerHTML = renderEvalManagerBody();
}
function renderEvalManagerBody(){
  const assignments = STATE.evalAssignments || [];
  const sentCount = assignments.length;
  const receivedCount = assignments.filter(a=>a.status==='completed').length;
  const periods = ensureDefaultPeriod();
  return `
    <div class="grid grid-2" style="gap:10px; margin-bottom:16px;">
      <div class="tinted-tile clickable accent" onclick="openAssignmentBreakdownModal()">
        <div style="font-size:11.5px; font-weight:700; color:var(--accent-dark);">${UI.evalSentLabel}</div>
        <div style="font-size:22px; font-weight:800; color:var(--text-1);">${sentCount}</div>
      </div>
      <div class="tinted-tile clickable success" onclick="openAssignmentBreakdownModal()">
        <div style="font-size:11.5px; font-weight:700; color:var(--success);">${UI.evalReceivedLabel}</div>
        <div style="font-size:22px; font-weight:800; color:var(--text-1);">${receivedCount}</div>
      </div>
    </div>

    <div class="divider"></div>
    <div class="card-title" style="margin-bottom:10px;">${UI.evalAssignTitle}</div>
    <div class="field-row">
      <div class="field"><label>${UI.evalTemplateLabel}</label><select id="ea-template" onchange="updateEvalAssignEvaluatorField()">${APEX_SOURCES.map(s=>`<option value="${s.key}">${esc(s.label)}</option>`).join('')}</select></div>
      <div class="field"><label>${UI.evalPeriodLabel}</label><select id="ea-period">${periods.map(p=>`<option value="${p.id}">${esc(p.label)}</option>`).join('')}</select></div>
    </div>
    <div class="field-row" style="align-items:flex-end;">
      <div class="field" style="flex:1;"><label>${UI.evalNewPeriodLabel}</label><input type="text" id="ea-new-period" placeholder="${esc(UI.evalNewPeriodPh)}"></div>
      <button type="button" class="btn btn-sm" onclick="addEvalPeriod()">${ICONS.plus}${UI.evalAddPeriodBtn}</button>
    </div>
    <div class="field-row" id="ea-evaluator-field" style="align-items:flex-end;">
      <div class="field"><label>${UI.evaluatorNameLabel}</label><input type="text" id="ea-evaluator-name" list="dl-evaluators-ea" placeholder="${esc(UI.evaluatorNamePh)}"><datalist id="dl-evaluators-ea">${evaluatorsList().map(n=>`<option value="${esc(n)}">`).join('')}</datalist></div>
      <div class="field"><label>${UI.evaluatorEmailLabel}</label><input type="email" id="ea-evaluator-email" placeholder="${esc(UI.evaluatorEmailPh)}"></div>
    </div>
    <div class="small-note" id="ea-evaluator-self-note" style="display:none; margin-bottom:10px;">${UI.evaluatorSelfNote}</div>
    <div class="field">
      <label>${UI.evalTargetsLabel}</label>
      <div style="max-height:180px; overflow-y:auto; border:1px solid var(--border); border-radius:var(--radius-sm); padding:8px 10px;">
        ${STATE.employees.filter(e=>!e.archived).map(e=>`<div class="checkbox-row" style="gap:8px; padding:3px 0;">${iosCheckboxHtml('ea-target-'+e.id, false, '', null)}<label for="ea-target-${e.id}" style="cursor:pointer;">${esc(e.nome)} ${esc(e.cognome)} — ${esc(e.ruolo)}</label></div>`).join('')}
      </div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="submitCreateAssignments()">${UI.evalCreateBtn}</button>

    <div class="divider"></div>
    <div class="card-title" style="margin-bottom:10px;">${UI.evalAssignmentsListTitle}</div>
    <div class="table-wrap"><table class="dtable">
      <thead><tr><th>${UI.evalColTarget}</th><th>${UI.evalColTemplate}</th><th>${UI.evalColEvaluator}</th><th>${UI.evalColPeriod}</th><th>${UI.evalColStatus}</th><th></th></tr></thead>
      <tbody>${assignments.length ? [...assignments].reverse().map(a=>{
        const targetEmp = STATE.employees.find(e=>e.id===a.targetEmployeeId);
        const src = APEX_SOURCES.find(s=>s.key===a.templateType);
        const period = periods.find(p=>p.id===a.periodId);
        return `<tr>
          <td>${targetEmp ? esc(targetEmp.nome+' '+targetEmp.cognome) : '—'}</td>
          <td>${src?esc(src.label):a.templateType}</td>
          <td>${esc(a.evaluatorName)||'—'}</td>
          <td>${period?esc(period.label):'—'}</td>
          <td><span class="chip ${a.status==='completed'?'chip-green':'chip-gray'}"><span class="dt"></span>${a.status==='completed'?esc(UI.evalStatusCompleted):esc(UI.evalStatusPending)}</span></td>
          <td style="white-space:nowrap;">
            <button class="btn btn-sm" onclick="copyAssignmentLink('${a.id}')">${UI.evalCopyLinkBtn}</button>
            <button class="btn btn-sm" onclick="sendAssignmentEmail('${a.id}')">${UI.evalSendEmailBtn}</button>
            ${a.status!=='completed'?`<button class="btn btn-sm" onclick="markAssignmentCompleted('${a.id}')">${UI.evalMarkDoneBtn}</button>`:''}
            <button class="btn btn-sm btn-danger-outline" onclick="deleteAssignment('${a.id}')">${ICONS.trash}</button>
          </td>
        </tr>`;
      }).join('') : `<tr><td colspan="6"><div class="small-note" style="text-align:center; padding:14px 0;">${UI.evalNoAssignments}</div></td></tr>`}</tbody>
    </table></div>
  `;
}
function updateEvalAssignEvaluatorField(){
  const template = document.getElementById('ea-template').value;
  const field = document.getElementById('ea-evaluator-field');
  const note = document.getElementById('ea-evaluator-self-note');
  if(template==='auto'){ field.style.display='none'; note.style.display=''; }
  else { field.style.display=''; note.style.display='none'; }
}
function addEvalPeriod(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const input = document.getElementById('ea-new-period');
  const label = input.value.trim();
  if(!label){ toast(UI.toastEnterPeriodLabel, 'err'); return; }
  ensureDefaultPeriod().push({ id: uid('period'), label, date: new Date().toISOString().slice(0,10) });
  persist();
  refreshEvalManagerModal();
  toast(UI.toastPeriodAdded, 'ok');
}
function submitCreateAssignments(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const template = document.getElementById('ea-template').value;
  const periodId = document.getElementById('ea-period').value;
  const evaluatorName = document.getElementById('ea-evaluator-name').value.trim();
  const evaluatorEmail = document.getElementById('ea-evaluator-email').value.trim();
  if(template!=='auto' && !evaluatorName){ toast(UI.toastEnterEvaluatorFirst, 'err'); return; }
  const targetIds = STATE.employees.filter(e=>!e.archived).map(e=>e.id).filter(id => {
    const cb = document.getElementById('ea-target-'+id);
    return cb && cb.checked;
  });
  if(!targetIds.length){ toast(UI.toastSelectAtLeastOneTarget, 'err'); return; }
  if(!STATE.evalAssignments) STATE.evalAssignments = [];
  if(template!=='auto' && evaluatorName){
    if(!STATE.evaluators) STATE.evaluators = [];
    if(!STATE.evaluators.some(n=>n.toLowerCase()===evaluatorName.toLowerCase())) STATE.evaluators.push(evaluatorName);
  }
  targetIds.forEach(targetEmployeeId => {
    const emp = STATE.employees.find(e=>e.id===targetEmployeeId);
    STATE.evalAssignments.push({
      id: uid('assign'), templateType: template, targetEmployeeId,
      evaluatorName: template==='auto' ? (emp.nome+' '+emp.cognome) : evaluatorName,
      evaluatorEmail: template==='auto' ? '' : evaluatorEmail,
      periodId, status:'pending', token: uid('tok'),
      createdAt: new Date().toISOString(), completedAt: null,
    });
  });
  persist();
  refreshEvalManagerModal();
  toast(UI.toastAssignmentsCreated(targetIds.length), 'ok');
}
function copyAssignmentLink(id){
  const assignment = STATE.evalAssignments.find(a=>a.id===id);
  if(!assignment) return;
  const link = buildAssignmentLink(assignment.token);
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(link).then(()=>toast(UI.toastLinkCopied, 'ok')).catch(()=>{});
  }
  const body = `
    <p class="small-note" style="margin-bottom:10px;">${UI.evalLinkTrustNote}</p>
    <input type="text" readonly value="${esc(link)}" onclick="this.select()" style="width:100%; padding:9px 11px; border:1px solid var(--border-strong); border-radius:var(--radius-sm); background:var(--surface-alt); font-family:var(--font-mono); font-size:12px;">
  `;
  openModal(UI.evalLinkModalTitle, '', body, `<button class="btn btn-primary" onclick="openEvalManagerModal()">${UI.btnClose}</button>`);
}
function sendAssignmentEmail(id){
  const assignment = STATE.evalAssignments.find(a=>a.id===id);
  if(!assignment) return;
  if(!assignment.evaluatorEmail){ toast(UI.toastNoEvaluatorEmail, 'err'); return; }
  const link = buildAssignmentLink(assignment.token);
  const subject = encodeURIComponent(UI.evalEmailSubject);
  const body = encodeURIComponent(UI.evalEmailBody(assignment.evaluatorName, link));
  window.location.href = `mailto:${encodeURIComponent(assignment.evaluatorEmail)}?subject=${subject}&body=${body}`;
}
function markAssignmentCompleted(id){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const assignment = STATE.evalAssignments.find(a=>a.id===id);
  if(!assignment) return;
  assignment.status = 'completed';
  assignment.completedAt = new Date().toISOString();
  persist();
  refreshEvalManagerModal();
  toast(UI.toastAssignmentMarkedDone, 'ok');
}
function deleteAssignment(id){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  if(!confirm(UI.confirmDeleteAssignment)) return;
  STATE.evalAssignments = STATE.evalAssignments.filter(a=>a.id!==id);
  persist();
  refreshEvalManagerModal();
}
function openAssignmentBreakdownModal(){
  const assignments = STATE.evalAssignments || [];
  const completed = assignments.filter(a=>a.status==='completed');
  const pending = assignments.filter(a=>a.status!=='completed');
  const rowHtml = (a) => {
    const targetEmp = STATE.employees.find(e=>e.id===a.targetEmployeeId);
    const src = APEX_SOURCES.find(s=>s.key===a.templateType);
    return `<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border);">
      <span>${targetEmp?esc(targetEmp.nome+' '+targetEmp.cognome):'—'} <span class="small-note">— ${src?esc(src.label):''}</span></span>
    </div>`;
  };
  const body = `
    <div class="card-eyebrow" style="margin-bottom:6px;">${UI.evalStatusCompleted} (${completed.length})</div>
    ${completed.length ? completed.map(rowHtml).join('') : `<div class="small-note" style="margin-bottom:12px;">${UI.evalNoAssignments}</div>`}
    <div class="card-eyebrow" style="margin-top:16px; margin-bottom:6px;">${UI.evalStatusPending} (${pending.length})</div>
    ${pending.length ? pending.map(rowHtml).join('') : `<div class="small-note">${UI.evalNoAssignments}</div>`}
  `;
  openModal(UI.evalBreakdownTitle, '', body, `<button class="btn" onclick="openEvalManagerModal()">${UI.btnClose}</button>`);
}

function renderHard(){
  const el = document.getElementById('page-hard');
  setTopbarActions(canEdit() ? `<button class="btn btn-sm" onclick="openEvalManagerModal()">${ICONS.userGear}${UI.evalManagerBtn}</button><button class="btn btn-primary" onclick="openHardEvalModal()">${ICONS.plus}${UI.newEvaluation}</button>` : '');
  el.innerHTML = `
    <div class="card" id="hard-evaluators-panel" style="margin-bottom:16px;"></div>
    <div class="view-tabs">
      <div class="view-tab ${HARD_VIEW==='individuale'?'active':''}" onclick="setHardView('individuale')">${UI.softTabIndividuale}</div>
      <div class="view-tab ${HARD_VIEW==='area'?'active':''}" onclick="setHardView('area')">${UI.softTabArea}</div>
      <div class="view-tab ${HARD_VIEW==='ranking'?'active':''}" onclick="setHardView('ranking')">${UI.softTabRanking}</div>
      <div class="view-tab ${HARD_VIEW==='match'?'active':''}" onclick="setHardView('match')">${UI.matchUpTo5}</div>
    </div>
    <div class="small-note" style="margin-bottom:14px;"><b>APEX 5D™ Protocol</b> — SKILL-VISION S.r.l. · ${UI.hardProtocolNote}</div>
    <div id="hard-view-body"></div>
  `;
  renderEvaluatorsPanel();
  renderHardViewBody();
}
function setHardView(v){ HARD_VIEW = v; renderHard(); }
function renderHardViewBody(){
  const body = document.getElementById('hard-view-body');
  destroyCharts();
  if(HARD_VIEW==='individuale') return renderHardIndividualeView(body);
  if(HARD_VIEW==='area') return renderHardAreaView(body);
  if(HARD_VIEW==='ranking') return renderHardRankingView(body);
  if(HARD_VIEW==='match') return renderHardMatchView(body);
}

function renderHardIndividualeView(body){
  if(!HARD_SELECTED_EMP && STATE.employees.length) HARD_SELECTED_EMP = STATE.employees[0].id;
  body.innerHTML = `
    <div class="field" style="max-width:360px; margin-bottom:16px;"><label>${UI.softSelectEmployee}</label>
      <select id="hard-emp-select">${STATE.employees.map(e=>`<option value="${e.id}" ${e.id===HARD_SELECTED_EMP?'selected':''}>${esc(e.cognome)} ${esc(e.nome)} — ${esc(e.ruolo)}</option>`).join('')}</select>
    </div>
    <div id="hard-individuale-body"></div>
  `;
  document.getElementById('hard-emp-select').addEventListener('change', e=>{ HARD_SELECTED_EMP = e.target.value; renderHardIndividualeBody(); });
  renderHardIndividualeBody();
}
function renderHardIndividualeBody(){
  const emp = STATE.employees.find(e=>e.id===HARD_SELECTED_EMP);
  const target = document.getElementById('hard-individuale-body');
  if(!emp){ target.innerHTML = emptyState(UI.noEmployeesTitle, UI.noEmployeesDesc); return; }
  const hsm = computeHardSummary(emp);
  const evalBy = emp.hardEvaluatedBy || {};
  const evalByLine = [
    evalBy.resp ? `${UI.evalByManagerPrefix}: ${esc(evalBy.resp)}` : '',
    evalBy.peer ? `${UI.evalByPeerPrefix}: ${esc(evalBy.peer)}` : '',
    evalBy.auto ? `${UI.evalBySelfPrefix}: ${esc(evalBy.auto)}` : '',
  ].filter(Boolean).join(' · ');
  target.innerHTML = `
    ${evalByLine ? `<div class="small-note" style="margin-bottom:12px;"><b>${UI.evaluatedByPrefix}:</b> ${evalByLine}</div>` : ''}
    <div class="grid grid-2" style="margin-bottom:16px;">
      <div class="card">
        <div class="card-title-row"><div class="card-title">${UI.hardMultiSourceTitle}</div></div>
        <canvas id="chart-hard-bar" height="220"></canvas>
      </div>
      <div class="card">
        <div class="card-title-row"><div class="card-title">${UI.hardApex5dProfile}</div></div>
        <div class="kpi-value">${fmt1(hsm.apexScore)}</div>
        <div class="kpi-label">${UI.hardOverallApexLabel}</div>
        <div class="divider"></div>
        <div class="grid grid-2" style="gap:8px;">${hsm.dims.map(d=>statTileHtml(d.code+' · '+d.name, d.mediaTotale, 6.5)).join('')}</div>
      </div>
    </div>
    <div class="card" style="padding:0; margin-bottom:16px;"><div class="table-wrap"><table class="dtable">
      <thead><tr><th>${UI.hardColDimension}</th><th>${UI.hardColManager}</th><th>${UI.hardColPeer}</th><th>${UI.hardColSelf}</th><th>${UI.hardColOverallAvg}</th><th>${UI.hardColLevel}</th></tr></thead>
      <tbody>${hsm.dims.map(d=>{ const lvl = levelFor(d.mediaTotale); return `<tr><td><b>${esc(d.code)}</b> · ${esc(d.name)}</td><td>${fmt1(d.perSource.resp)}</td><td>${fmt1(d.perSource.peer)}</td><td>${fmt1(d.perSource.auto)}</td><td><b>${fmt1(d.mediaTotale)}</b></td><td><span class="chip" style="background:${lvl.color}22; color:${lvl.color};"><span class="dt" style="background:${lvl.color};"></span>${esc(lvl.label)}</span></td></tr>`; }).join('')}
      <tr style="background:var(--accent-soft);"><td><b>◆ ${UI.hardApexScoreRow}</b></td><td colspan="3"></td><td><b>${fmt1(hsm.apexScore)}</b></td><td></td></tr>
      </tbody>
    </table></div></div>
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title-row"><div class="card-title">${UI.hardGapAnalysisTitle}</div></div>
      <div class="table-wrap"><table class="dtable">
        <thead><tr><th>${UI.colDimension}</th><th>${UI.hardColGapMgrSelf}</th><th>${UI.hardColGapPeerSelf}</th><th>${UI.hardColGapMgrPeer}</th><th>${UI.hardColInterpretation}</th></tr></thead>
        <tbody>${hsm.dims.map(d=>{ const gi=gapInterpretation(d.gapRespAuto); return `<tr><td>${esc(d.code)} · ${esc(d.name)}</td><td>${fmt1(d.gapRespAuto)}</td><td>${fmt1(d.gapPeerAuto)}</td><td>${fmt1(d.gapRespPeer)}</td><td><span class="gap-tag ${gi.tag}">${esc(gi.label)}</span></td></tr>`; }).join('')}</tbody>
      </table></div>
    </div>
    <div class="card" id="hard-longitudinal-card"></div>
  `;
  renderQueuedStatTileCharts();
  renderLongitudinalGapCard(emp);
  const ctx = document.getElementById('chart-hard-bar');
  CHART_REGISTRY.hardBar = new Chart(ctx, { data:{
    labels: hsm.dims.map(d=>d.code),
    datasets:[
      {type:'bar', label:UI.hardColManager, data:hsm.dims.map(d=>d.perSource.resp), backgroundColor:cssVar('--accent')||'#B4C614'},
      {type:'bar', label:UI.hardColPeer, data:hsm.dims.map(d=>d.perSource.peer), backgroundColor:'rgba(171,167,154,0.55)'},
      {type:'bar', label:UI.hardColSelf, data:hsm.dims.map(d=>d.perSource.auto), backgroundColor:cssVar('--warning')||'#E08A0B'},
      {type:'line', label:UI.chartExpected, data:hsm.dims.map(()=>6.5), borderColor:BRAND_CHART.strong, borderDash:[5,4], borderWidth:2, pointRadius:0, fill:false},
    ]
  }, options:{ scales:{ y:{ min:2, max:10, grid:{color:BRAND_CHART.grid} }, x:{ grid:{display:false} } }, plugins:{ legend:{ position:'bottom', labels:{boxWidth:10, font:{size:11}} } } } });
}

/* Longitudinal gap tracking (Section 3): compares two of this employee's hardHistory snapshots
   (one per evaluation period, written by submitRestrictedEval) side by side, per APEX dimension. */
function getEmployeePeriodSnapshots(emp){
  const byPeriod = {};
  (emp.hardHistory||[]).forEach(h => { if(!byPeriod[h.periodId] || h.date > byPeriod[h.periodId].date) byPeriod[h.periodId] = h; });
  return Object.values(byPeriod).sort((a,b)=> a.date.localeCompare(b.date));
}
/* Transversal-competencies equivalent of getEmployeePeriodSnapshots() above, reading emp.softHistory
   (written only by submitSoftEval) instead of emp.hardHistory — kept as a fully separate array/function
   so a professional-competencies assessment can never affect this list or its "latest" date, and vice versa.
   Soft assessments have no evaluation-period concept, so unlike the hard-skills version this returns every
   entry (ascending by date) rather than one per period. */
function getEmployeeSoftHistorySorted(emp){
  return (emp.softHistory||[]).slice().sort((a,b)=> a.date.localeCompare(b.date));
}
let LONGI_PERIOD_A = null, LONGI_PERIOD_B = null;
function deltaTagHtml(delta){
  const color = delta>0?'var(--success)':delta<0?'var(--danger)':'var(--text-3)';
  const arrow = delta>0?'▲':delta<0?'▼':'–';
  return `<span style="color:${color}; font-weight:700;">${arrow} ${fmt1(Math.abs(delta))}</span>`;
}
/* Shared by the Hard Skills page's own Longitudinal card (below) and the employee-profile drawer's
   "Precedenti valutazioni" modal (buildEmployeeProfileHtml / renderPreviousAssessmentsBodyHtml), so
   both period-comparison views read the exact same hardHistory snapshots the exact same way. */
function buildPeriodCompareTableHtml(snapA, snapB){
  const deltaOverall = round1(snapB.apexScore - snapA.apexScore);
  return `<div class="table-wrap"><table class="dtable">
    <thead><tr><th>${UI.colDimension}</th><th>${esc(snapA.periodLabel)}</th><th>${esc(snapB.periodLabel)}</th><th>${UI.longiDeltaCol}</th></tr></thead>
    <tbody>
      ${snapA.dims.map(dA => {
        const dB = snapB.dims.find(d=>d.code===dA.code);
        const delta = dB ? round1(dB.score - dA.score) : null;
        return `<tr><td>${esc(dA.code)} · ${esc(dA.name)}</td><td>${fmt1(dA.score)}</td><td>${dB?fmt1(dB.score):'—'}</td><td>${delta===null?'—':deltaTagHtml(delta)}</td></tr>`;
      }).join('')}
      <tr style="background:var(--accent-soft);"><td><b>◆ ${UI.hardApexScoreRow}</b></td><td><b>${fmt1(snapA.apexScore)}</b></td><td><b>${fmt1(snapB.apexScore)}</b></td><td><b>${deltaTagHtml(deltaOverall)}</b></td></tr>
    </tbody>
  </table></div>`;
}
function renderLongitudinalGapCard(emp){
  const el = document.getElementById('hard-longitudinal-card');
  if(!el) return;
  const snapshots = getEmployeePeriodSnapshots(emp);
  if(snapshots.length < 2){
    el.innerHTML = `<div class="card-title-row"><div class="card-title">${UI.longiTitle}</div></div><div class="small-note">${UI.longiNotEnoughData}</div>`;
    return;
  }
  if(!LONGI_PERIOD_A || !snapshots.some(s=>s.periodId===LONGI_PERIOD_A)) LONGI_PERIOD_A = snapshots[0].periodId;
  if(!LONGI_PERIOD_B || !snapshots.some(s=>s.periodId===LONGI_PERIOD_B)) LONGI_PERIOD_B = snapshots[snapshots.length-1].periodId;
  const snapA = snapshots.find(s=>s.periodId===LONGI_PERIOD_A);
  const snapB = snapshots.find(s=>s.periodId===LONGI_PERIOD_B);
  el.innerHTML = `
    <div class="card-title-row"><div class="card-title">${UI.longiTitle}</div></div>
    <div class="small-note" style="margin-bottom:10px;">${UI.longiDesc}</div>
    <div class="field-row" style="margin-bottom:12px;">
      <div class="field"><label>${UI.longiPeriodA}</label><select id="longi-period-a">${snapshots.map(s=>`<option value="${s.periodId}" ${s.periodId===LONGI_PERIOD_A?'selected':''}>${esc(s.periodLabel||s.periodId)}</option>`).join('')}</select></div>
      <div class="field"><label>${UI.longiPeriodB}</label><select id="longi-period-b">${snapshots.map(s=>`<option value="${s.periodId}" ${s.periodId===LONGI_PERIOD_B?'selected':''}>${esc(s.periodLabel||s.periodId)}</option>`).join('')}</select></div>
    </div>
    ${buildPeriodCompareTableHtml(snapA, snapB)}
  `;
  document.getElementById('longi-period-a').addEventListener('change', e=>{ LONGI_PERIOD_A=e.target.value; renderLongitudinalGapCard(emp); });
  document.getElementById('longi-period-b').addEventListener('change', e=>{ LONGI_PERIOD_B=e.target.value; renderLongitudinalGapCard(emp); });
}

/* ============================= EMPLOYEE PROFILE: "Data ultima rilevazione" + "Precedenti valutazioni" =============================
   Both read the same emp.hardHistory snapshots as the Longitudinal card above (via getEmployeePeriodSnapshots
   and buildPeriodCompareTableHtml) — no second/duplicate result model, no invented dates: if hardHistory is
   empty for this employee, the UI says so plainly instead of fabricating a date. */
let PREV_ASSESS_EMP_ID = null, PREV_ASSESS_PERIOD_A = null, PREV_ASSESS_PERIOD_B = null;
function openPreviousAssessmentsModal(empId){
  const emp = STATE.employees.find(e=>e.id===empId);
  if(!emp) return;
  PREV_ASSESS_EMP_ID = empId;
  PREV_ASSESS_PERIOD_A = null; PREV_ASSESS_PERIOD_B = null;
  openModal(UI.prevAssessModalTitle(emp.nome+' '+emp.cognome), UI.prevAssessModalSub, renderPreviousAssessmentsBodyHtml(emp), `<button class="btn" onclick="closeModal()">${UI.btnClose}</button>`, true);
  attachPreviousAssessmentsListeners();
}
function refreshPreviousAssessmentsModal(){
  const emp = STATE.employees.find(e=>e.id===PREV_ASSESS_EMP_ID);
  if(!emp) return;
  document.getElementById('modal-body').innerHTML = renderPreviousAssessmentsBodyHtml(emp);
  attachPreviousAssessmentsListeners();
}
function attachPreviousAssessmentsListeners(){
  const a = document.getElementById('pa-period-a');
  const b = document.getElementById('pa-period-b');
  if(a) a.addEventListener('change', e=>{ PREV_ASSESS_PERIOD_A=e.target.value; refreshPreviousAssessmentsModal(); });
  if(b) b.addEventListener('change', e=>{ PREV_ASSESS_PERIOD_B=e.target.value; refreshPreviousAssessmentsModal(); });
}
function renderPreviousAssessmentsBodyHtml(emp){
  const snapshots = getEmployeePeriodSnapshots(emp); // ascending by date
  if(snapshots.length < 2) return `<div class="small-note">${esc(UI.longiNotEnoughData)}</div>`;
  const rowsDesc = [...snapshots].reverse();
  const listHtml = `<div class="table-wrap" style="margin-bottom:18px;"><table class="dtable">
    <thead><tr><th>${UI.prevAssessColDate}</th><th>${UI.prevAssessColPeriod}</th><th>${UI.hardApexScoreRow}</th><th>${UI.prevAssessColSource}</th></tr></thead>
    <tbody>${rowsDesc.map((s,i) => `<tr>
      <td>${esc(s.date.slice(0,10))}${i===0?` <span class="chip chip-green"><span class="dt"></span>${esc(UI.prevAssessLatestBadge)}</span>`:''}</td>
      <td>${esc(s.periodLabel||s.periodId)}</td>
      <td><b>${fmt1(s.apexScore)}</b></td>
      <td>${esc(assessmentSourceLabel(s.source))}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;

  if(!PREV_ASSESS_PERIOD_A || !snapshots.some(s=>s.periodId===PREV_ASSESS_PERIOD_A)) PREV_ASSESS_PERIOD_A = snapshots[snapshots.length-2].periodId;
  if(!PREV_ASSESS_PERIOD_B || !snapshots.some(s=>s.periodId===PREV_ASSESS_PERIOD_B)) PREV_ASSESS_PERIOD_B = snapshots[snapshots.length-1].periodId;
  const snapA = snapshots.find(s=>s.periodId===PREV_ASSESS_PERIOD_A);
  const snapB = snapshots.find(s=>s.periodId===PREV_ASSESS_PERIOD_B);
  const compareHtml = `
    <div class="card-title" style="margin-bottom:10px;">${UI.longiTitle}</div>
    <div class="field-row" style="margin-bottom:12px;">
      <div class="field"><label>${UI.longiPeriodA}</label><select id="pa-period-a">${snapshots.map(s=>`<option value="${s.periodId}" ${s.periodId===PREV_ASSESS_PERIOD_A?'selected':''}>${esc(s.periodLabel||s.periodId)} (${esc(s.date.slice(0,10))})</option>`).join('')}</select></div>
      <div class="field"><label>${UI.longiPeriodB}</label><select id="pa-period-b">${snapshots.map(s=>`<option value="${s.periodId}" ${s.periodId===PREV_ASSESS_PERIOD_B?'selected':''}>${esc(s.periodLabel||s.periodId)} (${esc(s.date.slice(0,10))})</option>`).join('')}</select></div>
    </div>
    ${buildPeriodCompareTableHtml(snapA, snapB)}
  `;
  return listHtml + compareHtml;
}

/* ============================= EMPLOYEE PROFILE (Competenze Trasversali): "Data ultima rilevazione" +
   "Precedenti valutazioni" — the transversal-competencies counterpart of the block above. Reads only
   emp.softHistory (via getEmployeeSoftHistorySorted), so this modal can never show a professional-competencies
   date/entry and the modal above can never show a transversal one: the two histories stay on independent
   timelines end-to-end, from data entry (submitSoftEval vs submitHardEval/submitRestrictedEval) to display. */
let PREV_ASSESS_SOFT_EMP_ID = null;
function openPreviousSoftAssessmentsModal(empId){
  const emp = STATE.employees.find(e=>e.id===empId);
  if(!emp) return;
  PREV_ASSESS_SOFT_EMP_ID = empId;
  openModal(UI.prevAssessModalTitleSoft(emp.nome+' '+emp.cognome), UI.prevAssessModalSubSoft, renderPreviousSoftAssessmentsBodyHtml(emp), `<button class="btn" onclick="closeModal()">${UI.btnClose}</button>`, true);
}
function renderPreviousSoftAssessmentsBodyHtml(emp){
  const history = getEmployeeSoftHistorySorted(emp); // ascending by date
  if(history.length < 1) return `<div class="small-note">${esc(UI.profileNoAssessmentYet)}</div>`;
  const rowsDesc = [...history].reverse();
  return `<div class="table-wrap"><table class="dtable">
    <thead><tr><th>${UI.prevAssessColDate}</th><th>${UI.colObtained}</th><th>${UI.colExpected}</th></tr></thead>
    <tbody>${rowsDesc.map((s,i) => `<tr>
      <td>${esc(s.date.slice(0,10))}${i===0?` <span class="chip chip-green"><span class="dt"></span>${esc(UI.prevAssessLatestBadge)}</span>`:''}</td>
      <td><b>${fmt1(s.overallOttenuto)}</b></td>
      <td>${fmt1(s.overallAtteso)}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

/* ============================= "Scarica report" =============================
   No PDF library and no backend exist in this app (pure client-side, localStorage-only — see the
   evalLinkTrustNote and the "Link survey" mailto notes elsewhere in this file for the same constraint).
   buildAssessmentReportPayload() is the actual integration point: a plain data object built entirely from
   functions the app already has (computeHardSummary, computeSoftSummary, getEmployeePeriodSnapshots, the
   role's skillWeights/skillExpected) — nothing new is computed or invented. A future backend/report service
   would receive exactly this payload (e.g. POST it and stream back a designed PDF) instead of what happens
   below, which hands the same data to the browser's own print dialog ("Save as PDF") via a plain, undesigned
   HTML view — genuinely downloadable today, but explicitly NOT the final branded report. */
function buildAssessmentReportPayload(emp){
  const snapshots = getEmployeePeriodSnapshots(emp); // ascending by date — Competenze Professionali only
  const lastSnap = snapshots.length ? snapshots[snapshots.length-1] : null;
  const softHistory = getEmployeeSoftHistorySorted(emp); // ascending by date — Competenze Trasversali only
  const lastSoftSnap = softHistory.length ? softHistory[softHistory.length-1] : null;
  const hsm = computeHardSummary(emp);
  const ss = computeSoftSummary(emp);
  const rp = STATE.roleProfiles[emp.ruolo];
  const weightedIds = rp && rp.skillWeights ? Object.keys(rp.skillWeights) : [];
  const expectedProfile = SOFT_SKILLS.filter(s=>weightedIds.includes(s.id)).map(s => {
    const w = rp.skillWeights[s.id];
    const lvl = SKILL_WEIGHT_LEVELS[w];
    return { id:s.id, name:s.name, weight:w, weightLabel: lvl?UI[lvl.labelKey]:'', expected: rp.skillExpected[s.id] };
  });
  // The headline "current" hard-skills figures prefer the latest hardHistory snapshot (dims/apexScore) over
  // a live recompute, exactly like the profile card above — the two now always agree, and a snapshot-only
  // import (e.g. from a dimension-level external PDF, which doesn't touch item-level emp.hard) is correctly
  // reflected here without fabricating item-level breakdowns.
  const currentHard = lastSnap
    ? { apexScore: lastSnap.apexScore, dims: lastSnap.dims }
    : { apexScore: hsm.apexScore, dims: hsm.dims.map(d=>({code:d.code, name:d.name, score:d.mediaTotale})) };
  return {
    generatedAt: new Date().toISOString(),
    employee: { id: emp.id, nome: emp.nome, cognome: emp.cognome, email: emp.email, ruolo: emp.ruolo, area: emp.area },
    // Two fully independent "data ultima rilevazione" fields — one per module — so neither can ever
    // stand in for the other (a company that bought only one module simply has null on the other).
    hardLastAssessmentDate: lastSnap ? lastSnap.date : null,
    hardLastAssessmentPeriod: lastSnap ? (lastSnap.periodLabel||lastSnap.periodId) : null,
    softLastAssessmentDate: lastSoftSnap ? lastSoftSnap.date : null,
    hardSkills: currentHard,
    softSkills: { overallOttenuto: ss.overallOttenuto, overallAtteso: ss.overallAtteso, expectedProfile },
    hardHistory: snapshots.map(s=>({date:s.date, periodLabel:s.periodLabel||s.periodId, apexScore:s.apexScore, source:s.source})),
    softHistory: softHistory.map(s=>({date:s.date, overallOttenuto:s.overallOttenuto, overallAtteso:s.overallAtteso})),
  };
}
function renderAssessmentReportPrintHtml(payload){
  const e = payload.employee;
  const dimsRows = payload.hardSkills.dims.map(d=>`<tr><td>${esc(d.code)} · ${esc(d.name)}</td><td>${fmt1(d.score)}</td></tr>`).join('');
  const expectedRows = payload.softSkills.expectedProfile.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.weightLabel)}</td><td>${s.expected!=null?fmt1(s.expected):'—'}</td></tr>`).join('');
  const hardHistoryRows = [...payload.hardHistory].reverse().map(h=>`<tr><td>${esc(h.date.slice(0,10))}</td><td>${esc(h.periodLabel)}</td><td>${fmt1(h.apexScore)}</td><td>${esc(assessmentSourceLabel(h.source))}</td></tr>`).join('');
  const softHistoryRows = [...payload.softHistory].reverse().map(h=>`<tr><td>${esc(h.date.slice(0,10))}</td><td>${fmt1(h.overallOttenuto)}</td><td>${fmt1(h.overallAtteso)}</td></tr>`).join('');
  return `
    <div class="rpt-note"><b>${esc(UI.reportTitle)}</b> — ${esc(UI.reportProvisionalNote)}</div>
    <div class="rpt-h1">${esc(e.nome)} ${esc(e.cognome)}</div>
    <div>${esc(e.ruolo)} · ${esc(e.area)}</div>
    <div style="font-size:11px; color:#555; margin-top:2px;">${esc(UI.reportGeneratedOn(payload.generatedAt.slice(0,10)))}</div>

    <div class="rpt-h2">${esc(UI.profileModuleATitle)} — ${esc(UI.profileLastAssessmentLabel)}</div>
    <div>${payload.softLastAssessmentDate ? esc(payload.softLastAssessmentDate.slice(0,10)) : esc(UI.profileNoAssessmentYet)}</div>

    <div class="rpt-h2">${esc(UI.profileModuleBTitle)} — ${esc(UI.profileLastAssessmentLabel)}</div>
    <div>${payload.hardLastAssessmentDate ? esc(payload.hardLastAssessmentDate.slice(0,10)) + (payload.hardLastAssessmentPeriod?` — ${esc(payload.hardLastAssessmentPeriod)}`:'') : esc(UI.profileNoAssessmentYet)}</div>

    <div class="rpt-h2">${esc(UI.profileModuleBTitle)}</div>
    <table class="rpt-table"><thead><tr><th>${UI.colDimension}</th><th>${UI.hardApexScoreRow}</th></tr></thead><tbody>
      ${dimsRows}
      <tr><td><b>${esc(UI.hardApexScoreRow)}</b></td><td><b>${fmt1(payload.hardSkills.apexScore)}</b></td></tr>
    </tbody></table>

    ${expectedRows ? `
    <div class="rpt-h2">${esc(UI.profileRoleExpectedTitle)}</div>
    <table class="rpt-table"><thead><tr><th>${UI.colDimension}</th><th>${esc(UI.rcEssenzialiLabel)}/${esc(UI.rcImportantiLabel)}/${esc(UI.rcUtiliLabel)}</th><th>${esc(UI.rcExpectedLabel)}</th></tr></thead><tbody>${expectedRows}</tbody></table>
    ` : ''}

    ${hardHistoryRows ? `
    <div class="rpt-h2">${esc(UI.reportSectionHistory)} — ${esc(UI.profileModuleBTitle)}</div>
    <table class="rpt-table"><thead><tr><th>${UI.prevAssessColDate}</th><th>${UI.prevAssessColPeriod}</th><th>${UI.hardApexScoreRow}</th><th>${UI.prevAssessColSource}</th></tr></thead><tbody>${hardHistoryRows}</tbody></table>
    ` : ''}

    ${softHistoryRows ? `
    <div class="rpt-h2">${esc(UI.reportSectionHistory)} — ${esc(UI.profileModuleATitle)}</div>
    <table class="rpt-table"><thead><tr><th>${UI.prevAssessColDate}</th><th>${UI.colObtained}</th><th>${UI.colExpected}</th></tr></thead><tbody>${softHistoryRows}</tbody></table>
    ` : ''}
  `;
}
function downloadEmployeeReport(empId){
  const emp = STATE.employees.find(e=>e.id===empId);
  if(!emp) return;
  const payload = buildAssessmentReportPayload(emp);
  if(!payload.hardLastAssessmentDate && !payload.softLastAssessmentDate){ toast(UI.toastNoReportData, 'err'); return; }
  document.getElementById('report-print-container').innerHTML = renderAssessmentReportPrintHtml(payload);
  toast(UI.toastReportOpening, 'ok');
  setTimeout(()=>window.print(), 150);
}

function renderHardAreaView(body){
  const areas = areasList();
  body.innerHTML = `<div class="grid grid-2">` + areas.map(area=>{
    const emps = filterByArea(area);
    const apex = round1(avg(emps.map(e=>computeHardSummary(e).apexScore)));
    return `<div class="card">
      <div class="card-title-row"><div class="card-title">${esc(area)} <span class="muted">${esc(UI.softAreaEmpCount(emps.length))}</span></div><span class="chip ${semanticChip(apex)}" style="margin-left:auto;"><span class="dt"></span>${fmt1(apex)}</span></div>
      <div class="grid grid-2" style="gap:8px;">${APEX5D_DIMENSIONS.map(dim=>{ const v = round1(avg(emps.map(e=>computeHardSummary(e).dims.find(d=>d.code===dim.code).mediaTotale))); return statTileHtml(dim.code+' · '+dim.name, v, 6.5); }).join('')}</div>
    </div>`;
  }).join('') + `</div>`;
  renderQueuedStatTileCharts();
}

function setHardRankSort(mode){ HARD_RANK_SORT = mode; renderHardViewBody(); }
function renderHardRankingView(body){
  const list = [...STATE.employees].map(e=>{ const s=computeHardSummary(e).apexScore; return {e, s, gap: round1(s-6.5)}; });
  list.sort((a,b)=> HARD_RANK_SORT==='gap' ? (b.gap-a.gap) : (b.s-a.s));
  body.innerHTML = `
    <div class="segmented" style="margin-bottom:14px;">
      <button class="${HARD_RANK_SORT==='score'?'active':''}" onclick="setHardRankSort('score')">${UI.softSortByScore}</button>
      <button class="${HARD_RANK_SORT==='gap'?'active':''}" onclick="setHardRankSort('gap')">${UI.softSortByGap}</button>
    </div>
    <div class="card" style="padding:0;"><div class="table-wrap"><table class="dtable">
    <thead><tr><th>#</th><th>${UI.colEmployee}</th><th>${UI.colArea}</th><th>${UI.colRole}</th><th>${UI.hardApexScoreCol}</th><th>${UI.colGapVsExpected}</th></tr></thead>
    <tbody>${list.map((r,i)=>`<tr onclick="openDrawer('${r.e.id}')"><td>${i+1}</td><td><div style="display:flex;align-items:center;gap:8px;">${avatarHtml(r.e)}<b>${esc(r.e.nome)} ${esc(r.e.cognome)}</b></div></td><td>${esc(r.e.area)}</td><td>${esc(r.e.ruolo)}</td><td><span class="chip ${semanticChip(r.s)}"><span class="dt"></span>${fmt1(r.s)}</span></td><td><span class="gap-tag ${gapInterpretation(r.gap).tag}">${r.gap>0?'+':''}${fmt1(r.gap)}</span></td></tr>`).join('')}</tbody>
  </table></div></div>`;
}

function renderHardMatchView(body){
  body.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title-row"><div class="card-title">${UI.softSelectUpTo5}</div></div>
      <select id="hard-match-add" style="padding:8px 12px;border:1px solid var(--border-strong);border-radius:8px;">
        <option value="">${UI.softAddToComparison}</option>
        ${STATE.employees.filter(e=>!HARD_MATCH.includes(e.id)).map(e=>`<option value="${e.id}">${esc(e.cognome)} ${esc(e.nome)}</option>`).join('')}
      </select>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
        ${HARD_MATCH.map(id=>{ const e=STATE.employees.find(x=>x.id===id); if(!e) return ''; return `<span class="chip chip-blue">${esc(e.nome)} ${esc(e.cognome)} <span style="cursor:pointer;margin-left:4px;" onclick="removeHardMatch('${id}')">✕</span></span>`; }).join('')}
      </div>
    </div>
    ${HARD_MATCH.length ? renderHardMatchTable() : emptyState(UI.softNoEmpSelectedTitle, UI.softNoEmpSelectedDesc, 'hard')}
  `;
  document.getElementById('hard-match-add').addEventListener('change', e=>{ if(e.target.value) addHardMatch(e.target.value); });
}
function addHardMatch(id){ if(HARD_MATCH.length>=5){ toast(UI.toastMaxMatch,'err'); return; } HARD_MATCH.push(id); renderHardViewBody(); }
function removeHardMatch(id){ HARD_MATCH = HARD_MATCH.filter(x=>x!==id); renderHardViewBody(); }
function renderHardMatchTable(){
  const emps = HARD_MATCH.map(id=>STATE.employees.find(e=>e.id===id)).filter(Boolean);
  const overallVals = emps.map(e=>computeHardSummary(e).apexScore);
  const overallCls = matchCellClasses(overallVals);
  return `<div class="card" style="padding:0;"><div class="table-wrap"><table class="dtable">
    <thead><tr><th>${UI.colDimension}</th>${emps.map(e=>`<th>${esc(e.nome)} ${esc(e.cognome[0])}.</th>`).join('')}</tr></thead>
    <tbody>
      <tr style="background:var(--accent-soft);"><td><b>${UI.hardApexScoreCol}</b></td>${overallVals.map((v,i)=>`<td class="${overallCls[i]}"><b>${fmt1(v)}</b></td>`).join('')}</tr>
      ${APEX5D_DIMENSIONS.map(dim=>{
        const vals = emps.map(e=>computeHardSummary(e).dims.find(d=>d.code===dim.code).mediaTotale);
        const cls = matchCellClasses(vals);
        return `<tr><td>${esc(dim.code)} · ${esc(dim.name)}</td>${vals.map((v,i)=>`<td class="${cls[i]}">${fmt1(v)}</td>`).join('')}</tr>`;
      }).join('')}
    </tbody>
  </table></div>
  <div style="padding:10px 16px; display:flex; gap:16px; flex-wrap:wrap; border-top:1px solid var(--border);">
    <span class="small-note"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--success);margin-right:5px;"></span>${UI.legendHighest}</span>
    <span class="small-note"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--danger);margin-right:5px;"></span>${UI.legendLowest}</span>
    <span class="small-note"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);margin-right:5px;"></span>${UI.legendAligned}</span>
  </div>
  </div>`;
}

/* --- APEX 5D evaluation form (evaluators/evaluated) --- */
function openHardEvalModal(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  if(!STATE.employees.length){ toast(UI.toastFirstAddEmployee, 'err'); return; }
  const periods = ensureDefaultPeriod();
  const body = `
    <div class="field-row">
      <div class="field"><label>${UI.hardEvaluateeLabel}</label><select id="he-emp">${STATE.employees.map(e=>`<option value="${e.id}">${esc(e.cognome)} ${esc(e.nome)} — ${esc(e.ruolo)}</option>`).join('')}</select></div>
      <div class="field"><label>${UI.hardEvaluatorSourceLabel}</label><select id="he-source">${APEX_SOURCES.map(s=>`<option value="${s.key}">${esc(s.label)}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>${UI.evalPeriodLabel}</label><select id="he-period">${periods.map(p=>`<option value="${p.id}" ${p===periods[periods.length-1]?'selected':''}>${esc(p.label)}</option>`).join('')}</select></div>
    <div class="field" id="he-evaluator-field"><label>${UI.evaluatorNameLabel}</label><input type="text" id="he-evaluator-name" list="dl-evaluators" placeholder="${UI.evaluatorNamePh}"><datalist id="dl-evaluators">${evaluatorsList().map(n=>`<option value="${esc(n)}">`).join('')}</datalist></div>
    <div class="small-note" id="he-evaluator-self-note" style="display:none; margin-bottom:10px;">${UI.evaluatorSelfNote}</div>
    <div class="small-note" style="margin-bottom:10px;">${UI.hardItemsNote}</div>
    <div id="he-items"></div>
  `;
  const foot = `<button class="btn" onclick="closeModal()">${UI.importCancel}</button><button class="btn btn-primary" onclick="submitHardEval()">${UI.btnSaveEvaluation}</button>`;
  openModal(UI.hardEvalModalTitle, UI.hardEvalModalSub, body, foot, true);
  document.getElementById('he-emp').addEventListener('change', ()=>{ renderHardEvalItems(); updateHardEvalEvaluatorField(); });
  document.getElementById('he-source').addEventListener('change', ()=>{ renderHardEvalItems(); updateHardEvalEvaluatorField(); });
  renderHardEvalItems();
  updateHardEvalEvaluatorField();
}
function updateHardEvalEvaluatorField(){
  const empId = document.getElementById('he-emp').value;
  const source = document.getElementById('he-source').value;
  const emp = STATE.employees.find(e=>e.id===empId);
  const field = document.getElementById('he-evaluator-field');
  const note = document.getElementById('he-evaluator-self-note');
  const input = document.getElementById('he-evaluator-name');
  if(source==='auto'){
    field.style.display = 'none';
    note.style.display = '';
    input.value = '';
  } else {
    field.style.display = '';
    note.style.display = 'none';
    input.value = (emp && emp.hardEvaluatedBy && emp.hardEvaluatedBy[source]) || '';
  }
}
function renderHardEvalItems(){
  const empId = document.getElementById('he-emp').value;
  const source = document.getElementById('he-source').value;
  const emp = STATE.employees.find(e=>e.id===empId);
  const el = document.getElementById('he-items');
  el.innerHTML = APEX5D_DIMENSIONS.map(dim => `<div class="cluster-block">
      <div class="cluster-title">${esc(UI.hardDimensionPrefix)} ${esc(dim.code)} — ${esc(dim.name)} <span style="text-transform:none; font-weight:500; color:var(--text-3);">· ${esc(dim.desc)}</span></div>
      ${dim.items.map(it => {
        const val = (emp.hard[source]||{})[it.cod] || 6;
        return `<div class="score-row" title="${esc(it.q)}"><div class="sname">${esc(it.cod)} · ${esc(it.area)}</div><input class="sslider" type="range" min="1" max="10" step="1" value="${val}" data-item="${it.cod}" oninput="this.parentElement.querySelector('.sval').textContent=this.value"><div class="sval">${val}</div><span class="chip chip-gray" style="flex-shrink:0;">${esc(UI.hardExpChip)}</span></div>`;
      }).join('')}
    </div>`).join('');
}
function submitHardEval(){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const empId = document.getElementById('he-emp').value;
  const source = document.getElementById('he-source').value;
  const emp = STATE.employees.find(e=>e.id===empId);
  if(source!=='auto'){
    const evaluatorName = document.getElementById('he-evaluator-name').value.trim();
    if(!evaluatorName){ toast(UI.toastEnterEvaluatorFirst, 'err'); return; }
    if(!STATE.evaluators) STATE.evaluators = [];
    if(!STATE.evaluators.some(n=>n.toLowerCase()===evaluatorName.toLowerCase())) STATE.evaluators.push(evaluatorName);
    if(!emp.hardEvaluatedBy) emp.hardEvaluatedBy = { resp:'', peer:'', auto:'' };
    emp.hardEvaluatedBy[source] = evaluatorName;
  } else {
    if(!emp.hardEvaluatedBy) emp.hardEvaluatedBy = { resp:'', peer:'', auto:'' };
    emp.hardEvaluatedBy.auto = emp.nome + ' ' + emp.cognome;
  }
  if(!emp.hard[source]) emp.hard[source] = {};
  document.querySelectorAll('#he-items input[data-item]').forEach(inp => {
    emp.hard[source][inp.dataset.item] = parseInt(inp.value,10);
  });
  // Longitudinal snapshot (Section 3 gap fix): the direct admin-fill path skipped this, so cycle
  // tracking (renderLongitudinalGapCard) only ever saw evaluations submitted via evaluator links.
  // Mirrors the snapshot submitRestrictedEval() pushes, so both entry paths feed the same history.
  const periodId = document.getElementById('he-period').value;
  const period = (STATE.evalPeriods||[]).find(p=>p.id===periodId);
  if(!Array.isArray(emp.hardHistory)) emp.hardHistory = [];
  const hsm = computeHardSummary(emp);
  emp.hardHistory.push({
    module: 'professional',
    periodId,
    periodLabel: period ? period.label : '',
    date: new Date().toISOString(),
    source,
    apexScore: hsm.apexScore,
    dims: hsm.dims.map(d=>({code:d.code, name:d.name, score:d.mediaTotale})),
  });
  persist();
  closeModal();
  toast(UI.toastHardEvalSaved(APEX_SOURCES.find(s=>s.key===source).label), 'ok');
  rerenderCurrentPage();
  if(DRAWER_EMP_ID===empId) refreshDrawer();
}


/* ============================= OVERALL VALUE (Module A + Module B) ============================= */
/* Five distinct tier colours from the Skill Vision categorical family — lime stays reserved
   for the accent ("the series that counts"), so it is deliberately not one of these.
   top/adeguata are the two chart-categorical hues without a theme-constant CSS var, so they
   switch manually between the brand book's light/dark chart-1 and chart-2 values. */
function tierColors(){
  const isDark = document.documentElement.getAttribute('data-theme')==='dark';
  return { top: isDark?'#D65FB8':'#B0208C', valorizzare:cssVar('--success')||'#3FBF7F', adeguata: isDark?'#2AA5B0':'#0F7A85', sviluppo:cssVar('--warning')||'#E08A0B', critica:cssVar('--danger')||'#EF6B54' };
}

function renderValore(){
  const el = document.getElementById('page-valore');
  const f = getModuleFlags();
  const both = bothActive();

  document.getElementById('page-title').textContent = primaryScoreLabel();
  document.getElementById('page-sub').textContent = both ? UI.valoreSubBoth : (f.A ? UI.valoreSubAOnly : UI.valoreSubBOnly);
  setTopbarActions(`<button class="btn btn-sm" onclick="exportValoreCsv()">${ICONS.download}${UI.valoreExportCsv}</button>`);

  const tiers = classifyPopulation();
  const rows = STATE.employees.map(e => ({
    e, soft: computeSoftSummary(e).overallOttenuto, hard: computeHardSummary(e).apexScore, combined: primaryScore(e), tier: tierFor(primaryScore(e))
  })).sort((a,b)=>b.combined-a.combined);

  const topVizHtml = both
    ? `<div class="card dark-chart-card" style="min-height:480px;"><div class="card-title-row"><div class="card-title">${UI.valoreScatterTitle}</div></div><div class="small-note" style="margin-bottom:4px;">${UI.valoreBubbleSizeNote}</div><div style="position:relative; height:420px;"><canvas id="chart-scatter"></canvas></div></div>`
    : `<div class="card" style="min-height:480px;"><div class="card-title-row"><div class="card-title">${UI.valoreTierDistTitle}</div></div><div style="position:relative; height:420px;"><canvas id="chart-tierdist"></canvas></div></div>`;

  el.innerHTML = `
    ${both ? '' : `<div class="small-note" style="margin-bottom:14px; padding:10px 12px; background:var(--warning-soft); border:1px solid #F0D6A6; border-radius:var(--radius-sm);">${UI.valoreOnlyModuleNote(f.A?UI.valoreModuleALabel:UI.valoreModuleBLabel)}</div>`}
    <div class="valore-top-grid" style="margin-bottom:16px;">
      <div class="card">
        <div class="card-title-row"><div class="card-title" style="font-size:13px;">${UI.valoreClassificationTitle}</div></div>
        <div class="tier-list">
          ${TIER_DEFS.map(t => `<div class="tier-row" style="padding:8px 10px;"><span class="dt" style="width:8px;height:8px;border-radius:50%;background:${tierColors()[t.key]};display:inline-block;"></span><div class="tname" style="font-size:11.5px;">${esc(t.label)}</div><div class="tcount" style="font-size:13px; color:${tierColors()[t.key]};">${tiers[t.key].length}</div></div>`).join('')}
        </div>
        <div class="small-note" style="margin-top:12px;">${UI.valoreIndexNote(both ? UI.valoreIndexBoth : (f.A ? UI.valoreIndexAOnly : UI.valoreIndexBOnly))}</div>
      </div>
      ${topVizHtml}
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-title">${UI.valoreMatrixTitle} <span class="muted">${UI.valoreMatrixSub}</span></div>
      <div class="grid grid-5" style="gap:10px; margin-top:14px; align-items:start;">
        ${TIER_DEFS.map(t => `
          <div style="background:var(--surface-alt); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; min-height:0;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
              <span style="width:9px;height:9px;border-radius:50%;background:${tierColors()[t.key]};display:inline-block; flex-shrink:0;"></span>
              <span style="font-size:11px; font-weight:800; color:${tierColors()[t.key]};">${esc(t.label)}</span>
              <span class="small-note" style="margin-left:auto;">${tiers[t.key].length}</span>
            </div>
            <div style="max-height:260px; overflow-y:auto;">
              ${tiers[t.key].length ? tiers[t.key].map(e=>employeeMiniRow(e, primaryScore(e), semanticChip(primaryScore(e)))).join('') : `<div class="small-note" style="text-align:center; padding:14px 0;">${UI.noEmployeesTitle}</div>`}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card" style="padding:0;">
      <div class="card-title-row" style="padding:16px 20px 0 20px;"><div class="card-title">${UI.valoreByEmployeeTitle}</div></div>
      <div class="table-wrap"><table class="dtable">
        <thead><tr><th>#</th><th>${UI.colEmployee}</th><th>${UI.colArea}</th><th>${UI.colRole}</th>${both?`<th>${UI.colSoftA}</th><th>${UI.colHardB}</th><th>${UI.colCombined}</th>`:`<th>${esc(primaryScoreLabel())}</th>`}<th>${UI.colClassification}</th></tr></thead>
        <tbody>${rows.map((r,i)=>`<tr onclick="openDrawer('${r.e.id}')"><td>${i+1}</td><td><div style="display:flex;align-items:center;gap:8px;">${avatarHtml(r.e)}<b>${esc(r.e.nome)} ${esc(r.e.cognome)}</b></div></td><td>${esc(r.e.area)}</td><td>${esc(r.e.ruolo)}</td>${both?`<td>${fmt1(r.soft)}</td><td>${fmt1(r.hard)}</td><td><b>${fmt1(r.combined)}</b></td>`:`<td><b>${fmt1(r.combined)}</b></td>`}<td><span class="chip ${r.tier.chip}"><span class="dt"></span>${esc(r.tier.label)}</span></td></tr>`).join('')}</tbody>
      </table></div>
    </div>
  `;

  if(both){
    const ctx = document.getElementById('chart-scatter');
    // Chart backdrop follows the card, which itself tracks the app theme (see .dark-chart-card
    // override in css/style.css) — so the canvas's own text/grid colors must track data-theme too,
    // instead of being pinned to the dark-mode-only pale values this chart used to hardcode.
    const isDarkChart = document.documentElement.getAttribute('data-theme')==='dark';
    const chartMuted = isDarkChart ? '#7C8496' : '#767369';
    const chartGrid = isDarkChart ? 'rgba(231,234,242,0.18)' : 'rgba(43,41,38,0.12)';
    // Ranked Overall Value line: employees ordered by combined score (rows is already sorted
    // desc), one point per person on a connecting line, colored by tier, with the score value
    // labeled above each point.
    const ringColor = isDarkChart ? '#2B2926' : '#F8F9FA'; // matches .dark-chart-card's own background per theme, so markers read as a "cut out" ring rather than a hard edge
    CHART_REGISTRY.scatter = new Chart(ctx, { type:'line', data:{
      labels: rows.map((r,i)=>String(i+1)),
      datasets:[{
        data: rows.map(r=>r.combined),
        borderColor: BRAND_CHART.lime(),
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBorderWidth: 2,
        pointBorderColor: ringColor,
        pointBackgroundColor: rows.map(r=>tierColors()[r.tier.key]),
      }]
    }, options:{
      maintainAspectRatio:false,
      layout:{ padding:{ top:18 } },
      scales:{
        x:{ title:{display:true, text:UI.valoreAxisHard, font:{size:11}, color:chartMuted},
            ticks:{color:chartMuted, autoSkip:true, maxTicksLimit:12, maxRotation:0}, grid:{display:false}, border:{color:chartGrid} },
        y:{ min:0, max:10, title:{display:true, text:UI.valoreAxisSoft, font:{size:11}, color:chartMuted},
            ticks:{color:chartMuted}, grid:{color:chartGrid, borderDash:[2,3]}, border:{color:chartGrid} },
      },
      plugins:{ legend:{display:false},
        tooltip:{ callbacks:{ label:(ctx)=>{ const r=rows[ctx.dataIndex]; const p=r.e; return p.nome+' '+p.cognome+' — '+r.tier.label+' · '+fmt1(r.combined)+' (A:'+fmt1(r.soft)+' B:'+fmt1(r.hard)+')' + (p.ral?' · RAL '+fmtCurrency(p.ral):''); } } } },
      onClick:(evt,elements)=>{ if(elements.length){ openDrawer(rows[elements[0].index].e.id); } }
    }, plugins:[{
      id:'valueLabels',
      afterDatasetsDraw(chart){
        const meta = chart.getDatasetMeta(0);
        const data = chart.data.datasets[0].data;
        const c = chart.ctx;
        c.save();
        c.font = '600 10px Geist, -apple-system, sans-serif';
        c.fillStyle = chartMuted;
        c.textAlign = 'center';
        meta.data.forEach((point, i) => { c.fillText(fmt1(data[i]), point.x, point.y - 12); });
        c.restore();
      }
    }] });
  } else {
    const ctx = document.getElementById('chart-tierdist');
    CHART_REGISTRY.scatter = new Chart(ctx, { type:'bar', data:{
      labels: TIER_DEFS.map(t=>t.label),
      datasets:[{ data: TIER_DEFS.map(t=>tiers[t.key].length), backgroundColor: TIER_DEFS.map(t=>tierColors()[t.key]), borderRadius:6 }]
    }, options:{ maintainAspectRatio:false, indexAxis:'y', scales:{ x:{ beginAtZero:true, ticks:{precision:0}, grid:{color:BRAND_CHART.grid} }, y:{ grid:{display:false} } }, plugins:{ legend:{display:false} } } });
  }
}
function exportValoreCsv(){
  const rows = STATE.employees.map(e => ({ e, soft: computeSoftSummary(e).overallOttenuto, hard: computeHardSummary(e).apexScore, combined: primaryScore(e), tier: tierFor(primaryScore(e)) }));
  let csv = UI.csvHeaderValore + '\n';
  rows.forEach(r => { csv += [r.e.cognome, r.e.nome, r.e.area, r.e.ruolo, fmt1(r.soft), fmt1(r.hard), fmt1(r.combined), r.tier.label].join(';') + '\n'; });
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='overall_value.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ============================= LOGICA CUSTOMER CARE ============================= */
/* Self-contained analytics module. The ticket/CSAT operating figures are deterministic
   demo data (a seeded PRNG keyed on the agent id, so values stay stable across
   re-renders and reloads); the competency columns are read from each agent's real
   Soft Skills scores. Same view-tab + destroyCharts() lifecycle as renderSoft()/renderHard(). */
let CC_VIEW = 'overview';
const CC_COMPETENCY_IDS = ['so2','so3','in1','ps8','ps2']; // Customer Care competency set (Customer Experience, Customer Orientation, Communication, Emotional Intelligence, Self-Control)

function ccHashId(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function ccCompetencyName(id){
  const s = SOFT_SKILLS.find(x => x.id === id);
  return s ? s.name : id;
}
function ccGapTag(obtained, expected){
  const g = obtained - expected;
  if(g >= -0.3) return 'gap-ok';
  if(g >= -1.5) return 'gap-warn';
  return 'gap-bad';
}
function ccChipClass(obtained, expected){
  const t = ccGapTag(obtained, expected);
  return t === 'gap-ok' ? 'chip-green' : (t === 'gap-warn' ? 'chip-amber' : 'chip-red');
}
function ccDeltaBadge(cur, prev, opts={}){
  const d = round1(cur - prev);
  const cls = Math.abs(d) < (opts.eps || 0.05) ? 'flat' : ((opts.lowerIsBetter ? d < 0 : d > 0) ? 'up' : 'down');
  const arrow = cls === 'flat' ? '→' : (d > 0 ? '▲' : '▼');
  const mag = Math.abs(d).toFixed(opts.dec == null ? 1 : opts.dec) + (opts.unit || '');
  return `<div class="kpi-delta ${cls}">${arrow} ${mag} ${esc(opts.label || UI.ccDeltaVsPrev)}</div>`;
}
/* Skill Vision brand palette for the Customer Care canvas charts. The charts can't read the
   :has()-scoped CSS tokens (cssVar() resolves against :root), so the brand colours are set here.
   The page surface is always Neutral-950, so text/grid stay light-on-dark regardless of app
   theme; only the lime shade flips — Accent-400 (#DDEE1C) in dark mode, Accent-500 (#B4C614) in light. */
function ccChartTheme(){
  return {
    accent:     BRAND_CHART.lime(),
    accentSoft: BRAND_CHART.limeSoft,
    neutralBar: 'rgba(171,167,154,0.5)',
    guide:      BRAND_CHART.guide,
    grid:       BRAND_CHART.grid,
    muted:      BRAND_CHART.text,
    text:       BRAND_CHART.strong,
  };
}

/* Builds the full model consumed by every Customer Care sub-view. */
function customerCareModel(){
  let agents = STATE.employees.filter(e => e.area === 'Customer Service');
  if(agents.length < 2) agents = [...STATE.employees].slice(0, 6);
  agents = [...agents].sort((a,b) => a.cognome.localeCompare(b.cognome));

  const rows = agents.map(a => {
    const r = seedRandom(ccHashId(a.id));
    const tickets    = Math.round(60 + r() * 170);
    const frt        = round1(6 + r() * 30);
    const frtPrev    = round1(clamp(frt + (r() * 8 - 3.2), 4, 48));
    const csat       = Math.round(clamp(78 + r() * 20, 60, 100));
    const csatPrev   = Math.round(clamp(csat + (r() * 10 - 5.5), 60, 100));
    const resolution = Math.round(clamp(84 + r() * 14, 70, 100));
    const comps = CC_COMPETENCY_IDS.map(id => {
      const s = (a.soft && a.soft[id]) || { ottenuto: round1(5 + r() * 3.4), atteso: 7 };
      return { id, ottenuto: round1(s.ottenuto || 0), atteso: round1(s.atteso || 7) };
    });
    const compOtt = round1(avg(comps.map(c => c.ottenuto)));
    const compAtt = round1(avg(comps.map(c => c.atteso)));
    const matchPct = Math.round(clamp(compAtt ? compOtt / compAtt * 100 : 0, 0, 145));
    return { emp:a, tickets, frt, frtPrev, csat, csatPrev, resolution, comps, compOtt, compAtt, matchPct };
  });

  const org = {
    frt:      round1(avg(rows.map(r => r.frt))),
    frtPrev:  round1(avg(rows.map(r => r.frtPrev))),
    csat:     round1(avg(rows.map(r => r.csat))),
    csatPrev: round1(avg(rows.map(r => r.csatPrev))),
    volume:   rows.reduce((s, r) => s + r.tickets, 0),
    match:    round1(avg(rows.map(r => r.matchPct))),
  };

  // 8-week CSAT / resolved-tickets trend (seeded, independent of agent order)
  const tr = seedRandom(ccHashId('cc-trend-v1'));
  const weeks = [], csatSeries = [], resolvedSeries = [];
  let csatWalk = org.csat - 3.5;
  const weeklyBase = org.volume / 4;
  for(let i = 0; i < 8; i++){
    weeks.push(`${UI.ccWeekPrefix} ${i + 1}`);
    csatWalk = clamp(csatWalk + (tr() * 2.6 - 1.0), 70, 99);
    csatSeries.push(round1(csatWalk));
    resolvedSeries.push(Math.round(weeklyBase * (0.82 + tr() * 0.3)));
  }

  return { rows, org, weeks, csatSeries, resolvedSeries };
}

function renderCustomerCare(){
  const el = document.getElementById('page-customercare');
  const model = customerCareModel();
  setTopbarActions(`<button class="btn btn-sm" onclick="exportCustomerCareCsv()">${ICONS.download}${UI.ccExportCsv}</button>`);
  el.innerHTML = `
    <div class="section-head">
      <div>
        <div class="card-eyebrow">${UI.ccEyebrow}</div>
        <h2>${UI.ccPageTitle}</h2>
        <p>${UI.ccPageSub}</p>
      </div>
    </div>
    <div class="view-tabs">
      <div class="view-tab ${CC_VIEW==='overview'?'active':''}" onclick="setCustomerCareView('overview')">${UI.ccTabOverview}</div>
      <div class="view-tab ${CC_VIEW==='agents'?'active':''}" onclick="setCustomerCareView('agents')">${UI.ccTabAgents}</div>
      <div class="view-tab ${CC_VIEW==='matrix'?'active':''}" onclick="setCustomerCareView('matrix')">${UI.ccTabMatrix}</div>
    </div>
    <div class="small-note" style="margin-bottom:14px;">${UI.ccDemoNote}</div>
    <div id="cc-view-body"></div>
  `;
  renderCustomerCareViewBody(model);
}
function setCustomerCareView(v){ CC_VIEW = v; renderCustomerCare(); }

function renderCustomerCareViewBody(model){
  model = model || customerCareModel();
  const body = document.getElementById('cc-view-body');
  destroyCharts();
  if(!model.rows.length){ body.innerHTML = emptyState(UI.ccNoAgentsTitle, UI.ccNoAgentsDesc, 'headset'); return; }
  if(CC_VIEW==='overview') return renderCustomerCareOverview(body, model);
  if(CC_VIEW==='agents')   return renderCustomerCareAgents(body, model);
  if(CC_VIEW==='matrix')   return renderCustomerCareMatrix(body, model);
}

function renderCustomerCareOverview(body, model){
  const o = model.org;
  body.innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px;">
      <div class="card">
        <div class="card-eyebrow">${UI.ccKpiFrt}</div>
        <div class="kpi-value">${fmt1(o.frt)}<span style="font-size:14px; font-weight:700; color:var(--text-3);">${UI.ccUnitMin}</span></div>
        <div class="kpi-label">${UI.ccKpiFrtSub}</div>
        ${ccDeltaBadge(o.frt, o.frtPrev, { lowerIsBetter:true, unit:UI.ccUnitMin })}
      </div>
      <div class="card">
        <div class="card-eyebrow">${UI.ccKpiCsat}</div>
        <div class="kpi-value">${Math.round(o.csat)}<span style="font-size:14px; font-weight:700; color:var(--text-3);">%</span></div>
        <div class="kpi-label">${UI.ccKpiCsatSub}</div>
        ${ccDeltaBadge(o.csat, o.csatPrev, { unit:'%', dec:0 })}
      </div>
      <div class="card">
        <div class="card-eyebrow">${UI.ccKpiVolume}</div>
        <div class="kpi-value">${o.volume.toLocaleString('it-IT')}</div>
        <div class="kpi-label">${UI.ccKpiVolumeSub}</div>
        <div class="kpi-delta flat">${model.rows.length} agent</div>
      </div>
      <div class="card">
        <div class="card-eyebrow">${UI.ccKpiMatch}</div>
        <div class="kpi-value">${Math.round(o.match)}<span style="font-size:14px; font-weight:700; color:var(--text-3);">%</span></div>
        <div class="kpi-label">${UI.ccKpiMatchSub}</div>
        ${ccDeltaBadge(o.match, 100, { unit:'%', dec:0, label:UI.ccDeltaVsTarget })}
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-title-row"><div class="card-title">${UI.ccTrendTitle}</div></div>
      <div style="position:relative; height:320px;"><canvas id="chart-cc-trend"></canvas></div>
    </div>

    <div class="card" style="padding:0;">
      <div class="card-title-row" style="padding:16px 20px 0 20px;"><div class="card-title">${UI.ccAgentTableTitle}</div></div>
      <div class="table-wrap"><table class="dtable">
        <thead><tr><th>#</th><th>${UI.ccColAgent}</th><th>${UI.colRole}</th><th>${UI.ccColTickets}</th><th>${UI.ccColFrt}</th><th>${UI.ccColCsat}</th><th>${UI.ccColResolution}</th><th>${UI.ccColMatch}</th></tr></thead>
        <tbody>${model.rows.map((r,i)=>`
          <tr onclick="openDrawer('${r.emp.id}')">
            <td>${i+1}</td>
            <td><div style="display:flex;align-items:center;gap:8px;">${avatarHtml(r.emp)}<b>${esc(r.emp.nome)} ${esc(r.emp.cognome)}</b></div></td>
            <td>${esc(r.emp.ruolo)}</td>
            <td>${r.tickets}</td>
            <td>${fmt1(r.frt)}${UI.ccUnitMin}</td>
            <td><span class="chip ${semanticChip(r.csat, {good:90, mid:80})}"><span class="dt"></span>${Math.round(r.csat)}%</span></td>
            <td>${Math.round(r.resolution)}%</td>
            <td><span class="gap-tag ${ccGapTag(r.compOtt, r.compAtt)}">${r.matchPct}%</span></td>
          </tr>`).join('')}</tbody>
      </table></div>
    </div>
  `;

  const ctx = document.getElementById('chart-cc-trend');
  const cc = ccChartTheme();
  CHART_REGISTRY.ccTrend = new Chart(ctx, {
    data:{
      labels: model.weeks,
      datasets:[
        { type:'line', label:UI.ccTrendCsat, data:model.csatSeries, yAxisID:'y', borderColor:cc.accent, backgroundColor:cc.accentSoft, pointBackgroundColor:cc.accent, borderWidth:2, tension:0.3, fill:true, pointRadius:3 },
        { type:'bar', label:UI.ccTrendResolved, data:model.resolvedSeries, yAxisID:'y1', backgroundColor:cc.neutralBar, borderRadius:6, maxBarThickness:34 },
      ]
    },
    options:{
      maintainAspectRatio:false,
      scales:{
        y:{ position:'left', min:60, max:100, title:{display:true, text:UI.ccTrendCsat, font:{size:11}, color:cc.muted}, ticks:{color:cc.muted}, grid:{color:cc.grid} },
        y1:{ position:'right', beginAtZero:true, title:{display:true, text:UI.ccTrendResolved, font:{size:11}, color:cc.muted}, ticks:{color:cc.muted}, grid:{display:false} },
        x:{ ticks:{color:cc.muted}, grid:{display:false} },
      },
      plugins:{ legend:{ position:'bottom', labels:{boxWidth:10, font:{size:11}, color:cc.text} } }
    }
  });
}

function renderCustomerCareAgents(body, model){
  const compNames = CC_COMPETENCY_IDS.map(ccCompetencyName);
  body.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title-row"><div class="card-title">${UI.ccAgentsChartTitle}</div></div>
      <div style="position:relative; height:${Math.max(220, model.rows.length*38)}px;"><canvas id="chart-cc-agents"></canvas></div>
    </div>
    <div class="card" style="padding:0;">
      <div class="card-title-row" style="padding:16px 20px 0 20px;"><div class="card-title">${UI.ccTabAgents} <span class="muted">${esc(UI.ccMatrixSub)}</span></div></div>
      <div class="table-wrap"><table class="dtable">
        <thead><tr><th>${UI.ccColAgent}</th><th>${UI.colRole}</th>${compNames.map(n=>`<th>${esc(n)}</th>`).join('')}<th>${UI.ccColOverall}</th></tr></thead>
        <tbody>${model.rows.map(r=>`
          <tr onclick="openDrawer('${r.emp.id}')">
            <td><div style="display:flex;align-items:center;gap:8px;">${avatarHtml(r.emp)}<b>${esc(r.emp.nome)} ${esc(r.emp.cognome)}</b></div></td>
            <td>${esc(r.emp.ruolo)}</td>
            ${r.comps.map(c=>`<td><span class="gap-tag ${ccGapTag(c.ottenuto, c.atteso)}">${fmt1(c.ottenuto)}</span></td>`).join('')}
            <td><span class="chip ${semanticChip(r.compOtt)}"><span class="dt"></span>${fmt1(r.compOtt)}</span></td>
          </tr>`).join('')}</tbody>
      </table></div>
    </div>
  `;

  const ctx = document.getElementById('chart-cc-agents');
  const cc = ccChartTheme();
  CHART_REGISTRY.ccAgents = new Chart(ctx, {
    type:'bar',
    data:{
      labels: model.rows.map(r => r.emp.cognome + ' ' + (r.emp.nome||' ')[0] + '.'),
      datasets:[
        { label:UI.chartObtained, data:model.rows.map(r=>r.compOtt), backgroundColor:cc.accent, borderRadius:6 },
        { type:'line', label:UI.chartExpected, data:model.rows.map(r=>r.compAtt), backgroundColor:'rgba(0,0,0,0)', borderColor:cc.guide, borderWidth:1.5, borderDash:[4,4], pointRadius:0 },
      ]
    },
    options:{ maintainAspectRatio:false, indexAxis:'y', scales:{ x:{ min:0, max:10, ticks:{color:cc.muted}, grid:{color:cc.grid} }, y:{ ticks:{color:cc.muted}, grid:{display:false} } }, plugins:{ legend:{ position:'bottom', labels:{boxWidth:10, font:{size:11}, color:cc.text} } } }
  });
}

function renderCustomerCareMatrix(body, model){
  const cards = CC_COMPETENCY_IDS.map(id => {
    const scored = model.rows.map(r => {
      const c = r.comps.find(x => x.id === id);
      return { emp:r.emp, ott:c.ottenuto, att:c.atteso };
    }).sort((a,b) => b.ott - a.ott);
    const ott = round1(avg(scored.map(s => s.ott)));
    const att = round1(avg(scored.map(s => s.att)));
    const strong = scored.filter(s => s.ott >= 8).length;
    const weak = scored.filter(s => s.ott < 6).length;
    return `<div class="card">
      <div class="card-title-row"><div class="card-title">${esc(ccCompetencyName(id))}</div><span class="chip ${semanticChip(ott)}" style="margin-left:auto;"><span class="dt"></span>${fmt1(ott)}</span></div>
      <div class="legend-row" style="margin-bottom:8px;">
        <span class="legend-dot"><i style="background:var(--success);"></i>${esc(UI.ccMatrixStrong)}: ${strong}</span>
        <span class="legend-dot"><i style="background:var(--danger);"></i>${esc(UI.ccMatrixToDevelop)}: ${weak}</span>
        <span class="legend-dot" style="margin-left:auto;">${UI.ccMatrixColOrgAvg}: <b>${fmt1(ott)}</b> / ${fmt1(att)}</span>
      </div>
      ${scored.map(s => employeeMiniRow(s.emp, s.ott, ccChipClass(s.ott, s.att))).join('')}
    </div>`;
  }).join('');

  body.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title">${UI.ccMatrixTitle} <span class="muted">${esc(UI.ccMatrixSub)}</span></div>
      <div class="small-note" style="margin-top:6px;">${UI.ccMatrixNote}</div>
    </div>
    <div class="grid grid-2">${cards}</div>
  `;
}

function exportCustomerCareCsv(){
  const model = customerCareModel();
  const head = ['Agent','Ruolo','Ticket','FRT_min','CSAT_%','Resolution_%','Match_%', ...CC_COMPETENCY_IDS.map(ccCompetencyName)];
  let csv = head.join(';') + '\n';
  model.rows.forEach(r => {
    csv += [r.emp.cognome + ' ' + r.emp.nome, r.emp.ruolo, r.tickets, fmt1(r.frt), Math.round(r.csat), Math.round(r.resolution), r.matchPct, ...r.comps.map(c => fmt1(c.ottenuto))].join(';') + '\n';
  });
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='customer_care_logic.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ============================= FEEDBACK & DEVELOPMENT PLAN ============================= */
function renderFeedback(){
  const el = document.getElementById('page-feedback');
  const list = [...STATE.employees].sort((a,b)=> (b.feedbackNeeded - a.feedbackNeeded) || (a.cognome.localeCompare(b.cognome)));
  el.innerHTML = `
    <div class="section-head"><div><h2>${UI.feedbackPageTitle}</h2><p>${UI.feedbackPageSub}</p></div></div>
    <div class="grid grid-2">
      ${list.map(e => `<div class="card">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
          ${avatarHtml(e,36)}
          <div style="flex:1;"><div style="font-weight:800;font-size:13.5px;">${esc(e.nome)} ${esc(e.cognome)}</div><div style="font-size:11.5px;color:var(--text-3);">${esc(e.ruolo)} · ${esc(e.area)}</div></div>
          <span class="chip ${tierFor(primaryScore(e)).chip}"><span class="dt"></span>${fmt1(primaryScore(e))}</span>
        </div>
        ${feedbackSwitchHtml('fb-need-'+e.id, e.feedbackNeeded)}
        ${devPlanFieldsHtml('fb-'+e.id, e.developmentPlan)}
        <button class="btn btn-sm btn-primary" onclick="saveFeedbackRow('${e.id}')">${UI.btnSave}</button>
      </div>`).join('')}
    </div>
  `;
}
function saveFeedbackRow(id){
  if(!canEdit()){ toast(UI.viewerReadOnly, 'err'); return; }
  const emp = STATE.employees.find(e=>e.id===id);
  emp.feedbackNeeded = document.getElementById('fb-need-'+id).checked;
  emp.developmentPlan = readDevPlanFields('fb-'+id);
  persist();
  toast(UI.toastSaved, 'ok');
}


/* ============================= AI ASSISTANT ============================= */
let AI_LOG = [];
let AI_BUSY = false;

function buildAIContext(){
  const f = getModuleFlags();
  const ctx = {
    company: STATE.settings.companyName,
    active_modules: bothActive() ? 'Soft + Hard' : (f.A ? 'Soft Only' : 'Hard Only'),
    employee_count: STATE.employees.length,
    areas: areasList(),
    initial_analysis: STATE.analisiIniziale,
  };
  if(f.A){
    ctx.soft_skills = {
      company_average: fmt1(computeAvgMetric('soft')),
      clusters: SOFT_CLUSTERS.map(c=>({ cluster:c, average: fmt1(avg(STATE.employees.flatMap(e=>SOFT_SKILLS.filter(s=>s.cluster===c).map(s=>(e.soft[s.id]||{ottenuto:0}).ottenuto)))) })),
      skills_with_largest_gap: orgWorstSoftSkills(6).map(s=>({name:s.name, obtained:fmt1(s.ottenuto), expected:fmt1(s.atteso)})),
    };
  }
  if(f.B){
    ctx.hard_skills = {
      apex5d_average: fmt1(computeAvgMetric('hard')),
      dimensions: orgWorstHardDims(5).map(d=>({name:d.name, average:fmt1(d.avg)})),
    };
  }
  if(bothActive()){
    const tiers = classifyPopulation();
    ctx.classification = TIER_DEFS.map(t=>({ level:t.label, people_count:tiers[t.key].length }));
  }
  ctx.areas_detail = areasList().map(a => ({ area:a, employee_count: filterByArea(a).length, average_score: fmt1(avg(filterByArea(a).map(e=>primaryScore(e)))) }));
  ctx.employees = STATE.employees.map(e => ({
    name: e.nome+' '+e.cognome, area:e.area, role:e.ruolo,
    score: fmt1(primaryScore(e)), classification: tierFor(primaryScore(e)).label,
    needs_debrief: e.feedbackNeeded,
  }));
  ctx.feedback_pending = STATE.employees.filter(e=>e.feedbackNeeded).length;
  return ctx;
}

function featuredQuestions(){
  return [
    { label:UI.aiQAreeCritiche, handler: ansAreeCritiche },
    { label:UI.aiQPromotionReady, handler: ansPromotionReady },
    { label:UI.aiQUrgentTraining, handler: ansUrgentTraining },
    { label:UI.aiQSoftSkillsSummary, handler: ansSoftSkillsSummary },
  ];
}
function suggestedQuestions(){
  return [
    { label:UI.aiQAndamento, handler: ansAndamento },
    { label:UI.aiQAreeCriticheShort, handler: ansAreeCritiche },
    { label:UI.aiQTopTalent, handler: ansTopTalent },
    { label:UI.aiQRischio, handler: ansRischio },
    { label:UI.aiQGapCompetenze, handler: ansGapCompetenze },
    { label:UI.aiQRanking, handler: ansRanking },
    { label:UI.aiQFormazione, handler: ansFormazione },
    { label:UI.aiQColloqui, handler: ansColloqui },
    { label:UI.aiQAree, handler: ansAree },
    { label:UI.aiQBigFive, handler: ansBigFive },
  ];
}

function ansAndamento(){
  const hs = homeStats();
  const rel = hs.orgAvg>=hs.benchmark ? UI.aiRelInLine : (hs.orgAvg>=hs.benchmark-1 ? UI.aiRelSlightlyBelow : UI.aiRelBelow);
  return UI.aiAndamentoTemplate(fmt1(hs.orgAvg), primaryScoreLabel(), rel, fmt1(hs.benchmark), hs.tiers.top.length + hs.tiers.valorizzare.length, STATE.employees.length, hs.tiers.sviluppo.length + hs.tiers.critica.length, hs.feedbackDue);
}
function ansAreeCritiche(){
  const a = orgCriticalAreas(3);
  return UI.aiAreeCriticheIntro + '\n' + a.map((x,i)=>UI.aiAreeCriticheLine(i+1, x.area, fmt1(x.avg), x.count)).join('\n');
}
function ansTopTalent(){
  const tiers = classifyPopulation();
  const list = [...tiers.top, ...tiers.valorizzare].sort((a,b)=>primaryScore(b)-primaryScore(a)).slice(0,8);
  if(!list.length) return UI.aiNoTopTalent;
  return UI.aiTopTalentIntro + '\n' + list.map(e=>`• ${e.nome} ${e.cognome} (${e.ruolo}, ${e.area}) — ${fmt1(primaryScore(e))}/10`).join('\n');
}
function ansRischio(){
  const tiers = classifyPopulation();
  const list = [...tiers.critica, ...tiers.sviluppo].sort((a,b)=>primaryScore(a)-primaryScore(b)).slice(0,8);
  if(!list.length) return UI.aiNoRischio;
  return UI.aiRischioIntro + '\n' + list.map(e=>`• ${e.nome} ${e.cognome} (${e.ruolo}, ${e.area}) — ${fmt1(primaryScore(e))}/10${e.feedbackNeeded?UI.aiDebriefFlaggedSuffix:''}`).join('\n');
}
function ansGapCompetenze(){
  const f = getModuleFlags();
  let out = '';
  if(f.A){ out += UI.aiSoftGapIntro + '\n' + orgWorstSoftSkills(5).map(s=>UI.aiSoftGapLine(s.name, fmt1(s.ottenuto), fmt1(s.atteso), fmt1(s.gap))).join('\n'); }
  if(f.B){ out += (out?'\n\n':'') + UI.aiHardGapIntro + '\n' + orgWorstHardDims(3).map(d=>UI.aiHardGapLine(d.name, fmt1(d.avg))).join('\n'); }
  return out || UI.aiNoModuleForGap;
}
function ansRanking(){
  const ranked = rankedEmployees().slice(0,10);
  return UI.aiRankingIntro(primaryScoreLabel()) + '\n' + ranked.map((r,i)=>`${i+1}. ${r.emp.nome} ${r.emp.cognome} — ${fmt1(r.score)}/10`).join('\n');
}
function ansFormazione(){
  const actions = priorityActions();
  return UI.aiFormazioneIntro + '\n' + actions.map(a=>`${a.icon} ${a.text.replace(/<\/?b>/g,'')}`).join('\n');
}
function ansColloqui(){
  const list = STATE.employees.filter(e=>e.feedbackNeeded);
  if(!list.length) return UI.aiNoColloqui;
  return UI.aiColloquiIntro(list.length) + '\n' + list.map(e=>`• ${e.nome} ${e.cognome} (${e.ruolo})`).join('\n');
}
function ansAree(){
  return areasList().map(a => { const emps = filterByArea(a); return UI.aiAreeLine(a, emps.length, fmt1(avg(emps.map(e=>primaryScore(e))))); }).join('\n');
}
function ansBigFive(){
  if(!moduleActive('A')) return UI.aiNoModuleA;
  const out = BIGFIVE_ORDER.map(d => { const ids = SOFT_SKILLS.filter(s=>s.dim===d).map(s=>s.id); const v = round1(avg(STATE.employees.flatMap(e=>ids.map(id=>(e.soft[id]||{ottenuto:0}).ottenuto)))); return `• ${BIGFIVE_DIMS[d].label}: ${fmt1(v)}/10`; }).join('\n');
  return UI.aiBigFiveIntro + '\n' + out;
}
function ansPromotionReady(){
  const tiers = classifyPopulation();
  const list = [...tiers.top].sort((a,b)=>primaryScore(b)-primaryScore(a));
  if(!list.length) return UI.aiNoPromotion;
  return UI.aiPromotionIntro + '\n' + list.map(e=>`• ${e.nome} ${e.cognome} — ${e.ruolo}, ${e.area} — ${fmt1(primaryScore(e))}/10`).join('\n');
}
function ansUrgentTraining(){
  const tiers = classifyPopulation();
  const list = [...tiers.critica, ...tiers.sviluppo].sort((a,b)=>primaryScore(a)-primaryScore(b)).slice(0,10);
  if(!list.length) return UI.aiNoUrgentTraining;
  const worst = worstCompetenza(getModuleFlags());
  const worstLine = worst ? UI.aiWorstCompetencyLine(worst.name, fmt1(worst.gap)) : '';
  return UI.aiUrgentTrainingIntro(list.length) + '\n' + list.map(e=>`• ${e.nome} ${e.cognome} — ${e.ruolo}, ${e.area} — ${fmt1(primaryScore(e))}/10`).join('\n') + worstLine;
}
function ansSoftSkillsSummary(){
  if(!STATE.employees.length) return UI.aiNoEmployeesSoft;
  const overall = round1(avg(STATE.employees.flatMap(e=>SOFT_SKILLS.map(s=>(e.soft[s.id]||{ottenuto:0}).ottenuto))));
  const clusterLines = SOFT_CLUSTERS.map(c => {
    const items = SOFT_SKILLS.filter(s=>s.cluster===c);
    const v = round1(avg(STATE.employees.flatMap(e=>items.map(i=>(e.soft[i.id]||{ottenuto:0}).ottenuto))));
    return `• ${c}: ${fmt1(v)}/10`;
  }).join('\n');
  const worst = orgWorstSoftSkills(3).map(s=>`• ${s.name} (Δ ${fmt1(s.gap)})`).join('\n');
  return UI.aiSoftSummaryTemplate(fmt1(overall), STATE.employees.length, clusterLines, worst);
}

function renderAI(){
  const el = document.getElementById('page-ai');
  el.innerHTML = `
    <div class="ai-shell">
      <div class="ai-suggested" id="ai-suggested"></div>
      <div class="ai-chat">
        <div class="ai-log" id="ai-log"></div>
        <div class="ai-input-row">
          <input type="text" id="ai-input" placeholder="${esc(UI.aiInputPh)}">
          <button class="btn btn-primary" id="ai-send">${UI.aiSendBtn}</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('ai-suggested').innerHTML = `
    <div class="ai-quick-row">
      <div class="ai-suggested-label">${UI.aiQuickQuestions}</div>
      ${featuredQuestions().map((q,i)=>`<button onclick="askFromList(featuredQuestions(), ${i})">${esc(q.label)}</button>`).join('')}
    </div>
    <div class="ai-suggested-label">${UI.aiMoreQuestions}</div>
    ${suggestedQuestions().map((q,i)=>`<button onclick="askFromList(suggestedQuestions(), ${i})">${esc(q.label)}</button>`).join('')}
  `;
  renderAILog();
  document.getElementById('ai-send').addEventListener('click', sendAIInput);
  document.getElementById('ai-input').addEventListener('keydown', e => { if(e.key==='Enter') sendAIInput(); });
  if(!AI_LOG.length){
    addAIMessage('bot', UI.aiGreeting);
  }
}
// Converts plain-text bot answers ("• " bullets, "\n\n" paragraphs) into safe structured HTML:
// the raw text is escaped first, then recognized patterns (bullet lines, key metrics) are wrapped.
function formatAIText(text){
  const escaped = esc(text);
  const lines = escaped.split('\n');
  let html = ''; let inList = false;
  lines.forEach(line => {
    const trimmed = line.trim();
    if(trimmed.startsWith('•')){
      if(!inList){ html += '<ul class="ai-list">'; inList = true; }
      html += `<li>${trimmed.slice(1).trim()}</li>`;
    } else {
      if(inList){ html += '</ul>'; inList = false; }
      if(trimmed) html += `<p>${trimmed}</p>`;
    }
  });
  if(inList) html += '</ul>';
  html = html.replace(/(\d+(\.\d+)?\/10|\d+(\.\d+)?%|Δ ?-?\d+(\.\d+)?)/g, '<b>$1</b>');
  return html;
}
function renderAILog(){
  const log = document.getElementById('ai-log');
  log.innerHTML = AI_LOG.map(m => {
    const body = m.role==='bot' && !m.thinking ? formatAIText(m.text) : esc(m.text);
    return `<div class="ai-msg ${m.role}${m.thinking?' thinking':''}">${body}</div>`;
  }).join('');
  log.scrollTop = log.scrollHeight;
}
function addAIMessage(role, text){ AI_LOG.push({role, text}); renderAILog(); }

function askFromList(list, i){
  const q = list[i];
  addAIMessage('user', q.label);
  const answer = q.handler();
  addAIMessage('bot', answer);
}

function sendAIInput(){
  const input = document.getElementById('ai-input');
  const text = input.value.trim();
  if(!text || AI_BUSY) return;
  input.value = '';
  addAIMessage('user', text);
  handleFreeform(text);
}

function localIntentMatch(text){
  const q = text.toLowerCase();
  const has = (...words) => words.some(w=>q.includes(w));
  if(has('how is','doing overall','overall status','well or badly','come stiamo andando','andamento generale','bene o male')) return ansAndamento();
  if(has('promotion','ready for promotion','promozione','pronti per la promozione')) return ansPromotionReady();
  if(has('urgent','urgente') && has('training','intervention','formazione','intervento')) return ansUrgentTraining();
  if(has('soft skill','competenze trasversali') && has('summary','status','state','overview','riepilogo','sintesi','panoramica','stato')) return ansSoftSkillsSummary();
  if(has('critical','critich','critic') && has('area','aree')) return ansAreeCritiche();
  if(has('top talent','talent','high value','best','talento','alto valore','migliori')) return ansTopTalent();
  if(has('risk','critical','rischio','critic') && has('person','employee','who','persona','dipendente','chi')) return ansRischio();
  if(has('gap','distance','distanza') && has('competenc','skill')) return ansGapCompetenze();
  if(has('ranking','classifica')) return ansRanking();
  if(has('training','coaching','priorit','suggestion','formazione','suggeriment')) return ansFormazione();
  if(has('debrief','feedback','colloqui','colloquio')) return ansColloqui();
  if(has('distribution','distribuzione') && has('area','aree')) return ansAree();
  if(has('big five','ocean','personality','personalit')) return ansBigFive();
  return null;
}

async function handleFreeform(text){
  const local = localIntentMatch(text);
  if(local){ addAIMessage('bot', local); return; }
  AI_BUSY = true;
  addAIMessage('bot', UI.aiThinkingMsg);
  const thinkingIdx = AI_LOG.length - 1;
  AI_LOG[thinkingIdx].thinking = true;
  renderAILog();
  try{
    const context = buildAIContext();
    const respondLang = UI===UI_IT ? 'Italian' : 'English';
    const systemPrompt = `You are the assistant embedded in SKILL-VISION's "Competency Assessment" HR dashboard. Respond in ${respondLang}, concisely, concretely, and operationally, using ONLY the JSON data provided as company context. If a question can't be verified from the data, say so explicitly instead of making up numbers. Do not use markdown, just plain text with bullet points using '•' where helpful.\n\nCOMPANY DATA:\n${JSON.stringify(context)}`;
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 20000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:1000,
        system: systemPrompt,
        messages:[{ role:'user', content:text }],
      }),
    });
    clearTimeout(timeout);
    const data = await response.json();
    const textBlocks = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text);
    const answer = textBlocks.join('\n').trim();
    AI_LOG.splice(thinkingIdx,1);
    addAIMessage('bot', answer || UI.aiCantInterpretMsg);
  }catch(err){
    AI_LOG.splice(thinkingIdx,1);
    addAIMessage('bot', UI.aiCantReachMsg);
  }
  AI_BUSY = false;
}

/* ============================= LOGIN GATE ============================= */
(function(){
  const REMEMBER_KEY = 'sv_login_remember';
  const AUTH_KEY = 'sv_authenticated';

  const screen = document.getElementById('login-screen');
  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const rememberMe = document.getElementById('loginRememberMe');
  const togglePassword = document.getElementById('loginTogglePassword');
  const formError = document.getElementById('loginFormError');

  togglePassword.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePassword.style.color = isHidden ? 'var(--accent)' : 'var(--text-3)';
  });

  const saved = safeStorage.get(REMEMBER_KEY);
  if(saved){
    try{
      const { username, password } = JSON.parse(saved);
      usernameInput.value = username || '';
      passwordInput.value = password || '';
      rememberMe.checked = true;
    }catch(e){}
  }

  if(safeStorage.sessionGet(AUTH_KEY) === '1'){
    screen.classList.add('hidden');
    const sessionUser = loadUsers().find(u => u.username.toLowerCase() === (safeStorage.sessionGet(CURRENT_USER_KEY)||'').toLowerCase());
    CURRENT_USER_ROLE = sessionUser ? sessionUser.role : 'admin';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    formError.textContent = '';
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const matchedUser = loadUsers().find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if(matchedUser){
      if(rememberMe.checked){
        safeStorage.set(REMEMBER_KEY, JSON.stringify({ username, password }));
      } else {
        safeStorage.remove(REMEMBER_KEY);
      }
      safeStorage.sessionSet(AUTH_KEY, '1');
      safeStorage.sessionSet(CURRENT_USER_KEY, matchedUser.username);
      CURRENT_USER_ROLE = matchedUser.role;
      screen.classList.add('hidden');
      applyRolePermissions();
      if(typeof STATE !== 'undefined' && STATE){ renderNav(); navigateTo(CURRENT_PAGE || 'home'); }
    } else {
      formError.textContent = UI.loginError;
    }
  });
})();

/* ================================================================
   SPA EMBED HOOK — added by the unified Skill Vision dashboard.
   See the matching note in js/recruiting.js. When embedded in the
   SPA shell the shared login gate is skipped and logout/theme are
   relayed to the parent window. Stand-alone use is unaffected.
   ================================================================ */
(function(){
  var EMBEDDED = new URLSearchParams(location.search).get('embedded') === '1';
  if(!EMBEDDED) return;
  document.body.classList.add('sv-embedded');

  // The Assessment app pins page/panel colours as INLINE custom properties on
  // <html> (initCustomBg / initCustomSurface / initCustomText). Those beat any
  // stylesheet rule, so the Master Theme Switcher's light/dark palette could
  // never take effect. Under the shell, the theme owns the surfaces: wipe the
  // inline pins + their storage keys unless the shell explicitly sends a brand
  // colour. (The app's own resetCustomSurface() re-derives values, so we clear
  // the properties directly instead of calling it.)
  function svClearSurfaces(){
    var rs = document.documentElement.style;
    ['--bg','--surface','--surface-alt'].forEach(function(p){ rs.removeProperty(p); });
    try{ safeStorage.remove('sv_bg_custom'); safeStorage.remove('sv_surface_custom'); }catch(e){}
  }
  function svClearText(){
    var rs = document.documentElement.style;
    ['--text-1','--text-2','--text-3'].forEach(function(p){ rs.removeProperty(p); });
    try{ safeStorage.remove('sv_text_custom'); }catch(e){}
  }

  function hideLogin(){
    var screen = document.getElementById('login-screen');
    if(screen) screen.classList.add('hidden');
  }
  hideLogin();
  // boot() runs on its own and always renders the app behind the login overlay,
  // so simply hiding the overlay drops us straight into the dashboard.
  try{ safeStorage.sessionSet('sv_authenticated', '1'); }catch(e){}
  if(typeof applyRolePermissions === 'function'){ try{ applyRolePermissions(); }catch(e){} }

  // Apply any persisted Global System Settings up-front (theme/brand) to avoid a flash.
  try{
    var _raw = (window.localStorage && localStorage.getItem('sv_global_settings')) || null;
    var _s = _raw ? JSON.parse(_raw) : {};
    if(_s.theme && typeof applyTheme === 'function') applyTheme(_s.theme);
    if(_s.accent && typeof applyCustomAccent === 'function') applyCustomAccent(_s.accent, true);
    if(_s.bg && typeof applyCustomBg === 'function') applyCustomBg(_s.bg, true); else svClearSurfaces();
    if(_s.surface && typeof applyCustomSurface === 'function') applyCustomSurface(_s.surface, true);
    if(_s.textColor && typeof applyCustomText === 'function') applyCustomText(_s.textColor, true); else svClearText();
  }catch(e){}

  try{ parent.postMessage({ source:'sv-module', module:'assessment', type:'ready' }, '*'); }catch(e){}

  // Full, clean re-init of the visible page: navigateTo() runs destroyCharts()
  // before re-rendering, so Chart.js / ApexCharts never collide on a canvas and
  // never inherit a 0-height layout from having been built while hidden.
  function reinitCurrentPage(){
    try{
      if(typeof navigateTo === 'function' && typeof CURRENT_PAGE !== 'undefined' && CURRENT_PAGE){
        navigateTo(CURRENT_PAGE);
      } else if(typeof rerenderCurrentPage === 'function'){
        rerenderCurrentPage();
      }
    }catch(e){}
    setTimeout(function(){ try{ window.dispatchEvent(new Event('resize')); }catch(e){} }, 60);
  }

  // Apply a Global System Settings snapshot pushed by the shell.
  function applyGlobalSettings(s){
    if(!s) return;
    if(s.theme && typeof applyTheme === 'function') applyTheme(s.theme);
    if(s.accent && typeof applyCustomAccent === 'function') applyCustomAccent(s.accent, true);
    // Surfaces are owned by the Master Theme Switcher. A per-brand override is
    // applied only when explicitly set; otherwise the inline pins are wiped so
    // the theme's own light/dark palette (css/style.css) is authoritative.
    if(s.bg && typeof applyCustomBg === 'function') applyCustomBg(s.bg, true); else svClearSurfaces();
    if(s.surface && typeof applyCustomSurface === 'function') applyCustomSurface(s.surface, true);
    if(s.textColor && typeof applyCustomText === 'function') applyCustomText(s.textColor, true); else svClearText();
    if(s.companyName && typeof STATE !== 'undefined' && STATE && STATE.settings){
      STATE.settings.companyName = s.companyName;
      if(typeof updateSidebarFooter === 'function') updateSidebarFooter();
      if(typeof persist === 'function') persist();
    }
    if(s.scoring){
      window.SV_SCORING = s.scoring;
      // keep the shared semantic thresholds in step with the global scale
      if(typeof semanticChip === 'function' && !semanticChip.__svPatched){
        var _sem = semanticChip;
        window.semanticChip = function(score, thresholds){
          var g = (window.SV_SCORING && window.SV_SCORING.good) || 7;
          var m = (window.SV_SCORING && window.SV_SCORING.mid) || 5;
          return _sem(score, thresholds || { good: g, mid: m });
        };
        window.semanticChip.__svPatched = true;
      }
    }
    reinitCurrentPage();
  }

  window.addEventListener('message', function(ev){
    var d = ev.data || {};
    if(d.source !== 'sv-shell') return;
    if(d.type === 'theme' && typeof applyTheme === 'function') applyTheme(d.mode);
    if(d.type === 'settings') applyGlobalSettings(d.settings);
    if(d.type === 'activate') reinitCurrentPage();
    if(d.type === 'navigate' && typeof navigateTo === 'function') navigateTo(d.page);
    // Master-header proxies: the language + settings controls now live in the
    // shell header; they drive this module's own handlers from up there.
    // Two message shapes arrive here and they mean different things:
    //   {type:'lang', lang:'it'|'en'}  — landing IT/EN buttons: SET that language
    //   {type:'lang'}                  — header globe button: FLIP the current one
    // Treating the explicit form as a toggle inverted it (clicking IT gave
    // English), because the listener at the top of this file has already
    // written d.lang to storage by the time this runs.
    if(d.type === 'lang'){
      var langTarget = d.lang ? (String(d.lang).toLowerCase() === 'it' ? 'it' : 'en') : null;
      if(langTarget && typeof handleLanguageChange === 'function') handleLanguageChange(langTarget);
      else if(typeof toggleLanguageQuick === 'function') toggleLanguageQuick();
      try{ parent.postMessage({ source:'sv-module', module:'assessment', type:'lang-changed' }, '*'); }catch(e){}
    }
    if(d.type === 'open-settings' && typeof openSettingsModal === 'function') openSettingsModal();
  });
})();

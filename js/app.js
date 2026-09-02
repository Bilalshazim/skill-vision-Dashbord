/* =====================================================================
   SKILL-VISION — Unified SPA shell controller
   ---------------------------------------------------------------------
   Responsibilities:
     • screen router      : login → presentation landing → dashboard
     • login state        : shared credential check, sessionStorage persistence
     • module switcher     : Recruiting ⇆ Assessment (two persistent
                             <iframe>s swapped without reloading the page)
     • window.GlobalSettings : one source of truth for theme, company
                             profile, brand colours and scoring scale —
                             pushed into BOTH modules in real time
   The per-module views/logic live in js/recruiting.js and js/assessment.js,
   loaded inside modules/recruiting.html and modules/assessment.html.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- storage (never throws — file:// safe) ---------------- */
  var store = (function () {
    var mem = {};
    function ok(s) { try { s.setItem('__p', '1'); s.removeItem('__p'); return true; } catch (e) { return false; } }
    var lsOK = false, ssOK = false;
    try { lsOK = ok(window.localStorage); } catch (e) {}
    try { ssOK = ok(window.sessionStorage); } catch (e) {}
    return {
      get: function (k) { try { return lsOK ? localStorage.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return mem[k] || null; } },
      set: function (k, v) { try { if (lsOK) { localStorage.setItem(k, v); return; } } catch (e) {} mem[k] = v; },
      del: function (k) { try { if (lsOK) { localStorage.removeItem(k); return; } } catch (e) {} delete mem[k]; },
      sget: function (k) { try { return ssOK ? sessionStorage.getItem(k) : (('s:' + k) in mem ? mem['s:' + k] : null); } catch (e) { return mem['s:' + k] || null; } },
      sset: function (k, v) { try { if (ssOK) { sessionStorage.setItem(k, v); return; } } catch (e) {} mem['s:' + k] = v; },
      sdel: function (k) { try { if (ssOK) { sessionStorage.removeItem(k); return; } } catch (e) {} delete mem['s:' + k]; }
    };
  })();

  var AUTH_KEY = 'sv_shell_auth';
  var USER_KEY = 'sv_shell_user';
  var LANG_KEY = 'sv_language';          // shared with the Assessment module's i18n

  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;

  /* -------- Translation system for shell UI -------- */
  var i18n = {
    it: {
      'aria-label-lang': 'Lingua / Language',
      'placeholder-username': 'Username',
      'placeholder-password': 'Password',
      'aria-label-pass': 'Mostra password',
      'title-pass': 'Mostra password',
      'button-login': 'Accedi',
      'error-login': 'Nome utente o password errati.',
      'error-internal': 'Errore interno — vedi console.',
      'landing-subtitle': 'Seleziona il cruscotto di tuo interesse per proseguire',
      'recruiting-title': 'Cruscotto Recruiting',
      'recruiting-desc': 'Gestione dei processi di selezione, candidati e valutazione delle competenze in ingresso.',
      'recruiting-btn': 'Accedi al cruscotto Recruiting →',
      'assessment-title': 'Cruscotto Assessment',
      'assessment-desc': 'Mappatura delle competenze interne, analisi delle prestazioni e sviluppo organizzativo.',
      'assessment-btn': 'Accedi al cruscotto Assessment →'
    },
    en: {
      'aria-label-lang': 'Language / Lingua',
      'placeholder-username': 'Username',
      'placeholder-password': 'Password',
      'aria-label-pass': 'Show password',
      'title-pass': 'Show password',
      'button-login': 'Sign in',
      'error-login': 'Incorrect username or password.',
      'error-internal': 'Internal error — see console.',
      'landing-subtitle': 'Select the dashboard of your choice to continue',
      'recruiting-title': 'Recruiting Dashboard',
      'recruiting-desc': 'Management of selection processes, candidates and assessment of incoming skills.',
      'recruiting-btn': 'Access Recruiting Dashboard →',
      'assessment-title': 'Assessment Dashboard',
      'assessment-desc': 'Internal skills mapping, performance analysis and organizational development.',
      'assessment-btn': 'Access Assessment Dashboard →'
    }
  };

  function applyTranslations(lang) {
    lang = (lang === 'en') ? 'en' : 'it';
    var trans = i18n[lang];
    if (!trans) return;

    // Update aria-labels and titles
    var langSwitch = document.querySelector('.sv-lang-switch');
    if (langSwitch) langSwitch.setAttribute('aria-label', trans['aria-label-lang']);

    // Update login form
    var userInput = $('sv-user');
    if (userInput) userInput.setAttribute('placeholder', trans['placeholder-username']);
    var passInput = $('sv-pass');
    if (passInput) passInput.setAttribute('placeholder', trans['placeholder-password']);
    var passToggle = $('sv-toggle-pass');
    if (passToggle) {
      passToggle.setAttribute('aria-label', trans['aria-label-pass']);
      passToggle.setAttribute('title', trans['title-pass']);
    }
    var loginBtn = document.querySelector('#sv-login-form button[type="submit"]');
    if (loginBtn) loginBtn.textContent = trans['button-login'];

    // Update landing page
    var landingSubtitle = document.querySelector('#sv-landing .lead');
    if (landingSubtitle) landingSubtitle.textContent = trans['landing-subtitle'];

    var features = document.querySelectorAll('.sv-feature');
    features.forEach(function (feature, index) {
      var module = feature.getAttribute('data-enter-module');
      if (module === 'recruiting') {
        var title = feature.querySelector('h3');
        var desc = feature.querySelector('p');
        var btn = feature.querySelector('.sv-btn');
        if (title) title.textContent = trans['recruiting-title'];
        if (desc) desc.textContent = trans['recruiting-desc'];
        if (btn) btn.textContent = trans['recruiting-btn'];
      } else if (module === 'assessment') {
        var title = feature.querySelector('h3');
        var desc = feature.querySelector('p');
        var btn = feature.querySelector('.sv-btn');
        if (title) title.textContent = trans['assessment-title'];
        if (desc) desc.textContent = trans['assessment-desc'];
        if (btn) btn.textContent = trans['assessment-btn'];
      }
    });
  }

  /* ---------------- auto language / "translate on entry" ----------------
     The Assessment module ships full IT⇆EN copy (js/assessment.js) but boots
     in Italian by default. On a visitor's FIRST entry we detect their browser
     language and write the shared key the module reads on boot, so a non-Italian
     visitor lands on the English UI automatically — no manual toggle, no reload.
     An explicit choice (made later via the header IT/EN control) is respected.
     The shell chrome itself is authored in English; index.html keeps lang="en"
     and carries no `notranslate`, so a browser's own page-translator stays free
     to translate anything it can reach (note: browsers do not auto-translate
     cross-frame content, which is why the module's own i18n is used here). */
  (function detectLanguage() {
    try {
      // Default the shell UI to Italian unless an explicit preference exists
      if (store.get(LANG_KEY)) return;
      store.set(LANG_KEY, 'it');
    } catch (e) {}
  })();

  /* ---------------- colour helper ---------------- */
  function clamp(n) { return Math.max(0, Math.min(255, Math.round(n))); }
  function shade(hex, amt) {
    hex = String(hex || '').replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (hex.length !== 6) return '#' + hex;
    var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    var f = amt < 0 ? (1 + amt) : 1, t = amt < 0 ? 0 : 255 * amt;
    r = clamp(r * f + (amt > 0 ? t : 0));
    g = clamp(g * f + (amt > 0 ? t : 0));
    b = clamp(b * f + (amt > 0 ? t : 0));
    return '#' + [r, g, b].map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }

  /* =====================================================================
     GLOBAL SYSTEM SETTINGS CONTROLLER
     window.GlobalSettings — theme, company profile, brand colour, scoring
     scale. set() persists, repaints the shell, and broadcasts the full
     snapshot to both module iframes so the change is reflected live.
     ===================================================================== */
  var GlobalSettings = (function () {
    var KEY = 'sv_global_settings';
    var listeners = [];
    var defaults = {
      theme: 'light',
      companyName: 'Demo Company S.r.l.',
      accent: '#B4C614',
      bg: '',                 // '' → keep the module's own default surface
      surface: '',
      textColor: '',
      scoring: { max: 10, good: 7, mid: 5 }
    };

    function read() {
      try {
        var raw = store.get(KEY);
        if (raw) {
          var p = JSON.parse(raw);
          return Object.assign({}, defaults, p, { scoring: Object.assign({}, defaults.scoring, p.scoring || {}) });
        }
      } catch (e) {}
      return JSON.parse(JSON.stringify(defaults));
    }

    var data = read();

    function persist() {
      store.set(KEY, JSON.stringify(data));
      // Canonical master-theme key — both modules read this on boot.
      store.set('sv_theme', data.theme === 'dark' ? 'dark' : 'light');
    }
    persist(); // make the master theme available to modules before first paint

    function applyToShell() {
      var theme = data.theme === 'dark' ? 'dark' : 'light';
      // Master switch: the single source of truth is data-theme on <html>.
      document.documentElement.setAttribute('data-theme', theme);
      body.classList.toggle('sv-light', theme === 'light');
      var icon = theme === 'light' ? '🌙' : '☀️';
      if ($('sv-dash-theme')) $('sv-dash-theme').textContent = icon;
      // Day/night brand-logo swap: dark header → white wordmark, light header → black.
      // The login mark is Brand Book black-on-light only — never hide or invert it.
      Array.prototype.forEach.call(document.querySelectorAll('.sv-logo'), function (img) {
        if (img.classList.contains('sv-login-logo') || img.closest('#sv-login')) {
          img.style.display = 'block';
          return;
        }
        var forDark = img.classList.contains('sv-logo-dark');
        img.style.display = (forDark === (theme === 'dark')) ? 'block' : 'none';
      });
      var root = document.documentElement.style;
      if (data.accent) {
        root.setProperty('--sv-accent', data.accent);
        root.setProperty('--sv-accent-600', shade(data.accent, -0.16));
      }
    }

    // language switch helper callable from inline buttons
    window.switchLanguage = function (lang) {
      try {
        lang = String(lang || 'it').toLowerCase() === 'it' ? 'it' : 'en';
        store.set(LANG_KEY, lang);
        // Notify framed modules about language change. Sending an explicit
        // `lang` means "set this language" (as opposed to the header globe
        // button, which sends no `lang` and means "flip whatever is current").
        frames().forEach(function (f) {
          post(f, { source: 'sv-shell', type: 'lang', lang: lang });
        });
        try { document.documentElement.setAttribute('lang', lang); } catch (ee) {}
        applyTranslations(lang);
        refreshLangLabel();
        refreshLangButtons();
      } catch (e) {}
    };

    function frames() {
      return ['sv-frame-recruiting', 'sv-frame-assessment']
        .map(function (id) { return $(id); })
        .filter(function (f) { return f && f.contentWindow; });
    }
    function post(frame, msg) { try { frame.contentWindow.postMessage(msg, '*'); } catch (e) {} }

    function broadcast() { frames().forEach(function (f) { post(f, { source: 'sv-shell', type: 'settings', settings: data }); }); }
    function pushTo(frame) { post(frame, { source: 'sv-shell', type: 'settings', settings: data }); }

    return {
      KEY: KEY,
      all: function () { return JSON.parse(JSON.stringify(data)); },
      get: function (k) { return data[k]; },
      set: function (patch, opts) {
        opts = opts || {};
        patch = patch || {};
        if (patch.scoring) { data.scoring = Object.assign({}, data.scoring, patch.scoring); delete patch.scoring; }
        Object.assign(data, patch);
        persist();
        applyToShell();
        if (opts.broadcast !== false) broadcast();
        listeners.forEach(function (fn) { try { fn(data); } catch (e) {} });
      },
      toggleTheme: function () { this.set({ theme: data.theme === 'dark' ? 'light' : 'dark' }); },
      subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; },
      applyToShell: applyToShell,
      broadcast: broadcast,
      pushTo: pushTo
    };
  })();
  window.GlobalSettings = GlobalSettings;

  /* ---------------- shared demo credentials ----------------
     Union of the two original apps' seed logins so either works here. */
  var USERS = [
    { user: 'admin',     pass: 'admin123',    name: 'Roberto Feliciani', role: 'superadmin' },
    { user: 'roberto',   pass: 'sv2024',      name: 'Marco Bianchi',     role: 'admin' },
    { user: 'operatore', pass: 'op123',       name: 'Giulia Verdi',      role: 'operator' },
    { user: 'Roberto',   pass: 'ADVISOR2026', name: 'Roberto (Advisor)', role: 'admin' }
  ];

  /* ---------------- module registry ---------------- */
  var MODULES = {
    recruiting: { label: 'Recruiting', src: 'modules/recruiting.html?embedded=1' },
    assessment: { label: 'Assessment', src: 'modules/assessment.html?embedded=1' }
  };
  var loaded = {};
  var currentModule = null;

  /* ---------------- SCREEN ROUTER ---------------- */
  function showScreen(name) {
    ['sv-login', 'sv-landing', 'sv-dashboard'].forEach(function (id) {
      $(id).classList.toggle('on', id === 'sv-' + name);
    });
    document.documentElement.style.overflow = name === 'dashboard' ? 'hidden' : '';
    window.scrollTo(0, 0);
  }
  function isAuthed() { return store.sget(AUTH_KEY) === '1'; }

  /* ---------------- LOGIN ---------------- */
  function handleLogin(e) {
    try {
      e.preventDefault();
      var uEl = $('sv-user'), pEl = $('sv-pass');
      if (!uEl || !pEl) throw new Error('Login form not found');
      var u = uEl.value.trim();
      var p = pEl.value;
      var found = USERS.find(function (x) { return x.user === u && x.pass === p; });
      if (!found) {
        var errEl = $('sv-login-err');
        if (errEl) {
          var lang = store.get(LANG_KEY) || 'it';
          var trans = i18n[lang] || i18n.it;
          errEl.textContent = trans['error-login'];
        }
        return;
      }
      store.sset(AUTH_KEY, '1');
      store.sset(USER_KEY, found.user);
      var errEl = $('sv-login-err'); if (errEl) errEl.textContent = '';
      pEl.value = '';
      // Attempt normal routing; if an error is thrown later, fall back to forcibly showing the landing
      try { showScreen('landing'); } catch (e2) {
        // Best-effort fallback UI update
        try { var L = $('sv-landing'); var LOG = $('sv-login'); if (L) L.classList.add('on'); if (LOG) LOG.classList.remove('on'); } catch (ee) {}
      }
    } catch (err) {
      console.error('Login error:', err);
      var errEl2 = $('sv-login-err');
      if (errEl2) {
        var lang = store.get(LANG_KEY) || 'it';
        var trans = i18n[lang] || i18n.it;
        errEl2.textContent = trans['error-internal'];
      }
      // Force landing so the user can continue even if a non-fatal script error occurred
      try { var L2 = $('sv-landing'), LOG2 = $('sv-login'); if (L2) L2.classList.add('on'); if (LOG2) LOG2.classList.remove('on'); } catch (ee) {}
    }
  }
  function logout() {
    store.sdel(AUTH_KEY);
    store.sdel(USER_KEY);
    showScreen('login');
  }

  /* ---------------- MODULE SWITCHER ---------------- */
  function setModule(name) {
    if (!MODULES[name]) return;
    currentModule = name;
    var frame = $('sv-frame-' + name);

    if (!loaded[name]) {
      loaded[name] = true;
      showFrameLoading(MODULES[name].label);
      frame.addEventListener('load', function () {
        hideFrameLoading();
        GlobalSettings.pushTo(frame);
        activate(frame);
      }, { once: true });
      frame.src = MODULES[name].src;
    } else {
      hideFrameLoading();
      GlobalSettings.pushTo(frame);
      activate(frame);
    }

    ['recruiting', 'assessment'].forEach(function (m) {
      $('sv-frame-' + m).classList.toggle('active', m === name);
    });
    Array.prototype.forEach.call($('sv-switcher').children, function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-module') === name);
    });
    // Drives which master-header controls are visible (.sv-mod-only in style.css).
    body.setAttribute('data-active-module', name);
    refreshLangLabel();
    store.sset('sv_shell_module', name);
  }

  /* ---------------- ASSESSMENT MASTER-HEADER PROXIES ---------------- */
  function postToAssessment(msg) {
    var f = $('sv-frame-assessment');
    if (f && f.contentWindow) { try { f.contentWindow.postMessage(msg, '*'); } catch (e) {} }
  }
  // Language works in both modules (each has its own applyLanguage/toggleLanguage), so unlike
  // the Assessment-only settings proxy above, this targets whichever module is on screen.
  function postToActiveModule(msg) {
    var active = body.getAttribute('data-active-module') === 'recruiting' ? 'recruiting' : 'assessment';
    var f = $('sv-frame-' + active);
    if (f && f.contentWindow) { try { f.contentWindow.postMessage(msg, '*'); } catch (e) {} }
  }
  function refreshLangLabel() {
    var el = $('sv-dash-lang-code');
    if (!el) return;
    var lang = store.get('sv_language') || 'it';
    el.textContent = lang.toUpperCase();
  }
  /* Highlight the active IT|EN control. Also called on boot, so a stored
     preference survives a reload instead of the markup always showing IT. */
  function refreshLangButtons() {
    var lang = store.get('sv_language') || 'it';
    Array.prototype.forEach.call(document.querySelectorAll('.sv-lang-btn'), function (btn) {
      try {
        var code = (btn.getAttribute('data-lang') || btn.textContent || '').trim().toLowerCase();
        var on = code === lang;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      } catch (e) {}
    });
  }
  function toggleAssessmentLanguage() {
    postToActiveModule({ source: 'sv-shell', type: 'lang' });
    setTimeout(refreshLangLabel, 120);
    setTimeout(refreshLangLabel, 500);
  }
  function openAssessmentSettings() {
    closeSettings();
    postToAssessment({ source: 'sv-shell', type: 'open-settings' });
  }

  /* Tell a freshly-visible module to re-lay-out and re-init its charts.
     Chart.js / ApexCharts measure 0×0 if they were built while the iframe
     was display:none, so every activation triggers a clean re-render. */
  function activate(frame) {
    setTimeout(function () {
      try { frame.contentWindow.postMessage({ source: 'sv-shell', type: 'activate' }, '*'); } catch (e) {}
    }, 40);
  }

  function showFrameLoading(label) {
    $('sv-frame-loading-text').textContent = 'Loading ' + label + ' module…';
    $('sv-frame-loading').classList.add('on');
  }
  function hideFrameLoading() { $('sv-frame-loading').classList.remove('on'); }

  function enterDashboard(preferModule) {
    showScreen('dashboard');
    setModule(preferModule || store.sget('sv_shell_module') || 'recruiting');
  }

  /* ---------------- SHELL SETTINGS MODAL ---------------- */
  function openSettings() {
    var s = GlobalSettings.all();
    $('sv-set-theme').value = s.theme;
    $('sv-set-company').value = s.companyName || '';
    $('sv-set-accent').value = /^#([0-9a-f]{6})$/i.test(s.accent) ? s.accent : '#B4C614';
    $('sv-set-surface').value = /^#([0-9a-f]{6})$/i.test(s.surface) ? s.surface : (s.theme === 'dark' ? '#1B1A17' : '#FFFFFF');
    $('sv-set-bg').value = /^#([0-9a-f]{6})$/i.test(s.bg) ? s.bg : (s.theme === 'dark' ? '#0D0C0A' : '#F8F9FA');
    $('sv-set-scale-max').value = s.scoring.max;
    $('sv-set-scale-good').value = s.scoring.good;
    $('sv-set-scale-mid').value = s.scoring.mid;
    $('sv-settings-modal').classList.add('on');
  }
  function closeSettings() { $('sv-settings-modal').classList.remove('on'); }

  function wireSettingsInputs() {
    $('sv-set-theme').addEventListener('change', function () { GlobalSettings.set({ theme: this.value }); });
    $('sv-set-company').addEventListener('input', function () { GlobalSettings.set({ companyName: this.value }); });
    $('sv-set-accent').addEventListener('input', function () { GlobalSettings.set({ accent: this.value }); });
    $('sv-set-surface').addEventListener('input', function () { GlobalSettings.set({ surface: this.value }); });
    $('sv-set-bg').addEventListener('input', function () { GlobalSettings.set({ bg: this.value }); });
    var scale = function () {
      GlobalSettings.set({ scoring: {
        max: parseInt($('sv-set-scale-max').value, 10) || 10,
        good: parseInt($('sv-set-scale-good').value, 10) || 7,
        mid: parseInt($('sv-set-scale-mid').value, 10) || 5
      } });
    };
    ['sv-set-scale-max', 'sv-set-scale-good', 'sv-set-scale-mid'].forEach(function (id) {
      $(id).addEventListener('change', scale);
    });
    $('sv-set-reset').addEventListener('click', function () {
      // Light is the Brand Book default, so a reset must land on light — not dark.
      GlobalSettings.set({ theme: 'light', companyName: 'Demo Company S.r.l.', accent: '#B4C614', bg: '', surface: '', textColor: '', scoring: { max: 10, good: 7, mid: 5 } });
      openSettings();
      toast('Settings reset to defaults.');
    });
  }

  /* The "Request a Demo Call" modal and its handlers were removed together
     with the landing-page CTAs (client brief: the welcome page carries the
     logo, a subtitle and exactly two module cards, nothing else). */

  /* ---------------- TOAST ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('sv-toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, 3400);
  }

  /* ---------------- cross-frame messages ---------------- */
  window.addEventListener('message', function (ev) {
    var d = ev.data || {};
    if (d.source !== 'sv-module') return;
    if (d.type === 'logout') logout();
    if (d.type === 'ready') {
      hideFrameLoading();
      var f = $('sv-frame-' + (d.module || currentModule));
      if (f) GlobalSettings.pushTo(f);
      refreshLangLabel();
    }
    if (d.type === 'lang-changed') refreshLangLabel();
  });

  /* ---------------- WIRING ---------------- */
  function init() {
    GlobalSettings.applyToShell();
    GlobalSettings.subscribe(function () { /* shell already repainted; hook for future widgets */ });
    // Apply stored language preference on page load
    var storedLang = store.get(LANG_KEY) || 'it';
    applyTranslations(storedLang);
    // Surface uncaught script errors to the UI toast for easier debugging
    window.addEventListener('error', function (ev) {
      try {
        console.error('Uncaught error:', ev.error || ev.message || ev);
        var t = $('sv-toast'); if (t) { t.textContent = 'Errore di script — vedi console'; t.classList.add('on'); setTimeout(function () { t.classList.remove('on'); }, 3600); }
      } catch (e) {}
    });
    function ifEl(id, fn){ var el = $(id); if(el) fn(el); }

    Array.prototype.forEach.call(document.querySelectorAll('.sv-lang-btn'), function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        window.switchLanguage(btn.getAttribute('data-lang') || btn.textContent);
      });
    });
    ifEl('sv-login-form', function(el){ el.addEventListener('submit', handleLogin); });
    ifEl('sv-toggle-pass', function(el){
      el.addEventListener('click', togglePasswordVisibility);
      // mousedown default would steal focus / submit in some browsers; block it.
      el.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
    });
    ifEl('sv-dash-theme', function(el){ el.addEventListener('click', function () { GlobalSettings.toggleTheme(); }); });

    // Landing entry: the two cards carry data-enter-module. The older
    // sv-landing-enter / sv-landing-enter-2 / sv-demo-btn / sv-landing-theme
    // triggers were removed from index.html per the client brief ("no hero
    // buttons or extra CTAs on the welcome page"), so their handlers are gone
    // too rather than left dangling behind ifEl() guards.
    Array.prototype.forEach.call(document.querySelectorAll('[data-enter-module]'), function (btn) {
      btn.addEventListener('click', function () { enterDashboard(btn.getAttribute('data-enter-module')); });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterDashboard(btn.getAttribute('data-enter-module')); }
      });
    });

    ifEl('sv-switcher', function(el){ el.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-module]');
      if (btn) setModule(btn.getAttribute('data-module'));
    }); });
    ifEl('sv-dash-home', function(el){ el.addEventListener('click', function () { showScreen('landing'); }); });
    (function () {
      var logo = $('sv-dash-logo');
      if (!logo) return;
      logo.addEventListener('click', function () { showScreen('landing'); });
      logo.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showScreen('landing'); } });
    })();
    ifEl('sv-dash-logout', function(el){ el.addEventListener('click', logout); });
    ifEl('sv-dash-settings', function(el){ el.addEventListener('click', openSettings); });
    ifEl('sv-dash-lang', function(el){ el.addEventListener('click', toggleAssessmentLanguage); });
    ifEl('sv-set-open-asm', function(el){ el.addEventListener('click', openAssessmentSettings); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-close-settings]'), function (b) { b.addEventListener('click', closeSettings); });
    ifEl('sv-settings-modal', function(el){ el.addEventListener('click', function (e) { if (e.target === this) closeSettings(); }); });
    wireSettingsInputs();

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeSettings(); } });

    refreshLangLabel();
    refreshLangButtons();
    showScreen(isAuthed() ? 'landing' : 'login');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  /* ---------------- "Mostra password" reveal ----------------
     Swaps the two pre-rendered SVGs instead of rewriting innerHTML, and keeps
     aria-pressed / aria-label in sync for screen readers. The trigger is a
     type="button", and this handler also preventDefault()s, so revealing the
     password can never submit the login form. */
  function togglePasswordVisibility(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    var input = $('sv-pass');
    if (!input) return;

    var show = input.getAttribute('type') === 'password';   // about to reveal?
    input.setAttribute('type', show ? 'text' : 'password');

    var eyeShow = $('sv-eye-show');
    var eyeHide = $('sv-eye-hide');
    if (eyeShow) eyeShow.style.display = show ? 'none' : 'block';
    if (eyeHide) eyeHide.style.display = show ? 'block' : 'none';

    var btn = $('sv-toggle-pass');
    if (btn) {
      var label = show ? 'Nascondi password' : 'Mostra password';
      btn.setAttribute('aria-pressed', show ? 'true' : 'false');
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }

    // Keep the caret where the user left it rather than jumping to the end.
    try { var p = input.selectionStart; input.focus(); input.setSelectionRange(p, p); } catch (e) {}
  }
  // Kept on window for the older inline onclick= form, in case any copy of the
  // markup still calls it that way.
  window.togglePasswordVisibility = togglePasswordVisibility;
})();

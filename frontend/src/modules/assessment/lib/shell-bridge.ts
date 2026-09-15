// Bridges React Assessment to the existing legacy shell (index.html + js/app.js)
// per Phase 24's explicit requirement: the shell's login/landing page stays
// the ONLY user-facing entry point — React never implements a second login.
//
// Shared shell keys (verified in Phase 23's audit, js/app.js ~35-37,
// ~165-196):
//   sessionStorage.sv_shell_auth  — '1' once the shell's login form succeeds
//   sessionStorage.sv_shell_user  — the logged-in username
//   localStorage.sv_theme         — 'light'|'dark', written by
//                                    GlobalSettings.persist() and read by
//                                    both modules on boot
//   localStorage.sv_language      — 'it'|'en', shared the same way
//
// React Assessment reads these; it never writes sv_shell_auth/sv_shell_user
// (only the shell's own login form does that) and only writes sv_theme/
// sv_language when the user operates Assessment's OWN theme/language
// controls — exactly mirroring how legacy's embed-hook lets the module
// apply local changes that flow back through the same shared keys.

const SHELL_AUTH_KEY = 'sv_shell_auth'
const SHELL_USER_KEY = 'sv_shell_user'
const THEME_KEY = 'sv_theme'
const LANG_KEY = 'sv_language'

export function isShellAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(SHELL_AUTH_KEY) === '1'
  } catch {
    return false
  }
}

export function getShellUser(): string {
  try {
    return sessionStorage.getItem(SHELL_USER_KEY) || ''
  } catch {
    return ''
  }
}

// The legacy shell is a static page at the site root (index.html) — there is
// no React route for it. An unauthenticated visit to /assessment/* sends the
// browser there directly (a real navigation, not a client-side route), the
// same way a hard refresh would land you back on modules/assessment.html's
// own (bypassed-when-embedded) login gate today.
export const SHELL_ENTRY_URL = '/index.html'

// Ported from logout() (js/app.js ~339-342): clears the same two session
// keys, then sends the browser to the shell so it boots straight to the
// login screen (index.html's own boot picks 'login' over 'landing' once
// sv_shell_auth is gone — see isAuthed()/showScreen() there). The shell's
// own logout button lived only on the now-unreachable #sv-dashboard screen
// (dead since Recruiting/Assessment became real top-level routes instead of
// iframes shown there), so this is what both React topbars call instead —
// same effect, reachable from wherever the user actually is.
export function logoutFromShell(): void {
  try {
    sessionStorage.removeItem(SHELL_AUTH_KEY)
    sessionStorage.removeItem(SHELL_USER_KEY)
  } catch {
    /* ignore */
  }
  window.location.href = SHELL_ENTRY_URL
}

// Ported from buildAssignmentLink() (js/assessment.js ~6778-6780). Legacy
// builds the link against the CURRENT page's own URL (one shared
// modules/assessment.html for both normal nav and the ?evalToken= takeover);
// React's evaluator flow lives at its own dedicated route instead, so the
// link points there explicitly rather than reusing location.pathname.
export function buildAssignmentLink(token: string): string {
  return `${window.location.origin}/assessment/evaluate?evalToken=${token}`
}

export function readSharedTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}
export function writeSharedTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function readSharedLang(): 'it' | 'en' {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'it'
  } catch {
    return 'it'
  }
}
export function writeSharedLang(lang: 'it' | 'en'): void {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* ignore */
  }
}

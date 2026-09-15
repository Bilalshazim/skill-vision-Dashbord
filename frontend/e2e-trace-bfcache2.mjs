import { chromium } from 'playwright'

const BASE = 'http://localhost:8300'

function decodeJwt(token) {
  const payload = token.split('.')[1]
  const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
  return JSON.parse(json)
}

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

async function dump(label) {
  const state = await page.evaluate(() => ({
    shellUser: sessionStorage.getItem('sv_shell_user'),
    bridgedFor: localStorage.getItem('sv_backend_bridged_shell_user'),
    accessToken: localStorage.getItem('sv_backend_access_token'),
  }))
  const claims = state.accessToken ? decodeJwt(state.accessToken) : null
  console.log(`${label}: shellUser=${state.shellUser} bridgedFor=${state.bridgedFor} JWT.role=${claims?.role} url=${page.url()}`)
}

// 1. admin login -> real link click into Recruiting.
await page.goto(BASE + '/')
await page.fill('#sv-user', 'admin')
await page.fill('#sv-pass', 'admin123')
await page.click('#sv-login-form button[type="submit"]')
await page.waitForTimeout(500)
await page.click('[data-enter-module="recruiting"]')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(1000)
await dump('1. admin -> Recruiting (fresh)')

// 2. Browser BACK button -> shell (still same tab, sv_shell_auth still set
// from before -- this does NOT clear it, sessionStorage isn't versioned by
// history navigation).
await page.goBack()
await page.waitForTimeout(500)
await dump('2. back -> shell')

// 3. Log out and log in as roberto WITHOUT any further page.goto() calls
// (which would destroy the forward-history entry) -- purely by
// interacting with the already-loaded shell document.
await page.evaluate(() => {
  sessionStorage.removeItem('sv_shell_auth')
  sessionStorage.removeItem('sv_shell_user')
})
// isAuthed() is now false -- reload this SAME document via a soft re-render
// isn't available without a real API, so trigger the shell's own boot
// re-check by simulating what logout() does: showScreen('login'). Easiest
// faithful way: dispatch the shell's own logout button if present, else
// just reload this exact URL (still '/', not a new history entry beyond
// what's already there since we're already on '/').
await page.reload()
await page.waitForTimeout(300)
await page.fill('#sv-user', 'roberto')
await page.fill('#sv-pass', 'sv2024')
await page.click('#sv-login-form button[type="submit"]')
await page.waitForTimeout(500)
await dump('3. roberto login done (on shell doc)')

// 4. Browser FORWARD button -> back to the SAME /recruiting history entry
// visited in step 1 -- the genuine bfcache-restore test.
await page.goForward()
await page.waitForTimeout(1500)
await dump('4. forward -> Recruiting (bfcache?)')

await browser.close()

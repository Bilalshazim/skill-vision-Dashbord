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

// 1. Log in as admin, go to Recruiting via a REAL link click (matching
// enterDashboard()'s landing-card flow) rather than a scripted goto, so
// history entries are realistic.
await page.goto(BASE + '/')
await page.fill('#sv-user', 'admin')
await page.fill('#sv-pass', 'admin123')
await page.click('#sv-login-form button[type="submit"]')
await page.waitForTimeout(500)
await page.click('[data-enter-module="recruiting"]')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(1000)
await dump('1. admin -> Recruiting (fresh)')

// 2. Use the browser BACK button (not a scripted goto) to return to the shell.
await page.goBack()
await page.waitForTimeout(500)
await dump('2. back button -> shell')

// 3. Log out (React topbar's logoutFromShell equivalent) then log in as roberto.
await page.evaluate(() => {
  sessionStorage.removeItem('sv_shell_auth')
  sessionStorage.removeItem('sv_shell_user')
})
await page.goto(BASE + '/index.html')
await page.waitForTimeout(300)
await page.fill('#sv-user', 'roberto')
await page.fill('#sv-pass', 'sv2024')
await page.click('#sv-login-form button[type="submit"]')
await page.waitForTimeout(500)
await dump('3. roberto shell login done (still on shell doc)')

// 4. Now use the browser FORWARD button instead of a fresh link click —
// this is the classic bfcache-restore trigger: Chromium may resurrect the
// EXACT PREVIOUS /recruiting page instance (with its admin-bridged JS
// state already in memory) instead of a fresh navigation + remount.
await page.goForward()
await page.waitForTimeout(1500)
await dump('4. forward button -> Recruiting (POTENTIAL bfcache restore)')

await browser.close()

import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'

function decodeJwt(token) {
  const payload = token.split('.')[1]
  const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
  return JSON.parse(json)
}

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

async function dumpBackendSession(label) {
  const state = await page.evaluate(() => ({
    shellAuth: sessionStorage.getItem('sv_shell_auth'),
    shellUser: sessionStorage.getItem('sv_shell_user'),
    bridgedFor: localStorage.getItem('sv_backend_bridged_shell_user'),
    accessToken: localStorage.getItem('sv_backend_access_token'),
    backendUser: localStorage.getItem('sv_backend_user'),
  }))
  console.log(`\n=== ${label} ===`)
  console.log('shellUser (sessionStorage):', state.shellUser)
  console.log('bridgedFor (localStorage):', state.bridgedFor)
  console.log('backendUser (localStorage):', state.backendUser)
  if (state.accessToken) {
    console.log('JWT claims:', JSON.stringify(decodeJwt(state.accessToken)))
  } else {
    console.log('no access token')
  }
  return state
}

// 1. Real shell login as "admin" via the actual DOM form.
await page.goto(BASE + '/')
await page.fill('#sv-user', 'admin')
await page.fill('#sv-pass', 'admin123')
await page.click('#sv-login-form button[type="submit"]')
await page.waitForTimeout(500)

// 2. Real top-level navigation into Recruiting, exactly as enterDashboard() does.
await page.goto(BASE + '/recruiting')
await page.waitForTimeout(1500)
await dumpBackendSession('AFTER admin login -> /recruiting')

// 3. Log out via the same mechanism the React topbar's logout button uses
// (logoutFromShell(): clear sv_shell_auth/sv_shell_user, navigate to /index.html).
await page.evaluate(() => {
  sessionStorage.removeItem('sv_shell_auth')
  sessionStorage.removeItem('sv_shell_user')
})
await page.goto(BASE + '/index.html')
await page.waitForTimeout(300)

// 4. Real shell login as "roberto".
await page.fill('#sv-user', 'roberto')
await page.fill('#sv-pass', 'sv2024')
await page.click('#sv-login-form button[type="submit"]')
await page.waitForTimeout(500)

// 5. Real top-level navigation into Recruiting again.
await page.goto(BASE + '/recruiting')
await page.waitForTimeout(1500)
const afterRoberto = await dumpBackendSession('AFTER roberto login -> /recruiting')

await browser.close()

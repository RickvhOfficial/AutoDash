/**
 * Responsive audit: viewport checks at 375px and 768px for all routes.
 * Run with dev server: npm run dev (default http://localhost:5173)
 * Usage: node scripts/responsive-audit.mjs [baseUrl]
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/races', name: 'Racekalender' },
  { path: '/standings', name: 'Standen' },
  { path: '/weather', name: 'Circuit Weer' },
  { path: '/vehicles', name: 'Voertuig Zoeker' },
  { path: '/lap-tracker', name: 'Karttijden' },
]
const VIEWPORTS = [
  { width: 375, height: 667, label: '375px (iPhone SE)' },
  { width: 768, height: 1024, label: '768px (iPad)' },
]

async function pageOverflow(page) {
  return page.evaluate(() => {
    const el = document.documentElement
    const overflow = el.scrollWidth - el.clientWidth
    const bodyOverflow = document.body.scrollWidth - document.body.clientWidth
    return {
      docOverflow: overflow,
      bodyOverflow,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }
  })
}

async function waitForApp(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(800)
}

const results = []
let hasFailure = false

async function record(check, pass, detail = '') {
  results.push({ check, pass, detail })
  if (!pass) hasFailure = true
  const icon = pass ? 'PASS' : 'FAIL'
  console.log(`[${icon}] ${check}${detail ? ` — ${detail}` : ''}`)
}

async function auditRoute(page, route, viewport) {
  const tag = `${route.name} @ ${viewport.label}`
  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await waitForApp(page)

  const closed = await pageOverflow(page)
  const closedOk = closed.docOverflow <= 1
  await record(
    `${tag} — geen pagina-overflow (menu dicht)`,
    closedOk,
    closedOk ? `Δ=${closed.docOverflow}px` : `scrollWidth ${closed.scrollWidth} > clientWidth ${closed.clientWidth}`,
  )

  const menuBtn = page.getByRole('button', { name: 'Menu openen' })
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click()
    await page.waitForTimeout(400)
    const open = await pageOverflow(page)
    const openOk = open.docOverflow <= 1
    await record(
      `${tag} — geen pagina-overflow (menu open)`,
      openOk,
      openOk ? `Δ=${open.docOverflow}px` : `Δ=${open.docOverflow}px`,
    )
    const nav = page.getByRole('dialog', { name: 'Hoofdnavigatie' })
    const navVisible = await nav.isVisible().catch(() => false)
    await record(`${tag} — hamburger opent navigatie`, navVisible)
    if (navVisible) {
      const closeBtn = page.getByRole('button', { name: 'Menu sluiten' })
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click()
      } else {
        await page.keyboard.press('Escape').catch(() => {})
      }
      await page.waitForTimeout(300)
    }
  } else {
    await record(`${tag} — hamburger (alleen <lg)`, true, 'niet zichtbaar op desktop')
  }

  if (route.path === '/weather') {
    await page.goto(`${BASE}/weather`, { waitUntil: 'domcontentloaded' })
    await waitForApp(page)
    const dropdown = page.locator('button[aria-haspopup="listbox"]').first()
    if (await dropdown.isVisible().catch(() => false)) {
      await dropdown.click()
      await page.waitForTimeout(300)
      const listbox = page.locator('[role="listbox"]').first()
      await record(`${tag} — circuit dropdown opent`, await listbox.isVisible().catch(() => false))
      const afterDrop = await pageOverflow(page)
      await record(
        `${tag} — geen pagina-overflow (dropdown open)`,
        afterDrop.docOverflow <= 1,
        `Δ=${afterDrop.docOverflow}px`,
      )
    }
  }

  if (route.path === '/lap-tracker') {
    await page.goto(`${BASE}/lap-tracker`, { waitUntil: 'domcontentloaded' })
    await waitForApp(page)
    const trackInput = page.getByPlaceholder('Kies of typ baannaam')
    await record(`${tag} — formulier zichtbaar`, await trackInput.isVisible().catch(() => false))
    const form = page.locator('form').filter({ has: trackInput })
    const formBox = await form.boundingBox().catch(() => null)
    if (formBox) {
      const formFullWidth = formBox.width >= viewport.width * 0.85
      await record(
        `${tag} — formulier ~volle breedte`,
        formFullWidth,
        `breedte ${Math.round(formBox.width)}px / viewport ${viewport.width}px`,
      )
    }
  }
}

async function main() {
  let browser
  try {
    browser = await chromium.launch({ headless: true })
  } catch (err) {
    console.error('Playwright niet beschikbaar. Installeer: npx playwright install chromium')
    process.exit(2)
  }

  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(BASE, { timeout: 10000 })
  } catch {
    console.error(`Kan ${BASE} niet bereiken. Start eerst: cd autodash && npm run dev`)
    await browser.close()
    process.exit(2)
  }

  for (const viewport of VIEWPORTS) {
    console.log(`\n=== Viewport: ${viewport.label} ===\n`)
    for (const route of ROUTES) {
      await auditRoute(page, route, viewport)
    }
  }

  await browser.close()

  console.log('\n=== Samenvatting ===')
  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass)
  console.log(`${passed}/${results.length} checks geslaagd`)
  if (failed.length) {
    console.log('\nGefaalde checks:')
    failed.forEach((f) => console.log(`  - ${f.check}: ${f.detail}`))
  }
  process.exit(hasFailure ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})

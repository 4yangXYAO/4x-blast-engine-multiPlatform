import { chromium } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'

chromium.use(stealth())

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('https://bot.sannysoft.com')
  const content = await page.content()
  console.log('Stealth Page Loaded, length:', content.length)
  await browser.close()
}

run().catch(console.error)

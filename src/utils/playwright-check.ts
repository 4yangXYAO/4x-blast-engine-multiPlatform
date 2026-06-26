import { chromium } from 'playwright'

const DISCOVERY_NAV_TIMEOUT_MS = 60_000
const DISCOVERY_PAGE_WAIT_MS = 3_000

/**
 * Returns true when Playwright Chromium binary is available on this machine.
 */
export function isPlaywrightChromiumInstalled(): boolean {
  try {
    const executable = chromium.executablePath()
  return !!executable
  } catch {
    return false
  }
}

/**
 * Throws a clear error if Chromium is missing (call before browser launch).
 */
export function assertPlaywrightChromiumInstalled(): void {
  if (isPlaywrightChromiumInstalled()) return
  throw new Error(
    'Playwright Chromium is not installed. Run: npm run playwright:install ' +
      '(or npm install to trigger postinstall)'
  )
}

export { DISCOVERY_NAV_TIMEOUT_MS, DISCOVERY_PAGE_WAIT_MS }

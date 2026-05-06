import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { parseCookies } from '../src/utils/http-client';

chromium.use(stealth());

async function main() {
  const cookieInput = process.argv[2];
  if (!cookieInput) {
    console.log('Provide cookie json');
    return;
  }
  let rawCookies;
  try {
    rawCookies = JSON.parse(cookieInput);
  } catch (e) {
    console.error('Must be valid JSON cookies from EditThisCookie or similar');
    return;
  }
  
  // Format cookies for Playwright
  const pwCookies = rawCookies.map((c: any) => ({
    name: c.name,
    value: c.value,
    domain: c.domain.startsWith('.') ? c.domain : `.${c.domain}`,
    path: c.path || '/',
    secure: c.secure !== false,
    httpOnly: c.httpOnly || false,
    sameSite: c.sameSite === 'no_restriction' ? 'None' : (c.sameSite || 'Lax'),
  }));

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies(pwCookies);
  
  const page = await context.newPage();
  console.log('Navigating to facebook...');
  await page.goto('https://www.facebook.com/messages/t/');
  
  console.log('Waiting for load...');
  await page.waitForTimeout(5000);
  const title = await page.title();
  console.log('Page Title:', title);
  
  await page.screenshot({ path: 'fb_pw_test.png' });
  console.log('Screenshot saved.');

  await browser.close();
}

main().catch(console.error);

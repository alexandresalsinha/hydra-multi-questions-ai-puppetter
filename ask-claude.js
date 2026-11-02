// Opens claude.ai in a real Chrome window, asks a question in the chat,
// and leaves the browser open so you can read the response.
//
// Usage:
//   npm install
//   npm start
//
// First run: a browser window opens to claude.ai. If you aren't logged in,
// log in manually in that window - the script waits for you. Your session
// is saved in the "chrome-profile" folder next to this script, so future
// runs stay logged in.

const puppeteer = require('puppeteer');
const path = require('path');

const QUESTION = 'Who is the president of Portugal?';
const PROFILE_DIR = path.join(__dirname, 'chrome-profile');
const INPUT_SELECTOR = 'div[contenteditable="true"]';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForLogin(page) {
  // If claude.ai redirects to a login/auth page, pause here until the user
  // finishes logging in and lands back on a claude.ai chat page.
  while (true) {
    const url = page.url();
    const onLogin = /login|auth/i.test(url);
    if (!onLogin) {
      const hasInput = await page.$(INPUT_SELECTOR);
      if (hasInput) return;
    }
    console.log('Waiting for you to log in to claude.ai in the opened browser window...');
    await sleep(2000);
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    channel: 'chrome',
    userDataDir: PROFILE_DIR,
    defaultViewport: null,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  console.log('Navigating to claude.ai ...');
  await page.goto('https://claude.ai/new', { waitUntil: 'domcontentloaded' });

  await waitForLogin(page);

  console.log('Waiting for the chat input box...');
  await page.waitForSelector(INPUT_SELECTOR, { visible: true, timeout: 60000 });

  console.log(`Typing question: "${QUESTION}"`);
  await page.click(INPUT_SELECTOR);
  await page.type(INPUT_SELECTOR, QUESTION, { delay: 30 });

  await page.keyboard.press('Enter');

  console.log('Question submitted. Leaving the browser open so you can read the response...');
  console.log('Press Ctrl+C in this terminal when you want to stop the script (the browser window will stay open).');

  // Keep the Node process alive without closing the browser.
  await new Promise(() => {});
})().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

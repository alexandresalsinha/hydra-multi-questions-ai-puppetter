// Shared helper for the ask-*.js scripts: launches a real Chrome window
// with automation fingerprints hidden, waits for login + chat input,
// types a question, submits it, and leaves the browser open.

const puppeteer = require('puppeteer');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSite({ name, url, profileDir, question, inputSelectors, afterTypeKey = 'Enter' }) {
  const browser = await puppeteer.launch({
    headless: false,
    channel: 'chrome',
    userDataDir: profileDir,
    defaultViewport: null,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  console.log(`Navigating to ${name} (${url}) ...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  console.log(`Waiting for the ${name} chat input (log in manually in the opened window if prompted)...`);
  let selectorFound = null;
  while (!selectorFound) {
    for (const sel of inputSelectors) {
      const el = await page.$(sel);
      if (el) {
        selectorFound = sel;
        break;
      }
    }
    if (!selectorFound) {
      console.log(`Still waiting for ${name} chat input / login...`);
      await sleep(2000);
    }
  }

  console.log(`Typing question into ${name}: "${question}"`);
  await page.click(selectorFound);
  await page.type(selectorFound, question, { delay: 30 });
  await page.keyboard.press(afterTypeKey);

  console.log('Question submitted. Leaving the browser open so you can read the response...');
  console.log('Press Ctrl+C in this terminal to stop the script (the browser window stays open).');

  // Keep the Node process alive without closing the browser.
  await new Promise(() => {});
}

module.exports = { runSite, sleep };

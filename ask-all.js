// Opens Claude, ChatGPT, Gemini, and Perplexity each in their own tab of a
// single Chrome window, types the given question into each, and leaves the
// browser open so you can read the responses.
//
// Usage:
//   npm install
//   node ask-all.js "Who is the president of Portugal?"
//   (or: npm start -- "Who is the president of Portugal?")
//
// If no question is given on the command line, a default question is used.
// Log in manually in any tab that asks for it - the script just waits.
// The session is saved in the "chrome-profile" folder next to this script,
// so future runs stay logged in.

const path = require('path');
const puppeteer = require('puppeteer');

const PROFILE_DIR = path.join(__dirname, 'chrome-profile');
const DEFAULT_QUESTION = 'Who is the president of Portugal?';
const question = process.argv.slice(2).join(' ').trim() || DEFAULT_QUESTION;

const SITES = [
  {
    name: 'Claude',
    url: 'https://claude.ai/new',
    inputSelectors: ['div[contenteditable="true"]'],
  },
  {
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    inputSelectors: ['#prompt-textarea', 'div[contenteditable="true"]', 'textarea'],
  },
  {
    name: 'Gemini',
    url: 'https://gemini.google.com/app',
    inputSelectors: [
      'div.ql-editor[contenteditable="true"]',
      'rich-textarea div[contenteditable="true"]',
      'div[contenteditable="true"]',
    ],
  },
  {
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    inputSelectors: ['textarea[placeholder="Ask anything..."]', 'textarea', 'div[contenteditable="true"]'],
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function askInTab(page, { name, url, inputSelectors }) {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  console.log(`[${name}] Navigating to ${url} ...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  console.log(`[${name}] Waiting for chat input (log in manually in this tab if prompted)...`);
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
      await sleep(2000);
    }
  }

  console.log(`[${name}] Typing question: "${question}"`);
  await page.bringToFront();
  await page.click(selectorFound);
  await page.type(selectorFound, question, { delay: 30 });
  await page.keyboard.press('Enter');
  console.log(`[${name}] Question submitted.`);
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

  const [firstPage] = await browser.pages();
  const pages = [firstPage];
  for (let i = 1; i < SITES.length; i++) {
    pages.push(await browser.newPage());
  }

  await Promise.all(
    SITES.map((site, i) =>
      askInTab(pages[i], site).catch((err) => {
        console.error(`[${site.name}] failed:`, err.message);
      })
    )
  );

  console.log('\nAll done. Leaving the browser open so you can read the responses.');
  console.log('Press Ctrl+C in this terminal to stop the script (the browser window stays open).');

  // Keep the Node process alive without closing the browser.
  await new Promise(() => {});
})().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

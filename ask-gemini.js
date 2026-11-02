const path = require('path');
const { runSite } = require('./common');

runSite({
  name: 'Gemini',
  url: 'https://gemini.google.com/app',
  profileDir: path.join(__dirname, 'chrome-profile-gemini'),
  question: 'Who is the president of Portugal?',
  inputSelectors: [
    'div.ql-editor[contenteditable="true"]',
    'rich-textarea div[contenteditable="true"]',
    'div[contenteditable="true"]',
  ],
}).catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

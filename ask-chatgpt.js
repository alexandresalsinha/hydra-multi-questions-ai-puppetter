const path = require('path');
const { runSite } = require('./common');

runSite({
  name: 'ChatGPT',
  url: 'https://chatgpt.com/',
  profileDir: path.join(__dirname, 'chrome-profile-chatgpt'),
  question: 'Who is the president of Portugal?',
  inputSelectors: ['#prompt-textarea', 'div[contenteditable="true"]', 'textarea'],
}).catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

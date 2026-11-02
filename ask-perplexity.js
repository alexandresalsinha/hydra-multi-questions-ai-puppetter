const path = require('path');
const { runSite } = require('./common');

runSite({
  name: 'Perplexity',
  url: 'https://www.perplexity.ai/',
  profileDir: path.join(__dirname, 'chrome-profile-perplexity'),
  question: 'Who is the president of Portugal?',
  inputSelectors: ['textarea[placeholder="Ask anything..."]', 'textarea', 'div[contenteditable="true"]'],
}).catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

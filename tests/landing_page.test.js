const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('index.html provides public Purworejo clinic catalogue and AI widget mount point', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  // Title and branding
  assert.match(html, /SIMKLINIK Purworejo/i);

  // Explorer components
  assert.match(html, /id=["']public-clinic-explorer["']/i);
  assert.match(html, /id=["']district-filter-public["']/i);

  // Link to login
  assert.match(html, /href=["']login\.html["']/i);

  // AI Widget integration
  assert.match(html, /aiChatWidget\.js/i);
});

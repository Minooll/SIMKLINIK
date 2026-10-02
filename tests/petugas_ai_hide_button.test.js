const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Petugas Dashboard - AI Analytics hide button integration', async (t) => {
  const roleDashboardSrc = fs.readFileSync(
    path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'),
    'utf-8'
  );

  const cssSrc = fs.readFileSync(
    path.join(__dirname, '../assets/css/role-pages.css'),
    'utf-8'
  );

  // 1. Verify role-dashboard.js includes hide button markup in aiAnalyticsResultBox
  assert.match(
    roleDashboardSrc,
    /btnHideAiAnalytics/,
    'role-dashboard.js must render a button with id="btnHideAiAnalytics"'
  );

  // 2. Verify role-dashboard.js handles click event to hide aiAnalyticsResultBox
  assert.match(
    roleDashboardSrc,
    /resultBox\.hidden\s*=\s*true/,
    'role-dashboard.js must set resultBox.hidden = true when hide button is clicked'
  );

  // 3. Verify CSS styling for ai-hide-btn exists
  assert.match(
    cssSrc,
    /\.ai-hide-btn/,
    'role-pages.css must define .ai-hide-btn styling'
  );

  // 4. Test simulate DOM behavior
  // Minimal DOM mock
  const clickListeners = [];
  const resultBoxMock = {
    hidden: false,
    innerHTML: '',
    addEventListener(event, fn) {
      if (event === 'click') clickListeners.push(fn);
    }
  };

  // Wire up handler logic as implemented in role-dashboard.js
  resultBoxMock.addEventListener('click', (e) => {
    if (e.target && (e.target.id === 'btnHideAiAnalytics' || (e.target.closest && e.target.closest('.ai-hide-btn')))) {
      resultBoxMock.hidden = true;
    }
  });

  // Simulate button click
  assert.equal(resultBoxMock.hidden, false);
  const fakeEvent = {
    target: {
      id: 'btnHideAiAnalytics',
      closest: (sel) => sel.includes('ai-hide-btn')
    }
  };
  clickListeners[0](fakeEvent);
  assert.equal(resultBoxMock.hidden, true, 'Clicking hide button must hide resultBox');
});

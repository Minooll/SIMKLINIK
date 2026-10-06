const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Project Structure conforms to ARCHITECTURE.md Section 2', () => {
  const baseDir = path.join(__dirname, '..');

  // Verify necessary clean directory structure exists
  const requiredDirs = [
    'assets/css',
    'assets/js/auth',
    'assets/js/components',
    'assets/js/services',
    'config',
    'docs',
    'tests'
  ];

  for (const dir of requiredDirs) {
    assert.ok(fs.existsSync(path.join(baseDir, dir)), `Directory must exist: ${dir}`);
  }

  // Verify obsolete directories are removed
  assert.ok(!fs.existsSync(path.join(baseDir, 'api')), 'Legacy api directory should be removed');
  assert.ok(!fs.existsSync(path.join(baseDir, 'scratch')), 'Legacy scratch directory should be removed');
  assert.ok(!fs.existsSync(path.join(baseDir, 'assets/js/dashboard')), 'Legacy dashboard directory should be removed');

  // Verify docs integrity preserved
  assert.ok(fs.existsSync(path.join(baseDir, 'docs/PRD.md')), 'docs/PRD.md must be preserved');
  assert.ok(fs.existsSync(path.join(baseDir, 'docs/ARCHITECTURE.md')), 'docs/ARCHITECTURE.md must be preserved');
});

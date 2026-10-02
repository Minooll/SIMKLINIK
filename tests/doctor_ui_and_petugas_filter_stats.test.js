const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Petugas Dashboard - Filter modes preserve interactive stat cards', async (t) => {
  const roleDashboardSrc = fs.readFileSync(
    path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'),
    'utf-8'
  );

  // When mode === 'dokter', cards must be interactive
  const dokterModeMatch = roleDashboardSrc.match(/if\s*\(\s*mode\s*===\s*'dokter'\s*\)\s*\{([\s\S]*?)else\s*if\s*\(\s*mode\s*===\s*'pasien'\s*\)/);
  assert.ok(dokterModeMatch, 'Must find mode === "dokter" block in role-dashboard.js');
  assert.match(
    dokterModeMatch[1],
    /stat-card--interactive/,
    'Stat cards in dokter filter mode must include stat-card--interactive'
  );
  assert.match(
    dokterModeMatch[1],
    /openFullAgendaPetugasModal/,
    'Stat cards in dokter filter mode must connect to openFullAgendaPetugasModal'
  );

  // When mode === 'pasien', cards must be interactive
  const pasienModeMatch = roleDashboardSrc.match(/else\s*if\s*\(\s*mode\s*===\s*'pasien'\s*\)\s*\{([\s\S]*?)else\s*if\s*\(\s*mode\s*===\s*'antrean'\s*\)/);
  assert.ok(pasienModeMatch, 'Must find mode === "pasien" block in role-dashboard.js');
  assert.match(
    pasienModeMatch[1],
    /stat-card--interactive/,
    'Stat cards in pasien filter mode must include stat-card--interactive'
  );
  assert.match(
    pasienModeMatch[1],
    /openFullDataPetugasModal/,
    'Stat cards in pasien filter mode must connect to openFullDataPetugasModal'
  );
});

test('Doctor Dashboard - CSS alignment and consistent styling', async (t) => {
  const dashboardCss = fs.readFileSync(
    path.join(__dirname, '../assets/css/dashboard.css'),
    'utf-8'
  );
  const rolePagesCss = fs.readFileSync(
    path.join(__dirname, '../assets/css/role-pages.css'),
    'utf-8'
  );

  // Check stat card flex column layout for height uniformity
  assert.match(
    dashboardCss,
    /display:\s*flex;\s*flex-direction:\s*column;\s*justify-content:\s*space-between/,
    'stat-card must use flex-direction column with space-between for uniform card heights'
  );

  // Check vertical-align middle on table cells
  assert.match(
    dashboardCss,
    /vertical-align:\s*middle/,
    'dashboard.css must apply vertical-align: middle on table cells for clean row alignment'
  );

  // Check doctor-selector-wrap alignment & styling
  assert.match(
    rolePagesCss,
    /\.doctor-selector-wrap/,
    'role-pages.css must define .doctor-selector-wrap'
  );
});

test('Doctor Dashboard - Insight panel enrichment', async (t) => {
  const roleDashboardSrc = fs.readFileSync(
    path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'),
    'utf-8'
  );

  // Check that dokter insight content includes quota and RME status indicators
  assert.match(
    roleDashboardSrc,
    /SATUSEHAT|Permenkes 24\/2022|Kapasitas Kuota/,
    'Doctor insight panel must display rich clinical indicators (quota/RME/SATUSEHAT)'
  );
});

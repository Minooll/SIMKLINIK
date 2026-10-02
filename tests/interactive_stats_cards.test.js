const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Stats Grid - Verified removed from pasien.html', async (t) => {
  const pasienHtml = fs.readFileSync(
    path.join(__dirname, '../pasien.html'),
    'utf-8'
  );

  assert.doesNotMatch(
    pasienHtml,
    /<section[^>]*id=["']statsGrid["'][^>]*>/,
    'pasien.html must NOT contain section id="statsGrid"'
  );
});

test('Stats Grid - Petugas stat cards are clickable with interactive details', async (t) => {
  const roleDashboardSrc = fs.readFileSync(
    path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'),
    'utf-8'
  );

  // Check that petugas stat cards have click handlers / data-target-view or navigation
  assert.match(
    roleDashboardSrc,
    /data-target-view|navigatePetugasView|openPetugasStatDetail/,
    'role-dashboard.js must provide click handling or view navigation for petugas stat cards'
  );

  // Check that visual detail hint / action indicator exists
  assert.match(
    roleDashboardSrc,
    /stat-action-hint|Lihat detail/,
    'Stat cards must include an action indicator (e.g. Lihat detail)'
  );
});

test('Stats Grid - Dokter stat cards are clickable with modal/view triggers', async (t) => {
  const roleDashboardSrc = fs.readFileSync(
    path.join(__dirname, '../assets/js/dashboard/role-dashboard.js'),
    'utf-8'
  );

  // Check that dokter stat cards are wired to open modals/views
  assert.match(
    roleDashboardSrc,
    /openFullAgendaDokterModal/,
    'Dokter stat cards must be able to trigger openFullAgendaDokterModal'
  );
  assert.match(
    roleDashboardSrc,
    /openFullMedicalDokterModal/,
    'Dokter stat cards must be able to trigger openFullMedicalDokterModal'
  );
});

test('CSS - Interactive stat cards styling', async (t) => {
  const dashboardCss = fs.readFileSync(
    path.join(__dirname, '../assets/css/dashboard.css'),
    'utf-8'
  );

  assert.match(
    dashboardCss,
    /\.stat-card--interactive|\.stat-card\[data-target|\.stat-action-hint/,
    'dashboard.css or role-pages.css must define interactive stat card classes'
  );
});

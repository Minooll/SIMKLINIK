const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('UI Components and Design System stylesheets exist and define required elements', () => {
  const modalCss = fs.readFileSync(path.join(__dirname, '../assets/css/modal.css'), 'utf8');
  const dashCss = fs.readFileSync(path.join(__dirname, '../assets/css/dashboard.css'), 'utf8');
  const roleCss = fs.readFileSync(path.join(__dirname, '../assets/css/role-pages.css'), 'utf8');
  const modalJs = fs.readFileSync(path.join(__dirname, '../assets/js/components/modal.js'), 'utf8');
  const toastJs = fs.readFileSync(path.join(__dirname, '../assets/js/components/toast.js'), 'utf8');

  assert.match(dashCss, /--primary/i, 'dashboard.css must define color tokens');
  assert.match(modalCss, /\.modal-backdrop|\.modal-container/i, 'modal.css must style modals');
  assert.match(roleCss, /\.clinic-card|\.queue-badge/i, 'role-pages.css must style clinic cards & queues');
  assert.match(modalJs, /showModal|closeModal|initModal/i, 'modal.js must export modal helpers');
  assert.match(toastJs, /showToast/i, 'toast.js must export showToast helper');
});

test('Toast and Modal module exports are valid in Node/CommonJS', () => {
  const { showModal, closeModal } = require('../assets/js/components/modal.js');
  const { showToast } = require('../assets/js/components/toast.js');

  assert.ok(typeof showModal === 'function');
  assert.ok(typeof closeModal === 'function');
  assert.ok(typeof showToast === 'function');
});

test('SIMKlinik logo icon blends ramah, higienis, sistem and is integrated across all 5 pages', () => {
  const logoPath = path.join(__dirname, '../assets/images/logo-simklinik-icon.svg');
  assert.ok(fs.existsSync(logoPath), 'logo-simklinik-icon.svg must exist');
  const logoSvg = fs.readFileSync(logoPath, 'utf8');
  assert.match(logoSvg, /<svg/i, 'logo must be valid SVG');
  assert.match(logoSvg, /gradient|path|circle/i, 'logo must contain vector elements');

  const pages = ['index.html', 'login.html', 'pasien.html', 'dokter.html', 'pemilik.html'];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    assert.match(
      html,
      /logo-simklinik-icon\.svg/i,
      `${page} must display logo-simklinik-icon.svg to the left of SIMKLINIK`
    );
  }

  // Deep-layer booking UI elements in pasien.html
  const pasienHtml = fs.readFileSync(path.join(__dirname, '../pasien.html'), 'utf8');
  assert.match(pasienHtml, /doctor-preview-box/i, 'pasien.html must include rich doctor preview box');
  assert.match(pasienHtml, /quick-chip-group/i, 'pasien.html must include quick date selection chips');
  assert.match(pasienHtml, /time-slot-pill/i, 'pasien.html must include time slot pill buttons');
  assert.match(pasienHtml, /booking-summary-card/i, 'pasien.html must include live booking summary card');
});

test('Modal and booking dialog enforce vertical scrolling and flex bounding', () => {
  const modalCss = fs.readFileSync(path.join(__dirname, '../assets/css/modal.css'), 'utf8');
  const roleCss = fs.readFileSync(path.join(__dirname, '../assets/css/role-pages.css'), 'utf8');
  const pasienHtml = fs.readFileSync(path.join(__dirname, '../pasien.html'), 'utf8');

  // modal.css must contain rules for form inside modal-container
  assert.match(modalCss, /\.modal-container\s*>\s*form|\.modal-form/i, 'modal.css must style modal form with flex');
  assert.match(modalCss, /min-height:\s*0/i, 'modal form/body must include min-height: 0 for proper flex scroll');
  assert.match(modalCss, /overflow-y:\s*auto/i, 'modal-body must enable overflow-y: auto');
  assert.match(modalCss, /::-webkit-scrollbar/i, 'modal-body must include custom scrollbar styling');

  // role-pages.css must explicitly ensure #modal-booking .modal-body scrolls
  assert.match(roleCss, /#modal-booking\s+\.modal-body/i, 'role-pages.css must ensure #modal-booking body scrolls');

  // pasien.html must use modal-form class on booking-form
  assert.match(pasienHtml, /id="booking-form"\s+class="modal-form"/i, 'booking-form must have class modal-form');
});



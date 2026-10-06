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

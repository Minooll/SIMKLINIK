const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const mdPath = path.join(rootDir, 'prd.md');
const tempBodyPath = path.join(rootDir, 'temp_body.html');
const outHtmlPath = path.join(rootDir, 'prd_presentation.html');
const outPdfPath = path.join(rootDir, 'prd.pdf');
const copyPdfPath = path.join(rootDir, 'simklinik-login', 'prd.pdf');

console.log('1. Converting prd.md to HTML with marked...');
execSync(`npx --yes marked "${mdPath}" -o "${tempBodyPath}"`, { stdio: 'inherit' });

const rawBody = fs.readFileSync(tempBodyPath, 'utf8');

// Build enhanced HTML template with Cover Page, Table of Contents, and Custom Styling
const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRD - Sistem Informasi Manajemen Klinik (SIMKLINIK)</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Mermaid.js for rendering diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", async () => {
      // Find all language-mermaid blocks and convert them to mermaid divs
      const codeBlocks = document.querySelectorAll('pre code.language-mermaid');
      codeBlocks.forEach((code) => {
        const pre = code.parentElement;
        const div = document.createElement('div');
        div.className = 'mermaid-container';
        div.innerHTML = '<div class="mermaid">' + code.textContent + '</div>';
        pre.parentNode.insertBefore(div, pre);
        pre.remove();
      });

      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        themeVariables: {
          primaryColor: '#e0f2fe',
          primaryTextColor: '#0369a1',
          primaryBorderColor: '#38bdf8',
          lineColor: '#0284c7',
          secondaryColor: '#f0fdf4',
          tertiaryColor: '#f8fafc'
        },
        flowchart: { curve: 'basis' }
      });
      
      try {
        await mermaid.run();
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
      
      document.body.classList.add('mermaid-ready');
    });
  </script>

  <style>
    :root {
      --primary: #0284c7;
      --primary-dark: #0369a1;
      --primary-light: #e0f2fe;
      --navy: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-200: #e2e8f0;
      --slate-100: #f1f5f9;
      --slate-50: #f8fafc;
      --emerald: #059669;
      --emerald-light: #d1fae5;
      --rose: #e11d48;
      --amber: #d97706;
      --amber-light: #fef3c7;
      --border-color: #cbd5e1;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--slate-800);
      background-color: #ffffff;
      line-height: 1.65;
      font-size: 10.5pt;
    }

    @page {
      size: A4 portrait;
      margin: 20mm 16mm 20mm 16mm;
      @bottom-right {
        content: "Halaman " counter(page);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: var(--slate-600);
      }
      @bottom-left {
        content: "SIMKLINIK - Dokumen Persyaratan Produk (PRD)";
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: var(--slate-600);
      }
    }

    /* Print Break Utilities */
    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* COVER PAGE */
    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 30mm 15mm 25mm 15mm;
      background: linear-gradient(145deg, #f0f9ff 0%, #ffffff 50%, #f8fafc 100%);
      page-break-after: always;
      position: relative;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      margin-bottom: 20mm;
    }

    .cover-top {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      width: 54px;
      height: 54px;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 800;
      box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.25);
    }

    .brand-title {
      font-size: 22pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--navy);
    }

    .brand-subtitle {
      font-size: 10pt;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .cover-middle {
      margin: 40px 0;
    }

    .doc-type-badge {
      display: inline-block;
      padding: 6px 14px;
      background-color: var(--primary-light);
      color: var(--primary-dark);
      font-size: 9.5pt;
      font-weight: 700;
      border-radius: 20px;
      margin-bottom: 16px;
      letter-spacing: 0.5px;
      border: 1px solid #bae6fd;
    }

    .doc-main-title {
      font-size: 32pt;
      font-weight: 800;
      color: var(--navy);
      line-height: 1.15;
      letter-spacing: -1px;
      margin-bottom: 16px;
    }

    .doc-description {
      font-size: 13pt;
      color: var(--slate-600);
      line-height: 1.5;
      max-width: 600px;
    }

    .cover-meta-card {
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px 24px;
      font-size: 9.5pt;
    }

    .meta-item strong {
      color: var(--slate-700);
      display: inline-block;
      width: 140px;
    }

    .meta-item span {
      color: var(--navy);
      font-weight: 600;
    }

    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--slate-200);
      padding-top: 18px;
      font-size: 8.5pt;
      color: var(--slate-600);
    }

    /* TYPOGRAPHY */
    h1, h2, h3, h4, h5, h6 {
      color: var(--navy);
      font-weight: 700;
      line-height: 1.3;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 18pt;
      border-bottom: 2px solid var(--primary-light);
      padding-bottom: 8px;
      margin-top: 28px;
      margin-bottom: 14px;
      color: var(--navy);
    }

    h2 {
      font-size: 14pt;
      margin-top: 24px;
      margin-bottom: 10px;
      color: var(--primary-dark);
      border-left: 4px solid var(--primary);
      padding-left: 10px;
    }

    h3 {
      font-size: 11.5pt;
      margin-top: 18px;
      margin-bottom: 8px;
      color: var(--slate-800);
    }

    h4 {
      font-size: 10.5pt;
      margin-top: 14px;
      margin-bottom: 6px;
      color: var(--slate-700);
    }

    p {
      margin-bottom: 10px;
      text-align: justify;
    }

    ul, ol {
      margin-bottom: 12px;
      padding-left: 22px;
    }

    li {
      margin-bottom: 5px;
    }

    hr {
      border: none;
      border-top: 1px solid var(--slate-200);
      margin: 24px 0;
    }

    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 20px 0;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: 8px;
      overflow: hidden;
    }

    th {
      background-color: var(--slate-100);
      color: var(--navy);
      font-weight: 700;
      text-align: left;
      padding: 9px 12px;
      border-bottom: 2px solid var(--slate-200);
      border-right: 1px solid var(--slate-200);
    }

    th:last-child {
      border-right: none;
    }

    td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--slate-200);
      border-right: 1px solid var(--slate-200);
      vertical-align: top;
    }

    td:last-child {
      border-right: none;
    }

    tr:nth-child(even) td {
      background-color: #fafbfc;
    }

    /* CODE & MERMAID */
    pre {
      background-color: var(--slate-800);
      color: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8.5pt;
      line-height: 1.45;
      overflow-x: auto;
      margin: 14px 0;
      page-break-inside: avoid;
      break-inside: avoid;
      border: 1px solid var(--slate-700);
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 9pt;
      background-color: var(--slate-100);
      color: var(--primary-dark);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--slate-200);
    }

    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }

    .mermaid-container {
      background-color: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 10px;
      padding: 16px;
      margin: 18px 0;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .mermaid {
      display: flex;
      justify-content: center;
    }

    /* BLOCKQUOTES & CALLOUTS */
    blockquote {
      border-left: 4px solid var(--primary);
      background-color: var(--primary-light);
      padding: 12px 18px;
      margin: 14px 0;
      border-radius: 0 8px 8px 0;
      color: var(--navy);
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    /* BADGES */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 8pt;
      font-weight: 600;
    }

    .badge-success { background: var(--emerald-light); color: var(--emerald); }
    .badge-warning { background: var(--amber-light); color: var(--amber); }

    /* CHECKBOXES IN LIST */
    li input[type="checkbox"] {
      margin-right: 6px;
      vertical-align: middle;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-top">
      <div class="brand-logo">+</div>
      <div>
        <div class="brand-title">SIMKLINIK</div>
        <div class="brand-subtitle">Sistem Informasi Manajemen Klinik</div>
      </div>
    </div>

    <div class="cover-middle">
      <div class="doc-type-badge">PRODUCT REQUIREMENTS DOCUMENT (PRD)</div>
      <div class="doc-main-title">Spesifikasi Kebutuhan Sistem &amp; Desain Arsitektur Produksi</div>
      <p class="doc-description">
        Panduan komprehensif implementasi sistem operasional klinik terpadu: Autentikasi Multi-Role, Rekam Medis Elektronik (RME), Penjadwalan Dokter, Antrean Real-Time, E-Resep, Kasir, dan Keamanan PostgreSQL Row Level Security (RLS).
      </p>
    </div>

    <div class="cover-meta-card">
      <div class="cover-meta-grid">
        <div class="meta-item"><strong>Nomor Dokumen:</strong> <span>PRD-SIMKLINIK-2026-V1.1</span></div>
        <div class="meta-item"><strong>Tanggal Efektif:</strong> <span>22 September 2026</span></div>
        <div class="meta-item"><strong>Versi / Status:</strong> <span>Versi 1.1 / Approved for Implementation</span></div>
        <div class="meta-item"><strong>Target Rilis:</strong> <span>Minimum Viable Product (MVP)</span></div>
        <div class="meta-item"><strong>Platform:</strong> <span>Web Responsif (PWA Ready)</span></div>
        <div class="meta-item"><strong>Backend &amp; DB:</strong> <span>Supabase (PostgreSQL with RLS)</span></div>
        <div class="meta-item"><strong>Standar Regulasi:</strong> <span>Permenkes No. 24/2022 &amp; UU PDP 2022</span></div>
        <div class="meta-item"><strong>Pemilik Produk:</strong> <span>Tim Produk &amp; Rekayasa SIMKLINIK</span></div>
      </div>
    </div>

    <div class="cover-footer">
      <div>© 2026 SIMKLINIK. Dokumen Rahasia Fasilitas Pelayanan Kesehatan.</div>
      <div>Klasifikasi: Internal / Pengembang Sistem</div>
    </div>
  </div>

  <!-- MAIN PRD CONTENT -->
  <div class="prd-content-wrapper">
    ${rawBody}
  </div>

</body>
</html>
`;

fs.writeFileSync(outHtmlPath, fullHtml, 'utf8');
console.log('2. prd_presentation.html generated successfully.');

// Print to PDF with Microsoft Edge headless
console.log('3. Rendering prd.pdf using Microsoft Edge headless engine...');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const edgeArgs = [
  '--headless',
  '--disable-gpu',
  '--virtual-time-budget=8000',
  '--run-all-compositor-stages-before-draw',
  '--no-pdf-header-footer',
  `--print-to-pdf="${outPdfPath}"`,
  `"file:///${outHtmlPath.replace(/\\\\/g, '/')}"`
].join(' ');

execSync(`"${edgePath}" ${edgeArgs}`, { stdio: 'inherit' });

if (fs.existsSync(outPdfPath)) {
  const stats = fs.statSync(outPdfPath);
  console.log(`4. Successfully generated ${outPdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);

  // Also copy to simklinik-login/prd.pdf
  fs.copyFileSync(outPdfPath, copyPdfPath);
  console.log(`5. Copied PDF to ${copyPdfPath}`);
} else {
  console.error('Error: prd.pdf was not generated.');
  process.exit(1);
}

// Clean up temp
if (fs.existsSync(tempBodyPath)) {
  fs.unlinkSync(tempBodyPath);
}
console.log('Done!');

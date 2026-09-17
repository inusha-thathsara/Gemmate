/**
 * Opens a clean print popup for a practice question and triggers the
 * browser's Save-as-PDF dialog. All text (including KaTeX math) is
 * rendered as real, searchable vector text — not a rasterised image.
 */
export function exportQuestionAsPdf(
  contentHtml: string,
  questionNumber: number,
) {
  const win = window.open("", "_blank", "width=860,height=1000");
  if (!win) {
    alert("Please allow pop-ups to export as PDF.");
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Practice Question ${questionNumber} — Triage AI</title>
  <!-- KaTeX for math rendering -->
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
    crossorigin="anonymous"
  />
  <style>
    /* ── Base ─────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Georgia", "Times New Roman", serif;
      font-size: 14.5px;
      line-height: 1.85;
      color: #111;
      background: #fff;
      max-width: 720px;
      margin: 0 auto;
      padding: 40px 32px 60px;
    }

    /* ── Header ───────────────────────────────── */
    .pdf-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2px solid #111;
      padding-bottom: 14px;
      margin-bottom: 28px;
    }
    .pdf-app { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 6px; }
    .pdf-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .pdf-date { font-size: 11px; color: #888; text-align: right; margin-top: 4px; }

    /* ── Markdown prose ───────────────────────── */
    h1, h2, h3, h4 { font-weight: 700; margin-top: 1.6em; margin-bottom: 0.5em; line-height: 1.3; }
    h1 { font-size: 20px; }
    h2 { font-size: 17px; }
    h3 { font-size: 14.5px; }
    p  { margin-bottom: 1em; }

    ul, ol { padding-left: 1.6em; margin-bottom: 1em; }
    ul { list-style: disc; }
    ol { list-style: decimal; }
    li { margin-bottom: 0.35em; }

    strong { font-weight: 700; }
    em     { font-style: italic; }

    code {
      font-family: "Courier New", Courier, monospace;
      font-size: 12.5px;
      background: #f4f4f4;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1px 5px;
    }
    pre {
      background: #f6f6f6;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 14px 16px;
      overflow-x: auto;
      margin-bottom: 1em;
    }
    pre code { background: none; border: none; padding: 0; }

    blockquote {
      border-left: 3px solid #bbb;
      padding-left: 14px;
      color: #555;
      font-style: italic;
      margin: 1em 0;
    }

    hr { border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }

    /* ── KaTeX display blocks ─────────────────── */
    .katex-display {
      margin: 1em 0;
      overflow-x: auto;
    }

    /* ── Print ────────────────────────────────── */
    @media print {
      body { padding: 0; }
      @page { margin: 18mm 20mm; size: A4; }
      .no-print { display: none !important; }
    }

    /* ── Print button (screen only) ───────────── */
    .print-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      padding: 10px 20px;
      background: #111;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: system-ui, sans-serif;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">
    ⬇ Save as PDF
  </button>

  <div class="pdf-header">
    <div>
      <div class="pdf-app">Triage AI · Practice Question</div>
      <div class="pdf-title">Question ${questionNumber}</div>
    </div>
    <div class="pdf-date">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  </div>

  <div class="content">
    ${contentHtml}
  </div>
</body>
</html>`);

  win.document.close();
  win.focus();
}

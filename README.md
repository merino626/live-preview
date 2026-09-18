<div align="center">

<img src="docs/social-preview.png" alt="markdownvizualizer — live Markdown preview with Mermaid, math and a PDF export that matches Print exactly" width="100%" />

# markdownvizualizer

**A local Markdown live-preview editor where "Export PDF" and "Print" always produce byte-for-byte identical output — because they share the exact same rendering engine.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CodeMirror](https://img.shields.io/badge/CodeMirror-6-D30707?logo=codemirror&logoColor=white)](https://codemirror.net/)
[![Mermaid](https://img.shields.io/badge/Mermaid-11-FF3670?logo=mermaid&logoColor=white)](https://mermaid.js.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**English** · [Português (BR)](README.pt-BR.md)

</div>

> A local dev-tool: no account, no telemetry, nothing leaves your machine. The one network call it makes is loading two Google Fonts.

---

## Table of contents

- [Screenshots](#screenshots)
- [Why I built this](#why-i-built-this)
- [What it actually does](#what-it-actually-does)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Engineering decisions worth calling out](#engineering-decisions-worth-calling-out)
- [Project structure](#project-structure)
- [Running it locally](#running-it-locally)
- [Roadmap](#roadmap)
- [License](#license)

---

## Screenshots

### Live preview, no button to press

Every keystroke in the editor re-renders the panel on the right immediately — Markdown, GFM tables, Mermaid, all of it.

![Live typing](docs/screenshots/live-typing.gif)

### Mermaid diagrams and highlighted code, side by side with the source

![Mermaid diagram and code block](docs/screenshots/mermaid-and-code.png)
_Flowchart rendered inline, syntax-highlighted TypeScript block — both driven by the same Markdown on the left._

### A richer document: raw HTML, nested Mermaid, math, GFM tables

![A denser example document](docs/screenshots/exemplo-md.png)
_Loaded via **Abrir .md** — badges' surrounding `<div>`, table `<br>` line breaks and inline math all render, not just get echoed as text._

### The exported PDF, opened in Chrome's own PDF viewer

![Exported PDF, 4 pages, vector text](docs/screenshots/export-pdf-page.png)
_Selectable, vector text across every page — not a screenshot stitched into an image._

---

## Why I built this

I kept opening long Markdown files — API references, meeting notes, half-written docs — and wanting two things at once: a live preview while I edit, and a clean PDF to hand someone afterward that looks exactly like what I was looking at. Every tool I tried gave me one or the other. Browser extensions preview but can't export. Online converters export but need an upload. And the one built-in escape hatch every browser already has — **Print → Save as PDF** — actually produces a perfect, vector-quality PDF for free; it's just gated behind a print dialog you have to click through by hand every time.

So the actual product decision here wasn't "build a PDF exporter." It was: **the browser already solves this problem; wire an "Export PDF" button to trigger the exact same rendering path, minus the dialog.** That's a different problem than it sounds — a client-side PDF library can't reuse the browser's own print engine, so getting a one-click download that's still pixel-identical to Print meant reaching for a real headless Chromium instance instead.

## What it actually does

1. You paste or type Markdown into the left panel (or open a `.md` file with **Abrir .md**).
2. The right panel re-renders on every keystroke: GFM tables, task lists, strikethrough, Mermaid diagrams, KaTeX math, syntax-highlighted code blocks, and raw HTML embedded in the Markdown.
3. **Imprimir** hands the current preview straight to the browser's native print dialog — vector text, `@page`-aware pagination, zero setup.
4. **Exportar PDF** does the same rendering, but through a real headless Chromium instance spun up by a small Vite plugin, and returns the finished PDF as a direct file download — no dialog, no rasterized screenshot glued into a PDF.

---

## Features

### Editing & preview
- Split view: a CodeMirror 6 editor on the left, a live-rendered preview on the right — no "render" button, no debounce you can feel.
- Open any local `.md` file via **Abrir .md**; content is read client-side, nothing is uploaded anywhere.
- Smooth in-page navigation for heading anchor links (`#some-heading`) instead of a hard jump.

### Markdown, fully
- GFM: tables, task lists, strikethrough, autolinks.
- **Mermaid** diagrams (flowcharts, sequence diagrams, and anything else Mermaid supports) rendered inline as live SVG.
- **KaTeX** math, inline and block.
- Syntax-highlighted code blocks (JSON, TypeScript/JavaScript, HTTP) via a small hand-rolled, single-pass tokenizer — no external highlighting library.
- Fenced code blocks with **no** recognized language still keep their monospaced box and exact whitespace — useful for ASCII diagrams and plain output dumps.
- Raw HTML embedded in the Markdown (`<div align="center">`, `<br>`, badge wrappers, etc.) is parsed and rendered, not echoed back as literal text.

### Export
- **Imprimir**: native browser print — the highest-fidelity path there is, because it *is* the browser's own renderer.
- **Exportar PDF**: one click, direct file download, no print dialog — produced by a real headless Chromium instance so the output is vector text, not a raster image.
- Both paths render from the exact same two CSS files, so there is no separate "PDF theme" that can visually drift from what Print produces.
- On a **static deployment** there is no Node server, so the export endpoint doesn't exist. The app detects that on load and falls back to the native print dialog — with the reason stated up front, rather than failing at the click.

---

## Tech stack

| | |
|---|---|
| **React 19 + Vite 6 + TypeScript** | The editor/preview SPA. |
| **CodeMirror 6** (`@uiw/react-codemirror`) | The Markdown editor pane. |
| **react-markdown 9** + `remark-gfm` + `remark-math` + `rehype-katex` + `rehype-raw` | Markdown → HTML pipeline, including raw HTML passthrough. |
| **Mermaid 11** | Diagram rendering, client-side, straight to inline SVG. |
| **KaTeX** | Math typesetting. |
| **Playwright (Chromium)** | Drives a real browser engine server-side, exclusively for PDF export — not a testing dependency here. |
| **A custom Vite plugin** (`server/pdfExportPlugin.ts`) | Adds a `/api/export-pdf` endpoint to the dev/preview server; no separate backend process to run. |

No client-side PDF/canvas rasterization library (no `html2canvas`, no `jsPDF`) — the PDF is generated by an actual browser's print engine, not reconstructed from a bitmap.

---

## Architecture

The renderer never generates the PDF itself — it hands the already-rendered HTML to a same-origin endpoint backed by a real browser.

```
                         BROWSER (the app itself)
                                  │
                     React editor/preview (live)
                                  │
                     click "Exportar PDF" → POST /api/export-pdf
                     body: { html: <already-rendered .print-content> }
                                  │
                    ┌─────────────▼──────────────┐
                    │   Vite dev/preview server    │
                    │   server/pdfExportPlugin.ts   │
                    └─────────────┬──────────────┘
                                  │ page.setContent(html + app.css + print.css)
                    ┌─────────────▼──────────────┐
                    │   Playwright · headless      │
                    │   Chromium (print media)      │
                    │   page.pdf({ preferCSSPageSize:│
                    │              true })          │
                    └─────────────┬──────────────┘
                                  │ PDF buffer
                                  ▼
                     Content-Disposition: attachment
                          → direct file download
```

Because the plugin hooks `configureServer` **and** `configurePreviewServer`, the export endpoint is available under both `npm run dev` and `npm run preview` — no separate server process to start or stop.

---

## Engineering decisions worth calling out

**The PDF exporter used to rasterize the page — now it reuses the browser's own print engine.** The first version rendered the preview into an offscreen iframe, paginated it with a client-side library, and captured each page with `html2canvas` before stitching bitmaps into a PDF. It looked reasonable for simple content, and fell apart on anything real: Mermaid diagrams came out blank (`html2canvas` doesn't reliably rasterize SVG with embedded `<defs>`/`<marker>`/`<style>`), list markers lost their indentation, and pagination sometimes silently dropped an entire section. The fix wasn't tuning that pipeline — it was replacing it: a Vite plugin now launches a real headless Chromium via Playwright, feeds it the same HTML and CSS as the live preview, and calls `page.pdf({ preferCSSPageSize: true })`. The output is vector text from an actual browser layout engine, not a raster image, and every one of those failure modes disappears because nothing is being reimplemented — it's just Chrome doing what Chrome already does for Print.

**Two stylesheets drifting apart was the actual root cause, not a rendering bug.** Print and the (old) PDF exporter each had their own hand-maintained CSS, and they'd quietly diverged: different page margins, different link colors, a missing rule that appends `(url)` after links when printing. The fix wasn't patching the PDF stylesheet to match — it was deleting it and having the PDF export path import `app.css` and `print.css` directly (Vite's `?raw` import), the exact same files Print uses. There is now exactly one place to change how printed/exported output looks, and the two paths can't drift again by construction.

**A tokenizer bug that only showed up with template literals.** The syntax highlighter ran four sequential regex passes over its own output — comments, then strings, then keywords, then numbers. Each pass could match text that a *previous* pass had already wrapped in HTML: the keyword list included `class`, and the string-highlighting pass had just injected `class="hl-string"` into the markup, so the keyword pass matched that `class` attribute and wrapped it again, corrupting the tag. It only surfaced with code containing backtick template literals — common enough in real TypeScript to matter. Fixed by collapsing all four passes into one regex with alternation, so nothing ever re-scans another pass's output.

**A dependency was already installed and just never wired in.** `rehype-raw` sat in `package.json` unused, so any raw HTML inside Markdown — a centering `<div>`, a `<br>` inside a table cell, the wrapper around a badge — rendered as literal escaped text instead of an element. `react-markdown` v9 already passes raw HTML through to the tree by default; the plugin that turns those raw nodes into real elements was just never added to the pipeline.

**`<pre>` is the only place that reliably knows "this is a block, not an inline span."** A fenced code block with no recognized language and an inline `` `code span` `` both end up as a bare `<code>` with no `language-` class — indistinguishable by looking at the `code` node alone. But the Markdown parser only ever wraps *block-level* code in `<pre>`, never inline spans, so that's the one place the distinction is actually knowable. Moving the check there (instead of guessing inside the `code` renderer) fixed unlabeled fenced blocks — like ASCII diagrams — silently losing all their whitespace and collapsing onto one line.

---

## Project structure

```
live-preview/
├── server/
│   └── pdfExportPlugin.ts    # Vite plugin: /api/export-pdf, launches headless Chromium
├── src/
│   ├── components/
│   │   ├── MarkdownEditor.tsx    # CodeMirror 6 pane
│   │   ├── MarkdownPreview.tsx   # react-markdown pipeline + component overrides
│   │   ├── MermaidDiagram.tsx    # renders a ```mermaid block to inline SVG
│   │   ├── CodeBlock.tsx         # single-pass regex syntax highlighter
│   │   └── Toolbar.tsx           # Abrir .md / Imprimir / Exportar PDF
│   ├── styles/
│   │   ├── app.css               # base styles (screen)
│   │   └── print.css             # @media print rules — shared with the PDF exporter
│   ├── utils/
│   │   └── pdfExport.ts          # POSTs the rendered HTML, downloads the returned PDF
│   └── constants/defaultMarkdown.ts
├── exemplo.md                # sample document exercising every renderer feature
└── vite.config.ts
```

---

## Running it locally

```bash
npm install
npx playwright install chromium   # one-time, needed for Exportar PDF
npm run dev
```

Open the printed local URL. **Imprimir** works with nothing else installed; **Exportar PDF** needs the Chromium download above (Playwright manages the binary itself — no system Chrome dependency).

```bash
npm run build     # tsc -b && vite build
npm run preview   # serves the production build; /api/export-pdf still works here too
```

> **Deploying it?** The PDF endpoint lives in a Vite plugin, so it only exists where a Node server runs (`dev` and `preview`). Published to a static host, the app detects the missing endpoint and routes **Exportar PDF** to the browser's print dialog instead. Running it behind a real Node process — a container running `npm run preview`, for instance — keeps the one-click download working.

---

## Roadmap

- [ ] Automated tests (none yet — everything above was verified by hand with Playwright driving the real app)
- [ ] Light/dark theme for the preview pane
- [ ] Export to plain HTML alongside PDF

---

## License

Released under the [MIT License](LICENSE) — © 2026 Luis Eduardo.

<div align="center">

Built by [@merino626](https://github.com/merino626).

</div>

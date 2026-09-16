import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Connect, Plugin, PreviewServer, ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES_DIR = path.resolve(__dirname, "../src/styles");
const KATEX_CSS_PATH = path.resolve(
  __dirname,
  "../node_modules/katex/dist/katex.min.css",
);

const EXPORT_PATH = "/api/export-pdf";
const PDF_FILENAME = "markdownvizualizer.pdf";
const FONTS_CDN =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap";
const MAX_BODY_BYTES = 10 * 1024 * 1024;

let browserPromise: ReturnType<
  typeof import("playwright")["chromium"]["launch"]
> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    const { chromium } = await import("playwright");
    browserPromise = chromium.launch();
  }
  return browserPromise;
}

async function closeBrowser(): Promise<void> {
  if (!browserPromise) {
    return;
  }
  const browser = await browserPromise;
  browserPromise = null;
  await browser.close();
}

function buildPrintDocument(bodyHtml: string): string {
  const appCss = readFileSync(path.join(STYLES_DIR, "app.css"), "utf-8");
  const printCss = readFileSync(path.join(STYLES_DIR, "print.css"), "utf-8");
  const katexCss = readFileSync(KATEX_CSS_PATH, "utf-8");

  // Playwright renderiza sob mídia "print", então as mesmas regras de
  // app.css + print.css usadas por window.print() valem aqui sem adaptação.
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${PDF_FILENAME}</title>
  <link rel="stylesheet" href="${FONTS_CDN}" />
  <style>${katexCss}</style>
  <style>${appCss}\n${printCss}</style>
</head>
<body>
  <article class="markdown-body print-content">${bodyHtml}</article>
</body>
</html>`;
}

async function renderPdf(bodyHtml: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(buildPrintDocument(bodyHtml), {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ printBackground: true, preferCSSPageSize: true });
  } finally {
    await page.close();
  }
}

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Corpo da requisição excede o limite permitido."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

async function handleExportRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  try {
    const body = await readRequestBody(req);
    const { html } = JSON.parse(body) as { html?: string };

    if (!html) {
      res.statusCode = 400;
      res.end("Campo 'html' é obrigatório.");
      return;
    }

    const pdf = await renderPdf(html);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${PDF_FILENAME}"`,
    );
    res.end(pdf);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(
      error instanceof Error
        ? error.message
        : "Falha ao gerar o PDF no servidor.",
    );
  }
}

function registerMiddleware(middlewares: Connect.Server): void {
  middlewares.use(EXPORT_PATH, (req, res) => {
    void handleExportRequest(req, res);
  });
}

export function pdfExportPlugin(): Plugin {
  return {
    name: "pdf-export",
    configureServer(server: ViteDevServer) {
      registerMiddleware(server.middlewares);
      server.httpServer?.once("close", () => void closeBrowser());
    },
    configurePreviewServer(server: PreviewServer) {
      registerMiddleware(server.middlewares);
      server.httpServer?.once("close", () => void closeBrowser());
    },
  };
}

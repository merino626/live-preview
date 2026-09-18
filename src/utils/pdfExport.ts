const EXPORT_ENDPOINT = "/api/export-pdf";
const PDF_FILENAME = "markdownvizualizer.pdf";

/** O endpoint de exportação só existe quando um servidor Node está no ar
 *  (npm run dev / npm run preview). Em um deploy estático ele não existe,
 *  e a UI cai para a impressão nativa do navegador. */
export class PdfServerUnavailableError extends Error {}

export async function isPdfServerAvailable(): Promise<boolean> {
  try {
    const response = await fetch(EXPORT_ENDPOINT, { method: "HEAD" });
    return response.status !== 404;
  } catch {
    return false;
  }
}

export async function exportToPdf(sourceElement: HTMLElement): Promise<void> {
  const content = resolveExportContent(sourceElement);

  const response = await fetch(EXPORT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: content.outerHTML }),
  });

  if (response.status === 404) {
    throw new PdfServerUnavailableError();
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Falha ao gerar o PDF. Tente novamente ou use Imprimir.");
  }

  const blob = await response.blob();

  // Um host estático pode responder 200 com o index.html em vez de 404.
  if (blob.type !== "application/pdf") {
    throw new PdfServerUnavailableError();
  }

  downloadBlob(blob, PDF_FILENAME);
}

function resolveExportContent(sourceElement: HTMLElement): HTMLElement {
  if (sourceElement.classList.contains("print-content")) {
    return sourceElement;
  }

  const content = sourceElement.querySelector(".print-content");
  if (content instanceof HTMLElement) {
    return content;
  }

  return sourceElement;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

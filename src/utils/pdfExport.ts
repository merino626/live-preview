const EXPORT_ENDPOINT = "/api/export-pdf";
const PDF_FILENAME = "markdownvizualizer.pdf";

export async function exportToPdf(sourceElement: HTMLElement): Promise<void> {
  const content = resolveExportContent(sourceElement);

  const response = await fetch(EXPORT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: content.outerHTML }),
  });

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response));
  }

  const blob = await response.blob();
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

async function resolveErrorMessage(response: Response): Promise<string> {
  if (response.status === 404) {
    return "Exportação em PDF só funciona com o servidor local rodando (npm run dev).";
  }

  const text = await response.text();
  return text || "Falha ao gerar o PDF. Tente novamente ou use Imprimir.";
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

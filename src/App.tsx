import { useCallback, useRef, useState } from "react";

import { MarkdownEditor } from "./components/MarkdownEditor";
import { MarkdownPreview } from "./components/MarkdownPreview";
import { Toolbar } from "./components/Toolbar";
import { DEFAULT_MARKDOWN } from "./constants/defaultMarkdown";
import { exportToPdf } from "./utils/pdfExport";

export function App() {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const previewRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileLoad = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const content = loadEvent.target?.result;
        if (typeof content === "string") {
          setMarkdown(content);
        }
      };
      reader.readAsText(file, "UTF-8");
      event.target.value = "";
    },
    [],
  );

  const handleExportPdf = useCallback(async () => {
    if (!previewRef.current || isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      await exportToPdf(previewRef.current);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha ao gerar o PDF. Tente novamente ou use Imprimir.";
      window.alert(message);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo" aria-hidden="true">
            MD
          </span>
          <div>
            <h1 className="app-title">markdownvizualizer</h1>
            <p className="app-subtitle">
              Editor Markdown com preview ao vivo, Mermaid e exportação PDF
            </p>
          </div>
        </div>
        <Toolbar
          fileInputRef={fileInputRef}
          isExporting={isExporting}
          onExportPdf={handleExportPdf}
          onFileLoad={handleFileLoad}
          onOpenFile={() => fileInputRef.current?.click()}
          onPrint={handlePrint}
        />
      </header>

      <main className="app-main">
        <section className="panel panel-editor" aria-label="Editor Markdown">
          <div className="panel-header">
            <span className="panel-label">Markdown</span>
            <span className="panel-meta">{markdown.length} caracteres</span>
          </div>
          <MarkdownEditor value={markdown} onChange={setMarkdown} />
        </section>

        <div className="panel-divider" aria-hidden="true" />

        <section className="panel panel-preview" aria-label="Preview renderizado">
          <div className="panel-header">
            <span className="panel-label">Preview</span>
            <span className="panel-meta">Renderizado ao vivo</span>
          </div>
          <MarkdownPreview ref={previewRef} markdown={markdown} />
        </section>
      </main>
    </div>
  );
}

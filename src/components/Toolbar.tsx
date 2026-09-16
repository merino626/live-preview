import { RefObject } from "react";

interface ToolbarProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isExporting: boolean;
  onOpenFile: () => void;
  onFileLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportPdf: () => void;
  onPrint: () => void;
}

export function Toolbar({
  fileInputRef,
  isExporting,
  onOpenFile,
  onFileLoad,
  onExportPdf,
  onPrint,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        className="sr-only"
        onChange={onFileLoad}
      />

      <button type="button" className="btn btn-secondary" onClick={onOpenFile}>
        Abrir .md
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={onPrint}
        title="Usa a impressão nativa do navegador — melhor qualidade"
      >
        Imprimir
      </button>

      <button
        type="button"
        className="btn btn-primary"
        onClick={onExportPdf}
        disabled={isExporting}
        title="Baixa markdownvizualizer.pdf diretamente"
      >
        {isExporting ? "Gerando PDF…" : "Exportar PDF"}
      </button>
    </div>
  );
}

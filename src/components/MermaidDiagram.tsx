import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
}

let mermaidInitialized = false;

function initializeMermaid(): void {
  if (mermaidInitialized) {
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
    fontFamily: "IBM Plex Sans, sans-serif",
  });
  mermaidInitialized = true;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeMermaid();

    let cancelled = false;

    async function renderChart(): Promise<void> {
      if (!containerRef.current) {
        return;
      }

      try {
        const id = `mermaid-${crypto.randomUUID()}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (renderError) {
        if (!cancelled) {
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Erro ao renderizar diagrama Mermaid",
          );
          setSvg("");
        }
      }
    }

    void renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="mermaid-error pdf-avoid-break">
        <strong>Erro no diagrama Mermaid:</strong>
        <pre>{error}</pre>
        <details>
          <summary>Código fonte</summary>
          <pre>{chart}</pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container pdf-avoid-break"
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-label="Diagrama Mermaid"
    />
  );
}

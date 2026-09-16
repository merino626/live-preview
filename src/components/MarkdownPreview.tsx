import { forwardRef, isValidElement, useEffect, useId } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

import { MermaidDiagram } from "./MermaidDiagram";
import { CodeBlock } from "./CodeBlock";

interface MarkdownPreviewProps {
  markdown: string;
}

export const MarkdownPreview = forwardRef<HTMLElement, MarkdownPreviewProps>(
  function MarkdownPreview({ markdown }, ref) {
    const contentId = useId();

    useEffect(() => {
      const container = document.getElementById(contentId);
      if (!container) {
        return;
      }

      container.querySelectorAll("a[href^='#']").forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
          event.preventDefault();
          const targetId = anchor.getAttribute("href")?.slice(1);
          if (!targetId) {
            return;
          }
          const target = container.querySelector(`#${CSS.escape(targetId)}`);
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }, [markdown, contentId]);

    return (
      <div className="preview-wrapper">
        <article
          ref={ref}
          id={contentId}
          className="markdown-body print-content"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className ?? "");
                const language = match?.[1];
                const content = String(children).replace(/\n$/, "");

                if (language === "mermaid") {
                  return <MermaidDiagram chart={content} />;
                }

                if (match) {
                  return <CodeBlock language={language ?? "text"} code={content} />;
                }

                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              h1({ children, ...props }) {
                const id = slugify(String(children));
                return (
                  <h1 id={id} className="pdf-avoid-break" {...props}>
                    {children}
                  </h1>
                );
              },
              h2({ children, ...props }) {
                const id = slugify(String(children));
                return (
                  <h2 id={id} className="pdf-avoid-break-before" {...props}>
                    {children}
                  </h2>
                );
              },
              h3({ children, ...props }) {
                const id = slugify(String(children));
                return (
                  <h3 id={id} className="pdf-avoid-break-before" {...props}>
                    {children}
                  </h3>
                );
              },
              table({ children, ...props }) {
                return (
                  <div className="table-wrapper pdf-avoid-break">
                    <table {...props}>{children}</table>
                  </div>
                );
              },
              pre({ children }) {
                // pre só existe para código em bloco (nunca inline); um
                // filho que não seja Mermaid/CodeBlock é um fence sem
                // linguagem reconhecida — ainda precisa de <pre> para não
                // perder espaços/quebras de linha (ex.: diagramas ASCII).
                const child = Array.isArray(children) ? children[0] : children;
                if (
                  isValidElement(child) &&
                  (child.type === MermaidDiagram || child.type === CodeBlock)
                ) {
                  return <>{children}</>;
                }

                return (
                  <div className="code-block pdf-avoid-break">
                    <pre>{children}</pre>
                  </div>
                );
              },
              blockquote({ children, ...props }) {
                return (
                  <blockquote className="pdf-avoid-break" {...props}>
                    {children}
                  </blockquote>
                );
              },
              hr(props) {
                return <hr className="pdf-section-break" {...props} />;
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    );
  },
);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

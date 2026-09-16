interface CodeBlockProps {
  language: string;
  code: string;
}

const KEYWORDS =
  "const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|interface|type|enum|def|True|False|null|undefined";
// Um único regex com alternância evita que um passo reescaneie o HTML
// injetado por um passo anterior (ex.: a palavra "class" dentro de
// class="hl-string" sendo confundida com a keyword `class`).
const TOKEN_PATTERN = new RegExp(
  `(\\/\\/.*$|\\/\\*[\\s\\S]*?\\*\\/|#.*$)|(["'\`])(?:(?!\\2)[^\\\\]|\\\\.)*\\2|\\b(${KEYWORDS})\\b|\\b(\\d+\\.?\\d*)\\b`,
  "gm",
);

export function CodeBlock({ language, code }: CodeBlockProps) {
  const highlighted = highlightCode(code, language);

  return (
    <div className="code-block pdf-avoid-break">
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
      </div>
      <pre>
        <code
          className={`language-${language}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}

function highlightCode(code: string, language: string): string {
  const escaped = escapeHtml(code);

  if (language === "json") {
    return highlightJson(escaped);
  }

  if (["typescript", "javascript", "ts", "js"].includes(language)) {
    return highlightJsLike(escaped);
  }

  if (language === "http") {
    return highlightHttp(escaped);
  }

  return escaped;
}

function highlightJson(code: string): string {
  return code.replace(
    /("(?:\\.|[^"\\])*")\s*(:)?|\b(true|false|null)\b|\b(-?\d+\.?\d*)\b/g,
    (match, str, colon, keyword, number) => {
      if (str && colon) {
        return `<span class="hl-key">${str}</span>${colon}`;
      }
      if (str) {
        return `<span class="hl-string">${str}</span>`;
      }
      if (keyword) {
        return `<span class="hl-keyword">${keyword}</span>`;
      }
      if (number) {
        return `<span class="hl-number">${number}</span>`;
      }
      return match;
    },
  );
}

function highlightJsLike(code: string): string {
  return code.replace(
    TOKEN_PATTERN,
    (match, comment, quote, keyword, number) => {
      if (comment) return `<span class="hl-comment">${comment}</span>`;
      if (quote) return `<span class="hl-string">${match}</span>`;
      if (keyword) return `<span class="hl-keyword">${keyword}</span>`;
      if (number) return `<span class="hl-number">${number}</span>`;
      return match;
    },
  );
}

function highlightHttp(code: string): string {
  const lines = code.split("\n");
  return lines
    .map((line, index) => {
      if (index === 0) {
        return `<span class="hl-keyword">${line}</span>`;
      }
      if (line.includes(":")) {
        const [key, ...rest] = line.split(":");
        return `<span class="hl-key">${key}</span>:${rest.join(":")}`;
      }
      return line;
    })
    .join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

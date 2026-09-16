export const DEFAULT_MARKDOWN = `# Live Preview Markdown

Edite este conteúdo à esquerda e veja o resultado renderizado à direita.

## Recursos suportados

- **Negrito**, *itálico*, ~~riscado~~ e \`código inline\`
- Listas ordenadas e não ordenadas
- Tabelas GFM
- Blocos de código com syntax highlight
- Diagramas **Mermaid**
- Fórmulas matemáticas: $E = mc^2$ e $\\sum_{i=1}^{n} x_i$

---

## Tabela de exemplo

| Recurso | Status |
|---------|--------|
| Mermaid | ✅ |
| PDF     | ✅ |
| GFM     | ✅ |

---

## Diagrama Mermaid

\`\`\`mermaid
flowchart LR
    A[Markdown] --> B[Parser]
    B --> C[Preview]
    C --> D[PDF]
\`\`\`

---

## Código

\`\`\`typescript
function greet(name: string): string {
  return \`Olá, \${name}!\`;
}
\`\`\`

> Carregue um arquivo \`.md\` pelo botão **Abrir** ou use o \`exemplo.md\` do projeto.
`;

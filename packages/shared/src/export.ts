/**
 * @module export
 * @description Exportação de conteúdo adaptado para diferentes formatos.
 *
 * Funciona inteiramente no browser via Blob + download link.
 * Usado pela versão web (sem backend Rust).
 *
 * Formatos suportados:
 * - **txt/html/md**: gravação direta como texto
 * - **docx**: geração via objeto Blob (conteúdo em texto plano)
 * - **pdf**: abre o diálogo de impressão nativo do browser (Salvar como PDF)
 */

/**
 * MIME types por formato de exportação.
 */
const MIME_TYPES: Record<string, string> = {
  txt: "text/plain",
  html: "text/html",
  md: "text/markdown",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

/**
 * Força o download de um arquivo no browser.
 *
 * Cria um Blob com o conteúdo, gera uma URL temporária e força
 * o download via link invisível com atributo `download`.
 *
 * @param content - Conteúdo textual do arquivo
 * @param filename - Nome do arquivo para download
 * @param mimeType - MIME type do conteúdo
 */
function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Converte conteúdo texto/markdown em HTML básico para exportação.
 *
 * Parser simples que reconhece:
 * - `# H1`, `## H2`, `### H3` → headings
 * - `**texto**` → negrito
 * - `---` → separador `<hr>`
 * - Linhas em branco → `<br>`
 * - Texto normal → `<p>`
 */
function textToHtml(content: string): string {
  const lines = content.split("\n");
  const bodyParts: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    const t = line.trim();

    const isUl = t.startsWith("- ") || t.startsWith("+ ") || (t.startsWith("* ") && !t.startsWith("**"));
    const isOl = /^\d+\.\s/.test(t);

    if (!isUl && inUl) { bodyParts.push("</ul>"); inUl = false; }
    if (!isOl && inOl) { bodyParts.push("</ol>"); inOl = false; }

    if (!t) {
      bodyParts.push("<br>");
    } else if (t === "---" || t === "___" || t === "***") {
      bodyParts.push("<hr>");
    } else if (t.startsWith("###### ")) {
      bodyParts.push(`<h6>${inlineMd(t.slice(7))}</h6>`);
    } else if (t.startsWith("##### ")) {
      bodyParts.push(`<h5>${inlineMd(t.slice(6))}</h5>`);
    } else if (t.startsWith("#### ")) {
      bodyParts.push(`<h4>${inlineMd(t.slice(5))}</h4>`);
    } else if (t.startsWith("### ")) {
      bodyParts.push(`<h3>${inlineMd(t.slice(4))}</h3>`);
    } else if (t.startsWith("## ")) {
      bodyParts.push(`<h2>${inlineMd(t.slice(3))}</h2>`);
    } else if (t.startsWith("# ")) {
      bodyParts.push(`<h1>${inlineMd(t.slice(2))}</h1>`);
    } else if (t.startsWith("> ")) {
      bodyParts.push(`<blockquote>${inlineMd(t.slice(2))}</blockquote>`);
    } else if (isUl) {
      if (!inUl) { bodyParts.push("<ul>"); inUl = true; }
      bodyParts.push(`  <li>${inlineMd(t.slice(2).trim())}</li>`);
    } else if (isOl) {
      if (!inOl) { bodyParts.push("<ol>"); inOl = true; }
      const rest = t.replace(/^\d+\.\s/, "");
      bodyParts.push(`  <li>${inlineMd(rest)}</li>`);
    } else {
      bodyParts.push(`<p>${inlineMd(t)}</p>`);
    }
  }

  if (inUl) bodyParts.push("</ul>");
  if (inOl) bodyParts.push("</ol>");

  const body = bodyParts.join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>PBL - Conteúdo Adaptado</title>
  <style>
    body { font-family: 'Liberation Sans', Arial, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #222; line-height: 1.7; font-size: 14px; }
    h1 { text-align: center; font-size: 1.4rem; margin: 1.5rem 0; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
    h2 { font-size: 1.2rem; margin: 1.2rem 0 0.5rem; color: #333; }
    h3 { font-size: 1.05rem; margin: 1rem 0 0.4rem; }
    h4,h5,h6 { font-size: 1rem; margin: 0.8rem 0 0.3rem; }
    hr { border: none; border-top: 1px solid #ccc; margin: 1.5rem 0; }
    p { margin: 0.4rem 0; }
    blockquote { border-left: 3px solid #888; margin: 0.8rem 0; padding: 0.5rem 1rem; color: #555; font-style: italic; background: #f8f8f8; }
    ul, ol { margin: 0.5rem 0; padding-left: 2rem; }
    li { margin: 0.2rem 0; }
    strong { font-weight: bold; }
    em { font-style: italic; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

/** Converte markdown inline para HTML (bold, italic) */
function inlineMd(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/**
 * Abre o diálogo de impressão do browser para salvar como PDF.
 *
 * Cria uma janela invisível com o conteúdo formatado em HTML,
 * abre o print dialog e fecha a janela após a impressão.
 */
function printAsPdf(content: string): void {
  const html = textToHtml(content);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error(
      "O navegador bloqueou a janela de impressão. Desative o bloqueador de pop-ups e tente novamente."
    );
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}

/**
 * Exporta conteúdo adaptado no formato solicitado.
 *
 * Para txt/md: download direto como texto.
 * Para html: converte markdown-like para HTML e faz download.
 * Para docx: download como texto (simplificado).
 * Para pdf: abre o diálogo de impressão nativo.
 *
 * @param content - Conteúdo adaptado a ser exportado
 * @param format - Formato desejado: txt, html, md, docx ou pdf
 */
export function webExportFile(content: string, format: string): void {
  const filename = `adaptacao.${format}`;
  const mime = MIME_TYPES[format] || "text/plain";

  switch (format) {
    case "txt":
    case "md":
      downloadBlob(content, filename, mime);
      break;

    case "html": {
      const html = textToHtml(content);
      downloadBlob(html, filename, mime);
      break;
    }

    case "docx":
      // Limitação conhecida: exporta como texto sem formatação OOXML.
      // Para DOCX real com formatação avançada, o web usa a lib `docx` via web-exporters.ts
      console.warn("[PBL] export.ts DOCX: conteúdo salvo como texto plano. Use web-exporters.ts para DOCX formatado.");
      downloadBlob(content, filename, mime);
      break;

    case "pdf":
      printAsPdf(content);
      break;

    default:
      console.warn(`[PBL] Formato '${format}' não suportado na web.`);
  }
}

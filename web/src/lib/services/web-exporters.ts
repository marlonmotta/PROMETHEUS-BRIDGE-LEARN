/**
 * @module web-exporters
 * @description Exportadores robustos para DOCX e PDF no browser.
 *
 * O desktop usa Rust (`docx-rs`) para gerar documentos nativos.
 * No web, precisamos de equivalentes JS que rodem no browser:
 *
 * - **DOCX**: biblioteca `docx` - gera arquivo Word real com parágrafos
 * - **PDF**: biblioteca `jspdf` - gera PDF com suporte a texto longo
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { jsPDF } from "jspdf";

/**
 * Gera um arquivo DOCX a partir de texto e dispara download.
 *
 * Cada linha do conteúdo vira um parágrafo no documento Word.
 * A primeira linha é tratada como título (Heading 1).
 */
/**
 * Gera um arquivo DOCX a partir de texto com formatação Markdown e dispara download.
 *
 * Parseia formatação inline (**bold**, *italic*) e block-level
 * (# headings, - listas, > blockquotes) para gerar um documento Word
 * com formatação real, alinhado com a versão Rust.
 */
export async function exportDocx(
  content: string,
  filename: string,
): Promise<void> {
  const lines = content.split("\n");
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Linha vazia
    if (!trimmed) {
      paragraphs.push(new Paragraph({ children: [] }));
      continue;
    }

    // Separadores
    if (trimmed === "---" || trimmed === "___" || trimmed === "***") {
      paragraphs.push(new Paragraph({ children: [] }));
      continue;
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed.slice(2), bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      }));
      continue;
    }
    if (trimmed.startsWith("## ")) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed.slice(3), bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 160 },
      }));
      continue;
    }
    if (trimmed.startsWith("### ")) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed.slice(4), bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 120 },
      }));
      continue;
    }
    if (/^#{4,6} /.test(trimmed)) {
      const text = trimmed.replace(/^#{4,6} /, "");
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text, bold: true, size: 22 })],
        spacing: { after: 100 },
      }));
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed.slice(2), italics: true, color: "555555", size: 24 })],
        indent: { left: 720 },
        spacing: { after: 120 },
      }));
      continue;
    }

    // Unordered list
    if (/^[-+*] /.test(trimmed) && !trimmed.startsWith("**")) {
      const rest = trimmed.slice(2);
      paragraphs.push(new Paragraph({
        children: parseInlineMarkdown(rest),
        indent: { left: 360 },
        spacing: { after: 80 },
      }));
      continue;
    }

    // Ordered list (1. item)
    const olMatch = trimmed.match(/^(\d+)\. (.+)/);
    if (olMatch) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: `${olMatch[1]}. ` }), ...parseInlineMarkdown(olMatch[2])],
        indent: { left: 360 },
        spacing: { after: 80 },
      }));
      continue;
    }

    // Texto normal com formatação inline
    paragraphs.push(new Paragraph({
      children: parseInlineMarkdown(trimmed),
      spacing: { after: 120 },
    }));
  }

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename || "pbl-adaptacao.docx");
}

/** Parseia **bold** e *italic* inline para TextRun[] do docx */
function parseInlineMarkdown(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Bold (**texto**)
    const boldIdx = remaining.indexOf("**");
    if (boldIdx !== -1) {
      if (boldIdx > 0) runs.push(new TextRun({ text: remaining.slice(0, boldIdx), size: 24 }));
      remaining = remaining.slice(boldIdx + 2);
      const end = remaining.indexOf("**");
      if (end !== -1) {
        runs.push(new TextRun({ text: remaining.slice(0, end), bold: true, size: 24 }));
        remaining = remaining.slice(end + 2);
      } else {
        runs.push(new TextRun({ text: "**", size: 24 }));
      }
      continue;
    }

    // Italic (*texto*)
    const italicIdx = remaining.indexOf("*");
    if (italicIdx !== -1) {
      if (italicIdx > 0) runs.push(new TextRun({ text: remaining.slice(0, italicIdx), size: 24 }));
      remaining = remaining.slice(italicIdx + 1);
      const end = remaining.indexOf("*");
      if (end !== -1) {
        runs.push(new TextRun({ text: remaining.slice(0, end), italics: true, size: 24 }));
        remaining = remaining.slice(end + 1);
      } else {
        runs.push(new TextRun({ text: "*", size: 24 }));
      }
      continue;
    }

    // Texto normal
    runs.push(new TextRun({ text: remaining, size: 24 }));
    break;
  }

  return runs;
}

/**
 * Gera um arquivo PDF a partir de texto e dispara download.
 *
 * Usa jsPDF com quebra automática de linhas e paginação.
 * Fonte padrão: Helvetica 12pt.
 */
export function exportPdf(content: string, filename: string): void {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 6;
  let y = margin;

  pdf.setFont("helvetica");
  pdf.setFontSize(12);

  const lines = pdf.splitTextToSize(content, maxWidth);

  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineHeight;
  }

  pdf.save(filename || "pbl-adaptacao.pdf");
}

/** Helper: dispara download de um Blob como arquivo */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Testes unitários do módulo shared/export.
 *
 * Testa o parser markdown→HTML e o routing de exportação
 * para diferentes formatos (txt, md, html, docx, pdf).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { webExportFile } from "@pbl/shared/export";

let capturedBlob: Blob | undefined;

beforeEach(() => {
  capturedBlob = undefined;
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    capturedBlob = blob as Blob;
    return "blob:fake-url";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

// ─── webExportFile: formatos texto ──────────────────────────────────────────

describe("webExportFile - TXT/MD", () => {
  it("exporta TXT com conteúdo exato", async () => {
    webExportFile("Conteúdo da aula de matemática", "txt");
    expect(capturedBlob).toBeDefined();
    const text = await capturedBlob!.text();
    expect(text).toBe("Conteúdo da aula de matemática");
  });

  it("exporta MD com conteúdo exato", async () => {
    webExportFile("# Título\n\nConteúdo...", "md");
    expect(capturedBlob).toBeDefined();
    const text = await capturedBlob!.text();
    expect(text).toContain("# Título");
  });

  it("MIME type correto para TXT", async () => {
    webExportFile("conteúdo", "txt");
    expect(capturedBlob?.type).toContain("text/plain");
  });

  it("MIME type correto para MD", async () => {
    webExportFile("conteúdo", "md");
    expect(capturedBlob?.type).toContain("text/markdown");
  });
});

// ─── webExportFile: HTML com parser markdown ─────────────────────────────────

describe("webExportFile - HTML", () => {
  it("converte heading # para <h1>", async () => {
    webExportFile("# Minha Aula", "html");
    const text = await capturedBlob!.text();
    expect(text).toContain("<h1>Minha Aula</h1>");
  });

  it("converte heading ## para <h2>", async () => {
    webExportFile("## Subtítulo", "html");
    const text = await capturedBlob!.text();
    expect(text).toContain("<h2>Subtítulo</h2>");
  });

  it("converte **bold** para <strong>", async () => {
    webExportFile("Texto **negrito** aqui", "html");
    const text = await capturedBlob!.text();
    expect(text).toContain("<strong>negrito</strong>");
  });

  it("converte *italic* para <em>", async () => {
    webExportFile("Texto *itálico* aqui", "html");
    const text = await capturedBlob!.text();
    expect(text).toContain("<em>itálico</em>");
  });

  it("converte separador --- para <hr>", async () => {
    webExportFile("Acima\n---\nAbaixo", "html");
    const text = await capturedBlob!.text();
    expect(text).toContain("<hr>");
  });

  it("converte lista não ordenada (- item)", async () => {
    webExportFile("- Item A\n- Item B", "html");
    const text = await capturedBlob!.text();
    expect(text).toContain("<ul>");
    expect(text).toContain("<li>Item A</li>");
    expect(text).toContain("<li>Item B</li>");
  });

  it("converte lista ordenada (1. item)", async () => {
    webExportFile("1. Primeiro\n2. Segundo", "html");
    const text = await capturedBlob!.text();
    expect(text).toContain("<ol>");
    expect(text).toContain("<li>Primeiro</li>");
  });

  it("converte blockquote (> citação)", async () => {
    webExportFile("> Citação importante", "html");
    const text = await capturedBlob!.text();
    expect(text).toContain("<blockquote>Citação importante</blockquote>");
  });

  it("escapa HTML perigoso (XSS prevention)", async () => {
    webExportFile('<script>alert("xss")</script>', "html");
    const text = await capturedBlob!.text();
    expect(text).not.toContain("<script>");
    expect(text).toContain("&lt;script&gt;");
  });

  it("gera documento HTML completo com DOCTYPE", async () => {
    webExportFile("Conteúdo", "html");
    const text = await capturedBlob!.text();
    expect(text).toContain("<!DOCTYPE html>");
    expect(text).toContain('<html lang="pt-BR">');
    expect(text).toContain("<style>");
  });
});

// ─── webExportFile: formato desconhecido ─────────────────────────────────────

describe("webExportFile - edge cases", () => {
  it("formato desconhecido não lança erro (warn silencioso)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => webExportFile("conteúdo", "xyz")).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });

  it("DOCX exporta como texto com aviso (fallback)", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    webExportFile("conteúdo do docx", "docx");
    expect(capturedBlob).toBeDefined();
    const text = await capturedBlob!.text();
    expect(text).toBe("conteúdo do docx");
    expect(spy).toHaveBeenCalled();
  });
});

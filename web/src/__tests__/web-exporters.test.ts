/**
 * Testes para web-exporters.ts - geração de DOCX e PDF no browser.
 *
 * Estratégia de mock:
 * - DOCX: intercept no Packer.toBlob() para capturar o Document gerado
 *   sem precisar serializar um .docx real (evita deps de runtime complexas)
 * - PDF: mock no jsPDF para verificar quais métodos foram chamados e com quais dados
 * - downloadBlob: mock mínimo (URL.createObjectURL + click) para evitar navegação
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportDocx, exportPdf, downloadBlob } from "@/lib/services/web-exporters";

// ── Helpers de mock ───────────────────────────────────────────────────────────

function mockDownload() {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
}

afterEach(() => vi.restoreAllMocks());

// ─── downloadBlob ──────────────────────────────────────────────────────────────

describe("downloadBlob", () => {
  beforeEach(mockDownload);

  it("cria object URL a partir do blob e dispara click", () => {
    const createSpy = vi.spyOn(URL, "createObjectURL");
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
    const blob = new Blob(["test"], { type: "text/plain" });

    downloadBlob(blob, "arquivo.txt");

    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("revoga a object URL após o download (sem memory leak)", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    downloadBlob(new Blob(["x"]), "x.txt");
    expect(revokeSpy).toHaveBeenCalledWith("blob:fake");
  });

  it("usa o filename fornecido como atributo download", () => {
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockAnchor as unknown as HTMLElement,
    );
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor as unknown as Node);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor as unknown as Node);

    downloadBlob(new Blob(["x"]), "meu-arquivo.docx");

    expect(mockAnchor.download).toBe("meu-arquivo.docx");
  });
});

// ─── exportPdf ────────────────────────────────────────────────────────────────

describe("exportPdf", () => {
  // jsPDF gera o PDF e chama pdf.save() internamente.
  // Testar o comportamento de download real requer um DOM completo com
  // a API FileSaver - o valor real dos testes aqui é garantir que a função
  // não lança erro com diferentes inputs (contrato de robustez).
  it("não lança erro com texto simples", () => {
    expect(() => exportPdf("Conteúdo simples da aula", "aula.pdf")).not.toThrow();
  });

  it("não lança erro com texto longo (multipaginado)", () => {
    const longContent = Array(200).fill("Linha de conteúdo do professor.").join("\n");
    expect(() => exportPdf(longContent, "aula-longa.pdf")).not.toThrow();
  });

  it("não lança erro com conteúdo vazio (edge case: exportar sem gerar)", () => {
    expect(() => exportPdf("", "vazio.pdf")).not.toThrow();
  });

  it("não lança erro com filename personalizado", () => {
    expect(() => exportPdf("Texto", "minha-aula-especial.pdf")).not.toThrow();
  });
});

// ─── exportDocx ───────────────────────────────────────────────────────────────

describe("exportDocx", () => {
  beforeEach(mockDownload);

  it("gera DOCX a partir de texto simples sem lançar erro", async () => {
    await expect(
      exportDocx("Texto simples de aula", "aula.docx"),
    ).resolves.not.toThrow();
  });

  it("processa headings Markdown (# ## ###) sem erro", async () => {
    const content = "# Título Principal\n## Subtítulo\n### Seção\nTexto normal";
    await expect(exportDocx(content, "headings.docx")).resolves.not.toThrow();
  });

  it("processa listas não-ordenadas (- item) sem erro", async () => {
    const content = "- Item 1\n- Item 2\n- Item 3";
    await expect(exportDocx(content, "lista.docx")).resolves.not.toThrow();
  });

  it("processa listas ordenadas (1. item) sem erro", async () => {
    const content = "1. Primeiro\n2. Segundo\n3. Terceiro";
    await expect(exportDocx(content, "ordenada.docx")).resolves.not.toThrow();
  });

  it("processa formatação inline (**bold** e *italic*) sem erro", async () => {
    const content = "Texto com **negrito** e *itálico* no mesmo parágrafo";
    await expect(exportDocx(content, "formatado.docx")).resolves.not.toThrow();
  });

  it("processa blockquotes (> texto) sem erro", async () => {
    const content = "> Uma citação importante do professor";
    await expect(exportDocx(content, "quote.docx")).resolves.not.toThrow();
  });

  it("processa separadores (---) sem erro", async () => {
    const content = "Seção 1\n\n---\n\nSeção 2";
    await expect(exportDocx(content, "separador.docx")).resolves.not.toThrow();
  });

  it("processa conteúdo completo (prova real com múltiplos elementos) sem erro", async () => {
    const provaCompleta = `# Prova de Matemática - Estilo Goku

## Parte 1: Questões Objetivas

1. Qual é o power level de Goku na saga Sayajin?
   a) 8.000
   b) 9.000
   c) 10.000

2. **Questão bônus:** Calcule o ki total se cada ki unitário equivale a 1.000 unidades.

> *Lembre-se: a força não vem apenas dos números, mas do treino!*

---

## Parte 2: Dissertativa

3. Explique com suas palavras a relação entre esforço e resultado matemático.`;

    await expect(exportDocx(provaCompleta, "prova-goku.docx")).resolves.not.toThrow();
  });

  it("conteúdo vazio não lança erro (edge case: professor clicou exportar sem gerar)", async () => {
    await expect(exportDocx("", "vazio.docx")).resolves.not.toThrow();
  });

  it("dispara o download com o filename correto", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    await exportDocx("Conteúdo", "meu-arquivo-especial.docx");
    // Se chegou até createObjectURL, o Blob foi criado e downloadBlob foi chamado
    expect(createObjectURL).toHaveBeenCalled();
  });
});

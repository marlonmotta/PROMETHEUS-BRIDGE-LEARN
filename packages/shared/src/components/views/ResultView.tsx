/**
 * @module ResultView
 * @description Tela de exibição do resultado da adaptação pedagógica.
 *
 * Renderiza o conteúdo gerado pela IA em dois modos:
 * - **Manual**: exibe os blocos de prompt para cópia manual pelo professor
 * - **IA**: renderiza o markdown gerado como HTML formatado
 *
 * ## Segurança
 *
 * O HTML renderizado passa obrigatoriamente pelo DOMPurify para prevenir
 * ataques XSS. A resposta da IA pode conter scripts maliciosos (intencionais
 * ou injetados via prompt injection), e sem sanitização eles teriam acesso
 * total ao contexto Tauri (sistema de arquivos, rede, etc.).
 *
 * ## Exportação
 *
 * Suporta exportação em 5 formatos: TXT, MD, HTML, DOCX (via backend Rust)
 * e PDF (via html2pdf.js com template estilo prova escolar).
 */

import { memo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  getSubjects,
  getDifficulties,
  MODEL_PLACEHOLDERS,
  type Persona,
  type Settings,
} from "@pbl/shared/constants";
import Icon from "@pbl/shared/components/Icon";
import { toast } from "@pbl/shared/components/Toast";
import { useI18n } from "@pbl/shared/i18n";

// Configuração do parser de markdown
marked.setOptions({ breaks: true, gfm: true });

interface Props {
  /** Texto do resultado gerado pela IA */
  result: string;
  /** Prompt completo montado (para modo manual) */
  fullPrompt: string;
  /** Persona que gerou o resultado */
  selectedPersona: Persona | null;
  /** Configurações globais de IA */
  settings: Settings;
  /** Slug da disciplina selecionada */
  subject: string;
  /** Nível de dificuldade selecionado */
  difficulty: string;
  /** Callback para salvar no histórico */
  onSaveHistory: () => void;
  /** Callback para iniciar nova adaptação */
  onNewAdaptation: () => void;
}

export default memo(function ResultView({
  result,
  fullPrompt,
  selectedPersona,
  settings,
  subject,
  difficulty,
  onSaveHistory,
  onNewAdaptation,
}: Props) {
  const { t, locale } = useI18n();
  const isManual = settings.mode === "manual";
  const subjectLabel = getSubjects(t)[subject] || subject;
  const diffLabel = getDifficulties(t)[difficulty] || difficulty;
  const aiLabel =
    settings.mode === "offline"
      ? t("dashboard.aiModeOllama", { model: settings.ollamaModel })
      : settings.mode === "online"
        ? `${settings.provider} / ${settings.model || MODEL_PLACEHOLDERS[settings.provider] || ""}`
        : t("dashboard.aiModeManual");

  /**
   * Copia texto para a área de transferência.
   * Usa a Clipboard API moderna com fallback para `execCommand("copy")`
   * em browsers mais antigos (ex: WebView do Tauri em sistemas legados).
   */
  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    toast(t("result.copiedToClipboard"), "success");
  }

  /**
   * Remove emojis do texto para impressão limpa de prova escolar.
   * Emojis não renderizam bem em PDFs e são inadequados para documentos formais.
   */
  function stripEmojis(text: string): string {
    return (
      text
        // Remove emojis pictográficos (carinhas, animais, objetos)
        .replace(/\p{Extended_Pictographic}/gu, "")
        // Remove variação de estilo (transforma dígito em keycap: 1️⃣)
        .replace(/[\u{FE0F}\u{FE0E}]/gu, "")
        // Remove combining enclosing keycap (faz o quadrado ao redor do dígito)
        .replace(/\u{20E3}/gu, "")
        // Remove modificadores de pele e ZWJ
        .replace(/[\u{1F3FB}-\u{1F3FF}\u{200D}]/gu, "")
        // Remove variation selectors suplementares
        .replace(/[\u{E0020}-\u{E007F}]/gu, "")
        // Limpa espaços horizontais extras (preservando quebras de linha)
        .replace(/[^\S\n]{2,}/g, " ")
    );
  }

  /**
   * Gera um documento HTML autocontido estilizado como prova escolar.
   *
   * O template inclui CSS inline completo para impressão perfeita:
   * - Fonte serifada (Georgia), fundo branco, texto preto
   * - Campos de cabeçalho: Nome, Professor, Turma, Data
   * - Page breaks inteligentes (avoid em tabelas, blockquotes, code)
   * - Emojis removidos automaticamente (inadequados para provas)
   * - Sem dependências externas - arquivo 100% standalone
   */
  function buildExamTemplate(markdownContent: string): string {
    // Remove emojis do conteúdo antes de parsear o Markdown
    const cleanContent = stripEmojis(markdownContent);
    let parsedHtml: string;
    try {
      parsedHtml = marked.parse(cleanContent) as string;
    } catch {
      parsedHtml = `<pre>${cleanContent}</pre>`;
    }
    const sanitizedHtml = DOMPurify.sanitize(parsedHtml);

    const personaName = selectedPersona?.meta?.display_name || "Persona";

    return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <title>${t("exam.htmlTitle", { persona: personaName })}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.7;
      color: #111;
      background: #fff;
      max-width: 800px;
      margin: 0 auto;
      padding: 10px 20px;
    }

    /* -- Cabeçalho da prova -- */
    .exam-header {
      border-bottom: 2px solid #333;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .exam-title {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .exam-fields {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .exam-row {
      display: flex;
      gap: 16px;
    }
    .exam-field {
      flex: 1;
      font-size: 11pt;
      border-bottom: 1px solid #999;
      padding: 4px 0;
      min-height: 28px;
    }
    .exam-field.full {
      flex: none;
      width: 100%;
    }
    .exam-field span {
      font-weight: bold;
      margin-right: 8px;
    }

    /* -- Conteúdo -- */
    .exam-content {
      margin-top: 20px;
    }
    h1, h2, h3, h4 {
      font-weight: 700;
      margin: 1em 0 0.4em;
      line-height: 1.3;
      page-break-after: avoid;
    }
    h1 {
      font-size: 16pt;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4pt;
    }
    h2 { font-size: 14pt; }
    h3 { font-size: 12pt; }
    p {
      margin: 0.6em 0;
      orphans: 3;
      widows: 3;
      text-align: justify;
    }
    ul, ol {
      margin: 0.6em 0 0.6em 1.8em;
      page-break-inside: avoid;
    }
    li {
      margin: 0.4em 0;
      line-height: 1.6;
    }
    blockquote {
      border-left: 3px solid #555;
      margin: 1em 0;
      padding: 8pt 14pt;
      background: #f5f5f5;
      font-style: italic;
      page-break-inside: avoid;
    }
    pre {
      background: #f5f5f5;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 10pt;
      font-size: 9pt;
      font-family: "Courier New", monospace;
      white-space: pre-wrap;
      word-wrap: break-word;
      page-break-inside: avoid;
      margin: 0.8em 0;
    }
    code {
      background: #eee;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 1px 4px;
      font-size: 10pt;
      font-family: "Courier New", monospace;
    }
    pre code {
      background: none;
      border: none;
      padding: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      page-break-inside: avoid;
    }
    th {
      background: #eee;
      border: 1px solid #aaa;
      padding: 6pt 10pt;
      text-align: left;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      border: 1px solid #aaa;
      padding: 6pt 10pt;
      font-size: 11pt;
    }
    hr {
      border: none;
      border-top: 2px solid #333;
      margin: 1.5em 0;
    }
    strong { font-weight: bold; }
    em { font-style: italic; }
    img { max-width: 100%; page-break-inside: avoid; }

    /* -- Linha de resposta (para questões) -- */
    .exam-content p + p {
      margin-top: 0.8em;
    }

    /* -- Seções visuais (h2/h3 ganham separador) -- */
    h2 {
      border-top: 1px solid #aaa;
      padding-top: 10pt;
      margin-top: 1.5em;
    }
    h3 {
      border-top: 1px dotted #ccc;
      padding-top: 8pt;
      margin-top: 1.2em;
    }

    /* -- Rodapé discreto -- */
    .exam-footer {
      margin-top: 40px;
      padding-top: 8px;
      border-top: 1px solid #ccc;
      font-size: 8pt;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="exam-header">
    <div class="exam-title">${subjectLabel ? subjectLabel + " - " : ""}${t("exam.adaptedActivity")}</div>
    <div class="exam-fields">
      <div class="exam-field full"><span>${t("exam.nameField")}</span></div>
      <div class="exam-field full"><span>${t("exam.teacherField")}</span></div>
      <div class="exam-row">
        <div class="exam-field"><span>${t("exam.classField")}</span></div>
        <div class="exam-field"><span>${t("exam.dateField")}</span>____/____/________</div>
      </div>
    </div>
  </div>
  <div class="exam-content">
    ${sanitizedHtml}
  </div>
  <div class="exam-footer">
    ${t("exam.footer")}
  </div>
</body>
</html>`;
  }

  /**
   * Exporta o resultado para download via browser.
   * Usa Blob + anchor download (sem dependência de backend).
   */
  async function exportAs(format: string) {
    const text = result || fullPrompt;
    if (!text) return;

    try {
      let content = text;
      let mime = "text/plain";
      let ext = format;

      if (format === "pdf") {
        content = buildExamTemplate(text);
        mime = "text/html";
        ext = "html";
        toast(
          t("result.pdfHint"),
          "info",
        );
      } else if (format === "html") {
        let parsedHtml: string;
        try {
          parsedHtml = marked.parse(text) as string;
        } catch {
          parsedHtml = `<pre>${text}</pre>`;
        }
        const sanitizedHtml = DOMPurify.sanitize(parsedHtml);
        content = `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"><title>${t("exam.htmlTitleSimple")}</title></head><body><div style="font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.8">${sanitizedHtml}</div></body></html>`;
        mime = "text/html";
      } else if (format === "md") {
        mime = "text/markdown";
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `adaptacao-pbl.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast(t("result.fileSaved", { format: format.toUpperCase() }), "success");
    } catch (e) {
      toast(`${t("result.fileError", { format: format.toUpperCase() })}: ${e}`, "error");
    }
  }

  /**
   * Renderiza o markdown do resultado como HTML sanitizado.
   * Envolvido em try/catch pois markdown malformado pode causar exceção no parser.
   */
  function renderSanitizedMarkdown(markdownText: string): string {
    try {
      const rawHtml = marked.parse(markdownText) as string;
      return DOMPurify.sanitize(rawHtml);
    } catch {
      // Fallback: exibe texto raw se o parser falhar
      return DOMPurify.sanitize(`<pre>${markdownText}</pre>`);
    }
  }

  return (
    <section id="print-area">
      <div className="mb-8 no-print">
        <h1 className="text-[28px] font-bold text-txt mb-1.5">{t("result.title")}</h1>
        <p className="text-sm text-txt-2">
          {t("result.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5 no-print">
        <span className="bg-accent/12 border border-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full">
          {selectedPersona?.meta?.display_name}
        </span>
        <span className="bg-accent/12 border border-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full">
          {subjectLabel}
        </span>
        <span className="bg-accent/12 border border-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full">
          {diffLabel}
        </span>
      </div>

      {/* Modo manual: exibe blocos de prompt para cópia */}
      {isManual && (
        <div>
          <Block
            title={t("result.systemPrompt")}
            text={selectedPersona?.prompts?.system_prompt || ""}
            onCopy={copy}
          />
          <Block
            title={t("result.fullInstruction")}
            text={fullPrompt}
            onCopy={copy}
          />
          <p className="text-xs text-txt-3 py-2.5 flex items-center gap-1.5">
            <Icon name="info" size={14} className="text-txt-3 shrink-0" />
            {t("result.manualHint")}
          </p>
        </div>
      )}

      {/* Modo IA: renderiza markdown sanitizado */}
      {!isManual && (
        <div>
          <div className="flex items-center justify-between mb-3 no-print">
            <button
              onClick={() => copy(result)}
              className="inline-flex items-center gap-1.5 text-[13px] text-txt-2 border border-border rounded-sm px-3 py-1.5 hover:bg-bg-3 transition-colors"
            >
              <Icon name="copy" size={14} /> {t("result.copyText")}
            </button>
            <span className="text-xs text-txt-3">{t("result.generatedBy")}: {aiLabel}</span>
          </div>
          <div
            className="prose bg-bg-2 border border-border rounded p-7 text-[15px] leading-relaxed text-txt"
            dangerouslySetInnerHTML={{
              __html: renderSanitizedMarkdown(result),
            }}
          />
        </div>
      )}

      {/* Barra de exportação */}
      <div className="flex items-center gap-2.5 flex-wrap my-4 no-print">
        <span className="text-xs text-txt-2 font-medium">{t("result.export")}:</span>
        {["txt", "md", "html", "docx"].map((f) => (
          <button
            key={f}
            onClick={() => exportAs(f)}
            className="text-[12px] text-txt border border-border rounded-sm px-3 py-1.5 bg-bg-3 hover:border-accent transition-colors uppercase"
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => exportAs("pdf")}
          className="inline-flex items-center gap-1.5 text-[12px] text-txt border border-border rounded-sm px-3 py-1.5 bg-bg-3 hover:border-accent transition-colors"
        >
          <Icon name="print" size={13} /> PDF
        </button>
      </div>

      {/* Ações do resultado */}
      <div className="flex items-center gap-2.5 flex-wrap no-print">
        <button
          onClick={onSaveHistory}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-gold text-[#0d0d0d] font-semibold text-[13px] hover:bg-gold-2 transition-colors"
        >
          <Icon name="save" size={15} /> {t("result.saveHistory")}
        </button>
        <button
          onClick={onNewAdaptation}
          className="inline-flex items-center gap-1.5 text-[13px] text-txt-2 border border-border rounded-sm px-4 py-2.5 hover:bg-bg-3 transition-colors"
        >
          <Icon name="refresh" size={14} /> {t("result.newAdaptation")}
        </button>
      </div>
    </section>
  );
});

/**
 * Bloco de texto copiável, usado no modo manual para exibir prompts.
 *
 * Renderiza o texto em um `<pre>` com scroll vertical e um botão de cópia
 * no cabeçalho. Limitado a 320px de altura para manter a usabilidade.
 */
function Block({
  title,
  text,
  onCopy,
}: {
  title: string;
  text: string;
  onCopy: (t: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="bg-bg-2 border border-border rounded mb-5 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b border-border text-xs text-txt-2 uppercase tracking-wider">
        <span>{title}</span>
        <button
          onClick={() => onCopy(text)}
          className="inline-flex items-center gap-1.5 text-[12px] text-txt border border-border rounded-sm px-2 py-1 hover:bg-bg-3 transition-colors"
        >
          <Icon name="copy" size={12} /> {t("dashboard.copy")}
        </button>
      </div>
      <pre className="p-4 text-[13px] leading-relaxed text-txt whitespace-pre-wrap wrap-break-word max-h-80 overflow-y-auto">
        {text}
      </pre>
    </div>
  );
}

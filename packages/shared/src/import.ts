/**
 * @module import
 * @description Importação de arquivos para o campo de conteúdo (versão web).
 *
 * Usa APIs nativas do browser (FileReader, DOMParser) para extrair
 * texto de diferentes formatos de arquivo sem dependências externas.
 *
 * Formatos suportados:
 * - **txt/md**: leitura direta como texto
 * - **docx**: extrai texto dos parágrafos via ZIP + XML (JSZip não necessário, usa DOMParser)
 * - **jpg/png/webp/gif**: OCR via API de IA com vision
 */

import { t as tStandalone, getLocale } from "./i18n";

/** Extensões de imagem suportadas para OCR */
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

/** Extensões de documento suportadas para extração direta */
const DOC_EXTENSIONS = ["txt", "md", "docx", "odt", "pdf"];

/**
 * Verifica se a extensão é de imagem.
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Abre o seletor de arquivo do browser e retorna o File selecionado.
 *
 * @param accept - MIME types aceitos (ex: ".pdf,.docx,.txt,.md,.jpg,.png")
 * @returns File selecionado ou null se cancelado
 */
export function openFilePicker(accept?: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept || ".txt,.md,.docx,.odt,.pdf,.jpg,.jpeg,.png,.webp,.gif";
    input.onchange = () => {
      resolve(input.files?.[0] || null);
    };
    // Se o dialog for cancelado
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Extrai texto de um arquivo de documento (TXT, MD, DOCX).
 *
 * @param file - Arquivo selecionado pelo usuário
 * @returns Texto extraído
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (ext === "txt" || ext === "md") {
    return file.text();
  }

  if (ext === "docx") {
    return extractDocxText(file);
  }

  if (ext === "odt") {
    return extractOdtText(file);
  }

  if (ext === "pdf") {
    return extractPdfText(file);
  }

  throw new Error(`Formato '${ext}' não suportado para importação direta`);
}

/**
 * Extrai texto de um arquivo DOCX.
 *
 * DOCX é um ZIP contendo XMLs. O texto fica em `word/document.xml`
 * dentro de tags `<w:t>`. Usa JSZip-free approach com a API de
 * descompressão nativa do browser (DecompressionStream) ou fallback.
 */
async function extractDocxText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const xmlContent = await extractFileFromZip(buffer, "word/document.xml");

  if (!xmlContent) {
    throw new Error(tStandalone("errors.importDocxInvalid", getLocale()));
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");

  const paragraphs: string[] = [];
  const pElements = doc.getElementsByTagName("w:p");

  for (let i = 0; i < pElements.length; i++) {
    const tElements = pElements[i].getElementsByTagName("w:t");
    let paraText = "";
    for (let j = 0; j < tElements.length; j++) {
      paraText += tElements[j].textContent || "";
    }
    paragraphs.push(paraText);
  }

  return paragraphs.join("\n");
}

/**
 * Extrai um arquivo de dentro de um ZIP (DOCX).
 * Parser ZIP mínimo que busca um arquivo específico.
 */
async function extractFileFromZip(
  buffer: ArrayBuffer,
  targetFile: string,
): Promise<string | null> {
  const bytes = new Uint8Array(buffer);

  // ZIP Local File Header magic bytes: PK\x03\x04
  for (let i = 0; i < bytes.length - 30; i++) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x03 &&
      bytes[i + 3] === 0x04
    ) {
      const compressionMethod = bytes[i + 8] | (bytes[i + 9] << 8);
      const compressedSize =
        bytes[i + 18] |
        (bytes[i + 19] << 8) |
        (bytes[i + 20] << 16) |
        (bytes[i + 21] << 24);
      const filenameLength = bytes[i + 26] | (bytes[i + 27] << 8);
      const extraLength = bytes[i + 28] | (bytes[i + 29] << 8);

      const filenameBytes = bytes.slice(i + 30, i + 30 + filenameLength);
      const filename = new TextDecoder().decode(filenameBytes);

      const dataStart = i + 30 + filenameLength + extraLength;

      if (filename === targetFile) {
        const fileData = bytes.slice(dataStart, dataStart + compressedSize);

        if (compressionMethod === 0) {
          return new TextDecoder().decode(fileData);
        } else if (compressionMethod === 8) {
          try {
            const ds = new DecompressionStream("deflate-raw");
            const writer = ds.writable.getWriter();
            writer.write(fileData);
            writer.close();
            const reader = ds.readable.getReader();
            const chunks: Uint8Array[] = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }
            const total = chunks.reduce((acc, c) => acc + c.length, 0);
            const result = new Uint8Array(total);
            let offset = 0;
            for (const chunk of chunks) {
              result.set(chunk, offset);
              offset += chunk.length;
            }
            return new TextDecoder().decode(result);
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Extrai texto de um arquivo ODT.
 *
 * ODT é um ZIP contendo um `content.xml`. O texto fica em tags `<text:p>`.
 * Usa a mesma abordagem do backend Rust em `import.rs`.
 */
async function extractOdtText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const xmlContent = await extractFileFromZip(buffer, "content.xml");

  if (!xmlContent) {
    throw new Error(tStandalone("errors.importOdtInvalid", getLocale()));
  }

  // Extrai texto das tags <text:p>
  const paragraphs: string[] = [];
  let remaining = xmlContent;

  while (remaining.includes("<text:p")) {
    const start = remaining.indexOf("<text:p");
    if (start === -1) break;
    const tagEnd = remaining.indexOf(">", start);
    if (tagEnd === -1) break;
    const closeTag = "</text:p>";
    const end = remaining.indexOf(closeTag, tagEnd);
    if (end === -1) break;
    const inner = remaining.slice(tagEnd + 1, end);
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (text) paragraphs.push(text);
    remaining = remaining.slice(end + closeTag.length);
  }

  if (paragraphs.length === 0) {
    throw new Error(tStandalone("errors.importOdtNoText", getLocale()));
  }

  return paragraphs.join("\n");
}

/**
 * Extrai texto de um arquivo PDF usando pdfjs-dist (importado dinamicamente).
 *
 * Limitações:
 * - PDFs escaneados (páginas como imagem) retornam texto vazio.
 * - Não há suporte a OCR no browser.
 */
async function extractPdfText(file: File): Promise<string> {
  const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_PDF_SIZE) {
    throw new Error(
      tStandalone("errors.importPdfTooLarge", getLocale(), {
        size: (file.size / 1024 / 1024).toFixed(1),
      })
    );
  }

  // Dynamic import - resolve apenas no contexto web (pdfjs-dist está em web/package.json)
  // @vite-ignore impede que o Vite do desktop tente bundlar esta dep ausente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdfjsLib: any;
  try {
    pdfjsLib = await /* @vite-ignore */ import("pdfjs-dist");
  } catch {
    throw new Error(tStandalone("errors.importPdfNotSupported", getLocale()));
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: { str?: string }) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    if (pageText) pages.push(pageText);
  }

  const text = pages.join("\n").trim();
  if (!text) {
    throw new Error(tStandalone("errors.importPdfNoText", getLocale()));
  }

  return text;
}
/**
 * Converte um arquivo de imagem para data URL base64.
 *
 * @param file - Arquivo de imagem
 * @returns Data URL no formato "data:image/...;base64,..."
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(tStandalone("errors.importImageError", getLocale())));
    reader.readAsDataURL(file);
  });
}

/**
 * Extrai texto de uma imagem usando API de IA com vision.
 *
 * @param file - Arquivo de imagem
 * @param provider - Provedor de IA (openai, gemini, anthropic)
 * @param apiKey - Chave da API
 * @param model - Modelo a usar
 * @returns Texto extraído da imagem
 */
export async function extractTextFromImage(
  file: File,
  provider: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const dataUrl = await imageToBase64(file);
  const base64 = dataUrl.split(",")[1];
  const mimeMatch = dataUrl.match(/data:(image\/[^;]+);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const prompt = tStandalone("errors.ocrPrompt", getLocale());

  if (provider === "gemini") {
    return callGeminiVision(apiKey, model || "gemini-2.0-flash", prompt, mime, base64);
  } else if (provider === "anthropic") {
    return callAnthropicVision(apiKey, model || "claude-3-5-sonnet-20241022", prompt, mime, base64);
  } else {
    return callOpenaiVision(provider, apiKey, model || "gpt-5.4", prompt, mime, base64);
  }
}

// ─── Vision API calls ───────────────────────────────────────────────────────

/** Envia imagem para a API OpenAI-compatible (OpenAI, OpenRouter, Groq). */
async function callOpenaiVision(
  provider: string,
  apiKey: string,
  model: string,
  prompt: string,
  mime: string,
  b64: string,
): Promise<string> {
  const baseUrl =
    provider === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

  const resp = await fetch(baseUrl, {
    method: "POST",
    signal: AbortSignal.timeout(60_000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:${mime};base64,${b64}` },
            },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });

  if (!resp.ok) {
    throw new Error(
      tStandalone("errors.visionApiError", getLocale(), {
        status: resp.status,
        error: await resp.text(),
      }),
    );
  }
  const j = await resp.json();
  const text = j?.choices?.[0]?.message?.content;
  if (!text) throw new Error(j?.error?.message || tStandalone("errors.importEmptyAPI", getLocale()));
  return text;
}

/** Envia imagem para a API Gemini Vision. */
async function callGeminiVision(
  apiKey: string,
  model: string,
  prompt: string,
  mime: string,
  b64: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const resp = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(60_000),
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mime, data: b64 } },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 4096 },
    }),
  });

  if (!resp.ok) {
    throw new Error(
      tStandalone("errors.geminiVisionError", getLocale(), {
        status: resp.status,
        error: await resp.text(),
      }),
    );
  }
  const j = await resp.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(tStandalone("errors.importGeminiError", getLocale()));
  return text;
}

/**
 * Envia imagem para a API Anthropic Vision.
 * Requer header `anthropic-dangerous-direct-browser-access` devido a CORS.
 */
async function callAnthropicVision(
  apiKey: string,
  model: string,
  prompt: string,
  mime: string,
  b64: string,
): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(60_000),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mime, data: b64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!resp.ok) {
    throw new Error(
      tStandalone("errors.anthropicVisionError", getLocale(), {
        status: resp.status,
        error: await resp.text(),
      }),
    );
  }
  const j = await resp.json();
  const text = j?.content?.[0]?.text;
  if (!text) throw new Error(tStandalone("errors.importAnthropicError", getLocale()));
  return text;
}

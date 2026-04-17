//! # Módulo Export - Exportação multi-formato de conteúdo adaptado
//!
//! Responsável por transformar o conteúdo adaptado pela IA em arquivos
//! persistentes no disco. Suporta TXT, HTML, Markdown e DOCX nativo.

use std::fs;
use std::path::Path;

/// Extensões válidas por formato de exportação.
/// Garante que o arquivo exportado tenha a extensão correta,
/// prevenindo gravação em locais arbitrários do disco.
const VALID_EXTENSIONS: &[(&str, &[&str])] = &[
    ("txt", &["txt"]),
    ("html", &["html", "htm"]),
    ("md", &["md"]),
    ("docx", &["docx"]),
    ("pdf", &["pdf"]),
];

/// Valida o caminho de destino da exportação por segurança.
///
/// Rejeita caminhos que:
/// - Não possuem extensão de arquivo
/// - Possuem extensão incompatível com o formato solicitado
///
/// Isso previne ataques onde o frontend poderia enviar um caminho
/// arbitrário para sobrescrever arquivos do sistema.
fn validate_export_path(path: &str, format: &str) -> Result<(), String> {
    let path_obj = Path::new(path);

    // Verifica se o diretório pai existe (canonicalize precisa de um path existente)
    if let Some(parent) = path_obj.parent() {
        if parent.to_str().map(|s| !s.is_empty()).unwrap_or(false) {
            let canonical_parent = std::fs::canonicalize(parent)
                .map_err(|_| "Diretório de destino inválido ou inexistente.".to_string())?;

            let canon_str = canonical_parent.to_string_lossy().to_lowercase();

            // Deny-list: bloqueia diretórios de sistema conhecidos
            let blocked = [
                "\\windows\\",
                "\\system32",
                "\\syswow64",
                "\\program files",
                "\\program files (x86)",
                "\\programdata",
                "/etc/",
                "/usr/",
                "/bin/",
                "/sbin/",
                "/var/",
            ];
            if blocked.iter().any(|b| canon_str.contains(b)) {
                return Err("Não é permitido exportar para diretórios de sistema.".to_string());
            }

            // Bloqueia raiz de volume (ex: "C:\" direto)
            #[cfg(target_os = "windows")]
            if canon_str.len() <= 3 && canon_str.ends_with('\\') {
                return Err("Não é permitido exportar diretamente na raiz do disco.".to_string());
            }

            // Allow-list: se possível, verifica se está no perfil do usuário
            if let Ok(user_profile) =
                std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME"))
            {
                let user_lower = user_profile.to_lowercase();
                if !canon_str.starts_with(&user_lower) {
                    log::warn!(
                        "[PBL] Export fora do perfil do usuário: {} (permitido, mas logado)",
                        canon_str
                    );
                }
            }
        }
    }

    // Valida extensão vs formato solicitado
    let ext = path_obj
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase());

    let valid = VALID_EXTENSIONS
        .iter()
        .find(|(f, _)| *f == format)
        .map(|(_, exts)| {
            ext.as_ref()
                .map(|e| exts.contains(&e.as_str()))
                .unwrap_or(false)
        })
        .unwrap_or(false);

    if !valid {
        return Err(format!(
            "Extensão do arquivo incompatível com o formato '{}'. Verifique o caminho de destino.",
            format
        ));
    }

    Ok(())
}

/// Exporta conteúdo adaptado para um arquivo no disco.
///
/// Suporta múltiplos formatos de saída para atender diferentes necessidades
/// pedagógicas:
/// - **txt/html/md**: gravação direta do conteúdo como texto
/// - **docx**: geração de documento Word nativo via `docx-rs`, com cada
///   linha do conteúdo convertida em um parágrafo separado
///
/// # Segurança
/// O caminho é validado para garantir que a extensão corresponde ao formato
/// solicitado, prevenindo gravação em locais arbitrários.
///
/// # Parâmetros
/// - `content`: texto a ser exportado
/// - `format`: formato de saída (`"txt"`, `"html"`, `"md"`, `"docx"`)
/// - `path`: caminho absoluto de destino no disco
///
/// # Erros
/// Retorna `Err` se o formato não for suportado, a extensão for inválida
/// ou se a gravação falhar.
#[tauri::command]
pub fn export_file(content: String, format: String, path: String) -> Result<(), String> {
    validate_export_path(&path, &format)?;

    match format.as_str() {
        "txt" | "md" => fs::write(&path, content).map_err(|e| {
            log::error!("[PBL] Erro ao exportar arquivo: {e}");
            "Não foi possível salvar o arquivo exportado".to_string()
        }),
        "html" => generate_html(&content, &path),
        "docx" => generate_docx(&content, &path),
        "pdf" => generate_pdf(&content, &path),
        _ => Err(format!(
            "Formato '{}' não suportado. Use: txt, html, md, docx ou pdf",
            format
        )),
    }
}

/// Aplica formatação inline Markdown em uma string para HTML.
/// `**bold**` → `<strong>`, `*italic*` → `<em>`
fn md_inline_to_html(text: &str) -> String {
    // Bold primeiro (** antes de *)
    let out = text.to_string();
    let mut result = String::new();
    let mut remaining = out.as_str();

    while !remaining.is_empty() {
        if let Some(pos) = remaining.find("**") {
            result.push_str(&html_escape(&remaining[..pos]));
            remaining = &remaining[pos + 2..];
            if let Some(end) = remaining.find("**") {
                result.push_str("<strong>");
                result.push_str(&html_escape(&remaining[..end]));
                result.push_str("</strong>");
                remaining = &remaining[end + 2..];
            } else {
                result.push_str("**");
            }
        } else if let Some(pos) = remaining.find('*') {
            result.push_str(&html_escape(&remaining[..pos]));
            remaining = &remaining[pos + 1..];
            if let Some(end) = remaining.find('*') {
                result.push_str("<em>");
                result.push_str(&html_escape(&remaining[..end]));
                result.push_str("</em>");
                remaining = &remaining[end + 1..];
            } else {
                result.push('*');
            }
        } else {
            result.push_str(&html_escape(remaining));
            break;
        }
    }
    result
}

/// Escapa caracteres HTML especiais
fn html_escape(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// Gera HTML formatado a partir do conteúdo Markdown.
fn generate_html(content: &str, path: &str) -> Result<(), String> {
    let mut body = String::new();
    let mut in_ul = false;
    let mut in_ol = false;

    for line in content.lines() {
        let trimmed = line.trim();

        // Fechar listas se a linha não é item
        let is_ul = trimmed.starts_with("- ")
            || trimmed.starts_with("+ ")
            || (trimmed.starts_with("* ") && !trimmed.starts_with("**"));
        let is_ol = trimmed
            .find(". ")
            .map(|p| !trimmed[..p].is_empty() && trimmed[..p].chars().all(|c| c.is_ascii_digit()))
            .unwrap_or(false);

        if !is_ul && in_ul {
            body.push_str("</ul>\n");
            in_ul = false;
        }
        if !is_ol && in_ol {
            body.push_str("</ol>\n");
            in_ol = false;
        }

        if trimmed.is_empty() {
            body.push_str("<br>\n");
        } else if trimmed == "---" || trimmed == "___" || trimmed == "***" {
            body.push_str("<hr>\n");
        } else if let Some(h) = trimmed.strip_prefix("###### ") {
            body.push_str(&format!("<h6>{}</h6>\n", md_inline_to_html(h)));
        } else if let Some(h) = trimmed.strip_prefix("##### ") {
            body.push_str(&format!("<h5>{}</h5>\n", md_inline_to_html(h)));
        } else if let Some(h) = trimmed.strip_prefix("#### ") {
            body.push_str(&format!("<h4>{}</h4>\n", md_inline_to_html(h)));
        } else if let Some(h) = trimmed.strip_prefix("### ") {
            body.push_str(&format!("<h3>{}</h3>\n", md_inline_to_html(h)));
        } else if let Some(h) = trimmed.strip_prefix("## ") {
            body.push_str(&format!("<h2>{}</h2>\n", md_inline_to_html(h)));
        } else if let Some(h) = trimmed.strip_prefix("# ") {
            body.push_str(&format!("<h1>{}</h1>\n", md_inline_to_html(h)));
        } else if let Some(q) = trimmed.strip_prefix("> ") {
            body.push_str(&format!(
                "<blockquote>{}</blockquote>\n",
                md_inline_to_html(q)
            ));
        } else if is_ul {
            if !in_ul {
                body.push_str("<ul>\n");
                in_ul = true;
            }
            let rest = trimmed[2..].trim();
            body.push_str(&format!("  <li>{}</li>\n", md_inline_to_html(rest)));
        } else if is_ol {
            if !in_ol {
                body.push_str("<ol>\n");
                in_ol = true;
            }
            let dot_pos = trimmed.find(". ").unwrap();
            let rest = &trimmed[dot_pos + 2..];
            body.push_str(&format!("  <li>{}</li>\n", md_inline_to_html(rest)));
        } else {
            body.push_str(&format!("<p>{}</p>\n", md_inline_to_html(trimmed)));
        }
    }

    if in_ul {
        body.push_str("</ul>\n");
    }
    if in_ol {
        body.push_str("</ol>\n");
    }

    let html = format!(
        r#"<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>PBL - Conteúdo Adaptado</title>
  <style>
    body {{ font-family: 'Liberation Sans', Arial, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #222; line-height: 1.7; font-size: 14px; }}
    h1 {{ text-align: center; font-size: 1.4rem; margin: 1.5rem 0; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }}
    h2 {{ font-size: 1.2rem; margin: 1.2rem 0 0.5rem; color: #333; }}
    h3 {{ font-size: 1.05rem; margin: 1rem 0 0.4rem; }}
    h4,h5,h6 {{ font-size: 1rem; margin: 0.8rem 0 0.3rem; }}
    hr {{ border: none; border-top: 1px solid #ccc; margin: 1.5rem 0; }}
    p {{ margin: 0.4rem 0; }}
    blockquote {{ border-left: 3px solid #888; margin: 0.8rem 0; padding: 0.5rem 1rem; color: #555; font-style: italic; background: #f8f8f8; }}
    ul, ol {{ margin: 0.5rem 0; padding-left: 2rem; }}
    li {{ margin: 0.2rem 0; }}
    strong {{ font-weight: bold; }}
    em {{ font-style: italic; }}
  </style>
</head>
<body>
{body}
</body>
</html>"#
    );

    fs::write(path, html).map_err(|e| {
        log::error!("[PBL] Erro ao exportar HTML: {e}");
        "Não foi possível salvar o arquivo HTML".to_string()
    })
}

/// Gera DOCX formatado a partir do conteúdo Markdown usando docx-rs.
fn generate_docx(content: &str, path: &str) -> Result<(), String> {
    use docx_rs::*;

    let mut doc = Docx::new();

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.is_empty() {
            doc = doc.add_paragraph(Paragraph::new());
        } else if trimmed == "---" || trimmed == "___" || trimmed == "***" {
            // Separador → parágrafo vazio com borda inferior
            doc = doc.add_paragraph(Paragraph::new());
        } else if let Some(h) = trimmed
            .strip_prefix("###### ")
            .or_else(|| trimmed.strip_prefix("##### "))
            .or_else(|| trimmed.strip_prefix("#### "))
        {
            doc =
                doc.add_paragraph(Paragraph::new().add_run(Run::new().add_text(h).bold().size(22)));
        } else if let Some(h) = trimmed.strip_prefix("### ") {
            doc =
                doc.add_paragraph(Paragraph::new().add_run(Run::new().add_text(h).bold().size(24)));
        } else if let Some(h) = trimmed.strip_prefix("## ") {
            doc =
                doc.add_paragraph(Paragraph::new().add_run(Run::new().add_text(h).bold().size(28)));
        } else if let Some(h) = trimmed.strip_prefix("# ") {
            doc = doc.add_paragraph(
                Paragraph::new()
                    .align(AlignmentType::Center)
                    .add_run(Run::new().add_text(h).bold().size(32)),
            );
        } else if let Some(q) = trimmed.strip_prefix("> ") {
            doc = doc.add_paragraph(
                Paragraph::new()
                    .indent(Some(720), None, None, None)
                    .add_run(Run::new().add_text(q).italic().color("555555")),
            );
        } else if let Some(rest) = trimmed
            .strip_prefix("- ")
            .or_else(|| trimmed.strip_prefix("+ "))
        {
            doc = doc.add_paragraph(
                Paragraph::new()
                    .indent(Some(360), None, None, None)
                    .add_run(Run::new().add_text(format!("• {}", rest))),
            );
        } else if trimmed.starts_with("* ") && !trimmed.starts_with("**") {
            let rest = &trimmed[2..];
            doc = doc.add_paragraph(
                Paragraph::new()
                    .indent(Some(360), None, None, None)
                    .add_run(Run::new().add_text(format!("• {}", rest))),
            );
        } else {
            // Parse inline markdown para DOCX
            let para = build_docx_paragraph(trimmed);
            doc = doc.add_paragraph(para);
        }
    }

    let mut file = fs::File::create(path).map_err(|e| {
        log::error!("[PBL] Erro ao criar arquivo DOCX: {e}");
        "Não foi possível criar o arquivo DOCX".to_string()
    })?;
    doc.build().pack(&mut file).map_err(|e| {
        log::error!("[PBL] Erro ao gerar DOCX: {e}");
        "Erro ao gerar o documento DOCX".to_string()
    })?;
    Ok(())
}

/// Constrói um Paragraph DOCX com formatação inline (**bold**, *italic*).
fn build_docx_paragraph(line: &str) -> docx_rs::Paragraph {
    use docx_rs::*;

    let mut para = Paragraph::new();
    let mut remaining = line;

    while !remaining.is_empty() {
        if let Some(pos) = remaining.find("**") {
            if pos > 0 {
                para = para.add_run(Run::new().add_text(&remaining[..pos]));
            }
            remaining = &remaining[pos + 2..];
            if let Some(end) = remaining.find("**") {
                para = para.add_run(Run::new().add_text(&remaining[..end]).bold());
                remaining = &remaining[end + 2..];
            } else {
                para = para.add_run(Run::new().add_text("**"));
            }
        } else if let Some(pos) = remaining.find('*') {
            if pos > 0 {
                para = para.add_run(Run::new().add_text(&remaining[..pos]));
            }
            remaining = &remaining[pos + 1..];
            if let Some(end) = remaining.find('*') {
                para = para.add_run(Run::new().add_text(&remaining[..end]).italic());
                remaining = &remaining[end + 1..];
            } else {
                para = para.add_run(Run::new().add_text("*"));
            }
        } else {
            para = para.add_run(Run::new().add_text(remaining));
            break;
        }
    }

    para
}

/// Gera PDF a partir do conteúdo usando a crate `genpdf`.
///
/// As fontes Liberation Sans são embutidas no binário via `include_bytes!()`.
/// O parser reconhece formatação markdown-like:
/// - `# Título` → heading grande e negrito
/// - `## Subtítulo` → heading médio e negrito
/// - `**texto**` → negrito
/// - `---` → separador horizontal
/// - Linhas em branco → espaçamento vertical
///
/// Converte uma linha de texto com formatação Markdown inline
/// (`**negrito**`, `*itálico*`, `***negrito+itálico***`) em um
/// `Paragraph` do genpdf com segmentos estilizados via `push_styled`.
///
/// Opera inteiramente com `&str` slicing (byte offsets) para
/// segurança com texto UTF-8 (caracteres acentuados do português).
fn parse_md_line(line: &str) -> genpdf::elements::Paragraph {
    use genpdf::{elements, style};

    let mut p = elements::Paragraph::default();
    let mut remaining = line;

    while !remaining.is_empty() {
        if let Some(star_pos) = remaining.find('*') {
            // Push text before the *
            if star_pos > 0 {
                p.push(&remaining[..star_pos]);
            }
            remaining = &remaining[star_pos..];

            // Count consecutive * (ASCII, so 1 byte each)
            let stars = remaining.bytes().take_while(|b| *b == b'*').count();
            remaining = &remaining[stars..];

            // Determine closing delimiter
            let closing = match stars {
                n if n >= 3 => "***",
                2 => "**",
                _ => "*",
            };

            if let Some(end_pos) = remaining.find(closing) {
                let inner = &remaining[..end_pos];
                let st = match closing.len() {
                    3 => style::Style::new().bold().italic(),
                    2 => style::Style::new().bold(),
                    _ => style::Style::new().italic(),
                };
                p.push_styled(inner, st);
                remaining = &remaining[end_pos + closing.len()..];
            } else {
                // No closing delimiter - push stars as literal text
                let stars_str: String = (0..stars).map(|_| '*').collect();
                p.push(stars_str);
            }
        } else {
            // No more *, push remainder
            p.push(remaining);
            break;
        }
    }

    p
}

// ─── Fontes embutidas no binário (Liberation Sans, SIL OFL) ─────────────────
// Os bytes são referenciados como slices estáticos pelo compilador (zero-copy).
// Apenas a construção de FontData aloca (necessário pois genpdf não implementa Clone).
static FONT_REGULAR: &[u8] = include_bytes!("../fonts/LiberationSans-Regular.ttf");
static FONT_BOLD: &[u8] = include_bytes!("../fonts/LiberationSans-Bold.ttf");
static FONT_ITALIC: &[u8] = include_bytes!("../fonts/LiberationSans-Italic.ttf");
static FONT_BOLD_ITALIC: &[u8] = include_bytes!("../fonts/LiberationSans-BoldItalic.ttf");

fn generate_pdf(content: &str, path: &str) -> Result<(), String> {
    use genpdf::{elements, fonts, style, Alignment};

    let font_family = fonts::FontFamily {
        regular: fonts::FontData::new(FONT_REGULAR.to_vec(), None)
            .map_err(|e| format!("Erro ao carregar fonte regular: {e}"))?,
        bold: fonts::FontData::new(FONT_BOLD.to_vec(), None)
            .map_err(|e| format!("Erro ao carregar fonte bold: {e}"))?,
        italic: fonts::FontData::new(FONT_ITALIC.to_vec(), None)
            .map_err(|e| format!("Erro ao carregar fonte italic: {e}"))?,
        bold_italic: fonts::FontData::new(FONT_BOLD_ITALIC.to_vec(), None)
            .map_err(|e| format!("Erro ao carregar fonte bold-italic: {e}"))?,
    };

    let mut doc = genpdf::Document::new(font_family);
    doc.set_title("PBL - Conteúdo Adaptado");
    doc.set_minimal_conformance();
    doc.set_font_size(10);

    // Margens (mm)
    let mut decorator = genpdf::SimplePageDecorator::new();
    decorator.set_margins(20);
    doc.set_page_decorator(decorator);

    // Estilos reutilizáveis para headings
    let style_h1 = style::Style::new().bold().with_font_size(16);
    let style_h2 = style::Style::new().bold().with_font_size(13);
    let style_h3 = style::Style::new().bold().with_font_size(11);
    let style_h4 = style::Style::new().bold().with_font_size(10);
    let style_quote = style::Style::new()
        .italic()
        .with_color(style::Color::Rgb(80, 80, 80));

    // Buffers para acumular itens de lista consecutivos
    let mut unordered_items: Vec<genpdf::elements::Paragraph> = Vec::new();
    let mut ordered_items: Vec<genpdf::elements::Paragraph> = Vec::new();

    /// Flush de lista não-ordenada acumulada
    fn flush_unordered(doc: &mut genpdf::Document, items: &mut Vec<genpdf::elements::Paragraph>) {
        if items.is_empty() {
            return;
        }
        let mut list = elements::UnorderedList::new();
        for item in items.drain(..) {
            list.push(item);
        }
        doc.push(list);
    }

    /// Flush de lista ordenada acumulada
    fn flush_ordered(doc: &mut genpdf::Document, items: &mut Vec<genpdf::elements::Paragraph>) {
        if items.is_empty() {
            return;
        }
        let mut list = elements::OrderedList::new();
        for item in items.drain(..) {
            list.push(item);
        }
        doc.push(list);
    }

    for line in content.lines() {
        let trimmed = line.trim();

        // ── Linha em branco ──
        if trimmed.is_empty() {
            flush_unordered(&mut doc, &mut unordered_items);
            flush_ordered(&mut doc, &mut ordered_items);
            doc.push(elements::Break::new(0.5));
            continue;
        }

        // ── Separadores (---, ___, ***) ──
        if (trimmed == "---" || trimmed == "___" || trimmed == "***") && trimmed.len() >= 3 {
            flush_unordered(&mut doc, &mut unordered_items);
            flush_ordered(&mut doc, &mut ordered_items);
            doc.push(elements::Break::new(1.0));
            continue;
        }

        // ── Headings (#, ##, ###, ####, #####, ######) ──
        if trimmed.starts_with('#') {
            flush_unordered(&mut doc, &mut unordered_items);
            flush_ordered(&mut doc, &mut ordered_items);

            if let Some(heading) = trimmed.strip_prefix("###### ") {
                let mut p = elements::Paragraph::default();
                p.push_styled(heading, style_h4);
                doc.push(p);
            } else if let Some(heading) = trimmed.strip_prefix("##### ") {
                let mut p = elements::Paragraph::default();
                p.push_styled(heading, style_h4);
                doc.push(p);
            } else if let Some(heading) = trimmed.strip_prefix("#### ") {
                doc.push(elements::Break::new(0.2));
                let mut p = elements::Paragraph::default();
                p.push_styled(heading, style_h4);
                doc.push(p);
            } else if let Some(heading) = trimmed.strip_prefix("### ") {
                doc.push(elements::Break::new(0.2));
                let mut p = elements::Paragraph::default();
                p.push_styled(heading, style_h3);
                doc.push(p);
            } else if let Some(heading) = trimmed.strip_prefix("## ") {
                doc.push(elements::Break::new(0.3));
                let mut p = elements::Paragraph::default();
                p.push_styled(heading, style_h2);
                doc.push(p);
                doc.push(elements::Break::new(0.2));
            } else if let Some(heading) = trimmed.strip_prefix("# ") {
                doc.push(elements::Break::new(0.5));
                let mut p = elements::Paragraph::default();
                p.push_styled(heading, style_h1);
                p.set_alignment(Alignment::Center);
                doc.push(p);
                doc.push(elements::Break::new(0.5));
            }
            continue;
        }

        // ── Blockquote (> texto) ──
        if let Some(quote_text) = trimmed.strip_prefix("> ") {
            flush_unordered(&mut doc, &mut unordered_items);
            flush_ordered(&mut doc, &mut ordered_items);
            let mut p = elements::Paragraph::default();
            p.push_styled(format!("  \u{201C}{}\u{201D}", quote_text), style_quote);
            doc.push(elements::PaddedElement::new(
                p,
                genpdf::Margins::trbl(1, 0, 1, 10),
            ));
            continue;
        }

        // ── Lista não-ordenada (- item, * item, + item) ──
        if let Some(rest) = trimmed
            .strip_prefix("- ")
            .or_else(|| trimmed.strip_prefix("+ "))
        {
            flush_ordered(&mut doc, &mut ordered_items);
            let item = parse_md_line(rest);
            unordered_items.push(item);
            continue;
        }
        // * como bullet (somente se não é bold como ** ou separador ***)
        if trimmed.starts_with("* ") && !trimmed.starts_with("**") {
            if let Some(rest) = trimmed.strip_prefix("* ") {
                flush_ordered(&mut doc, &mut ordered_items);
                let item = parse_md_line(rest);
                unordered_items.push(item);
                continue;
            }
        }

        // ── Lista ordenada (1. item, 2. item, etc.) ──
        if let Some(dot_pos) = trimmed.find(". ") {
            let prefix = &trimmed[..dot_pos];
            if !prefix.is_empty() && prefix.chars().all(|c| c.is_ascii_digit()) {
                flush_unordered(&mut doc, &mut unordered_items);
                let rest = &trimmed[dot_pos + 2..];
                let item = parse_md_line(rest);
                ordered_items.push(item);
                continue;
            }
        }

        // ── Alternativas de lista: a) b) c) ou A) B) C) ──
        if trimmed.len() >= 3 {
            let first_char = trimmed.chars().next().unwrap_or(' ');
            if (first_char.is_ascii_lowercase() || first_char.is_ascii_uppercase())
                && trimmed.as_bytes().get(1) == Some(&b')')
                && trimmed.as_bytes().get(2) == Some(&b' ')
            {
                flush_unordered(&mut doc, &mut unordered_items);
                flush_ordered(&mut doc, &mut ordered_items);
                // Itens de múltipla escolha → parágrafo indentado
                let p = parse_md_line(trimmed);
                doc.push(elements::PaddedElement::new(
                    p,
                    genpdf::Margins::trbl(0, 0, 0, 8),
                ));
                continue;
            }
        }

        // ── Linha com indentação (4+ espaços ou tab) → preservar indentação ──
        let leading_spaces = line.len() - line.trim_start().len();
        if leading_spaces >= 4 {
            flush_unordered(&mut doc, &mut unordered_items);
            flush_ordered(&mut doc, &mut ordered_items);
            let indent_mm = ((leading_spaces / 4) * 8).min(40) as i32;
            let p = parse_md_line(trimmed);
            doc.push(elements::PaddedElement::new(
                p,
                genpdf::Margins::trbl(0, 0, 0, indent_mm),
            ));
            continue;
        }

        // ── Texto normal com formatação inline ──
        flush_unordered(&mut doc, &mut unordered_items);
        flush_ordered(&mut doc, &mut ordered_items);
        let p = parse_md_line(trimmed);
        doc.push(p);
    }

    // Flush de listas pendentes ao final
    flush_unordered(&mut doc, &mut unordered_items);
    flush_ordered(&mut doc, &mut ordered_items);

    doc.render_to_file(path).map_err(|e| {
        log::error!("[PBL] Erro ao gerar PDF: {e}");
        format!("Erro ao gerar o documento PDF: {e}")
    })?;

    Ok(())
}

/// Comando para extrair os logs de erro da aplicação Tauri
/// Lê o arquivo PBL.log e retorna como string
#[tauri::command]
pub fn export_app_logs(app: tauri::AppHandle) -> Result<String, String> {
    use std::fs;
    use tauri::Manager;

    match app.path().app_log_dir() {
        Ok(log_dir) => {
            // No Tauri o log format da app padrão assume o nome do projeto + '.log'
            let log_file = log_dir.join("PBL.log");
            if log_file.exists() {
                fs::read_to_string(&log_file).map_err(|e| format!("Erro ao ler o log: {}", e))
            } else {
                Err("Nenhum log de erro foi gerado ainda.".into())
            }
        }
        Err(_) => Err("Não foi possível acessar a pasta de logs do sistema.".into()),
    }
}

// ─── Testes unitários ───────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    // ── html_escape ──

    #[test]
    fn html_escape_escapa_ampersand() {
        assert_eq!(html_escape("a & b"), "a &amp; b");
    }

    #[test]
    fn html_escape_escapa_menor_e_maior() {
        assert_eq!(html_escape("<tag>"), "&lt;tag&gt;");
    }

    #[test]
    fn html_escape_string_sem_especiais_inalterada() {
        assert_eq!(html_escape("hello world"), "hello world");
    }

    #[test]
    fn html_escape_multiplos_caracteres() {
        assert_eq!(html_escape("a < b & c > d"), "a &lt; b &amp; c &gt; d");
    }

    // ── md_inline_to_html ──

    #[test]
    fn md_inline_converte_bold() {
        let out = md_inline_to_html("texto **negrito** fim");
        assert!(out.contains("<strong>negrito</strong>"), "got: {out}");
    }

    #[test]
    fn md_inline_converte_italic() {
        let out = md_inline_to_html("texto *itálico* fim");
        assert!(out.contains("<em>itálico</em>"), "got: {out}");
    }

    #[test]
    fn md_inline_sem_marcadores_retorna_texto() {
        let out = md_inline_to_html("texto simples");
        assert_eq!(out, "texto simples");
    }

    #[test]
    fn md_inline_asterisco_sem_fechamento() {
        // Asterisco sem fechar deve ser preservado literalmente
        let out = md_inline_to_html("texto *aberto");
        assert!(out.contains('*'), "got: {out}");
    }

    #[test]
    fn md_inline_escapa_html_no_conteudo() {
        let out = md_inline_to_html("a < b");
        assert!(out.contains("&lt;"), "got: {out}");
    }

    // ── generate_html via export_file ──

    #[test]
    fn html_gerado_contem_heading_h1() {
        let dir = env::temp_dir().join("pbl_test_h1.html");
        let path = dir.to_str().unwrap().to_string();
        let result = export_file(
            "# Título Principal".to_string(),
            "html".to_string(),
            path.clone(),
        );
        assert!(result.is_ok());
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("<h1>"), "got: {content}");
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn html_gerado_contem_lista_nao_ordenada() {
        let dir = env::temp_dir().join("pbl_test_ul.html");
        let path = dir.to_str().unwrap().to_string();
        let result = export_file(
            "- Item 1\n- Item 2\n- Item 3".to_string(),
            "html".to_string(),
            path.clone(),
        );
        assert!(result.is_ok());
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("<ul>"), "got: {content}");
        assert!(content.contains("<li>Item 1</li>"), "got: {content}");
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn html_gerado_contem_blockquote() {
        let dir = env::temp_dir().join("pbl_test_quote.html");
        let path = dir.to_str().unwrap().to_string();
        let result = export_file(
            "> Citação importante".to_string(),
            "html".to_string(),
            path.clone(),
        );
        assert!(result.is_ok());
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("<blockquote>"), "got: {content}");
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn html_gerado_contem_separador_hr() {
        let dir = env::temp_dir().join("pbl_test_hr.html");
        let path = dir.to_str().unwrap().to_string();
        let result = export_file("---".to_string(), "html".to_string(), path.clone());
        assert!(result.is_ok());
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.contains("<hr>"), "got: {content}");
        let _ = std::fs::remove_file(&path);
    }

    // ── validate_export_path ──

    #[test]
    fn valida_extensao_txt_correta() {
        assert!(validate_export_path("/tmp/teste.txt", "txt").is_ok());
    }

    #[test]
    fn valida_extensao_html_com_htm() {
        assert!(validate_export_path("/tmp/teste.htm", "html").is_ok());
        assert!(validate_export_path("/tmp/teste.html", "html").is_ok());
    }

    #[test]
    fn valida_extensao_md_correta() {
        assert!(validate_export_path("/tmp/teste.md", "md").is_ok());
    }

    #[test]
    fn valida_extensao_docx_correta() {
        assert!(validate_export_path("/tmp/teste.docx", "docx").is_ok());
    }

    #[test]
    fn rejeita_extensao_incompativel() {
        let result = validate_export_path("/tmp/teste.exe", "txt");
        assert!(result.is_err());
    }

    #[test]
    fn rejeita_path_sem_extensao() {
        let result = validate_export_path("/tmp/teste", "txt");
        assert!(result.is_err());
    }

    #[test]
    fn valida_extensao_pdf_correta() {
        assert!(validate_export_path("/tmp/teste.pdf", "pdf").is_ok());
    }

    #[test]
    fn valida_extensao_case_insensitive() {
        assert!(validate_export_path("/tmp/teste.TXT", "txt").is_ok());
        assert!(validate_export_path("/tmp/teste.DOCX", "docx").is_ok());
    }

    #[test]
    fn rejeita_mismatch_formato_extensao() {
        // Formato txt mas extensão .docx
        assert!(validate_export_path("/tmp/teste.docx", "txt").is_err());
        // Formato docx mas extensão .txt
        assert!(validate_export_path("/tmp/teste.txt", "docx").is_err());
    }

    // ── export_file ──

    #[test]
    fn exporta_txt_com_sucesso() {
        let dir = env::temp_dir().join("pbl_test_export_txt.txt");
        let path = dir.to_str().unwrap().to_string();
        let result = export_file(
            "Conteúdo teste".to_string(),
            "txt".to_string(),
            path.clone(),
        );
        assert!(result.is_ok());
        let content = fs::read_to_string(&path).unwrap();
        assert_eq!(content, "Conteúdo teste");
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn exporta_md_com_sucesso() {
        let dir = env::temp_dir().join("pbl_test_export.md");
        let path = dir.to_str().unwrap().to_string();
        let result = export_file(
            "# Título\nTexto".to_string(),
            "md".to_string(),
            path.clone(),
        );
        assert!(result.is_ok());
        let content = fs::read_to_string(&path).unwrap();
        assert!(content.contains("# Título"));
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn exporta_html_com_sucesso() {
        let dir = env::temp_dir().join("pbl_test_export.html");
        let path = dir.to_str().unwrap().to_string();
        let result = export_file("<h1>Olá</h1>".to_string(), "html".to_string(), path.clone());
        assert!(result.is_ok());
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn exporta_docx_com_sucesso() {
        let dir = env::temp_dir().join("pbl_test_export.docx");
        let path = dir.to_str().unwrap().to_string();
        let result = export_file(
            "Linha 1\nLinha 2\nLinha 3".to_string(),
            "docx".to_string(),
            path.clone(),
        );
        assert!(result.is_ok());
        // Verifica que o arquivo existe e tem tamanho > 0
        let metadata = fs::metadata(&path).unwrap();
        assert!(metadata.len() > 0);
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn rejeita_formato_nao_suportado() {
        let result = export_file(
            "teste".to_string(),
            "xyz".to_string(),
            "/tmp/teste.xyz".to_string(),
        );
        assert!(result.is_err());
    }

    #[test]
    fn exporta_pdf_com_sucesso() {
        let dir = env::temp_dir().join("pbl_test_export.pdf");
        let path = dir.to_str().unwrap().to_string();
        let result = export_file(
            "# Título\n\nTexto normal\n\n**Negrito**\n\n---\n\n## Subtítulo".to_string(),
            "pdf".to_string(),
            path.clone(),
        );
        assert!(result.is_ok());
        let metadata = fs::metadata(&path).unwrap();
        assert!(metadata.len() > 0);
        let _ = fs::remove_file(&path);
    }
}

//! # Módulo de Importação de Arquivos
//!
//! Extrai texto de arquivos PDF e DOCX para uso como entrada no sistema
//! de adaptação. O texto extraído é retornado ao frontend como string pura
//! e inserido no campo de conteúdo.
//!
//! ## Formatos suportados
//!
//! - **PDF**: usa a crate `pdf-extract` para extrair texto de PDFs nativos.
//!   PDFs escaneados (imagens) não são suportados (necessitaria de OCR).
//! - **DOCX**: usa `zip` + parse XML para extrair o texto dos parágrafos.
//!   Lê o arquivo `word/document.xml` contido no ZIP.
//! - **TXT/MD**: leitura direta como texto UTF-8.

use std::fs;
use std::io::Read;
use std::path::Path;

/// Extensões de arquivo aceitas para importação.
const VALID_IMPORT_EXTENSIONS: &[&str] = &["pdf", "docx", "odt", "txt", "md"];

/// Importa um arquivo e extrai seu conteúdo textual.
///
/// # Parâmetros
/// - `path`: caminho absoluto do arquivo a ser importado
///
/// # Retorno
/// Texto extraído do arquivo como `String`.
///
/// # Erros
/// - Extensão não suportada
/// - Falha ao ler o arquivo
/// - Falha ao extrair texto (PDF corrompido, DOCX inválido, etc.)
#[tauri::command]
pub async fn import_file(path: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || import_file_sync(&path))
        .await
        .map_err(|e| format!("Erro interno ao importar arquivo: {e}"))?
}

/// Lógica síncrona de importação - executada em thread separada via spawn_blocking.
fn import_file_sync(path: &str) -> Result<String, String> {
    let file_path = Path::new(path);

    // Validar existência
    if !file_path.exists() {
        return Err("Arquivo não encontrado".to_string());
    }

    // Validar extensão
    let ext = file_path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    if !VALID_IMPORT_EXTENSIONS.contains(&ext.as_str()) {
        return Err(format!(
            "Formato '{}' não suportado para importação. Use: pdf, docx, txt ou md",
            ext
        ));
    }

    match ext.as_str() {
        "txt" | "md" => {
            fs::read_to_string(path).map_err(|e| {
                log::error!("[PBL] Erro ao ler arquivo texto: {e}");
                "Não foi possível ler o arquivo de texto".to_string()
            })
        }
        "pdf" => extract_pdf(path),
        "docx" => extract_docx(path),
        "odt" => extract_odt(path),
        _ => Err(format!("Formato '{}' não suportado", ext)),
    }
}

/// Extrai texto de um arquivo PDF usando `pdf-extract`.
///
/// Limitações:
/// - PDFs escaneados (imagens) retornam texto vazio
/// - Tabelas podem perder formatação
/// - A ordem do texto depende da estrutura interna do PDF
fn extract_pdf(path: &str) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|e| {
        log::error!("[PBL] Erro ao ler PDF: {e}");
        "Não foi possível abrir o arquivo PDF. Verifique se o arquivo não está corrompido.".to_string()
    })?;

    let text = pdf_extract::extract_text_from_mem(&bytes).map_err(|e| {
        log::error!("[PBL] Erro ao extrair texto do PDF: {e}");
        concat!(
            "Não foi possível extrair texto deste PDF.\n\n",
            "Isso geralmente acontece com PDFs gerados por scanner (imagens).\n",
            "💡 Solução: Abra o arquivo no Word ou LibreOffice e salve como .docx ou .txt, ",
            "depois importe esse novo arquivo."
        ).to_string()
    })?;

    let cleaned = text
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect::<Vec<_>>()
        .join("\n");

    if cleaned.is_empty() {
        return Err(concat!(
            "Este PDF não contém texto extraível - provavelmente é um documento escaneado (imagem).\n\n",
            "💡 Solução: Abra o arquivo no Word ou LibreOffice, exporte como .docx ou .txt ",
            "(ou use um serviço de OCR como o Adobe Acrobat), ",
            "e importe o arquivo convertido."
        ).to_string());
    }

    Ok(cleaned)
}

/// Extrai texto de um arquivo ODT (OpenDocument Text).
///
/// ODT é um arquivo ZIP contendo `content.xml`. O texto dos parágrafos
/// fica dentro de tags `<text:p>` no namespace ODF.
///
/// Professores que usam LibreOffice exportam neste formato. A abordagem
/// é idêntica ao DOCX: ZIP + parse manual das tags de texto.
fn extract_odt(path: &str) -> Result<String, String> {
    let file = fs::File::open(path).map_err(|e| {
        log::error!("[PBL] Erro ao abrir ODT: {e}");
        "Não foi possível abrir o arquivo ODT".to_string()
    })?;

    let mut archive = zip::ZipArchive::new(file).map_err(|e| {
        log::error!("[PBL] ODT não é um ZIP válido: {e}");
        "O arquivo ODT parece estar corrompido".to_string()
    })?;

    let mut xml_content = String::new();
    {
        let mut content_xml = archive.by_name("content.xml").map_err(|e| {
            log::error!("[PBL] content.xml não encontrado no ODT: {e}");
            "O arquivo ODT não contém a estrutura esperada".to_string()
        })?;
        content_xml.read_to_string(&mut xml_content).map_err(|e| {
            log::error!("[PBL] Erro ao ler content.xml do ODT: {e}");
            "Não foi possível ler o conteúdo do ODT".to_string()
        })?;
    }

    // Extrai texto das tags <text:p> (parágrafos ODF)
    // ODF usa namespace text: mas o parser simples de substring captura bem
    let mut paragraphs: Vec<String> = Vec::new();
    let mut remaining = xml_content.as_str();

    while let Some(start) = remaining.find("<text:p") {
        // Avança até o fechamento da tag de abertura
        if let Some(tag_end) = remaining[start..].find('>') {
            let after_open = &remaining[start + tag_end + 1..];
            if let Some(close) = after_open.find("</text:p>") {
                let inner = &after_open[..close];
                // Remove tags XML internas (ex: <text:span>, <text:s>)
                let text = strip_xml_tags(inner);
                let trimmed = text.trim().to_string();
                if !trimmed.is_empty() {
                    paragraphs.push(trimmed);
                }
                remaining = &after_open[close + 9..];
            } else {
                break;
            }
        } else {
            break;
        }
    }

    if paragraphs.is_empty() {
        return Err("O arquivo ODT não contém texto extraível".to_string());
    }

    Ok(paragraphs.join("\n"))
}

/// Remove todas as tags XML de uma string, deixando apenas o texto.
fn strip_xml_tags(s: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;
    for ch in s.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => result.push(ch),
            _ => {}
        }
    }
    result
}

/// Extrai texto de um arquivo DOCX (Office Open XML).
///
/// Um DOCX é um arquivo ZIP contendo XMLs. O texto dos parágrafos
/// fica em `word/document.xml` dentro de tags `<w:t>`.
fn extract_docx(path: &str) -> Result<String, String> {
    let file = fs::File::open(path).map_err(|e| {
        log::error!("[PBL] Erro ao abrir DOCX: {e}");
        "Não foi possível abrir o arquivo DOCX".to_string()
    })?;

    let mut archive = zip::ZipArchive::new(file).map_err(|e| {
        log::error!("[PBL] DOCX não é um ZIP válido: {e}");
        "O arquivo DOCX parece estar corrompido".to_string()
    })?;

    let mut xml_content = String::new();
    {
        let mut doc_xml = archive.by_name("word/document.xml").map_err(|e| {
            log::error!("[PBL] document.xml não encontrado no DOCX: {e}");
            "O arquivo DOCX não contém a estrutura esperada".to_string()
        })?;
        doc_xml.read_to_string(&mut xml_content).map_err(|e| {
            log::error!("[PBL] Erro ao ler document.xml: {e}");
            "Não foi possível ler o conteúdo do DOCX".to_string()
        })?;
    }

    // Extrai texto das tags <w:t> e <w:t xml:space="preserve">
    // Agrupa por parágrafo (<w:p>)
    let mut result = Vec::new();
    let mut current_para = String::new();

    // Parser simples de XML para extrair texto
    let mut in_paragraph = false;
    let mut chars = xml_content.as_str();

    while let Some(tag_start) = chars.find('<') {
        // Texto antes da tag (dentro de <w:t>)
        let before = &chars[..tag_start];
        if in_paragraph && !before.is_empty() {
            current_para.push_str(before);
        }

        if let Some(tag_end) = chars[tag_start..].find('>') {
            let tag = &chars[tag_start..tag_start + tag_end + 1];

            if tag.starts_with("<w:p ") || tag == "<w:p>" {
                in_paragraph = true;
                current_para.clear();
            } else if tag == "</w:p>" {
                in_paragraph = false;
                let trimmed = current_para.trim().to_string();
                if !trimmed.is_empty() {
                    result.push(trimmed);
                } else {
                    result.push(String::new());
                }
                current_para.clear();
            } else if tag.starts_with("<w:t") {
                // Próximo conteúdo de texto será capturado
            } else if tag == "</w:t>" {
                // Fim do texto - pode haver mais <w:t> no mesmo parágrafo
            }

            chars = &chars[tag_start + tag_end + 1..];
        } else {
            break;
        }
    }

    // Remove linhas vazias consecutivas excessivas
    let text = result.join("\n");
    let cleaned: Vec<&str> = text
        .lines()
        .collect();

    Ok(cleaned.join("\n"))
}

// ─── Testes unitários ───────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn rejeita_extensao_invalida() {
        // Testa a lógica síncrona diretamente (import_file é async, usa spawn_blocking)
        // Precisa criar o arquivo para passar a validação de existência e chegar na de extensão
        let dir = env::temp_dir().join("pbl_test_invalid.xyz");
        let path = dir.to_str().unwrap();
        fs::write(path, "dummy").unwrap();
        let result = import_file_sync(path);
        let _ = fs::remove_file(path);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("xyz") || err.contains("suportado"), "got: {err}");
    }

    #[test]
    fn rejeita_arquivo_inexistente() {
        let result = import_file_sync("/tmp/nao_existe_abc123.pdf");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("não encontrado"));
    }

    #[test]
    fn importa_txt_com_sucesso() {
        let dir = env::temp_dir().join("pbl_test_import.txt");
        let path = dir.to_str().unwrap().to_string();
        fs::write(&path, "Conteúdo de teste para importação").unwrap();

        let result = import_file_sync(&path);
        assert!(result.is_ok());
        assert!(result.unwrap().contains("Conteúdo de teste"));

        let _ = fs::remove_file(&path);
    }

    #[test]
    fn importa_md_com_sucesso() {
        let dir = env::temp_dir().join("pbl_test_import.md");
        let path = dir.to_str().unwrap().to_string();
        fs::write(&path, "# Título\n\nTexto do documento.").unwrap();

        let result = import_file_sync(&path);
        assert!(result.is_ok());
        assert!(result.unwrap().contains("# Título"));

        let _ = fs::remove_file(&path);
    }

    #[test]
    fn rejeita_path_sem_extensao() {
        let result = import_file_sync("/tmp/arquivo_sem_extensao");
        assert!(result.is_err());
    }
}

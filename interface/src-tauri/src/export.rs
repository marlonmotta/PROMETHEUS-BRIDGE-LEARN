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
    let ext = Path::new(path)
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
        "txt" | "html" | "md" => {
            fs::write(&path, content).map_err(|e| {
                eprintln!("[PBL] Erro ao exportar arquivo: {e}");
                "Não foi possível salvar o arquivo exportado".to_string()
            })
        }
        "docx" => {
            use docx_rs::*;
            let paragraphs: Vec<Paragraph> = content
                .split('\n')
                .map(|line| Paragraph::new().add_run(Run::new().add_text(line)))
                .collect();

            let mut doc = Docx::new();
            for p in paragraphs {
                doc = doc.add_paragraph(p);
            }

            let mut file = fs::File::create(&path).map_err(|e| {
                eprintln!("[PBL] Erro ao criar arquivo DOCX: {e}");
                "Não foi possível criar o arquivo DOCX".to_string()
            })?;
            doc.build().pack(&mut file).map_err(|e| {
                eprintln!("[PBL] Erro ao gerar DOCX: {e}");
                "Erro ao gerar o documento DOCX".to_string()
            })?;
            Ok(())
        }
        _ => Err(format!(
            "Formato '{}' não suportado. Use: txt, html, md ou docx",
            format
        )),
    }
}


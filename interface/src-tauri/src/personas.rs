//! # Módulo Personas - Gerenciamento do catálogo de personas
//!
//! Responsável por todas as operações CRUD sobre personas:
//! carregamento (embutidas + dinâmicas), importação de arquivo/JSON,
//! exclusão e atualização online via GitHub.
//!
//! As personas embutidas (`PERSONAS_EMBEDDED`) permanecem no `lib.rs`
//! pois dependem de `include_str!()` que requer caminhos relativos
//! ao arquivo de declaração.

use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use tauri::Manager;

/// Retorna o diretório de personas dinâmicas (baixadas ou importadas pelo usuário).
///
/// Cria o diretório caso não exista. Retorna `Err` se não for possível obter
/// o diretório de dados do app ou criar a pasta - evitando panics em produção.
pub fn personas_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Não foi possível acessar o diretório de dados da aplicação".to_string())?
        .join("personas");
    fs::create_dir_all(&dir)
        .map_err(|_| "Não foi possível criar o diretório de personas".to_string())?;
    Ok(dir)
}

/// Sanitiza o ID de uma persona para uso seguro como nome de arquivo.
///
/// Remove qualquer caractere que não seja alfanumérico, hífen ou underscore.
/// Isso previne ataques de **path traversal** (ex: `../../etc/passwd`) e
/// garante compatibilidade cross-platform com sistemas de arquivos.
///
/// # Retorno
/// - `Ok(String)` com o ID sanitizado (mínimo 1 caractere)
/// - `Err(String)` se o ID ficar vazio após sanitização
pub fn sanitize_persona_id(raw_id: &str) -> Result<String, String> {
    let sanitized: String = raw_id
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();

    if sanitized.is_empty() {
        return Err("ID da persona é inválido (contém apenas caracteres especiais)".to_string());
    }

    Ok(sanitized)
}

/// Carrega todas as personas disponíveis (embutidas + dinâmicas).
///
/// A estratégia de merge prioriza as personas embutidas: se uma persona local
/// tem o mesmo `meta.id` de uma embutida, a embutida é mantida. Isso garante
/// que o catálogo base nunca seja sobrescrito por dados potencialmente corrompidos.
///
/// # Retorno
/// `Vec<Value>` - lista de JSONs de persona, sem duplicatas por ID.
#[tauri::command]
pub fn load_personas(app: tauri::AppHandle) -> Vec<Value> {
    let mut map: std::collections::HashMap<String, Value> = crate::PERSONAS_EMBEDDED
        .iter()
        .filter_map(|(_, raw)| serde_json::from_str::<Value>(raw).ok())
        .filter_map(|v| {
            let id = v.pointer("/meta/id")?.as_str()?.to_string();
            Some((id, v))
        })
        .collect();

    if let Ok(dir) = personas_dir(&app) {
        if let Ok(entries) = fs::read_dir(&dir) {
            for entry in entries.flatten() {
                if entry.path().extension().and_then(|e| e.to_str()) == Some("json") {
                    if let Ok(content) = fs::read_to_string(entry.path()) {
                        if let Ok(v) = serde_json::from_str::<Value>(&content) {
                            if let Some(id) = v.pointer("/meta/id").and_then(|i| i.as_str()) {
                                map.entry(id.to_string()).or_insert(v);
                            }
                        }
                    }
                }
            }
        }
    }

    map.into_values().collect()
}

/// Atualiza o catálogo de personas baixando novas do repositório GitHub.
///
/// Consulta o `manifest.json` remoto para descobrir quais personas existem,
/// e baixa apenas as que ainda não estão presentes localmente. Isso implementa
/// um sistema de atualização incremental sem re-download desnecessário.
///
/// # Erros
/// Retorna `Err(String)` com mensagem genérica se a conexão falhar ou o
/// manifest for inválido. Detalhes técnicos são logados no console.
#[tauri::command]
pub async fn update_personas_online(app: tauri::AppHandle) -> Result<Vec<Value>, String> {
    let manifest_url =
        "https://raw.githubusercontent.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/main/personas/manifest.json";

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| {
            eprintln!("[PBL] Erro ao criar cliente HTTP: {e}");
            "Falha ao inicializar conexão de rede".to_string()
        })?;

    let manifest: Value = client
        .get(manifest_url)
        .send()
        .await
        .map_err(|e| {
            eprintln!("[PBL] Erro ao buscar manifest: {e}");
            "Não foi possível conectar ao repositório de personas".to_string()
        })?
        .json()
        .await
        .map_err(|e| {
            eprintln!("[PBL] Erro ao parsear manifest: {e}");
            "Formato do manifest de personas é inválido".to_string()
        })?;

    let personas_list = manifest["personas"]
        .as_array()
        .ok_or("Manifest de personas não contém lista válida")?;

    let dir = personas_dir(&app)?;
    let base =
        "https://raw.githubusercontent.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/main/personas/";
    let mut downloaded: Vec<Value> = Vec::new();

    for item in personas_list {
        if let Some(filename) = item.as_str() {
            let name = filename.split('/').last().unwrap_or(filename);
            let local_path = dir.join(name);

            if !local_path.exists() {
                let url = format!("{}{}", base, filename);
                match client.get(&url).send().await {
                    Ok(resp) => {
                        if let Ok(text) = resp.text().await {
                            if let Ok(json) = serde_json::from_str::<Value>(&text) {
                                if fs::write(&local_path, &text).is_err() {
                                    eprintln!(
                                        "[PBL] Falha ao salvar persona localmente: {:?}",
                                        local_path
                                    );
                                }
                                downloaded.push(json);
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("[PBL] Falha ao baixar persona {filename}: {e}");
                    }
                }
            }
        }
    }

    Ok(downloaded)
}

/// Exclui uma persona local (baixada ou importada) pelo seu ID.
///
/// Personas embutidas no binário **não podem ser excluídas** - essa é uma
/// restrição intencional para manter o catálogo base intacto.
///
/// # Parâmetros
/// - `id`: identificador único da persona (`meta.id` no JSON)
///
/// # Erros
/// Retorna `Err` se a persona não for encontrada na pasta local ou se
/// a exclusão do arquivo falhar.
#[tauri::command]
pub fn delete_persona(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let dir = personas_dir(&app)?;
    let mut deleted = false;

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(v) = serde_json::from_str::<Value>(&content) {
                        if v.pointer("/meta/id").and_then(|i| i.as_str()) == Some(&id) {
                            fs::remove_file(&path).map_err(|e| {
                                eprintln!("[PBL] Erro ao excluir arquivo {:?}: {e}", path);
                                "Não foi possível excluir o arquivo da persona".to_string()
                            })?;
                            deleted = true;
                        }
                    }
                }
            }
        }
    }

    if deleted {
        Ok(())
    } else {
        Err(format!(
            "Persona '{}' não encontrada na pasta local (personas embutidas não podem ser excluídas)",
            id
        ))
    }
}

/// Importa uma persona a partir de um arquivo JSON no sistema de arquivos.
///
/// Valida que o arquivo é um JSON válido com os campos obrigatórios (`meta.id`,
/// `meta.name`) e sanitiza o ID antes de usá-lo como nome de arquivo para
/// prevenir path traversal.
///
/// # Segurança
/// - O path é validado para terminar em `.json`
/// - O `meta.id` é sanitizado para conter apenas `[a-zA-Z0-9_-]`
#[tauri::command]
pub fn add_persona_from_file(app: tauri::AppHandle, path: String) -> Result<Value, String> {
    if !path.to_lowercase().ends_with(".json") {
        return Err("Apenas arquivos .json são aceitos".to_string());
    }

    let content = fs::read_to_string(&path).map_err(|e| {
        eprintln!("[PBL] Erro ao ler arquivo {path}: {e}");
        "Não foi possível ler o arquivo selecionado".to_string()
    })?;

    let json: Value = serde_json::from_str(&content)
        .map_err(|_| "O arquivo selecionado não contém JSON válido".to_string())?;

    json.pointer("/meta/id")
        .ok_or("Campo obrigatório 'meta.id' ausente no JSON")?;
    json.pointer("/meta/name")
        .ok_or("Campo obrigatório 'meta.name' ausente no JSON")?;

    let raw_id = json
        .pointer("/meta/id")
        .and_then(|v| v.as_str())
        .ok_or("Campo 'meta.id' deve ser uma string")?;

    let safe_id = sanitize_persona_id(raw_id)?;
    let dest = personas_dir(&app)?.join(format!("{}.json", safe_id));

    fs::write(&dest, &content).map_err(|e| {
        eprintln!("[PBL] Erro ao salvar persona em {:?}: {e}", dest);
        "Não foi possível salvar a persona importada".to_string()
    })?;

    Ok(json)
}

/// Importa uma persona a partir de uma string JSON diretamente (sem arquivo no disco).
///
/// Utilizado pelo frontend quando a leitura do arquivo já foi feita no lado do
/// navegador via Web API (File Reader). Aplica as mesmas validações e
/// sanitizações que `add_persona_from_file`.
#[tauri::command]
pub fn add_persona_from_json(app: tauri::AppHandle, json_str: String) -> Result<Value, String> {
    let json: Value = serde_json::from_str(&json_str)
        .map_err(|_| "O conteúdo fornecido não é um JSON válido".to_string())?;

    json.pointer("/meta/id")
        .ok_or("Campo obrigatório 'meta.id' ausente no JSON")?;
    json.pointer("/meta/name")
        .and_then(|v| v.as_str())
        .or_else(|| json.pointer("/meta/display_name").and_then(|v| v.as_str()))
        .ok_or("Campo obrigatório 'meta.name' ou 'meta.display_name' ausente no JSON")?;

    let raw_id = json
        .pointer("/meta/id")
        .and_then(|v| v.as_str())
        .ok_or("Campo 'meta.id' deve ser uma string")?;

    let safe_id = sanitize_persona_id(raw_id)?;
    let dest = personas_dir(&app)?.join(format!("{}.json", safe_id));

    fs::write(&dest, &json_str).map_err(|e| {
        eprintln!("[PBL] Erro ao salvar persona em {:?}: {e}", dest);
        "Não foi possível salvar a persona importada".to_string()
    })?;

    Ok(json)
}

// ─── Testes unitários ───────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitize_persona_id_aceita_ids_validos() {
        assert_eq!(sanitize_persona_id("goku").unwrap(), "goku");
        assert_eq!(sanitize_persona_id("jiraiya-sensei").unwrap(), "jiraiya-sensei");
        assert_eq!(sanitize_persona_id("l_lawliet").unwrap(), "l_lawliet");
        assert_eq!(sanitize_persona_id("albert-einstein").unwrap(), "albert-einstein");
    }

    #[test]
    fn sanitize_persona_id_remove_caracteres_perigosos() {
        assert_eq!(sanitize_persona_id("../../etc/passwd").unwrap(), "etcpasswd");
        assert_eq!(sanitize_persona_id("goku<script>").unwrap(), "gokuscript");
        assert_eq!(sanitize_persona_id("test file.json").unwrap(), "testfilejson");
    }

    #[test]
    fn sanitize_persona_id_rejeita_ids_vazios() {
        assert!(sanitize_persona_id("").is_err());
        assert!(sanitize_persona_id("../../../").is_err());
        assert!(sanitize_persona_id("...").is_err());
    }
}

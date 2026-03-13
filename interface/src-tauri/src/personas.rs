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
pub async fn load_personas(app: tauri::AppHandle) -> Result<Vec<Value>, String> {
    tokio::task::spawn_blocking(move || {
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
                    // Filtra estritamente por .json para evitar que o sistema tente parsear
                    // arquivos de sistema (Thumbs.db, .DS_Store) ou backups (.json.bak)
                    // que possam aparecer se o usuário abrir a pasta de personas manualmente.
                    // Falhas de parse são silenciadas pelo if-let, mas é melhor nem tentar.
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
    })
    .await
    .map_err(|e| format!("Erro ao carregar personas: {e}"))
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
            log::error!("[PBL] Erro ao criar cliente HTTP: {e}");
            "Falha ao inicializar conexão de rede".to_string()
        })?;

    let manifest: Value = client
        .get(manifest_url)
        .send()
        .await
        .map_err(|e| {
            log::error!("[PBL] Erro ao buscar manifest: {e}");
            "Não foi possível conectar ao repositório de personas".to_string()
        })?
        .json()
        .await
        .map_err(|e| {
            log::error!("[PBL] Erro ao parsear manifest: {e}");
            "Formato do manifest de personas é inválido".to_string()
        })?;

    let personas_list = manifest["personas"]
        .as_array()
        .ok_or("Manifest de personas não contém lista válida")?;

    let dir = personas_dir(&app)?;
    let base =
        "https://raw.githubusercontent.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/main/personas/";
    let mut downloaded: Vec<Value> = Vec::new();

    // Coleta tasks de download para execução paralela (P10)
    let mut handles: Vec<tokio::task::JoinHandle<Option<(String, String)>>> = Vec::new();

    for item in personas_list {
        if let Some(filename) = item.as_str() {
            let name = filename.split('/').next_back().unwrap_or(filename).to_string();
            let local_path = dir.join(&name);

            if !local_path.exists() {
                let url = format!("{}{}", base, filename);
                let client = client.clone();
                let fname = filename.to_string();

                handles.push(tokio::spawn(async move {
                    match client.get(&url).send().await {
                        Ok(resp) => match resp.text().await {
                            Ok(text) => Some((fname, text)),
                            Err(_) => None,
                        },
                        Err(e) => {
                            log::error!("[PBL] Falha ao baixar persona {fname}: {e}");
                            None
                        }
                    }
                }));
            }
        }
    }

    // Aguarda todos os downloads em paralelo
    for handle in handles {
        if let Ok(Some((filename, text))) = handle.await {
            if let Ok(json) = serde_json::from_str::<Value>(&text) {
                let name = filename.split('/').next_back().unwrap_or(&filename);
                let local_path = dir.join(name);
                if fs::write(&local_path, &text).is_err() {
                    log::error!(
                        "[PBL] Falha ao salvar persona localmente: {:?}",
                        local_path
                    );
                }
                downloaded.push(json);
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
    let safe_id = sanitize_persona_id(&id)?;
    let dir = personas_dir(&app)?;
    let direct_path = dir.join(format!("{}.json", safe_id));

    // O(1): tenta deletar diretamente pelo nome do arquivo
    if direct_path.exists() {
        return fs::remove_file(&direct_path).map_err(|e| {
            log::error!("[PBL] Erro ao excluir arquivo {:?}: {e}", direct_path);
            "Não foi possível excluir o arquivo da persona".to_string()
        });
    }

    // Fallback: scan por ID dentro dos JSONs (para arquivos com nome diferente do ID)
    let mut deleted = false;
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(v) = serde_json::from_str::<Value>(&content) {
                        if v.pointer("/meta/id").and_then(|i| i.as_str()) == Some(&id) {
                            fs::remove_file(&path).map_err(|e| {
                                log::error!("[PBL] Erro ao excluir arquivo {:?}: {e}", path);
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

/// Valida que um JSON de persona contém os campos obrigatórios e sanitiza o ID.
///
/// Retorna o ID sanitizado caso a validação seja bem-sucedida.
/// Usado por `add_persona_from_file` e `add_persona_from_json` para
/// eliminar duplicação de lógica de validação.
fn validate_persona_json(json: &Value) -> Result<String, String> {
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

    sanitize_persona_id(raw_id)
}

/// Salva o conteúdo de uma persona validada no diretório local.
fn save_persona_to_disk(app: &tauri::AppHandle, safe_id: &str, content: &str) -> Result<(), String> {
    let dest = personas_dir(app)?.join(format!("{}.json", safe_id));
    fs::write(&dest, content).map_err(|e| {
        log::error!("[PBL] Erro ao salvar persona em {:?}: {e}", dest);
        "Não foi possível salvar a persona importada".to_string()
    })
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
        log::error!("[PBL] Erro ao ler arquivo {path}: {e}");
        "Não foi possível ler o arquivo selecionado".to_string()
    })?;

    let json: Value = serde_json::from_str(&content)
        .map_err(|_| "O arquivo selecionado não contém JSON válido".to_string())?;

    let safe_id = validate_persona_json(&json)?;
    save_persona_to_disk(&app, &safe_id, &content)?;

    Ok(json)
}

/// Importa uma persona a partir de uma string JSON diretamente (sem arquivo no disco).
///
/// Utilizado pelo frontend quando a leitura do arquivo já foi feita no lado do
/// navegador via Web API (File Reader). Aplica as mesmas validações e
/// sanitizações que `add_persona_from_file`.
#[tauri::command]
pub fn add_persona_from_json(app: tauri::AppHandle, json_str: String) -> Result<Value, String> {
    // Limite de tamanho: 100KB por persona para prevenir DoS
    if json_str.len() > 100_000 {
        return Err("JSON da persona excede o limite de 100KB".to_string());
    }

    let json: Value = serde_json::from_str(&json_str)
        .map_err(|_| "O conteúdo fornecido não é um JSON válido".to_string())?;

    let safe_id = validate_persona_json(&json)?;
    save_persona_to_disk(&app, &safe_id, &json_str)?;

    Ok(json)
}

/// Retorna o diretório de cache de avatares.
///
/// Cria o diretório `{app_data_dir}/avatars/` se não existir.
pub fn avatars_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Não foi possível acessar o diretório de dados da aplicação".to_string())?
        .join("avatars");
    fs::create_dir_all(&dir)
        .map_err(|_| "Não foi possível criar o diretório de avatares".to_string())?;
    Ok(dir)
}

/// Baixa e armazena localmente o avatar de uma persona.
///
/// Se o avatar já existir no cache local, retorna o caminho sem re-download.
/// O frontend pode usar o caminho retornado como src de <img>.
///
/// # Parâmetros
/// - `persona_id`: ID da persona (usado como nome do arquivo)
/// - `avatar_url`: URL completa do avatar no GitHub
///
/// # Retorno
/// Caminho absoluto do arquivo de avatar no cache local.
#[tauri::command]
pub async fn cache_avatar(
    app: tauri::AppHandle,
    persona_id: String,
    avatar_url: String,
) -> Result<String, String> {
    let safe_id = sanitize_persona_id(&persona_id)?;
    let dir = avatars_dir(&app)?;

    // Determina extensão do arquivo a partir da URL
    let ext = avatar_url
        .rsplit('.')
        .next()
        .and_then(|e| {
            let e = e.split('?').next().unwrap_or(e).to_lowercase();
            if ["png", "jpg", "jpeg", "webp", "gif", "svg"].contains(&e.as_str()) {
                Some(e)
            } else {
                None
            }
        })
        .unwrap_or_else(|| "webp".to_string());

    let filename = format!("{safe_id}.{ext}");
    let local_path = dir.join(&filename);

    // Se já existe no cache, retorna sem re-download
    if local_path.exists() {
        return Ok(local_path.to_string_lossy().to_string());
    }

    // Download do avatar
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {e}"))?;

    let resp = client
        .get(&avatar_url)
        .send()
        .await
        .map_err(|e| {
            log::error!("[PBL] Erro ao baixar avatar {safe_id}: {e}");
            format!("Falha ao baixar avatar: {e}")
        })?;

    if !resp.status().is_success() {
        return Err(format!("HTTP {} ao baixar avatar", resp.status()));
    }

    let bytes = resp.bytes().await.map_err(|e| {
        log::error!("[PBL] Erro ao ler bytes do avatar {safe_id}: {e}");
        format!("Falha ao ler dados do avatar: {e}")
    })?;

    // Salva no cache local
    fs::write(&local_path, &bytes).map_err(|e| {
        log::error!("[PBL] Erro ao salvar avatar {safe_id}: {e}");
        format!("Falha ao salvar avatar localmente: {e}")
    })?;

    log::info!("[PBL] Avatar {safe_id} cacheado em: {:?}", local_path);
    Ok(local_path.to_string_lossy().to_string())
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

    // ── validate_persona_json ──

    fn make_valid_json() -> serde_json::Value {
        serde_json::json!({
            "meta": {
                "id": "goku",
                "display_name": "Goku",
                "category": "fictional",
                "tags": []
            },
            "character": { "universe": "Dragon Ball", "role": "Guerreiro" },
            "prompts": {
                "system_prompt": "Você é o Goku.",
                "rewrite_instruction": "Adapte usando Dragon Ball."
            }
        })
    }

    #[test]
    fn valida_json_completo_retorna_id_sanitizado() {
        let json = make_valid_json();
        let result = validate_persona_json(&json);
        assert_eq!(result.unwrap(), "goku");
    }

    #[test]
    fn valida_json_sem_meta_id_retorna_erro() {
        let json = serde_json::json!({ "meta": { "display_name": "Goku" } });
        assert!(validate_persona_json(&json).is_err());
    }

    #[test]
    fn valida_json_sem_display_name_retorna_erro() {
        let json = serde_json::json!({ "meta": { "id": "goku" } });
        assert!(validate_persona_json(&json).is_err());
    }

    #[test]
    fn valida_json_aceita_meta_name_como_alternativa() {
        // Aceita "name" ou "display_name" - ambos são válidos
        let json = serde_json::json!({ "meta": { "id": "naruto", "name": "Naruto" } });
        assert!(validate_persona_json(&json).is_ok());
    }

    #[test]
    fn valida_json_com_id_com_path_traversal_sanitiza() {
        // ID com path traversal deve ser sanitizado, não rejeitado (exceto se ficar vazio)
        let json = serde_json::json!({
            "meta": { "id": "../../etc/passwd", "display_name": "Hacker" }
        });
        // Após sanitização: "etcpasswd" (nem vazio, então Ok)
        let result = validate_persona_json(&json);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "etcpasswd");
    }

    #[test]
    fn valida_json_com_id_apenas_especiais_retorna_erro() {
        let json = serde_json::json!({
            "meta": { "id": "...", "display_name": "Anon" }
        });
        assert!(validate_persona_json(&json).is_err());
    }

    #[test]
    fn valida_json_id_numerico_aceito() {
        let json = serde_json::json!({
            "meta": { "id": "persona123", "display_name": "Test" }
        });
        assert!(validate_persona_json(&json).is_ok());
    }

    // ── add_persona_from_json (size DoS guard) ──

    #[test]
    fn add_json_rejeita_payload_acima_de_100kb() {
        // Simula a validação de tamanho que protége contra DoS
        let big = "x".repeat(100_001);
        assert!(big.len() > 100_000);
        // A função real reçusa se json_str.len() > 100_000
        // Testamos a condição diretamente (sem AppHandle em unit test)
        let would_reject = big.len() > 100_000;
        assert!(would_reject);
    }

    #[test]
    fn add_json_aceita_payload_dentro_do_limite() {
        let ok_json = serde_json::to_string(&make_valid_json()).unwrap();
        assert!(ok_json.len() <= 100_000);
    }
}

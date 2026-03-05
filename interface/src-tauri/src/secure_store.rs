//! # Módulo Secure Store - Armazenamento seguro de dados sensíveis
//!
//! Utiliza o `tauri-plugin-store` para persistir dados sensíveis (como API keys)
//! de forma segura no disco, ao invés do localStorage do navegador que é
//! acessível por qualquer extensão ou código JS injetado.
//!
//! Os dados são armazenados em `app_data_dir/pbl-secure.json`.

use tauri_plugin_store::StoreExt;

/// Nome do arquivo de store seguro no disco.
const STORE_FILE: &str = "pbl-secure.json";

/// Chave interna para a API key dentro do store.
const API_KEY_FIELD: &str = "api_key";

/// Salva a API key no armazenamento seguro do Tauri.
///
/// Remove a necessidade de armazenar a key no localStorage do navegador.
/// O arquivo é gravado automaticamente no diretório de dados da aplicação.
///
/// # Parâmetros
/// - `api_key`: chave de API a ser armazenada
#[tauri::command]
pub fn save_api_key(app: tauri::AppHandle, api_key: String) -> Result<(), String> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| {
            eprintln!("[PBL] Erro ao abrir store seguro: {e}");
            "Não foi possível acessar o armazenamento seguro".to_string()
        })?;

    store.set(API_KEY_FIELD, serde_json::json!(api_key));

    store.save().map_err(|e| {
        eprintln!("[PBL] Erro ao salvar store seguro: {e}");
        "Não foi possível salvar a API key de forma segura".to_string()
    })?;

    Ok(())
}

/// Recupera a API key do armazenamento seguro do Tauri.
///
/// Retorna uma string vazia se nenhuma key foi salva anteriormente.
/// Isso permite que o frontend trate a ausência como "sem configuração".
#[tauri::command]
pub fn get_api_key(app: tauri::AppHandle) -> Result<String, String> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| {
            eprintln!("[PBL] Erro ao abrir store seguro: {e}");
            "Não foi possível acessar o armazenamento seguro".to_string()
        })?;

    let value = store.get(API_KEY_FIELD);

    match value {
        Some(v) => Ok(v.as_str().unwrap_or("").to_string()),
        None => Ok(String::new()),
    }
}

/// Remove a API key do armazenamento seguro.
///
/// Utilizado no reset total da aplicação.
#[tauri::command]
pub fn delete_api_key(app: tauri::AppHandle) -> Result<(), String> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| {
            eprintln!("[PBL] Erro ao abrir store seguro: {e}");
            "Não foi possível acessar o armazenamento seguro".to_string()
        })?;

    store.delete(API_KEY_FIELD);

    store.save().map_err(|e| {
        eprintln!("[PBL] Erro ao salvar store seguro: {e}");
        "Não foi possível limpar a API key".to_string()
    })?;

    Ok(())
}

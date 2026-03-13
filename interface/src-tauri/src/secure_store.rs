//! # Módulo Secure Store - Armazenamento seguro de dados sensíveis
//!
//! Utiliza o keychain nativo do sistema operacional para armazenar
//! dados sensíveis como API keys:
//!
//! - **Windows**: Windows Credential Manager
//! - **macOS**: Keychain
//! - **Linux**: Secret Service (gnome-keyring, KWallet)
//!
//! ## Migração do tauri-plugin-store
//!
//! Versões anteriores usavam `tauri-plugin-store` (JSON plano em disco).
//! Este módulo migra automaticamente a key do formato antigo para o keychain
//! nativo na primeira execução, e depois remove o arquivo antigo.
//!
//! ## Modelo de Segurança
//!
//! O keychain nativo oferece proteção significativamente superior:
//! - Criptografia em repouso (AES-256 no macOS/Windows)
//! - Isolamento por aplicação (outros apps não acessam)
//! - Autenticação biométrica (se configurada pelo usuário)
//! - Proteção contra extração por malware sem privilégio elevado

use tauri_plugin_store::StoreExt;

/// Nome do serviço no keychain (identifica a aplicação)
const KEYCHAIN_SERVICE: &str = "pbl-prometheus-bridge-learn";
/// Conta/user no keychain
const KEYCHAIN_ACCOUNT: &str = "api_key";
/// Nome do arquivo de store antigo (para migração)
const LEGACY_STORE_FILE: &str = "pbl-secure.json";
/// Chave no store antigo
const LEGACY_API_KEY_FIELD: &str = "api_key";

/// Tenta obter a API key do keychain nativo do OS.
fn keyring_get() -> Result<String, String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT)
        .map_err(|e| format!("Erro ao criar entry no keychain: {e}"))?;
    match entry.get_password() {
        Ok(pw) => Ok(pw),
        Err(keyring::Error::NoEntry) => Ok(String::new()),
        Err(e) => Err(format!("Erro ao ler keychain: {e}")),
    }
}

/// Salva a API key no keychain nativo do OS.
fn keyring_set(api_key: &str) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT)
        .map_err(|e| format!("Erro ao criar entry no keychain: {e}"))?;
    entry
        .set_password(api_key)
        .map_err(|e| format!("Erro ao salvar no keychain: {e}"))
}

/// Remove a API key do keychain nativo do OS.
fn keyring_delete() -> Result<(), String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT)
        .map_err(|e| format!("Erro ao criar entry no keychain: {e}"))?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // já não existe
        Err(e) => Err(format!("Erro ao remover do keychain: {e}")),
    }
}

/// Migra a API key do store antigo (JSON plano) para o keychain nativo.
///
/// Executado na primeira chamada a `get_api_key`. Se encontrar uma key
/// no formato antigo, move para o keychain e limpa o store antigo.
fn migrate_from_legacy_store(app: &tauri::AppHandle) {
    let store = match app.store(LEGACY_STORE_FILE) {
        Ok(s) => s,
        Err(_) => return, // store antigo não existe
    };

    if let Some(value) = store.get(LEGACY_API_KEY_FIELD) {
        if let Some(key) = value.as_str() {
            if !key.is_empty() {
                log::info!("[PBL] Migrando API key do store antigo para keychain nativo...");
                if keyring_set(key).is_ok() {
                    store.delete(LEGACY_API_KEY_FIELD);
                    let _ = store.save();
                    log::info!("[PBL] Migração concluída com sucesso.");
                } else {
                    log::warn!("[PBL] Falha na migração - key mantida no store antigo.");
                }
            }
        }
    }
}

/// Salva a API key no keychain nativo do OS.
///
/// Se o keychain falhar (ex: Linux sem Secret Service), faz fallback para
/// o `tauri-plugin-store` com aviso no log.
#[tauri::command]
pub fn save_api_key(app: tauri::AppHandle, api_key: String) -> Result<(), String> {
    match keyring_set(&api_key) {
        Ok(()) => {
            log::info!("[PBL] API key salva no keychain nativo.");
            Ok(())
        }
        Err(e) => {
            log::warn!("[PBL] Keychain indisponível ({e}), usando fallback (plugin-store).");
            // Fallback para plugin-store
            let store = app.store(LEGACY_STORE_FILE).map_err(|e| {
                log::error!("[PBL] Erro ao abrir store seguro: {e}");
                "Não foi possível acessar o armazenamento seguro".to_string()
            })?;
            store.set(LEGACY_API_KEY_FIELD, serde_json::json!(api_key));
            store.save().map_err(|e| {
                log::error!("[PBL] Erro ao salvar store seguro: {e}");
                "Não foi possível salvar a API key".to_string()
            })?;
            Ok(())
        }
    }
}

/// Recupera a API key - primeiro tenta keychain, depois migra do store antigo.
///
/// Na primeira chamada, migra automaticamente do formato antigo para o keychain.
#[tauri::command]
pub fn get_api_key(app: tauri::AppHandle) -> Result<String, String> {
    // Tenta keychain nativo primeiro
    match keyring_get() {
        Ok(key) if !key.is_empty() => return Ok(key),
        Ok(_) => {
            // Keychain vazio - tenta migrar do store antigo
            migrate_from_legacy_store(&app);
            // Tenta de novo após migração
            return keyring_get();
        }
        Err(e) => {
            log::warn!("[PBL] Keychain indisponível ({e}), usando fallback (plugin-store).");
            // Fallback: lê do store antigo
            let store = app.store(LEGACY_STORE_FILE).map_err(|e| {
                log::error!("[PBL] Erro ao abrir store seguro: {e}");
                "Não foi possível acessar o armazenamento seguro".to_string()
            })?;
            match store.get(LEGACY_API_KEY_FIELD) {
                Some(v) => Ok(v.as_str().unwrap_or("").to_string()),
                None => Ok(String::new()),
            }
        }
    }
}

/// Remove a API key de ambos os stores (keychain + legacy).
#[tauri::command]
pub fn delete_api_key(app: tauri::AppHandle) -> Result<(), String> {
    // Remove do keychain
    let _ = keyring_delete();

    // Remove do store antigo (se existir)
    if let Ok(store) = app.store(LEGACY_STORE_FILE) {
        store.delete(LEGACY_API_KEY_FIELD);
        let _ = store.save();
    }

    Ok(())
}

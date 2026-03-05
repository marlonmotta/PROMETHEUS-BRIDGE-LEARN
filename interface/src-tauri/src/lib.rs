//! # PBL - Backend Tauri (Camada Rust)
//!
//! Este crate implementa o backend da aplicação PROMETHEUS · BRIDGE · LEARN (PBL).
//!
//! ## Arquitetura modular
//!
//! O código está organizado em 4 módulos por responsabilidade:
//!
//! - [`personas`] - Gerenciamento do catálogo de personas (CRUD + atualização online)
//! - [`ai`] - Bridge de comunicação com provedores de IA (Ollama, OpenAI, etc.)
//! - [`export`] - Exportação multi-formato (TXT, HTML, MD, DOCX)
//! - [`secure_store`] - Armazenamento seguro de dados sensíveis (API keys)
//!
//! Este arquivo (`lib.rs`) atua como ponto de entrada: declara os módulos,
//! define as personas embutidas no binário e inicializa o runtime Tauri.
//!
//! ## Decisões Arquiteturais
//!
//! - Personas base são embutidas via `include_str!()` para funcionamento offline.
//! - O `include_str!()` requer caminhos relativos ao arquivo de declaração,
//!   por isso `PERSONAS_EMBEDDED` permanece aqui no `lib.rs`.

pub mod ai;
pub mod export;
pub mod personas;
pub mod secure_store;

// ─── Personas embutidas no binário (fallback offline) ───────────────────────

/// Personas pré-compiladas no executável para garantir disponibilidade offline.
///
/// Cada entrada contém o slug (identificador único) e o JSON completo da persona.
/// Essas personas NUNCA podem ser excluídas pelo usuário - servem como base
/// imutável do catálogo.
pub const PERSONAS_EMBEDDED: &[(&str, &str)] = &[
    ("ainz-ooal-gown",  include_str!("../../../personas/fictional/ainz-ooal-gown.json")),
    ("albedo",          include_str!("../../../personas/fictional/albedo.json")),
    ("batman",          include_str!("../../../personas/fictional/batman.json")),
    ("ezio-auditore",   include_str!("../../../personas/fictional/ezio-auditore.json")),
    ("gojo-satoru",     include_str!("../../../personas/fictional/gojo-satoru.json")),
    ("goku",            include_str!("../../../personas/fictional/goku.json")),
    ("jiraiya-sensei",  include_str!("../../../personas/fictional/jiraiya-sensei.json")),
    ("jinx",            include_str!("../../../personas/fictional/jinx.json")),
    ("kakashi",         include_str!("../../../personas/fictional/kakashi.json")),
    ("kratos",          include_str!("../../../personas/fictional/kratos.json")),
    ("l-lawliet",       include_str!("../../../personas/fictional/l-lawliet.json")),
    ("lara-croft",      include_str!("../../../personas/fictional/lara-croft.json")),
    ("link",            include_str!("../../../personas/fictional/link.json")),
    ("luigi",           include_str!("../../../personas/fictional/luigi.json")),
    ("luffy",           include_str!("../../../personas/fictional/luffy.json")),
    ("mario",           include_str!("../../../personas/fictional/mario.json")),
    ("naofumi",         include_str!("../../../personas/fictional/naofumi.json")),
    ("raphtalia",       include_str!("../../../personas/fictional/raphtalia.json")),
    ("spider-man",      include_str!("../../../personas/fictional/spider-man.json")),
    ("steve-minecraft", include_str!("../../../personas/fictional/steve-minecraft.json")),
    ("tanjiro",         include_str!("../../../personas/fictional/tanjiro.json")),
    ("albert-einstein", include_str!("../../../personas/real/albert-einstein.json")),
    ("sergio-sacani",   include_str!("../../../personas/real/sergio-sacani.json")),
];

// ─── Runner ─────────────────────────────────────────────────────────────────

/// Ponto de entrada principal da aplicação Tauri.
///
/// Registra todos os plugins necessários e expõe os comandos ao frontend.
/// O `tauri_plugin_updater` gerencia atualizações automáticas via GitHub Releases.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            personas::load_personas,
            personas::update_personas_online,
            personas::delete_persona,
            personas::add_persona_from_file,
            personas::add_persona_from_json,
            ai::invoke_ai,
            ai::check_ollama,
            export::export_file,
            secure_store::save_api_key,
            secure_store::get_api_key,
            secure_store::delete_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("[PBL] Falha crítica ao inicializar a aplicação Tauri");
}

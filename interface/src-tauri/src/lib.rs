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
//! - [`export`] - Exportação multi-formato (TXT, HTML, MD, DOCX, PDF)
//! - [`import`] - Importação de arquivos (PDF, DOCX, TXT, MD)
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
pub mod import;
pub mod personas;
pub mod secure_store;

// ─── Personas embutidas no binário (fallback offline) ───────────────────────

/// Personas pré-compiladas no executável para garantir disponibilidade offline.
///
/// Cada entrada contém o slug (identificador único) e o JSON completo da persona.
/// Essas personas NUNCA podem ser excluídas pelo usuário - servem como base
/// imutável do catálogo.
pub const PERSONAS_EMBEDDED: &[(&str, &str)] = &[
    // ── Fictional ────────────────────────────────────────────────────────
    (
        "aerith",
        include_str!("../../../personas/fictional/aerith.json"),
    ),
    (
        "ainz-ooal-gown",
        include_str!("../../../personas/fictional/ainz-ooal-gown.json"),
    ),
    (
        "albedo",
        include_str!("../../../personas/fictional/albedo.json"),
    ),
    (
        "ash-ketchum",
        include_str!("../../../personas/fictional/ash-ketchum.json"),
    ),
    (
        "bacon-hair",
        include_str!("../../../personas/fictional/bacon-hair.json"),
    ),
    (
        "batman",
        include_str!("../../../personas/fictional/batman.json"),
    ),
    (
        "bayonetta",
        include_str!("../../../personas/fictional/bayonetta.json"),
    ),
    (
        "big-boss",
        include_str!("../../../personas/fictional/big-boss.json"),
    ),
    (
        "black-panther",
        include_str!("../../../personas/fictional/black-panther.json"),
    ),
    (
        "breno",
        include_str!("../../../personas/fictional/breno.json"),
    ),
    (
        "captain-america",
        include_str!("../../../personas/fictional/captain-america.json"),
    ),
    (
        "chris-redfield",
        include_str!("../../../personas/fictional/chris-redfield.json"),
    ),
    (
        "claire-redfield",
        include_str!("../../../personas/fictional/claire-redfield.json"),
    ),
    (
        "cloud-strife",
        include_str!("../../../personas/fictional/cloud-strife.json"),
    ),
    (
        "deadpool",
        include_str!("../../../personas/fictional/deadpool.json"),
    ),
    (
        "deckard-cain",
        include_str!("../../../personas/fictional/deckard-cain.json"),
    ),
    (
        "doctor-strange",
        include_str!("../../../personas/fictional/doctor-strange.json"),
    ),
    (
        "ezio-auditore",
        include_str!("../../../personas/fictional/ezio-auditore.json"),
    ),
    (
        "gandalf",
        include_str!("../../../personas/fictional/gandalf.json"),
    ),
    (
        "geralt",
        include_str!("../../../personas/fictional/geralt.json"),
    ),
    (
        "gojo-satoru",
        include_str!("../../../personas/fictional/gojo-satoru.json"),
    ),
    (
        "goku",
        include_str!("../../../personas/fictional/goku.json"),
    ),
    (
        "iron-man",
        include_str!("../../../personas/fictional/iron-man.json"),
    ),
    (
        "jinx",
        include_str!("../../../personas/fictional/jinx.json"),
    ),
    (
        "jiraiya-sensei",
        include_str!("../../../personas/fictional/jiraiya-sensei.json"),
    ),
    (
        "kakashi",
        include_str!("../../../personas/fictional/kakashi.json"),
    ),
    (
        "kefka",
        include_str!("../../../personas/fictional/kefka.json"),
    ),
    (
        "kratos",
        include_str!("../../../personas/fictional/kratos.json"),
    ),
    (
        "l-lawliet",
        include_str!("../../../personas/fictional/l-lawliet.json"),
    ),
    (
        "lara-croft",
        include_str!("../../../personas/fictional/lara-croft.json"),
    ),
    (
        "leon-kennedy",
        include_str!("../../../personas/fictional/leon-kennedy.json"),
    ),
    (
        "link",
        include_str!("../../../personas/fictional/link.json"),
    ),
    (
        "luigi",
        include_str!("../../../personas/fictional/luigi.json"),
    ),
    (
        "luffy",
        include_str!("../../../personas/fictional/luffy.json"),
    ),
    (
        "mario",
        include_str!("../../../personas/fictional/mario.json"),
    ),
    (
        "mira",
        include_str!("../../../personas/fictional/mira.json"),
    ),
    (
        "naofumi",
        include_str!("../../../personas/fictional/naofumi.json"),
    ),
    (
        "naruto",
        include_str!("../../../personas/fictional/naruto.json"),
    ),
    (
        "noob-roblox",
        include_str!("../../../personas/fictional/noob-roblox.json"),
    ),
    (
        "pilar",
        include_str!("../../../personas/fictional/pilar.json"),
    ),
    (
        "professor-x",
        include_str!("../../../personas/fictional/professor-x.json"),
    ),
    (
        "raiden",
        include_str!("../../../personas/fictional/raiden.json"),
    ),
    (
        "raphtalia",
        include_str!("../../../personas/fictional/raphtalia.json"),
    ),
    (
        "rebecca-chambers",
        include_str!("../../../personas/fictional/rebecca-chambers.json"),
    ),
    (
        "rumi",
        include_str!("../../../personas/fictional/rumi.json"),
    ),
    (
        "samba",
        include_str!("../../../personas/fictional/samba.json"),
    ),
    (
        "sephiroth",
        include_str!("../../../personas/fictional/sephiroth.json"),
    ),
    (
        "spider-man",
        include_str!("../../../personas/fictional/spider-man.json"),
    ),
    (
        "steve-minecraft",
        include_str!("../../../personas/fictional/steve-minecraft.json"),
    ),
    (
        "superman",
        include_str!("../../../personas/fictional/superman.json"),
    ),
    (
        "tai-kamiya",
        include_str!("../../../personas/fictional/tai-kamiya.json"),
    ),
    (
        "tanjiro",
        include_str!("../../../personas/fictional/tanjiro.json"),
    ),
    (
        "thrall",
        include_str!("../../../personas/fictional/thrall.json"),
    ),
    (
        "tifa",
        include_str!("../../../personas/fictional/tifa.json"),
    ),
    (
        "tyrael",
        include_str!("../../../personas/fictional/tyrael.json"),
    ),
    (
        "voljin",
        include_str!("../../../personas/fictional/voljin.json"),
    ),
    (
        "wonder-woman",
        include_str!("../../../personas/fictional/wonder-woman.json"),
    ),
    (
        "zoey",
        include_str!("../../../personas/fictional/zoey.json"),
    ),
    // ── Real ─────────────────────────────────────────────────────────────
    (
        "ada-lovelace",
        include_str!("../../../personas/real/ada-lovelace.json"),
    ),
    (
        "alan-turing",
        include_str!("../../../personas/real/alan-turing.json"),
    ),
    (
        "albert-einstein",
        include_str!("../../../personas/real/albert-einstein.json"),
    ),
    (
        "buckminster-fuller",
        include_str!("../../../personas/real/buckminster-fuller.json"),
    ),
    (
        "carl-sagan",
        include_str!("../../../personas/real/carl-sagan.json"),
    ),
    (
        "charles-darwin",
        include_str!("../../../personas/real/charles-darwin.json"),
    ),
    (
        "elon-musk",
        include_str!("../../../personas/real/elon-musk.json"),
    ),
    (
        "galileu-galilei",
        include_str!("../../../personas/real/galileu-galilei.json"),
    ),
    (
        "grace-hopper",
        include_str!("../../../personas/real/grace-hopper.json"),
    ),
    (
        "isaac-newton",
        include_str!("../../../personas/real/isaac-newton.json"),
    ),
    (
        "kevin-mitnick",
        include_str!("../../../personas/real/kevin-mitnick.json"),
    ),
    (
        "leonardo-da-vinci",
        include_str!("../../../personas/real/leonardo-da-vinci.json"),
    ),
    (
        "linus-torvalds",
        include_str!("../../../personas/real/linus-torvalds.json"),
    ),
    (
        "marie-curie",
        include_str!("../../../personas/real/marie-curie.json"),
    ),
    (
        "neil-degrasse-tyson",
        include_str!("../../../personas/real/neil-degrasse-tyson.json"),
    ),
    (
        "neymar-jr",
        include_str!("../../../personas/real/neymar-jr.json"),
    ),
    (
        "nikola-tesla",
        include_str!("../../../personas/real/nikola-tesla.json"),
    ),
    (
        "noam-chomsky",
        include_str!("../../../personas/real/noam-chomsky.json"),
    ),
    (
        "richard-feynman",
        include_str!("../../../personas/real/richard-feynman.json"),
    ),
    (
        "sergio-sacani",
        include_str!("../../../personas/real/sergio-sacani.json"),
    ),
    (
        "stephen-hawking",
        include_str!("../../../personas/real/stephen-hawking.json"),
    ),
    (
        "steve-jobs",
        include_str!("../../../personas/real/steve-jobs.json"),
    ),
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
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            personas::load_personas,
            personas::update_personas_online,
            personas::delete_persona,
            personas::add_persona_from_file,
            personas::add_persona_from_json,
            personas::cache_avatar,
            ai::invoke_ai,
            ai::check_ollama,
            ai::extract_image_text,
            export::export_file,
            import::import_file,
            secure_store::save_api_key,
            secure_store::get_api_key,
            secure_store::delete_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("[PBL] Falha crítica ao inicializar a aplicação Tauri");
}

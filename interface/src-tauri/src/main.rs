//! Ponto de entrada do executável PBL (PROMETHEUS · BRIDGE · LEARN).
//!
//! Este arquivo é o wrapper mínimo que inicializa o runtime Tauri.
//! Toda a lógica de negócio está implementada em `lib.rs`.
//!
//! A diretiva `windows_subsystem = "windows"` esconde o console do terminal
//! em builds de release no Windows, exibindo apenas a janela da aplicação.

// Previne janela de console adicional no Windows em builds de release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    interface_lib::run()
}

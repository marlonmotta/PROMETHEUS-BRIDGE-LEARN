//! # Módulo AI - Bridge de comunicação com provedores de IA
//!
//! Implementa um "bridge" unificado que abstrai as diferenças de API entre
//! os diversos provedores suportados. Cada provedor tem seu próprio formato
//! de request/response, mas todos recebem os mesmos parâmetros do frontend.
//!
//! ## Provedores suportados
//! | Provedor   | Tipo         | Endpoint                                    |
//! |-----------|-------------|---------------------------------------------|
//! | Ollama     | Local        | `localhost:11434/api/chat`                  |
//! | OpenAI     | Cloud        | `api.openai.com/v1/chat/completions`        |
//! | Anthropic  | Cloud        | `api.anthropic.com/v1/messages`             |
//! | Gemini     | Cloud        | `generativelanguage.googleapis.com/v1beta`  |
//! | OpenRouter | Cloud (proxy)| `openrouter.ai/api/v1/chat/completions`     |
//! | Groq       | Cloud        | `api.groq.com/openai/v1/chat/completions`   |

use serde_json::Value;
use std::time::Duration;

/// Executa uma requisição ao provedor de IA configurado.
///
/// # Parâmetros
/// - `mode`: `"offline"` (Ollama), `"online"` (API cloud) ou `"manual"`
/// - `provider`: identificador do provedor (ex: `"openai"`, `"anthropic"`)
/// - `api_key`: chave de API do provedor cloud
/// - `model`: nome do modelo a ser utilizado
/// - `system_prompt`: prompt de sistema da persona selecionada
/// - `user_content`: conteúdo do usuário a ser adaptado
///
/// # Erros
/// Retorna mensagem genérica ao frontend. Detalhes técnicos são logados no
/// console do backend via `eprintln!` para debugging sem expor informações
/// sensíveis ao usuário.
#[tauri::command]
pub async fn invoke_ai(
    mode: String,
    provider: String,
    api_key: String,
    model: String,
    system_prompt: String,
    user_content: String,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| {
            eprintln!("[PBL] Erro ao criar cliente HTTP para IA: {e}");
            "Falha ao inicializar conexão com o provedor de IA".to_string()
        })?;

    // ── Ollama (offline) ────────────────────────────────────────────────────
    if mode == "offline" || provider == "ollama" {
        return call_ollama(&client, &model, &system_prompt, &user_content).await;
    }

    // ── Gemini ──────────────────────────────────────────────────────────────
    if provider == "gemini" {
        return call_gemini(&client, &api_key, &model, &system_prompt, &user_content).await;
    }

    // ── Anthropic ───────────────────────────────────────────────────────────
    if provider == "anthropic" {
        return call_anthropic(&client, &api_key, &model, &system_prompt, &user_content).await;
    }

    // ── OpenAI-compatible (openai, openrouter, groq) ────────────────────────
    call_openai_compatible(&client, &provider, &api_key, &model, &system_prompt, &user_content)
        .await
}

/// Verifica se o servidor Ollama está acessível em `localhost:11434`.
///
/// Faz um GET simples com timeout curto (2s) para não travar a UI.
/// Retorna `true` se o servidor responder, `false` caso contrário.
#[tauri::command]
pub async fn check_ollama() -> bool {
    let Ok(client) = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
    else {
        return false;
    };
    client
        .get("http://localhost:11434")
        .send()
        .await
        .is_ok()
}

// ─── Funções internas por provedor ──────────────────────────────────────────

async fn call_ollama(
    client: &reqwest::Client,
    model: &str,
    system_prompt: &str,
    user_content: &str,
) -> Result<String, String> {
    let m = if model.is_empty() { "llama3" } else { model };
    let body = serde_json::json!({
        "model": m,
        "stream": false,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user",   "content": user_content }
        ]
    });
    let resp = client
        .post("http://localhost:11434/api/chat")
        .json(&body)
        .send()
        .await
        .map_err(|e| {
            eprintln!("[PBL] Erro na requisição ao Ollama: {e}");
            "Não foi possível conectar ao Ollama. Verifique se está rodando em localhost:11434"
                .to_string()
        })?;
    let j: Value = resp.json().await.map_err(|e| {
        eprintln!("[PBL] Erro ao parsear resposta do Ollama: {e}");
        "Resposta do Ollama em formato inesperado".to_string()
    })?;
    j.pointer("/message/content")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "Não foi possível extrair o conteúdo da resposta do Ollama".to_string())
}

async fn call_gemini(
    client: &reqwest::Client,
    api_key: &str,
    model: &str,
    system_prompt: &str,
    user_content: &str,
) -> Result<String, String> {
    let m = if model.is_empty() {
        "gemini-1.5-flash"
    } else {
        model
    };
    // Nota: A API do Gemini requer a key como query param na URL.
    // Isso é uma limitação da API do Google, não um problema de implementação.
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        m, api_key
    );
    let body = serde_json::json!({
        "contents": [
            { "role": "user", "parts": [{ "text": user_content }] }
        ],
        "systemInstruction": {
            "parts": [{ "text": system_prompt }]
        },
        "generationConfig": { "maxOutputTokens": 8192 }
    });
    let resp = client.post(&url).json(&body).send().await.map_err(|e| {
        eprintln!("[PBL] Erro na requisição ao Gemini: {e}");
        "Não foi possível conectar ao Google Gemini".to_string()
    })?;
    let j: Value = resp.json().await.map_err(|e| {
        eprintln!("[PBL] Erro ao parsear resposta do Gemini: {e}");
        "Resposta do Gemini em formato inesperado".to_string()
    })?;
    j.pointer("/candidates/0/content/parts/0/text")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "Não foi possível extrair o conteúdo da resposta do Gemini".to_string())
}

async fn call_anthropic(
    client: &reqwest::Client,
    api_key: &str,
    model: &str,
    system_prompt: &str,
    user_content: &str,
) -> Result<String, String> {
    let m = if model.is_empty() {
        "claude-3-5-sonnet-20241022"
    } else {
        model
    };
    let body = serde_json::json!({
        "model": m,
        "max_tokens": 8192,
        "system": system_prompt,
        "messages": [{ "role": "user", "content": user_content }]
    });
    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await
        .map_err(|e| {
            eprintln!("[PBL] Erro na requisição ao Anthropic: {e}");
            "Não foi possível conectar à API da Anthropic".to_string()
        })?;
    let j: Value = resp.json().await.map_err(|e| {
        eprintln!("[PBL] Erro ao parsear resposta do Anthropic: {e}");
        "Resposta da Anthropic em formato inesperado".to_string()
    })?;
    j.pointer("/content/0/text")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| {
            "Não foi possível extrair o conteúdo da resposta da Anthropic".to_string()
        })
}

async fn call_openai_compatible(
    client: &reqwest::Client,
    provider: &str,
    api_key: &str,
    model: &str,
    system_prompt: &str,
    user_content: &str,
) -> Result<String, String> {
    let base_url = match provider {
        "openrouter" => "https://openrouter.ai/api/v1/chat/completions",
        "groq" => "https://api.groq.com/openai/v1/chat/completions",
        _ => "https://api.openai.com/v1/chat/completions",
    };
    let m = if model.is_empty() { "gpt-4o" } else { model };
    let body = serde_json::json!({
        "model": m,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user",   "content": user_content }
        ]
    });
    let resp = client
        .post(base_url)
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| {
            eprintln!("[PBL] Erro na requisição ao {provider}: {e}");
            format!("Não foi possível conectar ao provedor {}", provider)
        })?;
    let j: Value = resp.json().await.map_err(|e| {
        eprintln!("[PBL] Erro ao parsear resposta de {provider}: {e}");
        format!("Resposta do {} em formato inesperado", provider)
    })?;
    j.pointer("/choices/0/message/content")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| {
            format!(
                "Não foi possível extrair o conteúdo da resposta do {}",
                provider
            )
        })
}

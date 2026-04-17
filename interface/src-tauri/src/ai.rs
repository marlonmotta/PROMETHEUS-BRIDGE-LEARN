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
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::LazyLock;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// Cliente HTTP reutilizável para chamadas de IA (timeout 120s).
/// Evita recriação de connection pool + TLS a cada chamada.
static AI_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .expect("Falha ao inicializar cliente HTTP para IA")
});

/// Cliente HTTP com timeout curto (2s) para health check do Ollama.
static OLLAMA_CHECK_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .expect("Falha ao inicializar cliente HTTP para Ollama check")
});

/// Timestamp (ms) da última chamada invoke_ai - para rate limiting
static LAST_INVOKE_MS: AtomicU64 = AtomicU64::new(0);
/// Intervalo mínimo entre chamadas de IA (ms)
const MIN_INVOKE_INTERVAL_MS: u64 = 3000;

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
    // Rate limiting: mínimo 3s entre chamadas para proteger quota da API key.
    // Usa compare_exchange para garantir atomicidade (sem race condition).
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;
    loop {
        let last = LAST_INVOKE_MS.load(Ordering::Acquire);
        if last > 0 && now_ms.saturating_sub(last) < MIN_INVOKE_INTERVAL_MS {
            return Err("Aguarde alguns segundos antes de gerar novamente.".to_string());
        }
        if LAST_INVOKE_MS
            .compare_exchange(last, now_ms, Ordering::Release, Ordering::Relaxed)
            .is_ok()
        {
            break;
        }
    }
    let client = &*AI_CLIENT;

    // ── Ollama (offline) ────────────────────────────────────────────────────
    if mode == "offline" || provider == "ollama" {
        return call_ollama(client, &model, &system_prompt, &user_content).await;
    }

    // ── Gemini ──────────────────────────────────────────────────────────────
    if provider == "gemini" {
        return call_gemini(client, &api_key, &model, &system_prompt, &user_content).await;
    }

    // ── Anthropic ───────────────────────────────────────────────────────────
    if provider == "anthropic" {
        return call_anthropic(client, &api_key, &model, &system_prompt, &user_content).await;
    }

    // ── OpenAI-compatible (openai, openrouter, groq) ────────────────────────
    call_openai_compatible(
        client,
        &provider,
        &api_key,
        &model,
        &system_prompt,
        &user_content,
    )
    .await
}

/// Verifica se o servidor Ollama está acessível em `localhost:11434`.
///
/// Faz um GET simples com timeout curto (2s) para não travar a UI.
/// Retorna `true` se o servidor responder, `false` caso contrário.
#[tauri::command]
pub async fn check_ollama() -> bool {
    OLLAMA_CHECK_CLIENT
        .get(OLLAMA_HEALTH_URL)
        .send()
        .await
        .is_ok()
}

// ─── Endpoints dos provedores (P4: centralizados como constantes) ────────────

const OLLAMA_CHAT_URL: &str = "http://localhost:11434/api/chat";
const OLLAMA_HEALTH_URL: &str = "http://localhost:11434";
const GEMINI_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1beta/models";
const ANTHROPIC_URL: &str = "https://api.anthropic.com/v1/messages";
const OPENAI_URL: &str = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_URL: &str = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_URL: &str = "https://api.groq.com/openai/v1/chat/completions";

// ─── Helper genérico: send + parse + extract (P3: elimina duplicação) ────────

/// Envia uma request HTTP preparada, parseia o JSON de resposta, e extrai
/// o texto na posição indicada por `response_pointer`.
///
/// Encapsula o padrão repetido em todas as funções `call_*`:
/// ```text
/// send() → json() → pointer() → as_str()
/// ```
async fn send_and_parse(
    request: reqwest::RequestBuilder,
    response_pointer: &str,
    provider_name: &str,
) -> Result<String, String> {
    let resp = request.send().await.map_err(|e| {
        log::error!("[PBL] Erro na requisição ao {provider_name}: {e}");
        format!("Não foi possível conectar ao {}", provider_name)
    })?;
    let status = resp.status();
    if !status.is_success() {
        let body = resp.text().await.unwrap_or_default();
        log::error!("[PBL] {provider_name} retornou HTTP {status}: {body}");
        return Err(format!("Erro {} do {}", status.as_u16(), provider_name));
    }
    let j: Value = resp.json().await.map_err(|e| {
        log::error!("[PBL] Erro ao parsear resposta do {provider_name}: {e}");
        format!("Resposta do {} em formato inesperado", provider_name)
    })?;
    j.pointer(response_pointer)
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| {
            format!(
                "Não foi possível extrair o conteúdo da resposta do {}",
                provider_name
            )
        })
}

/// Retorna a URL base para provedores compatíveis com a API do OpenAI.
fn openai_compatible_url(provider: &str) -> &'static str {
    match provider {
        "openrouter" => OPENROUTER_URL,
        "groq" => GROQ_URL,
        _ => OPENAI_URL,
    }
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
    send_and_parse(
        client.post(OLLAMA_CHAT_URL).json(&body),
        "/message/content",
        "Ollama",
    )
    .await
}

async fn call_gemini(
    client: &reqwest::Client,
    api_key: &str,
    model: &str,
    system_prompt: &str,
    user_content: &str,
) -> Result<String, String> {
    let m = if model.is_empty() {
        "gemini-2.0-flash"
    } else {
        model
    };
    let url = format!("{}/{}:generateContent", GEMINI_BASE_URL, m);
    let body = serde_json::json!({
        "contents": [
            { "role": "user", "parts": [{ "text": user_content }] }
        ],
        "systemInstruction": {
            "parts": [{ "text": system_prompt }]
        },
        "generationConfig": { "maxOutputTokens": 8192 }
    });
    send_and_parse(
        client
            .post(&url)
            .header("x-goog-api-key", api_key)
            .json(&body),
        "/candidates/0/content/parts/0/text",
        "Gemini",
    )
    .await
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
    send_and_parse(
        client
            .post(ANTHROPIC_URL)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&body),
        "/content/0/text",
        "Anthropic",
    )
    .await
}

async fn call_openai_compatible(
    client: &reqwest::Client,
    provider: &str,
    api_key: &str,
    model: &str,
    system_prompt: &str,
    user_content: &str,
) -> Result<String, String> {
    let base_url = openai_compatible_url(provider);
    let m = if model.is_empty() { "gpt-5.4" } else { model };
    let body = serde_json::json!({
        "model": m,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user",   "content": user_content }
        ]
    });
    send_and_parse(
        client.post(base_url).bearer_auth(api_key).json(&body),
        "/choices/0/message/content",
        provider,
    )
    .await
}

/// Extrai texto de uma imagem usando IA com capacidade de visão.
///
/// Lê o arquivo de imagem, codifica em base64, e envia para o provedor
/// de IA configurado com um prompt de extração de texto.
///
/// # Formatos suportados
/// JPG, PNG, WEBP, GIF
///
/// # Requer
/// Provedor com suporte a vision (GPT-4o, Gemini, Claude 3, LLaVA)
#[tauri::command]
pub async fn extract_image_text(
    path: String,
    provider: String,
    api_key: String,
    model: String,
    mode: String,
) -> Result<String, String> {
    use base64::Engine;

    // Ler o arquivo de imagem
    let bytes = std::fs::read(&path).map_err(|e| {
        log::error!("[PBL] Erro ao ler imagem: {e}");
        "Não foi possível ler o arquivo de imagem".to_string()
    })?;

    // Detectar MIME type pela extensão
    let ext = std::path::Path::new(&path)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        _ => return Err(format!("Formato de imagem '{}' não suportado", ext)),
    };

    // Codificar em base64
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);

    let ocr_prompt = "Extraia TODO o texto contido nesta imagem. Mantenha a formatação original o mais fielmente possível (títulos, numeração, alternativas a/b/c/d, espaçamentos). Retorne APENAS o texto extraído, sem comentários adicionais.";

    let client = &*AI_CLIENT;

    // Chamar o provedor adequado com a API de vision
    if mode == "offline" || provider == "ollama" {
        call_ollama_vision(client, &model, ocr_prompt, &b64).await
    } else if provider == "gemini" {
        call_gemini_vision(client, &api_key, &model, ocr_prompt, mime, &b64).await
    } else if provider == "anthropic" {
        call_anthropic_vision(client, &api_key, &model, ocr_prompt, mime, &b64).await
    } else {
        call_openai_vision(client, &provider, &api_key, &model, ocr_prompt, mime, &b64).await
    }
}

// ─── Vision-specific API calls ──────────────────────────────────────────────

async fn call_ollama_vision(
    client: &reqwest::Client,
    model: &str,
    prompt: &str,
    image_b64: &str,
) -> Result<String, String> {
    let m = if model.is_empty() { "llava" } else { model };
    let body = serde_json::json!({
        "model": m,
        "stream": false,
        "messages": [{
            "role": "user",
            "content": prompt,
            "images": [image_b64]
        }]
    });
    send_and_parse(
        client.post(OLLAMA_CHAT_URL).json(&body),
        "/message/content",
        "Ollama (vision)",
    )
    .await
}

async fn call_openai_vision(
    client: &reqwest::Client,
    provider: &str,
    api_key: &str,
    model: &str,
    prompt: &str,
    mime: &str,
    image_b64: &str,
) -> Result<String, String> {
    let base_url = openai_compatible_url(provider);
    let m = if model.is_empty() { "gpt-5.4" } else { model };
    let body = serde_json::json!({
        "model": m,
        "messages": [{
            "role": "user",
            "content": [
                { "type": "text", "text": prompt },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": format!("data:{};base64,{}", mime, image_b64)
                    }
                }
            ]
        }],
        "max_tokens": 4096
    });
    send_and_parse(
        client.post(base_url).bearer_auth(api_key).json(&body),
        "/choices/0/message/content",
        provider,
    )
    .await
}

async fn call_gemini_vision(
    client: &reqwest::Client,
    api_key: &str,
    model: &str,
    prompt: &str,
    mime: &str,
    image_b64: &str,
) -> Result<String, String> {
    let m = if model.is_empty() {
        "gemini-2.0-flash"
    } else {
        model
    };
    let url = format!("{}/{}:generateContent", GEMINI_BASE_URL, m);
    let body = serde_json::json!({
        "contents": [{
            "parts": [
                { "text": prompt },
                {
                    "inlineData": {
                        "mimeType": mime,
                        "data": image_b64
                    }
                }
            ]
        }],
        "generationConfig": { "maxOutputTokens": 4096 }
    });
    send_and_parse(
        client
            .post(&url)
            .header("x-goog-api-key", api_key)
            .json(&body),
        "/candidates/0/content/parts/0/text",
        "Gemini (vision)",
    )
    .await
}

async fn call_anthropic_vision(
    client: &reqwest::Client,
    api_key: &str,
    model: &str,
    prompt: &str,
    mime: &str,
    image_b64: &str,
) -> Result<String, String> {
    let m = if model.is_empty() {
        "claude-3-5-sonnet-20241022"
    } else {
        model
    };
    let body = serde_json::json!({
        "model": m,
        "max_tokens": 4096,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": mime,
                        "data": image_b64
                    }
                },
                { "type": "text", "text": prompt }
            ]
        }]
    });
    send_and_parse(
        client
            .post(ANTHROPIC_URL)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&body),
        "/content/0/text",
        "Anthropic (vision)",
    )
    .await
}

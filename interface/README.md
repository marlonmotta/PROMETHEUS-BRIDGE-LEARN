<p align="center">
  <img src="public/app-icon.png" alt="PBL Logo" width="120" />
</p>

<h1 align="center">PBL - PROMETHEUS · BRIDGE · LEARN</h1>

<p align="center">
  <strong>Interface desktop para adaptação de conteúdo pedagógico com IA</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri" alt="Tauri" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Rust-Backend-000000?logo=rust" alt="Rust" />
</p>

---

## Sobre

O PBL transforma conteúdo educacional usando **personas de IA** - personagens que adaptam a linguagem de provas, resumos e materiais para o universo do aluno (anime, games, ciência, etc).

O professor seleciona uma persona, cola o conteúdo e a IA reescreve o material mantendo a precisão pedagógica mas usando referências e linguagem que engajam o estudante.

### Modos de IA

| Modo        | Descrição                                   | Requisito                        |
| ----------- | ------------------------------------------- | -------------------------------- |
| **Offline** | Ollama rodando localmente                   | [ollama.com](https://ollama.com) |
| **Online**  | OpenAI, Anthropic, Groq, Gemini, OpenRouter | API Key                          |
| **Manual**  | Gera o prompt para colar no ChatGPT/Claude  | Nenhum                           |

---

## Stack

| Camada      | Tecnologia                                 |
| ----------- | ------------------------------------------ |
| Frontend    | React 18 + TypeScript + Tailwind CSS v3    |
| Build Tool  | Vite 6                                     |
| Backend     | Rust (Tauri 2)                             |
| Markdown    | marked.js                                  |
| Export      | DOCX (docx-rs), PDF (print), TXT, HTML, MD |
| Auto-update | tauri-plugin-updater (GitHub Releases)     |
| Linting     | ESLint 9 (flat config) + Prettier          |

---

## Estrutura do Projeto

```text
PROMETHEUS-BRIDGE-LEARN/
├── README.md                         # Documentação raiz do projeto
├── CONTENT-POLICY.md                 # Política de conteúdo das personas
├── PERSONAS-BACKLOG.md               # Backlog de personas futuras
├── PERSONAS-CATALOGO.md              # Catálogo de personas existentes
├── personas/                         # Dados das personas (JSON)
│   ├── manifest.json                 # Índice para updates online
│   ├── fictional/                    # 21 personas fictícias
│   ├── real/                         # 2 personas reais
│   └── templates/                    # Template para novas personas
├── profiles/                         # (futuro) perfis de alunos
├── prompts/                          # (futuro) prompts customizados
├── questionnaires/                   # (futuro) questionários
└── interface/                        # App desktop (este diretório)
```

### Interface (App Desktop)

```text
interface/
├── index.html                        # Entry point Vite
├── package.json                      # Dependências e scripts npm
├── TODO.md                           # Backlog de features
├── .prettierrc                       # Config Prettier (100 chars)
├── .prettierignore                   # Arquivos ignorados pelo Prettier
├── eslint.config.js                  # ESLint flat config
├── tailwind.config.cjs               # Tokens de design PBL
├── postcss.config.cjs                # PostCSS + Tailwind
├── vite.config.ts                    # Vite + Tauri HMR
├── tsconfig.json                     # TypeScript config
├── public/
│   ├── app-icon.png                  # Logo do app
│   └── favicon.ico                   # Favicon
├── src/
│   ├── main.tsx                      # React entry point
│   ├── App.tsx                       # State global + routing
│   ├── index.css                     # Tailwind + prose + print + toast
│   ├── vite-env.d.ts                 # Type declarations
│   ├── lib/
│   │   ├── constants.ts              # Types, interfaces, config, subjects
│   │   └── tauri.ts                  # invoke(), downloadBlob()
│   └── components/
│       ├── Icon.tsx                   # SVG icon system (12 ícones)
│       ├── Toast.tsx                  # Toast notification system
│       ├── Sidebar.tsx                # Navegação + Ollama status
│       ├── HomeView.tsx               # Dashboard + histórico recente
│       ├── PersonasView.tsx           # Grid + filtros + favoritas
│       ├── ContentView.tsx            # Input + seleção + geração
│       ├── ResultView.tsx             # Markdown render + export
│       ├── ManagerView.tsx            # Import/update/delete personas
│       ├── SettingsView.tsx           # Config IA + idioma + histórico + sobre
│       └── UpdateChecker.tsx          # Auto-update banner
└── src-tauri/
    ├── Cargo.toml                    # Dependências Rust
    ├── tauri.conf.json               # Config Tauri + updater endpoint
    ├── icons/                        # Ícones gerados (todas plataformas)
    └── src/
        └── lib.rs                    # Backend: personas, IA, export DOCX
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org) >= 18
- [Rust](https://rustup.rs) >= 1.70
- [Tauri CLI](https://tauri.app) (`npm install -g @tauri-apps/cli`)

---

## Instalação

```bash
# Clonar o repositório
git clone https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN.git
cd PROMETHEUS-BRIDGE-LEARN/interface

# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run tauri dev
```

> A primeira execução compila ~465 crates Rust e demora ~2-3 minutos.
> Execuções seguintes são instantâneas com HMR.

---

## Scripts

| Comando                | Descrição                            |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Inicia Vite dev server (porta 1420)  |
| `npm run build`        | Build frontend (TypeScript + Vite)   |
| `npm run tauri dev`    | Dev completo (Vite + Rust + janela)  |
| `npm run tauri build`  | Gera instalador (.exe, .msi)         |
| `npm run lint`         | Verifica erros ESLint                |
| `npm run lint:fix`     | Corrige erros ESLint automaticamente |
| `npm run format`       | Formata código com Prettier          |
| `npm run format:check` | Verifica formatação                  |

---

## Build de Produção

```bash
npm run tauri build
```

Artefatos gerados em `src-tauri/target/release/bundle/`:

| Formato           | Caminho                        | Uso                   |
| ----------------- | ------------------------------ | --------------------- |
| `.exe` (NSIS)     | `nsis/PBL_x.x.x_x64-setup.exe` | Instalador Windows    |
| `.msi`            | `msi/PBL_x.x.x_x64.msi`        | Instalador enterprise |
| `.exe` (portátil) | `../interface.exe`             | Executável direto     |

---

## Versionamento

Antes de cada release, atualize a versão em:

1. `src-tauri/tauri.conf.json` - campo `"version"`
2. `src/components/Sidebar.tsx` - texto `v0.x.x`
3. `src-tauri/Cargo.toml` - campo `version`

---

## Auto-Update

O sistema de auto-update usa GitHub Releases:

1. Builde com `npm run tauri build`
2. Crie um Release no GitHub com a tag `vX.X.X`
3. Faça upload dos artefatos:
   - `PBL_x.x.x_x64-setup.nsis.zip`
   - `PBL_x.x.x_x64-setup.nsis.zip.sig`
   - `latest.json`
4. Ao abrir, o app verifica e oferece atualização automaticamente

---

## Features

- 26 personas (21 fictícias + 2 reais + template)
- 3 modos de IA (Offline/Online/Manual)
- 7 disciplinas (Matemática, Português, Ciências, Física, Química, Biologia, História, Geografia)
- 3 níveis de dificuldade (Rank D/B/S)
- Sistema de favoritas
- Histórico com gerenciamento individual
- Export em 5 formatos (DOCX, PDF, TXT, MD, HTML)
- Toast notifications profissionais
- Configurações: idioma de saída, formato padrão, URL do Ollama
- Auto-update via GitHub Releases
- UI dark theme profissional com ícones SVG

---

## Design Tokens

Definidos em `tailwind.config.cjs`:

| Token      | Hex       | Uso                      |
| ---------- | --------- | ------------------------ |
| `bg`       | `#0d0d14` | Fundo principal          |
| `bg-2`     | `#13131f` | Sidebar, cards           |
| `bg-3`     | `#1a1a2e` | Hover                    |
| `accent`   | `#8b5cf6` | Botões, links, destaques |
| `accent-2` | `#6d28d9` | Hover de accent          |
| `gold`     | `#f5a623` | Tags, badges, favoritas  |
| `txt`      | `#e2e2f0` | Texto principal          |
| `txt-2`    | `#9090b0` | Texto secundário         |
| `ok`       | `#22c55e` | Sucesso, online          |
| `danger`   | `#ef4444` | Erro, excluir            |

---

## Comandos Tauri (Backend)

| Comando                  | Assinatura                        | Descrição                           |
| ------------------------ | --------------------------------- | ----------------------------------- |
| `load_personas`          | `() -> Vec<Value>`                | Carrega personas embutidas + locais |
| `update_personas_online` | `() -> Vec<Value>`                | Busca novas personas do GitHub      |
| `delete_persona`         | `(id: String)`                    | Remove persona local                |
| `add_persona_from_file`  | `(path: String) -> Value`         | Importa .json                       |
| `invoke_ai`              | `(mode, provider, ...) -> String` | Chama IA (Ollama/API)               |
| `check_ollama`           | `() -> bool`                      | Verifica Ollama                     |
| `export_file`            | `(content, format, path)`         | Exporta DOCX                        |

---

## Licença

Este projeto é de uso educacional.

<div align="center">

# 🔱 PROMETHEUS · BRIDGE · LEARN

### Sistema Educacional Adaptativo com IA

> **A IA veste a máscara do universo que o aluno ama — e reescreve a educação pelo canal dele.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![PT-BR](https://img.shields.io/badge/idioma-PT--BR-green.svg)](#)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue.svg)](https://v2.tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![Rust](https://img.shields.io/badge/Rust-orange.svg)](https://www.rust-lang.org)

</div>

---

## 📑 Índice

- [Visão Geral](#-visão-geral)
- [Como Funciona](#-como-funciona)
- [Caso Real Validado](#-caso-real-validado)
- [Exemplo Prático: Jiraiya Sensei](#-exemplo-prático-jiraiya-sensei)
- [Arquitetura e Estrutura de Pastas](#-arquitetura-e-estrutura-de-pastas)
- [Pré-requisitos e Tecnologias](#-pré-requisitos-e-tecnologias)
- [Guia de Instalação e Execução](#-guia-de-instalação-e-execução)
- [Personas](#-personas)
- [Como Contribuir](#-como-contribuir)
- [Roadmap](#-roadmap)
- [Licença](#-licença)
- [Sobre](#-sobre)

---

## 🧠 Visão Geral

O **PROMETHEUS · BRIDGE · LEARN (PBL)** é um sistema educacional adaptativo que usa inteligência artificial para transformar a forma como cada aluno aprende. O professor sobe uma prova ou conteúdo, a IA reescreve no universo de hiperfoco do aluno (Naruto, Batman, Minecraft, futebol...) e o aluno recebe o **mesmo conteúdo pedagógico** — mas pelo canal que ele naturalmente compreende.

**Não é gamificação superficial — é adaptação cognitiva real mediada por IA.**

O sistema funciona em **3 camadas**:

| Camada                | O que faz                                                                              |
| --------------------- | -------------------------------------------------------------------------------------- |
| 🧩 **Personas**       | Arquivos JSON que fazem a IA "vestir a máscara" de um personagem que o aluno ama       |
| 🖥️ **Interface**      | Aplicação desktop nativa para professores gerenciarem personas, conteúdo e exportações |
| 🔗 **Ponte (Bridge)** | Conexão professor → IA → aluno, adaptando conteúdo ao universo de cada um              |

---

## ⚙️ Como Funciona

### Fluxo na Interface

```
 ❶ Professor abre o PBL
    │
 ❷ Seleciona uma persona (ex: Jiraiya Sensei)
    │
 ❸ Cola o conteúdo original da prova/aula
    │
 ❹ Escolhe disciplina + nível de dificuldade
     │
 ❺ Escolhe formato de saída (prova, resumo, exercícios, plano de aula)
     │
 ❻ Clica em "Gerar" → IA adapta o conteúdo
     │
 ❼ Resultado aparece na tela
     │
 ❽ Professor exporta como DOCX, TXT, MD ou HTML
```

### Fluxo de dados (por baixo dos panos)

```
┌────────────┐     ┌───────────────┐     ┌────────────────┐
│  Frontend  │     │  Backend Rust │     │   Provedor IA  │
│  React/TS  │────►│    (Tauri)    │────►│ Ollama/OpenAI/ │
│            │◄────│              │◄────│ Gemini/Claude  │
└────────────┘     └───────────────┘     └────────────────┘
      │                    │
      ▼                    ▼
  localStorage        Secure Store
  (settings)          (API keys)
```

1. O **frontend** monta o prompt usando `promptBuilder.ts` (persona + conteúdo + disciplina + dificuldade + formato + idioma)
2. Chama o **backend Rust** via `invoke("invoke_ai")` do Tauri
3. O backend faz a requisição HTTP ao provedor de IA escolhido
4. A resposta volta pelo mesmo caminho e é renderizada como Markdown na tela

---

## 📊 Caso Real Validado

<div align="center">

|                 |             Antes             |             Depois              |
| --------------- | :---------------------------: | :-----------------------------: |
| **Aluno**       | 18 anos, DI, idade mental ~11 | Hiperfoco: **Naruto / Jiraiya** |
| **Notas**       |           **0 a 3**           |            **8 a 9**            |
| **Engajamento** |             Zero              |        Real e mensurável        |

</div>

> A IA assumiu a identidade do **Jiraiya Sensei** e reescreveu provas inteiras no universo ninja.
> O aluno respondeu porque **finalmente entendeu** — pelo canal dele.

---

## 🐸 Exemplo Prático: Jiraiya Sensei

<table>
<tr>
<td width="50%">

### ❌ Prova Original

> _"Calcule 3/4 + 1/2. Para somar frações com denominadores diferentes, primeiro encontre o MMC dos denominadores."_

</td>
<td width="50%">

### ✅ Prova com Persona Jiraiya

> 🐸 **MISSÃO RANK C — Jutsu de Combinação de Chakra!**
>
> E aí moleque! Imagina que você tem 3/4 do seu chakra num braço e 1/2 no outro. Pra soltar um Rasengan completo, os chakras precisam estar no mesmo fluxo!
>
> **Passo 1** — Selo de Harmonização (MMC): o menor número que 4 e 2 dividem? **4**!
>
> **Passo 2** — 3/4 tá certo. Mas 1/2 = **2/4**!
>
> **Passo 3** — 3/4 + 2/4 = **5/4** 💥
>
> _Yosh! Jutsu completo!_

</td>
</tr>
</table>

**O aluno aprendeu frações. A IA só mudou o canal.**

---

## 📁 Arquitetura e Estrutura de Pastas

```
PROMETHEUS-BRIDGE-LEARN/
│
├── personas/                         # 🧩 Catálogo de personas de IA
│   ├── manifest.json                 #    Índice de personas (usado pelo auto-update)
│   ├── fictional/                    #    36 personas de personagens fictícios
│   │   ├── goku.json
│   │   ├── jiraiya-sensei.json
│   │   ├── batman.json
│   │   ├── iron-man.json
│   │   └── ...
│   ├── real/                         #    2 personas de personalidades reais
│   │   ├── albert-einstein.json
│   │   └── sergio-sacani.json
│   └── templates/                    #    Template base para criar novas personas
│       └── template.json
│
├── profiles/                         # 👤 Perfis cognitivos (expansão futura)
├── prompts/                          # 📝 Prompts customizados (expansão futura)
├── questionnaires/                   # 📋 Questionários (expansão futura)
│
├── docs/                             # 📚 Documentação complementar
│   ├── CONTENT-POLICY.md             #    Política de conteúdo das personas
│   ├── PERSONAS-BACKLOG.md           #    Backlog de personas futuras
│   └── PERSONAS-CATALOGO.md          #    Catálogo detalhado de personas existentes
│
├── interface/                        # 🖥️ Aplicação Tauri (frontend + backend)
│   ├── src/                          #    Código-fonte do frontend
│   │   ├── App.tsx                   #    Componente raiz (estado global)
│   │   ├── main.tsx                  #    Entry point (ErrorBoundary + StrictMode)
│   │   ├── index.css                 #    Design system CSS (Tailwind + custom)
│   │   ├── lib/                      #    Módulos utilitários
│   │   │   ├── constants.ts          #    Tipos, disciplinas, modelos, configurações
│   │   │   ├── promptBuilder.ts      #    Montagem de prompts (formato + idioma + persona)
│   │   │   ├── tauri.ts              #    Wrapper seguro para invoke() do Tauri
│   │   │   └── __tests__/            #    Testes unitários dos módulos
│   │   ├── components/               #    Componentes React da interface
│   │   │   ├── Sidebar.tsx           #    Navegação lateral com status Ollama
│   │   │   ├── HomeView.tsx          #    Tela inicial com histórico recente
│   │   │   ├── PersonasView.tsx      #    Catálogo de personas (busca + filtro)
│   │   │   ├── ContentView.tsx       #    Input + formato de saída + idioma
│   │   │   ├── ResultView.tsx        #    Resultado da IA + exportação + template PDF
│   │   │   ├── ManagerView.tsx       #    Importação/gestão de personas
│   │   │   ├── SettingsView.tsx      #    Configurações (IA, provedor, modelo)
│   │   │   ├── ErrorBoundary.tsx     #    Captura global de erros React
│   │   │   ├── Toast.tsx             #    Sistema de notificações toast
│   │   │   ├── UpdateChecker.tsx     #    Auto-update via GitHub Releases
│   │   │   ├── Icon.tsx              #    Ícones SVG reutilizáveis
│   │   │   └── __tests__/            #    Testes de componentes
│   │   └── test/
│   │       └── setup.ts              #    Setup global (mocks Tauri)
│   │
│   ├── src-tauri/                    #    Backend Rust (Tauri v2)
│   │   ├── src/
│   │   │   ├── lib.rs                #    Entry point + 23 personas embutidas
│   │   │   ├── main.rs               #    Bootstrap do processo
│   │   │   ├── personas.rs           #    CRUD de personas + sanitização anti-traversal
│   │   │   ├── ai.rs                 #    Bridge para 6 provedores de IA
│   │   │   ├── export.rs             #    Exportação DOCX/TXT/MD/HTML + validação de path
│   │   │   └── secure_store.rs       #    Armazenamento seguro de API keys
│   │   ├── Cargo.toml                #    Dependências Rust
│   │   └── capabilities/
│   │       └── default.json          #    Permissões do Tauri (CSP, ACL)
│   │
│   ├── vitest.config.ts              #    Configuração de testes
│   ├── vite.config.ts                #    Configuração do Vite (dev server)
│   ├── tsconfig.json                 #    Configuração TypeScript
│   ├── eslint.config.js              #    Linting (ESLint + Prettier)
│   ├── tailwind.config.cjs           #    Design system (tokens semânticos)
│   └── package.json                  #    Dependências e scripts
│
├── CONTRIBUTING.md                   # 🤝 Guia de contribuição
├── README.md                         # 📖 Este arquivo
└── .gitignore
```

### Módulos-chave do Backend Rust

| Módulo            | Responsabilidade                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `personas.rs`     | Carrega personas (embutidas + locais), download do GitHub, importação, exclusão, sanitização de IDs contra path traversal |
| `ai.rs`           | Bridge unificado para 6 provedores (Ollama, OpenAI, Anthropic, Gemini, OpenRouter, Groq)                                  |
| `export.rs`       | Exportação multi-formato com DOCX nativo + validação de path contra gravação arbitrária                                   |
| `secure_store.rs` | Persistência segura de API keys via `tauri-plugin-store` (separada do localStorage)                                       |

### Módulos-chave do Frontend

| Módulo             | Responsabilidade                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `promptBuilder.ts` | Função pura que monta o prompt (persona + conteúdo + disciplina + dificuldade + formato + idioma) |
| `constants.ts`     | Source of truth para disciplinas, modelos, configurações e tipos TypeScript                       |
| `tauri.ts`         | Wrapper para `invoke()` com fallback seguro quando Tauri não está disponível                      |

---

## 🛠️ Pré-requisitos e Tecnologias

### Tecnologias do Projeto

| Camada       | Tecnologia                                  | Versão |
| ------------ | ------------------------------------------- | ------ |
| **Frontend** | React + TypeScript                          | 18.x   |
| **Styling**  | Tailwind CSS                                | 3.x    |
| **Build**    | Vite                                        | 6.x    |
| **Testes**   | Vitest + React Testing Library              | —      |
| **Desktop**  | Tauri                                       | 2.x    |
| **Backend**  | Rust                                        | 1.70+  |
| **IA Local** | Ollama (opcional)                           | —      |
| **IA Cloud** | OpenAI, Anthropic, Gemini, Groq, OpenRouter | —      |

### Pré-requisitos na Máquina

| Ferramenta    | Versão mínima | Comando de verificação  |
| ------------- | ------------- | ----------------------- |
| **Node.js**   | 18.x          | `node --version`        |
| **npm**       | 9.x           | `npm --version`         |
| **Rust**      | 1.70+         | `rustc --version`       |
| **Tauri CLI** | 2.x           | `cargo tauri --version` |

> **Windows:** Instale o [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) com a carga de trabalho "Desenvolvimento desktop com C++".
>
> **Ollama (opcional):** Apenas necessário para modo offline. [Baixe aqui](https://ollama.com).

---

## 🚀 Guia de Instalação e Execução

### 1. Clone o repositório

```bash
git clone https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN.git
cd PROMETHEUS-BRIDGE-LEARN
```

### 2. Instale as dependências do frontend

```bash
cd interface
npm install
```

### 3. Rode em modo de desenvolvimento

```bash
npm run tauri dev
```

> Na primeira execução, o Cargo baixa e compila as dependências Rust (~2 minutos).
> Após isso, o hot-reload é instantâneo para alterações no frontend.

### 4. Configure a IA (pela interface)

1. Abra as **Configurações** (ícone de engrenagem na sidebar)
2. Escolha o **modo de IA**:
   - **Offline**: usa Ollama local (precisa estar rodando)
   - **Online**: usa um provedor cloud (requer API key)
   - **Manual**: apenas gera o prompt para copiar/colar
3. Se escolheu Online, selecione o provedor e insira sua API key
4. Pronto! Selecione uma persona e gere uma adaptação

### 5. Rode os testes

```bash
# Testes do frontend (Vitest)
npm test

# Testes do backend (Rust)
cd src-tauri && cargo test
```

### 6. Build de produção (opcional)

```bash
npm run tauri build
```

O executável será gerado em `src-tauri/target/release/`.

---

## 🧩 Personas

O PBL vem com **38 personas embutidas** prontas para uso:

### Fictícias (36)

| Persona        | Universo         | Persona           | Universo           |
| -------------- | ---------------- | ----------------- | ------------------ |
| Goku           | Dragon Ball      | Jiraiya Sensei    | Naruto             |
| Kakashi        | Naruto           | Gojo Satoru       | Jujutsu Kaisen     |
| Tanjiro        | Demon Slayer     | Luffy             | One Piece          |
| Batman         | DC Comics        | Superman          | DC Comics          |
| Spider-Man     | Marvel           | Iron Man          | Marvel / MCU       |
| Ezio Auditore  | Assassin's Creed | Kratos            | God of War         |
| Link           | Zelda            | Lara Croft        | Tomb Raider        |
| Mario          | Super Mario      | Luigi             | Super Mario        |
| Steve          | Minecraft        | Jinx              | Arcane/LoL         |
| Ainz Ooal Gown | Overlord         | Albedo            | Overlord           |
| L Lawliet      | Death Note       | Naofumi           | Shield Hero        |
| Raphtalia      | Shield Hero      | Geralt            | The Witcher        |
| Thrall         | World of Warcraft| Vol'jin           | World of Warcraft  |
| Tyrael         | Diablo           | Deckard Cain      | Diablo             |
| Leon Kennedy   | Resident Evil    | Claire Redfield   | Resident Evil      |
| Chris Redfield | Resident Evil    | Rebecca Chambers  | Resident Evil      |
| Tifa Lockhart  | Final Fantasy VII| Aerith            | Final Fantasy VII  |
| Ash Ketchum    | Pokémon          | Tai Kamiya        | Digimon            |

### Reais (2)

| Persona         | Área                               |
| --------------- | ---------------------------------- |
| Albert Einstein | Física / Ciências                  |
| Sérgio Sacani   | Astronomia / Divulgação científica |

> **Quer criar uma persona?** Consulte o template em `personas/templates/template.json` e o guia em `docs/PERSONAS-CATALOGO.md`.

---

## 🤝 Como Contribuir

Contribuições são muito bem-vindas! O PBL é um projeto que depende da comunidade para crescer — especialmente na criação de novas personas.

### Passos rápidos:

1. Faça um **fork** do repositório
2. Crie uma **branch** descritiva (`feat/nova-persona-hermione`)
3. Faça suas alterações seguindo o [guia de contribuição](CONTRIBUTING.md)
4. Use **Conventional Commits** (`feat:`, `fix:`, `docs:`)
5. Abra um **Pull Request** com descrição clara

Consulte o [CONTRIBUTING.md](CONTRIBUTING.md) para instruções detalhadas.

---

## 🗺️ Roadmap

| Fase              | Status       | Descrição                                                                      |
| ----------------- | ------------ | ------------------------------------------------------------------------------ |
| **1. Fundação**   | ✅ Concluída | Nome, estrutura, conceito, decisões arquiteturais                              |
| **2. Core**       | ✅ Concluída | Schema de personas + Jiraiya Sensei (caso validado)                            |
| **3. Interface**  | ✅ Concluída | App Tauri com React, 6 provedores de IA, exportação multi-formato              |
| **4. Qualidade**  | ✅ Concluída | Testes automatizados, segurança (CSP, XSS, path traversal), modularização Rust |
| **5. Expansão**   | 🔜 Próxima   | Mais personas, perfis cognitivos, CI/CD com GitHub Actions                     |
| **6. Comunidade** | 🔮 Futuro    | Validação com psicólogos, guia pedagógico, tema claro/escuro                   |
| **7. Rede**       | 🔮 Futuro    | Integração professor ↔ aluno, código de turma, i18n                            |

---

## ⚖️ Licença

MIT — Use, modifique, distribua. Só não esqueça de dar os créditos.

---

<div align="center">

## 💬 Sobre

### **Marlon Motta**

_Just a human trying to help other humans learn better._
<br>
_Apenas um humano tentando ajudar outros humanos a aprender melhor._

---

**⭐ Se esse projeto faz sentido pra você, dá uma estrela!**
**Ajuda a alcançar mais professores e mais alunos.**

</div>

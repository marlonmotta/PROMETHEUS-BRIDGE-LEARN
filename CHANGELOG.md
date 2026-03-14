# Changelog

Todas as mudanças notáveis do projeto são documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Não lançado]

## [0.2.0] - 2026-03-12

### Adicionado
- **Plataforma Web**: aplicação web completa em React + Vite deployável via Vercel
- **Monorepo**: estrutura com `packages/shared/` unificando lógica entre web e desktop
- **Personas compartilhadas**: `SidebarContent`, `ManagerView`, `SettingsView`, `HistoryView` como componentes shared
- **CSS Design Tokens**: `tokens.css` compartilhado entre web e desktop
- **AppReducer centralizado**: `useReducer` substituindo 15+ `useState` no componente principal
- **Versão dinâmica**: `__APP_VERSION__` injetado via Vite `define` a partir do `package.json`
- **Rate limiting**: cooldown de 3 segundos na chamada à IA (web e Rust)
- **Logging estruturado**: `tauri-plugin-log` com `log::error!` substituindo `eprintln!` (27 chamadas)
- **Exportação PDF**: geração de PDF nativo via `genpdf` com fontes Liberation Sans embutidas
- **Histórico de adaptações**: `HistoryView` com busca, filtros e exportação
- **Script de sincronia de versão**: `scripts/sync-version.mjs` garante paridade entre `package.json` e `tauri.conf.json`
- **CI/CD**: GitHub Actions com lint + typecheck + testes + coverage + `cargo clippy`
- **Coverage report**: `@vitest/coverage-v8` com relatório HTML gerado em PRs
- **Dependabot**: updates automáticos semanais de npm e cargo

### Corrigido
- **Segurança**: `withGlobalTauri` definido como `false` — bridge IPC não exposta globalmente
- **Segurança**: CSP scoped com paths específicos do GitHub (removido `*` permissivo)
- **Segurança**: sanitização do caminho de exportação com `canonicalize()` + deny-list de diretórios de sistema
- **Segurança**: chave API apagada do `sessionStorage` quando tab fica oculta
- **Segurança**: headers de segurança na CDN via `vercel.json` (HSTS, X-Frame-Options, etc.)

### Removido
- Imports React desnecessários (`React.useState` → `useState` desestruturado)
- `console.log` e `eprintln!` de debug em código de produção

---

## [0.1.0] - 2026-03-05

### Adicionado
- Interface desktop Tauri 2 para professores com suporte offline (Ollama)
- Adaptação de conteúdo pedagógico via IA (Gemini, OpenAI, Anthropic, Ollama)
- Gerenciamento de personas (catálogo embutido + importação de arquivo)
- Exportação multi-formato: TXT, HTML, Markdown, DOCX
- Sistema de atualização automática via GitHub Releases
- Armazenamento seguro de chave API via `tauri-plugin-store`
- Catálogo inicial com 160+ personas (ficcionais, históricas, educacionais)

[Não lançado]: https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/releases/tag/v0.1.0

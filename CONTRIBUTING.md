# 🤝 Como Contribuir — P.R.O.M.E.T.H.E.U.S · B.R.I.D.G.E · L.E.A.R.N

> Obrigado pelo interesse em contribuir! Este guia define as regras e boas práticas para manter o projeto organizado, seguro e profissional.

---

## 📜 Código de Conduta

Ao contribuir, você concorda em:

- Manter um ambiente respeitoso e inclusivo
- Seguir a [CONTENT-POLICY.md](CONTENT-POLICY.md) sem exceção
- Proteger alunos menores de idade (ECA, ECA Digital, LGPD)
- Não incluir conteúdo sexual, violento, discriminatório ou político
- Respeitar diversidade cognitiva, cultural e social

> Violações podem resultar em block permanente do repositório.

---

## 🌿 Estratégia de Branches

Este projeto usa **GitHub Flow simplificado**.

### Branches Permanentes

| Branch | Função | Regra |
|--------|--------|-------|
| `main` | Versão estável / produção | ⛔ **NUNCA** commit direto. Apenas via PR mergeada |

### Branches Temporárias

Criar → PR → Review → Merge → **Deletar**

| Prefixo | Quando usar | Exemplo |
|---------|-------------|---------|
| `feat/` | Nova funcionalidade ou conteúdo | `feat/personas-lote-7` |
| `fix/` | Correção de bug ou erro | `fix/geralt-typo-catchphrase` |
| `docs/` | Apenas documentação | `docs/readme-en` |
| `refactor/` | Reestruturação sem funcionalidade nova | `refactor/template-v3` |
| `hotfix/` | Correção urgente (vai direto pra main) | `hotfix/policy-legal-issue` |

### Regras de Branch

```
✅ Nomes em kebab-case: feat/nome-descritivo
✅ Prefixo obrigatório: feat/, fix/, docs/, refactor/, hotfix/
✅ Branches são TEMPORÁRIAS — deletar após merge
❌ Nunca commit direto na main
❌ Nunca deixar branch pendurada sem PR
❌ Nunca reutilizar branch já mergeada
```

---

## 💬 Padrão de Commits — Conventional Commits

Baseado no padrão [Conventional Commits v1.0.0](https://www.conventionalcommits.org/pt-br/).

### Formato

```
<emoji> <tipo>: <descrição curta>

[corpo opcional — detalhes]

[rodapé opcional — referências]
```

### Tipos Aceitos

| Emoji | Tipo | Quando usar | Exemplo |
|-------|------|-------------|---------|
| 🎭 | `feat` | Nova persona ou funcionalidade | `🎭 feat: persona Gandalf (Senhor dos Anéis)` |
| 🐛 | `fix` | Correção de bug ou erro | `🐛 fix: typo no catchphrase do Goku` |
| 📜 | `docs` | Documentação | `📜 docs: CONTENT-POLICY v1.3` |
| 📋 | `chore` | Manutenção, limpeza | `📋 chore: atualizar catálogo e backlog` |
| ♻️ | `refactor` | Reestruturação | `♻️ refactor: template v3 com cognitive_adaptations` |
| 🧪 | `test` | Testes | `🧪 test: validar JSON schema das personas` |
| 🔧 | `ci` | CI/CD, automação | `🔧 ci: GitHub Action de validação de JSON` |
| 🏷️ | `release` | Versão/tag | `🏷️ release: v0.2.0 — 36 personas` |

### Regras de Commit

```
✅ Verbo no imperativo: "adiciona", "corrige", "atualiza"
✅ Primeira linha ≤ 72 caracteres
✅ Emoji no início (opcional mas recomendado)
✅ Tipo obrigatório: feat, fix, docs, chore, refactor, test, ci
✅ Descrição clara e específica
❌ Não usar "várias coisas" ou "ajustes"
❌ Não misturar feat + fix no mesmo commit
```

### Exemplos

```bash
# ✅ BOM
🎭 feat: persona Gandalf (O Senhor dos Anéis, 13+)
📜 docs: CONTENT-POLICY v1.3 — regras de neurodivergência
🐛 fix: campo content_rating faltando no Goku
📋 chore: atualizar backlog com Lote 7

# ❌ RUIM
atualizado  (vago)
fix coisas  (O QUÊ?)
v2          (sem contexto)
```

---

## 🎭 Como Criar uma Persona

### Passo a Passo

```
1. Verificar se a persona NÃO está na blocklist (ver CONTENT-POLICY.md)
2. Escolher da lista no PERSONAS-BACKLOG.md (ou propor nova via Issue)
3. Copiar o template: personas/templates/template.json
4. Preencher TODOS os campos obrigatórios (ver checklist abaixo)
5. Criar branch: git checkout -b feat/persona-nome
6. Commitar: 🎭 feat: persona NomePersona (Universo, classificação)
7. Push: git push origin feat/persona-nome
8. Abrir PR com descrição + labels
9. Aguardar review e aprovação
10. Após merge: deletar branch
```

### Checklist de Persona (obrigatório)

```markdown
- [ ] `meta.content_rating` presente (LIVRE | 10+ | 13+ | 16+)
- [ ] `meta.content_warnings` presente (array, pode ser vazio)
- [ ] `meta.target_age_range` presente (ex: "6-14", "13-18")
- [ ] `system_protections.rules` com TODAS as regras obrigatórias
- [ ] Pelo menos 1 exemplo `before_after` com conteúdo REAL
- [ ] Catchphrases em pt-br
- [ ] Tom de voz coerente com o personagem
- [ ] `forbidden_words` definido
- [ ] Se pessoa real: disclaimer no `system_prompt`
- [ ] NÃO está na blocklist da CONTENT-POLICY
```

---

## 🔀 Pull Requests

### Como Abrir

```bash
# Via CLI (recomendado)
gh pr create \
  --title "🎭 feat: persona Gandalf (LOTR)" \
  --body "Nova persona com classificação 13+. Checklist completo." \
  --label "enhancement"

# Via GitHub (alternativa)
# Acesse: github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/pulls
```

### Descrição da PR (modelo)

```markdown
## O que muda?
- Nova persona: Gandalf (O Senhor dos Anéis)
- Classificação: 13+
- Faixa etária: 11-18

## Checklist
- [x] Persona não está na blocklist
- [x] content_rating presente
- [x] system_protections completo
- [x] Exemplo before_after com conteúdo real
- [x] Catálogo e backlog atualizados

## Labels
enhancement, documentation
```

### Labels Disponíveis

| Label | Uso |
|-------|-----|
| `enhancement` | Nova funcionalidade/persona |
| `documentation` | Docs, catálogo, backlog |
| `bug` | Correção |
| `good first issue` | Fácil pra primeira contribuição |
| `help wanted` | Precisa de ajuda |
| `question` | Dúvida |

### Regras de Review

```
✅ Toda PR precisa de pelo menos 1 aprovação
✅ Verifica se a persona segue a CONTENT-POLICY
✅ Verifica se o JSON é válido (sem erros de sintaxe)
✅ Verifica se o checklist acima está completo
❌ PRs sem descrição serão rejeitadas
❌ PRs com conteúdo na blocklist serão rejeitadas e o autor bloqueado
```

---

## 🏷️ Versionamento — Semantic Versioning

Baseado no [SemVer 2.0.0](https://semver.org/lang/pt-BR/).

### Formato: `vMAJOR.MINOR.PATCH`

| Parte | Quando incrementar | Exemplo |
|-------|-------------------|---------|
| **MAJOR** | Mudança incompatível (ex: novo schema) | v1.0.0 → v2.0.0 |
| **MINOR** | Nova funcionalidade retrocompatível | v0.2.0 → v0.3.0 |
| **PATCH** | Correção de bug ou typo | v0.2.0 → v0.2.1 |

### Como Criar Tag

```bash
git tag -a v0.3.0 -m "🏷️ release: v0.3.0 — descrição do marco"
git push origin v0.3.0
```

---

## 📂 Estrutura do Repositório

```
GIT/
├── CONTENT-POLICY.md        # Regras de conteúdo e classificação
├── CONTRIBUTING.md           # Este arquivo
├── PERSONAS-BACKLOG.md       # Lista de personas planejadas
├── PERSONAS-CATALOGO.md      # Catálogo de personas prontas
├── README.md                 # Apresentação do projeto
├── LICENSE                   # Licença MIT
├── .gitignore                # Arquivos ignorados
└── personas/
    ├── templates/
    │   └── template.json     # Template base v2.0
    ├── fictional/            # Personas de ficção
    └── real/                 # Personas de pessoas reais
```

---

## ❓ Dúvidas?

- Abra uma [Issue](https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/issues) com a label `question`
- Consulte a [CONTENT-POLICY.md](CONTENT-POLICY.md) para regras de conteúdo
- Consulte o [PERSONAS-CATALOGO.md](PERSONAS-CATALOGO.md) para personas existentes
- Consulte o [PERSONAS-BACKLOG.md](PERSONAS-BACKLOG.md) para personas disponíveis

---

> 🛡️ *"Projeto educacional aberto — aberto pra quem quer melhorar a educação, não pra quem quer piorar."*
> — Regras de Contribuição PBL v1.0

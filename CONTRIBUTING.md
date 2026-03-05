# Contribuindo com o PBL

Obrigado por considerar contribuir com o **PROMETHEUS · BRIDGE · LEARN**! 🎓

Este projeto é open source e toda contribuição é bem-vinda — seja corrigindo um bug, sugerindo uma feature, criando uma nova persona ou melhorando a documentação.

---

## Como Contribuir

### 1. Fork e Clone

```bash
# Fork o repositório pelo GitHub e clone localmente
git clone https://github.com/SEU-USUARIO/PROMETHEUS-BRIDGE-LEARN.git
cd PROMETHEUS-BRIDGE-LEARN
```

### 2. Crie uma branch

Use nomes descritivos seguindo o padrão:

```bash
git checkout -b feat/nome-da-feature        # Nova funcionalidade
git checkout -b fix/descricao-do-bug         # Correção de bug
git checkout -b docs/secao-alterada          # Documentação
git checkout -b refactor/area-refatorada     # Refatoração
```

### 3. Faça suas alterações

```bash
# Instale as dependências do frontend
cd interface
npm install

# Rode o projeto em modo de desenvolvimento
npm run tauri dev

# Rode os testes antes de commitar
npm test
```

### 4. Padrão de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/) para manter o histórico legível:

| Prefixo     | Uso                                             |
| ----------- | ----------------------------------------------- |
| `feat:`     | Nova funcionalidade                             |
| `fix:`      | Correção de bug                                 |
| `docs:`     | Alteração em documentação                       |
| `refactor:` | Refatoração sem mudança de comportamento        |
| `test:`     | Adição ou correção de testes                    |
| `chore:`    | Tarefas auxiliares (configs, dependências)      |
| `style:`    | Formatação, espaçamento (sem mudança de lógica) |

**Exemplos:**

```bash
git commit -m "feat: adicionar suporte a exportação PDF"
git commit -m "fix: corrigir cálculo de progresso no UpdateChecker"
git commit -m "docs: atualizar seção de instalação no README"
```

### 5. Abra um Pull Request

- Garanta que `npm test`, `npx tsc -b --noEmit` e `npx eslint src/` passam sem erros
- Descreva claramente o que foi alterado e por quê
- Referencie issues relacionadas (ex: `Closes #42`)

---

## Criando uma Nova Persona

O PBL usa personas em formato JSON padronizado. Para criar uma nova:

1. Copie o template em `personas/templates/`
2. Edite os campos seguindo a especificação em `docs/PERSONAS-CATALOGO.md`
3. Salve o arquivo em `personas/fictional/` ou `personas/real/`
4. Atualize o `personas/manifest.json` com o caminho do novo arquivo
5. Teste importando a persona pela interface do PBL

---

## Estrutura do Código

- **`interface/src/`** — Frontend React + TypeScript
- **`interface/src-tauri/src/`** — Backend Rust (Tauri)
- **`personas/`** — JSONs das personas de IA
- **`docs/`** — Documentação complementar

> **🇧🇷 Idioma:** Toda documentação e comentários no código são em **Português do Brasil (PT-BR)**. A sintaxe de código (variáveis, funções) permanece em inglês.

---

## Código de Conduta

Seja respeitoso, inclusivo e construtivo. Este é um projeto educacional e toda interação deve refletir isso.

---

**Dúvidas?** Abra uma [Issue](https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/issues) no repositório.

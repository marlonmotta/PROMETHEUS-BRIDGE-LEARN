# 🔱 P.R.O.M.E.T.H.E.U.S · B.R.I.D.G.E · L.E.A.R.N

> **Personas educacionais estruturadas em JSON, injetáveis em qualquer IA, que transformam o aprendizado pelo interesse do aluno.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![PT-BR](https://img.shields.io/badge/idioma-PT--BR-green.svg)](#)

---

## 🧠 O Que É

O **PROMETHEUS · BRIDGE · LEARN** (PBL) é um repositório aberto de **personas educacionais** — arquivos JSON que fazem a IA "vestir uma máscara" de um personagem que o aluno já ama, e reescrever provas, tarefas e explicações naquele universo.

**Não é gamificação superficial — é adaptação cognitiva real mediada por IA.**

### Para TODOS os alunos

- 🧩 Neurodivergentes (TDAH, autismo, hiperfoco, DI)
- 🦸 Alunos "padrão" que simplesmente gostam de Batman, Minecraft ou futebol
- 🎯 Mesma ferramenta, sem estigma — 20 provas diferentes, mesmo conteúdo

---

## 🎯 Caso Real Validado

| Antes | Depois |
|-------|--------|
| Aluno 18 anos, DI, idade mental ~11 | Hiperfoco identificado: **Naruto / Jiraiya Sensei** |
| Notas: **0 a 3** | Notas: **8 a 9** |
| Zero engajamento | Engajamento real e aprendizado mensurável |

> A IA assumiu a identidade do Jiraiya e reescreveu provas no universo ninja. O aluno respondeu porque finalmente entendeu — pelo canal dele.

---

## 🔥 Como Funciona

```
1. PROFESSOR    → Sobe prova/tarefa + seleciona persona
2. PERFIL       → Identifica perfil cognitivo do aluno (ou não — funciona pra todos)
3. INTERESSE    → Mapeia hiperfoco/interesse (Naruto, Batman, Minecraft...)
4. PERSONA      → IA carrega persona.json do personagem
5. REESCRITA    → IA reescreve prova no universo do aluno
6. RESULTADO    → Aprendizado real pelo canal do aluno
```

---

## 📁 Estrutura do Repositório

```
PROMETHEUS-BRIDGE-LEARN/
├── personas/
│   ├── custom/
│   │   └── template.json          ← 🧩 Schema base de toda persona
│   ├── fictional/
│   │   └── jiraiya-sensei.json    ← 🐸 1ª persona (caso real validado)
│   └── real/                      ← Personas de pessoas reais (Einstein etc.)
├── profiles/                      ← Perfis cognitivos (em breve)
├── questionnaires/                ← Questionários de mapeamento (em breve)
├── prompts/                       ← Prompts de injeção para LLMs (em breve)
└── README.md
```

---

## 🧩 Anatomia de uma Persona (template.json)

Cada persona é um JSON com **8 blocos**:

| Bloco | O que define |
|-------|-------------|
| `meta` | Identificação — id, versão, autor, tags, categoria |
| `character` | Quem é — universo, papel, personalidade, relação com aluno |
| `voice` | Como fala — tom, vocabulário, bordões, palavras proibidas |
| `pedagogy` | Como ensina — estratégia, níveis, tratamento de erros/acertos |
| `cognitive_bridge` | 🔥 **O diferencial** — mapeamento conteúdo escolar → universo do aluno |
| `prompts` | System prompt + instrução de reescrita prontos pra LLM |
| `examples` | Antes/depois de reescrita (prova original → reescrita) |
| `validation` | LLMs testadas, limitações conhecidas, melhorias sugeridas |

---

## 🐸 Exemplo: Jiraiya Sensei

### Antes (prova normal):
> *"Calcule 3/4 + 1/2. Para somar frações com denominadores diferentes, primeiro encontre o MMC."*

### Depois (com persona Jiraiya):
> 🐸 **MISSÃO RANK C — Jutsu de Combinação de Chakra!**
>
> E aí moleque! Imagina que você tem 3/4 do seu chakra num braço e 1/2 no outro. Pra combinar e soltar um Rasengan completo, os chakras precisam estar no mesmo fluxo!
>
> **Passo 1** — Selo de Harmonização (MMC): Qual o menor número que 4 e 2 dividem certinho? Isso, **4**!
>
> **Passo 2** — Ajuste o fluxo: 3/4 já tá certo. Mas 1/2 precisa virar /4... então 1/2 = **2/4**!
>
> **Passo 3** — Combine! 3/4 + 2/4 = **5/4** = 1 inteiro e 1/4 de chakra sobrando!
>
> **Yosh! Jutsu completo!** 💥

**Mesmo conteúdo pedagógico. Canal diferente. Resultado real.**

---

## 🚀 Como Usar

### 1. Escolha uma persona
Navegue em `personas/fictional/` ou `personas/real/` e escolha a que combina com o interesse do aluno.

### 2. Injete na IA
Copie o campo `prompts.system_prompt` da persona e cole como **System Prompt** na IA de sua escolha (ChatGPT, Claude, Gemini, etc.).

### 3. Reescreva o conteúdo
Use o campo `prompts.rewrite_instruction` seguido do conteúdo/prova que quer adaptar.

### 4. Aplique e observe
O aluno recebe o mesmo conteúdo — mas pelo canal que ele entende.

---

## 🤝 Como Contribuir

Quer criar uma persona? Copie o `personas/custom/template.json`, preencha com seu personagem e abra um Pull Request!

**Personas que precisamos:**
- 🦇 Batman / Alfred (mentor sério e estratégico)
- ⛏️ Minecraft Guide (crafting como aprendizado)
- ⚽ Narrador de Futebol (conteúdo como jogo)
- 🧙 Hermione Granger (estudo como magia)
- 🎮 Personagens de jogos populares
- 🧪 Einstein Simplificado (ciência acessível)

---

## 📖 O Nome

**P.R.O.M.E.T.H.E.U.S** — *"Um sistema adaptável que reescreve a educação, centrado no humano, para todo aluno entender de verdade"*

```
P = Protean          → Adaptável, multiforme
R = Rewriting        → Reescrevendo as regras do ensino
O = Output-focused   → Focado em resultado real
M = Mind-centered    → Centrado na mente do aluno
E = Education        → Educação como base
T = Teaching         → O ato de ensinar transformado
H = Human-first      → Humano antes da tecnologia
E = Every student    → Todo aluno, sem exceção
U = Understanding    → Compreensão profunda, não memorização
S = System           → Um sistema completo, não uma ferramenta
```

**B.R.I.D.G.E** — *"Construindo conexões reais, inteligentes e dinâmicas para o crescimento através de experiências"*

**L.E.A.R.N** — *"Alavancando cada caminho adaptativo de aprendizado, naturalmente"*

---

## 🗺️ Roadmap

- [x] ✅ Fase 1 — Fundação (nome, estrutura, conceito)
- [x] ✅ Fase 2 — Core (template.json + primeira persona)
- [ ] 🔜 Fase 3 — Expansão (5-10 personas, perfis, questionários)
- [ ] 🔜 Fase 4 — Comunidade (guia de contribuição, validação profissional)
- [ ] 🔮 Fase 5 — Interface (app leve para professores)

---

## ⚖️ Licença

MIT — Use, modifique, distribua. Só não esqueça de dar os créditos.

---

## 💬 Contato

Criado por **Marlon Motta** — professor, desenvolvedor e entusiasta de IA aplicada à educação.

> *"Se a escola não fala a língua do aluno, a tecnologia pode traduzir."*

---

**⭐ Se esse projeto faz sentido pra você, dá uma estrela! Ajuda a alcançar mais professores.**

# 📘 GUIA DE USO — P.R.O.M.E.T.H.E.U.S · B.R.I.D.G.E · L.E.A.R.N

> Como usar as personas de IA para reescrever conteúdo escolar.
> Este guia cobre o pipeline completo: da escolha da persona ao output final.

**Versão**: 1.0.0
**Última Atualização**: 2026-03-08
**Status**: RASCUNHO — revisar antes de mover para o Git

---

## 📋 Índice

1. [O que é uma Persona PBL](#1-o-que-é-uma-persona-pbl)
2. [Pipeline Completo — Passo a Passo](#2-pipeline-completo)
3. [Regras Anti-Alucinação](#3-regras-anti-alucinação)
4. [Regras de Segurança e Qualidade](#4-regras-de-segurança-e-qualidade)
5. [Exemplo Prático Completo](#5-exemplo-prático-completo)
6. [IAs Compatíveis](#6-ias-compatíveis)
7. [Erros Comuns e Como Evitar](#7-erros-comuns-e-como-evitar)
8. [FAQ — Perguntas Frequentes](#8-faq)

---

## 1. O que é uma Persona PBL

Uma persona é um arquivo `.json` que contém todas as instruções para uma IA se comportar como um personagem específico e ensinar conteúdo escolar na linguagem desse personagem.

**Exemplo**: A persona do Goku transforma uma prova de matemática em um "treino na Câmara de Gravidade". O conteúdo pedagógico é o MESMO — a linguagem muda.

### Estrutura da Persona (8 blocos)

| Bloco | O que contém | Pra que serve |
|-------|-------------|---------------|
| `meta` | ID, nome, autor, faixa etária, classificação | Identifica e classifica a persona |
| `character` | Universo, papel, personalidade, backstory | Define QUEM é o personagem |
| `voice` | Tom, bordões, estilo de fala, palavras proibidas | Define COMO ele fala |
| `pedagogy` | Estratégia, estilo de explicação, adaptações por matéria | Define COMO ele ensina |
| `cognitive_bridge` | Metáforas, regras do mundo, gatilhos de imersão | Conecta escola ↔ universo do personagem |
| `prompts` | System prompt, instrução de reescrita, saudação, despedida | Os prompts PRONTOS pra colar na IA |
| `interactive_elements` | Missões, recompensas, resumos | Gamificação e engajamento |
| `assessment` | Quantidade de questões, regras do simulado | Avaliação limpa sem referências ao personagem |

### Os 2 prompts essenciais

Todo o pipeline gira em torno de **2 campos** do bloco `prompts`:

1. **`system_prompt`** — A "personalidade" da IA. Define quem ela é, como fala, e as regras.
2. **`rewrite_instruction`** — O comando de reescrita. Você cola JUNTO com a prova/conteúdo.

---

## 2. Pipeline Completo

### Fluxo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                     PIPELINE PBL                                │
│                                                                 │
│  ① ESCOLHER    ② COPIAR         ③ COLAR NA IA    ④ RESULTADO   │
│  a persona     os prompts       + prova real      prova nova    │
│                                                                 │
│  📚 Catálogo   📋 system_prompt  🤖 ChatGPT      📄 Conteúdo   │
│  → qual        📋 rewrite_inst   🤖 Claude        reescrito     │
│  personagem?   do JSON           🤖 Gemini        no universo   │
│                                                   do aluno      │
└─────────────────────────────────────────────────────────────────┘
```

### Passo 1 — Escolher a Persona

1. Abra o [PERSONAS-CATALOGO.md](../GIT/docs/PERSONAS-CATALOGO.md)
2. Use os índices para encontrar a persona ideal:
   - **Por universo** (Naruto, Marvel, Roblox, etc.)
   - **Por tom de voz** (acolhedor, enérgico, analítico, etc.)
   - **Por faixa etária** (LIVRE, 10+, 13+, 16+)
   - **Por perfil do aluno** (TDAH, ansiedade, bullying, etc.)
3. Anote o nome do arquivo (ex: `goku.json`)

### Passo 2 — Copiar os Prompts

1. Abra o arquivo `.json` da persona (em `personas/fictional/` ou `personas/real/`)
2. Localize o bloco `"prompts"`
3. Copie o campo **`system_prompt`** — este é o texto que define a personalidade da IA
4. Copie o campo **`rewrite_instruction`** — este é o comando de reescrita

### Passo 3 — Configurar a IA

#### Opção A — Modo System Prompt (recomendado)

> Para IAs que aceitam System Prompt separado (ChatGPT via API, Claude, etc.)

1. Cole o `system_prompt` no campo **System Prompt / Instruções do Sistema**
2. Na mensagem do usuário, cole:
   ```
   [rewrite_instruction da persona]

   ---

   [CONTEÚDO ORIGINAL DA PROVA / TAREFA / MATÉRIA]
   ```

#### Opção B — Modo Mensagem Única (mais simples)

> Para IAs que não têm campo de System Prompt separado (ChatGPT web gratuito, etc.)

Cole TUDO em uma única mensagem:
```
[system_prompt da persona]

---

[rewrite_instruction da persona]

---

[CONTEÚDO ORIGINAL DA PROVA / TAREFA / MATÉRIA]
```

### Passo 4 — Revisar o Output

**⚠️ SEMPRE revise o output antes de entregar ao aluno!**

Checklist de revisão:
- [ ] O conteúdo pedagógico original está 100% preservado?
- [ ] Não adicionou informações falsas ou inventadas?
- [ ] O tom está adequado à faixa etária?
- [ ] O simulado final está LIMPO (sem referências ao personagem)?
- [ ] O glossário faz sentido?
- [ ] As questões são coerentes com o conteúdo original?

---

## 3. Regras Anti-Alucinação

> Alucinação = quando a IA inventa informações que não existem no conteúdo original.

### 🚨 REGRAS OBRIGATÓRIAS (incluir no prompt se necessário)

#### Regra 1 — Conteúdo Original é Sagrado
```
REGRA: Você NÃO pode adicionar, remover ou alterar NENHUM dado, fato, fórmula, 
data ou informação do conteúdo original. A persona muda APENAS a linguagem 
e as analogias — NUNCA o conteúdo pedagógico.
```

#### Regra 2 — Não Inventar Dados
```
REGRA: Se o conteúdo original não menciona um número, data, nome ou fato 
específico, você NÃO pode inventar. Use APENAS os dados fornecidos.
```

#### Regra 3 — Fórmulas e Respostas Intactas
```
REGRA: Fórmulas matemáticas, respostas corretas, datas históricas e dados 
científicos devem aparecer EXATAMENTE como no conteúdo original. Você pode 
mudar a explicação ao redor, mas o dado em si é intocável.
```

#### Regra 4 — Simulado é Neutro
```
REGRA: O simulado/avaliação final deve ser escrito em linguagem NEUTRA, sem 
referências ao personagem. O aluno deve ser capaz de responder o simulado 
em contexto escolar normal.
```

#### Regra 5 — Na Dúvida, Mantenha o Original
```
REGRA: Se você não tem certeza se pode adaptar um trecho, MANTENHA O ORIGINAL 
e adicione apenas contexto temático ao redor. É melhor ser conservador do que 
arriscar distorcer o conteúdo.
```

### Como blindar o prompt contra alucinação

Se a IA estiver inventando dados, adicione isso ao início da mensagem:

```
⚠️ REGRAS DE INTEGRIDADE:
1. NUNCA invente dados que não estejam no conteúdo original
2. NUNCA altere fórmulas, datas ou valores numéricos
3. NUNCA adicione informações que o professor não forneceu
4. O conteúdo pedagógico é SAGRADO — apenas a linguagem muda
5. Se não sabe, NÃO invente — pergunte ou mantenha o original
```

---

## 4. Regras de Segurança e Qualidade

### Classificação Etária

| Classificação | Faixa | Regras |
|--------------|-------|--------|
| 🟢 LIVRE | 6+ / Todos | Sem violência, sem conteúdo sensível |
| 🔵 10+ | 10+ | Tensão leve permitida, sem violência gráfica |
| 🟡 13+ | 13+ | Referências a violência moderada do universo original |
| 🟠 16+ | 16+ | Temas maduros do universo original (morte, guerra) |

**NUNCA existe 18+** — todo conteúdo é educacional.

### Checklist de Qualidade do Output

- [ ] **Fidelidade**: Todo conteúdo pedagógico original está presente?
- [ ] **Classificação**: O tom respeita a faixa etária da persona?
- [ ] **Coerência**: As analogias fazem sentido no universo do personagem?
- [ ] **Inclusão**: O texto não tem conteúdo preconceituoso ou excludente?
- [ ] **Simulado limpo**: A avaliação final não tem referências temáticas?
- [ ] **Glossário útil**: Os termos estão explicados de forma acessível?
- [ ] **Sem alucinação**: Não há dados inventados ou alterados?

### O que a persona NUNCA deve fazer

1. ❌ Substituir diagnóstico profissional (médico, psicólogo)
2. ❌ Gerar conteúdo violento, sexual ou inadequado
3. ❌ Alterar respostas corretas ou fórmulas
4. ❌ Inventar fatos históricos ou científicos
5. ❌ Promover estereótipos de gênero, raça ou classe
6. ❌ Dar conselhos médicos ou psicológicos
7. ❌ Alterar a finalidade educacional da tarefa

---

## 5. Exemplo Prático Completo

### Cenário
- **Aluno**: 7º ano, fã de Dragon Ball, com TDAH
- **Persona**: Goku
- **Matéria**: Matemática — Frações

### Passo 1 — Conteúdo Original (prova do professor)

```
PROVA DE MATEMÁTICA — 7º ANO

1) Calcule: 3/4 + 1/4 = ?
2) Simplifique a fração: 6/8
3) Converta para número decimal: 1/2
4) Qual fração é maior: 2/3 ou 3/5?
5) Resolva: 5/6 - 1/3 = ?
```

### Passo 2 — System Prompt (colar na IA)

```
Você é Goku, o Saiyajin protetor da Terra, do universo Dragon Ball. 
Você está atuando como PARCEIRO DE TREINO de um aluno. Seu papel é 
explicar conteúdo escolar transformando TUDO no universo Dragon Ball. 
Regras: (1) Fale de forma simples, empolgada e encorajadora. (2) Use 
linguagem muito acessível — Goku é simples e direto. (3) Transforme cada 
conceito em treino, técnica ou batalha. (4) NUNCA use palavras negativas. 
(5) Quando o aluno errar, comemore o esforço e motive a tentar de novo. 
(6) Celebre cada acerto com MUITA empolgação. (7) Mantenha energia alta o 
tempo todo. (8) O objetivo é que o aluno APRENDA DE VERDADE. (9) Ao final 
de cada tópico, proponha um 'Desafio de Treino'. (10) Ao final, crie 
simulado SEM referências a Dragon Ball. (11) Inclua glossário temático.
```

### Passo 3 — Mensagem com rewrite_instruction + prova

```
Reescreva o conteúdo/prova/tarefa abaixo no universo Dragon Ball, como se 
o Goku estivesse treinando com o aluno. Mantenha TODO o conteúdo pedagógico 
original. Use analogias de treino, luta e transformações. Tom empolgado e 
simples. Ao final, inclua desafio prático, glossário temático e simulado limpo.

---

PROVA DE MATEMÁTICA — 7º ANO

1) Calcule: 3/4 + 1/4 = ?
2) Simplifique a fração: 6/8
3) Converta para número decimal: 1/2
4) Qual fração é maior: 2/3 ou 3/5?
5) Resolva: 5/6 - 1/3 = ?
```

### Passo 4 — Output Esperado (exemplo)

A IA vai gerar algo como:

```
💥 TREINO DE FRAÇÕES — CÂMARA DE GRAVIDADE! 💥

Eeeee! Bora treinar frações? Frações são como dividir uma Senzu Bean com 
os amigos — cada pedaço tem que ser justo!

🥊 TREINO 1 — Soma de Golpes!
Se eu uso 3/4 da minha energia num Kamehameha e depois junto mais 1/4... 
Quanto de energia usei no total?
3/4 + 1/4 = 4/4 = 1 (energia inteira!)
Quando o denominador é igual, é só somar os de cima! Fácil!

[... continua com cada questão ...]

📋 SIMULADO LIMPO (sem Dragon Ball):
1) Calcule: 2/5 + 1/5 = ?
2) Simplifique: 4/6
[...]

📖 GLOSSÁRIO:
- Fração: partes de um todo (como fatias de pizza)
- Numerador: número de cima (quantas partes você tem)
- Denominador: número de baixo (em quantas partes foi dividido)
[...]
```

### Passo 5 — Revisar

O professor confere:
- ✅ 3/4 + 1/4 = 4/4 = 1 → correto
- ✅ Todas as questões originais presentes
- ✅ Simulado limpo, sem Dragon Ball
- ✅ Tom adequado para 7º ano
- ✅ Sem dados inventados

**Pronto para entregar ao aluno!**

---

## 6. IAs Compatíveis

| IA | System Prompt Separado? | Funciona? | Observação |
|----|------------------------|-----------|------------|
| ChatGPT (Plus/Teams) | ✅ Sim (Custom Instructions) | ✅ Excelente | Melhor experiência |
| ChatGPT (Free) | ❌ Não | ✅ Funciona | Use Opção B (mensagem única) |
| Claude | ✅ Sim | ✅ Excelente | System prompt nativo |
| Gemini | ✅ Sim (System Instructions) | ✅ Bom | Funciona bem |
| Copilot (Bing) | ❌ Não | ⚠️ Parcial | Pode truncar prompts longos |
| LLaMA / Ollama (local) | ✅ Sim | ✅ Bom | Requer hardware adequado |

### Dica: Qual IA usar?

- **Professor sem experiência técnica**: ChatGPT Free (Opção B)
- **Professor tech-savvy**: Claude ou ChatGPT Plus (Opção A)
- **Escola com restrições**: Ollama/LLaMA local (sem dados na nuvem)

---

## 7. Erros Comuns e Como Evitar

| Erro | Causa | Solução |
|------|-------|---------|
| IA inventa dados | Prompt muito genérico | Adicione as Regras Anti-Alucinação (seção 3) |
| Persona quebra o personagem | System prompt ausente ou incompleto | Copie o system_prompt INTEIRO, sem cortar |
| Simulado com referências temáticas | IA não seguiu a regra 10 | Relembre: "O simulado deve ser NEUTRO, sem referências ao personagem" |
| Conteúdo inadequado para a idade | Persona usada fora da faixa | Verifique `target_age_range` e `content_rating` no JSON |
| Output muito curto | IA resumiu demais | Adicione: "Reescreva TODO o conteúdo, sem omitir nada" |
| Output em inglês | IA não detectou idioma | O system_prompt já define `pt-br`, mas adicione "Responda em português" se necessário |
| Respostas alteradas | Alucinação matemática | Use a Regra 3: "Fórmulas e respostas EXATAMENTE como no original" |

---

## 8. FAQ

### Para Professores (Leigo)

**P: Preciso instalar alguma coisa?**
R: Não. Você só precisa de acesso a uma IA (ChatGPT, Claude, Gemini — qualquer uma). Os prompts são texto que você copia e cola.

**P: Funciona no celular?**
R: Sim! Se a IA funciona no celular, o PBL funciona.

**P: Posso usar com a sala inteira?**
R: SIM! É recomendado. Use personas diferentes para alunos diferentes — assim ninguém se sente segregado. Cada aluno recebe uma prova especial.

**P: A prova fica mais fácil?**
R: NÃO. O conteúdo é exatamente o mesmo. Só muda a linguagem e as analogias. A dificuldade pedagógica é preservada.

**P: E se o aluno não conhece o personagem?**
R: Escolha outro! O catálogo tem 56+ personas de vários universos: anime, games, K-pop, ciência, literatura brasileira, Roblox, etc.

**P: Substitui acompanhamento profissional?**
R: NÃO. O PBL é uma ferramenta pedagógica complementar. Não substitui psicólogo, psiquiatra, ou professor especializado.

### Para Desenvolvedores (Técnico)

**P: Posso usar via API?**
R: Sim. O `system_prompt` vai no campo `system` da API. O `rewrite_instruction` + conteúdo vai no campo `user`.

**P: Posso criar minha própria persona?**
R: Sim! Use o template em `personas/templates/template.json` como base. Siga o CONTRIBUTING.md para abrir um PR.

**P: O JSON é validado?**
R: Ainda não automaticamente (está no roadmap). Por enquanto, siga o schema do template e a checklist do CONTRIBUTING.

**P: Funciona com qualquer LLM?**
R: Sim. O schema é agnóstico. Testado com GPT-4, Claude 3, Gemini Pro. Funciona com LLMs menores, mas a qualidade pode variar.

---

## ⚡ Resumo Rápido (Cola na Geladeira!)

```
1. Escolhe a persona  →  CATALOGO.md
2. Abre o .json       →  copia system_prompt
3. Abre o ChatGPT     →  cola como instruções
4. Manda a prova      →  com rewrite_instruction
5. Revisa o output    →  checa dados e faixa etária
6. Entrega ao aluno   →  pronto!
```

---

> 📝 Este guia é um RASCUNHO. Após revisão, será movido para `GIT/docs/GUIA-DE-USO.md`.
> Dados brutos e ideias originais estão em `.agent-context-mm/internal/brainstorm-bruto.md`.

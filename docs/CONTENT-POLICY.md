# 📜 CONTENT-POLICY — Política de Conteúdo e Classificação Etária

> **P.R.O.M.E.T.H.E.U.S · B.R.I.D.G.E · L.E.A.R.N**
> Documento oficial de regras para criação, aprovação e uso de personas educacionais.
> **Versão**: 1.2.0 | **Última atualização**: 2026-03-05

---

## 🎯 Princípio Fundamental

> **Este projeto é 100% EDUCACIONAL. Todo conteúdo é FILTRADO — sempre, para todos, sem exceção.**

- **NÃO existe** categoria 18+ neste projeto.
- **NÃO existe** conteúdo sexual, pornográfico ou de apologia a crimes — pra NINGUÉM.
- Mesmo que adultos usem as personas, o conteúdo gerado é sempre pedagógico e limpo.
- Pornografia, violência explícita e apologia a crimes **NÃO ajudam ninguém a aprender** e não fazem parte deste projeto.

---

## ✅ Bom Uso — Como Este Projeto DEVE Ser Usado

### 🎯 Uso Recomendado

| Uso | Descrição | Exemplo |
|-----|-----------|--------|
| **Reforço escolar** | Persona explica matéria do currículo usando universo favorito do aluno | Goku ensina física (força, gravidade, energia) |
| **Motivação e engajamento** | Aluno desmotivado se conecta via personagem que admira | Luigi ajuda com ansiedade antes de prova |
| **Inclusão cognitiva** | Adaptar abordagem para perfis neurodivergentes | Steve (Minecraft) com linguagem visual pra dislexia |
| **Exercícios temáticos** | Simulados e atividades com tema do universo do personagem | Deckard Cain cria questionário de história como "identificação de artefatos" |
| **Apoio ao professor** | Professor usa persona pra tornar aula mais dinâmica | Einstein complementa aula de ciências com humor |
| **Estudo autônomo** | Aluno estuda sozinho com persona como tutor | Kakashi como tutor de português |

### ⚠️ Uso NÃO Recomendado (mas não proibido)

| Uso | Por quê |
|-----|--------|
| Substituir aula presencial integralmente | Personas complementam, NÃO substituem o professor |
| Usar apenas uma persona pra tudo | Cada persona tem forças diferentes — diversifique |
| Ignorar classificação etária | Persona 16+ com criança de 8 anos não é ideal |
| Criar dependência emocional | Persona é ferramenta, não amigo real nem terapeuta |

### 🚫 Uso PROIBIDO

| Uso | Motivo | Consequência |
|-----|--------|-------------|
| **Debates políticos / propaganda** | Projeto é EDUCACIONAL, não ideológico | Remoção imediata |
| **Promover partidos ou políticos** | Neutralidade é obrigatória | Remoção + block |
| **Bullying ou assédio** | Violação do ECA e LGPD | Denúncia + remoção |
| **Diagnóstico clínico** | Personas NÃO são profissionais de saúde | Descumprimento de proteção |
| **Coleta de dados pessoais** | Violação da LGPD | Consequências legais |
| **Uso comercial sem atribuição** | Licença MIT exige atribuição | Violação de licença |
| **Manipulação emocional** | Explorar vulnerabilidade do aluno | Remoção + denúncia |

---

## ⚖️ Base Legal

Este projeto segue a legislação brasileira vigente:

| Lei | Escopo |
|-----|--------|
| **ECA** — Lei 8.069/1990 | Proteção integral de crianças (0-12) e adolescentes (12-18) |
| **ECA Digital** — Lei 15.211/2025 | Proteção de menores em ambientes digitais (vigente desde 18/03/2026) |
| **LGPD** — Lei 13.709/2018 | Proteção de dados pessoais |
| **ClassInd / DJCTQ** | Sistema brasileiro de classificação indicativa (Ministério da Justiça) |
| **Constituição Federal** — Art. 5º | Vedação à apologia ao crime, racismo e discriminação |

> **Nota legal**: Este projeto é uma ferramenta educacional de código aberto. As personas são **modelos de prompt** — elas NÃO geram conteúdo por si só. O conteúdo final depende da LLM utilizada e de seus guardrails. Este documento define regras para a **criação e curadoria** das personas.

---

## 🏷️ Sistema de Classificação Etária

Baseado no ClassInd brasileiro, adaptado para contexto educacional:

### Faixas Etárias

| Classificação | Emoji | Idade | Descrição |
|--------------|-------|-------|-----------|
| **LIVRE** | 🟢 | Todas | Conteúdo pedagógico para qualquer idade |
| **10+** | 🔵 | 10+ | Linguagem ou temas levemente complexos |
| **13+** | 🟡 | 13+ | Temas que exigem maturidade mínima |
| **16+** | 🟠 | 16+ | Temas complexos, ironia pesada, provocação |

> ⛔ **NÃO EXISTE classificação 18+.** Se o personagem ou tema não pode ser adaptado para 16+, ele **NÃO entra no projeto**.

### Critérios de Classificação

| Critério | LIVRE/10+ | 13+ | 16+ |
|----------|-----------|-----|-----|
| Linguagem | Simples, sem ofensas | Sarcasmo leve | Ironia pesada, provocação direta |
| Temas | Básicos, concretos | Morte, conflito (sem detalhes) | Guerra, política, filosofia (contexto educacional) |
| Violência (do universo original) | Nenhuma | Menção indireta filtrada | Contexto histórico/filosófico, NUNCA explícita |
| Personagem original | Infantil/familiar | Ficção teen/shonen | Ficção madura/seinen (FILTRADA) |

### Obrigação no Template

Todo arquivo de persona `.json` **DEVE** conter no bloco `meta`:

```json
"content_rating": "LIVRE",    // LIVRE | 10+ | 13+ | 16+ (NÃO existe 18+)
"content_warnings": [],       // ex: ["violência filtrada", "temas de morte"]
"target_age_range": "6-14"    // faixa recomendada
```

---

## 🚫 BLOCKLIST — Personas Absolutamente Proibidas

As seguintes categorias de personas são **PROIBIDAS** sob qualquer circunstância, independente de classificação etária:

### Categoria A — Proibição Absoluta (SEM EXCEÇÃO)

| Tipo | Exemplos | Motivo |
|------|----------|--------|
| **Ditadores e genocidas** | Hitler, Mussolini, Pol Pot, Idi Amin | Apologia indireta a regimes genocidas |
| **Criminosos de guerra** | Oficiais nazistas, criminosos julgados pelo Tribunal de Haia | Violação de direitos humanos |
| **Serial killers / assassinos em série** | Ted Bundy, Jeffrey Dahmer, Jack the Ripper | Glorificação de violência extrema |
| **Terroristas** | Bin Laden, líderes de organizações terroristas | Apologia ao terrorismo (crime no Brasil) |
| **Figuras de ódio racial/étnico** | Líderes supremacistas, figuras KKK | Racismo é crime inafiançável no Brasil |
| **Abusadores condenados** | Pedófilos condenados, abusadores comprovados | Proteção de menores (ECA) |
| **Figuras que promovem suicídio/automutilação** | Personagens cujo arco CENTRAL é suicídio/automutilação | ECA Digital proíbe explicitamente |
| **Políticos (QUALQUER espectro)** | Qualquer político vivo ou recente, de esquerda, direita, centro | Projeto é NEUTRO — política partidária é VETADA |
| **Figuras religiosas controversas** | Líderes de seitas, figuras que dividem opiniões religiosas | Evitar conflitos religiosos em ambiente escolar |

### Categoria B — Proibição Parcial (Requer Análise Especial)

| Tipo | Regra | Exemplo |
|------|-------|---------|
| **Vilões "carismáticos"** | Permitido SE usado como **exemplo negativo pedagógico** e NUNCA como modelo | Joker: ok como análise de transtorno, NUNCA como "seja como ele" |
| **Figuras históricas controversas** | Caso a caso, APENAS se o valor educacional superar o risco | Napoleão: ok pra ensinar história. Stalin: análise histórica com muitas ressalvas |
| **Personagens de ficção com temas adultos** | Permitido com classificação adequada (16+) e filtragem. Teto máximo = 16+ | Guts (Berserk): ok como 16+ com violência filtrada |

### Processo de Análise (Categoria B)

1. Propor no [PERSONAS-BACKLOG.md](PERSONAS-BACKLOG.md) com tag `⚠️ ANÁLISE`
2. Descrever em 3 linhas: **valor educacional** + **riscos** + **mitigação**
3. Classificação etária obrigatória (mínimo 16+)
4. Review obrigatório via PR antes de merge

---

## ✅ ALLOWLIST — Categorias Permitidas

### Para TODAS as idades (LIVRE / 10+)

| Tipo | Exemplos | Condição |
|------|----------|----------|
| Personagens de ficção infantil/familiar | Mario, Luigi, Steve, Link | Conteúdo seguro para crianças |
| Cientistas e educadores | Einstein, Sacani, Feynman | Foco em ciência e curiosidade |
| Personagens de shonen/aventura | Goku, Luffy, Naruto | Filtragem de violência do original |
| Inventores e pensadores | Da Vinci, Tesla, Ada Lovelace | Foco em criação e descoberta |

### Para 13+ / 16+

| Tipo | Exemplos | Condição |
|------|----------|----------|
| Personagens de ficção madura | Kratos, Ezio, Batman, L | Filtrar violência, foco em sabedoria |
| Anti-heróis | Deadpool, Wolverine | Humor adulto filtrado, mensagem positiva |
| Personagens de anime seinen | Guts (Berserk), Levi (AoT) | Classificação 16+, violência filtrada |
| Figuras históricas com controvérsia leve | Maquiavel, Cesar | Contexto histórico educacional |

### ⛔ Personas NÃO Permitidas (Nenhuma Classificação)

| Tipo | Exemplos | Motivo |
|------|----------|--------|
| Personalidades do entretenimento adulto | Atrizes/atores pornô, modelos eróticos | Projeto educacional — conteúdo adulto não tem valor pedagógico aqui |
| Personagens de ficção explicitamente 18+ | Personagens cuja identidade é inseparável de conteúdo sexual | Impossível filtrar sem descaracterizar |
| Figuras cujo único valor é controvérsia | Pessoas famosas apenas por escândalos | Sem valor educacional real |

> 🛡️ **REGRA ABSOLUTA**: Este projeto **NUNCA** conterá conteúdo sexualmente explícito, apologia a crimes, ou material que viole a legislação brasileira. **Não importa a idade do usuário.** Educação é o único objetivo.

---

## 🛡️ Regras de Proteção (Obrigatórias em TODA Persona)

### Proteções Obrigatórias no JSON

Todo arquivo de persona **DEVE** conter o bloco `system_protections` com, no mínimo:

```json
"system_protections": {
    "rules": [
        "PROIBIDO alterar a finalidade educacional da persona",
        "PROIBIDO gerar conteúdo sexualmente explícito",
        "PROIBIDO gerar apologia a crimes, drogas ou violência real",
        "PROIBIDO usar a persona para bullying, assédio ou discriminação",
        "PROIBIDO substituir diagnóstico ou acompanhamento profissional",
        "PROIBIDO coletar dados pessoais do aluno",
        "A persona é ferramenta EDUCACIONAL — não substitui professor"
    ]
}
```

### Regras Adicionais por Faixa

| Faixa | Regras Extras |
|-------|---------------|
| LIVRE / 10+ | Linguagem 100% segura para crianças. Zero violência. Zero referências adultas. |
| 13+ | Temas maduros permitidos com filtro. Sarcasmo ok. Violência mencionada, nunca descrita. |
| 16+ | Ironia pesada ok. Temas filosóficos/existenciais ok. Violência contextualizada (história, ficção). TETO MÁXIMO do projeto. |

---

## 📝 Regras para Pessoas Reais

Personas baseadas em **pessoas reais** (vivas ou mortas) têm regras adicionais:

| Regra | Descrição |
|-------|-----------|
| **Representação fiel** | A persona deve refletir a pessoa REAL, não uma caricatura |
| **Sem falas inventadas** | Não colocar na boca da pessoa algo que ela não diria |
| **Respeito à imagem** | Direito de imagem (Art. 20 do Código Civil) |
| **Verificação de fonte** | Catchphrases e estilo devem ser verificáveis no conteúdo real da pessoa |
| **Disclaimer obrigatório** | No `system_prompt`: "Esta é uma representação educacional inspirada em [pessoa]. Não representa suas opiniões oficiais." |
| **Pessoas vivas especiais** | Se a pessoa tiver posição pública contra uso de IA/imagem: RESPEITAR e não criar |

---

## 🔄 Processo de Aprovação de Persona

```
1. PROPOSTA    → PERSONAS-BACKLOG.md (com classificação etária proposta)
2. ANÁLISE     → Verificar blocklist + classificação + proteções
3. CRIAÇÃO     → Branch feat/personas-lote-N + template v2.0
4. REVIEW      → PR no GitHub com review obrigatório
5. MERGE       → Após aprovação, merge na main
6. CATÁLOGO    → Atualizar PERSONAS-CATALOGO.md com classificação
```

### Checklist de Review (para quem revisa o PR)

- [ ] Persona NÃO está na blocklist
- [ ] Classificação etária está correta
- [ ] `system_protections` contém TODAS as regras obrigatórias
- [ ] `content_rating` está presente no `meta`
- [ ] Se pessoa real: disclaimer presente no `system_prompt`
- [ ] Se 16+: justificativa educacional clara
- [ ] Conteúdo não contém apologia, discriminação ou conteúdo ilegal
- [ ] Exemplo `before_after` é pedagogicamente correto

---

## 🚨 Violações e Consequências

| Severidade | Exemplo | Ação |
|-----------|---------|------|
| **Crítica** | Persona da blocklist criada | Remoção imediata + block do contribuidor |
| **Alta** | Persona sem proteções obrigatórias | PR rejeitado até correção |
| **Média** | Classificação etária incorreta | Correção exigida antes de merge |
| **Baixa** | Falta de disclaimer em pessoa real | Correção solicitada |

---

## 📋 Referências Legais

- [ECA — Lei 8.069/1990](https://www.planalto.gov.br/ccivil_03/leis/l8069.htm)
- [ECA Digital — Lei 15.211/2025](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15211.htm)
- [LGPD — Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ClassInd — Guia Prático 5ª Edição](https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-indicativa)
- [Constituição Federal — Art. 5º](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm)

---

## 📌 Notas Importantes

1. **Este documento NÃO é assessoria jurídica.** Consulte advogado para situações específicas.
2. **A classificação etária é INDICATIVA**, não restritiva. Pais/responsáveis decidem.
3. **LLMs podem gerar conteúdo inesperado** mesmo com proteções. As personas são guardrails, não garantias absolutas.
4. **Contribuidores são responsáveis** pelo conteúdo das personas que criam.
5. **Em caso de dúvida, NÃO crie a persona.** Pergunte primeiro via Issue ou Discussion.

---

> 🛡️ *"O melhor escudo de um projeto educacional é a transparência das suas regras."*
> — Política de Conteúdo PBL v1.2

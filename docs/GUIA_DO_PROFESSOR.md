# 📖 Guia do Professor — PROMETHEUS · BRIDGE · LEARN (PBL)

> **Para quem é este guia?**
> Para professores que vão usar o PBL pela primeira vez. Sem termos técnicos.

---

## O que o PBL faz?

O PBL transforma o conteúdo da sua aula (prova, resumo, exercícios) em uma versão personalizada para cada aluno — usando o universo que o aluno ama.

**Exemplo real:**
- Você escreve: *"Calcule 3/4 + 1/2"*
- O PBL reescreve como: *"Ninja, você tem 3/4 do chakra num braço e 1/2 no outro. Para soltar o Rasengan, combine os dois..."*

O conteúdo pedagógico é idêntico. Só o canal muda.

---

## Versões disponíveis

| Versão | Como usar | Para quem |
|---|---|---|
| **App Desktop** | Baixar e instalar no computador | Professores que precisam de modo offline (Ollama) ou importar documentos |
| **App Web** | Acessar pelo navegador em [URL do projeto] | Professores que preferem não instalar nada |

Ambas as versões têm as mesmas funcionalidades básicas. O app desktop tem recursos extras de importação de arquivo.

---

## 1. Configuração inicial (só na primeira vez)

### Escolhendo o modo de IA

Acesse **Configurações** (ícone de engrenagem) e escolha:

| Modo | Quando usar | O que precisa |
|---|---|---|
| **Online (recomendado)** | Quando tem internet | Chave de API de um provedor |
| **Offline** | Sem internet | App desktop + Ollama instalado |
| **Manual** | Só quer o prompt pronto | Nada — copia e cola onde quiser |

### Como conseguir uma chave de API (modo online)

Você precisa criar uma conta em um dos provedores e gerar uma chave de acesso (API key):

| Provedor | Nível gratuito? | Link |
|---|---|---|
| **OpenAI** (GPT-4) | Não (pago) | [platform.openai.com](https://platform.openai.com) |
| **Groq** ⭐ (recomendado) | **Sim — grátis** | [console.groq.com](https://console.groq.com) |
| **Gemini** | Sim (limitado) | [aistudio.google.com](https://aistudio.google.com) |
| **OpenRouter** | Sim (crédito grátis) | [openrouter.ai](https://openrouter.ai) |
| **Anthropic** (Claude) | Não (pago) | [console.anthropic.com](https://console.anthropic.com) |

> 💡 **Recomendação para começar:** Use o **Groq** — é gratuito, rápido e não exige cartão de crédito.

### Inserindo a chave de API

1. Vá em **Configurações**
2. Selecione o modo **Online**
3. Escolha o **provedor** (ex: Groq)
4. Cole sua **chave de API** no campo correspondente
5. Escolha um **modelo** (deixe em branco para usar o padrão)

> ⚠️ **Segurança:** A chave fica salva no seu computador (app desktop) ou apenas enquanto a aba estiver aberta (versão web). Nunca compartilhe sua chave com ninguém.

---

## 2. Usando o PBL (fluxo principal)

### Passo 1 — Escolher a persona

Na tela inicial, você verá o catálogo de personas. Cada persona é um personagem ou figura que a IA vai "encarnar" para reescrever seu conteúdo.

**Dica:** Use a busca para encontrar personas pelo nome do universo (ex: "naruto", "minecraft", "batman").

**Como escolher a persona certa?**
- Considere o que o aluno ama, não o que você prefere
- Uma persona de Minecraft funciona para qualquer conteúdo — não só matemática
- As personas "reais" (Einstein, Sérgio Sacani) são ótimas para ciências

### Passo 2 — Inserir o conteúdo

Na tela **Conteúdo**, cole ou escreva o texto que quer adaptar (prova, explicação, exercício).

**Formatos aceitos:**
- **App Desktop:** você pode importar um arquivo diretamente (.txt, .docx, .pdf, .md, .odt)
- **App Web:** cole o texto no campo de texto

> ⚠️ **PDFs escaneados (foto de papel):** O PBL não consegue ler PDFs gerados por scanner. Nesses casos, abra o PDF no Word ou LibreOffice e salve como .docx, depois importe.

### Passo 3 — Escolher disciplina e dificuldade

- **Disciplina:** selecione a matéria do conteúdo (isso ajuda a IA a usar exemplos certos)
- **Dificuldade:**
  - Rank D (Simples): linguagem muito acessível, exemplos básicos
  - Rank B (Moderado): equilibrado, padrão recomendado
  - Rank S (Avançado): vocabulário mais rico, conceitos aprofundados

### Passo 4 — Gerar

Clique em **Gerar**. A IA vai processar e exibir o resultado adaptado.

> ⏱️ Aguarde alguns segundos. Se nada aparecer após 30 segundos, verifique sua conexão ou a chave de API.

### Passo 5 — Exportar

Com o resultado na tela, clique em **Exportar** e escolha o formato:

| Formato | Para que serve |
|---|---|
| **DOCX** | Editar no Word antes de imprimir |
| **PDF** | Imprimir direto |
| **TXT** | Copiar texto simples |
| **MD** | Uso técnico (Markdown) |

---

## 3. Formatos de saída

Antes de gerar, você pode escolher o **formato do resultado**:

| Formato | O que a IA vai gerar |
|---|---|
| **Livre (padrão)** | A IA decide a estrutura — ideal para textos gerais |
| **Prova formatada** | Com questões numeradas, espaços para resposta |
| **Resumo** | Versão compacta e objetiva do conteúdo |
| **Lista de exercícios** | Série de perguntas ou problemas |
| **Plano de aula** | Estrutura completa de uma aula (objetivo, desenvolvimento, avaliação) |

---

## 4. Histórico

Toda adaptação gerada fica salva no **Histórico** (ícone de relógio na lateral).

- Você pode revisitar resultados anteriores
- O histórico guarda as últimas **20 adaptações**
- Adaptações antigas são removidas automaticamente quando o limite é atingido

---

## 5. Favoritos

Clique no ícone ⭐ ao lado de uma persona para favoritá-la. Os favoritos aparecem primeiro no catálogo.

---

## 6. Catálogo de Personas — Atualizar

O PBL adicionamos novas personas regularmente. Para baixar as mais recentes:

- **App Desktop:** Menu → "Atualizar personas"
- **App Web:** Botão "Atualizar catálogo" no topo da tela de personas

---

## 7. Modo Offline (App Desktop + Ollama)

O modo offline permite usar o PBL sem internet, com um modelo de IA rodando no seu computador.

**Pré-requisitos:**
1. Baixar e instalar o [Ollama](https://ollama.com)
2. Baixar um modelo: abra o terminal e execute:
   ```
   ollama pull llama3
   ```
3. No PBL: Configurações → Modo → **Offline**

> 💡 Os resultados offline são bons mas geralmente inferiores aos modelos cloud. Recomendado apenas quando não há internet disponível.

---

## 8. Problemas frequentes

| Problema | Causa provável | Solução |
|---|---|---|
| "Aguarde X segundos antes de gerar novamente" | Rate limit ativo | Espere o tempo indicado e tente novamente |
| "Provedor desconhecido" | Provedor não configurado | Verifique Configurações → Provedor |
| "Não foi possível extrair texto do PDF" | PDF escaneado (imagem) | Converta para .docx no Word/LibreOffice |
| Resultado em inglês | Idioma de saída configurado como "Inglês" | Configurações → Idioma de saída → Português (BR) |
| Personas não atualizam | Cache de 24h ativo | Clique em "Atualizar catálogo" |
| Botão "Gerar" sem resposta | Chave de API inválida ou serviço fora do ar | Verifique a chave em Configurações |

---

## 9. Privacidade e segurança

- **Sua chave de API nunca é enviada ao servidor do PBL** — ela vai diretamente do seu dispositivo para o provedor de IA (OpenAI, Groq, etc.)
- **Seu conteúdo não é armazenado em nenhum servidor** — tudo fica no seu browser/computador
- **O histórico é local** — apagado se você limpar os dados do navegador

---

*Dúvidas ou sugestões? Abra uma issue em [github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN](https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN)*

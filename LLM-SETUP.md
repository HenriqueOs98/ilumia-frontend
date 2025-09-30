# 🤖 Configuração do Assistente IA com LLM

O LUMIA possui dois modos de operação para o assistente IA:

## Modo 1: Local (Padrão) ✅

**Status**: Já está funcionando!
**Custo**: Gratuito
**Requer configuração**: Não

O assistente usa lógica JavaScript local para responder perguntas comuns sobre os dados. Funciona 100% offline após carregar os dados.

### Perguntas suportadas no modo local:

- ✅ "Qual foi o maior valor?"
- ✅ "Compare os subsistemas"
- ✅ "Qual foi o horário de pico?"
- ✅ "Mostre as estatísticas"
- ✅ "Top 5 picos de carga"

---

## Modo 2: LLM Real (Opcional) 🚀

**Status**: Configuração necessária
**Custo**: Pago (conforme uso da API do vendor)
**Requer configuração**: Sim

Usa modelos de linguagem reais (GPT-4, Claude, etc.) via **LLMAsAService.io** para análises mais sofisticadas e respostas em linguagem natural.

### Vantagens do modo LLM:

- 💬 Respostas em linguagem natural mais elaboradas
- 🧠 Análises contextuais profundas
- 📊 Insights automáticos sobre tendências
- ❓ Responde qualquer pergunta sobre os dados

---

## 📋 Passo a Passo: Ativar modo LLM

### 1. Registre-se no LLMAsAService.io

Acesse: https://app.llmasaservice.io

**Opções de registro**:
- Google Account (recomendado - email já confirmado)
- Email + Password (requer confirmação por código)

Preencha:
- ✏️ Seu nome
- ✏️ Nome do projeto (ex: "LUMIA Dashboard")
- ✅ Aceitar termos de serviço

---

### 2. Crie um Serviço LLM

No menu lateral, clique em **"LLM Services"** → **"+ Add Service"**

**Configuração**:
1. **Nome**: `openai-gpt4o` (ou outro identificador)
2. **Vendor**: Escolha o provedor (OpenAI, Anthropic, Google, etc.)
3. **Use Template**: Clique em "Yes" quando perguntado
4. **Salvar**: Apenas salve e feche (templates funcionam por padrão)

---

### 3. Adicione sua API Key (Obrigatório para Produção)

#### 3.1 Obter API Key do Vendor

**OpenAI**: https://platform.openai.com/api-keys
**Anthropic**: https://console.anthropic.com/
**Google**: https://ai.google.dev/

Crie uma API key no painel do vendor escolhido.

#### 3.2 Adicionar no LLMAsAService

1. Clique em **"Edit"** no seu serviço
2. Clique em **"Update or Add API-KEY"**
3. Cole a API Key do vendor
4. Clique em **"SAVE"** no dialog

💡 **Trial Gratuito**: LLMAsAService oferece 75.000 tokens grátis para testes usando a API key deles. Você pode pular este passo inicialmente para testar.

---

### 4. Teste o Serviço

Clique no botão **"TEST"** e procure pelo ✅ **tick verde**.

Se aparecer ✅, seu serviço está funcionando!

---

### 5. Configure o LUMIA

Edite o arquivo `llm-config.js`:

```javascript
const LLM_CONFIG = {
    // URL base (não mude)
    baseUrl: 'https://api.llmasaservice.io/v1',

    // ⚠️ OBRIGATÓRIO: Seu Project ID
    // Encontre em: Settings > Project Details
    projectId: 'seu-project-id-aqui',

    // ⚠️ OBRIGATÓRIO: Nome do serviço criado
    // O mesmo nome que você deu no passo 2
    serviceName: 'openai-gpt4o',

    // Configurações de resposta
    maxTokens: 1000,      // Máximo de tokens por resposta
    temperature: 0.7,     // 0.0 = preciso, 1.0 = criativo

    // ⚠️ ALTERE PARA 'llm' para ativar
    mode: 'llm'  // ← Mude de 'local' para 'llm'
};
```

---

### 6. Encontre seu Project ID

**No painel LLMAsAService.io**:

1. Menu lateral → **"Settings"** ou **"Project Details"**
2. Copie o **Project ID** exibido
3. Cole em `llm-config.js` no campo `projectId`

---

## 🧪 Testando a Integração

1. Abra o LUMIA: `python3 server.py` → http://localhost:8000
2. Carregue um dataset (ex: Curva de carga horária)
3. No **Assistente IA**, faça uma pergunta:
   - "Explique a tendência de carga nas últimas horas"
   - "Por que o subsistema SUDESTE tem mais carga?"
   - "O que podemos aprender com estes dados?"

Se o **modo LLM** estiver ativo, você verá:
- 🤔 "Analisando..." (loading)
- 💬 Resposta elaborada em linguagem natural

---

## 💰 Custos e Limites

### Trial Gratuito

- **75.000 tokens** usando a API key do LLMAsAService
- Perfeito para testar e desenvolver
- Sem necessidade de adicionar sua própria API key

### Produção (Recomendado)

Use sua **própria API key** do vendor:

**Motivos**:
- ✅ Controle total do budget
- ✅ Sem limite de tokens
- ✅ Garantia de disponibilidade para seus clientes

**Preços aproximados** (OpenAI GPT-4o):
- Input: $2.50 / 1M tokens
- Output: $10.00 / 1M tokens
- ~1000 perguntas = $0.50 - $2.00

Ou compre **créditos diretamente do LLMAsAService**.

---

## 🔧 Troubleshooting

### ❌ "Erro 401: Unauthorized"

**Causa**: Project ID ou Service Name incorretos
**Solução**: Verifique `llm-config.js` e compare com o painel

### ❌ "Erro 403: Forbidden"

**Causa**: API Key inválida ou sem créditos
**Solução**: Verifique a API key do vendor ou use o trial

### ❌ "Erro 429: Too Many Requests"

**Causa**: Limite de rate excedido
**Solução**: Aguarde alguns segundos ou upgrade no vendor

### ❌ Resposta não aparece

**Causa**: Modo ainda está em 'local'
**Solução**: Altere `mode: 'llm'` em `llm-config.js`

### ❌ CORS Error

**Causa**: Abrindo `index.html` diretamente
**Solução**: Use o servidor HTTP: `python3 server.py`

---

## 🔄 Alternando entre Modos

Você pode alternar facilmente:

**Modo Local** (grátis, offline):
```javascript
mode: 'local'
```

**Modo LLM** (pago, inteligente):
```javascript
mode: 'llm'
```

💡 **Recomendação**: Desenvolva em **modo local** e ative **modo LLM** apenas quando for mostrar para clientes ou produção.

---

## 📚 Recursos Adicionais

**Documentação LLMAsAService**: https://docs.llmasaservice.io
**Tutorial Completo**: https://docs.llmasaservice.io/getting-started
**Pricing**: https://llmasaservice.io/pricing

---

## ✅ Checklist

Use este checklist para garantir que tudo está configurado:

### Modo Local (já funciona)
- [x] Assistente responde perguntas básicas
- [x] Análises de máximos, picos, estatísticas
- [x] Visualizações dinâmicas

### Modo LLM (configuração opcional)
- [ ] Conta criada no LLMAsAService.io
- [ ] Serviço LLM criado
- [ ] API Key do vendor adicionada (ou usando trial)
- [ ] Teste no painel retornou ✅
- [ ] Project ID copiado para `llm-config.js`
- [ ] Service Name correto em `llm-config.js`
- [ ] `mode: 'llm'` configurado
- [ ] Testado no LUMIA com pergunta complexa

---

**Pronto!** 🎉 Seu assistente IA está configurado!

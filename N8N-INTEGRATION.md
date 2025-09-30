# 🔗 Integração com n8n

O LUMIA está integrado com o n8n via webhook para processar perguntas do usuário através de workflows automatizados.

## 🌐 Webhook Configurado

**URL**: `https://lumia-datathons.app.n8n.cloud/webhook/5f1c0c82-0ff9-40c7-9e2e-b1a96ffe24cd/chat`

---

## 📤 Payload Enviado

Quando o usuário faz uma pergunta, o LUMIA envia o seguinte payload para o n8n:

```json
{
  "question": "Qual foi o maior valor de carga?",
  "context": {
    "datasetName": "Curva de carga horária",
    "datasetDescription": "Curva de carga horária por subsistema do Sistema Interligado Nacional",
    "dataCount": 8760,
    "timeRange": "24/12/2024 00:00 até 31/12/2024 23:59",
    "subsystems": ["NORTE", "NORDESTE", "SUL", "SUDESTE"],
    "dataSample": [
      {
        "id_subsistema": "SE",
        "nom_subsistema": "SUDESTE",
        "din_instante": "2024-12-24 00:00:00",
        "val_cargaenergiahomwmed": "32456.78"
      }
      // ... até 10 registros de amostra
    ]
  },
  "timestamp": "2025-09-30T14:30:45.123Z"
}
```

### 📋 Estrutura do Payload

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `question` | `string` | Pergunta do usuário |
| `context.datasetName` | `string` | Nome do dataset selecionado |
| `context.datasetDescription` | `string` | Descrição do dataset |
| `context.dataCount` | `number` | Total de registros carregados |
| `context.timeRange` | `string` | Período dos dados (formatado) |
| `context.subsystems` | `array` | Lista de subsistemas disponíveis |
| `context.dataSample` | `array` | Amostra de até 10 registros |
| `timestamp` | `string` | Timestamp ISO 8601 da requisição |

---

## 📥 Resposta Esperada

O workflow n8n deve retornar um JSON com a resposta. O LUMIA aceita vários formatos:

### Formato 1: Campo `response`
```json
{
  "response": "O maior valor de carga foi **32.456,78 MW** no subsistema SUDESTE em 24/12/2024 às 18:45."
}
```

### Formato 2: Campo `message`
```json
{
  "message": "Análise completa dos dados..."
}
```

### Formato 3: Campo `output`
```json
{
  "output": "Resultado da análise..."
}
```

### Formato 4: String direta
```json
"Resposta em texto puro"
```

### Formato 5: Objeto genérico
```json
{
  "status": "success",
  "data": {
    "maxValue": 32456.78,
    "subsystem": "SUDESTE"
  }
}
```
> Será convertido para JSON formatado

---

## 🔧 Configuração no LUMIA

Edite o arquivo `llm-config.js`:

```javascript
const LLM_CONFIG = {
    // ... outras configurações ...

    // URL do webhook n8n
    n8nWebhookUrl: 'https://lumia-datathons.app.n8n.cloud/webhook/5f1c0c82-0ff9-40c7-9e2e-b1a96ffe24cd/chat',

    // Ativa o modo n8n
    mode: 'n8n'
};
```

---

## 🏗️ Estrutura do Workflow n8n

### Nodes Recomendados:

1. **Webhook** (Start)
   - Método: `POST`
   - Path: `/chat`
   - Responde com: `Responding With`

2. **Code/Function** (Processar dados)
   - Extrai `question` e `context`
   - Processa análise dos dados
   - Gera resposta

3. **HTTP Request** (Opcional - chamar LLM externo)
   - Conecta com OpenAI, Anthropic, etc.
   - Envia contexto + pergunta
   - Recebe resposta do LLM

4. **Respond to Webhook**
   - Retorna JSON com resposta
   - Formato: `{ "response": "..." }`

### Exemplo de Function Node:

```javascript
// Extrai dados do payload
const question = $input.item.json.question;
const context = $input.item.json.context;

// Processa análise simples
let response = '';

if (question.toLowerCase().includes('maior')) {
  response = `Análise do dataset **${context.datasetName}** com ${context.dataCount} registros no período ${context.timeRange}.`;
} else {
  response = `Pergunta recebida: "${question}". Processando análise...`;
}

// Retorna resposta
return {
  json: {
    response: response,
    metadata: {
      dataset: context.datasetName,
      recordCount: context.dataCount
    }
  }
};
```

---

## 🧪 Testando a Integração

### 1. Teste Direto com cURL

```bash
curl -X POST \
  https://lumia-datathons.app.n8n.cloud/webhook/5f1c0c82-0ff9-40c7-9e2e-b1a96ffe24cd/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "question": "Qual o maior valor?",
    "context": {
      "datasetName": "Teste",
      "dataCount": 100
    }
  }'
```

### 2. Teste no Browser Console

```javascript
fetch('https://lumia-datathons.app.n8n.cloud/webhook/5f1c0c82-0ff9-40c7-9e2e-b1a96ffe24cd/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'Qual foi o pico de carga?',
    context: {
      datasetName: 'Curva de carga horária',
      dataCount: 8760,
      subsystems: ['NORTE', 'NORDESTE', 'SUL', 'SUDESTE']
    }
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### 3. Teste no LUMIA

1. Abra o LUMIA: `python3 server.py` → http://localhost:8000
2. Selecione um dataset (ex: Curva de carga horária)
3. Digite uma pergunta no assistente IA
4. Clique em "Perguntar"
5. O LUMIA enviará automaticamente para o n8n

---

## 🔍 Debugging

### Console do Browser (F12)

O LUMIA exibe logs úteis no console:

```javascript
✓ Dados carregados!
🤔 Analisando...
→ Enviando para n8n: { question: "...", context: {...} }
← Resposta do n8n: { response: "..." }
```

### Verificar Requisições (Network Tab)

1. Abra DevTools (F12) → Network
2. Filtre por "chat"
3. Clique na requisição
4. Veja:
   - **Request Payload**: Dados enviados
   - **Response**: Resposta do n8n
   - **Status**: 200 OK (sucesso) ou erro

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `404 Not Found` | Webhook não existe ou URL errada | Verifique a URL no `llm-config.js` |
| `CORS Error` | n8n bloqueando origem | Configure CORS no workflow |
| `Timeout` | Workflow demora muito | Otimize o workflow ou aumente timeout |
| `500 Internal Error` | Erro no workflow | Verifique logs do n8n |

---

## 🔄 Fallback para Modo Local

Se o n8n falhar (offline, erro, timeout), o LUMIA automaticamente usa **respostas locais**:

```javascript
try {
    return await queryN8N(question, context);
} catch (error) {
    console.error('Erro ao chamar n8n:', error);
    // ✅ Fallback automático para modo local
    return handleLocalQuestion(question, context);
}
```

O usuário sempre recebe uma resposta, mesmo que o n8n esteja indisponível.

---

## 🎯 Exemplos de Perguntas

Teste com estas perguntas no LUMIA:

- ✅ "Qual foi o maior valor de carga?"
- ✅ "Compare os subsistemas NORTE e SUDESTE"
- ✅ "Qual foi o horário de pico?"
- ✅ "Mostre as estatísticas do período"
- ✅ "Qual subsistema teve maior consumo?"
- ✅ "Explique a tendência de carga nas últimas horas"

---

## 📊 Monitoramento

### No n8n Dashboard:

- **Executions**: Visualize todas as chamadas recebidas
- **Success Rate**: Taxa de sucesso das execuções
- **Execution Time**: Tempo médio de resposta
- **Errors**: Logs de erros para debugging

### No LUMIA:

```javascript
// Adicione logging customizado em llm-config.js
async function queryN8N(question, context) {
    console.log('→ Enviando para n8n:', { question, context });

    const response = await fetch(LLM_CONFIG.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context })
    });

    const data = await response.json();
    console.log('← Resposta do n8n:', data);

    return data.response;
}
```

---

## 🚀 Alternando entre Modos

Você pode facilmente alternar entre os modos:

### Modo n8n (Atual):
```javascript
mode: 'n8n'
```

### Modo Local (Fallback):
```javascript
mode: 'local'
```

### Modo LLM (LLMAsAService):
```javascript
mode: 'llm'
```

---

## 📄 Recursos Adicionais

- **n8n Docs**: https://docs.n8n.io/
- **Webhook Node**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- **Function Node**: https://docs.n8n.io/code-examples/expressions/
- **HTTP Request**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/

---

**Pronto!** 🎉 O LUMIA está conectado ao n8n via webhook!

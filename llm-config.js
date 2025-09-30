/**
 * Configuração do LLM Service para o Assistente IA do LUMIA
 * Integração com LLMAsAService.io
 */

const LLM_CONFIG = {
    // URL base do serviço LLM
    baseUrl: 'https://api.llmasaservice.io/v1',

    // ID do projeto (substituir pelo seu)
    projectId: 'YOUR_PROJECT_ID',

    // Nome do serviço configurado no LLMAsAService
    serviceName: 'openai-gpt4o',

    // Configurações de requisição
    maxTokens: 1000,
    temperature: 0.7,

    // n8n Webhook Configuration
    n8nWebhookUrl: 'https://lumia-datathons.app.n8n.cloud/webhook/5f1c0c82-0ff9-40c7-9e2e-b1a96ffe24cd/chat',

    // Modo de operação: 'local', 'llm', ou 'n8n'
    mode: 'n8n' // 'local' = respostas locais, 'llm' = LLMAsAService, 'n8n' = webhook n8n
};

/**
 * Faz chamada ao LLM Service
 * @param {string} question - Pergunta do usuário
 * @param {Object} context - Contexto com dados do dataset
 * @returns {Promise<string>} Resposta do LLM
 */
async function queryLLM(question, context) {
    // Modo local: respostas pré-programadas
    if (LLM_CONFIG.mode === 'local') {
        return handleLocalQuestion(question, context);
    }

    // Modo n8n: webhook n8n
    if (LLM_CONFIG.mode === 'n8n') {
        try {
            return await queryN8N(question, context);
        } catch (error) {
            console.error('Erro ao chamar n8n:', error);
            // Fallback para resposta local
            return handleLocalQuestion(question, context);
        }
    }

    // Modo LLM: LLMAsAService
    try {
        // Monta o prompt com contexto
        const systemPrompt = buildSystemPrompt(context);
        const userPrompt = question;

        // Faz requisição ao LLM Service
        const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Project-ID': LLM_CONFIG.projectId,
                'X-Service-Name': LLM_CONFIG.serviceName
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: LLM_CONFIG.maxTokens,
                temperature: LLM_CONFIG.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`LLM Service erro: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('Erro ao chamar LLM:', error);
        // Fallback para resposta local
        return handleLocalQuestion(question, context);
    }
}

/**
 * Faz chamada ao webhook n8n
 * @param {string} question - Pergunta do usuário
 * @param {Object} context - Contexto com dados do dataset
 * @returns {Promise<string>} Resposta do n8n
 */
async function queryN8N(question, context) {
    // Prepara o payload para o n8n
    const payload = {
        question: question,
        context: {
            datasetName: context.datasetName,
            datasetDescription: context.datasetDescription,
            dataCount: context.dataCount,
            timeRange: context.timeRange,
            subsystems: context.subsystems,
            // Envia uma amostra dos dados (não todos para não sobrecarregar)
            dataSample: context.data ? context.data.slice(0, 10) : []
        },
        timestamp: new Date().toISOString()
    };

    const response = await fetch(LLM_CONFIG.n8nWebhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`n8n webhook erro: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // O n8n pode retornar a resposta em diferentes formatos
    // Ajuste conforme a estrutura do seu workflow
    if (data.response) {
        return data.response;
    } else if (data.message) {
        return data.message;
    } else if (data.output) {
        return data.output;
    } else if (typeof data === 'string') {
        return data;
    } else {
        // Se o n8n retornar um objeto, tenta extrair texto
        return JSON.stringify(data, null, 2);
    }
}

/**
 * Constrói o prompt do sistema com contexto dos dados
 * @param {Object} context - Contexto com informações do dataset
 * @returns {string} System prompt
 */
function buildSystemPrompt(context) {
    const { datasetName, datasetDescription, dataCount, timeRange, subsystems, summary } = context;

    return `Você é um assistente especializado em análise de dados do Sistema Interligado Nacional (SIN) do ONS.

CONTEXTO ATUAL:
- Dataset: ${datasetName}
- Descrição: ${datasetDescription}
- Período: ${timeRange}
- Registros: ${dataCount}
${subsystems ? `- Subsistemas: ${subsystems.join(', ')}` : ''}
${summary ? `\n${summary}` : ''}

INSTRUÇÕES:
- Responda em português brasileiro
- Seja conciso e direto (máximo 3 parágrafos)
- Use dados quantitativos quando disponíveis
- Destaque insights importantes com **negrito**
- Use bullet points para listas
- Se não souber, indique que precisa de mais dados

ESPECIALIDADES:
- Análise de carga energética
- Balanços de subsistemas (NORTE, NORDESTE, SUL, SUDESTE)
- Dados hidrológicos de reservatórios
- Geração por tipo de fonte (hidráulica, térmica, eólica, solar)
- Identificação de picos e padrões horários`;
}

/**
 * Responde perguntas usando lógica local (sem LLM)
 * @param {string} question - Pergunta do usuário
 * @param {Object} context - Contexto com dados
 * @returns {string} Resposta local
 */
function handleLocalQuestion(question, context) {
    const lowerQ = question.toLowerCase();
    const { data, datasetName } = context;

    if (!data || data.length === 0) {
        return '⚠️ Nenhum dado carregado. Selecione um dataset e período primeiro.';
    }

    // Análise de máximos
    if (lowerQ.includes('maior') || lowerQ.includes('máximo') || lowerQ.includes('maximo')) {
        return analyzeMaximums(data);
    }

    // Comparação entre subsistemas
    if (lowerQ.includes('compare') || lowerQ.includes('comparar')) {
        return compareSubsystems(data);
    }

    // Análise de picos
    if (lowerQ.includes('pico')) {
        return analyzePeaks(data);
    }

    // Estatísticas
    if (lowerQ.includes('média') || lowerQ.includes('media') || lowerQ.includes('estatística')) {
        return calculateStatistics(data);
    }

    // Resposta genérica
    return `📊 Analisando **${datasetName}** com ${data.length.toLocaleString('pt-BR')} registros.

Para análises mais detalhadas, experimente perguntar:
- "Qual foi o maior valor?"
- "Compare os subsistemas"
- "Qual foi o horário de pico?"
- "Mostre as estatísticas"`;
}

/**
 * Analisa valores máximos por subsistema
 */
function analyzeMaximums(data) {
    const maxBySubsystem = {};

    data.forEach(row => {
        const sub = row.nom_subsistema;
        const val = parseFloat(row.val_cargaenergiahomwmed || row.val_geracao || 0);
        if (!maxBySubsystem[sub] || val > maxBySubsystem[sub]) {
            maxBySubsystem[sub] = val;
        }
    });

    const sorted = Object.entries(maxBySubsystem).sort((a, b) => b[1] - a[1]);

    let response = '📊 **Valores Máximos por Subsistema:**\n\n';
    sorted.forEach(([sub, val], i) => {
        const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•';
        response += `${emoji} **${sub}**: ${val.toFixed(2)} MW\n`;
    });

    return response;
}

/**
 * Compara subsistemas
 */
function compareSubsystems(data) {
    const avgBySubsystem = {};
    const countBySubsystem = {};

    data.forEach(row => {
        const sub = row.nom_subsistema;
        const val = parseFloat(row.val_cargaenergiahomwmed || row.val_geracao || 0);

        if (!avgBySubsystem[sub]) {
            avgBySubsystem[sub] = 0;
            countBySubsystem[sub] = 0;
        }
        avgBySubsystem[sub] += val;
        countBySubsystem[sub]++;
    });

    Object.keys(avgBySubsystem).forEach(sub => {
        avgBySubsystem[sub] /= countBySubsystem[sub];
    });

    const sorted = Object.entries(avgBySubsystem).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, [_, val]) => sum + val, 0);

    let response = '⚖️ **Comparação de Carga Média:**\n\n';
    sorted.forEach(([sub, val]) => {
        const percentage = ((val / total) * 100).toFixed(1);
        response += `• **${sub}**: ${val.toFixed(2)} MW (${percentage}%)\n`;
    });

    return response;
}

/**
 * Analisa horários de pico
 */
function analyzePeaks(data) {
    const values = data.map(row => ({
        time: row.din_instante,
        subsystem: row.nom_subsistema,
        value: parseFloat(row.val_cargaenergiahomwmed || row.val_geracao || 0)
    })).filter(v => !isNaN(v.value));

    values.sort((a, b) => b.value - a.value);
    const top3 = values.slice(0, 3);

    let response = '⚡ **Top 3 Picos de Carga:**\n\n';
    top3.forEach((item, i) => {
        const date = new Date(item.time);
        const dateStr = date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        response += `${i + 1}. **${item.value.toFixed(2)} MW** - ${item.subsystem}\n   📅 ${dateStr}\n`;
    });

    return response;
}

/**
 * Calcula estatísticas gerais
 */
function calculateStatistics(data) {
    const values = data.map(row =>
        parseFloat(row.val_cargaenergiahomwmed || row.val_geracao || 0)
    ).filter(v => !isNaN(v));

    if (values.length === 0) return '⚠️ Nenhum valor numérico encontrado.';

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const amplitude = max - min;

    // Mediana
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    return `📈 **Estatísticas do Período:**

• **Média**: ${avg.toFixed(2)} MW
• **Mediana**: ${median.toFixed(2)} MW
• **Mínimo**: ${min.toFixed(2)} MW
• **Máximo**: ${max.toFixed(2)} MW
• **Amplitude**: ${amplitude.toFixed(2)} MW
• **Total de registros**: ${values.length.toLocaleString('pt-BR')}`;
}

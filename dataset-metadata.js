// Metadados dos datasets com informações estruturadas baseadas nos dicionários de dados do ONS

const DATASET_METADATA = {
    'hourly-curve': {
        name: 'Curva de carga horária',
        description: 'Curva de carga horária por subsistema do Sistema Interligado Nacional',
        dictionaryUrl: 'datasets/dicionario-curva-carga.pdf',
        dictionaryS3: 'dataset/curva-carga-ho/DicionarioDados_CurvaCarga.pdf',
        columns: {
            'id_subsistema': {
                name: 'ID Subsistema',
                type: 'string',
                description: 'Identificador do subsistema (N, NE, S, SE)'
            },
            'nom_subsistema': {
                name: 'Nome do Subsistema',
                type: 'string',
                description: 'Nome completo do subsistema (NORTE, NORDESTE, SUL, SUDESTE)'
            },
            'din_instante': {
                name: 'Data/Hora',
                type: 'datetime',
                description: 'Data e hora da medição',
                format: 'YYYY-MM-DD HH:MM:SS'
            },
            'val_cargaenergiahomwmed': {
                name: 'Carga Energia (MW)',
                type: 'float',
                description: 'Valor da carga de energia média horária em MW',
                unit: 'MW'
            }
        },
        visualizations: {
            timeSeries: {
                type: 'line',
                xAxis: 'din_instante',
                yAxis: 'val_cargaenergiahomwmed',
                groupBy: 'nom_subsistema',
                title: 'Curva de Carga por Subsistema'
            },
            comparison: {
                type: 'bar',
                aggregation: 'avg',
                groupBy: 'nom_subsistema',
                title: 'Comparação de Carga Média por Subsistema'
            }
        },
        suggestedQuestions: [
            'Qual a carga do subsistema Sudeste em {date}?',
            'Compare a carga entre os subsistemas',
            'Qual foi o horário de pico de carga?',
            'Mostre a evolução da carga no período',
            'Qual subsistema teve maior consumo?'
        ],
        filters: ['subsistema', 'período', 'horário'],
        subsystems: ['NORTE', 'NORDESTE', 'SUL', 'SUDESTE']
    },
    'energy-balance': {
        name: 'Balanço de energia nos subsistemas',
        description: 'Balanço energético detalhado por subsistema',
        dictionaryS3: 'dataset/balanco_energia_subsistema_ho/DicionarioDados_Balanco_Energia_Subsistema.pdf',
        columns: {
            'id_subsistema': { name: 'ID Subsistema', type: 'string' },
            'nom_subsistema': { name: 'Nome Subsistema', type: 'string' },
            'din_instante': { name: 'Data/Hora', type: 'datetime' },
            'val_geracao': { name: 'Geração Total', type: 'float', unit: 'MW' },
            'val_carga': { name: 'Carga', type: 'float', unit: 'MW' }
        },
        visualizations: {
            balance: {
                type: 'line',
                xAxis: 'din_instante',
                yAxis: ['val_geracao', 'val_carga'],
                groupBy: 'nom_subsistema',
                title: 'Balanço: Geração vs Carga'
            }
        },
        suggestedQuestions: [
            'Mostre o balanço energético do subsistema {subsistema}',
            'Compare geração e carga',
            'Houve déficit energético no período?',
            'Qual subsistema exportou energia?'
        ],
        filters: ['subsistema', 'período'],
        subsystems: ['NORTE', 'NORDESTE', 'SUL', 'SUDESTE']
    },
    'daily-charge': {
        name: 'Carga de Energia Diária',
        description: 'Dados consolidados de carga diária por subsistema',
        dictionaryS3: 'dataset/carga_energia_di/DicionarioDados_Carga_Energia_Diaria.pdf',
        columns: {
            'id_subsistema': { name: 'ID Subsistema', type: 'string' },
            'nom_subsistema': { name: 'Nome Subsistema', type: 'string' },
            'din_instante': { name: 'Data', type: 'date' },
            'val_cargamedia': { name: 'Carga Média', type: 'float', unit: 'MW' },
            'val_cargamaxima': { name: 'Carga Máxima', type: 'float', unit: 'MW' }
        },
        visualizations: {
            daily: {
                type: 'bar',
                xAxis: 'din_instante',
                yAxis: 'val_cargamedia',
                groupBy: 'nom_subsistema',
                title: 'Carga Média Diária'
            }
        },
        suggestedQuestions: [
            'Qual foi a carga máxima diária?',
            'Compare as cargas médias entre subsistemas',
            'Mostre a tendência semanal de carga'
        ],
        filters: ['subsistema', 'período'],
        subsystems: ['NORTE', 'NORDESTE', 'SUL', 'SUDESTE']
    },
    'reservoir-daily': {
        name: 'Dados hidrológicos de reservatório - Base Diária',
        description: 'Dados diários de reservatórios: vazão, volume, cota',
        dictionaryS3: 'dataset/dados_hidrologicos_di/DicionarioDados_DadosHidrologicosDiarios.pdf',
        columns: {
            'nom_reservatorio': { name: 'Nome do Reservatório', type: 'string' },
            'din_instante': { name: 'Data', type: 'date' },
            'val_vazaoafluente': { name: 'Vazão Afluente', type: 'float', unit: 'm³/s' },
            'val_volumeutil': { name: 'Volume Útil', type: 'float', unit: 'hm³' },
            'val_cota': { name: 'Cota', type: 'float', unit: 'm' }
        },
        visualizations: {
            volume: {
                type: 'line',
                xAxis: 'din_instante',
                yAxis: 'val_volumeutil',
                groupBy: 'nom_reservatorio',
                title: 'Evolução do Volume Útil'
            }
        },
        suggestedQuestions: [
            'Qual o nível do reservatório {name}?',
            'Mostre a vazão afluente no período',
            'Compare o volume de diferentes reservatórios',
            'Qual reservatório está com menor volume?'
        ],
        filters: ['reservatório', 'período', 'bacia']
    },
    'generation-per-plant': {
        name: 'Geração por usina em base horária',
        description: 'Geração horária detalhada por usina',
        dictionaryS3: 'dataset/generation_per_plant/DicionarioDados_GeracaoPorUsina.pdf',
        columns: {
            'nom_usina': { name: 'Nome da Usina', type: 'string' },
            'tip_combustivel': { name: 'Tipo de Combustível', type: 'string' },
            'din_instante': { name: 'Data/Hora', type: 'datetime' },
            'val_geracaohoraria': { name: 'Geração Horária', type: 'float', unit: 'MW' }
        },
        visualizations: {
            generation: {
                type: 'bar',
                xAxis: 'din_instante',
                yAxis: 'val_geracaohoraria',
                groupBy: 'nom_usina',
                title: 'Geração por Usina'
            },
            byFuel: {
                type: 'pie',
                aggregation: 'sum',
                groupBy: 'tip_combustivel',
                title: 'Geração por Tipo de Combustível'
            }
        },
        suggestedQuestions: [
            'Qual usina gerou mais energia?',
            'Mostre a geração das usinas hidrelétricas',
            'Compare geração eólica e solar',
            'Qual foi o pico de geração da usina {name}?'
        ],
        filters: ['usina', 'tipo_combustível', 'período']
    }
};

/**
 * Retorna metadados de um dataset
 * @param {string} datasetId - ID do dataset
 * @returns {Object|null} Metadados do dataset
 */
function getDatasetMetadata(datasetId) {
    return DATASET_METADATA[datasetId] || null;
}

/**
 * Gera perguntas contextualizadas para um dataset
 * @param {string} datasetId - ID do dataset
 * @param {Object} context - Contexto adicional (subsistema, datas, etc)
 * @returns {Array<string>} Perguntas sugeridas
 */
function generateContextualQuestions(datasetId, context = {}) {
    const metadata = getDatasetMetadata(datasetId);
    if (!metadata) return [];

    const questions = metadata.suggestedQuestions.map(q => {
        let question = q;

        // Substitui placeholders
        if (context.date) {
            question = question.replace('{date}', context.date);
        }
        if (context.subsistema) {
            question = question.replace('{subsistema}', context.subsistema);
        }

        // Remove placeholders não substituídos
        question = question.replace(/\{[^}]+\}/g, '...');

        return question;
    });

    return questions;
}

/**
 * Detecta tipo de visualização apropriada para os dados
 * @param {string} datasetId - ID do dataset
 * @param {Array} data - Dados carregados
 * @returns {Object} Configuração de visualização
 */
function suggestVisualization(datasetId, data) {
    const metadata = getDatasetMetadata(datasetId);
    if (!metadata || !data.length) return null;

    // Por padrão, usa a visualização de série temporal se disponível
    const vizConfig = metadata.visualizations.timeSeries ||
                      Object.values(metadata.visualizations)[0];

    return vizConfig;
}

/**
 * Extrai valores únicos de uma coluna (útil para filtros)
 * @param {Array} data - Dados
 * @param {string} column - Nome da coluna
 * @returns {Array} Valores únicos
 */
function getUniqueValues(data, column) {
    const values = new Set();
    data.forEach(row => {
        if (row[column]) values.add(row[column]);
    });
    return Array.from(values).sort();
}

/**
 * Gera texto descritivo sobre o dataset com base nos dados
 * @param {string} datasetId - ID do dataset
 * @param {Array} data - Dados carregados
 * @returns {string} Descrição contextual
 */
function generateDatasetSummary(datasetId, data) {
    const metadata = getDatasetMetadata(datasetId);
    if (!metadata || !data.length) return '';

    const summary = [];
    summary.push(`📊 **${metadata.name}**`);
    summary.push(`${metadata.description}`);
    summary.push(`\n**Registros**: ${data.length.toLocaleString('pt-BR')}`);

    // Detecta subsistemas disponíveis
    if (metadata.subsystems && data[0].nom_subsistema) {
        const subsystems = getUniqueValues(data, 'nom_subsistema');
        summary.push(`**Subsistemas**: ${subsystems.join(', ')}`);
    }

    // Detecta período
    if (data[0].din_instante) {
        const dates = data.map(d => new Date(d.din_instante)).sort();
        const start = dates[0].toLocaleDateString('pt-BR');
        const end = dates[dates.length - 1].toLocaleDateString('pt-BR');
        summary.push(`**Período**: ${start} a ${end}`);
    }

    return summary.join('\n');
}
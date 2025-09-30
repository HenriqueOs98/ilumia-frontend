// Configuração dos datasets do ONS disponíveis no AWS S3
const ONS_DATASETS = {
    'energy-balance': {
        name: 'Balanço de energia nos subsistemas',
        path: 'dataset/balance_subsystem/',
        description: 'Dados de balanço energético por subsistema',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    },
    'installed-capacity': {
        name: 'Capacidade instalada de geração',
        path: 'dataset/installed_capacity/',
        description: 'Capacidade instalada de geração de energia',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    },
    'daily-charge': {
        name: 'Carga de Energia Diária',
        path: 'dataset/daily_load/',
        description: 'Dados diários de carga de energia',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    },
    'monthly-charge': {
        name: 'Carga de energia mensal',
        path: 'dataset/monthly_load/',
        description: 'Dados mensais de carga de energia',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    },
    'hourly-curve': {
        name: 'Curva de carga horária',
        path: 'dataset/hourly_load/',
        description: 'Curva de carga em base horária',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    },
    'reservoir-daily': {
        name: 'Dados hidrológicos de reservatório - Base Diária',
        path: 'dataset/reservoir_daily/',
        description: 'Dados hidrológicos diários dos reservatórios',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    },
    'reservoir-hourly': {
        name: 'Dados hidrológicos de reservatório - Base Horária',
        path: 'dataset/reservoir_hourly/',
        description: 'Dados hidrológicos horários dos reservatórios',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    },
    'plant-availability': {
        name: 'Disponibilidade de Usinas',
        path: 'dataset/plant_availability/',
        description: 'Dados de disponibilidade das usinas',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    },
    'stored-energy-subsystem': {
        name: 'Energia Armazenada (EAR) diário por subsistema',
        path: 'dataset/stored_energy_subsystem/',
        description: 'Energia armazenada nos reservatórios por subsistema',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    },
    'affluent-energy-subsystem': {
        name: 'Energia Natural Afluente (ENA) diário por subsistema',
        path: 'dataset/affluent_energy_subsystem/',
        description: 'Energia natural afluente por subsistema',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    },
    'generation-per-plant': {
        name: 'Geração por usina em base horária',
        path: 'dataset/generation_per_plant/',
        description: 'Geração de energia por usina em base horária',
        bucket: 'ons-aws-prod-opendata',
        region: 'sa-east-1',
        format: 'csv'
    }
};

/**
 * Gera a URL do S3 para um dataset específico
 * @param {string} datasetId - ID do dataset
 * @param {string} startDate - Data de início (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @returns {string} URL do S3
 */
function generateS3Url(datasetId, startDate, endDate) {
    const dataset = ONS_DATASETS[datasetId];
    if (!dataset) {
        throw new Error(`Dataset ${datasetId} não encontrado`);
    }

    const baseUrl = `https://${dataset.bucket}.s3.${dataset.region}.amazonaws.com`;
    return `${baseUrl}/${dataset.path}`;
}

/**
 * Lista os arquivos disponíveis no dataset (simulação)
 * Como o S3 do ONS é público mas não permite listagem direta via browser,
 * esta função retorna URLs baseadas no padrão de nomenclatura conhecido
 * @param {string} datasetId - ID do dataset
 * @param {string} startDate - Data de início (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @returns {Array} Lista de URLs de arquivos
 */
function getDatasetFiles(datasetId, startDate, endDate) {
    const dataset = ONS_DATASETS[datasetId];
    if (!dataset) return [];

    const files = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const baseUrl = generateS3Url(datasetId, startDate, endDate);

    // Gera URLs para cada dia no período
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        // Padrão comum de nomenclatura do ONS: DATASET_YYYY-MM-DD.csv
        const fileName = `${year}${month}${day}.csv`;
        files.push({
            url: `${baseUrl}${fileName}`,
            date: `${year}-${month}-${day}`,
            name: fileName
        });
    }

    return files;
}

/**
 * Tenta carregar dados do cache local primeiro
 * @param {string} datasetId - ID do dataset
 * @param {string} year - Ano dos dados
 * @returns {Promise<string|null>} Conteúdo do arquivo ou null
 */
async function loadFromLocalCache(datasetId, year) {
    try {
        // Mapeamento de IDs para nomes de arquivos locais
        const localFiles = {
            'hourly-curve': `datasets/curva_carga_${year}.csv`,
            'energy-balance': `datasets/balanco_energia_subsistema_${year}.csv`,
            'daily-charge': `datasets/carga_energia_${year}.csv`,
            'stored-energy-subsystem': `datasets/ear_diario_subsistema_${year}.csv`,
            'affluent-energy-subsystem': `datasets/ena_diario_subsistema_${year}.csv`,
            'reservoir-daily': `datasets/dados_hidrologicos_res_${year}.csv`,
            'reservoir-hourly': `datasets/dados_hidrologicos_res_${year}.csv`,
            'installed-capacity': `datasets/capacidade_geracao.csv`
        };

        const localPath = localFiles[datasetId];
        if (!localPath) {
            console.log(`⚠️ Dataset ${datasetId} não tem mapeamento local`);
            return null;
        }

        const response = await fetch(localPath);
        if (!response.ok) {
            console.log(`⚠️ Arquivo não encontrado: ${localPath}`);
            return null;
        }

        console.log(`✓ Carregado: ${localPath}`);
        return await response.text();
    } catch (error) {
        console.log(`❌ Erro ao carregar ${datasetId}:`, error.message);
        return null;
    }
}

/**
 * Faz o download de um arquivo do S3 do ONS
 * @param {string} url - URL do arquivo
 * @returns {Promise<string>} Conteúdo do arquivo
 */
async function downloadDatasetFile(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao baixar arquivo: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Erro ao baixar dataset:', error);
        throw error;
    }
}

/**
 * Parse de arquivo CSV para objeto JavaScript
 * @param {string} csvContent - Conteúdo do CSV
 * @returns {Array<Object>} Dados parseados
 */
function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(';').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        data.push(row);
    }

    return data;
}

/**
 * Carrega dados de um dataset para o período especificado
 * Tenta primeiro do cache local, depois do S3
 * @param {string} datasetId - ID do dataset
 * @param {string} startDate - Data de início
 * @param {string} endDate - Data final
 * @returns {Promise<Array>} Dados consolidados
 */
async function loadDatasetData(datasetId, startDate, endDate) {
    const allData = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Para datasets com cache local anual (como curva-carga)
    const yearsToLoad = new Set();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        yearsToLoad.add(d.getFullYear());
    }

    // SEMPRE tenta carregar do cache local primeiro (não tenta S3)
    for (const year of yearsToLoad) {
        const cachedData = await loadFromLocalCache(datasetId, year);
        if (cachedData) {
            const parsed = parseCSV(cachedData);
            // Filtra apenas dados do período solicitado
            const filtered = parsed.filter(row => {
                if (!row.din_instante) return false;
                const rowDate = new Date(row.din_instante);
                return rowDate >= start && rowDate <= end;
            });
            allData.push(...filtered);
        }
    }

    if (allData.length > 0) {
        console.log(`✓ ${allData.length} registros carregados dos arquivos locais`);
        return allData;
    }

    // Se não encontrou dados locais, avisa
    console.log('⚠️ Nenhum arquivo local encontrado. Execute: python3 download-datasets.py');
    return allData;
}

/**
 * Comando AWS CLI para explorar o bucket (informativo)
 * @param {string} datasetId - ID do dataset
 * @returns {string} Comando AWS CLI
 */
function getAWSCLICommand(datasetId) {
    const dataset = ONS_DATASETS[datasetId];
    if (!dataset) return '';

    return `aws s3 ls --no-sign-request s3://${dataset.bucket}/${dataset.path}`;
}

/**
 * Retorna informações sobre um dataset
 * @param {string} datasetId - ID do dataset
 * @returns {Object} Informações do dataset
 */
function getDatasetInfo(datasetId) {
    return ONS_DATASETS[datasetId] || null;
}
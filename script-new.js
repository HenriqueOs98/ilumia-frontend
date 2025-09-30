document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM --- //
    const datasetSelector = document.getElementById('dataset-selector');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const relativeTimeSelect = document.getElementById('relative-time');
    const modeCustomBtn = document.getElementById('mode-custom');
    const modeRelativeBtn = document.getElementById('mode-relative');
    const customFilters = document.getElementById('custom-filters');
    const relativeFilters = document.getElementById('relative-filters');
    // Elementos do antigo assistente (dummy objects para evitar erros)
    const askButton = { addEventListener: () => {} };
    const aiQuestionInput = { value: '', addEventListener: () => {} };
    const aiResponseBox = { innerHTML: '' };
    const faqContainer = { innerHTML: '', appendChild: () => {} };
    const chartToggles = document.getElementById('chart-toggles');
    const cardGeracao = document.getElementById('card-geracao');
    const cardCarga = document.getElementById('card-carga');
    const cardReserva = document.getElementById('card-reserva');
    const dynamicFiltersContainer = {
        innerHTML: '',
        appendChild: () => {} // Dummy - filtros removidos
    };

    // --- INICIALIZA ECHARTS --- //
    const chartDom = document.getElementById('energyChart');
    const energyChart = echarts.init(chartDom);

    // Variáveis globais
    let currentLoadedData = null;
    let currentDatasetId = null;
    let currentSeriesVisibility = {};
    let currentFilters = {};
    let timeMode = 'custom'; // 'custom' ou 'relative'

    // --- GERADOR DE DADOS MOCK --- //
    function generateMockData(datasetId, startDate, endDate) {
        const metadata = getDatasetMetadata(datasetId);
        if (!metadata) return [];

        const mockData = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const subsystems = metadata.subsystems || ['GERAL'];

        // Gera dados horários
        for (let date = new Date(start); date <= end; date.setHours(date.getHours() + 1)) {
            subsystems.forEach(subsystem => {
                // Valores base por subsistema
                const baseValues = {
                    'NORTE': 6000,
                    'NORDESTE': 10500,
                    'SUL': 10000,
                    'SUDESTE': 32000,
                    'GERAL': 15000
                };

                const base = baseValues[subsystem] || 10000;
                const hour = date.getHours();

                // Variação por hora (pico entre 18h-21h)
                const hourFactor = 1 + (Math.sin((hour - 6) * Math.PI / 12) * 0.3);

                // Variação aleatória
                const randomFactor = 0.9 + Math.random() * 0.2;

                const value = base * hourFactor * randomFactor;

                mockData.push({
                    id_subsistema: subsystem.substring(0, 2),
                    nom_subsistema: subsystem,
                    din_instante: date.toISOString().replace('T', ' ').substring(0, 19),
                    val_cargaenergiahomwmed: value.toFixed(2)
                });
            });
        }

        console.log(`📊 Gerados ${mockData.length} registros mock para demonstração`);
        return mockData;
    }

    // --- FUNÇÕES DE INICIALIZAÇÃO --- //
    function initializeDateInputs() {
        // Define período padrão: última semana de 2024 (dados mais recentes)
        startDateInput.value = '2024-12-24T00:00';
        endDateInput.value = '2024-12-31T23:59';
    }

    // --- TOGGLE DE MODO DE TEMPO --- //
    function switchTimeMode(mode) {
        timeMode = mode;

        if (mode === 'custom') {
            modeCustomBtn.classList.add('bg-white', 'text-dark-blue', 'shadow-sm');
            modeCustomBtn.classList.remove('text-gray-600');
            modeRelativeBtn.classList.remove('bg-white', 'text-dark-blue', 'shadow-sm');
            modeRelativeBtn.classList.add('text-gray-600');
            customFilters.classList.remove('hidden');
            relativeFilters.classList.add('hidden');
        } else {
            modeRelativeBtn.classList.add('bg-white', 'text-dark-blue', 'shadow-sm');
            modeRelativeBtn.classList.remove('text-gray-600');
            modeCustomBtn.classList.remove('bg-white', 'text-dark-blue', 'shadow-sm');
            modeCustomBtn.classList.add('text-gray-600');
            customFilters.classList.add('hidden');
            relativeFilters.classList.remove('hidden');
        }

        // Recarrega dados se já houver dataset selecionado
        if (currentDatasetId) {
            loadONSData();
        }
    }

    // Calcula período relativo
    function calculateRelativePeriod(relativeValue) {
        const now = new Date();
        const end = new Date(now);
        const start = new Date(now);

        const value = parseInt(relativeValue);
        const unit = relativeValue.slice(-1);

        if (unit === 'h') {
            start.setHours(start.getHours() - value);
        } else if (unit === 'd') {
            start.setDate(start.getDate() - value);
        }

        return {
            start: start.toISOString().slice(0, 16),
            end: end.toISOString().slice(0, 16)
        };
    }

    function createDynamicFilters(datasetId) {
        const metadata = getDatasetMetadata(datasetId);
        if (!metadata) return;

        dynamicFiltersContainer.innerHTML = '';

        // Cria filtros baseados nos metadados
        if (metadata.subsystems) {
            const filterDiv = document.createElement('div');
            filterDiv.innerHTML = `
                <label class="block text-sm font-medium mb-2 text-dark-blue">Subsistema</label>
                <select id="filter-subsistema" class="w-full p-3 rounded-lg border-2 text-dark-blue focus:ring-0">
                    <option value="">Todos</option>
                    ${metadata.subsystems.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            `;
            dynamicFiltersContainer.appendChild(filterDiv);

            const select = filterDiv.querySelector('select');
            select.addEventListener('change', () => {
                currentFilters.subsistema = select.value;
                applyFiltersToChart();
            });
        }

        // Adiciona outros filtros se disponíveis
        if (metadata.filters) {
            metadata.filters.forEach(filterType => {
                if (filterType === 'subsistema') return; // Já criado acima

                if (filterType === 'tipo_combustível' && currentLoadedData) {
                    const values = getUniqueValues(currentLoadedData, 'tip_combustivel');
                    if (values.length > 0) {
                        const filterDiv = document.createElement('div');
                        filterDiv.className = 'mt-4';
                        filterDiv.innerHTML = `
                            <label class="block text-sm font-medium mb-2 text-dark-blue">Tipo de Combustível</label>
                            <select id="filter-combustivel" class="w-full p-3 rounded-lg border-2 text-dark-blue focus:ring-0">
                                <option value="">Todos</option>
                                ${values.map(v => `<option value="${v}">${v}</option>`).join('')}
                            </select>
                        `;
                        dynamicFiltersContainer.appendChild(filterDiv);
                    }
                }
            });
        }
    }

    function applyFiltersToChart() {
        if (!currentLoadedData || !currentDatasetId) return;

        let filteredData = currentLoadedData;

        // Aplica filtro de subsistema
        if (currentFilters.subsistema && currentFilters.subsistema !== '') {
            filteredData = filteredData.filter(r => r.nom_subsistema === currentFilters.subsistema);
        }

        // Re-renderiza com dados filtrados
        renderDatasetVisualization(currentDatasetId, filteredData);
    }

    // --- CARREGAMENTO DE DADOS --- //
    async function loadONSData() {
        const datasetId = datasetSelector.value;

        if (!datasetId) {
            aiResponseBox.innerHTML = '<p class="text-yellow-600">Por favor, selecione um dataset.</p>';
            return;
        }

        let startDate, endDate;

        // Determina período baseado no modo
        if (timeMode === 'custom') {
            startDate = startDateInput.value;
            endDate = endDateInput.value;

            if (!startDate || !endDate) {
                aiResponseBox.innerHTML = '<p class="text-yellow-600">Por favor, selecione início e fim do período.</p>';
                return;
            }
        } else {
            // Modo relativo: calcula período baseado na seleção
            const relativeValue = relativeTimeSelect.value;
            const period = calculateRelativePeriod(relativeValue);
            startDate = period.start;
            endDate = period.end;
        }

        try {
            aiResponseBox.innerHTML = '<p class="text-blue-600">⏳ Carregando dados...</p>';

            const datasetInfo = getDatasetInfo(datasetId);
            const metadata = getDatasetMetadata(datasetId);
            let data = await loadDatasetData(datasetId, startDate, endDate);

            // Se não houver dados, usa dados mock
            if (data.length === 0) {
                console.log('⚠️ Nenhum dado encontrado. Gerando dados de demonstração...');
                console.log('💡 Dica: Inicie o servidor HTTP com "python3 server.py" para carregar dados reais.');
                data = generateMockData(datasetId, startDate, endDate);

                if (data.length === 0) {
                    console.error('❌ Falha ao gerar dados mock');
                    return;
                }
            }

            currentLoadedData = data;
            currentDatasetId = datasetId;

            // Formata datas para exibição
            let displayPeriod;
            if (timeMode === 'custom') {
                const startFormatted = new Date(startDate).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                });
                const endFormatted = new Date(endDate).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                });
                displayPeriod = `📅 ${startFormatted} até ${endFormatted}`;
            } else {
                const relativeValue = relativeTimeSelect.value;
                const relativeLabels = {
                    '1h': 'Última 1 hora',
                    '3h': 'Últimas 3 horas',
                    '6h': 'Últimas 6 horas',
                    '12h': 'Últimas 12 horas',
                    '1d': 'Último 1 dia',
                    '3d': 'Últimos 3 dias',
                    '7d': 'Últimos 7 dias',
                    '14d': 'Últimos 14 dias',
                    '30d': 'Últimos 30 dias',
                    '90d': 'Últimos 90 dias'
                };
                displayPeriod = `⏰ ${relativeLabels[relativeValue] || relativeValue}`;
            }

            aiResponseBox.innerHTML = `
                <div class="space-y-2">
                    <p class="font-medium text-green-600">✓ Dados carregados!</p>
                    <div class="text-sm text-gray-700 space-y-1">
                        <p><strong>${datasetInfo.name}</strong></p>
                        <p>${displayPeriod}</p>
                        <p>📊 ${data.length.toLocaleString('pt-BR')} registros</p>
                    </div>
                    ${metadata && metadata.dictionaryUrl ? `
                        <a href="${metadata.dictionaryUrl}" target="_blank" class="text-xs text-blue-600 hover:underline">
                            📄 Ver dicionário de dados
                        </a>
                    ` : ''}
                </div>
            `;

            createDynamicFilters(datasetId);
            updateDynamicFAQs(datasetId, data);
            renderDatasetVisualization(datasetId, data);
            updateCards(data);

        } catch (error) {
            aiResponseBox.innerHTML = `<p class="text-red-600">Erro: ${error.message}</p>`;
            console.error('Erro ao carregar dados:', error);
        }
    }

    // --- ATUALIZA CARDS --- //
    function updateCards(data) {
        if (!data || data.length === 0) return;

        // Calcula estatísticas
        const values = data.map(r => parseFloat(r.val_cargaenergiahomwmed || r.val_geracao || 0)).filter(v => !isNaN(v));

        if (values.length > 0) {
            const total = values.reduce((a, b) => a + b, 0);
            const avg = total / values.length;
            const max = Math.max(...values);

            cardGeracao.textContent = `${(total / 1000).toFixed(1)}k`;
            cardCarga.textContent = max.toFixed(0);
            cardReserva.textContent = `${(avg / max * 100).toFixed(0)}%`;
        }
    }

    // --- RENDERIZA VISUALIZAÇÃO --- //
    function renderDatasetVisualization(datasetId, data, visualizationType = 'auto') {
        const metadata = getDatasetMetadata(datasetId);
        if (!metadata || !data.length) return;

        const vizConfig = suggestVisualization(datasetId, data);
        if (!vizConfig) return;

        // Agrupa dados por tempo e subsistema
        const dataByTime = {};
        const subsystems = new Set();

        data.forEach(row => {
            const time = row.din_instante;
            const subsystem = row.nom_subsistema;
            const value = parseFloat(row.val_cargaenergiahomwmed || row.val_geracao || 0);

            if (!time || !subsystem || isNaN(value)) return;

            subsystems.add(subsystem);

            if (!dataByTime[time]) {
                dataByTime[time] = {};
            }
            dataByTime[time][subsystem] = value;
        });

        const times = Object.keys(dataByTime).sort();
        const subsystemList = Array.from(subsystems).sort();

        // Formata labels
        const labels = times.map(t => {
            const date = new Date(t);
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        });

        // Cores por subsistema/tipo
        const colors = {
            'NORTE': '#2ecc71',
            'NORDESTE': '#f1c40f',
            'SUL': '#3498db',
            'SUDESTE': '#e74c3c',
            'Hidráulica': '#3498db',
            'Térmica': '#95a5a6',
            'Eólica': '#2ecc71',
            'Solar': '#f39c12',
            'Nuclear': '#9b59b6'
        };

        // Determina tipo de visualização
        const shouldStack = visualizationType === 'stacked' ||
                           (visualizationType === 'auto' && subsystemList.length > 2);

        // Prepara séries
        const series = subsystemList.map(subsystem => {
            const data = times.map(time => dataByTime[time][subsystem] || 0);

            return {
                name: subsystem,
                type: 'bar',
                stack: shouldStack ? 'total' : undefined,
                data: data,
                itemStyle: {
                    color: colors[subsystem] || '#95a5a6'
                },
                emphasis: {
                    focus: shouldStack ? 'series' : 'none'
                }
            };
        });

        // Adiciona linha de carga total (se empilhado)
        if (shouldStack) {
            const totalData = times.map(time => {
                return subsystemList.reduce((sum, subsystem) => {
                    return sum + (dataByTime[time][subsystem] || 0);
                }, 0);
            });

            series.push({
                name: 'Carga Total',
                type: 'line',
                data: totalData,
                lineStyle: {
                    color: '#e74c3c',
                    width: 3
                },
                itemStyle: {
                    color: '#e74c3c'
                },
                symbol: 'circle',
                symbolSize: 6,
                z: 10
            });
        }

        // Configuração do gráfico
        const option = {
            title: {
                text: vizConfig.title,
                left: 'center',
                textStyle: { fontSize: 18, color: '#002246', fontWeight: 'bold' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function(params) {
                    let tooltip = `<strong>${params[0].axisValue}</strong><br/>`;
                    params.forEach(item => {
                        tooltip += `${item.marker} ${item.seriesName}: <strong>${item.value.toFixed(1)} MW</strong><br/>`;
                    });
                    return tooltip;
                }
            },
            legend: {
                data: [...subsystemList, ...(shouldStack ? ['Carga Total'] : [])],
                top: 35,
                type: 'scroll',
                selected: currentSeriesVisibility
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: 90,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: labels,
                axisLabel: {
                    rotate: 45,
                    fontSize: 10,
                    interval: Math.floor(labels.length / 20) || 0
                }
            },
            yAxis: {
                type: 'value',
                name: 'Potência (MW)',
                nameTextStyle: { fontSize: 12 },
                axisLabel: {
                    formatter: '{value}',
                    fontSize: 11
                }
            },
            series: series,
            dataZoom: [
                {
                    type: 'slider',
                    start: 0,
                    end: 100,
                    height: 30,
                    bottom: 10
                },
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                }
            ]
        };

        energyChart.setOption(option, true);

        // Atualiza visibilidade
        if (Object.keys(currentSeriesVisibility).length === 0) {
            subsystemList.forEach(name => {
                currentSeriesVisibility[name] = true;
            });
        }

        updateChartToggles([...subsystemList, ...(shouldStack ? ['Carga Total'] : [])]);

        console.log(`📈 Visualização: ${shouldStack ? 'Empilhada' : 'Lado a lado'} (${series.length} séries, ${times.length} pontos)`);
    }

    // --- CONTROLES DE TOGGLE --- //
    function updateChartToggles(seriesNames) {
        chartToggles.innerHTML = '';

        const colors = {
            'NORTE': '#2ecc71',
            'NORDESTE': '#f1c40f',
            'SUL': '#3498db',
            'SUDESTE': '#e74c3c'
        };

        seriesNames.forEach(name => {
            const button = document.createElement('button');
            button.className = 'px-3 py-1 rounded-lg text-sm font-medium transition-all';
            button.style.backgroundColor = colors[name] || '#95a5a6';
            button.style.color = 'white';
            button.textContent = name;

            button.onclick = () => {
                currentSeriesVisibility[name] = !currentSeriesVisibility[name];

                const currentOption = energyChart.getOption();
                const seriesIndex = currentOption.legend[0].data.indexOf(name);

                energyChart.dispatchAction({
                    type: currentSeriesVisibility[name] ? 'legendSelect' : 'legendUnSelect',
                    name: name
                });

                button.style.opacity = currentSeriesVisibility[name] ? '1' : '0.4';
            };

            chartToggles.appendChild(button);
        });
    }

    // --- FAQS DINÂMICAS --- //
    function updateDynamicFAQs(datasetId, data) {
        const metadata = getDatasetMetadata(datasetId);
        if (!metadata) return;

        const context = {
            date: startDateInput.value,
            subsistema: currentFilters.subsistema || ''
        };
        const questions = generateContextualQuestions(datasetId, context);

        faqContainer.innerHTML = '';
        questions.forEach(q => {
            const button = document.createElement('button');
            button.className = 'bg-gradient-to-r from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 text-dark-blue text-sm font-medium py-2 px-3 rounded-lg transition shadow-sm';
            button.textContent = q;
            button.onclick = () => {
                aiQuestionInput.value = q;
                handleContextualQuestion(q);
            };
            faqContainer.appendChild(button);
        });
    }

    // --- ANÁLISES CONTEXTUAIS --- //
    async function handleContextualQuestion(question) {
        if (!currentLoadedData) {
            aiResponseBox.innerHTML = '<p class="text-yellow-600">Carregue um dataset primeiro.</p>';
            return;
        }

        const lowerQ = question.toLowerCase();

        // Mostra loading
        aiResponseBox.innerHTML = '<p class="text-blue-600">🤔 Analisando...</p>';

        // Prepara contexto para o LLM
        const metadata = getDatasetMetadata(currentDatasetId);
        const context = {
            datasetName: metadata?.name || 'Dataset',
            datasetDescription: metadata?.description || '',
            dataCount: currentLoadedData.length,
            timeRange: timeMode === 'custom'
                ? `${startDateInput.value} até ${endDateInput.value}`
                : relativeTimeSelect.options[relativeTimeSelect.selectedIndex].text,
            subsystems: metadata?.subsystems || [],
            data: currentLoadedData
        };

        try {
            // Chama o LLM (ou fallback local)
            const response = await queryLLM(question, context);

            // Exibe resposta formatada
            aiResponseBox.innerHTML = `
                <div class="space-y-2">
                    <p class="font-medium text-dark-blue">💬 Resposta:</p>
                    <div class="text-sm text-gray-700 whitespace-pre-line">${response}</div>
                </div>
            `;
        } catch (error) {
            aiResponseBox.innerHTML = `<p class="text-red-600">❌ Erro: ${error.message}</p>`;
        }

        // Visualizações dinâmicas baseadas na pergunta
        if (lowerQ.includes('maior') || lowerQ.includes('máximo') || lowerQ.includes('maximo')) {
            highlightMaxSubsystem();
        } else if (lowerQ.includes('compare') || lowerQ.includes('comparar')) {
            renderDatasetVisualization(currentDatasetId, currentLoadedData, 'side-by-side');
        } else if (lowerQ.includes('pico')) {
            zoomToPeakPeriod();
        } else if (lowerQ.includes('evolução') || lowerQ.includes('evolucao') || lowerQ.includes('tendência')) {
            showEvolution();
        } else if (lowerQ.includes('total') || lowerQ.includes('soma')) {
            showTotalStack();
        } else if (lowerQ.includes('isolar') || lowerQ.includes('apenas') || lowerQ.includes('somente')) {
            isolateSubsystem(lowerQ);
        } else if (lowerQ.includes('todas') || lowerQ.includes('tudo') || lowerQ.includes('todos')) {
            showAllSeries();
        } else {
            aiResponseBox.innerHTML = `<p>Analisando: "${question}"...</p>`;
        }
    }

    // Destaca subsistema com maior valor
    function highlightMaxSubsystem() {
        const maxBySubsystem = {};
        currentLoadedData.forEach(row => {
            const sub = row.nom_subsistema;
            const val = parseFloat(row.val_cargaenergiahomwmed || 0);
            if (!maxBySubsystem[sub] || val > maxBySubsystem[sub]) {
                maxBySubsystem[sub] = val;
            }
        });

        const maxSubsystem = Object.entries(maxBySubsystem)
            .sort((a, b) => b[1] - a[1])[0][0];

        // Mantém apenas o maior visível
        Object.keys(currentSeriesVisibility).forEach(name => {
            currentSeriesVisibility[name] = (name === maxSubsystem || name === 'Carga Total');
        });

        renderDatasetVisualization(currentDatasetId, currentLoadedData, 'stacked');
    }

    // Zoom no período de pico
    function zoomToPeakPeriod() {
        const values = currentLoadedData.map((r, i) => ({
            index: i,
            value: parseFloat(r.val_cargaenergiahomwmed || 0)
        }));

        values.sort((a, b) => b.value - a.value);
        const peakIndex = values[0].index;

        // Zoom em ±10 pontos do pico
        const totalPoints = currentLoadedData.length;
        const start = Math.max(0, (peakIndex - 10) / totalPoints * 100);
        const end = Math.min(100, (peakIndex + 10) / totalPoints * 100);

        energyChart.dispatchAction({
            type: 'dataZoom',
            start: start,
            end: end
        });
    }

    // Mostra evolução (gráfico empilhado com linha)
    function showEvolution() {
        showAllSeries();
        renderDatasetVisualization(currentDatasetId, currentLoadedData, 'stacked');
        aiResponseBox.innerHTML = `
            <div class="space-y-2">
                <p class="font-semibold text-dark-blue">📈 Evolução da Carga</p>
                <p class="text-sm">Visualização empilhada mostrando a composição da carga ao longo do tempo.</p>
                <p class="text-sm">A linha vermelha indica a carga total do sistema.</p>
            </div>
        `;
    }

    // Mostra total empilhado
    function showTotalStack() {
        showAllSeries();
        renderDatasetVisualization(currentDatasetId, currentLoadedData, 'stacked');
        aiResponseBox.innerHTML = `
            <div class="space-y-2">
                <p class="font-semibold text-dark-blue">📊 Carga Total por Subsistema</p>
                <p class="text-sm">Barras empilhadas mostram a contribuição de cada subsistema.</p>
            </div>
        `;
    }

    // Isola subsistema específico
    function isolateSubsystem(question) {
        const subsystems = ['NORTE', 'NORDESTE', 'SUL', 'SUDESTE'];
        const found = subsystems.find(sub => question.includes(sub.toLowerCase()));

        if (found) {
            Object.keys(currentSeriesVisibility).forEach(name => {
                currentSeriesVisibility[name] = (name === found || name === 'Carga Total');
            });
            renderDatasetVisualization(currentDatasetId, currentLoadedData, 'stacked');
            aiResponseBox.innerHTML = `<p class="text-sm">🔍 Isolando subsistema: <strong>${found}</strong></p>`;
        }
    }

    // Mostra todas as séries
    function showAllSeries() {
        Object.keys(currentSeriesVisibility).forEach(name => {
            currentSeriesVisibility[name] = true;
        });
        renderDatasetVisualization(currentDatasetId, currentLoadedData, 'stacked');
    }

    function analyzeMaxValues() {
        const maxByGroup = {};
        currentLoadedData.forEach(row => {
            const group = row.nom_subsistema || 'Geral';
            const value = parseFloat(row.val_cargaenergiahomwmed || row.val_geracao || 0);
            if (!isNaN(value) && (!maxByGroup[group] || value > maxByGroup[group])) {
                maxByGroup[group] = value;
            }
        });

        let html = '<div class="space-y-2"><p class="font-semibold text-dark-blue">📊 Valores Máximos:</p>';
        Object.entries(maxByGroup).forEach(([group, value]) => {
            html += `<p class="text-sm"><strong>${group}:</strong> ${value.toFixed(2)} MW</p>`;
        });
        html += '</div>';
        aiResponseBox.innerHTML = html;
    }

    function compareSubsystems() {
        const groups = getUniqueValues(currentLoadedData, 'nom_subsistema');
        const avgByGroup = {};

        groups.forEach(group => {
            const values = currentLoadedData
                .filter(r => r.nom_subsistema === group)
                .map(r => parseFloat(r.val_cargaenergiahomwmed || 0))
                .filter(v => !isNaN(v));
            avgByGroup[group] = values.reduce((a, b) => a + b, 0) / values.length;
        });

        let html = '<div class="space-y-2"><p class="font-semibold text-dark-blue">📊 Comparação:</p>';
        Object.entries(avgByGroup).sort((a, b) => b[1] - a[1]).forEach(([group, avg]) => {
            html += `<p class="text-sm"><strong>${group}:</strong> ${avg.toFixed(2)} MW (média)</p>`;
        });
        html += '</div>';
        aiResponseBox.innerHTML = html;
    }

    function findPeakValues() {
        const values = currentLoadedData.map(r => ({
            value: parseFloat(r.val_cargaenergiahomwmed || r.val_geracao || 0),
            time: r.din_instante,
            group: r.nom_subsistema || 'Geral'
        })).filter(v => !isNaN(v.value));

        values.sort((a, b) => b.value - a.value);
        const top5 = values.slice(0, 5);

        let html = '<div class="space-y-2"><p class="font-semibold text-dark-blue">⚡ Top 5 Picos:</p>';
        top5.forEach((item, i) => {
            const date = new Date(item.time).toLocaleString('pt-BR', { hour12: false });
            html += `<p class="text-sm">${i + 1}. <strong>${item.value.toFixed(2)} MW</strong> - ${item.group} (${date})</p>`;
        });
        html += '</div>';
        aiResponseBox.innerHTML = html;
    }

    function calculateAverages() {
        const values = currentLoadedData
            .map(r => parseFloat(r.val_cargaenergiahomwmed || r.val_geracao || 0))
            .filter(v => !isNaN(v));

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        aiResponseBox.innerHTML = `
            <div class="space-y-2">
                <p class="font-semibold text-dark-blue">📈 Estatísticas:</p>
                <p class="text-sm"><strong>Média:</strong> ${avg.toFixed(2)} MW</p>
                <p class="text-sm"><strong>Mínimo:</strong> ${min.toFixed(2)} MW</p>
                <p class="text-sm"><strong>Máximo:</strong> ${max.toFixed(2)} MW</p>
            </div>
        `;
    }

    // --- EVENT LISTENERS --- //
    datasetSelector.addEventListener('change', () => {
        const datasetId = datasetSelector.value;
        if (datasetId) {
            // Carrega dados do novo dataset
            loadONSData();
        }
    });

    // Event listeners para modo Range
    startDateInput.addEventListener('change', () => {
        if (timeMode === 'range' && datasetSelector.value && startDateInput.value && endDateInput.value) {
            loadONSData();
        }
    });

    endDateInput.addEventListener('change', () => {
        if (timeMode === 'custom' && datasetSelector.value && startDateInput.value && endDateInput.value) {
            loadONSData();
        }
    });

    // Event listener para modo Relativo
    relativeTimeSelect.addEventListener('change', () => {
        if (timeMode === 'relative' && datasetSelector.value) {
            loadONSData();
        }
    });

    // Event listeners para toggle de modo
    modeCustomBtn.addEventListener('click', () => switchTimeMode('custom'));
    modeRelativeBtn.addEventListener('click', () => switchTimeMode('relative'));

    askButton.addEventListener('click', () => {
        const question = aiQuestionInput.value.trim();
        if (question) {
            handleContextualQuestion(question);
            aiQuestionInput.value = '';
        }
    });

    // Responsividade do gráfico
    window.addEventListener('resize', () => {
        energyChart.resize();
    });

    // --- INICIALIZAÇÃO --- //
    initializeDateInputs();

    // Carrega dataset padrão automaticamente
    setTimeout(() => {
        datasetSelector.value = 'hourly-curve';
        const event = new Event('change');
        datasetSelector.dispatchEvent(event);

        // Carrega dados automaticamente após 500ms
        setTimeout(() => {
            loadONSData();
        }, 500);
    }, 100);

    console.log('✓ LUMIA inicializado com ECharts');
});
document.addEventListener('DOMContentLoaded', () => {
    const QA_PAIRS = [
        {
            keywords: ['previsão', 'demanda', 'próximo trimestre'],
            answer: 'A previsão de demanda para o próximo trimestre indica um aumento de 5%, impulsionado principalmente pelo setor industrial. Recomenda-se monitorar a capacidade de geração nos horários de pico.',
            chart_action: { title: 'Previsão de Demanda vs. Geração Atual', show: ['Carga', 'Hidráulica', 'Térmica', 'Eólica', 'Solar'] }
        },
        {
            keywords: ['fonte mais utilizada', 'principal fonte'],
            answer: 'No contexto geral do sistema, a geração Hidráulica é a fonte mais utilizada, correspondendo a aproximadamente 60% da matriz energética.',
            chart_action: { title: 'Principal Fonte: Geração Hidráulica vs. Carga', show: ['Hidráulica', 'Carga'] }
        },
        {
            keywords: ['10 de maio de 2023', '10/05/2023'],
            answer: 'Dados para 10 de maio de 2023 carregados. Este foi um dia com alta geração solar no período da tarde.',
            action: (elements) => {
                elements.yearSelector.value = 2023;
                elements.monthSelector.value = 5;
                elements.daySelector.value = 10;
                updateDashboard();
            }
        },
        {
            keywords: ['custo da energia', 'preço'],
            answer: 'O custo médio da energia (PLD) na última semana foi de R$ 120/MWh, uma redução de 5% em relação à semana anterior devido à alta geração eólica.',
            chart_action: { title: 'Análise de Custo: G. Térmica e Eólica vs. Carga', show: ['Térmica', 'Eólica', 'Carga'] }
        },
        {
            keywords: ['reserva hídrica', 'nível dos reservatórios'],
            answer: 'O nível agregado dos reservatórios do subsistema está em 72%, um patamar confortável para esta época do ano.',
        }
    ];

    // --- ELEMENTOS DO DOM --- //
    const subsistemaSelector = document.getElementById('subsistema-selector');
    const yearSelector = document.getElementById('year-selector');
    const monthSelector = document.getElementById('month-selector');
    const daySelector = document.getElementById('day-selector');
    const hourSelector = document.getElementById('hour-selector');
    const datasetSelector = document.getElementById('dataset-selector');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const askButton = document.getElementById('ask-button');
    const aiQuestionInput = document.getElementById('ai-question');
    const aiResponseBox = document.getElementById('ai-response');
    const faqContainer = document.getElementById('faq-container');
    const chartToggles = document.getElementById('chart-toggles');
    const cardGeracao = document.getElementById('card-geracao');
    const cardCarga = document.getElementById('card-carga');
    const cardReserva = document.getElementById('card-reserva');

    // --- GRÁFICO --- //
    const ctx = document.getElementById('energyChart').getContext('2d');
    const energyChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Curvas de Carga e Geração (MW)', font: { size: 18 }, color: '#002246' },
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Potência (MW)' }, stacked: true },
                x: { stacked: true, title: { display: true, text: 'Período' } }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });

    // --- FUNÇÕES --- //

    function populateTimeFilters() {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1990; year--) {
            yearSelector.add(new Option(year, year));
        }

        for (let month = 1; month <= 12; month++) {
            monthSelector.add(new Option(month, month));
        }

        for (let day = 1; day <= 31; day++) {
            daySelector.add(new Option(day, day));
        }

        for (let hour = 0; hour <= 23; hour++) {
            hourSelector.add(new Option(`${hour.toString().padStart(2, '0')}h`, hour));
        }
        
        // Define uma data padrão para a primeira visualização
        yearSelector.value = 2023;
        monthSelector.value = 5;
        daySelector.value = 10;
    }

    function updateDashboard() {
        const year = yearSelector.value;
        const month = monthSelector.value;
        const day = daySelector.value;
        const subsistema = subsistemaSelector.value;

        const data = getMockData(year, month, day, subsistema);
        
        cardGeracao.textContent = data.cards.geracao;
        cardCarga.textContent = data.cards.carga;
        cardReserva.textContent = data.cards.reserva;

        energyChart.data.labels = data.chart.labels;
        energyChart.data.datasets = data.chart.datasets.map(ds => ({
            ...ds,
            backgroundColor: ds.type === 'line' ? ds.color.replace('1)', '0.1)') : ds.color,
            borderColor: ds.color
        }));
        
        energyChart.options.plugins.title.text = `Curvas de Carga e Geração - ${day}/${month}/${year}`;
        updateChartToggles();
        energyChart.update();

        const faqData = FAQ_DATA[subsistema] || FAQ_DATA['geral'];
        faqContainer.innerHTML = '';
        faqData.forEach(q => {
            const faqButton = document.createElement('button');
            faqButton.className = 'bg-gray-200 hover:bg-gray-300 text-dark-blue text-sm font-medium py-1 px-3 rounded-full transition';
            faqButton.textContent = q;
            faqButton.onclick = () => { aiQuestionInput.value = q; askButton.click(); };
            faqContainer.appendChild(faqButton);
        });
    }

    function updateChartToggles() {
        chartToggles.innerHTML = '';
        energyChart.data.datasets.forEach((dataset, index) => {
            const label = document.createElement('label');
            label.className = 'flex items-center cursor-pointer p-1.5 rounded-md hover:bg-gray-100 transition-colors font-medium text-gray-700';
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'w-5 h-5 border-2 rounded-md mr-2 flex-shrink-0 flex items-center justify-center transition-all duration-200';
            checkboxDiv.style.borderColor = dataset.borderColor;
            const checkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            checkIcon.setAttribute('class', 'w-3.5 h-3.5 text-white');
            checkIcon.setAttribute('fill', 'none');
            checkIcon.setAttribute('viewBox', '0 0 24 24');
            checkIcon.setAttribute('stroke', 'currentColor');
            checkIcon.setAttribute('stroke-width', '4');
            checkIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />`;
            checkboxDiv.appendChild(checkIcon);
            const text = document.createTextNode(dataset.label);
            label.append(checkboxDiv, text);
            chartToggles.appendChild(label);

            const updateState = () => {
                const isVisible = energyChart.isDatasetVisible(index);
                checkboxDiv.style.backgroundColor = isVisible ? dataset.borderColor : 'transparent';
                checkIcon.style.display = isVisible ? 'block' : 'none';
            };

            label.onclick = (e) => {
                e.preventDefault();
                energyChart.setDatasetVisibility(index, !energyChart.isDatasetVisible(index));
                energyChart.update();
                updateState();
            };
            updateState();
        });
    }

    // Handler para perguntas contextuais (quando há dataset carregado)
    function handleContextualQuestion(question) {
        if (!currentLoadedData || !currentDatasetId) {
            handleQuestion(question);
            return;
        }

        const lowerQ = question.toLowerCase();
        const metadata = getDatasetMetadata(currentDatasetId);

        // Análises contextuais baseadas no dataset
        if (lowerQ.includes('qual') && lowerQ.includes('maior')) {
            analyzeMaxValues();
        } else if (lowerQ.includes('compare') || lowerQ.includes('comparar')) {
            compareSubsystems();
        } else if (lowerQ.includes('pico') || lowerQ.includes('máxima') || lowerQ.includes('máximo')) {
            findPeakValues();
        } else if (lowerQ.includes('média') || lowerQ.includes('media')) {
            calculateAverages();
        } else {
            // Fallback para handler genérico
            handleQuestion(question);
        }
    }

    // Análise de valores máximos
    function analyzeMaxValues() {
        if (!currentLoadedData) return;

        const metadata = getDatasetMetadata(currentDatasetId);
        const valueColumn = metadata.columns.val_cargaenergiahomwmed ? 'val_cargaenergiahomwmed' :
                           metadata.columns.val_geracaohoraria ? 'val_geracaohoraria' : null;

        if (!valueColumn) {
            aiResponseBox.innerHTML = '<p>Não foi possível identificar a coluna de valores para análise.</p>';
            return;
        }

        const maxByGroup = {};
        currentLoadedData.forEach(row => {
            const group = row.nom_subsistema || row.nom_usina || 'Geral';
            const value = parseFloat(row[valueColumn]);
            if (!isNaN(value)) {
                if (!maxByGroup[group] || value > maxByGroup[group].value) {
                    maxByGroup[group] = { value, row };
                }
            }
        });

        let response = '<div class="space-y-2"><p class="font-semibold text-dark-blue">📊 Valores Máximos:</p>';
        Object.entries(maxByGroup).forEach(([group, data]) => {
            response += `<p class="text-sm"><strong>${group}:</strong> ${data.value.toFixed(2)} MW</p>`;
        });
        response += '</div>';
        aiResponseBox.innerHTML = response;
    }

    // Comparação entre subsistemas
    function compareSubsystems() {
        if (!currentLoadedData) return;

        const groups = getUniqueValues(currentLoadedData, 'nom_subsistema');
        const avgByGroup = {};

        groups.forEach(group => {
            const groupData = currentLoadedData.filter(r => r.nom_subsistema === group);
            const values = groupData.map(r => parseFloat(r.val_cargaenergiahomwmed)).filter(v => !isNaN(v));
            avgByGroup[group] = values.reduce((a, b) => a + b, 0) / values.length;
        });

        let response = '<div class="space-y-2"><p class="font-semibold text-dark-blue">📊 Comparação entre Subsistemas:</p>';
        Object.entries(avgByGroup).sort((a, b) => b[1] - a[1]).forEach(([group, avg]) => {
            response += `<p class="text-sm"><strong>${group}:</strong> ${avg.toFixed(2)} MW (média)</p>`;
        });
        response += '</div>';
        aiResponseBox.innerHTML = response;
    }

    // Encontrar valores de pico
    function findPeakValues() {
        if (!currentLoadedData) return;

        const values = currentLoadedData.map(r => ({
            value: parseFloat(r.val_cargaenergiahomwmed || r.val_geracaohoraria),
            time: r.din_instante,
            group: r.nom_subsistema || r.nom_usina
        })).filter(v => !isNaN(v.value));

        values.sort((a, b) => b.value - a.value);
        const top5 = values.slice(0, 5);

        let response = '<div class="space-y-2"><p class="font-semibold text-dark-blue">⚡ Top 5 Valores de Pico:</p>';
        top5.forEach((item, i) => {
            response += `<p class="text-sm">${i + 1}. <strong>${item.value.toFixed(2)} MW</strong> - ${item.group} em ${new Date(item.time).toLocaleString('pt-BR')}</p>`;
        });
        response += '</div>';
        aiResponseBox.innerHTML = response;
    }

    // Calcular médias
    function calculateAverages() {
        if (!currentLoadedData) return;

        const valueColumn = 'val_cargaenergiahomwmed';
        const values = currentLoadedData.map(r => parseFloat(r[valueColumn])).filter(v => !isNaN(v));

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        aiResponseBox.innerHTML = `
            <div class="space-y-2">
                <p class="font-semibold text-dark-blue">📈 Estatísticas do Período:</p>
                <p class="text-sm"><strong>Média:</strong> ${avg.toFixed(2)} MW</p>
                <p class="text-sm"><strong>Mínimo:</strong> ${min.toFixed(2)} MW</p>
                <p class="text-sm"><strong>Máximo:</strong> ${max.toFixed(2)} MW</p>
                <p class="text-sm"><strong>Amplitude:</strong> ${(max - min).toFixed(2)} MW</p>
            </div>
        `;
    }

    function handleQuestion(question) {
        const lowerCaseQuestion = question.toLowerCase();

        for (const qa of QA_PAIRS) {
            if (qa.keywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
                aiResponseBox.innerHTML = `<p>${qa.answer}</p>`;

                if (qa.chart_action) {
                    const action = qa.chart_action;
                    if (action.title) energyChart.options.plugins.title.text = action.title;
                    if (action.show) {
                        energyChart.data.datasets.forEach((ds, index) => {
                            energyChart.setDatasetVisibility(index, action.show.includes(ds.label));
                        });
                    }
                    energyChart.update();
                    updateChartToggles();
                }
                if (qa.action) {
                    qa.action({ yearSelector, monthSelector, daySelector, subsistemaSelector });
                }
                return;
            }
        }

        let responseText = `Analisando: "${question}". `;
        const keywords = { eólica: ['eólica', 'vento'], solar: ['solar', 'sol'], hidráulica: ['hidráulica', 'água'], térmica: ['térmica', 'termoelétrica'], carga: ['carga', 'consumo'] };
        let foundAction = false;

        if (lowerCaseQuestion.includes('todas') || lowerCaseQuestion.includes('tudo')) {
            energyChart.data.datasets.forEach((_, index) => energyChart.setDatasetVisibility(index, true));
            responseText += "Exibindo todas as fontes de geração e a curva de carga.";
            foundAction = true;
        } else if (lowerCaseQuestion.includes('isolar') || lowerCaseQuestion.includes('apenas') || lowerCaseQuestion.includes('somente')) {
            let foundKeyword = false;
            energyChart.data.datasets.forEach((ds, index) => {
                const key = Object.keys(keywords).find(k => keywords[k].some(kw => lowerCaseQuestion.includes(kw)));
                if (key && ds.label.toLowerCase().includes(key)) {
                    energyChart.setDatasetVisibility(index, true);
                    responseText += `Isolando a geração ${key}.`;
                    foundKeyword = true;
                } else {
                    energyChart.setDatasetVisibility(index, false);
                }
            });
            if (!foundKeyword) responseText += "Não entendi qual fonte isolar.";
            foundAction = true;
        } else if (lowerCaseQuestion.includes('comparar')) {
            energyChart.data.datasets.forEach((_, index) => energyChart.setDatasetVisibility(index, false));
            let comparedSources = [];
            Object.keys(keywords).forEach(key => {
                if (keywords[key].some(kw => lowerCaseQuestion.includes(kw))) {
                    const dsIndex = energyChart.data.datasets.findIndex(ds => ds.label.toLowerCase().includes(key));
                    if (dsIndex !== -1) {
                        energyChart.setDatasetVisibility(dsIndex, true);
                        comparedSources.push(key);
                    }
                }
            });
            if (comparedSources.length > 1) {
                responseText += `Comparando ${comparedSources.join(' e ')}.`;
            } else {
                 responseText += "Não encontrei fontes suficientes para comparar.";
            }
            foundAction = true;
        }

        if (foundAction) {
            const year = yearSelector.value;
            const month = monthSelector.value;
            const day = daySelector.value;
            energyChart.options.plugins.title.text = `Curvas de Carga e Geração - ${day}/${month}/${year}`;
        } else {
            responseText = `Não tenho uma resposta pronta para "${question}", mas a performance geral, com base nos dados de ${subsistemaSelector.options[subsistemaSelector.selectedIndex].text}, está dentro do esperado.`;
        }

        energyChart.update();
        updateChartToggles();
        aiResponseBox.innerHTML = `<p>${responseText}</p>`;
    }

    // Variável global para armazenar dados carregados
    let currentLoadedData = null;
    let currentDatasetId = null;

    // Função para carregar dados reais do ONS
    async function loadONSData() {
        const datasetId = datasetSelector.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!datasetId || !startDate || !endDate) {
            aiResponseBox.innerHTML = '<p class="text-yellow-600">Por favor, selecione um dataset e período para carregar dados reais.</p>';
            return;
        }

        try {
            aiResponseBox.innerHTML = '<p class="text-blue-600">⏳ Carregando dados do ONS...</p>';

            const datasetInfo = getDatasetInfo(datasetId);
            const data = await loadDatasetData(datasetId, startDate, endDate);

            if (data.length === 0) {
                aiResponseBox.innerHTML = `<p class="text-orange-600">Nenhum dado encontrado para o período selecionado. Os arquivos podem não estar disponíveis no S3 do ONS.</p>
                <p class="text-sm text-gray-600 mt-2">Você pode explorar o bucket com o comando:</p>
                <code class="block bg-gray-100 p-2 rounded mt-1 text-xs">${getAWSCLICommand(datasetId)}</code>`;
                return;
            }

            // Armazena dados carregados
            currentLoadedData = data;
            currentDatasetId = datasetId;

            // Gera resumo contextual
            const summary = generateDatasetSummary(datasetId, data);
            const metadata = getDatasetMetadata(datasetId);

            aiResponseBox.innerHTML = `
                <div class="space-y-2">
                    <p class="font-medium text-green-600">✓ Dados carregados com sucesso!</p>
                    <div class="text-sm text-gray-700 space-y-1">
                        <p><strong>${datasetInfo.name}</strong></p>
                        <p>📅 ${startDate} a ${endDate}</p>
                        <p>📊 ${data.length.toLocaleString('pt-BR')} registros</p>
                    </div>
                    ${metadata && metadata.dictionaryUrl ? `
                        <a href="${metadata.dictionaryUrl}" target="_blank" class="text-xs text-blue-600 hover:underline">
                            📄 Ver dicionário de dados
                        </a>
                    ` : ''}
                </div>
            `;

            // Atualiza perguntas sugeridas dinamicamente
            updateDynamicFAQs(datasetId, data);

            // Gera visualização automática
            renderDatasetVisualization(datasetId, data);

        } catch (error) {
            aiResponseBox.innerHTML = `<p class="text-red-600">Erro ao carregar dados: ${error.message}</p>
            <p class="text-sm text-gray-600 mt-2">Verifique a conexão ou tente outro período.</p>`;
        }
    }

    // Atualiza FAQs dinamicamente baseado no dataset
    function updateDynamicFAQs(datasetId, data) {
        const metadata = getDatasetMetadata(datasetId);
        if (!metadata) return;

        // Gera perguntas contextuais
        const context = {
            date: startDateInput.value,
            subsistema: subsistemaSelector.value
        };
        const questions = generateContextualQuestions(datasetId, context);

        // Limpa e adiciona novas FAQs
        faqContainer.innerHTML = '';
        questions.forEach(q => {
            const faqButton = document.createElement('button');
            faqButton.className = 'bg-gradient-to-r from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 text-dark-blue text-sm font-medium py-2 px-3 rounded-lg transition shadow-sm';
            faqButton.textContent = q;
            faqButton.onclick = () => {
                aiQuestionInput.value = q;
                handleContextualQuestion(q);
            };
            faqContainer.appendChild(faqButton);
        });
    }

    // Renderiza visualização baseada nos metadados do dataset
    function renderDatasetVisualization(datasetId, data) {
        const metadata = getDatasetMetadata(datasetId);
        if (!metadata || !data.length) return;

        const vizConfig = suggestVisualization(datasetId, data);
        if (!vizConfig) return;

        // Prepara dados para o gráfico
        const labels = [];
        const datasets = {};

        // Para série temporal
        if (vizConfig.type === 'line' || vizConfig.type === 'bar') {
            const groupByField = vizConfig.groupBy;
            const xField = vizConfig.xAxis;
            const yField = vizConfig.yAxis;

            // Agrupa dados
            data.forEach(row => {
                const xValue = row[xField];
                const yValue = parseFloat(row[yField]);
                const group = row[groupByField];

                if (!xValue || isNaN(yValue)) return;

                if (!labels.includes(xValue)) {
                    labels.push(xValue);
                }

                if (!datasets[group]) {
                    datasets[group] = {
                        label: group,
                        data: [],
                        borderColor: getColorForGroup(group),
                        backgroundColor: getColorForGroup(group, 0.2)
                    };
                }

                datasets[group].data.push({ x: xValue, y: yValue });
            });

            // Atualiza gráfico
            energyChart.data.labels = labels.slice(0, 100); // Limita para performance
            energyChart.data.datasets = Object.values(datasets).map(ds => ({
                ...ds,
                type: vizConfig.type
            }));
            energyChart.options.plugins.title.text = vizConfig.title;
            energyChart.update();
            updateChartToggles();

            console.log(`📈 Visualização gerada: ${vizConfig.title}`);
        }
    }

    // Helper para gerar cores por grupo
    function getColorForGroup(group, alpha = 1) {
        const colors = {
            'NORTE': `rgba(46, 204, 113, ${alpha})`,
            'NORDESTE': `rgba(241, 196, 15, ${alpha})`,
            'SUL': `rgba(52, 152, 219, ${alpha})`,
            'SUDESTE': `rgba(231, 76, 60, ${alpha})`
        };
        return colors[group] || `rgba(149, 165, 166, ${alpha})`;
    }

    // --- EVENT LISTENERS --- //
    subsistemaSelector.addEventListener('change', () => updateDashboard());
    yearSelector.addEventListener('change', () => updateDashboard());
    monthSelector.addEventListener('change', () => updateDashboard());
    daySelector.addEventListener('change', () => updateDashboard());
    hourSelector.addEventListener('change', () => updateDashboard());

    // Listener para mudança de dataset
    datasetSelector.addEventListener('change', () => {
        const datasetId = datasetSelector.value;
        if (datasetId) {
            const info = getDatasetInfo(datasetId);
            aiResponseBox.innerHTML = `
                <p class="font-medium text-dark-blue">Dataset selecionado:</p>
                <p class="text-sm text-gray-700 mt-1"><strong>${info.name}</strong></p>
                <p class="text-xs text-gray-600 mt-1">${info.description}</p>
                <p class="text-xs text-gray-500 mt-2">Selecione o período e o sistema irá buscar os dados do S3 do ONS.</p>
            `;
        }
    });

    // Listener para mudança de datas
    startDateInput.addEventListener('change', () => {
        if (datasetSelector.value && startDateInput.value && endDateInput.value) {
            loadONSData();
        }
    });

    endDateInput.addEventListener('change', () => {
        if (datasetSelector.value && startDateInput.value && endDateInput.value) {
            loadONSData();
        }
    });

    // Inicializa as datas com valores padrão
    function initializeDateInputs() {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        startDateInput.value = lastWeek.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
    }

    askButton.addEventListener('click', () => {
        const question = aiQuestionInput.value;
        askButton.classList.add('button-clicked');
        setTimeout(() => askButton.classList.remove('button-clicked'), 300);
        if (question.trim() === "") {
            aiResponseBox.innerHTML = '<p>Por favor, digite sua pergunta.</p>';
            return;
        }
        handleQuestion(question);
        aiQuestionInput.value = '';
    });

    // Função para atualizar datasets em background
    async function updateDatasetsInBackground() {
        console.log('🔄 Verificando atualizações de datasets...');

        const currentYear = new Date().getFullYear();
        const datasetId = 'hourly-curve';

        try {
            // Tenta baixar dados do ano atual do S3
            const files = getDatasetFiles(datasetId, `${currentYear}-01-01`, `${currentYear}-12-31`);

            if (files.length > 0) {
                console.log(`📡 Atualizando dados de ${currentYear}...`);
                // Nota: Em produção, você implementaria um service worker ou backend
                // para salvar os novos dados localmente
            }
        } catch (error) {
            console.log('⚠️ Não foi possível atualizar datasets:', error.message);
        }
    }

    // --- INICIALIZAÇÃO --- //
    populateTimeFilters();
    initializeDateInputs();
    updateDashboard();

    // Atualiza datasets em background após 2 segundos
    setTimeout(() => {
        updateDatasetsInBackground();
    }, 2000);
});
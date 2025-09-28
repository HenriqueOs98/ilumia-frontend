document.addEventListener('DOMContentLoaded', () => {
    const MOCKED_DATA = {
        geral: {
            cards: { geracao: '125.800', carga: '15.340', reserva: '68.5%' },
            chart: {
                labels: ['00h', '01h', '02h', '03h', '04h', '05h', '06h', '07h', '08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h', '23h'],
                datasets: [
                    { label: 'Carga', data: [8000, 7800, 7700, 7600, 7800, 8200, 9000, 10500, 11800, 12500, 13000, 13200, 13100, 13300, 13500, 13200, 12800, 12500, 13800, 14500, 14000, 12800, 11000, 9000], color: 'rgba(249, 67, 0, 1)', type: 'line', fill: true, borderWidth: 4 },
                    { label: 'Hidráulica', data: [6000, 5800, 5700, 5600, 5800, 6000, 6500, 7000, 7200, 7000, 6800, 6500, 6300, 6500, 6800, 7200, 7500, 7800, 8500, 9500, 9000, 8000, 7000, 6500], color: 'rgba(0, 42, 117, 1)', type: 'bar' },
                    { label: 'Térmica', data: [500, 500, 500, 500, 500, 500, 1000, 1500, 2000, 2500, 2800, 3000, 2800, 3000, 3200, 2800, 2000, 1500, 2500, 3000, 3000, 2500, 1500, 1000], color: 'rgba(107, 114, 128, 1)', type: 'bar' },
                    { label: 'Eólica', data: [1200, 1300, 1400, 1500, 1450, 1300, 1100, 900, 800, 700, 600, 500, 450, 400, 500, 600, 700, 800, 900, 1000, 1100, 1300, 1400, 1300], color: 'rgba(34, 197, 94, 1)', type: 'bar' },
                    { label: 'Solar', data: [0, 0, 0, 0, 0, 0, 100, 500, 1200, 1800, 2500, 2900, 3200, 3100, 2800, 2200, 1500, 500, 0, 0, 0, 0, 0, 0], color: 'rgba(253, 224, 71, 1)', type: 'bar' },
                ]
            },
            faq: ['Qual o custo da energia?', 'Qual a previsão de demanda?', 'Como está a reserva hídrica?']
        },
        sudeste: {},
        sul: {},
        nordeste: {},
        norte: {}
    };

    // --- PREENCHIMENTO DE DADOS MOCADOS ---
    function populateMockData() {
        // Popula dados para outros subsistemas
        ['sudeste', 'sul', 'nordeste', 'norte'].forEach(sub => {
            MOCKED_DATA[sub] = JSON.parse(JSON.stringify(MOCKED_DATA.geral));
            const randomFactor = 0.8 + Math.random() * 0.4;
            MOCKED_DATA[sub].cards.geracao = (parseFloat(MOCKED_DATA.geral.cards.geracao.replace('.', '')) * randomFactor).toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
            MOCKED_DATA[sub].chart.datasets.forEach(ds => {
                ds.data = ds.data.map(d => Math.round(d * randomFactor));
            });
        });
    }

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
            keywords: ['segurança', 'operou com segurança'],
            answer: 'Sim, o sistema operou dentro dos parâmetros de segurança no último mês, sem ocorrências significativas de sobrecarga ou instabilidade.',
            chart_action: { title: 'Operação do Sistema: Geração Total vs. Carga', show: ['Carga', 'Hidráulica', 'Térmica', 'Eólica', 'Solar'] }
        },
        {
            keywords: ['custo da energia', 'preço'],
            answer: 'O custo médio da energia (PLD) na última semana foi de R$ 120/MWh, uma redução de 5% em relação à semana anterior devido à alta geração eólica.',
            chart_action: { title: 'Análise de Custo: G. Térmica e Eólica vs. Carga', show: ['Térmica', 'Eólica', 'Carga'] }
        },
        {
            keywords: ['reserva hídrica', 'nível dos reservatórios'],
            answer: 'O nível agregado dos reservatórios do subsistema está em 72%, um patamar confortável para esta época do ano. A visão mensal oferece uma melhor perspectiva sobre a evolução das reservas.',
        }
    ];

    // --- ELEMENTOS DO DOM --- //
    const subsistemaSelector = document.getElementById('subsistema-selector');
    const yearSelector = document.getElementById('year-selector');
    const monthSelector = document.getElementById('month-selector');
    const daySelector = document.getElementById('day-selector');
    const hourSelector = document.getElementById('hour-selector');
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
            const option = new Option(year, year);
            yearSelector.add(option);
        }

        for (let month = 1; month <= 12; month++) {
            const option = new Option(month, month);
            monthSelector.add(option);
        }

        for (let day = 1; day <= 31; day++) {
            const option = new Option(day, day);
            daySelector.add(option);
        }

        for (let hour = 0; hour <= 23; hour++) {
            const option = new Option(`${hour.toString().padStart(2, '0')}h`, hour);
            hourSelector.add(option);
        }
    }

    function updateDashboard(subsistema) {
        const data = MOCKED_DATA[subsistema];
        cardGeracao.textContent = data.cards.geracao;
        cardCarga.textContent = data.cards.carga;
        cardReserva.textContent = data.cards.reserva;

        energyChart.data.labels = data.chart.labels;
        energyChart.data.datasets = data.chart.datasets.map(ds => ({
            ...ds,
            backgroundColor: ds.type === 'line' ? ds.color.replace('1)', '0.1)') : ds.color,
            borderColor: ds.color
        }));
        
        energyChart.options.plugins.title.text = `Curvas de Carga e Geração`;
        updateChartToggles();
        energyChart.update();

        const faqData = MOCKED_DATA[subsistema].faq;
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
                    qa.action({ subsistemaSelector });
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
            energyChart.options.plugins.title.text = `Curvas de Carga e Geração`;
        } else {
            responseText = `Não tenho uma resposta pronta para "${question}", mas a performance geral, com base nos dados de ${subsistemaSelector.options[subsistemaSelector.selectedIndex].text}, está dentro do esperado.`;
        }

        energyChart.update();
        updateChartToggles();
        aiResponseBox.innerHTML = `<p>${responseText}</p>`;
    }

    // --- EVENT LISTENERS --- //
    subsistemaSelector.addEventListener('change', (e) => updateDashboard(e.target.value));
    yearSelector.addEventListener('change', (e) => updateDashboard(subsistemaSelector.value));
    monthSelector.addEventListener('change', (e) => updateDashboard(subsistemaSelector.value));
    daySelector.addEventListener('change', (e) => updateDashboard(subsistemaSelector.value));
    hourSelector.addEventListener('change', (e) => updateDashboard(subsistemaSelector.value));

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

    // --- INICIALIZAÇÃO --- //
    populateMockData();
    populateTimeFilters();
    updateDashboard('geral');
});
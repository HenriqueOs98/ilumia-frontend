function getMockData(year, month, day, subsistema = 'geral') {
    // Estrutura de dados para mocks específicos
    const specificMocks = {
        2023: {
            5: {
                10: {
                    cards: { geracao: '110.500', carga: '14.900', reserva: '72.1%' },
                    chart: {
                        labels: ['00h', '01h', '02h', '03h', '04h', '05h', '06h', '07h', '08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h', '23h'],
                        datasets: [
                            { label: 'Carga', data: [7500, 7400, 7300, 7200, 7400, 7800, 8500, 10000, 11200, 12000, 12500, 12700, 12600, 12800, 13000, 12700, 12300, 12000, 13200, 14000, 13500, 12300, 10500, 8500], color: 'rgba(249, 67, 0, 1)', type: 'line', fill: true, borderWidth: 4 },
                            { label: 'Hidráulica', data: [5500, 5400, 5300, 5200, 5400, 5800, 6300, 6800, 7000, 6800, 6600, 6300, 6100, 6300, 6600, 7000, 7300, 7600, 8300, 9300, 8800, 7800, 6800, 6300], color: 'rgba(0, 42, 117, 1)', type: 'bar' },
                            { label: 'Térmica', data: [1000, 1000, 1000, 1000, 1000, 1000, 1200, 1700, 2200, 2700, 3000, 3200, 3000, 3200, 3400, 3000, 2200, 1700, 2700, 3200, 3200, 2700, 1700, 1200], color: 'rgba(107, 114, 128, 1)', type: 'bar' },
                            { label: 'Eólica', data: [800, 900, 1000, 1100, 1050, 900, 800, 700, 600, 500, 400, 300, 250, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1000], color: 'rgba(34, 197, 94, 1)', type: 'bar' },
                            { label: 'Solar', data: [0, 0, 0, 0, 0, 0, 100, 400, 1100, 1700, 2400, 2800, 3100, 3000, 2700, 2100, 1400, 400, 0, 0, 0, 0, 0, 0], color: 'rgba(253, 224, 71, 1)', type: 'bar' },
                        ]
                    }
                }
            }
        }
    };

    // Verifica se existe um mock específico para a data
    if (specificMocks[year] && specificMocks[year][month] && specificMocks[year][month][day]) {
        return generateSubsistemaData(specificMocks[year][month][day], subsistema);
    }

    // Se não, gera dados baseados na data para simular variações
    const baseData = {
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
        }
    };

    // Fator de aleatoriedade baseado na data para tornar os dados "dinâmicos"
    const seed = year * month * day;
    const random = () => {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const generatedData = JSON.parse(JSON.stringify(baseData));
    generatedData.chart.datasets.forEach(dataset => {
        dataset.data = dataset.data.map(d => Math.round(d * (0.9 + random() * 0.2))); // Variação de +/- 10%
    });

    return generateSubsistemaData(generatedData, subsistema);
}

function generateSubsistemaData(data, subsistema) {
    if (subsistema === 'geral') {
        return data;
    }
    const subsistemaData = JSON.parse(JSON.stringify(data));
    const randomFactor = 0.8 + Math.random() * 0.4; // Fator de aleatoriedade para o subsistema
    subsistemaData.cards.geracao = (parseFloat(subsistemaData.cards.geracao.replace('.', '')) * randomFactor).toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    subsistemaData.chart.datasets.forEach(ds => {
        ds.data = ds.data.map(d => Math.round(d * randomFactor));
    });
    return subsistemaData;
}

const FAQ_DATA = {
    geral: ['Qual o custo da energia?', 'Qual a previsão de demanda?', 'Como estava a geração em 10/05/2023?'],
    sudeste: ['Qual a previsão para o Sudeste?', 'Comparar carga e hidráulica no Sudeste'],
    sul: ['Como está a geração eólica no Sul?', 'Qual o pico de carga no Sul?'],
    nordeste: ['Qual a participação da solar no Nordeste?', 'Previsão de carga para o Nordeste'],
    norte: ['Como está a geração de Belo Monte?', 'Qual a demanda do Norte?']
};
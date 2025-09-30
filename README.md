# LUMIA - Dashboard de Análise Energética

Dashboard interativo para visualização e análise de dados do Sistema Interligado Nacional (SIN) do ONS.

## 🚀 Como Usar

### Opção 1: Servidor HTTP Local (Recomendado)

Para carregar dados reais dos arquivos CSV locais:

```bash
cd /home/prediktive/Projects/lumia-frontend
python3 server.py
```

Depois acesse: **http://localhost:8000**

### Opção 2: Abrir Diretamente

Você pode abrir `index.html` diretamente no navegador, mas verá apenas dados de demonstração devido às restrições de CORS.

## 📊 Funcionalidades

### Datasets Disponíveis

1. **Curva de carga horária** - Dados horários de carga por subsistema (Cache local: 2023-2024 completo)
2. **Balanço de energia** - Balanço energético detalhado
3. **Carga diária** - Dados consolidados diários
4. **Dados hidrológicos** - Reservatórios (diário/horário)
5. **Geração por usina** - Detalhamento horário por usina

**Nota**: Dados de 2025 ainda não estão disponíveis no S3 do ONS. Os dados mais recentes são de 2024 completo.

### Recursos

- ✅ **Carregamento Automático**: Dados carregam ao abrir a página
- ✅ **Cache Local**: Dados de 2023-2024 disponíveis offline
- ✅ **Gráficos Interativos**: ECharts com zoom, pan e tooltips
- ✅ **Filtros Dinâmicos**: Mudam baseados no dataset selecionado
- ✅ **Análises Contextuais**: Perguntas inteligentes baseadas nos dados
- ✅ **Dados Mock**: Demonstração funciona sem servidor

### Filtros Dinâmicos

Os filtros mudam automaticamente baseados no dataset:

- **Curva de carga**: Subsistema (NORTE, NORDESTE, SUL, SUDESTE)
- **Reservatórios**: Reservatório, Bacia
- **Geração por usina**: Usina, Tipo de combustível

## 📁 Estrutura de Arquivos

```
lumia-frontend/
├── index.html              # Página principal
├── style.css               # Estilos personalizados
├── script-new.js           # Lógica principal (ECharts)
├── ons-datasets.js         # Integração com S3 do ONS
├── dataset-metadata.js     # Metadados dos datasets
├── server.py               # Servidor HTTP local
├── datasets/               # Cache local
│   ├── curva-carga-2023.csv    # 1.4MB
│   ├── curva-carga-2024.csv    # 1.4MB
│   └── dicionario-curva-carga.pdf
└── README.md
```

## 🔧 Tecnologias

- **Apache ECharts 5.4.3** - Visualizações de dados
- **TailwindCSS** - Estilização
- **Python 3** - Servidor HTTP local
- **AWS S3** - Fonte de dados ONS
- **LLMAsAService.io** - Integração com modelos de linguagem (GPT-4, Claude, etc.)

## 📖 Dicionários de Dados

Cada dataset possui um dicionário de dados em PDF disponível no S3 do ONS:

```
s3://ons-aws-prod-opendata/dataset/[nome-dataset]/DicionarioDados_[nome].pdf
```

## 🎯 Análises Disponíveis

### Perguntas Contextuais

O assistente responde automaticamente a:

- "Qual o maior valor?" → Máximos por subsistema
- "Compare os subsistemas" → Médias comparativas
- "Qual foi o pico?" → Top 5 valores mais altos
- "Mostre as estatísticas" → Média, mín, máx, amplitude

### Visualizações

- **Séries Temporais**: Evolução ao longo do tempo
- **Comparações**: Entre subsistemas/usinas
- **Análises de Pico**: Horários e valores máximos
- **Zoom Interativo**: Navegue pelos dados com o mouse

## 🔄 Download Automático de Datasets

Use o script Python para baixar todos os datasets e seus dicionários de dados:

```bash
python3 download-datasets.py
```

**O script baixa automaticamente**:
- ✅ Arquivos CSV de dados (2023-2025)
- ✅ Dicionários de dados em PDF de cada dataset
- ✅ Pula arquivos que já existem (não baixa duplicados)
- ✅ Mostra progresso e resumo ao final

**Datasets incluídos**:
1. Curva de carga horária
2. Capacidade instalada de geração
3. Balanço de energia subsistema
4. Dados hidrológicos (diário e horário)
5. Carga de energia diária
6. Energia armazenada (EAR) por subsistema
7. Energia natural afluente (ENA) por subsistema
8. Disponibilidade de usinas

### Download Manual (opcional)

Para baixar um arquivo específico:

```bash
cd datasets
aws s3 cp --no-sign-request s3://ons-aws-prod-opendata/dataset/curva-carga-ho/CURVA_CARGA_2024.csv curva-carga-2024.csv
```

## 🐛 Troubleshooting

### "Nenhum dado encontrado"

- **Solução**: Inicie o servidor HTTP com `python3 server.py`
- **Motivo**: Navegadores bloqueiam acesso a arquivos locais por segurança (CORS)

### "Dados de demonstração"

- Indica que o app está usando dados mock
- Para dados reais, use o servidor HTTP

### Gráfico não aparece

- Verifique o console do navegador (F12)
- Confirme que o ECharts carregou: Deve ver "✓ LUMIA inicializado com ECharts"

## 🤖 Assistente IA com LLM

O LUMIA possui integração com **LLMAsAService.io** para análises inteligentes via LLM.

### Configuração (Opcional)

Por padrão, o assistente usa **respostas locais pré-programadas**. Para ativar LLMs reais:

1. **Registre-se em** https://app.llmasaservice.io
2. **Crie um serviço LLM** (ex: OpenAI GPT-4o)
3. **Adicione sua API Key** do vendor (OpenAI, Anthropic, etc.)
4. **Configure o `llm-config.js`**:

```javascript
const LLM_CONFIG = {
    projectId: 'seu-project-id-aqui',
    serviceName: 'openai-gpt4o',
    mode: 'llm' // Mude de 'local' para 'llm'
};
```

### Modos de Operação

- **`mode: 'local'`** - Usa lógica JavaScript local, sem custos
- **`mode: 'n8n'`** (padrão) - Conecta com workflow n8n via webhook
- **`mode: 'llm'`** - Usa modelos LLM reais via LLMAsAService.io

### Análises Disponíveis

O assistente responde a perguntas como:
- "Qual foi o maior valor de carga?"
- "Compare os subsistemas NORTE e SUDESTE"
- "Qual foi o horário de pico?"
- "Mostre as estatísticas do período"
- "Explique a tendência de carga"

## 📝 Desenvolvimento

Para adicionar novos datasets:

1. Adicione metadados em `dataset-metadata.js`
2. Atualize `ons-datasets.js` com path do S3
3. Configure filtros e visualizações apropriadas
4. Baixe arquivos de exemplo para `datasets/`

## 📄 Licença

Dashboard desenvolvido para análise de dados públicos do ONS (Operador Nacional do Sistema Elétrico).
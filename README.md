# LUMIA - Dashboard de Análise Energética

Este é um projeto de dashboard interativo para visualização e análise de dados do balanço energético. A interface permite a exploração de dados através de gráficos dinâmicos e um assistente de IA mocados.

## Como Executar

Basta abrir o arquivo `index.html` em qualquer navegador moderno.

## Funcionalidades

O dashboard é dividido em duas seções principais: o **Painel de Desempenho** e o **Assistente de IA**.

### Painel de Desempenho

- **Cards de Resumo:** Exibem indicadores chave como Geração Total, Carga Máxima e Nível da Reserva Estratégica.
- **Gráfico Dinâmico:** Um gráfico de séries temporais que mostra a relação entre a curva de carga e as diferentes fontes de geração de energia (hidráulica, térmica, eólica, solar).
- **Controles Interativos:** É possível ligar ou desligar a visualização de cada fonte de energia clicando nos seletores acima do gráfico. Além disso, pode-se alterar o **Subsistema** (Sudeste, Sul, etc.) e o **Período** (Diário, Semanal, Mensal) para filtrar os dados exibidos.

### Assistente de IA

O assistente de IA permite uma interação em linguagem natural para explorar os dados. Ele responde a dois tipos de comandos:

#### 1. Comandos de Manipulação do Gráfico

Você pode pedir ao assistente para filtrar as informações do gráfico. A IA entende comandos baseados em palavras-chave como:

- **`mostrar todas` ou `tudo`**: Exibe todas as curvas de geração e a de carga.
- **`isolar [fonte]`**, **`apenas [fonte]`** ou **`somente [fonte]`**: Mostra apenas a curva da fonte especificada. 
  - *Exemplo:* `isolar geração eólica`
- **`comparar [fonte1] e [fonte2]`**: Exibe apenas as curvas das fontes mencionadas para comparação.
  - *Exemplo:* `comparar carga e hidráulica`

As fontes reconhecidas são: `carga`, `hidráulica`, `térmica`, `eólica` e `solar`.

#### 2. Perguntas e Respostas Mocadas

O assistente também pode responder a um conjunto de perguntas pré-definidas. A lógica se baseia em identificar palavras-chave na sua pergunta.

**Perguntas Reconhecidas:**

- **Se a pergunta contém `previsão de demanda` ou `próximo trimestre`:**
  - **Resposta:** *"A previsão de demanda para o próximo trimestre indica um aumento de 5%, impulsionado principalmente pelo setor industrial. Recomenda-se monitorar a capacidade de geração nos horários de pico."*

- **Se a pergunta contém `fonte mais utilizada` ou `principal fonte`:**
  - **Resposta:** *"No contexto geral do sistema, a geração Hidráulica é a fonte mais utilizada, correspondendo a aproximadamente 60% da matriz energética."*

- **Se a pergunta contém `segurança` ou `operou com segurança`:**
  - **Resposta:** *"Sim, o sistema operou dentro dos parâmetros de segurança no último mês, sem ocorrências significativas de sobrecarga ou instabilidade."*

- **Se a pergunta contém `custo da energia` ou `preço`:**
  - **Resposta:** *"O custo médio da energia (PLD) na última semana foi de R$ 120/MWh, uma redução de 5% em relação à semana anterior devido à alta geração eólica."*

- **Se a pergunta contém `reserva hídrica` ou `nível dos reservatórios`:**
  - **Resposta:** *"O nível agregado dos reservatórios do subsistema está em 72%, um patamar confortável para esta época do ano. A visão mensal oferece uma melhor perspectiva sobre a evolução das reservas."*
  - **Ação Adicional:** O filtro de período é alterado para **Mensal**.

Se a pergunta não corresponder a nenhum comando ou pergunta pré-definida, o assistente fornecerá uma resposta genérica com base no contexto selecionado (Subsistema e Período).
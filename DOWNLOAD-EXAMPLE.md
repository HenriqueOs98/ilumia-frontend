# 📥 Exemplo de Saída do Script de Download

Este documento mostra como fica a execução do `download-datasets.py`.

## Executando o Script

```bash
python3 download-datasets.py
```

## Saída Esperada

```
============================================================
🚀 LUMIA - Download de Datasets do ONS
============================================================
📁 Destino: /home/prediktive/Projects/lumia-frontend/datasets
🌐 Bucket: s3://ons-aws-prod-opendata
⏰ Início: 2024-09-30 14:23:45

============================================================
📊 Dataset: curva-carga
============================================================

📖 Dicionário de dados:
  ⏭️  Já existe: dicionariodados_curvacarga.pdf

  ⬇️  Baixando: curva_carga_2023.csv...
  ✅ Baixado: curva_carga_2023.csv (1.4 MB)

  ⏭️  Já existe: curva_carga_2024.csv

  ⬇️  Baixando: curva_carga_2025.csv...
  ❌ Erro: The specified key does not exist.

📈 Resumo: ✅ 1 baixados | ⏭️  2 já existiam | ❌ 1 falharam

============================================================
📊 Dataset: capacidade-geracao
============================================================

📖 Dicionário de dados:
  ⏭️  Já existe: dicionariodados_capacidade_instalada_geracao.pdf

  ⏭️  Já existe: capacidade_geracao.csv

📈 Resumo: ✅ 0 baixados | ⏭️  2 já existiam | ❌ 0 falharam

============================================================
📊 Dataset: balanco-energia-subsistema
============================================================

📖 Dicionário de dados:
  ⏭️  Já existe: dicionariodados_balanco_energia_subsistema.pdf

  ⬇️  Baixando: balanco_energia_subsistema_ho_2023.csv...
  ✅ Baixado: balanco_energia_subsistema_ho_2023.csv (2.1 MB)

  ⬇️  Baixando: balanco_energia_subsistema_ho_2024.csv...
  ✅ Baixado: balanco_energia_subsistema_ho_2024.csv (2.3 MB)

  ⬇️  Baixando: balanco_energia_subsistema_ho_2025.csv...
  ❌ Erro: The specified key does not exist.

📈 Resumo: ✅ 2 baixados | ⏭️  1 já existiam | ❌ 1 falharam

[... mais datasets ...]

============================================================
📊 RESUMO GERAL
============================================================
✅ Arquivos baixados: 45
⏭️  Já existiam: 12
❌ Falhas: 8
⏰ Fim: 2024-09-30 14:28:32

📂 Arquivos CSV em datasets/:
  • balanco_energia_subsistema_ho_2023.csv (2.1 MB)
  • balanco_energia_subsistema_ho_2024.csv (2.3 MB)
  • carga_energia_di_2023.csv (0.8 MB)
  • carga_energia_di_2024.csv (0.9 MB)
  • capacidade_geracao.csv (0.2 MB)
  • curva_carga_2023.csv (1.4 MB)
  • curva_carga_2024.csv (1.4 MB)
  • dados_hidrologicos_di_2024_01.csv (3.2 MB)
  • dados_hidrologicos_di_2024_02.csv (2.8 MB)
  • dados_hidrologicos_di_2024_03.csv (3.1 MB)
  [... mais arquivos ...]

💾 Total CSV: 45.3 MB

📖 Dicionários de dados em datasets/:
  • dicionariodados_balanco_energia_subsistema.pdf (126.0 KB)
  • dicionariodados_capacidade_instalada_geracao.pdf (194.0 KB)
  • dicionariodados_carga_energia.pdf (118.0 KB)
  • dicionariodados_curvacarga.pdf (118.0 KB)
  • dicionariodados_dados_hidrologicos.pdf (156.0 KB)
  • dicionariodados_disponibilidade_usina.pdf (142.0 KB)
  • dicionariodados_ear_subsistema.pdf (128.0 KB)
  • dicionariodados_ena_subsistema.pdf (124.0 KB)

📚 Total Dicionários: 1106.0 KB

✨ Concluído! Inicie o servidor com: python3 server.py
```

## 📝 Observações

### ✅ Arquivos Baixados

Indica novos arquivos que foram baixados do S3 nesta execução.

### ⏭️ Já Existiam

Arquivos que já estavam na pasta `datasets/` e foram pulados (não redownload).

### ❌ Falhas

Arquivos que falharam no download, geralmente porque:
- Ainda não existem no S3 (ex: dados de 2025 ainda não disponíveis)
- Erro de conexão temporário
- Nome do arquivo incorreto

💡 **Dica**: Falhas em arquivos de 2025 são esperadas, pois os dados ainda não foram publicados pelo ONS.

## 🔄 Execuções Subsequentes

Se você executar o script novamente:

```bash
python3 download-datasets.py
```

Ele será **muito mais rápido** porque vai apenas verificar os arquivos existentes e baixar apenas os novos/faltantes.

Exemplo de execução subsequente:

```
============================================================
📊 Dataset: curva-carga
============================================================

📖 Dicionário de dados:
  ⏭️  Já existe: dicionariodados_curvacarga.pdf

  ⏭️  Já existe: curva_carga_2023.csv
  ⏭️  Já existe: curva_carga_2024.csv
  ❌ Erro: The specified key does not exist.

📈 Resumo: ✅ 0 baixados | ⏭️  2 já existiam | ❌ 1 falharam
```

## 📦 Estrutura Final

Após executar o script, sua pasta `datasets/` terá:

```
datasets/
├── 📄 balanco_energia_subsistema_ho_2023.csv
├── 📄 balanco_energia_subsistema_ho_2024.csv
├── 📄 capacidade_geracao.csv
├── 📄 carga_energia_di_2023.csv
├── 📄 carga_energia_di_2024.csv
├── 📄 curva_carga_2023.csv
├── 📄 curva_carga_2024.csv
├── 📄 dados_hidrologicos_di_2024_01.csv
├── 📄 dados_hidrologicos_di_2024_02.csv
├── 📄 dados_hidrologicos_ho_2024_01.csv
├── 📄 disponibilidade_usina_ho_2024_01.csv
├── 📄 ear_subsistema_di_2023.csv
├── 📄 ear_subsistema_di_2024.csv
├── 📄 ena_subsistema_di_2023.csv
├── 📄 ena_subsistema_di_2024.csv
│
├── 📖 dicionariodados_balanco_energia_subsistema.pdf
├── 📖 dicionariodados_capacidade_instalada_geracao.pdf
├── 📖 dicionariodados_carga_energia.pdf
├── 📖 dicionariodados_curvacarga.pdf
├── 📖 dicionariodados_dados_hidrologicos.pdf
├── 📖 dicionariodados_disponibilidade_usina.pdf
├── 📖 dicionariodados_ear_subsistema.pdf
└── 📖 dicionariodados_ena_subsistema.pdf
```

## 🚀 Próximo Passo

Após o download, inicie o servidor:

```bash
python3 server.py
```

E acesse: **http://localhost:8000**

Os dados e dicionários estarão disponíveis localmente no dashboard LUMIA! 🎉

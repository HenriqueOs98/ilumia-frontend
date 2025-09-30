#!/usr/bin/env python3
"""
Script para download em massa de datasets do ONS (S3 público)
Baixa dados de múltiplos anos e datasets automaticamente
"""

import subprocess
from pathlib import Path
from datetime import datetime

# Configuração
BUCKET = "ons-aws-prod-opendata"
DATASETS_DIR = Path(__file__).parent / "datasets"
DATASETS_DIR.mkdir(exist_ok=True)

# Datasets para baixar (key: nome local, value: path no S3)
DATASETS = {
    # Curva de carga horária (anos completos)
    'curva-carga': {
        'path': 'dataset/curva-carga-ho',
        'pattern': 'CURVA_CARGA_{year}.csv',
        'years': [2023, 2024, 2025],
        'dictionary': 'DicionarioDados_CurvaCarga.pdf'
    },
    # Capacidade instalada de geração (arquivo único)
    'capacidade-geracao': {
        'path': 'dataset/capacidade-geracao',
        'pattern': 'CAPACIDADE_GERACAO.csv',
        'single_file': True,
        'dictionary': 'DicionarioDados_Capacidade_Instalada_Geracao.pdf'
    },
    # Balanço de energia subsistema (horário)
    'balanco-energia-subsistema': {
        'path': 'dataset/balanco_energia_subsistema_ho',
        'pattern': 'BALANCO_ENERGIA_SUBSISTEMA_{year}.csv',
        'years': [2023, 2024, 2025],
        'dictionary': 'DicionarioDados_Balanco_Energia_Subsistema.pdf'
    },
    # Dados hidrológicos diários (reservatórios)
    'dados-hidrologicos-di': {
        'path': 'dataset/dados_hidrologicos_di',
        'pattern': 'DADOS_HIDROLOGICOS_RES_{year}.csv',
        'years': [2023, 2024, 2025],
        'dictionary': 'DicionarioDados_Dados_Hidrologicos.pdf'
    },
    # Dados hidrológicos horários (reservatórios)
    'dados-hidrologicos-ho': {
        'path': 'dataset/dados_hidrologicos_ho',
        'pattern': 'DADOS_HIDROLOGICOS_RES_{year}.csv',
        'years': [2023, 2024, 2025],
        'dictionary': 'DicionarioDados_Dados_Hidrologicos.pdf'
    },
    # Carga de energia diária
    'carga-energia-di': {
        'path': 'dataset/carga_energia_di',
        'pattern': 'CARGA_ENERGIA_{year}.csv',
        'years': [2023, 2024, 2025],
        'dictionary': 'DicionarioDados_Carga_Energia.pdf'
    },
    # Energia armazenada por subsistema
    'ear-subsistema': {
        'path': 'dataset/ear_subsistema_di',
        'pattern': 'EAR_DIARIO_SUBSISTEMA_{year}.csv',
        'years': [2023, 2024, 2025],
        'dictionary': 'DicionarioDados_EAR_Subsistema.pdf'
    },
    # Energia natural afluente por subsistema
    'ena-subsistema': {
        'path': 'dataset/ena_subsistema_di',
        'pattern': 'ENA_DIARIO_SUBSISTEMA_{year}.csv',
        'years': [2023, 2024, 2025],
        'dictionary': 'DicionarioDados_ENA_Subsistema.pdf'
    },
    # Disponibilidade de usinas
    'disponibilidade-usina': {
        'path': 'dataset/disponibilidade_usina_ho',
        'pattern': 'DISPONIBILIDADE_USINA_{year}_{month:02d}.csv',
        'years': [2024, 2025],
        'months': [1, 2, 3, 4, 5, 6, 7, 8, 9],
        'dictionary': 'DicionarioDados_Disponibilidade_Usina.pdf'
    }
}

def download_file(s3_path, local_path):
    """Baixa arquivo do S3 usando AWS CLI"""
    full_s3_path = f"s3://{BUCKET}/{s3_path}"

    if local_path.exists():
        print(f"  ⏭️  Já existe: {local_path.name}")
        return True

    print(f"  ⬇️  Baixando: {local_path.name}...")

    try:
        result = subprocess.run(
            ['aws', 's3', 'cp', '--no-sign-request', full_s3_path, str(local_path)],
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode == 0:
            size_mb = local_path.stat().st_size / (1024 * 1024)
            print(f"  ✅ Baixado: {local_path.name} ({size_mb:.1f} MB)")
            return True
        else:
            print(f"  ❌ Erro: {result.stderr.strip()}")
            return False

    except subprocess.TimeoutExpired:
        print(f"  ⏱️  Timeout ao baixar {local_path.name}")
        return False
    except Exception as e:
        print(f"  ❌ Erro: {str(e)}")
        return False

def download_dataset(name, config):
    """Baixa todos os arquivos de um dataset"""
    print(f"\n{'='*60}")
    print(f"📊 Dataset: {name}")
    print(f"{'='*60}")

    success_count = 0
    fail_count = 0
    skip_count = 0

    # Baixa o dicionário de dados primeiro (se existir)
    if 'dictionary' in config:
        dict_filename = config['dictionary']
        dict_s3_path = f"{config['path']}/{dict_filename}"
        dict_local_path = DATASETS_DIR / dict_filename.lower()

        print(f"\n📖 Dicionário de dados:")
        result = download_file(dict_s3_path, dict_local_path)
        if dict_local_path.exists() and result:
            skip_count += 1
        elif result:
            success_count += 1
        else:
            fail_count += 1

    # Arquivo único (sem versionamento)
    if config.get('single_file'):
        filename = config['pattern']
        s3_path = f"{config['path']}/{filename}"
        local_path = DATASETS_DIR / filename.lower()

        result = download_file(s3_path, local_path)
        if local_path.exists() and result:
            skip_count += 1
        elif result:
            success_count += 1
        else:
            fail_count += 1
    # Dataset com anos
    elif 'years' in config:
        for year in config['years']:
            if 'months' in config:
                # Dataset mensal
                for month in config['months']:
                    filename = config['pattern'].format(year=year, month=month)
                    s3_path = f"{config['path']}/{filename}"
                    local_path = DATASETS_DIR / filename.lower()

                    result = download_file(s3_path, local_path)
                    if local_path.exists() and result:
                        skip_count += 1
                    elif result:
                        success_count += 1
                    else:
                        fail_count += 1
            else:
                # Dataset anual
                filename = config['pattern'].format(year=year)
                s3_path = f"{config['path']}/{filename}"
                local_path = DATASETS_DIR / filename.lower()

                result = download_file(s3_path, local_path)
                if local_path.exists() and result:
                    skip_count += 1
                elif result:
                    success_count += 1
                else:
                    fail_count += 1

    print(f"\n📈 Resumo: ✅ {success_count} baixados | ⏭️  {skip_count} já existiam | ❌ {fail_count} falharam")
    return success_count, fail_count, skip_count

def main():
    """Função principal"""
    print("="*60)
    print("🚀 LUMIA - Download de Datasets do ONS")
    print("="*60)
    print(f"📁 Destino: {DATASETS_DIR}")
    print(f"🌐 Bucket: s3://{BUCKET}")
    print(f"⏰ Início: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    total_success = 0
    total_fail = 0
    total_skip = 0

    # Baixa cada dataset
    for name, config in DATASETS.items():
        success, fail, skip = download_dataset(name, config)
        total_success += success
        total_fail += fail
        total_skip += skip

    # Resumo geral
    print("\n" + "="*60)
    print("📊 RESUMO GERAL")
    print("="*60)
    print(f"✅ Arquivos baixados: {total_success}")
    print(f"⏭️  Já existiam: {total_skip}")
    print(f"❌ Falhas: {total_fail}")
    print(f"⏰ Fim: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Lista arquivos CSV baixados
    csv_files = sorted(DATASETS_DIR.glob("*.csv"))
    if csv_files:
        print(f"\n📂 Arquivos CSV em datasets/:")
        total_csv_size = 0
        for f in csv_files:
            size_mb = f.stat().st_size / (1024 * 1024)
            total_csv_size += size_mb
            print(f"  • {f.name} ({size_mb:.1f} MB)")
        print(f"\n💾 Total CSV: {total_csv_size:.1f} MB")

    # Lista dicionários de dados baixados
    dict_files = sorted(DATASETS_DIR.glob("*.pdf"))
    if dict_files:
        print(f"\n📖 Dicionários de dados em datasets/:")
        total_dict_size = 0
        for f in dict_files:
            size_kb = f.stat().st_size / 1024
            total_dict_size += size_kb
            print(f"  • {f.name} ({size_kb:.1f} KB)")
        print(f"\n📚 Total Dicionários: {total_dict_size:.1f} KB")

    print("\n✨ Concluído! Inicie o servidor com: python3 server.py")

if __name__ == "__main__":
    main()
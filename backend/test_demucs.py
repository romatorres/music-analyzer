#!/usr/bin/env python
"""Script para testar Demucs e verificar modelos"""

import os
import sys

print("=" * 60)
print("TESTE DE CONFIGURAÇÃO DO DEMUCS")
print("=" * 60)

# 1. Verificar instalação do Demucs
print("\n1. Verificando instalação do Demucs...")
try:
    import demucs
    print(f"   ✓ Demucs instalado: {demucs.__version__}")
except ImportError as e:
    print(f"   ✗ Demucs não encontrado: {e}")
    sys.exit(1)

# 2. Verificar PyTorch
print("\n2. Verificando PyTorch...")
try:
    import torch
    print(f"   ✓ PyTorch instalado: {torch.__version__}")
    print(f"   ✓ CUDA disponível: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"   ✓ GPU: {torch.cuda.get_device_name(0)}")
except ImportError as e:
    print(f"   ✗ PyTorch não encontrado: {e}")

# 3. Verificar cache de modelos
print("\n3. Verificando cache de modelos...")
cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
print(f"   Diretório: {cache_dir}")

if os.path.exists(cache_dir):
    models = os.listdir(cache_dir)
    print(f"   ✓ {len(models)} arquivos encontrados:")
    for model in models:
        size_mb = os.path.getsize(os.path.join(cache_dir, model)) / (1024 * 1024)
        print(f"     - {model} ({size_mb:.1f} MB)")
else:
    print(f"   ✗ Diretório não existe")

# 4. Verificar modelos disponíveis
print("\n4. Verificando modelos Demucs disponíveis...")
try:
    from demucs.pretrained import get_model_from_args
    print("   Modelos que podem ser usados:")
    print("     - htdemucs (padrão)")
    print("     - htdemucs_ft (fine-tuned)")
    print("     - htdemucs_6s (6 stems)")
    print("     - mdx_extra")
except Exception as e:
    print(f"   ✗ Erro ao verificar modelos: {e}")

# 5. Testar carregamento de modelo
print("\n5. Testando carregamento do modelo htdemucs...")
try:
    from demucs.pretrained import get_model
    model = get_model('htdemucs')
    print(f"   ✓ Modelo carregado com sucesso!")
    print(f"   ✓ Tipo: {type(model)}")
except Exception as e:
    print(f"   ✗ Erro ao carregar modelo: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("TESTE CONCLUÍDO")
print("=" * 60)

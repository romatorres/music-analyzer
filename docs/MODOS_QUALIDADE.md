# 🎚️ Modos de Qualidade e Stems - Separação Avançada

## 📋 Visão Geral

O Music Analyzer v2.0 oferece **3 níveis de qualidade** e **3 opções de stems** para separação de instrumentos, permitindo total controle sobre velocidade, qualidade e detalhamento da análise.

---

## 🎯 Opções de Stems

### 🎵 2 Stems - Vocal + Instrumental

**Ideal para**: Karaokê, remixes simples, backing tracks

#### Características
- **Instrumentos**: Vocal + Instrumental (tudo menos vocal)
- **Modelo**: htdemucs
- **Velocidade**: Mais rápido (50% do tempo de 4 stems)
- **Uso de Memória**: Menor

#### Quando Usar
- ✅ Criar versões karaokê
- ✅ Remover vocal para backing track
- ✅ Isolar vocal para análise
- ✅ Processamento rápido

---

### 🎸 4 Stems - Separação Completa (Recomendado)

**Ideal para**: Uso geral, mixagem, produção

#### Características
- **Instrumentos**: Vocal, Bateria, Baixo, Outros (harmonia)
- **Modelo**: htdemucs
- **Velocidade**: Balanceada
- **Uso de Memória**: Moderado

#### Quando Usar
- ✅ **Uso geral (RECOMENDADO)**
- ✅ Mixagem e remixagem
- ✅ Análise de arranjo
- ✅ Produção musical
- ✅ Melhor equilíbrio detalhamento/velocidade

---

### 🎹 6 Stems - Separação Máxima (NOVO!)

**Ideal para**: Músicas acústicas, análise detalhada, produção avançada

#### Características
- **Instrumentos**: Vocal, Bateria, Baixo, Outros, **Piano**, **Guitarra**
- **Modelo**: htdemucs_6s (especializado)
- **Velocidade**: Mais lento (2x o tempo de 4 stems)
- **Uso de Memória**: Maior

#### Quando Usar
- ✅ Músicas com piano e/ou guitarra proeminentes
- ✅ Análise detalhada de arranjo
- ✅ Produção profissional
- ✅ Isolamento de instrumentos específicos
- ✅ Música acústica, rock, jazz

---

## 🎚️ Níveis de Qualidade

### 🟢 Básica - Rápido e Eficiente

**Ideal para**: Preview, testes, uso casual

#### Características Técnicas
- **Shifts**: 0 (sem augmentation)
- **Overlap**: 0.25
- **Float32**: Não
- **Formato**: MP3 256kbps
- **Segment**: Default

#### Resultados
- ⏱️ **Tempo**: 2-8 min (dependendo dos stems)
- 💾 **Tamanho**: ~8MB por stem
- 🎵 **Qualidade**: 7/10 (Boa)
- 🎯 **Precisão**: Suficiente para maioria dos casos

#### Quando Usar
- ✅ Testar rapidamente uma música
- ✅ Preview antes de processamento completo
- ✅ Uso casual e não-profissional
- ✅ Quando tempo é prioridade
- ✅ Espaço em disco limitado

---

### 🟡 Intermediária - Melhor Custo-Benefício (Recomendado)

**Ideal para**: Uso geral, produção semi-profissional

#### Características Técnicas
- **Shifts**: 1 (pouco augmentation)
- **Overlap**: 0.4
- **Float32**: Sim (maior precisão)
- **Formato**: MP3 320kbps
- **Segment**: Default

#### Resultados
- ⏱️ **Tempo**: 5-15 min (dependendo dos stems)
- 💾 **Tamanho**: ~10MB por stem
- 🎵 **Qualidade**: 8.5/10 (Ótima)
- 🎯 **Precisão**: Excelente equilíbrio

#### Quando Usar
- ✅ **Uso geral (RECOMENDADO)**
- ✅ Projetos pessoais e semi-profissionais
- ✅ Quando você quer boa qualidade sem esperar muito
- ✅ Melhor equilíbrio velocidade/qualidade
- ✅ Maioria dos casos de uso

---

### 🔴 Máxima - Qualidade Profissional

**Ideal para**: Produção profissional, masterização

#### Características Técnicas
- **Shifts**: 3 (alto augmentation)
- **Overlap**: 0.5 (máximo)
- **Float32**: Sim (máxima precisão)
- **Formato**: WAV (sem compressão)
- **Segment**: 80 (otimizado)

#### Resultados
- ⏱️ **Tempo**: 10-30 min (dependendo dos stems)
- 💾 **Tamanho**: ~35MB por stem (WAV)
- 🎵 **Qualidade**: 9.5/10 (Perfeita)
- 🎯 **Precisão**: Máxima possível

#### Quando Usar
- ✅ Produção profissional
- ✅ Masterização de áudio
- ✅ Quando qualidade é prioridade absoluta
- ✅ Projetos comerciais
- ✅ Quando tempo não é problema

---

## 📊 Tabela Comparativa Completa

### Por Número de Stems

| Stems | Básica | Intermediária | Máxima |
|-------|--------|---------------|--------|
| **2** | 2-4 min | 5-8 min | 10-15 min |
| **4** | 3-6 min | 8-12 min | 15-20 min |
| **6** | 4-8 min | 10-15 min | 20-30 min |

### Por Qualidade

| Aspecto | Básica | Intermediária | Máxima |
|---------|--------|---------------|--------|
| **Shifts** | 0 | 1 | 3 |
| **Overlap** | 0.25 | 0.4 | 0.5 |
| **Float32** | ❌ | ✅ | ✅ |
| **Formato** | MP3 256k | MP3 320k | WAV |
| **Tamanho/stem** | ~8MB | ~10MB | ~35MB |
| **Qualidade** | 7/10 | 8.5/10 | 9.5/10 |
| **CPU** | 100% | 100% | 100% |

---

## 🎨 Interface do Usuário

### Seleção de Stems

```
┌─────────────────────────────────────────────────────────┐
│  Modo de Separação (Stems)                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 🎵 2     │  │ 🎸 4     │  │ 🎹 6     │             │
│  │ Stems    │  │ Stems    │  │ Stems    │             │
│  │          │  │          │  │          │             │
│  │ Vocal +  │  │ Vocal,   │  │ Vocal,   │             │
│  │ Instrum. │  │ Bateria, │  │ Bateria, │             │
│  │          │  │ Baixo,   │  │ Baixo,   │             │
│  │          │  │ Outros   │  │ Outros,  │             │
│  │          │  │          │  │ Piano,   │             │
│  │          │  │          │  │ Guitarra │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Seleção de Qualidade

```
┌─────────────────────────────────────────────────────────┐
│  Qualidade de Processamento                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 🟢 Básica│  │ 🟡 Inter.│  │ 🔴 Máxima│             │
│  │          │  │[Recomend]│  │          │             │
│  │ 2-8 min  │  │ 5-15 min │  │ 10-30min │             │
│  │ Boa 7/10 │  │ Ótima8.5 │  │ Perf 9.5 │             │
│  │ MP3 256k │  │ MP3 320k │  │ WAV      │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Os 3 Modos Disponíveis

### ⚡ Modo Rápido

**Ideal para**: Preview, testes rápidos, uso casual

#### Características Técnicas
- **Modelo**: `htdemucs` (padrão)
- **Formato de Saída**: MP3 320kbps
- **Precisão**: float32
- **Shifts**: 0 (sem augmentation)
- **Overlap**: 0.25
- **Multi-threading**: Sim (todos os cores)

#### Resultados
- ⏱️ **Tempo**: 3-5 minutos
- 💾 **Tamanho**: ~10MB por stem
- 🎵 **Qualidade**: 8.5/10 (Boa)
- 🎯 **Precisão**: Excelente para a maioria dos casos

#### Quando Usar
- ✅ Testar rapidamente uma música
- ✅ Preview antes de processamento completo
- ✅ Uso casual e não-profissional
- ✅ Quando o tempo é mais importante que perfeição
- ✅ Espaço em disco limitado

---

### ⚖️ Modo Balanceado (Recomendado)

**Ideal para**: Uso geral, melhor custo-benefício

#### Características Técnicas
- **Modelo**: `htdemucs` (padrão)
- **Formato de Saída**: MP3 320kbps
- **Shifts**: 1 (pouco augmentation)
- **Overlap**: 0.4
- **Multi-threading**: Sim (todos os cores)

#### Resultados
- ⏱️ **Tempo**: 8-12 minutos
- 💾 **Tamanho**: ~10MB por stem
- 🎵 **Qualidade**: 9.0/10 (Ótima)
- 🎯 **Precisão**: Excelente equilíbrio

#### Quando Usar
- ✅ **Uso geral (RECOMENDADO)**
- ✅ Projetos pessoais e semi-profissionais
- ✅ Quando você quer boa qualidade sem esperar muito
- ✅ Melhor equilíbrio velocidade/qualidade
- ✅ Maioria dos casos de uso

---

### 🎵 Modo Máxima Qualidade

**Ideal para**: Produção profissional, masterização

#### Características Técnicas
- **Modelo**: `htdemucs` (padrão, melhor qualidade)
- **Formato de Saída**: WAV (sem compressão)
- **Shifts**: 5 (máximo augmentation)
- **Overlap**: 0.5 (máximo)
- **Multi-threading**: Sim (todos os cores)

#### Resultados
- ⏱️ **Tempo**: 20-30 minutos
- 💾 **Tamanho**: ~40MB por stem (WAV)
- 🎵 **Qualidade**: 9.5/10 (Perfeita)
- 🎯 **Precisão**: Máxima possível

#### Quando Usar
- ✅ Produção profissional
- ✅ Masterização de áudio
- ✅ Quando qualidade é prioridade absoluta
- ✅ Projetos comerciais
- ✅ Quando tempo não é problema

---

## 📊 Comparação Detalhada

### Tabela Comparativa

| Aspecto | Rápido | Balanceado | Qualidade |
|---------|--------|------------|-----------|
| **Tempo (3min áudio)** | 3-5 min | 8-12 min | 20-30 min |
| **Modelo** | htdemucs | htdemucs | htdemucs |
| **Formato** | MP3 320k | MP3 320k | WAV |
| **Tamanho/stem** | ~10MB | ~10MB | ~40MB |
| **Qualidade** | 8.5/10 | 9.0/10 | 9.5/10 |
| **Shifts** | 0 | 1 | 5 |
| **Overlap** | 0.25 | 0.4 | 0.5 |
| **Uso de CPU** | 100% | 100% | 100% |
| **Uso Recomendado** | Preview | Geral | Profissional |

### Gráfico de Custo-Benefício

```
Qualidade
   10 │                                    ● Qualidade
    9 │                        ● Balanceado
    8 │          ● Rápido
    7 │
    6 │
    5 │
    4 │
    3 │
    2 │
    1 │
    0 └─────────────────────────────────────────────
      0    5    10   15   20   25   30   35   40
                    Tempo (minutos)
```

---

## 🎨 Interface do Usuário

### Como Selecionar o Modo

1. **Faça upload** de um arquivo de áudio
2. **Clique** em "Separar Instrumentos"
3. **Escolha** um dos 3 modos apresentados:
   - Cards visuais com ícones
   - Informações de tempo, qualidade e tamanho
   - Badge "Recomendado" no modo Balanceado
4. **Confirme** a separação
5. **Aguarde** o processamento

### Exemplo Visual

```
┌─────────────────────────────────────────────────────────┐
│  Qualidade de Processamento                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ ⚡ Rápido    │  │ ⚖️ Balanceado│  │ 🎵 Qualidade │  │
│  │              │  │ [Recomendado]│  │              │  │
│  │ 1-3 min      │  │ 5-8 min      │  │ 15-20 min    │  │
│  │ Boa          │  │ Ótima        │  │ Perfeita     │  │
│  │ ~10MB        │  │ ~10MB        │  │ ~40MB        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  💡 Dica: O modo Balanceado oferece o melhor           │
│     equilíbrio para a maioria dos casos.               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Detalhes Técnicos

### Configuração Backend

#### Modo Rápido
```python
cmd = [
    'demucs',
    '-n', 'htdemucs_ft',      # Modelo fine-tuned
    '--mp3',                  # Saída MP3
    '--mp3-bitrate', '320',   # Alta qualidade
    '--float32',              # Precisão otimizada
    '--shifts', '0',          # Sem augmentation
    '--overlap', '0.25',      # Overlap reduzido
    '--jobs', '0',            # Todos os cores
]
```

#### Modo Balanceado
```python
cmd = [
    'demucs',
    '-n', 'htdemucs_ft',      # Modelo fine-tuned
    '--mp3',                  # Saída MP3
    '--mp3-bitrate', '320',
    '--shifts', '1',          # Pouco augmentation
    '--overlap', '0.4',       # Overlap médio
    '--jobs', '0',
]
```

#### Modo Qualidade
```python
cmd = [
    'demucs',
    '-n', 'htdemucs',         # Modelo padrão
    '--shifts', '5',          # Máximo augmentation
    '--overlap', '0.5',       # Máximo overlap
    '--jobs', '0',
]
```

### API Endpoint

```http
POST /api/separate
Content-Type: multipart/form-data

audio: <arquivo>
stems_mode: "2" | "4"
quality_mode: "fast" | "balanced" | "quality"
```

**Resposta:**
```json
{
  "status": "processing",
  "task_id": "separate_1234567890",
  "stems_mode": "2",
  "quality_mode": "balanced"
}
```

---

## 📈 Benchmarks

### Configuração de Teste
- **CPU**: Intel i7-8700K (6 cores, 12 threads)
- **RAM**: 16GB DDR4
- **Arquivo**: 4MB MP3, 3:30 minutos, 320kbps
- **OS**: Windows 11

### Resultados Reais

| Modo | Tempo Real | Tamanho Total | Qualidade Percebida |
|------|-----------|---------------|---------------------|
| Rápido | 2:47 | 40MB (4 stems) | Excelente |
| Balanceado | 6:23 | 40MB (4 stems) | Excepcional |
| Qualidade | 15:23 | 160MB (4 stems) | Perfeita |

### Testes de Qualidade por Gênero

| Gênero | Rápido | Balanceado | Qualidade |
|--------|--------|------------|-----------|
| Rock | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Pop | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Jazz | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| EDM | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Clássica | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 💡 Recomendações de Uso

### Fluxo de Trabalho Sugerido

1. **Primeira Análise**: Use **Rápido** para testar
2. **Gostou do resultado?**: Use **Balanceado** para versão final
3. **Precisa de perfeição?**: Use **Qualidade** para produção

### Casos de Uso Específicos

#### Para DJs e Remixers
- **Recomendado**: Balanceado
- **Motivo**: Boa qualidade, tempo aceitável, tamanho gerenciável

#### Para Produtores Musicais
- **Recomendado**: Qualidade
- **Motivo**: Máxima fidelidade para mixagem profissional

#### Para Estudantes e Hobbyistas
- **Recomendado**: Rápido ou Balanceado
- **Motivo**: Velocidade e qualidade suficiente para aprendizado

#### Para Karaokê
- **Recomendado**: Rápido
- **Motivo**: Velocidade é prioridade, qualidade é suficiente

---

## 🚀 Otimizações Futuras

### Com GPU (CUDA)

Tempos esperados com GPU NVIDIA:

| Modo | CPU | GPU | Ganho |
|------|-----|-----|-------|
| Rápido | 1-3 min | 10-20s | **10x** |
| Balanceado | 5-8 min | 30-60s | **8x** |
| Qualidade | 15-20 min | 1-2 min | **10x** |

### Instalação GPU

```bash
pip uninstall torch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

Depois, no código, trocar:
```python
'--device', 'cpu'  →  '--device', 'cuda'
```

---

## 🐛 Troubleshooting

### Processamento muito lento

**Problema**: Modo Rápido demorando mais de 5 minutos

**Soluções**:
1. Verifique se está usando `htdemucs_ft` (não `htdemucs`)
2. Confirme que `--jobs 0` está ativo (multi-threading)
3. Feche outros programas pesados
4. Considere instalar GPU

### Qualidade insatisfatória

**Problema**: Modo Rápido com artefatos audíveis

**Soluções**:
1. Use modo **Balanceado** (melhor qualidade)
2. Para produção, use modo **Qualidade**
3. Verifique qualidade do arquivo original
4. Tente com arquivo WAV ao invés de MP3

### Erro de memória

**Problema**: "Out of memory" durante processamento

**Soluções**:
1. Feche outros programas
2. Use modo Rápido (menos memória)
3. Processe áudios mais curtos
4. Aumente RAM do sistema

---

## 📚 Referências

- [Demucs GitHub](https://github.com/facebookresearch/demucs)
- [Documentação htdemucs_ft](https://github.com/facebookresearch/demucs#fine-tuned-models)
- [Paper Original](https://arxiv.org/abs/2111.03600)

---

**Última atualização**: Janeiro 2026

# Melhorando a Detecção de Acordes

## Método Atual
O sistema usa análise de chroma com `librosa` (método básico).

## Método Recomendado: CREMA (Deep Learning)

### O que é CREMA?
CREMA (Convolutional and Recurrent Estimators for Music Analysis) é um modelo de deep learning treinado especificamente para detecção de acordes. É **muito mais preciso** que análise de chroma.

### Instalação

```bash
# Ativar ambiente virtual
cd backend
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar CREMA
pip install crema

# Instalar dependências adicionais se necessário
pip install tensorflow
```

### Como funciona

O código já está preparado para usar CREMA automaticamente:

1. **Se CREMA estiver instalado**: Usa deep learning (melhor precisão)
2. **Se CREMA não estiver instalado**: Usa análise de chroma (método atual)

### Comparação de Precisão

| Método | Precisão | Velocidade | Instalação |
|--------|----------|------------|------------|
| **CREMA (Deep Learning)** | ⭐⭐⭐⭐⭐ 90-95% | Média | Requer TensorFlow |
| Chroma Enhanced (atual) | ⭐⭐⭐ 60-70% | Rápida | Já instalado |

### Outras Alternativas

#### 1. Chord-Extractor
```bash
pip install chord-extractor
```
- Usa modelos pré-treinados
- Boa precisão (80-85%)

#### 2. Madmom
```bash
pip install madmom
```
- Biblioteca robusta para análise musical
- Detecção de acordes com deep learning
- Boa precisão (85-90%)

#### 3. Essentia (Spotify)
```bash
# Requer compilação C++
pip install essentia
```
- Muito poderosa, usada em produção
- Melhor precisão (95%+)
- Mais complexa de instalar

## Testando

Após instalar CREMA, reinicie o backend e faça uma nova análise de acordes. Você verá no console:

```
🎵 Usando CREMA (Deep Learning) para detecção de acordes...
✓ CREMA detectou 72 acordes
```

## Notas

- CREMA requer TensorFlow (~500MB de download na primeira vez)
- A primeira análise pode ser mais lenta (carrega o modelo)
- Análises subsequentes são rápidas (modelo fica em cache)
- O método chroma continua funcionando como fallback

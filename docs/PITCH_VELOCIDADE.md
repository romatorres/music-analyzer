# 🎵 Controles de Velocidade e Tonalidade (Pitch Shift)

## 📋 Resumo

Implementação de controles de **velocidade** (0.5x-2.0x) e **tonalidade/pitch** (-12 a +12 semitons) que funcionam **independentemente** da separação de stems, usando **Python/librosa no backend**.

## 🏗️ Arquitetura

### Backend (Python/Flask)
- **Endpoint**: `/api/process-audio`
- **Biblioteca**: librosa 0.10.1 (já instalado)
- **Funções**: `pitch_shift()` e `time_stretch()`
- **Formato**: Retorna WAV processado

### Frontend (React/TypeScript)
- **Hook**: `useAudioEffects` (reescrito, sem Tone.js)
- **Componente**: `AudioControls` com sliders
- **Debounce**: 500ms para pitch shift
- **Velocidade**: Nativa do WaveSurfer (instantânea)

## 🔄 Fluxo de Funcionamento

### Velocidade (Instantânea)
```
Slider → WaveSurfer.setPlaybackRate() → ✓ Toca mais rápido/lento (NATIVO)
```

### Tonalidade (Backend - 2-5 segundos)
```
Slider → Debounce 500ms → POST /api/process-audio → 
Backend processa com librosa (22050 Hz) → Retorna WAV → 
Player atualiza → ✓ Toca com tom alterado
```

## ⚡ Performance

- **Velocidade**: Instantânea (nativa do navegador)
- **Pitch Shift**: 2-5 segundos (depende do tamanho do arquivo)
- **Otimização**: Sample rate reduzido para 22050 Hz (2x mais rápido)
- **Debounce**: 500ms para evitar processar enquanto move o slider

## 🚀 Como Usar

1. **Carregar música** (não precisa separar stems)
2. **Velocidade**: Mover slider (0.5x-2.0x) - efeito instantâneo
3. **Tonalidade**: Mover slider (-12 a +12) - aguardar 2-5s
4. **Resetar**: Botão para voltar aos valores padrão

## 📊 Casos de Uso

- **Praticar instrumento**: Velocidade 0.5x-0.75x
- **Cantar em tom diferente**: Tonalidade -3 a +3
- **Acelerar áudio**: Velocidade 1.25x-1.5x
- **Transpor música**: Tonalidade -12 a +12

## ✅ Vantagens

- ✅ Estável e confiável (librosa)
- ✅ Independente de separação de stems
- ✅ Consistente com arquitetura do projeto
- ✅ Sem dependências extras (tudo já instalado)
- ✅ Código simples e limpo

## 📝 Arquivos Modificados

### Backend
- `backend/app.py` - Endpoint `/api/process-audio`

### Frontend
- `frontend/src/hooks/useAudioEffects.ts` - Reescrito (sem Tone.js)
- `frontend/src/App.tsx` - Integração com backend
- `frontend/src/components/AudioControls.tsx` - UI com indicador de processamento
- `frontend/package.json` - Removido `tone` (~200KB)

## 🐛 Troubleshooting

**Tonalidade não muda**:
- Aguarde 500ms após mover slider (debounce)
- Veja se aparece "Processando..."
- Aguarde 2-5s para processar

**Erro ao processar**:
- Verifique se backend está rodando
- Veja logs do backend no terminal

## 🎉 Resultado

Usuário pode agora:
1. Carregar música
2. Ajustar velocidade (instantâneo)
3. Ajustar tonalidade (2-5s)
4. Separar stems (opcional)
5. Detectar acordes (opcional)

Tudo funciona de forma **independente** e **intuitiva**! 🎵

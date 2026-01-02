# 📝 Changelog - Music Analyzer

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

---

## [1.2.0] - 2026-01-01

### ✨ Adicionado

#### 🎚️ Modos de Qualidade para Separação de Stems
- **3 modos de qualidade** selecionáveis na interface:
  - ⚡ **Rápido**: 1-3 min, Qualidade Boa (8.5/10), ~10MB
  - ⚖️ **Balanceado**: 5-8 min, Qualidade Ótima (9.0/10), ~10MB (Recomendado)
  - 🎵 **Qualidade**: 15-20 min, Qualidade Perfeita (9.5/10), ~40MB

#### 🎨 Interface do Usuário
- Novo componente `QualitySelector` com cards visuais
- Badge "Recomendado" no modo Balanceado
- Informações detalhadas de tempo, qualidade e tamanho
- Botão "Confirmar Separação" após seleção de qualidade

#### 🔧 Backend
- Suporte a 3 configurações diferentes do Demucs
- Parâmetro `quality_mode` na API `/api/separate`
- Validação automática do modo de qualidade
- Metadados salvos (quality_mode, model_used, processing_time)
- Suporte a ambos os modelos (htdemucs e htdemucs_ft)

#### 📚 Documentação
- Novo documento `docs/MODOS_QUALIDADE.md` com guia completo
- README atualizado com seção de modos de qualidade
- Tabelas comparativas e benchmarks
- Recomendações de uso por caso

### 🔄 Modificado
- `AnalysisButtons.tsx`: Agora mostra seletor de qualidade
- `useAnalysis.ts`: Aceita parâmetro `qualityMode`
- `App.tsx`: Passa `qualityMode` para separação
- `process_separation_async()`: Implementa 3 modos diferentes

### 📖 Documentação
- README principal atualizado
- Novo guia completo em `docs/MODOS_QUALIDADE.md`
- `docs/INDEX.md` atualizado com nova seção

---

## [1.1.0] - 2026-01-01

### ✨ Adicionado

#### 🎼 Detecção de Acordes com IA (CREMA)
- **CREMA Deep Learning** instalado e funcionando
- Precisão de 90-95% (vs 60-70% do método anterior)
- Detecção automática de método disponível
- Fallback para método chroma se CREMA não disponível

#### 🎵 Notação Musical Tradicional
- Conversão automática de notação Harte para tradicional
- Exemplos: `C:maj` → `C`, `A:min` → `Am`, `D:maj7` → `Dmaj7`
- Suporte a acordes complexos (diminutos, aumentados, suspensos)

#### 📦 Dependências
- TensorFlow 2.15.1 (compatível com CREMA)
- scikit-learn 1.2.2 (compatibilidade)
- CREMA 0.2.0

### 🔧 Modificado
- `detect_chords_with_autochord()`: Tenta CREMA primeiro
- `analyze_chords_crema()`: Implementação completa do CREMA
- `convert_chord_notation()`: Nova função de conversão

### 📖 Documentação
- `backend/INSTALACAO_CREMA.md`: Guia de instalação
- `backend/CHORD_DETECTION.md`: Comparação de métodos
- README atualizado com seção de acordes

---

## [1.0.0] - 2024-12-XX

### ✨ Lançamento Inicial

#### 🎛️ Player de Música
- Upload de arquivos MP3/WAV
- Player integrado com play/pause
- Waveform interativa clicável
- Controles de progresso

#### 🎸 Separação de Instrumentos
- Demucs 4.0 para separação de stems
- 4 stems: Vocal, Bateria, Baixo, Outros
- Controle individual de volume e mute
- Modo 2 stems (Vocal + Instrumental)

#### 🎼 Detecção de Acordes
- Análise de chroma com librosa
- Timeline de acordes
- Visualização em tempo real

#### 📊 Visualizações
- Waveform com WaveSurfer.js
- Progress bar detalhada
- Interface responsiva

#### 📚 Histórico
- Últimas 20 análises salvas
- Cache de resultados
- Carregamento rápido

#### ⚡ Otimizações
- Processamento assíncrono
- Progress tracking em tempo real
- Multi-threading

---

## Formato

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

### Tipos de Mudanças

- **Adicionado** para novas funcionalidades
- **Modificado** para mudanças em funcionalidades existentes
- **Descontinuado** para funcionalidades que serão removidas
- **Removido** para funcionalidades removidas
- **Corrigido** para correções de bugs
- **Segurança** para vulnerabilidades

---

**Última atualização**: Janeiro 2026

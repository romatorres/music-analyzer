# 📚 Documentação Técnica - Music Analyzer

Esta pasta contém documentação técnica detalhada sobre otimizações e configurações avançadas.

## 📑 Documentos Disponíveis

### Modos de Qualidade

- **[MODOS_QUALIDADE.md](./MODOS_QUALIDADE.md)** - Guia completo dos 3 modos de separação
  - Comparação detalhada (Rápido, Balanceado, Qualidade)
  - Características técnicas de cada modo
  - Benchmarks e testes de qualidade
  - Recomendações de uso por caso
  - Interface do usuário
  - Troubleshooting específico

### Performance e Otimizações

- **[OTIMIZACOES.md](./OTIMIZACOES.md)** - Detalhes sobre as otimizações implementadas no Demucs
  - Comparação antes/depois
  - Configurações otimizadas
  - Benchmarks detalhados
  - Modos de operação

- **[PERFORMANCE.md](./PERFORMANCE.md)** - Guia de performance e troubleshooting
  - Tempos esperados de processamento
  - Limitações de CPU vs GPU
  - Diagnóstico de problemas
  - Recomendações de hardware

### Detecção de Acordes

- **[backend/CHORD_DETECTION.md](../backend/CHORD_DETECTION.md)** - Informações sobre métodos de detecção
  - Comparação de métodos (CREMA vs Chroma)
  - Alternativas disponíveis
  - Instruções de instalação

- **[backend/INSTALACAO_CREMA.md](../backend/INSTALACAO_CREMA.md)** - Guia completo de instalação do CREMA
  - Status da instalação
  - Dependências e versões
  - Troubleshooting
  - Benefícios e resultados

## 🔗 Links Rápidos

- [README Principal](../README.md) - Visão geral do projeto
- [Backend](../backend/) - Código do servidor Flask
- [Frontend](../frontend/) - Código da interface React

## 📊 Resumo Executivo

### Modos de Qualidade (NOVO!)

- ⚡ **Rápido**: 1-3 min, Qualidade Boa (8.5/10), ~10MB
- ⚖️ **Balanceado**: 5-8 min, Qualidade Ótima (9.0/10), ~10MB (Recomendado)
- 🎵 **Qualidade**: 15-20 min, Qualidade Perfeita (9.5/10), ~40MB

### Otimizações Implementadas

- ⚡ **Escolha de qualidade** na interface do usuário
- 🎯 **90-95% de precisão** na detecção de acordes (CREMA)
- 💾 **75% menos espaço** em disco (MP3 vs WAV nos modos rápidos)
- 🎵 **Notação musical tradicional** (C, Am, Dmaj7, etc.)

### Tecnologias Principais

- **Demucs htdemucs_ft**: Separação de instrumentos otimizada (modos Rápido e Balanceado)
- **Demucs htdemucs**: Separação de máxima qualidade (modo Qualidade)
- **CREMA**: Deep learning para detecção de acordes
- **TensorFlow 2.15**: Framework de IA
- **Librosa**: Análise de áudio

---

*Para informações gerais de uso, consulte o [README principal](../README.md)*

# 🎵 Music Analyzer - Player Avançado com IA

Um player de música inteligente que separa instrumentos automaticamente e detecta acordes em tempo real usando Demucs e análise de áudio avançada.

## ✨ Recursos Principais

### 🎛️ Player de Música Integrado
- **Player Comum**: Play/pause imediato ao fazer upload
- **Waveform Interativo**: Clique para navegar pela música
- **Controles Intuitivos**: Barra de progresso clicável
- **Análise Musical**: Botão integrado aos controles do player

### 🎛️ Separação de Instrumentos (Stems)
- **Demucs 4.0**: Separação de alta qualidade usando IA
- **4 Stems**: Vocals, Drums, Bass, Other (harmonia)
- **Controle Individual**: Volume e mute para cada instrumento
- **Mixagem em Tempo Real**: Crie suas próprias versões

### 🎼 Detecção de Acordes
- **Análise Chroma Otimizada**: Detecção precisa de acordes
- **Acordes Complexos**: Maior, menor, 7ª, maj7, min7, power chords
- **Timeline Interativa**: Navegue pelos acordes da música
- **Visualização em Tempo Real**: Acorde atual destacado

### 📊 Visualizações Avançadas
- **Waveform Interativa**: Forma de onda clicável integrada ao player
- **Progress Tracking**: Barra de progresso detalhada durante processamento
- **Interface Responsiva**: Design moderno com Tailwind CSS

### 🎯 Interface Melhorada
- **Drag & Drop**: Arraste arquivos diretamente para o player
- **Histórico de Análises**: Veja suas análises anteriores
- **Player Imediato**: Ouça a música assim que fizer upload
- **Feedback Visual**: Indicadores de progresso e status

## 🚀 Como Usar

### Pré-requisitos
- Python 3.8+
- Node.js 16+
- ~3GB de espaço livre (modelos Demucs)

### Backend (Flask + Demucs)
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend (React + TypeScript)
```bash
cd frontend
npm install
npm run dev
```

### Fluxo de Uso
1. Acesse http://localhost:5173
2. Arraste um arquivo MP3/WAV ou clique para selecionar
3. **Player carrega automaticamente** - use play/pause imediatamente
4. **Waveform aparece** - clique para navegar pela música
5. Clique em **"Análise Musical"** quando quiser separar instrumentos
6. Aguarde o processamento (primeira vez baixa modelos ~2GB)
7. Controle cada instrumento individualmente após análise!

## 🎨 Funcionalidades Detalhadas

### 🎵 Player Integrado
- **Carregamento Imediato**: Áudio disponível assim que selecionado
- **Controles Familiares**: Play/pause, barra de progresso
- **Navegação por Clique**: Clique na barra ou waveform para pular
- **Análise Opcional**: Botão "Análise Musical" integrado aos controles

### 📈 Progress Bar Inteligente
- **7 Etapas**: Desde upload até finalização
- **Tempo Real**: Atualizações via polling
- **Mensagens Descritivas**: Saiba exatamente o que está acontecendo
- **Estimativa Visual**: Porcentagem e etapa atual

### 🌊 Waveform Interativa
- **Integrada ao Player**: Aparece automaticamente com o áudio
- **Navegação**: Clique para pular para qualquer ponto
- **Hover**: Veja o timestamp ao passar o mouse
- **Progresso Visual**: Parte tocada vs não tocada
- **Responsiva**: Adapta-se ao tamanho da tela

### 📚 Histórico Persistente
- **Últimas 20 Análises**: Informações completas
- **Metadados**: Nome, stems, acordes, duração, timestamp
- **Persistência em Arquivo**: Histórico salvo em JSON (mantido após reiniciar)
- **Cache de Análises**: Carregamento rápido de análises anteriores
- **Interface Limpa**: Cards organizados e informativos
- **Acesso Rápido**: Aba dedicada no menu
- **Clique para Carregar**: Restaura stems e acordes instantaneamente

## 🛠️ Arquitetura Técnica

### Backend (Python)
- **Flask**: API REST robusta
- **Demucs**: Separação de stems com IA
- **Librosa**: Análise de áudio e features
- **Threading**: Processamento assíncrono
- **Progress Tracking**: Sistema de monitoramento

### Frontend (React/TypeScript)
- **React 19**: Componentes modernos
- **TypeScript**: Tipagem forte
- **Tailwind CSS**: Design system
- **Lucide Icons**: Ícones consistentes
- **Canvas API**: Visualizações customizadas
- **HTML5 Audio**: Player nativo integrado

### APIs Disponíveis
```
GET  /api/health           - Status do servidor
POST /api/full-analysis    - Análise completa (stems + acordes)
POST /api/waveform         - Gerar waveform
GET  /api/progress/:id     - Progresso de tarefa
GET  /api/history          - Histórico de análises
GET  /api/download/:song/:stem - Download de stem
```

## 🎵 Formatos Suportados
- **MP3**: Qualquer bitrate
- **WAV**: 16/24/32 bit
- **Duração**: Até 10 minutos (otimizado)
- **Qualidade**: Melhor com 44.1kHz+

## 🔧 Configurações Avançadas

### Performance
- **Duração Limitada**: 3 minutos para análise rápida
- **Resolução Adaptativa**: Waveform otimizado
- **Cache Inteligente**: Reutilização de dados processados
- **Polling Eficiente**: Updates de progresso a cada 1s

### Qualidade de Áudio
- **Sample Rate**: 22.05kHz (otimizado)
- **Hop Length**: 512/2048 (balanceado)
- **Chroma Resolution**: 36 bins/octave
- **Threshold**: 0.3 para detecção de acordes

## 🎯 Próximas Melhorias
- [ ] **BPM Detection**: Detecção automática de tempo
- [ ] **Key Detection**: Identificação de tonalidade
- [ ] **Export Features**: Salvar stems e mixagens
- [ ] **Playlist Support**: Múltiplas músicas
- [ ] **EQ Controls**: Equalização por stem
- [ ] **Effects**: Reverb, delay, filtros
- [ ] **MIDI Export**: Acordes para MIDI
- [ ] **Batch Processing**: Múltiplos arquivos

## 📝 Notas de Desenvolvimento
- **Player imediato**: Áudio carrega assim que arquivo é selecionado
- **Análise opcional**: Usuário decide quando fazer análise completa
- **Processamento**: 2-5 minutos por música para análise
- **Memória**: ~2GB RAM durante processamento
- **Storage**: ~3GB para modelos + stems gerados
- **Histórico**: Salvo em `analysis_history.json` (persistente)
- **Cache**: Salvo em `analysis_cache.json` (carregamento rápido)

## 🤝 Contribuindo
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença
MIT License - veja LICENSE para detalhes.

---

**Desenvolvido com ❤️ usando Demucs, React e muito café ☕**
// src/App.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { CornerDownLeft, BarChart3, Music } from "lucide-react";
import { Button } from "./components/ui/button";
import type WaveSurfer from "wavesurfer.js";
import clsx from "clsx";

// Componentes
import { FileUploader } from "./components/FileUploader";
import ProgressBar from "./components/ProgressBar";
import type { WaveformHandle } from "./components/WaveformVisualizer";
import AnalysisHistory from "./components/AnalysisHistory";
import ChordSlider from "./components/ChordSlider";
import { Header } from "./components/Header";
import { MusicPlayer } from "./components/MusicPlayer";
import { SeparationSettings } from "./components/SeparationSettings";
import { StemsControl } from "./components/StemsControl";
import { AudioControls } from "./components/AudioControls";

// Hooks
import { useAudioManager } from "./hooks/useAudioManager";
import { useAnalysis } from "./hooks/useAnalysis";
import { useHistory } from "./hooks/useHistory";
import { useAudioEffects } from "./hooks/useAudioEffects";

// Types
import type { Stem, Chord, StemVolumes, MutedStems, SoloStems } from "./types";

export default function MusicAnalyzer() {
  // Estados básicos
  const [file, setFile] = useState<File | null>(null);
  const [stems, setStems] = useState<Stem[]>([]);
  const [chords, setChords] = useState<Chord[]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [stemVolumes, setStemVolumes] = useState<StemVolumes>({});
  const [mutedStems, setMutedStems] = useState<MutedStems>({});
  const [soloStems, setSoloStems] = useState<SoloStems>({});
  const [masterVolume, setMasterVolume] = useState<number>(1);
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [loadedFromHistory, setLoadedFromHistory] = useState<string | null>(
    null
  );
  const [showPlayerView, setShowPlayerView] = useState(false);
  const [audioUrlForVisualizer, setAudioUrlForVisualizer] = useState<
    string | null
  >(null);
  const [stemsMode, setStemsMode] = useState<"2" | "4" | "6">("4");
  const [quality, setQuality] = useState<"basic" | "intermediate" | "maximum">(
    "intermediate"
  );

  // Refs
  const visualizerRef = useRef<WaveformHandle | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const API_URL = "http://localhost:5000";

  // Hooks customizados
  const {
    audioRefs,
    syncAudioTime,
    playAllStems,
    pauseAllStems,
    resetAllStems,
    cleanupOldRefs,
  } = useAudioManager(
    masterVolume,
    isMasterMuted,
    stemVolumes,
    mutedStems,
    soloStems
  );

  // Limpar refs antigos quando stems mudarem
  useEffect(() => {
    const currentStemNames = stems.map((s) => s.name);
    cleanupOldRefs(currentStemNames);
  }, [stems, cleanupOldRefs]);

  const {
    analyzing,
    separating,
    detectingChords,
    progress,
    setProgress,
    separateStems,
    detectChords,
  } = useAnalysis(API_URL);

  const { history, loadHistory, loadAnalysisFromHistory, deleteAnalysis } =
    useHistory(API_URL);

  // Hook de efeitos de áudio (backend-based)
  const {
    playbackRate,
    pitchShift,
    isProcessing: isProcessingAudio,
    processedAudioUrl,
    setPlaybackRate,
    setPitchShift,
    processAudioDebounced,
  } = useAudioEffects(API_URL);

  // Carregar histórico ao inicializar
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Atualizar velocidade do WaveSurfer (apenas velocidade, pitch é no backend)
  useEffect(() => {
    if (wavesurferRef.current) {
      // Velocidade funciona nativamente no WaveSurfer
      wavesurferRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate]);

  // Atualizar velocidade dos stems
  useEffect(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.playbackRate = playbackRate;
      }
    });
  }, [playbackRate, audioRefs]);

  // Processar áudio quando PITCH mudar (velocidade é nativa do WaveSurfer)
  useEffect(() => {
    // Só processar pitch se houver arquivo carregado (novo ou do histórico)
    if (!file && !loadedFromHistory) {
      return;
    }

    // Se pitch é 0, voltar ao áudio original
    if (pitchShift === 0) {
      console.log("[App] Pitch = 0, voltando ao áudio original");
      
      if (processedAudioUrl) {
        URL.revokeObjectURL(processedAudioUrl);
      }
      
      // Voltar ao áudio original
      if (file) {
        const originalUrl = URL.createObjectURL(file);
        setAudioUrlForVisualizer(originalUrl);
      } else if (loadedFromHistory) {
        // Para histórico, recarregar do servidor
        const historyUrl = `${API_URL}/uploads/${encodeURIComponent(loadedFromHistory)}`;
        setAudioUrlForVisualizer(historyUrl);
      }
      
      return;
    }

    // IMPORTANTE: Priorizar histórico sobre file
    // Se loadedFromHistory existe, sempre usar a URL (mesmo que file exista)
    if (loadedFromHistory && audioUrlForVisualizer) {
      // Para arquivos do histórico, enviar a URL do áudio
      processAudioDebounced(loadedFromHistory, pitchShift, playbackRate, audioUrlForVisualizer);
    } else if (file) {
      // Arquivo novo carregado - enviar o File object
      processAudioDebounced(file.name, pitchShift, playbackRate, undefined, file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitchShift, file, loadedFromHistory]); // Removido playbackRate das dependências!

  // Atualizar URL do visualizador quando áudio processado estiver pronto
  useEffect(() => {
    if (processedAudioUrl) {
      console.log("[App] Áudio processado pronto, atualizando visualizador");
      
      // Resetar player para carregar novo áudio
      if (wavesurferRef.current) {
        const wasPlaying = wavesurferRef.current.isPlaying();
        const currentTimeBeforeLoad = wavesurferRef.current.getCurrentTime();
        const durationBeforeLoad = wavesurferRef.current.getDuration();
        
        console.log(`[App] Estado antes de carregar: playing=${wasPlaying}, time=${currentTimeBeforeLoad.toFixed(2)}s`);
        
        // Recarregar com novo áudio
        wavesurferRef.current.load(processedAudioUrl);
        
        // Restaurar posição e estado de reprodução
        wavesurferRef.current.once('ready', () => {
          if (wavesurferRef.current) {
            
            
            // Calcular posição relativa (0-1)
            const relativePosition = durationBeforeLoad > 0 
              ? currentTimeBeforeLoad / durationBeforeLoad 
              : 0;
            
            console.log(`[App] Restaurando: position=${relativePosition.toFixed(3)}, wasPlaying=${wasPlaying}`);
            
            // Restaurar posição
            if (relativePosition > 0 && relativePosition < 1) {
              wavesurferRef.current.seekTo(relativePosition);
            }
            
            // Restaurar reprodução
            if (wasPlaying) {
              console.log("[App] Retomando reprodução...");
              wavesurferRef.current.play();
              setPlaying(true);
            }
          }
        });
      }
      
      setAudioUrlForVisualizer(processedAudioUrl);
    } else if (file && !loadedFromHistory) {
      // Voltar para áudio original apenas se for arquivo novo
      const originalUrl = URL.createObjectURL(file);
      setAudioUrlForVisualizer(originalUrl);
    }
  }, [processedAudioUrl, file, loadedFromHistory]);

  // Handlers de arquivo
  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setStems([]);
      setChords([]);
      setAudioLoaded(false);
      setPlaying(false);
      setLoadedFromHistory(null);
      setShowPlayerView(true);

      const audioUrl = URL.createObjectURL(selectedFile);
      setAudioUrlForVisualizer(audioUrl);
    } else {
      setFile(null);
      setAudioLoaded(false);
      setLoadedFromHistory(null);
      setShowPlayerView(false);
      setAudioUrlForVisualizer(null);
    }
  };

  const handleClearFile = () => {
    handleFileSelect(null);
  };

  const resetToInitialView = () => {
    setFile(null);
    setStems([]);
    setChords([]);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setStemVolumes({});
    setMutedStems({});
    setSoloStems({});
    setAudioLoaded(false);
    setLoadedFromHistory(null);
    setShowPlayerView(false);
    setAudioUrlForVisualizer(null);

    pauseAllStems();
  };

  // Handlers de análise
  const handleSeparateStems = () => {
    if (!file) return;

    console.log("[App] Iniciando separação de stems...");
    separateStems(file, stemsMode, quality, {
      onSuccess: ({ stems: newStems, volumes, mutes }) => {
        console.log("[App] onSuccess chamado! Stems recebidos:", newStems);
        setStems(newStems);
        setStemVolumes(volumes);
        setMutedStems(mutes);
        setSoloStems({}); // Reset solo state on new separation
        loadHistory();
        console.log(
          "[App] Estados atualizados. Stems length:",
          newStems.length
        );
      },
      onError: () => {
        console.error("[App] onError chamado!");
      },
      onComplete: () => {
        console.log("[App] onComplete chamado!");
      },
    });
  };

  const handleDetectChords = () => {
    if (!file) return;

    detectChords(file, {
      onSuccess: (newChords) => {
        setChords(newChords);
        loadHistory();
      },
      onError: () => {},
      onComplete: () => {},
    });
  };

  // Handlers de histórico
  const handleLoadFromHistory = (filename: string) => {
    loadAnalysisFromHistory(filename, {
      onSuccess: ({
        stems: newStems,
        chords: newChords,
        volumes,
        mutes,
        audioUrl,
      }) => {
        setStems(newStems);
        setStemVolumes(volumes);
        setMutedStems(mutes);
        setChords(newChords);
        setSoloStems({});
        setAudioUrlForVisualizer(audioUrl);
        setLoadedFromHistory(filename);
        setFile(null);
        setAudioLoaded(false);
        setPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setShowPlayerView(true);
      },
      onError: () => {
        setProgress({
          step: -1,
          message: "Erro ao carregar análise do histórico",
          percentage: 0,
          timestamp: new Date().toISOString(),
        });
        setTimeout(() => setProgress(null), 3000);
      },
      setProgress,
    });
  };

  const handleDeleteAnalysis = (filename: string) => {
    deleteAnalysis(filename, {
      onSuccess: () => {
        if (loadedFromHistory === filename) {
          resetToInitialView();
        }
        loadHistory();
      },
      onError: () => {
        setProgress({
          step: -1,
          message: "Erro ao deletar análise",
          percentage: 0,
          timestamp: new Date().toISOString(),
        });
        setTimeout(() => setProgress(null), 3000);
      },
      setProgress,
    });
  };

  // Handlers de player
  const togglePlayPause = () => {
    visualizerRef.current?.togglePlayPause();
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const time = e.currentTarget.currentTime;
    setCurrentTime(time);
    syncAudioTime(time);
  };

  const handleVolumeChange = (stem: string, value: number) => {
    setStemVolumes((prev) => ({ ...prev, [stem]: value }));
  };

  const toggleMute = (stem: string) => {
    setMutedStems((prev) => ({ ...prev, [stem]: !prev[stem] }));
  };

  const handleToggleSolo = (stem: string) => {
    setSoloStems((prev) => ({ ...prev, [stem]: !prev[stem] }));
  };

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
  };

  const handleMasterMuteToggle = () => {
    setIsMasterMuted((prev) => !prev);
  };

  // Handlers do visualizador
  const handleVisualizerReady = useCallback((dur: number) => {
    console.log("[App] Visualizer ready, duration:", dur);
    setDuration(dur);
    setAudioLoaded(true);
  }, []);

  const handleVisualizerTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time);
      if (stems.length > 0) {
        syncAudioTime(time);
      }
    },
    [stems.length, syncAudioTime]
  );

  const handleVisualizerFinish = useCallback(() => {
    setPlaying(false);
    resetAllStems();
  }, [resetAllStems]);

  const handleVisualizerPlaybackChange = useCallback(
    (isPlaying: boolean) => {
      setPlaying(isPlaying);
      if (stems.length > 0) {
        if (isPlaying) {
          playAllStems();
        } else {
          pauseAllStems();
        }
      }
    },
    [stems.length, playAllStems, pauseAllStems]
  );

  const isDisabled = detectingChords || chords.length > 0;

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <div className="max-w-7xl mx-auto my-14 px-3">
        <div className="text-center my-8">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Análise Musical com{" "}
            <span className="text-primary glow-text">IA</span>
          </h2>
          <p className="text-gray-400">
            Separe instrumentos, detecte acordes e analise qualquer música
          </p>
        </div>

        {/* Upload e Histórico */}
        {!showPlayerView && (
          <div className="flex flex-col gap-6 mb-8">
            <FileUploader
              onFileSelect={handleFileSelect}
              selectedFile={file}
              isLoading={analyzing}
              onClear={handleClearFile}
            />
            <AnalysisHistory
              history={history}
              onSelectFile={handleLoadFromHistory}
              onDeleteFile={handleDeleteAnalysis}
            />
          </div>
        )}

        {/* Player View */}
        {showPlayerView && (
          <div>
            <div className="flex justify-start mb-4">
              <button onClick={resetToInitialView}>
                <CornerDownLeft className="w-8 h-8 text-primary/70 hover:text-primary transition duration-200 ease-in-out" />
              </button>
            </div>

            {progress && (
              <div className="mb-8">
                <ProgressBar
                  percentage={progress.percentage}
                  message={progress.message}
                  step={progress.step}
                  totalSteps={7}
                />
              </div>
            )}

            <MusicPlayer
              file={file}
              loadedFromHistory={loadedFromHistory}
              audioUrlForVisualizer={audioUrlForVisualizer}
              playing={playing}
              audioLoaded={audioLoaded}
              currentTime={currentTime}
              duration={duration}
              masterVolume={masterVolume}
              isMasterMuted={isMasterMuted}
              visualizerRef={visualizerRef}
              wavesurferRef={wavesurferRef}
              hasSeparatedStems={stems.length > 0}
              onVisualizerReady={handleVisualizerReady}
              onVisualizerTimeUpdate={handleVisualizerTimeUpdate}
              onVisualizerFinish={handleVisualizerFinish}
              onVisualizerPlaybackChange={handleVisualizerPlaybackChange}
              onTogglePlayPause={togglePlayPause}
              onMasterVolumeChange={handleMasterVolumeChange}
              onMasterMuteToggle={handleMasterMuteToggle}
            />

            {/* Controles de Velocidade e Tonalidade - Disponível desde o carregamento */}
            {showPlayerView && (
              <AudioControls
                playbackRate={playbackRate}
                pitchShift={pitchShift}
                onPlaybackRateChange={setPlaybackRate}
                onPitchShiftChange={setPitchShift}
                isProcessing={isProcessingAudio}
              />
            )}

            {file && !loadedFromHistory && stems.length === 0 && (
              <div className="flex flex-col items-center gap-6 my-8">
                <SeparationSettings
                  stemsMode={stemsMode}
                  onStemsModeChange={setStemsMode}
                  quality={quality}
                  onQualityChange={setQuality}
                  onSeparate={handleSeparateStems}
                  isSeparating={separating}
                  disabled={analyzing}
                />
              </div>
            )}

            <StemsControl
              stems={stems}
              stemVolumes={stemVolumes}
              mutedStems={mutedStems}
              soloStems={soloStems}
              apiUrl={API_URL}
              audioRefs={audioRefs}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
              onToggleSolo={handleToggleSolo}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />
          </div>
        )}

        {showPlayerView && (
          <div className="glass-card p-6 mt-8">
            <div className="mb-6 flex items-center gap-2">
              <span className="text-primary">
                <Music />
              </span>
              <h3 className="text-xl">
                {chords.length > 0
                  ? "Analise concluida"
                  : "Analisar e Detectar Acordes"}
              </h3>
            </div>

            {/* ChordSlider */}
            {chords.length > 0 && (
              <div className="mt-6">
                <ChordSlider chords={chords} currentTime={currentTime} />
              </div>
            )}
            <div className="flex justify-center">
              <Button
                onClick={handleDetectChords}
                disabled={isDisabled}
                size="lg"
                variant="default"
                className={clsx(
                  "gap-2 w-full md:w-auto px-10 py-6 text-lg transition-all duration-200",
                  {
                    "border-2 border-primary": !isDisabled,
                  },
                  {
                    "bg-muted text-muted-foreground cursor-default hover:bg-muted hover:text-muted-foreground":
                      isDisabled,
                  }
                )}
              >
                <BarChart3 className="h-5 w-5" />
                {detectingChords ? "Detectando..." : "Detectar Acordes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

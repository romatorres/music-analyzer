// src/App.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Music,
  Disc,
  Radio,
  Activity,
  Play,
  Pause,
  Volume2,
  VolumeX,
  History,
  BarChart3,
  Plus,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import WaveSurfer from "wavesurfer.js";

// Componentes
import { Button } from "./components/ui/button";
import { FileUploader } from "./components/FileUploader";
import ProgressBar from "./components/ProgressBar";
import { WaveformVisualizer } from "./components/WaveformVisualizer";
import type { WaveformHandle } from "./components/WaveformVisualizer";
import AnalysisHistory from "./components/AnalysisHistory";
import ChordSlider from "./components/ChordSlider";
import { Header } from "./components/Header";

interface Stem {
  name: string;
  path?: string;
  url: string;
}

interface Chord {
  start: number;
  end: number;
  chord: string;
}

interface AnalysisResponse {
  status: string;
  stems?: Stem[];
  chords?: Chord[];
  method?: string;
  message?: string;
  task_id?: string;
}

interface ProgressData {
  step: number;
  message: string;
  percentage: number;
  timestamp: string;
}

interface StemVolumes {
  [key: string]: number;
}

interface MutedStems {
  [key: string]: boolean;
}

interface AudioRefs {
  [key: string]: HTMLAudioElement | null;
}

interface HistoryItem {
  filename: string;
  stems_count: number;
  chords_count: number;
  duration: number;
  timestamp: string;
}

export default function MusicAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [stems, setStems] = useState<Stem[]>([]);
  const [chords, setChords] = useState<Chord[]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [stemVolumes, setStemVolumes] = useState<StemVolumes>({});
  const [mutedStems, setMutedStems] = useState<MutedStems>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [loadedFromHistory, setLoadedFromHistory] = useState<string | null>(
    null
  );
  const [showPlayerView, setShowPlayerView] = useState(false);
  const [audioUrlForVisualizer, setAudioUrlForVisualizer] = useState<
    string | null
  >(null);

  const audioRefs = useRef<AudioRefs>({});
  const visualizerRef = useRef<WaveformHandle>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const API_URL = "http://localhost:5000";

  // Carregar histórico ao inicializar
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  const loadAnalysisFromHistory = async (filename: string) => {
    try {
      console.log("Carregando análise:", filename);

      const response = await fetch(
        `${API_URL}/api/analysis/${encodeURIComponent(filename)}`
      );
      if (!response.ok) {
        throw new Error("Análise não encontrada");
      }

      const data: AnalysisResponse = await response.json();

      // Carregar stems e acordes
      setStems(data.stems || []);
      setChords(data.chords || []);

      const otherStem = data.stems?.find((s) => s.name === "other");
      const audioForViz = otherStem || data.stems?.[0];
      if (audioForViz) {
        setAudioUrlForVisualizer(`${API_URL}${audioForViz.url}`);
      }

      // Inicializar volumes e mutes para os stems
      const volumes: StemVolumes = {};
      const mutes: MutedStems = {};
      data.stems?.forEach((stem) => {
        volumes[stem.name] = 1;
        mutes[stem.name] = false;
      });
      setStemVolumes(volumes);
      setMutedStems(mutes);

      // Marcar como carregado do histórico
      setLoadedFromHistory(filename);

      // Limpar arquivo local e player principal
      setFile(null);
      setAudioLoaded(false);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      // Não precisa mais mudar de view
      setShowPlayerView(true);

      console.log(
        "Análise carregada:",
        data.stems?.length,
        "stems,",
        data.chords?.length,
        "acordes"
      );

      // Mostrar mensagem de sucesso temporária
      setProgress({
        step: 7,
        message: `Análise de "${filename}" carregada com sucesso!`,
        percentage: 100,
        timestamp: new Date().toISOString(),
      });
      setTimeout(() => setProgress(null), 3000);
    } catch (error) {
      console.error("Erro ao carregar análise:", error);
      setProgress({
        step: -1,
        message: "Erro ao carregar análise do histórico",
        percentage: 0,
        timestamp: new Date().toISOString(),
      });
      setTimeout(() => setProgress(null), 3000);
    }
  };

  const pollProgress = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/progress/${taskId}`);
        if (response.ok) {
          const progressData = await response.json();
          setProgress(progressData);

          if (progressData.percentage >= 100 || progressData.step === -1) {
            clearInterval(pollInterval);
            if (progressData.step !== -1) {
              setTimeout(() => setProgress(null), 2000);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar progresso:", error);
        clearInterval(pollInterval);
      }
    }, 1000);

    return pollInterval;
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setStems([]);
      setChords([]);
      setAudioLoaded(false);
      setPlaying(false);
      setLoadedFromHistory(null); // Limpar indicador de histórico
      setShowPlayerView(true);

      // Criar URL do arquivo para o player (carregamento local instantâneo)
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
    setAnalyzing(false);
    setProgress(null);
    setStems([]);
    setChords([]);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setStemVolumes({});
    setMutedStems({});
    setAudioLoaded(false);
    setLoadedFromHistory(null);
    setShowPlayerView(false);
    setAudioUrlForVisualizer(null);

    // Pausar todos os stems se estiverem tocando
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) audio.pause();
    });
    audioRefs.current = {}; // Limpar referências de áudio dos stems
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setAnalyzing(true);
    setProgress({
      step: 1,
      message: "Iniciando análise...",
      percentage: 0,
      timestamp: new Date().toISOString(),
    });

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await fetch(`${API_URL}/api/full-analysis`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro na análise");

      const data: AnalysisResponse = await response.json();

      if (data.task_id) {
        pollProgress(data.task_id);
      }

      setStems(data.stems || []);
      setChords(data.chords || []);

      // Inicializar volumes e mutes para os stems
      const volumes: StemVolumes = {};
      const mutes: MutedStems = {};
      data.stems?.forEach((stem) => {
        volumes[stem.name] = 1;
        mutes[stem.name] = false;
      });
      setStemVolumes(volumes);
      setMutedStems(mutes);

      // Recarregar histórico
      loadHistory();
    } catch (error) {
      console.error("Erro:", error);
      setProgress({
        step: -1,
        message: "Erro na análise. Verifique se o backend está rodando.",
        percentage: 0,
        timestamp: new Date().toISOString(),
      });
      setTimeout(() => setProgress(null), 5000);
    } finally {
      setAnalyzing(false);
    }
  };

  const togglePlayPause = () => {
    visualizerRef.current?.togglePlayPause();
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const time = e.currentTarget.currentTime;
    setCurrentTime(time);

    // Sincronizar todos os áudios
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio && Math.abs(audio.currentTime - time) > 0.1) {
        audio.currentTime = time;
      }
    });
  };

  const handleVolumeChange = (stem: string, value: number) => {
    setStemVolumes((prev) => ({ ...prev, [stem]: value }));
    if (audioRefs.current[stem]) {
      audioRefs.current[stem]!.volume = value;
    }
  };

  const toggleMute = (stem: string) => {
    setMutedStems((prev) => {
      const newMuted = { ...prev, [stem]: !prev[stem] };
      if (audioRefs.current[stem]) {
        audioRefs.current[stem]!.muted = newMuted[stem];
      }
      return newMuted;
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStemIcon = (stemName: string) => {
    const icons: { [key: string]: React.ComponentType<LucideProps> } = {
      vocals: Radio,
      drums: Activity,
      bass: Disc,
      other: Music,
    };
    return icons[stemName] || Music;
  };

  const getStemColor = (stemName: string): string => {
    const colors: { [key: string]: string } = {
      vocals: "bg-purple-500",
      drums: "bg-red-500",
      bass: "bg-blue-500",
      other: "bg-green-500",
    };
    return colors[stemName] || "bg-gray-500";
  };

  const handleVisualizerReady = useCallback((duration: number) => {
    setDuration(duration);
    setAudioLoaded(true);
  }, []);

  const handleVisualizerTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time);
      if (stems.length > 0) {
        Object.values(audioRefs.current).forEach((audio) => {
          if (audio && Math.abs(audio.currentTime - time) > 0.15) {
            audio.currentTime = time;
          }
        });
      }
    },
    [stems.length]
  );

  const handleVisualizerFinish = useCallback(() => {
    setPlaying(false);
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.currentTime = 0;
      }
    });
  }, []);

  const handleVisualizerPlaybackChange = useCallback(
    (isPlaying: boolean) => {
      setPlaying(isPlaying);
      if (stems.length > 0) {
        if (isPlaying) {
          Object.values(audioRefs.current).forEach((audio) => {
            if (audio) audio.play().catch((e) => console.error(e));
          });
        } else {
          Object.values(audioRefs.current).forEach((audio) => {
            if (audio) audio.pause();
          });
        }
      }
    },
    [stems.length]
  );

  const renderContent = () => {
    return (
      <>
        {/* Player Principal ou Stems do Histórico */}
        {(file || loadedFromHistory) && (
          <div className="glass-card rounded-lg p-4 text-center neon-border mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Music className="w-6 h-6" />
                {loadedFromHistory ? "Análise Carregada" : "Player"}
              </h2>
              {loadedFromHistory && (
                <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Do Histórico
                </div>
              )}
            </div>

            {/* Mostrar nome do arquivo carregado */}
            {loadedFromHistory && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400">Arquivo:</p>
                <p className="font-semibold text-white">{loadedFromHistory}</p>
              </div>
            )}

            {/* Waveform Interativo */}
            {audioUrlForVisualizer && (
              <div className="mb-6">
                <WaveformVisualizer
                  ref={visualizerRef}
                  wavesurferRef={wavesurferRef}
                  audioUrl={audioUrlForVisualizer}
                  isPlaying={playing}
                  onReady={handleVisualizerReady}
                  onTimeUpdate={handleVisualizerTimeUpdate}
                  onFinish={handleVisualizerFinish}
                  onPlaybackChange={handleVisualizerPlaybackChange}
                />
              </div>
            )}

            {/* Controles do Player */}
            <div className="">
              <div className="flex items-center gap-4 mb-4 justify-between">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span className="text-primary">
                    {formatTime(currentTime)}
                  </span>
                  <span> / </span>
                  <span>{formatTime(duration)}</span>
                </div>
                <button
                  onClick={togglePlayPause}
                  disabled={!audioLoaded}
                  className="bg-secondary hover:bg-secondary/50 disabled:bg-secondary-foreground p-4 rounded-full transition-colors"
                >
                  {playing ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </button>
                <div>Vol</div>
              </div>
              <div>
                {/* Botão de Análise Musical - só para arquivo local */}
                {file && !loadedFromHistory && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing || !file}
                    variant={"default"}
                  >
                    <BarChart3 className="w-5 h-5" />
                    {analyzing ? "Analisando..." : "Análise Musical"}
                  </Button>
                )}
              </div>

              {/* Status de carregamento */}
              {!audioLoaded && (
                <div className="text-center text-sm text-yellow-400 mb-4 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                  Carregando áudio...
                </div>
              )}

              {/* Informação para histórico */}
              {loadedFromHistory && stems.length === 0 && (
                <div className="text-center text-sm text-gray-400 mb-4">
                  Carregando stems...
                </div>
              )}
            </div>

            {/* Chord Slider - Aparece quando há acordes */}
            {chords.length > 0 && (
              <div className="mt-6">
                <ChordSlider chords={chords} currentTime={currentTime} />
              </div>
            )}
          </div>
        )}

        {/* Stems Control - Só aparece após análise */}
        {stems.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Disc className="w-6 h-6" />
              Controle de Instrumentos ({stems.length} stems)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {stems.map((stem) => {
                const Icon = getStemIcon(stem.name);
                const colorClass = getStemColor(stem.name);

                return (
                  <div
                    key={stem.name}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`${colorClass} p-2 rounded-lg`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold capitalize flex-1">
                        {stem.name}
                      </span>
                      <button
                        onClick={() => toggleMute(stem.name)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {mutedStems[stem.name] ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={stemVolumes[stem.name] || 1}
                      onChange={(e) =>
                        handleVolumeChange(
                          stem.name,
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                    <audio
                      ref={(el) => {
                        if (el) audioRefs.current[stem.name] = el;
                      }}
                      src={`${API_URL}${stem.url}`}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={(e) =>
                        setDuration(e.currentTarget.duration)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      {/* Header */}
      <Header />
      <div className="max-w-7xl mx-auto my-14">
        <div className="text-center my-8">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Análise Musical com{" "}
            <span className="text-primary glow-text">IA</span>
          </h2>
          <p className="text-muted-foreground">
            Separe instrumentos, detecte acordes e analise qualquer música
          </p>
        </div>

        {/* Layout em Grid: Upload/Histórico lado a lado */}
        {!showPlayerView && (
          <div className="flex flex-col gap-6 mb-8">
            {/* Upload Area */}
            <div>
              <FileUploader
                onFileSelect={handleFileSelect}
                selectedFile={file}
                isLoading={analyzing}
                onClear={handleClearFile}
              />
            </div>

            {/* Histórico */}
            <div>
              <AnalysisHistory
                history={history}
                onSelectFile={loadAnalysisFromHistory}
              />
            </div>
          </div>
        )}

        {/* Player and Controls */}
        {showPlayerView && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={resetToInitialView} variant={"outline"}>
                <Plus className="w-4 h-4" />
                Começar
              </Button>
            </div>
            {/* Progress Bar */}
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
            {/* Content Area - Player e Controles */}
            <div>{renderContent()}</div>
          </div>
        )}
      </div>
    </div>
  );
}

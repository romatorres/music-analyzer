// src/components/MusicPlayer.tsx
import { Music, History } from "lucide-react";
import { WaveformVisualizer } from "./WaveformVisualizer";
import type { WaveformHandle } from "./WaveformVisualizer";
import { PlayerControls } from "./PlayerControls";
import type WaveSurfer from "wavesurfer.js";

interface MusicPlayerProps {
  file: File | null;
  loadedFromHistory: string | null;
  audioUrlForVisualizer: string | null;
  playing: boolean;
  audioLoaded: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  isMasterMuted: boolean;
  visualizerRef: React.RefObject<WaveformHandle | null>;
  wavesurferRef: React.MutableRefObject<WaveSurfer | null>;
  hasSeparatedStems: boolean; // Nova prop
  onVisualizerReady: (duration: number) => void;
  onVisualizerTimeUpdate: (time: number) => void;
  onVisualizerFinish: () => void;
  onVisualizerPlaybackChange: (isPlaying: boolean) => void;
  onTogglePlayPause: () => void;
  onMasterVolumeChange: (value: number) => void;
  onMasterMuteToggle: () => void;
}

export function MusicPlayer({
  file,
  loadedFromHistory,
  audioUrlForVisualizer,
  playing,
  audioLoaded,
  currentTime,
  duration,
  masterVolume,
  isMasterMuted,
  visualizerRef,
  wavesurferRef,
  hasSeparatedStems,
  onVisualizerReady,
  onVisualizerTimeUpdate,
  onVisualizerFinish,
  onVisualizerPlaybackChange,
  onTogglePlayPause,
  onMasterVolumeChange,
  onMasterMuteToggle,
}: MusicPlayerProps) {
  if (!file && !loadedFromHistory) return null;

  return (
    <div className="glass-card p-4 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Music className="w-6 h-6 text-primary" />
          {loadedFromHistory ? "Análise Carregada" : "Player"}
        </h2>
        {loadedFromHistory && (
          <div className="badge-secondary flex items-center gap-2">
            <History className="w-4 h-4" />
            Do Histórico
          </div>
        )}
      </div>

      {loadedFromHistory && (
        <div className="mb-4 p-3 rounded-lg">
          <p className="font-semibold text-white">{loadedFromHistory}</p>
        </div>
      )}

      {audioUrlForVisualizer && (
        <div className="mb-6">
          <WaveformVisualizer
            ref={visualizerRef}
            wavesurferRef={wavesurferRef}
            audioUrl={audioUrlForVisualizer}
            isPlaying={playing}
            currentTime={currentTime}
            hasSeparatedStems={hasSeparatedStems}
            onReady={onVisualizerReady}
            onTimeUpdate={onVisualizerTimeUpdate}
            onFinish={onVisualizerFinish}
            onPlaybackChange={onVisualizerPlaybackChange}
          />
        </div>
      )}

      <div>
        <PlayerControls
          playing={playing}
          audioLoaded={audioLoaded}
          currentTime={currentTime}
          duration={duration}
          masterVolume={masterVolume}
          isMasterMuted={isMasterMuted}
          onTogglePlayPause={onTogglePlayPause}
          onMasterVolumeChange={onMasterVolumeChange}
          onMasterMuteToggle={onMasterMuteToggle}
        />

        {!audioLoaded && (
          <div className="text-center text-sm text-yellow-400 mb-4 flex items-center justify-center gap-2">
            <div className="spinner-primary h-4 w-4"></div>
            Carregando áudio...
          </div>
        )}
      </div>
    </div>
  );
}

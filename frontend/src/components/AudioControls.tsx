import { Gauge, Music2, RotateCcw } from "lucide-react";
import { Slider } from "./ui/slider";

interface AudioControlsProps {
  playbackRate: number;
  pitchShift: number;
  onPlaybackRateChange: (rate: number) => void;
  onPitchShiftChange: (semitones: number) => void;
  isProcessing?: boolean;
}

export function AudioControls({
  playbackRate,
  pitchShift,
  onPlaybackRateChange,
  onPitchShiftChange,
  isProcessing = false,
}: AudioControlsProps) {
  const handleReset = () => {
    onPlaybackRateChange(1);
    onPitchShiftChange(0);
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          Controles de Áudio
          {isProcessing && (
            <span className="text-xs text-yellow-400 animate-pulse">
              (Processando...)
            </span>
          )}
        </h3>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          title="Resetar controles"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Resetar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Velocidade */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">
              Velocidade
            </label>
            <span className="text-sm font-mono text-primary font-semibold px-2 py-0.5 bg-primary/10 rounded">
              {playbackRate.toFixed(2)}x
            </span>
          </div>
          <Slider
            value={[playbackRate]}
            onValueChange={([value]) => onPlaybackRateChange(value)}
            min={0.5}
            max={2}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.5x (Lento)</span>
            <span>1.0x</span>
            <span>2.0x (Rápido)</span>
          </div>
        </div>

        {/* Tonalidade */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
              <Music2 className="w-4 h-4" />
              Tonalidade
            </label>
            <span className="text-sm font-mono text-secondary font-semibold px-2 py-0.5 bg-secondary/10 rounded">
              {pitchShift > 0 ? "+" : ""}
              {pitchShift} {Math.abs(pitchShift) === 1 ? "semitom" : "semitons"}
            </span>
          </div>
          <Slider
            value={[pitchShift]}
            onValueChange={([value]) => onPitchShiftChange(value)}
            min={-12}
            max={12}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>-12 (Grave)</span>
            <span>0</span>
            <span>+12 (Agudo)</span>
          </div>
          {isProcessing && pitchShift !== 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
              <p className="text-xs text-blue-400 flex items-center gap-1.5">
                <span className="animate-spin">⚙️</span>
                <span>Processando alteração de tonalidade...</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      {(playbackRate !== 1 || pitchShift !== 0) && (
        <div className="text-xs text-gray-400 bg-muted/30 rounded-lg p-3 border border-border/30">
          <p className="flex items-center gap-1.5">
            <span className="text-primary">•</span>
            {playbackRate !== 1 && (
              <span>
                Velocidade alterada para{" "}
                <strong className="text-primary">{playbackRate.toFixed(2)}x</strong>
              </span>
            )}
            {playbackRate !== 1 && pitchShift !== 0 && <span className="text-gray-600">|</span>}
            {pitchShift !== 0 && (
              <span>
                Tom {pitchShift > 0 ? "aumentado" : "diminuído"} em{" "}
                <strong className="text-secondary">{Math.abs(pitchShift)}</strong>{" "}
                {Math.abs(pitchShift) === 1 ? "semitom" : "semitons"}
              </span>
            )}
          </p>
          {pitchShift !== 0 && (
            <p className="text-xs text-gray-500 mt-1">
              ⏱️ Processamento: ~3-8 segundos (mantém qualidade original)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

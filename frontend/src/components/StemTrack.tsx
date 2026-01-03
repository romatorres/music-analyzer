import { Download } from "lucide-react";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface StemTrackProps {
  name: string;
  icon: React.ReactNode;
  color: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  onVolumeChange: (value: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  audioUrl?: string;
}

export const StemTrack = ({
  name,
  icon,
  color,
  volume,
  isMuted,
  isSolo,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  audioUrl,
}: StemTrackProps) => {
  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${name}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const effectiveColor = isMuted ? "hsl(var(--muted-foreground))" : color;

  return (
    <div
      className={cn(
        "glass-card rounded-lg p-4 transition-all duration-300 hover:border-primary/30",
        isMuted && !isSolo && "opacity-50",
        isSolo && "border-yellow-400/50 shadow-lg shadow-yellow-400/10"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon & Name */}
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300"
          style={{
            backgroundColor: `${effectiveColor}20`,
            boxShadow: isSolo ? `0 0 20px ${effectiveColor}40` : "none",
          }}
        >
          <span style={{ color: effectiveColor }}>{icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground capitalize truncate">
            {name}
          </p>
          {isSolo && <p className="text-xs text-yellow-400">Solo ativo</p>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Volume Slider */}
          <div className="flex items-center gap-2">
            <Slider
              value={[volume]}
              onValueChange={(val) => onVolumeChange(val[0])}
              max={1}
              step={0.01}
              className="w-24"
              disabled={isMuted}
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Mute button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMuteToggle}
            className={cn(
              "h-8 w-8 p-0 text-xs font-bold transition-all",
              isMuted
                ? "text-destructive bg-destructive/10 hover:bg-destructive/20"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={isMuted ? "Ativar som" : "Silenciar"}
          >
            M
          </Button>

          {/* Solo button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSoloToggle}
            className={cn(
              "h-8 w-8 p-0 text-xs font-bold transition-all",
              isSolo
                ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={isSolo ? "Desativar solo" : "Tocar apenas este"}
          >
            S
          </Button>

          {/* Download button */}
          {audioUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0 transition-all"
              style={{ color }}
              title={`Baixar ${name}`}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

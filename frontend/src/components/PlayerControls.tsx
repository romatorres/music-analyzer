// src/components/PlayerControls.tsx
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { cn } from "../lib/utils";

interface PlayerControlsProps {
  playing: boolean;
  audioLoaded: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  isMasterMuted: boolean;
  onTogglePlayPause: () => void;
  onMasterVolumeChange: (value: number) => void;
  onMasterMuteToggle: () => void;
}

export function PlayerControls({
  playing,
  audioLoaded,
  currentTime,
  duration,
  masterVolume,
  isMasterMuted,
  onTogglePlayPause,
  onMasterVolumeChange,
  onMasterMuteToggle,
}: PlayerControlsProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-between gap-6 px-4 py-3">
      <div className="font-mono text-sm text-muted-foreground min-w-[100px]">
        <span className="text-primary">{formatTime(currentTime)}</span>
        <span> / </span>
        <span>{formatTime(duration)}</span>
      </div>

      <Button
        onClick={onTogglePlayPause}
        disabled={!audioLoaded}
        size="icon"
        className={cn(
          "h-12 w-12 rounded-full transition-all duration-300",
          "bg-gradient-to-br from-primary to-accent",
          "hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]",
          "hover:scale-105"
        )}
      >
        {playing ? (
          <Pause className="h-6 w-6 text-primary-foreground" />
        ) : (
          <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
        )}
      </Button>

      <div className="flex items-center gap-3 min-w-[150px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMasterMuteToggle}
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          {isMasterMuted || masterVolume === 0 ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
        <Slider
          value={[isMasterMuted ? 0 : masterVolume]}
          onValueChange={(val) => onMasterVolumeChange(val[0])}
          max={1}
          step={0.01}
          className="w-24"
        />
      </div>
    </div>
  );
}

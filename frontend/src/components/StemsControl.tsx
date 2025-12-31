// src/components/StemsControl.tsx
import { Disc, Volume2, VolumeX, Music, Mic, Drum, Guitar } from "lucide-react";
import type { LucideProps } from "lucide-react";

interface Stem {
  name: string;
  url: string;
}

interface StemsControlProps {
  stems: Stem[];
  stemVolumes: { [key: string]: number };
  mutedStems: { [key: string]: boolean };
  apiUrl: string;
  audioRefs: React.MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
  onVolumeChange: (stem: string, value: number) => void;
  onToggleMute: (stem: string) => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) => void;
  onLoadedMetadata: (e: React.SyntheticEvent<HTMLAudioElement>) => void;
}

export function StemsControl({
  stems,
  stemVolumes,
  mutedStems,
  apiUrl,
  audioRefs,
  onVolumeChange,
  onToggleMute,
  onTimeUpdate,
  onLoadedMetadata,
}: StemsControlProps) {
  const getStemIcon = (stemName: string) => {
    const icons: { [key: string]: React.ComponentType<LucideProps> } = {
      vocals: Mic,
      drums: Drum,
      bass: Guitar,
      other: Music,
    };
    return icons[stemName] || Music;
  };

  const getStemColor = (stemName: string): string => {
    const colors: { [key: string]: string } = {
      vocals: "bg-purple",
      drums: "bg-red-500",
      bass: "bg-blue-500",
      other: "bg-green",
    };
    return colors[stemName] || "bg-gray-500";
  };

  if (stems.length === 0) return null;

  // Debug: verificar se há stems duplicados
  console.log("StemsControl - Total stems:", stems.length);
  console.log(
    "StemsControl - Stems:",
    stems.map((s) => s.name)
  );

  return (
    <div className="glass-card rounded-lg p-6 text-center border-primary/50">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Disc className="w-6 h-6" />
        Controle de Instrumentos ({stems.length} stems)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {stems.map((stem, index) => {
          const Icon = getStemIcon(stem.name);
          const colorClass = getStemColor(stem.name);

          return (
            <div
              key={`${stem.name}-${index}`}
              className="glass-card rounded-lg p-4 text-center neon-border"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`${colorClass} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-semibold capitalize flex-1">
                  {stem.name}
                </span>
                <button
                  onClick={() => onToggleMute(stem.name)}
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
                  onVolumeChange(stem.name, parseFloat(e.target.value))
                }
                className="w-full"
              />
              <audio
                ref={(el) => {
                  if (el) audioRefs.current[stem.name] = el;
                }}
                src={`${apiUrl}${stem.url}`}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

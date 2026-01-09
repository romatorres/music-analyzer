// src/components/StemsControl.tsx
import { Disc, Music, Mic, Drum, Guitar, KeyboardMusic } from "lucide-react";
import type { LucideProps } from "lucide-react";
import { StemTrack } from "./StemTrack"; // Importando o novo componente
import type { Stem, StemVolumes, MutedStems, SoloStems } from "../types";

interface StemsControlProps {
  stems: Stem[];
  stemVolumes: StemVolumes;
  mutedStems: MutedStems;
  soloStems: SoloStems;
  apiUrl: string;
  audioRefs: React.MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
  onVolumeChange: (stem: string, value: number) => void;
  onToggleMute: (stem: string) => void;
  onToggleSolo: (stem: string) => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) => void;
  onLoadedMetadata: (e: React.SyntheticEvent<HTMLAudioElement>) => void;
}

export function StemsControl({
  stems,
  stemVolumes,
  mutedStems,
  soloStems,
  apiUrl,
  audioRefs,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onTimeUpdate,
  onLoadedMetadata,
}: StemsControlProps) {
  const getStemIcon = (stemName: string) => {
    const normalizedName = stemName.toLowerCase();
    const icons: { [key: string]: React.ComponentType<LucideProps> } = {
      vocal: Mic,
      vocals: Mic,
      bateria: Drum,
      drums: Drum,
      baixo: Guitar,
      bass: Guitar,
      outros: Music,
      other: Music,
      instrumental: Music,
      piano: KeyboardMusic,
      guitarra: Guitar,
      guitar: Guitar,
    };
    const Icon = icons[normalizedName] || Music;
    return <Icon className="w-5 h-5" />;
  };

  const getStemColor = (stemName: string): string => {
    const normalizedName = stemName.toLowerCase();
    const colors: { [key: string]: string } = {
      vocal: "#A855F7", // Purple
      vocals: "#A855F7",
      bateria: "#EF4444", // Red
      drums: "#EF4444",
      baixo: "#3B82F6", // Blue
      bass: "#3B82F6",
      outros: "#22C55E", // Green
      other: "#22C55E",
      instrumental: "#10B981", // Emerald
      piano: "#F59E0B", // Amber
      guitarra: "#EC4899", // Pink
      guitar: "#EC4899",
    };
    return colors[normalizedName] || "#9CA3AF"; // Gray
  };

  if (stems.length === 0) return null;

  return (
    <div className="glass-card p-6 mt-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
        <Disc className="w-6 h-6" />
        Controle de Instrumentos
      </h2>

      <div className="flex flex-col gap-3">
        {stems.map((stem, index) => {
          const icon = getStemIcon(stem.name);
          const color = getStemColor(stem.name);
          const audioUrl = `${apiUrl}${stem.url}`;

          return (
            <div key={`${stem.name}-${index}`}>
              <StemTrack
                name={stem.name}
                icon={icon}
                color={color}
                volume={stemVolumes[stem.name] ?? 1}
                isMuted={mutedStems[stem.name] ?? false}
                isSolo={soloStems[stem.name] ?? false}
                onVolumeChange={(value) => onVolumeChange(stem.name, value)}
                onMuteToggle={() => onToggleMute(stem.name)}
                onSoloToggle={() => onToggleSolo(stem.name)}
                audioUrl={audioUrl}
              />
              <audio
                ref={(el) => {
                  if (el) audioRefs.current[stem.name] = el;
                }}
                src={audioUrl}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                crossOrigin="anonymous"
                style={{ display: "none" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

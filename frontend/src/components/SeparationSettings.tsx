import React from "react";
import {
  Zap,
  Scale,
  Sparkles,
  Settings,
  Disc,
  Music2,
  Music4,
} from "lucide-react";
import { Button } from "./ui/button";

type StemsMode = "2" | "4";
type Quality = "fast" | "balanced" | "quality";

interface SeparationSettingsProps {
  stemsMode: StemsMode;
  onStemsModeChange: (mode: StemsMode) => void;
  quality: Quality;
  onQualityChange: (quality: Quality) => void;
  onSeparate: () => void;
  isSeparating: boolean;
  disabled: boolean;
}

const qualityOptions = [
  {
    id: "fast" as const,
    icon: Zap,
    label: "Rápido",
    time: "1-3 min",
    quality: "Boa",
    description: "Ideal para preview e uso casual",
  },
  {
    id: "balanced" as const,
    icon: Scale,
    label: "Balanceado",
    time: "5-8 min",
    quality: "Ótima",
    description: "Melhor custo-benefício (Recomendado)",
  },
  {
    id: "quality" as const,
    icon: Sparkles,
    label: "Máxima Qualidade",
    time: "15-20 min",
    quality: "Perfeita",
    description: "Produção profissional",
  },
];

const stemsOptions = [
  {
    id: "2" as const,
    icon: Music2,
    label: "2 Stems",
    description: "Vocal + Instrumental",
    info: "Separação mais rápida e simples.",
  },
  {
    id: "4" as const,
    icon: Music4,
    label: "4 Stems",
    description: "Vocal, Bateria, Baixo, Outros",
    info: "Separação completa e detalhada.",
  },
];

export const SeparationSettings: React.FC<SeparationSettingsProps> = ({
  stemsMode,
  onStemsModeChange,
  quality,
  onQualityChange,
  onSeparate,
  isSeparating,
  disabled,
}) => {
  return (
    <div className="glass-card rounded-xl border-primary/20 w-full p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-bold text-foreground">
          Configurações de Separação
        </h3>
      </div>

      {/* --- Seletor de Stems --- */}
      <div className="space-y-3">
        <label className="block text-base font-medium text-gray-300">
          Modo de Separação (Stems)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stemsOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onStemsModeChange(opt.id)}
              className={`
                relative p-4 rounded-lg border-2 transition-all text-left
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${
                  stemsMode === opt.id
                    ? "bg-primary/20 border-primary"
                    : "bg-white/5 border-primary/30 hover:bg-white/10"
                }
              `}
            >
              <div className="flex items-center gap-3 mb-2">
                <opt.icon className="w-6 h-6 text-primary" />
                <div>
                  <span className="font-semibold text-lg text-foreground">
                    {opt.label}
                  </span>
                  <p className="text-sm text-gray-300">{opt.description}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{opt.info}</p>
              {stemsMode === opt.id && (
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* --- Seletor de Qualidade --- */}
      <div className="space-y-3">
        <label className="block text-base font-medium text-gray-300">
          Qualidade de Processamento
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {qualityOptions.map((q) => {
            const Icon = q.icon;
            const isSelected = quality === q.id;

            return (
              <button
                key={q.id}
                type="button"
                disabled={disabled}
                onClick={() => onQualityChange(q.id)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                  ${
                    isSelected
                      ? "bg-primary/20 border-primary"
                      : "bg-white/5 border-primary/30 hover:bg-white/10"
                  }
                `}
              >
                {q.id === "balanced" && (
                  <div className="absolute -top-3 right-8 bg-primary text-background text-xs px-2 py-1 rounded-full font-medium z-10">
                    Recomendado
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">
                    {q.label}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Qualidade:</span>
                    <span className="font-medium text-gray-200">
                      {q.quality}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Tempo:</span>
                    <span className="font-medium text-gray-200">{q.time}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">{q.description}</p>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Botão de Ação --- */}
      <div className="pt-4 flex flex-col items-center">
        <Button
          onClick={onSeparate}
          disabled={disabled || isSeparating}
          size="lg"
          variant="default"
          className="gap-2 w-full md:w-auto px-10 py-6 text-lg bg-primary hover:bg-primary/90"
        >
          <Disc className={`h-5 w-5 ${isSeparating ? "animate-spin" : ""}`} />
          {isSeparating ? "Separando Instrumentos..." : "Iniciar Separação"}
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          O tempo de processamento varia de acordo com as configurações e o
          tamanho do arquivo.
        </p>
      </div>
    </div>
  );
};

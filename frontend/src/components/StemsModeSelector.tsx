// src/components/StemsModeSelector.tsx
interface StemsModeSelectorProps {
  stemsMode: "2" | "4";
  onModeChange: (mode: "2" | "4") => void;
}

export function StemsModeSelector({
  stemsMode,
  onModeChange,
}: StemsModeSelectorProps) {
  return (
    <div className="glass-card rounded-lg p-4 border-primary/30">
      <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
        Modo de Separação
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onModeChange("2")}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            stemsMode === "2"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">2 Stems</span>
            <span className="text-xs opacity-75">Rápido (2-3 min)</span>
            <span className="text-xs opacity-60">Vocals + Instrumental</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("4")}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            stemsMode === "4"
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">4 Stems</span>
            <span className="text-xs opacity-75">Completo (5-8 min)</span>
            <span className="text-xs opacity-60">
              Vocals, Drums, Bass, Other
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

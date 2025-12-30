// src/components/AnalysisButtons.tsx
import { Disc, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";

interface AnalysisButtonsProps {
  analyzing: boolean;
  hasFile: boolean;
  hasStem: boolean;
  hasChords: boolean;
  onSeparateStems: () => void;
  onDetectChords: () => void;
}

export function AnalysisButtons({
  analyzing,
  hasFile,
  hasStem,
  hasChords,
  onSeparateStems,
  onDetectChords,
}: AnalysisButtonsProps) {
  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={onSeparateStems}
        disabled={analyzing || !hasFile}
        size="sm"
        variant="outline"
        className="gap-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/50 px-6 py-5 hover:from-blue-500/20 hover:to-blue-600/20"
      >
        <Disc className="h-4 w-4" />
        {analyzing && !hasStem ? "Separando..." : "Separar Instrumentos"}
      </Button>

      <Button
        onClick={onDetectChords}
        disabled={analyzing || !hasFile}
        size="sm"
        variant="outline"
        className="gap-2 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-500/50 px-6 py-5 hover:from-purple-500/20 hover:to-purple-600/20"
      >
        <BarChart3 className="h-4 w-4" />
        {analyzing && !hasChords ? "Detectando..." : "Detectar Acordes"}
      </Button>
    </div>
  );
}

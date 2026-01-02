// src/components/AnalysisButtons.tsx
import { Disc, BarChart3, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import QualitySelector from "./QualitySelector";

interface AnalysisButtonsProps {
  analyzing: boolean;
  hasFile: boolean;
  hasStem: boolean;
  hasChords: boolean;
  onSeparateStems: (qualityMode: 'fast' | 'balanced' | 'quality') => void;
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
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [qualityMode, setQualityMode] = useState<'fast' | 'balanced' | 'quality'>('balanced');

  const handleSeparateClick = () => {
    if (!showQualitySelector) {
      setShowQualitySelector(true);
    } else {
      onSeparateStems(qualityMode);
      setShowQualitySelector(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSeparateClick}
          disabled={analyzing || !hasFile}
          size="sm"
          variant="outline"
          className="gap-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/50 px-6 py-5 hover:from-blue-500/20 hover:to-blue-600/20"
        >
          {showQualitySelector ? (
            <>
              <Settings className="h-4 w-4" />
              Confirmar Separação
            </>
          ) : (
            <>
              <Disc className="h-4 w-4" />
              {analyzing && !hasStem ? "Separando..." : "Separar Instrumentos"}
            </>
          )}
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

      {/* Seletor de Qualidade */}
      {showQualitySelector && !analyzing && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <QualitySelector
            value={qualityMode}
            onChange={setQualityMode}
            disabled={analyzing}
          />
        </div>
      )}
    </div>
  );
}

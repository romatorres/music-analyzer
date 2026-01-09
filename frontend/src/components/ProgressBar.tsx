// src/components/ProgressBar.tsx

import { Loader2 } from "lucide-react";

interface ProgressBarProps {
  percentage: number;
  message: string;
  step?: number;
  totalSteps?: number;
}

export default function ProgressBar({
  percentage,
  message,
  step,
  totalSteps,
}: ProgressBarProps) {
  return (
    <div className="glass-card p-4 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <h3 className="text-lg font-semibold">Processando...</h3>
        {step && totalSteps && (
          <span className="text-sm text-gray-400">
            Etapa {step} de {totalSteps}
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>{message}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple to-pink-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Este processo pode levar alguns minutos...
      </p>
    </div>
  );
}

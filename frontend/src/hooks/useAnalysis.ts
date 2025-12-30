// src/hooks/useAnalysis.ts
import { useState, useCallback } from "react";
import type {
  AnalysisResponse,
  ProgressData,
  Stem,
  Chord,
  StemVolumes,
  MutedStems,
} from "../types";

export function useAnalysis(apiUrl: string) {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  const pollProgress = useCallback(
    async (taskId: string, onComplete?: (data: ProgressData) => void) => {
      let consecutiveErrors = 0;
      const maxErrors = 5;

      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${apiUrl}/api/progress/${taskId}`);
          if (response.ok) {
            const progressData = await response.json();
            setProgress(progressData);
            consecutiveErrors = 0; // Reset error counter on success

            if (progressData.percentage >= 100 || progressData.step === -1) {
              clearInterval(pollInterval);

              // Chamar callback com os dados completos se disponível
              if (progressData.percentage >= 100 && onComplete) {
                onComplete(progressData);
              }

              if (progressData.step !== -1) {
                setTimeout(() => setProgress(null), 2000);
              }
            }
          } else {
            consecutiveErrors++;
            if (consecutiveErrors >= maxErrors) {
              console.error("Muitos erros consecutivos ao buscar progresso");
              clearInterval(pollInterval);
            }
          }
        } catch (error) {
          consecutiveErrors++;
          console.error("Erro ao buscar progresso:", error);
          if (consecutiveErrors >= maxErrors) {
            clearInterval(pollInterval);
          }
        }
      }, 300); // Polling a cada 300ms

      return pollInterval;
    },
    [apiUrl]
  );

  const separateStems = useCallback(
    async (
      file: File,
      stemsMode: "2" | "4",
      callbacks: {
        onSuccess: (data: {
          stems: Stem[];
          volumes: StemVolumes;
          mutes: MutedStems;
        }) => void;
        onError: () => void;
        onComplete: () => void;
      }
    ) => {
      setAnalyzing(true);
      setProgress({
        step: 1,
        message: "Iniciando separação de instrumentos...",
        percentage: 0,
        timestamp: new Date().toISOString(),
      });

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("stems_mode", stemsMode);

      try {
        const response = await fetch(`${apiUrl}/api/separate`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Erro na separação");

        const data: AnalysisResponse = await response.json();

        if (data.task_id) {
          // Iniciar polling e aguardar conclusão
          pollProgress(data.task_id, (progressData) => {
            // Quando terminar, buscar os stems do progressData
            if (progressData.stems) {
              const volumes: StemVolumes = {};
              const mutes: MutedStems = {};
              progressData.stems.forEach((stem: Stem) => {
                volumes[stem.name] = 1;
                mutes[stem.name] = false;
              });

              callbacks.onSuccess({
                stems: progressData.stems,
                volumes,
                mutes,
              });
            }
          });
        }
      } catch (error) {
        console.error("Erro:", error);
        setProgress({
          step: -1,
          message: "Erro na separação. Verifique se o backend está rodando.",
          percentage: 0,
          timestamp: new Date().toISOString(),
        });
        setTimeout(() => setProgress(null), 5000);
        callbacks.onError();
      } finally {
        setAnalyzing(false);
        callbacks.onComplete();
      }
    },
    [apiUrl, pollProgress]
  );

  const detectChords = useCallback(
    async (
      file: File,
      callbacks: {
        onSuccess: (chords: Chord[]) => void;
        onError: () => void;
        onComplete: () => void;
      }
    ) => {
      setAnalyzing(true);
      setProgress({
        step: 1,
        message: "Iniciando detecção de acordes...",
        percentage: 0,
        timestamp: new Date().toISOString(),
      });

      const formData = new FormData();
      formData.append("audio", file);

      try {
        const response = await fetch(`${apiUrl}/api/chords`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Erro na detecção de acordes");

        const data: AnalysisResponse = await response.json();

        if (data.task_id) {
          pollProgress(data.task_id);
        }

        callbacks.onSuccess(data.chords || []);
      } catch (error) {
        console.error("Erro:", error);
        setProgress({
          step: -1,
          message:
            "Erro na detecção de acordes. Verifique se o backend está rodando.",
          percentage: 0,
          timestamp: new Date().toISOString(),
        });
        setTimeout(() => setProgress(null), 5000);
        callbacks.onError();
      } finally {
        setAnalyzing(false);
        callbacks.onComplete();
      }
    },
    [apiUrl, pollProgress]
  );

  return {
    analyzing,
    progress,
    setProgress,
    separateStems,
    detectChords,
  };
}

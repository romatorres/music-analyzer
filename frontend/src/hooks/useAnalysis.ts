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
    async (
      taskId: string,
      onSuccess?: (data: ProgressData) => void,
      onError?: () => void
    ) => {
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

              if (progressData.percentage >= 100 && onSuccess) {
                onSuccess(progressData);
              } else if (onError) {
                onError();
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
              if (onError) onError();
            }
          }
        } catch (error) {
          consecutiveErrors++;
          console.error("Erro ao buscar progresso:", error);
          if (consecutiveErrors >= maxErrors) {
            clearInterval(pollInterval);
            if (onError) onError();
          }
        }
      }, 300);

      return pollInterval;
    },
    [apiUrl]
  );

  const separateStems = useCallback(
    async (
      file: File,
      stemsMode: "2" | "4",
      qualityMode: "fast" | "balanced" | "quality",
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
      formData.append("quality_mode", qualityMode);

      try {
        const response = await fetch(`${apiUrl}/api/separate`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Erro na separação");

        const data: AnalysisResponse = await response.json();

        if (data.task_id) {
          // Iniciar polling e aguardar conclusão
          pollProgress(
            data.task_id,
            (progressData) => {
              // Quando terminar, buscar os stems do progressData
              if (progressData.stems) {
                // Remover duplicatas baseado no nome do stem
                const uniqueStems = progressData.stems.filter(
                  (stem: Stem, index: number, self: Stem[]) =>
                    index === self.findIndex((s) => s.name === stem.name)
                );

                const volumes: StemVolumes = {};
                const mutes: MutedStems = {};
                uniqueStems.forEach((stem: Stem) => {
                  volumes[stem.name] = 1;
                  mutes[stem.name] = false;
                });

                callbacks.onSuccess({
                  stems: uniqueStems,
                  volumes,
                  mutes,
                });
              }
              // Chama os callbacks de finalização aqui, após o sucesso
              setAnalyzing(false);
              callbacks.onComplete();
            },
            () => {
              callbacks.onError();
              setAnalyzing(false);
              callbacks.onComplete();
            }
          );
        } else {
          // Se não houver task_id, finalize imediatamente
          setAnalyzing(false);
          callbacks.onComplete();
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
        // Garante a finalização em caso de erro na requisição inicial
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

        // Backend retorna acordes diretamente na resposta
        if (data.chords && data.chords.length > 0) {
          console.log("Acordes detectados:", data.chords.length);
          callbacks.onSuccess(data.chords);

          // Fazer polling apenas para atualizar o progresso visual
          if (data.task_id) {
            pollProgress(data.task_id, undefined, undefined);
          }

          setAnalyzing(false);
          callbacks.onComplete();
        } else {
          throw new Error("Nenhum acorde detectado");
        }
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

// src/hooks/useHistory.ts
import { useState, useCallback } from "react";
import type {
  HistoryItem,
  AnalysisResponse,
  ProgressData,
  Stem,
  Chord,
  StemVolumes,
  MutedStems,
} from "../types";

export function useHistory(apiUrl: string) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  }, [apiUrl]);

  const loadAnalysisFromHistory = useCallback(
    async (
      filename: string,
      callbacks: {
        onSuccess: (data: {
          stems: Stem[];
          chords: Chord[];
          volumes: StemVolumes;
          mutes: MutedStems;
          audioUrl: string | null;
        }) => void;
        onError: () => void;
        setProgress: (progress: ProgressData) => void;
      }
    ) => {
      try {
        console.log("Carregando análise:", filename);

        const response = await fetch(
          `${apiUrl}/api/analysis/${encodeURIComponent(filename)}`
        );
        if (!response.ok) {
          throw new Error("Análise não encontrada");
        }

        const data: AnalysisResponse = await response.json();

        const otherStem = data.stems?.find((s) => s.name === "other");
        const audioForViz = otherStem || data.stems?.[0];
        const audioUrl = audioForViz ? `${apiUrl}${audioForViz.url}` : null;

        const volumes: StemVolumes = {};
        const mutes: MutedStems = {};
        data.stems?.forEach((stem) => {
          volumes[stem.name] = 1;
          mutes[stem.name] = false;
        });

        callbacks.onSuccess({
          stems: data.stems || [],
          chords: data.chords || [],
          volumes,
          mutes,
          audioUrl,
        });

        callbacks.setProgress({
          step: 7,
          message: `Análise de "${filename}" carregada com sucesso!`,
          percentage: 100,
          timestamp: new Date().toISOString(),
        });
        setTimeout(
          () => callbacks.setProgress(null as unknown as ProgressData),
          3000
        );
      } catch (error) {
        console.error("Erro ao carregar análise:", error);
        callbacks.onError();
      }
    },
    [apiUrl]
  );

  const deleteAnalysis = useCallback(
    async (
      filename: string,
      callbacks: {
        onSuccess: () => void;
        onError: () => void;
        setProgress: (progress: ProgressData) => void;
      }
    ) => {
      try {
        console.log("Deletando análise:", filename);

        const response = await fetch(
          `${apiUrl}/api/analysis/${encodeURIComponent(filename)}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Erro ao deletar análise");
        }

        await loadHistory();
        callbacks.onSuccess();

        callbacks.setProgress({
          step: 7,
          message: `"${filename}" deletado com sucesso!`,
          percentage: 100,
          timestamp: new Date().toISOString(),
        });
        setTimeout(
          () => callbacks.setProgress(null as unknown as ProgressData),
          2000
        );
      } catch (error) {
        console.error("Erro ao deletar análise:", error);
        callbacks.onError();
      }
    },
    [apiUrl, loadHistory]
  );

  return {
    history,
    loadHistory,
    loadAnalysisFromHistory,
    deleteAnalysis,
  };
}

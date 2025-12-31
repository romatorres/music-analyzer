// src/hooks/useAudioManager.ts
import { useRef, useEffect, useCallback } from "react";

interface AudioRefs {
  [key: string]: HTMLAudioElement | null;
}

interface StemVolumes {
  [key: string]: number;
}

interface MutedStems {
  [key: string]: boolean;
}

export function useAudioManager(
  masterVolume: number,
  isMasterMuted: boolean,
  stemVolumes: StemVolumes,
  mutedStems: MutedStems
) {
  const audioRefs = useRef<AudioRefs>({});

  // Limpar audioRefs quando o componente é desmontado
  useEffect(() => {
    return () => {
      console.log("[useAudioManager] Limpando todos os áudios");
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
          audio.load();
        }
      });
      audioRefs.current = {};
    };
  }, []);

  // Função para limpar refs de stems que não existem mais
  const cleanupOldRefs = useCallback((currentStemNames: string[]) => {
    const refsToRemove = Object.keys(audioRefs.current).filter(
      (name) => !currentStemNames.includes(name)
    );

    if (refsToRemove.length > 0) {
      console.log("[useAudioManager] Removendo refs antigos:", refsToRemove);
      refsToRemove.forEach((name) => {
        const audio = audioRefs.current[name];
        if (audio) {
          audio.pause();
          audio.src = "";
          audio.load();
          delete audioRefs.current[name];
        }
      });
    }
  }, []);

  // Update audio volumes and mute states whenever they change
  useEffect(() => {
    Object.keys(audioRefs.current).forEach((stemName) => {
      const audio = audioRefs.current[stemName];
      if (audio) {
        const currentStemVolume = stemVolumes[stemName] ?? 1;
        const currentStemMuted = mutedStems[stemName] ?? false;

        // Set muted state
        audio.muted = isMasterMuted || currentStemMuted;

        // Set volume (only matters when not muted)
        if (!audio.muted) {
          audio.volume = masterVolume * currentStemVolume;
        }
      }
    });
  }, [masterVolume, isMasterMuted, stemVolumes, mutedStems]);

  const syncAudioTime = (time: number) => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio && Math.abs(audio.currentTime - time) > 0.15) {
        audio.currentTime = time;
      }
    });
  };

  const playAllStems = (
    stemVolumes: StemVolumes,
    mutedStems: MutedStems,
    isMasterMuted: boolean,
    masterVolume: number
  ) => {
    Object.keys(audioRefs.current).forEach((stemName) => {
      const audio = audioRefs.current[stemName];
      if (audio) {
        const currentStemVolume = stemVolumes[stemName] ?? 1;
        const currentStemMuted = mutedStems[stemName] ?? false;

        // Set muted state
        audio.muted = isMasterMuted || currentStemMuted;

        // Set volume (only matters when not muted)
        if (!audio.muted) {
          audio.volume = masterVolume * currentStemVolume;
        }

        audio.play().catch((e) => console.error("Error playing stem:", e));
      }
    });
  };

  const pauseAllStems = () => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) audio.pause();
    });
  };

  const resetAllStems = () => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) audio.currentTime = 0;
    });
  };

  return {
    audioRefs,
    syncAudioTime,
    playAllStems,
    pauseAllStems,
    resetAllStems,
    cleanupOldRefs,
  };
}

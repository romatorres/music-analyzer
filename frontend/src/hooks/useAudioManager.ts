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

interface SoloStems {
  [key: string]: boolean;
}

export function useAudioManager(
  masterVolume: number,
  isMasterMuted: boolean,
  stemVolumes: StemVolumes,
  mutedStems: MutedStems,
  soloStems: SoloStems
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

  const getEffectiveVolume = useCallback(
    (stemName: string) => {
      const soloActive = Object.values(soloStems).some((isSolo) => isSolo);

      if (soloActive && !soloStems[stemName]) {
        return 0; // Se solo está ativo e este stem não é solo, volume é 0
      }

      const isStemActuallyMuted = isMasterMuted || mutedStems[stemName];
      if (isStemActuallyMuted) {
        return 0;
      }

      const stemVolume = stemVolumes[stemName] ?? 1;
      return masterVolume * stemVolume;
    },
    [masterVolume, stemVolumes, mutedStems, soloStems, isMasterMuted]
  );

  // Update audio volumes whenever they change
  useEffect(() => {
    Object.keys(audioRefs.current).forEach((stemName) => {
      const audio = audioRefs.current[stemName];
      if (audio) {
        const effectiveVolume = getEffectiveVolume(stemName);
        audio.volume = effectiveVolume;
        // A propriedade 'muted' é menos flexível que setar o volume para 0.
        // Gerenciar apenas pelo volume simplifica a lógica.
        audio.muted = effectiveVolume === 0;
      }
    });
  }, [getEffectiveVolume]);

  const syncAudioTime = (time: number) => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio && Math.abs(audio.currentTime - time) > 0.15) {
        audio.currentTime = time;
      }
    });
  };

  const playAllStems = () => {
    Object.keys(audioRefs.current).forEach((stemName) => {
      const audio = audioRefs.current[stemName];
      if (audio) {
        const effectiveVolume = getEffectiveVolume(stemName);
        audio.volume = effectiveVolume;
        audio.muted = effectiveVolume === 0;

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

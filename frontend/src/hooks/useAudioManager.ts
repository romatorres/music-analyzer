// src/hooks/useAudioManager.ts
import { useRef, useEffect } from "react";

interface AudioRefs {
  [key: string]: HTMLAudioElement | null;
}

interface StemVolumes {
  [key: string]: number;
}

interface MutedStems {
  [key: string]: boolean;
}

interface Stem {
  name: string;
  url: string;
}

export function useAudioManager(
  stems: Stem[],
  masterVolume: number,
  isMasterMuted: boolean,
  stemVolumes: StemVolumes,
  mutedStems: MutedStems
) {
  const audioRefs = useRef<AudioRefs>({});

  useEffect(() => {
    if (stems.length > 0) {
      Object.keys(audioRefs.current).forEach((stemName) => {
        const audio = audioRefs.current[stemName];
        if (audio) {
          const currentStemVolume = stemVolumes[stemName] || 1;
          const currentStemMuted = mutedStems[stemName] || false;

          audio.muted = isMasterMuted || currentStemMuted;
          audio.volume = audio.muted ? 0 : masterVolume * currentStemVolume;
        }
      });
    }
  }, [stems, masterVolume, isMasterMuted, stemVolumes, mutedStems]);

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
        const currentStemVolume = stemVolumes[stemName] || 1;
        const currentStemMuted = mutedStems[stemName] || false;

        audio.muted = isMasterMuted || currentStemMuted;
        audio.volume = audio.muted ? 0 : masterVolume * currentStemVolume;
        audio.play().catch((e) => console.error(e));
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
  };
}

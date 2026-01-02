// src/types/index.ts

export interface Stem {
  name: string;
  url: string;
}

export interface Chord {
  chord: string;
  start: number;
  end: number;
}

export interface StemVolumes {
  [key: string]: number;
}

export interface MutedStems {
  [key: string]: boolean;
}

export interface SoloStems {
  [key: string]: boolean;
}

export interface AudioRefs {
  [key: string]: HTMLAudioElement | null;
}

export interface AnalysisResponse {
  status: string;
  stems?: Stem[];
  chords?: Chord[];
  method?: string;
  message?: string;
  task_id?: string;
}

export interface ProgressData {
  step: number;
  message: string;
  percentage: number;
  timestamp: string;
  stems?: Stem[];
  chords?: Chord[];
  processing_time?: number;
  stems_mode?: string;
}

export interface HistoryItem {
  filename: string;
  stems_count: number;
  chords_count: number;
  duration: number;
  timestamp: string;
}

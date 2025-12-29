// src/components/ChordSlider.tsx
import { useEffect, useRef } from 'react';

interface Chord {
  start: number;
  end: number;
  chord: string;
}

interface ChordSliderProps {
  chords: Chord[];
  currentTime: number;
}

export default function ChordSlider({ chords, currentTime }: ChordSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentChordIndex = chords.findIndex((c) => currentTime >= c.start && currentTime < c.end);

  // Auto-scroll para manter o acorde atual visível
  useEffect(() => {
    if (!containerRef.current || currentChordIndex < 0) return;

    const container = containerRef.current;
    const chordElements = container.querySelectorAll('[data-chord-index]');
    const currentElement = chordElements[currentChordIndex] as HTMLElement;

    if (currentElement) {
      const containerWidth = container.offsetWidth;
      const elementLeft = currentElement.offsetLeft;
      const elementWidth = currentElement.offsetWidth;
      const scrollPosition = elementLeft - containerWidth / 2 + elementWidth / 2;

      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [currentChordIndex]);

  if (chords.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20 rounded-xl p-4 border border-purple-500/20 backdrop-blur-sm">
      {/* Header simples */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
        <h3 className="text-sm font-semibold text-purple-300">Acordes</h3>
        <span className="text-xs text-gray-500">
          {currentChordIndex >= 0 ? `${currentChordIndex + 1}/${chords.length}` : `${chords.length}`}
        </span>
      </div>

      {/* Slider Horizontal de Acordes */}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {chords.map((chord, index) => {
          const isActive = index === currentChordIndex;
          const isPast = currentTime > chord.end;
          const isNext = index === currentChordIndex + 1;

          return (
            <div
              key={index}
              data-chord-index={index}
              className={`
                relative flex-shrink-0 rounded-lg transition-all duration-300 text-center
                ${isActive 
                  ? 'px-6 py-4 bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl shadow-purple-500/50 min-w-[100px]' 
                  : isPast
                  ? 'px-4 py-2 bg-white/5 opacity-40 min-w-[70px]'
                  : isNext
                  ? 'px-5 py-3 bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-400/30 min-w-[85px]'
                  : 'px-4 py-2 bg-white/10 border border-white/10 min-w-[70px]'
                }
              `}
            >
              <p className={`font-bold transition-all ${
                isActive ? 'text-2xl text-white' : 'text-base text-gray-300'
              }`}>
                {chord.chord}
              </p>

              {/* Indicador de ativo */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

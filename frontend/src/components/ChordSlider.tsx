// src/components/ChordSlider.tsx
import { useEffect, useRef } from "react";

import type { Chord } from "../types";

interface ChordSliderProps {
  chords: Chord[];
  currentTime: number;
}

export default function ChordSlider({ chords, currentTime }: ChordSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentChordIndex = chords.findIndex(
    (c) => currentTime >= c.start && currentTime < c.end
  );

  // Auto-scroll para manter o acorde atual visível
  useEffect(() => {
    if (!containerRef.current || currentChordIndex < 0) return;

    const container = containerRef.current;
    const chordElements = container.querySelectorAll("[data-chord-index]");
    const currentElement = chordElements[currentChordIndex] as HTMLElement;

    if (currentElement) {
      const containerWidth = container.offsetWidth;
      const elementLeft = currentElement.offsetLeft;
      const elementWidth = currentElement.offsetWidth;

      const scrollPosition =
        elementLeft - containerWidth / 2 + elementWidth / 2;

      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [currentChordIndex]);

  if (chords.length === 0) return null;

  const baseCardClasses = "px-6 py-2 min-w-[100px] bg-white/5 opacity-40";

  const activeCardClasses =
    "bg-primary/20 border border-primary shadow-xl shadow-purple-500/50 opacity-100";

  return (
    <div className="glass-card rounded-lg p-4 text-center neon-border mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
        <h3 className="text-sm font-semibold text-purple-300">Acordes</h3>
        <span className="text-xs text-gray-500">
          {currentChordIndex >= 0
            ? `${currentChordIndex + 1}/${chords.length}`
            : `${chords.length}`}
        </span>
      </div>

      {/* Slider */}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto p-8 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent"
        style={{ scrollbarWidth: "thin" }}
      >
        {chords.map((chord, index) => {
          const isActive = index === currentChordIndex;

          return (
            <div
              key={index}
              data-chord-index={index}
              className={`
                relative flex-shrink-0 rounded-lg transition-all duration-300
                text-center flex items-center justify-center min-h-[68px]
                ${baseCardClasses}
                ${isActive ? activeCardClasses : ""}
              `}
            >
              <p
                className={`font-bold transition-all ${
                  isActive ? "text-2xl text-white" : "text-base text-gray-300"
                }`}
              >
                {chord.chord}
              </p>

              {isActive && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

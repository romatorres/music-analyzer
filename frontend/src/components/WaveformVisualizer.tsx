import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import WaveSurfer from 'wavesurfer.js';

export interface WaveformHandle {
  togglePlayPause: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  seekToSeconds: (time: number) => void;
}

interface WaveformVisualizerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onReady: (duration: number) => void;
  onTimeUpdate: (currentTime: number) => void;
  onFinish: () => void;
  onPlaybackChange: (isPlaying: boolean) => void;
  wavesurferRef: React.MutableRefObject<WaveSurfer | null>;
}

export const WaveformVisualizer = forwardRef<WaveformHandle, WaveformVisualizerProps>(
  (
    {
      audioUrl,
      isPlaying,
      onReady,
      onTimeUpdate,
      onFinish,
      onPlaybackChange,
      wavesurferRef,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [hoverTime, setHoverTime] = useState(0);

    const formatTime = useCallback((seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Handle mouse hover for time preview
    const handleMouseMove = useCallback((event: MouseEvent) => {
      if (!wavesurferRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const containerWidth = rect.width;
      const progress = Math.max(0, Math.min(mouseX / containerWidth, 1));
      
      const duration = wavesurferRef.current.getDuration();
      if (duration > 0) {
        const time = progress * duration;
        setHoverTime(time);
      }
    }, [wavesurferRef]);

    const handleMouseEnter = useCallback(() => {
      setIsHovering(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsHovering(false);
    }, []);

    const playInternal = useCallback(async () => {
      if (!wavesurferRef.current) return;

      try {
        if (!wavesurferRef.current.isPlaying()) {
          await wavesurferRef.current.play();
        }
        onPlaybackChange(true);
      } catch (error) {
        console.error('[WaveformVisualizer] play failed:', error);
        onPlaybackChange(false);
      }
    }, [wavesurferRef, onPlaybackChange]);

    const pauseInternal = useCallback(() => {
      if (wavesurferRef.current && wavesurferRef.current.isPlaying()) {
        wavesurferRef.current.pause();
      }
      onPlaybackChange(false);
    }, [wavesurferRef, onPlaybackChange]);

    const toggleInternal = useCallback(async () => {
      if (isPlaying) {
        pauseInternal();
      } else {
        await playInternal();
      }
    }, [isPlaying, pauseInternal, playInternal]);

    const seekToSeconds = useCallback(
      (time: number) => {
        if (!wavesurferRef.current) return;
        
        const ws = wavesurferRef.current;
        const dur = ws.getDuration();
        if (!dur || dur <= 0) return;
        
        const clamped = Math.min(Math.max(time, 0), dur);
        ws.seekTo(clamped / dur);
        onTimeUpdate(clamped);
      },
      [wavesurferRef, onTimeUpdate],
    );

    useImperativeHandle(
      ref,
      () => ({
        togglePlayPause: toggleInternal,
        play: playInternal,
        pause: pauseInternal,
        seekToSeconds,
      }),
      [pauseInternal, playInternal, seekToSeconds, toggleInternal],
    );

    // Initialize WaveSurfer
    useEffect(() => {
      if (!containerRef.current || !audioUrl) return;

      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor: 'rgb(139, 92, 246)', // purple-500
        progressColor: 'rgb(168, 85, 247)', // purple-600
        cursorColor: 'rgb(251, 146, 60)', // orange-400
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 120,
        normalize: true,
        backend: 'MediaElement',
        interact: true,
        cursorWidth: 2,
        hideScrollbar: true,
      });

      wavesurferRef.current = wavesurfer;
      wavesurfer.load(audioUrl);

      wavesurfer.on('ready', () => {
        wavesurfer.setVolume(0.8);
        setIsReady(true);
        onReady(wavesurfer.getDuration());
        console.log('Waveform ready, duration:', wavesurfer.getDuration());
      });

      wavesurfer.on('error', (error) => {
        console.error('WaveSurfer error:', error);
      });

      wavesurfer.on('interaction', () => {
        const currentTime = wavesurfer.getCurrentTime();
        onTimeUpdate(currentTime);
      });

      wavesurfer.on('audioprocess', () => {
        const currentTime = wavesurfer.getCurrentTime();
        onTimeUpdate(currentTime);
      });

      wavesurfer.on('finish', () => {
        onFinish();
        onPlaybackChange(false);
      });

      // Add mouse event listeners
      const container = containerRef.current;
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
        wavesurferRef.current = null;
        setIsReady(false);
        wavesurfer.destroy();
      };
    }, [audioUrl, onReady, onTimeUpdate, onFinish, onPlaybackChange, wavesurferRef, handleMouseMove, handleMouseEnter, handleMouseLeave]);

    return (
      <div className="relative w-full">
        <div
          ref={containerRef}
          className="w-full glass-card rounded-lg p-4 text-center neon-border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity duration-200"
          style={{ minHeight: '120px' }}
          title="Clique para navegar na música"
        />
        
        {/* Preview de tempo no hover */}
        {isHovering && isReady && (
          <div className="absolute top-2 left-2 text-xs bg-black/80 text-white px-2 py-1 rounded pointer-events-none z-10">
            {formatTime(hoverTime)}
          </div>
        )}
        
        {/* Loading indicator */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="text-xs text-gray-400">Carregando waveform...</p>
            </div>
          </div>
        )}
        
        {/* Click hint */}
        {isReady && (
          <div className="absolute bottom-2 left-2 text-xs text-gray-400 pointer-events-none">
            Clique para navegar
          </div>
        )}
      </div>
    );
  },
);

WaveformVisualizer.displayName = 'WaveformVisualizer';

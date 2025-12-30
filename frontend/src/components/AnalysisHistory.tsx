// src/components/AnalysisHistory.tsx
import { History, Music, Clock, Disc } from "lucide-react";

interface HistoryItem {
  filename: string;
  stems_count: number;
  chords_count: number;
  duration: number;
  timestamp: string;
}

interface AnalysisHistoryProps {
  history: HistoryItem[];
  onSelectFile?: (filename: string) => void;
}

export default function AnalysisHistory({
  history,
  onSelectFile,
}: AnalysisHistoryProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (history.length === 0) {
    return (
      <div className="glass-card rounded-lg p-4 text-center neon-bordertext-center">
        <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-400">Nenhuma análise realizada ainda</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-4 text-center border-primary/50">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold">Histórico de Análises</h2>
        <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-sm">
          {history.length}
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Clique em uma análise para carregar os stems e acordes
      </p>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.map((item, index) => (
          <div
            key={index}
            onClick={() => onSelectFile?.(item.filename)}
            className="glass-card rounded-lg p-4 text-center neon-border transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Music className="w-8 h-8 text-blue-400 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p
                    className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors"
                    title={item.filename}
                  >
                    {item.filename}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                      <Disc className="w-4 h-4" />
                      <span>{item.stems_count} stems</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      <span>{item.chords_count} acordes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(item.duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {formatDate(item.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// src/components/AnalysisHistory.tsx
import { History, Music, Clock, Disc, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

import type { HistoryItem } from "../types";

interface AnalysisHistoryProps {
  history: HistoryItem[];
  onSelectFile?: (filename: string) => void;
  onDeleteFile?: (filename: string) => void;
}

export default function AnalysisHistory({
  history,
  onSelectFile,
  onDeleteFile,
}: AnalysisHistoryProps) {
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

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

  const handleDelete = async (filename: string) => {
    setDeletingFile(filename);
    try {
      await onDeleteFile?.(filename);
      toast.success(`Análise de "${filename}" excluída com sucesso!`);
    } finally {
      setDeletingFile(null);
    }
  };

  if (history.length === 0) {
    return (
      <div className="glass-card p-4 text-center">
        <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-400">Nenhuma análise realizada ainda</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">
          Histórico de Análises
        </h2>
        <span className="badge-primary font-semibold">{history.length}</span>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Clique em uma análise para carregar os stems e acordes
      </p>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.map((item, index) => (
          <div
            key={index}
            onClick={() => onSelectFile?.(item.filename)}
            className="glass-card-hover p-4 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Music className="w-8 h-8 text-primary group-hover:text-purple-400 transition-colors flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p
                    className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors text-left"
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
                  <div className="text-xs text-gray-500 mt-1 text-left">
                    {formatDate(item.timestamp)}
                  </div>
                </div>
              </div>

              {/* Botão de deletar com Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    disabled={deletingFile === item.filename}
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Deletar análise e arquivos"
                  >
                    {deletingFile === item.filename ? (
                      <div className="spinner-destructive h-5 w-5"></div>
                    ) : (
                      <Trash2 className="w-5 h-5 text-destructive" />
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent
                  className="sm:max-w-[425px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DialogHeader>
                    <DialogTitle>Confirmar Exclusão</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja deletar a análise do arquivo{" "}
                      <span className="font-bold">{item.filename}</span>? Esta
                      ação não pode ser desfeita.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(item.filename)}
                      disabled={deletingFile === item.filename}
                    >
                      {deletingFile === item.filename
                        ? "Deletando..."
                        : "Deletar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useCallback } from "react";
import { Upload, Music, FileAudio, X } from "lucide-react";
import { cn } from "../lib/utils";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  selectedFile: File | null;
  onClear: () => void;
}

export const FileUploader = ({
  onFileSelect,
  isLoading,
  selectedFile,
  onClear,
}: FileUploaderProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  if (selectedFile) {
    return (
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300",
          "border-primary/50 bg-gradient-to-br from-card/50 to-background"
        )}
      >
        <div className="flex items-center justify-center gap-4">
          <Music className="h-12 w-12 text-primary" />
          <div className="flex-1 text-left">
            <p className="text-lg font-semibold text-foreground">
              {selectedFile.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={onClear}
            disabled={isLoading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer group",
        "border-border hover:border-primary/50",
        "bg-gradient-to-br from-card/50 to-background",
        isLoading && "pointer-events-none opacity-50"
      )}
    >
      <input
        type="file"
        accept="audio/*"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-accent/20",
            "group-hover:scale-110 transition-transform duration-300"
          )}
        >
          <Upload className="h-8 w-8 text-primary" />

          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
          <div className="absolute -inset-2 rounded-full border border-primary/10 animate-pulse" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {isLoading ? "Carregando..." : "Arraste seu arquivo de áudio"}
          </h3>
          <p className="text-sm text-muted-foreground">
            ou clique para selecionar • MP3, WAV, FLAC, OGG
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Music className="h-4 w-4" />
            <span>Separação de stems</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileAudio className="h-4 w-4" />
            <span>Detecção de acordes</span>
          </div>
        </div>
      </div>
    </div>
  );
};


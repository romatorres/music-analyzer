import { useState, useCallback, useRef, useEffect } from "react";

export function useAudioEffects(apiUrl: string) {
    const [playbackRate, setPlaybackRate] = useState(1);
    const [pitchShift, setPitchShift] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<number | null>(null);

    // Processar áudio no backend
    const processAudio = useCallback(async (
        filename: string,
        pitch: number,
        rate: number,
        audioUrl?: string,
        fileObject?: File
    ) => {
        // Cancelar requisição anterior se existir
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Se não há alterações, limpar áudio processado
        if (pitch === 0 && rate === 1.0) {
            setProcessedAudioUrl(null);
            setIsProcessing(false);
            return;
        }

        try {
            setIsProcessing(true);
            console.log(`[AudioEffects] Processando: pitch=${pitch}, rate=${rate}`);

            abortControllerRef.current = new AbortController();

            // Sempre enviar via FormData
            const formData = new FormData();

            if (fileObject) {
                // Arquivo novo - enviar o File object
                console.log(`[AudioEffects] Enviando arquivo novo: ${filename}`);
                formData.append('audio', fileObject);
            } else if (audioUrl) {
                // Arquivo do histórico - baixar e enviar
                console.log(`[AudioEffects] Baixando áudio do histórico...`);
                const audioResponse = await fetch(audioUrl);
                const audioBlob = await audioResponse.blob();
                formData.append('audio', audioBlob, filename);
            } else {
                throw new Error('Nenhum arquivo ou URL fornecido');
            }

            formData.append('pitch_shift', pitch.toString());
            formData.append('time_stretch', rate.toString());

            const response = await fetch(`${apiUrl}/api/process-audio`, {
                method: 'POST',
                body: formData,
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`Erro ao processar: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Limpar URL anterior
            if (processedAudioUrl) {
                URL.revokeObjectURL(processedAudioUrl);
            }

            setProcessedAudioUrl(url);
            console.log(`[AudioEffects] ✓ Áudio processado com sucesso`);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('[AudioEffects] Requisição cancelada');
            } else {
                console.error('[AudioEffects] Erro ao processar áudio:', error);
            }
        } finally {
            setIsProcessing(false);
        }
    }, [apiUrl, processedAudioUrl]);

    // Processar com debounce (aguardar usuário parar de mover slider)
    const processAudioDebounced = useCallback((
        filename: string,
        pitch: number,
        rate: number,
        audioUrl?: string,
        fileObject?: File
    ) => {
        // Limpar timer anterior
        if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current);
        }

        // Aguardar 500ms após última mudança
        debounceTimerRef.current = window.setTimeout(() => {
            processAudio(filename, pitch, rate, audioUrl, fileObject);
        }, 500);
    }, [processAudio]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (debounceTimerRef.current) {
                window.clearTimeout(debounceTimerRef.current);
            }
            if (processedAudioUrl) {
                URL.revokeObjectURL(processedAudioUrl);
            }
        };
    }, [processedAudioUrl]);

    return {
        playbackRate,
        pitchShift,
        isProcessing,
        processedAudioUrl,
        setPlaybackRate,
        setPitchShift,
        processAudio,
        processAudioDebounced,
    };
}

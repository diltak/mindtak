'use client';

import { useState, useRef, useCallback } from 'react';

export interface AudioPlayerConfig {
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export function useAudioPlayer(config: AudioPlayerConfig = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudioFromBase64 = useCallback(async (base64Data: string, mimeType: string = 'audio/wav') => {
    try {
      setIsLoading(true);

      // Create audio blob from base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);

      // Create and configure audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadeddata = () => {
        setIsLoading(false);
      };

      audio.onplay = () => {
        setIsPlaying(true);
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        config.onEnded?.();
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        config.onError?.('Failed to play audio');
      };

      // Start playback
      await audio.play();

    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsLoading(false);
      setIsPlaying(false);
      config.onError?.(error instanceof Error ? error.message : 'Failed to play audio');
    }
  }, [config]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    playAudioFromBase64,
    stopAudio,
    pauseAudio,
    resumeAudio
  };
}

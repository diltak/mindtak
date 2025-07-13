export interface MicrophonePermissionState {
  permission: 'granted' | 'denied' | 'prompt';
  isSupported: boolean;
  error?: string;
}

export class MicrophoneManager {
  private static instance: MicrophoneManager;
  private permissionState: MicrophonePermissionState = {
    permission: 'prompt',
    isSupported: false
  };

  private constructor() {
    this.checkSupport();
  }

  public static getInstance(): MicrophoneManager {
    if (!MicrophoneManager.instance) {
      MicrophoneManager.instance = new MicrophoneManager();
    }
    return MicrophoneManager.instance;
  }

  private checkSupport(): void {
    if (typeof window === 'undefined') {
      this.permissionState.isSupported = false;
      return;
    }

    // Check if getUserMedia is supported
    const hasGetUserMedia = !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia
    );

    // Check if Speech Recognition is supported
    const hasSpeechRecognition = !!(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );

    this.permissionState.isSupported = hasGetUserMedia && hasSpeechRecognition;

    if (!hasGetUserMedia) {
      this.permissionState.error = 'getUserMedia not supported in this browser';
    } else if (!hasSpeechRecognition) {
      this.permissionState.error = 'Speech Recognition not supported in this browser';
    }
  }

  public async requestPermission(): Promise<MicrophonePermissionState> {
    if (!this.permissionState.isSupported) {
      return this.permissionState;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Permission granted
      this.permissionState.permission = 'granted';
      this.permissionState.error = undefined;

      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());

      return this.permissionState;
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.permissionState.permission = 'denied';
        this.permissionState.error = 'Microphone permission denied by user';
      } else if (error.name === 'NotFoundError') {
        this.permissionState.permission = 'denied';
        this.permissionState.error = 'No microphone device found';
      } else if (error.name === 'NotReadableError') {
        this.permissionState.permission = 'denied';
        this.permissionState.error = 'Microphone is already in use by another application';
      } else {
        this.permissionState.permission = 'denied';
        this.permissionState.error = `Microphone error: ${error.message}`;
      }

      return this.permissionState;
    }
  }

  public async checkPermission(): Promise<MicrophonePermissionState> {
    if (!this.permissionState.isSupported) {
      return this.permissionState;
    }

    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ 
          name: 'microphone' as PermissionName 
        });
        this.permissionState.permission = permission.state;
      }
    } catch (error) {
      console.log('Permission API not supported, will check on request');
    }

    return this.permissionState;
  }

  public getState(): MicrophonePermissionState {
    return { ...this.permissionState };
  }

  public isSupported(): boolean {
    return this.permissionState.isSupported;
  }
}

// Speech Recognition Manager
export class SpeechRecognitionManager {
  private recognition: any = null;
  private isListening = false;
  private callbacks: {
    onResult?: (transcript: string, isFinal: boolean) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  } = {};

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition(): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.callbacks.onResult?.(finalTranscript, true);
      } else if (interimTranscript) {
        this.callbacks.onResult?.(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      let errorMessage = 'Speech recognition error';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied';
          break;
        case 'network':
          errorMessage = 'Network error occurred';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      this.callbacks.onError?.(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks.onEnd?.();
    };

    return true;
  }

  public setCallbacks(callbacks: {
    onResult?: (transcript: string, isFinal: boolean) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  }): void {
    this.callbacks = callbacks;
  }

  public async start(): Promise<boolean> {
    if (!this.recognition || this.isListening) {
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.callbacks.onError?.('Failed to start speech recognition');
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}
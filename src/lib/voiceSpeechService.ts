// Speech-to-Text and Text-to-Speech Web APIs for Naidu Hotel Voice Assistant
// Supports English (en-IN), Telugu (te-IN), and Hindi (hi-IN)

export type VoiceLanguage = 'en-IN' | 'te-IN' | 'hi-IN';

export interface SpeechRecognitionResultPayload {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

// Check Web Speech Recognition support
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
};

// Check Web Speech Synthesis support
export const isSpeechSynthesisSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
};

// Map friendly language code to BCP 47 code
export const getBcp47LanguageCode = (lang: 'en' | 'te' | 'hi' | 'auto'): VoiceLanguage => {
  switch (lang) {
    case 'te':
      return 'te-IN';
    case 'hi':
      return 'hi-IN';
    case 'en':
    default:
      return 'en-IN';
  }
};

/**
 * Actively request microphone permission via browser getUserMedia API
 */
export const requestMicrophonePermission = async (): Promise<{ granted: boolean; error?: string }> => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { granted: false, error: 'Microphone is not supported in this browser.' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately since this was a permission handshake
    stream.getTracks().forEach(track => track.stop());
    return { granted: true };
  } catch (err: any) {
    const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
    return {
      granted: false,
      error: isDenied ? 'not-allowed' : err?.message || 'permission-error'
    };
  }
};

/**
 * Check if microphone permission is currently denied, granted, or prompt
 */
export const queryMicrophonePermission = async (): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> => {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unsupported';
  }
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as any });
    return status.state as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'unsupported';
  }
};

/**
 * Text-to-Speech helper for English, Telugu, and Hindi
 */
export class VoiceSpeaker {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Pre-load voices
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public speak(
    text: string,
    langCode: VoiceLanguage = 'en-IN',
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (this.isMuted || !isSpeechSynthesisSupported()) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.stop();

      // Clean markdown, emojis, asterisks, bullet points from text before speaking
      const cleanText = text
        .replace(/[*_#`~[\]()]/g, '')
        .replace(/[•\-\u2022\u25E6]/g, ', ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode;
      utterance.rate = 0.95; // Slightly measured, hospitality tone
      utterance.pitch = 1.0;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => {
        if (langCode === 'te-IN') {
          return v.lang.startsWith('te') || v.lang.includes('te-IN');
        } else if (langCode === 'hi-IN') {
          return v.lang.startsWith('hi') || v.lang.includes('hi-IN');
        } else {
          return v.lang.includes('en-IN') || v.lang.includes('en_IN') || v.lang.startsWith('en');
        }
      });

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        // Interrupted errors happen normally on cancel()
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Voice speaker notice:', e.error);
        }
        if (onError) onError(e);
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
      if (onEnd) onEnd();
    }
  }
}

/**
 * Speech Recognition listener wrapper for browser SpeechRecognition
 */
export class VoiceRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 2;
      }
    }
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public start(
    langCode: VoiceLanguage,
    onResult: (result: SpeechRecognitionResultPayload) => void,
    onError: (error: string, errorCode?: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser.', 'not-supported');
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
    }

    try {
      this.recognition.lang = langCode;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const transcript = (finalTranscript || interimTranscript).trim();
        const isFinal = Boolean(finalTranscript);

        if (transcript) {
          onResult({
            transcript,
            isFinal,
            confidence: event.results[0]?.[0]?.confidence || 0.9,
          });
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let errMsg = 'Speech recognition error';
        let errCode = event.error || 'unknown';
        if (event.error === 'no-speech') {
          errMsg = 'No speech was detected. Please try speaking again.';
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          errMsg = 'Microphone permission was denied. Please allow microphone access.';
          errCode = 'not-allowed';
        } else if (event.error === 'network') {
          errMsg = 'Network issue with speech recognition service.';
        }
        onError(errMsg, errCode);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
    } catch (err: any) {
      this.isListening = false;
      const isDenied = err?.name === 'NotAllowedError' || err?.message?.includes('not-allowed');
      onError(err?.message || 'Failed to start speech recognition', isDenied ? 'not-allowed' : 'failed');
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  public abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }
}

// Shared instances
export const globalSpeaker = new VoiceSpeaker();

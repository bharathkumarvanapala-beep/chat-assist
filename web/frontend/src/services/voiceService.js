/**
 * Voice Service for Hindi Assist
 * 
 * Provides on-device Speech-to-Text (STT) and Text-to-Speech (TTS)
 * using the standard browser Web Speech API.
 * 
 * Languages supported:
 * - Hindi (hi-IN)
 * - English (en-IN / en-US)
 * - Telugu (te-IN)
 * 
 * Privacy-First: Zero remote audio uploads. Processing is done natively in browser.
 */

const LANG_MAP_RECOGNITION = {
  hi: 'hi-IN',
  en: 'en-IN',
  te: 'te-IN',
  auto: 'en-IN'
};

const LANG_MAP_SYNTHESIS = {
  hi: 'hi-IN',
  en: 'en-IN',
  te: 'te-IN',
  auto: 'hi-IN'
};

class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.currentUtterance = null;
    this.cachedVoices = [];

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  /**
   * Check if speech recognition (STT) is supported in current browser
   */
  isRecognitionSupported() {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Check if speech synthesis (TTS) is supported in current browser
   */
  isSynthesisSupported() {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  /**
   * Start microphone listening for voice input
   */
  startListening({ lang = 'en', onResult, onError, onEnd, onStart }) {
    if (!this.isRecognitionSupported()) {
      if (onError) onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return false;
    }

    try {
      this.stopListening();

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      const targetLang = LANG_MAP_RECOGNITION[lang] || 'en-IN';
      this.recognition.lang = targetLang;
      this.recognition.continuous = false; // Sentence-level speech
      this.recognition.interimResults = true; // Show live interim text while speaking
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };

      this.recognition.onresult = (event) => {
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

        const transcript = finalTranscript.trim() || interimTranscript.trim();
        const isFinal = Boolean(finalTranscript.trim());

        if (onResult && transcript) {
          onResult({
            transcript,
            isFinal,
            rawText: transcript
          });
        }
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        let errorMessage = 'Voice recognition error.';
        if (event.error === 'not-allowed') {
          errorMessage = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
        } else if (event.error === 'no-speech') {
          errorMessage = 'No speech was detected. Please try speaking again.';
        } else if (event.error === 'network') {
          errorMessage = 'Network error during speech recognition.';
        } else {
          errorMessage = `Speech error: ${event.error}`;
        }
        if (onError) onError(errorMessage);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err) {
      this.isListening = false;
      if (onError) onError(err.message || 'Failed to start speech recognition.');
      return false;
    }
  }

  /**
   * Stop speech recognition
   */
  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  /**
   * Text-to-Speech: Speak text out loud in target language
   */
  speak({ text, lang = 'hi', onStart, onEnd, onError }) {
    if (!this.isSynthesisSupported()) {
      if (onError) onError('Speech synthesis is not supported in this browser.');
      return false;
    }

    if (!text || !text.trim()) return false;

    try {
      this.stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      const targetLang = LANG_MAP_SYNTHESIS[lang] || 'hi-IN';
      utterance.lang = targetLang;
      utterance.rate = 0.95; // Clear natural conversational pace
      utterance.pitch = 1.0;

      // Match voice for target language
      const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
      const langPrefix = targetLang.split('-')[0];
      const matchedVoice = voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
                           voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        if (onError) onError(e.error || 'Speech synthesis failed.');
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      if (onError) onError(err.message || 'Speech synthesis error.');
      return false;
    }
  }

  /**
   * Stop any active text-to-speech audio
   */
  stopSpeaking() {
    if (this.isSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.currentUtterance = null;
  }

  /**
   * Check if speech synthesis is currently playing audio
   */
  isSpeaking() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }
}

export const voiceService = new VoiceService();

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language } from '../types';

export class SpeechService {
  private static instance: SpeechService;
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speaking: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  public static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  public speak(
    text: string,
    language: Language,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!this.synthesis) {
      console.warn('SpeechSynthesis is not supported in this environment.');
      return false;
    }

    this.stop();

    if (!text || text.trim() === '') {
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Map language code per BCP-47
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-US';
    }

    // Attempt to pick matching voice
    const voices = this.synthesis.getVoices();
    const matchingVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase())
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.rate = 0.95; // Slightly slower, calm cadence
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.speaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.speaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.speaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
    return true;
  }

  public stop(): void {
    if (this.synthesis && (this.speaking || this.synthesis.speaking)) {
      this.synthesis.cancel();
      this.speaking = false;
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.speaking || (this.synthesis ? this.synthesis.speaking : false);
  }
}

export const speechService = SpeechService.getInstance();

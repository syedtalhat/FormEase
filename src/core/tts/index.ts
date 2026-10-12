/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportedLanguage } from '../i18n';

export interface TTSVoiceState {
  available: boolean;
  voiceName?: string;
}

export class TTSController {
  private static instance: TTSController;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();
  private voices: SpeechSynthesisVoice[] = [];

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public static getInstance(): TTSController {
    if (!TTSController.instance) {
      TTSController.instance = new TTSController();
    }
    return TTSController.instance;
  }

  private loadVoices(): void {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  public subscribe(listener: (speaking: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(speaking: boolean): void {
    this.isSpeaking = speaking;
    this.listeners.forEach((l) => l(speaking));
  }

  public checkVoiceAvailability(language: SupportedLanguage): TTSVoiceState {
    const localeMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN',
    };
    const target = localeMap[language].toLowerCase();
    const prefix = language.toLowerCase();

    const match = this.voices.find(
      (v) =>
        v.lang.toLowerCase() === target ||
        v.lang.toLowerCase().startsWith(prefix)
    );

    return {
      available: !!match,
      voiceName: match?.name,
    };
  }

  public speak(
    text: string,
    language: SupportedLanguage = 'en',
    speedRate: number = 1.0,
    onEndCallback?: () => void
  ): boolean {
    if (!this.synth) return false;

    this.stop();

    if (!text || !text.trim()) return false;

    const utterance = new SpeechSynthesisUtterance(text);

    const localeMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN',
    };
    utterance.lang = localeMap[language] || 'en-IN';
    utterance.rate = speedRate;

    // Pick matching voice
    const voiceState = this.checkVoiceAvailability(language);
    if (voiceState.voiceName) {
      const v = this.voices.find((voc) => voc.name === voiceState.voiceName);
      if (v) utterance.voice = v;
    }

    utterance.onstart = () => {
      this.notify(true);
    };

    utterance.onend = () => {
      this.notify(false);
      this.currentUtterance = null;
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      this.notify(false);
      this.currentUtterance = null;
      if (onEndCallback) onEndCallback();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    return true;
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.notify(false);
      this.currentUtterance = null;
    }
  }

  public getSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const tts = TTSController.getInstance();

import React, { useEffect, useRef, memo } from 'react';

interface AudioManagerProps {
  url: string;
  started: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  gameOver: boolean;
  levelComplete?: boolean;
}

/**
 * Web Audio API Implementation for Robust Performance
 * 
 * WHY WEB AUDIO?
 * HTML5 <audio> on mobile WebViews is notoriously flaky:
 * 1. It fails to loop gaplessly.
 * 2. It can be reset by the OS/WebView during memory pressure or re-renders.
 * 3. It relies on "streaming" which can hitch.
 * 
 * AudioContext loads the ENTIRE file into a memory buffer once, ensuring:
 * 1. Perfect gapless looping.
 * 2. Resilience to component re-renders.
 * 3. Low latency.
 */

class WebAudioEngine {
  private context: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    console.log("[WebAudio] Initializing Context");
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

    this.bgmGain = this.context.createGain();
    this.bgmGain.connect(this.context.destination);

    this.sfxGain = this.context.createGain();
    this.sfxGain.connect(this.context.destination);

    this.isInitialized = true;
  }

  async loadSound(name: string, url: string) {
    if (this.buffers.has(name)) return;
    try {
      console.log(`[WebAudio] Loading: ${url}`);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const decodedBuffer = await this.context!.decodeAudioData(arrayBuffer);
      this.buffers.set(name, decodedBuffer);
      console.log(`[WebAudio] Decoded: ${name}`);
    } catch (e) {
      console.error(`[WebAudio] Load failed for ${name}`, e);
    }
  }

  playBGM(name: string, volume: number) {
    if (!this.context || !this.buffers.has(name)) return;
    this.stopBGM();

    const source = this.context.createBufferSource();
    source.buffer = this.buffers.get(name)!;
    source.loop = true;

    this.bgmGain!.gain.value = volume;
    source.connect(this.bgmGain!);

    source.start(0);
    this.bgmSource = source;
    console.log(`[WebAudio] BGM Playing: ${name}`);
  }

  stopBGM() {
    if (this.bgmSource) {
      try { this.bgmSource.stop(); } catch (e) { }
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
  }

  setBGMVolume(val: number) {
    if (this.bgmGain) this.bgmGain.gain.setTargetAtTime(val, this.context!.currentTime, 0.05);
  }

  setSFXVolume(val: number) {
    if (this.sfxGain) this.sfxGain.gain.value = val;
  }

  playSFX(name: string) {
    if (!this.context || !this.buffers.has(name)) return;
    const source = this.context.createBufferSource();
    source.buffer = this.buffers.get(name)!;
    source.connect(this.sfxGain!);
    source.start(0);
  }

  resume() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }

  suspend() {
    if (this.context?.state === 'running') {
      this.context.suspend();
    }
  }
}

// Singleton Instance
const engine = new WebAudioEngine();

export const AudioManager = memo<AudioManagerProps>(({ url, started, musicEnabled, sfxEnabled, gameOver, levelComplete }) => {

  useEffect(() => {
    const setup = async () => {
      await engine.init();
      await Promise.all([
        engine.loadSound('bgm', url),
        engine.loadSound('crash', 'crash.mp3'),
        engine.loadSound('win', 'win.mp3')
      ]);
    };
    setup();

    const handleInteraction = () => {
      engine.resume();
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('click', handleInteraction);

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, [url]);

  // Handle Visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) engine.suspend();
      else engine.resume();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Sync Volume
  useEffect(() => {
    const bgmVol = !musicEnabled ? 0 : (levelComplete ? 0.08 : 0.4);
    engine.setBGMVolume(bgmVol);
    engine.setSFXVolume(!sfxEnabled ? 0 : 0.6);
  }, [musicEnabled, sfxEnabled, levelComplete]);

  // Sync State
  useEffect(() => {
    if (started && !gameOver) {
      engine.resume();
      engine.playBGM('bgm', !musicEnabled ? 0 : 0.4);
    } else {
      engine.stopBGM();
    }
  }, [started, gameOver]);

  // Handle SFX Triggers
  useEffect(() => {
    if (gameOver && sfxEnabled) engine.playSFX('crash');
  }, [gameOver, sfxEnabled]);

  useEffect(() => {
    if (levelComplete && sfxEnabled) engine.playSFX('win');
  }, [levelComplete, sfxEnabled]);

  return null;
});

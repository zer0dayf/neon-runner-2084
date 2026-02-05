import React, { useEffect, useRef, memo } from 'react';

interface AudioManagerProps {
  url: string;
  started: boolean;
  muted: boolean;
  gameOver: boolean;
  levelComplete?: boolean;
}

// React.memo ile sarmalıyoruz!
// Bu sayede App.tsx'teki 'progress' değişse bile,
// buradaki prop'lar (started, gameOver vb.) değişmediği sürece bu bileşen render edilmez.
export const AudioManager = memo<AudioManagerProps>(({ url, started, muted, gameOver, levelComplete }) => {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const crashRef = useRef<HTMLAudioElement | null>(null);
  const winRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Objects
  useEffect(() => {
    // Background Music
    const bgm = new Audio(url);
    bgm.preload = "auto";
    bgm.loop = true;
    bgm.volume = 0.4;
    bgmRef.current = bgm;

    // Crash SFX
    const crash = new Audio('crash.mp3');
    crash.preload = "auto";
    crash.volume = 0.6;
    crashRef.current = crash;

    // Win SFX
    const win = new Audio('win.mp3');
    win.preload = "auto";
    win.volume = 0.6;
    winRef.current = win;

    const errorHandler = (e: Event) => {
        console.warn("Audio loading warning:", e);
    };
    bgm.addEventListener('error', errorHandler);

    // Initial Visibility Handler to prevent memory leaks
    const handleVisibilityChange = () => {
       if (document.hidden) {
           bgmRef.current?.pause();
       } else if (bgmRef.current && bgmRef.current.paused && started && !gameOver && !levelComplete) {
           // Sadece oyun aktifse ve duraklatılmışsa devam ettir
           bgmRef.current.play().catch(() => {});
       }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      bgm.removeEventListener('error', errorHandler);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      bgm.pause();
      bgmRef.current = null;
      crashRef.current = null;
      winRef.current = null;
    };
  }, [url]); // started/gameOver buraya eklenmez, sadece init

  // Handle Mute
  useEffect(() => {
    if (bgmRef.current) bgmRef.current.volume = muted ? 0 : 0.4;
    if (crashRef.current) crashRef.current.volume = muted ? 0 : 0.6;
    if (winRef.current) winRef.current.volume = muted ? 0 : 0.6;
  }, [muted]);

  // Game Over Logic (Play Crash)
  useEffect(() => {
      if (gameOver && !muted && crashRef.current) {
          bgmRef.current?.pause();
          crashRef.current.currentTime = 0;
          crashRef.current.play().catch(e => console.warn("Crash SFX failed", e));
      }
  }, [gameOver, muted]);

  // Level Complete Logic (Play Win)
  useEffect(() => {
      if (levelComplete && !muted && winRef.current) {
           // Lower BGM volume for win sound
           if (bgmRef.current) bgmRef.current.volume = 0.1;
           winRef.current.currentTime = 0;
           winRef.current.play().catch(e => console.warn("Win SFX failed", e));
      }

      // FIX: Restore volume if levelComplete turns false (Reset/Next Level)
      if (!levelComplete && bgmRef.current && !muted) {
          bgmRef.current.volume = 0.4;
      }
  }, [levelComplete, muted]);

  // Main BGM Loop Logic
  useEffect(() => {
    const bgm = bgmRef.current;
    if (!bgm) return;

    if (started && !gameOver && !levelComplete) {
       // FORCE VOLUME RESET on Start
       if (!muted) bgm.volume = 0.4;

       // Zaten çalıyorsa dokunma (Takılmayı önler)
       if (bgm.paused) {
           const playPromise = bgm.play();
           if (playPromise !== undefined) {
               playPromise.catch((error) => {
                   console.log("Autoplay prevented or interrupted", error);
                   // Autoplay fallback (kullanıcı etkileşimi bekle)
                   const forcePlay = () => {
                       if (bgmRef.current) bgmRef.current.play().catch(() => {});
                       document.removeEventListener('click', forcePlay);
                       document.removeEventListener('touchstart', forcePlay);
                   };
                   document.addEventListener('click', forcePlay);
                   document.addEventListener('touchstart', forcePlay);
               });
           }
       }
    } else {
       // Oyun durduysa müziği durdur
       if (!bgm.paused) {
           bgm.pause();
       }
       if (gameOver) {
          bgm.currentTime = 0;
       }
    }
  }, [started, gameOver, muted, levelComplete]);

  return null;
});

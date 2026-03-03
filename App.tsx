import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './components/GameScene';
import { UIOverlay } from './components/UIOverlay';
import { AudioManager } from './components/AudioManager';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const App: React.FC = () => {
  const [showTitleScreen, setShowTitleScreen] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [muted, setMuted] = useState(false);

  // --- YENİ: Progress State ---
  const [progress, setProgress] = useState(0);

  // --- Speed Ratio State (0-1, used for velocity bar HUD) ---
  const [speedRatio, setSpeedRatio] = useState(0);

  // --- YENİ: Control Mode State (True = Swipe, False = Tap) ---
  const [isSwipeControl, setIsSwipeControl] = useState(true);

  // Game Stats
  const [level, setLevel] = useState(1);

  // Lazy Initialize from LocalStorage
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neon_runner_max_level');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  // Infinite Mode Stats
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [score, setScore] = useState(0);

  // --- YENİ: Best Progress Tracker ---
  const [bestProgressPerLevel, setBestProgressPerLevel] = useState<Record<number, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neon_runner_best_progress');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Lazy Initialize High Score
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neon_runner_highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  const handleStartSystem = useCallback(() => {
    setShowTitleScreen(false);
  }, []);

  const handleBackToTitle = useCallback(() => {
    setGameStarted(false);
    setShowTitleScreen(true);
  }, []);

  const handleSelectLevel = useCallback((selectedLevel: number) => {
    if (selectedLevel > maxUnlockedLevel) return; // Locked

    setIsInfiniteMode(false);
    setLevel(selectedLevel);
    setGameOver(false);
    setLevelComplete(false);
    setScore(0);
    setProgress(0);
    setPaused(false);
    setResetKey(prev => prev + 1);
    setGameStarted(true);
  }, [maxUnlockedLevel]);

  const handleSelectInfinite = useCallback(() => {
    setIsInfiniteMode(true);
    setLevel(1);
    setGameOver(false);
    setLevelComplete(false);
    setScore(0);
    setProgress(0);
    setPaused(false);
    setResetKey(prev => prev + 1);
    setGameStarted(true);
  }, []);
  const handleProgressUpdate = useCallback((newProgress: number) => {
    setProgress(newProgress);

    // Update best progress if not in infinite mode
    if (!isInfiniteMode) {
      setBestProgressPerLevel(prev => {
        const currentBest = prev[level] || 0;
        if (newProgress > currentBest) {
          const updated = { ...prev, [level]: newProgress };
          localStorage.setItem('neon_runner_best_progress', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [isInfiniteMode, level]);

  const handleToggleControl = useCallback(() => {
    setIsSwipeControl(prev => !prev);
  }, []);

  const handleGameOver = useCallback(() => {
    setGameOver((prev) => {
      if (prev) return prev;

      // Haptic feedback: strong impact on crash
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => { });

      if (isInfiniteMode) {
        setHighScore(curr => {
          const newHigh = Math.max(curr, score);
          localStorage.setItem('neon_runner_highscore', newHigh.toString());
          return newHigh;
        });
      }
      return true;
    });
  }, [isInfiniteMode, score]);

  const handleLevelComplete = useCallback(() => {
    if (isInfiniteMode) return;

    // Haptic feedback: medium impact on level complete
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => { });

    setLevelComplete(true);
    setGameStarted(false);

    setMaxUnlockedLevel(prev => {
      const next = Math.max(prev, level + 1);
      localStorage.setItem('neon_runner_max_level', next.toString());
      return next;
    });
  }, [level, isInfiniteMode]);

  const handleReturnToMenu = useCallback(() => {
    setGameStarted(false);
    setGameOver(false);
    setLevelComplete(false);
    setIsInfiniteMode(false);
    setPaused(false);
    setProgress(0);
  }, []);

  const handleRestart = useCallback(() => {
    setGameOver(false);
    setLevelComplete(false);
    setScore(0);
    setProgress(0);
    setPaused(false);
    setResetKey(prev => prev + 1);
    setGameStarted(true);
  }, []);

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  const handleSpeedUpdate = useCallback((ratio: number) => {
    setSpeedRatio(ratio);
  }, []);

  const handleTogglePause = useCallback(() => {
    if (!gameStarted || gameOver || levelComplete) return;
    setPaused(prev => !prev);
  }, [gameStarted, gameOver, levelComplete]);

  const handleQuit = useCallback(() => {
    setPaused(false);
    handleReturnToMenu();
  }, [handleReturnToMenu]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden z-0">
      <AudioManager
        url="soundtrack.mp3"
        started={!showTitleScreen}
        muted={muted}
        gameOver={gameOver}
        levelComplete={levelComplete}
      />

      <Canvas
        {...{ key: resetKey }}
        // Mobil performans optimizasyonu
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          stencil: false,
          depth: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false
        }}
      >
        <GameScene
          gameStarted={gameStarted}
          isGameOver={gameOver}
          level={level}
          isInfinite={isInfiniteMode}
          paused={paused}
          isSwipeControl={isSwipeControl} // --- Gönderildi
          onGameOver={handleGameOver}
          onLevelComplete={handleLevelComplete}
          onScoreUpdate={handleScoreUpdate}
          onProgressUpdate={handleProgressUpdate}
          onSpeedUpdate={handleSpeedUpdate}
        />
      </Canvas>

      <UIOverlay
        showTitleScreen={showTitleScreen}
        started={gameStarted}
        gameOver={gameOver}
        levelComplete={levelComplete}
        paused={paused}
        onStartSystem={handleStartSystem}
        onBackToTitle={handleBackToTitle}
        onSelectLevel={handleSelectLevel}
        onSelectInfinite={handleSelectInfinite}
        onRestart={handleRestart}
        onReturnToMenu={handleReturnToMenu}
        onTogglePause={handleTogglePause}
        onQuit={handleQuit}
        level={level}
        maxUnlockedLevel={maxUnlockedLevel}
        isInfinite={isInfiniteMode}
        score={score}
        highScore={highScore}
        progress={progress}
        bestProgress={bestProgressPerLevel[level] || 0}
        isSwipeControl={isSwipeControl} // --- Gönderildi
        onToggleControl={handleToggleControl} // --- Gönderildi
        muted={muted}
        onToggleMute={toggleMute}
        speedRatio={speedRatio}
      />
    </div>
  );
};

export default App;

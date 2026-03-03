import React, { Suspense } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { Track } from './Track';
import { Effects } from './Effects';
import { SKY_COLOR } from '../constants';
import { StarField, SynthwaveSun, NeonGrid, RetroArtifacts } from './WorldComponents';
import '../types';

interface GameSceneProps {
  gameStarted: boolean;
  isGameOver: boolean;
  level: number;
  isInfinite: boolean;
  paused: boolean;
  isSwipeControl: boolean; // --- EKLENDİ
  onGameOver: () => void;
  onLevelComplete: () => void;
  onScoreUpdate: (score: number) => void;
  onProgressUpdate: (progress: number) => void;
  onSpeedUpdate?: (speedRatio: number) => void;
}

export const GameScene: React.FC<GameSceneProps> = ({
  gameStarted, isGameOver, level, isInfinite, paused, isSwipeControl,
  onGameOver, onLevelComplete, onScoreUpdate, onProgressUpdate, onSpeedUpdate
}) => {
  return (
    <>
      <PerspectiveCamera makeDefault fov={85} position={[0, 0, 10]} near={0.1} far={3000} />

      <color attach="background" args={[SKY_COLOR]} />
      <fog attach="fog" args={[SKY_COLOR, 10, 800]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[100, 200, 50]} intensity={1} color="#ff00ff" />

      <Suspense fallback={null}>
        <Track
          gameStarted={gameStarted}
          isGameOver={isGameOver}
          level={level}
          isInfinite={isInfinite}
          paused={paused}
          isSwipeControl={isSwipeControl} // --- Gönderildi
          onGameOver={onGameOver}
          onLevelComplete={onLevelComplete}
          onScoreUpdate={onScoreUpdate}
          onProgressUpdate={onProgressUpdate}
          onSpeedUpdate={onSpeedUpdate}
        />

        <SynthwaveSun isInfinite={isInfinite} />

        <NeonGrid />
        <RetroArtifacts />
        <StarField />

        <Effects />
      </Suspense>
    </>
  );
};

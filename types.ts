// types.ts

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  isLevelComplete: boolean;
  level: number;
  maxUnlockedLevel: number;
  isInfinite: boolean; // New: infinite mode flag
  score: number;       // New: current score
  highScore: number;   // New: high score
  progress: number;    // --- YENİ: Progress bar yüzdesi (0-100)
}

export type ObstacleType = 'block' | 'ring' | 'spinner' | 'double-spinner';

export interface ObstacleData {
  t: number; // Position along curve (0 to 1)
  angle: number; // Position on the ring (0 to 2PI)
  width: number; // Arc width in radians
  type: ObstacleType;
  id: string;
  rotationSpeed?: number; // For dynamic obstacles
}

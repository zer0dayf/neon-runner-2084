import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { TRACK_CURVE, TRACK_COLOR, TUBE_RADIUS, CAMERA_HEIGHT, CAMERA_DISTANCE } from '../constants';
import { ObstacleData, ObstacleType } from '../types';

// Gameplay Constants
const BASE_START_SPEED = 0.00025;
const BASE_MAX_SPEED = 0.0010;
const ROTATION_SPEED = 4.0; // Tap/Klavye hızı
const SWIPE_SENSITIVITY = 0.01; // Swipe hassasiyeti
const COLLISION_THRESHOLD_T = 0.0012; // Reduced for more accurate collision timing

// Collision angle thresholds (radians) - cylinder is 0.4 radius, player is 0.5 radius
const SPINNER_HIT_ANGLE = 0.12; // ~7 degrees - more forgiving for fast-spinning obstacles
const BLOCK_HIT_ANGLE = 0.15; // ~8.5 degrees - accounts for cube size

interface TrackProps {
  gameStarted: boolean;
  isGameOver: boolean;
  level: number;
  isInfinite: boolean;
  paused: boolean;
  isSwipeControl: boolean;
  onGameOver: () => void;
  onLevelComplete: () => void;
  onScoreUpdate: (score: number) => void;
  onProgressUpdate: (progress: number) => void;
}

// --- Obstacle Component ---
const ObstacleMesh: React.FC<{
  data: ObstacleData;
  trackPoint: Vector3;
  trackTangent: Vector3;
  trackBinormal: Vector3;
  trackNormal: Vector3;
  playerProgressRef: React.MutableRefObject<number>;
  paused: boolean;
}> = ({ data, trackPoint, trackTangent, trackBinormal, trackNormal, playerProgressRef, paused }) => {

  const groupRef = useRef<THREE.Group>(null);
  const [rot, setRot] = useState(0);

  useFrame((state, delta) => {
    if (paused) return;

    if (data.type === 'spinner' || data.type === 'double-spinner') {
      setRot(prev => prev + delta * (data.rotationSpeed || 1));
    }

    if (groupRef.current) {
      let dist = Math.abs(data.t - playerProgressRef.current);
      const isVisible = dist < 0.10;
      if (groupRef.current.visible !== isVisible) {
        groupRef.current.visible = isVisible;
      }
    }
  });

  const getPositionAndQuat = (angle: number) => {
    const centerPos = trackPoint.clone();
    const matrix = new THREE.Matrix4().lookAt(centerPos, centerPos.clone().add(trackTangent), trackNormal);
    const quat = new THREE.Quaternion().setFromRotationMatrix(matrix);
    return { centerPos, quat };
  };

  const { centerPos, quat } = getPositionAndQuat(data.angle);

  return (
    <group ref={groupRef} position={centerPos} quaternion={quat}>
      {data.type === 'block' && (
        <group rotation={[0, 0, data.angle]}>
          <mesh position={[TUBE_RADIUS - 1.2, 0, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshBasicMaterial color="#ff0044" toneMapped={false} />
          </mesh>
          <mesh position={[TUBE_RADIUS - 1.2, 0, 0]}>
            <boxGeometry args={[2.2, 2.2, 2.2]} />
            <meshBasicMaterial color="#ff0044" wireframe />
          </mesh>
        </group>
      )}

      {data.type === 'ring' && (
        <group rotation={[0, 0, data.angle + (data.width / 2)]}>
          <mesh>
            <torusGeometry args={[TUBE_RADIUS - 1, 0.8, 8, 48, (Math.PI * 2) - data.width]} />
            <meshBasicMaterial color="#ffaa00" toneMapped={false} />
          </mesh>
        </group>
      )}

      {data.type === 'spinner' && (
        <group rotation={[0, 0, data.angle + rot]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.4, 0.4, TUBE_RADIUS * 1.95, 8]} />
            <meshBasicMaterial color="#d400ff" toneMapped={false} />
          </mesh>
        </group>
      )}

      {data.type === 'double-spinner' && (
        <group rotation={[0, 0, data.angle + rot]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, TUBE_RADIUS * 1.95, 8]} />
            <meshBasicMaterial color="#ff0000" toneMapped={false} />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, TUBE_RADIUS * 1.95, 8]} />
            <meshBasicMaterial color="#00ffff" toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.8]} />
            <meshBasicMaterial color="white" />
          </mesh>
        </group>
      )}
    </group>
  );
};


export const Track: React.FC<TrackProps> = ({ gameStarted, isGameOver, level, isInfinite, paused, isSwipeControl, onGameOver, onLevelComplete, onScoreUpdate, onProgressUpdate }) => {
  const { camera } = useThree();

  // Game Logic Refs
  const progressRef = useRef(0.002);
  const playerAngleRef = useRef(-Math.PI / 2);
  const lapCountRef = useRef(0);
  const [currentLap, setCurrentLap] = useState(0);
  const lastReportedProgressRef = useRef(0);

  const initialSpeed = BASE_START_SPEED * (1 + (level - 1) * 0.1);
  const speedRef = useRef(initialSpeed);

  // --- INPUT REFS ---
  const keys = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const lastTouchX = useRef<number | null>(null);

  // Visual Refs
  const playerRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Group>(null);
  const ballMeshRef = useRef<THREE.Mesh>(null);
  const tunnelMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const hueTimer = useRef(0);
  const lastScoreTime = useRef(0);

  // Reset logic
  useEffect(() => {
    speedRef.current = BASE_START_SPEED * (1 + (level - 1) * 0.1);
    playerAngleRef.current = -Math.PI / 2;
    progressRef.current = 0.002;
    hueTimer.current = 0;
    lapCountRef.current = 0;
    setCurrentLap(0);
    onProgressUpdate(0);
  }, [level, isInfinite, onProgressUpdate]);

  useEffect(() => {
    if (isGameOver || paused) {
      keys.current = { left: false, right: false };
      lastTouchX.current = null;
    }
  }, [isGameOver, paused]);

  // --- HYBRID INPUT LISTENERS ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;

      const touchX = e.touches[0].clientX;

      if (isSwipeControl) {
        lastTouchX.current = touchX;
      } else {
        const width = window.innerWidth;
        if (touchX < width / 2) {
          keys.current.left = true;
          keys.current.right = false;
        } else {
          keys.current.right = true;
          keys.current.left = false;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if ((e.target as HTMLElement).closest('button')) return;

      if (isSwipeControl && lastTouchX.current !== null) {
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - lastTouchX.current;
        playerAngleRef.current += deltaX * SWIPE_SENSITIVITY;
        lastTouchX.current = currentX;
      }
    };

    const onTouchEnd = () => {
      if (isSwipeControl) {
        lastTouchX.current = null;
      } else {
        keys.current.left = false;
        keys.current.right = false;
      }
    };

    const onResetInputs = () => {
      keys.current.left = false;
      keys.current.right = false;
      lastTouchX.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onResetInputs);
    window.addEventListener('blur', onResetInputs);
    document.addEventListener('visibilitychange', onResetInputs);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onResetInputs);
      window.removeEventListener('blur', onResetInputs);
      document.removeEventListener('visibilitychange', onResetInputs);
    };
  }, [isSwipeControl]);

  const obstacles = useMemo(() => {
    const items: ObstacleData[] = [];
    const difficultyLevel = isInfinite ? Math.min(5, Math.floor(currentLap / 2) + 1) : level;
    const varietyLevel = isInfinite ? 5 : difficultyLevel;
    const count = 40 + (difficultyLevel * 8);

    const allowedTypes: ObstacleType[] = [];
    if (varietyLevel === 1) allowedTypes.push('block');
    if (varietyLevel === 2) allowedTypes.push('block', 'ring');
    if (varietyLevel === 3) allowedTypes.push('spinner', 'ring');
    if (varietyLevel === 4) allowedTypes.push('spinner', 'double-spinner', 'ring');
    if (varietyLevel >= 5) allowedTypes.push('block', 'ring', 'spinner', 'double-spinner');

    for (let i = 0; i < count; i++) {
      const t = 0.05 + (i / count) * 0.9;
      const typeIndex = Math.floor(Math.random() * allowedTypes.length);
      const type = allowedTypes[typeIndex];

      let angle = Math.random() * Math.PI * 2;
      let width = 1.0;
      let rotSpeed = 0;

      if (type === 'ring') {
        width = 2.4 - (Math.min(difficultyLevel, 5) * 0.1);
      } else if (type === 'spinner') {
        width = 0.6;
        rotSpeed = (Math.random() > 0.5 ? 1 : -1) * (1.5 + difficultyLevel * 0.3);
      } else if (type === 'double-spinner') {
        width = 0.6;
        rotSpeed = (Math.random() > 0.5 ? 1 : -1) * (1.0 + difficultyLevel * 0.2);
      }

      items.push({ id: `obs-${currentLap}-${i}`, t, angle, width, type, rotationSpeed: rotSpeed });
    }
    return items;
  }, [level, isInfinite, currentLap]);

  useFrame((state, delta) => {
    if (paused) return;

    const dt = Math.min(delta, 0.1);
    const time = state.clock.getElapsedTime();

    const effectiveLevel = isInfinite ? Math.min(8, Math.floor(lapCountRef.current / 2) + 1) : level;
    const currentMaxSpeed = BASE_MAX_SPEED * (1 + (effectiveLevel - 1) * 0.15);

    if (gameStarted && !isGameOver && speedRef.current < currentMaxSpeed) {
      speedRef.current += 0.0000001 * (1 + (effectiveLevel - 1) * 0.1);
    }

    if (tunnelMatRef.current) {
      const speedMultiplier = (speedRef.current / BASE_MAX_SPEED) * 50;
      hueTimer.current += dt * speedMultiplier;
      const hue = 0.65 + 0.1 * Math.sin(hueTimer.current * 0.2);
      tunnelMatRef.current.color.setHSL(hue, 0.5, 0.1);
    }

    if (!gameStarted) {
      const t = time * 0.1;
      const startPoint = TRACK_CURVE.getPointAt(0.002);
      camera.position.x = startPoint.x + Math.sin(t) * 15;
      camera.position.z = startPoint.z + Math.cos(t) * 15;
      camera.position.y = startPoint.y + 10;
      camera.lookAt(startPoint);
      return;
    }

    if (!isGameOver) {
      const dist = speedRef.current * (dt * 60);
      const nextProgress = progressRef.current + dist;

      const progressPercent = Math.min(Math.floor(progressRef.current * 100), 100);
      if (progressPercent !== lastReportedProgressRef.current) {
        lastReportedProgressRef.current = progressPercent;
        onProgressUpdate(progressPercent);
      }

      if (isInfinite) {
        if (time - lastScoreTime.current > 0.1) {
          const totalScore = Math.floor((lapCountRef.current * 5000) + (progressRef.current * 5000));
          onScoreUpdate(totalScore);
          lastScoreTime.current = time;
        }
        if (nextProgress >= 0.99) {
          progressRef.current = 0.02;
          lapCountRef.current += 1;
          setCurrentLap(l => l + 1);
        } else {
          progressRef.current = nextProgress;
        }
      } else {
        if (nextProgress >= 0.998) {
          progressRef.current = 0.998;
          speedRef.current = Math.max(0, speedRef.current - dt * 0.01);
          keys.current = { left: false, right: false };
          onLevelComplete();
        } else {
          progressRef.current = nextProgress;
        }
      }

      const moveSpeed = ROTATION_SPEED * dt;
      if (keys.current.left) playerAngleRef.current -= moveSpeed;
      if (keys.current.right) playerAngleRef.current += moveSpeed;
    }

    const currentPoint = TRACK_CURVE.getPointAt(progressRef.current);
    const tangent = TRACK_CURVE.getTangentAt(progressRef.current).normalize();
    const normal = new Vector3(0, 1, 0);
    const binormal = new Vector3().crossVectors(tangent, normal).normalize();
    normal.crossVectors(binormal, tangent).normalize();

    const radialVector = binormal.clone().multiplyScalar(Math.cos(playerAngleRef.current))
      .add(normal.clone().multiplyScalar(Math.sin(playerAngleRef.current)))
      .normalize();

    const playerPos = currentPoint.clone().add(radialVector.clone().multiplyScalar(TUBE_RADIUS - 0.5));

    if (playerRef.current) {
      playerRef.current.position.copy(playerPos);

      const up = radialVector.clone().negate();
      const lookAtTarget = playerPos.clone().add(tangent);
      const matrix = new THREE.Matrix4().lookAt(playerPos, lookAtTarget, up);
      const q = new THREE.Quaternion().setFromRotationMatrix(matrix);
      playerRef.current.quaternion.slerp(q, 0.2);

      if (ballRef.current && !isGameOver) {
        const rollSpeed = speedRef.current * 20000 * dt;
        ballRef.current.rotation.x -= rollSpeed;
        const tilt = (keys.current.left ? 0.3 : 0) + (keys.current.right ? -0.3 : 0);
        ballRef.current.rotation.z = THREE.MathUtils.lerp(ballRef.current.rotation.z, tilt, dt * 5);
      }

      if (ballMeshRef.current && !isGameOver) {
        ballMeshRef.current.rotation.y += dt;
        ballMeshRef.current.rotation.z += dt * 0.5;
      }
    }

    const camUp = radialVector.clone().negate();
    const camPos = playerPos.clone()
      .add(tangent.clone().multiplyScalar(-CAMERA_DISTANCE))
      .add(camUp.clone().multiplyScalar(CAMERA_HEIGHT));

    camera.position.copy(camPos);
    camera.up.copy(camUp);
    const camTarget = playerPos.clone().add(tangent.clone().multiplyScalar(20));
    camera.lookAt(camTarget);

    if (!isGameOver) {
      obstacles.forEach(obs => {
        let distT = Math.abs(obs.t - progressRef.current);

        if (distT < COLLISION_THRESHOLD_T) {
          const pAng = (playerAngleRef.current % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          let obsAng = obs.angle;

          if (obs.type === 'spinner' || obs.type === 'double-spinner') {
            obsAng += time * (obs.rotationSpeed || 1);
          }

          const oAng = (obsAng % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          let angleDiff = Math.abs(pAng - oAng);
          if (angleDiff > Math.PI) angleDiff = (Math.PI * 2) - angleDiff;

          let hit = false;

          if (obs.type === 'ring') {
            const safeZoneHalfWidth = (obs.width / 2) * 0.95;
            if (angleDiff > safeZoneHalfWidth) hit = true;
          } else if (obs.type === 'spinner') {
            // Single bar spinner - check both ends of the bar
            let diff2 = Math.abs(pAng - ((oAng + Math.PI) % (Math.PI * 2)));
            if (diff2 > Math.PI) diff2 = (Math.PI * 2) - diff2;
            if (angleDiff < SPINNER_HIT_ANGLE || diff2 < SPINNER_HIT_ANGLE) hit = true;
          } else if (obs.type === 'double-spinner') {
            // Cross-shaped spinner - check all 4 arms
            let diff1 = angleDiff;
            let diff3 = Math.abs(pAng - ((oAng + Math.PI) % (Math.PI * 2)));
            if (diff3 > Math.PI) diff3 = (Math.PI * 2) - diff3;

            const oAng90 = (oAng + Math.PI / 2) % (Math.PI * 2);
            let diff2 = Math.abs(pAng - oAng90);
            if (diff2 > Math.PI) diff2 = (Math.PI * 2) - diff2;

            const oAng270 = (oAng + Math.PI * 1.5) % (Math.PI * 2);
            let diff4 = Math.abs(pAng - oAng270);
            if (diff4 > Math.PI) diff4 = (Math.PI * 2) - diff4;

            if (diff1 < SPINNER_HIT_ANGLE || diff2 < SPINNER_HIT_ANGLE || diff3 < SPINNER_HIT_ANGLE || diff4 < SPINNER_HIT_ANGLE) hit = true;
          } else {
            // Block obstacles
            if (angleDiff < BLOCK_HIT_ANGLE) hit = true;
          }

          if (hit) onGameOver();
        }
      });
    }
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[TRACK_CURVE, 400, TUBE_RADIUS, 12, false]} />
        <meshBasicMaterial ref={tunnelMatRef} side={THREE.DoubleSide} transparent={false} color="#050510" />
      </mesh>

      <mesh>
        <tubeGeometry args={[TRACK_CURVE, 400, TUBE_RADIUS - 0.1, 12, false]} />
        <meshBasicMaterial color={TRACK_COLOR} wireframe transparent opacity={0.3} />
      </mesh>

      {Array.from({ length: 120 }).map((_, i) => {
        const t = (i / 120);
        const pt = TRACK_CURVE.getPointAt(t);
        const tan = TRACK_CURVE.getTangentAt(t);
        const m = new THREE.Matrix4().lookAt(pt, pt.clone().add(tan), new Vector3(0, 1, 0));
        const q = new THREE.Quaternion().setFromRotationMatrix(m);
        return (
          <mesh key={i} position={pt} quaternion={q}>
            <torusGeometry args={[TUBE_RADIUS + 0.5, 0.1, 8, 32]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.2} />
          </mesh>
        )
      })}

      <group ref={playerRef} visible={gameStarted}>
        <group ref={ballRef}>
          <mesh ref={ballMeshRef}>
            <icosahedronGeometry args={[0.5, 1]} />
            <meshBasicMaterial color={isGameOver ? "#ff0000" : "#ffffff"} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.05, 8, 32]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
        </group>
      </group>

      {obstacles.map(obs => {
        const trackPoint = TRACK_CURVE.getPointAt(obs.t);
        const trackTangent = TRACK_CURVE.getTangentAt(obs.t).normalize();
        let normal = new Vector3(0, 1, 0);
        const binormal = new Vector3().crossVectors(trackTangent, normal).normalize();
        normal.crossVectors(binormal, trackTangent).normalize();
        return (
          <ObstacleMesh
            key={obs.id} data={obs} trackPoint={trackPoint} trackTangent={trackTangent}
            trackBinormal={binormal} trackNormal={normal} playerProgressRef={progressRef} paused={paused}
          />
        );
      })}
    </group>
  );
};

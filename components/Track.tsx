import React, { useMemo, useRef, useState, useEffect, memo } from 'react';
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
const SPINNER_HIT_ANGLE = 0.06; // Reduced to be less sensitive (was 0.12)
const BLOCK_HIT_ANGLE = 0.22; // Increased to catch edges (was 0.15)

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

// --- Optimization: Shared Geometries and Materials ---
const RING_GEOM = new THREE.TorusGeometry(TUBE_RADIUS + 0.5, 0.1, 8, 32);
const RING_MAT = new THREE.MeshBasicMaterial({ color: "#00ffff", transparent: true, opacity: 0.2, depthWrite: false });

const BLOCK_GEOM = new THREE.BoxGeometry(2, 2, 2);
const BLOCK_WIRE_GEOM = new THREE.BoxGeometry(2.2, 2.2, 2.2);
const BLOCK_MAT = new THREE.MeshBasicMaterial({ color: "#ff0044", toneMapped: false });
const BLOCK_WIRE_MAT = new THREE.MeshBasicMaterial({ color: "#ff0044", wireframe: true });

const OBSTACLE_RING_MAT = new THREE.MeshBasicMaterial({ color: "#ffaa00", toneMapped: false });
const SPINNER_GEOM = new THREE.CylinderGeometry(0.4, 0.4, TUBE_RADIUS * 1.95, 8);
const SPINNER_MAT = new THREE.MeshBasicMaterial({ color: "#d400ff", toneMapped: false });

const DOUBLE_SPINNER_MAT_A = new THREE.MeshBasicMaterial({ color: "#ff0000", toneMapped: false });
const DOUBLE_SPINNER_MAT_B = new THREE.MeshBasicMaterial({ color: "#00ffff", toneMapped: false });

// --- Instanced Component for Decorative Rings ---
const InstancedRings: React.FC<{ isInfinite: boolean, progress: number }> = memo(({ isInfinite, progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { matrices, count } = useMemo(() => {
    const tempMatrix = new THREE.Matrix4();
    const tempQuat = new THREE.Quaternion();

    const primaryCount = 120;
    const forwardCount = isInfinite ? 60 : 0;
    const backwardCount = (isInfinite && progress < 0.3) ? 40 : 0;
    const totalCount = primaryCount + forwardCount + backwardCount;

    const mats = new Float32Array(totalCount * 16);
    let idx = 0;

    const setMatrix = (pt: THREE.Vector3, tan: THREE.Vector3) => {
      tempMatrix.lookAt(pt, pt.clone().add(tan), new Vector3(0, 1, 0));
      tempQuat.setFromRotationMatrix(tempMatrix);
      tempMatrix.compose(pt, tempQuat, new Vector3(1, 1, 1));
      tempMatrix.toArray(mats, idx * 16);
      idx++;
    };

    for (let i = 0; i < 120; i++) {
      const t = i / 120;
      setMatrix(TRACK_CURVE.getPointAt(t), TRACK_CURVE.getTangentAt(t));
    }
    if (isInfinite) {
      for (let i = 0; i < 60; i++) {
        const t = i / 120;
        const pt = TRACK_CURVE.getPointAt(t).clone().add(new Vector3(0, 0, -2000));
        setMatrix(pt, TRACK_CURVE.getTangentAt(t));
      }
      if (progress < 0.3) {
        for (let i = 0; i < 40; i++) {
          const t = 1.0 - (i / 120);
          const pt = TRACK_CURVE.getPointAt(t).clone().add(new Vector3(0, 0, 2000));
          setMatrix(pt, TRACK_CURVE.getTangentAt(t));
        }
      }
    }

    return { matrices: mats, count: idx };
  }, [isInfinite, progress < 0.3]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.set(matrices);
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  return <instancedMesh ref={meshRef} args={[RING_GEOM, RING_MAT, count]} />;
});

// --- Obstacle Component ---
const ObstacleMesh: React.FC<{
  data: ObstacleData;
  trackPoint: Vector3;
  trackTangent: Vector3;
  trackBinormal: Vector3;
  trackNormal: Vector3;
  playerProgressRef: React.MutableRefObject<number>;
  gameTimeRef: React.MutableRefObject<number>;
  isGhost?: boolean;
}> = ({ data, trackPoint, trackTangent, trackNormal, playerProgressRef, gameTimeRef, isGhost }) => {

  const groupRef = useRef<THREE.Group>(null);
  const spinnerRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      let isVisible = true;
      if (!isGhost) {
        let dist = Math.abs(data.t - playerProgressRef.current);
        isVisible = dist < 0.15;
      } else {
        isVisible = playerProgressRef.current > 0.7;
      }
      if (groupRef.current.visible !== isVisible) {
        groupRef.current.visible = isVisible;
      }
    }

    if (spinnerRef.current && (data.type === 'spinner' || data.type === 'double-spinner')) {
      const currentRot = gameTimeRef.current * (data.rotationSpeed || 1);
      spinnerRef.current.rotation.z = data.angle + currentRot;
    }
  });

  const { centerPos, quat } = useMemo(() => {
    const cp = trackPoint.clone();
    const matrix = new THREE.Matrix4().lookAt(cp, cp.clone().add(trackTangent), trackNormal);
    const q = new THREE.Quaternion().setFromRotationMatrix(matrix);
    return { centerPos: cp, quat: q };
  }, [trackPoint, trackTangent, trackNormal]);

  return (
    <group ref={groupRef} position={centerPos} quaternion={quat}>
      {data.type === 'block' && (
        <group rotation={[0, 0, data.angle]}>
          <mesh position={[TUBE_RADIUS - 1.2, 0, 0]} geometry={BLOCK_GEOM} material={BLOCK_MAT} />
          <mesh position={[TUBE_RADIUS - 1.2, 0, 0]} geometry={BLOCK_WIRE_GEOM} material={BLOCK_WIRE_MAT} />
        </group>
      )}

      {data.type === 'ring' && (
        <group rotation={[0, 0, data.angle + (data.width / 2)]}>
          <mesh material={OBSTACLE_RING_MAT}>
            <torusGeometry args={[TUBE_RADIUS - 1, 0.8, 8, 48, (Math.PI * 2) - data.width]} />
          </mesh>
        </group>
      )}

      <group ref={spinnerRef}>
        {data.type === 'spinner' && (
          <mesh rotation={[0, 0, Math.PI / 2]} geometry={SPINNER_GEOM} material={SPINNER_MAT} />
        )}

        {data.type === 'double-spinner' && (
          <group>
            <mesh rotation={[0, 0, Math.PI / 2]} geometry={SPINNER_GEOM} material={DOUBLE_SPINNER_MAT_A} />
            <mesh rotation={[0, 0, 0]} geometry={SPINNER_GEOM} material={DOUBLE_SPINNER_MAT_B} />
            <mesh>
              <sphereGeometry args={[0.8]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};


export const Track: React.FC<TrackProps> = memo(({ gameStarted, isGameOver, level, isInfinite, paused, isSwipeControl, onGameOver, onLevelComplete, onScoreUpdate, onProgressUpdate }) => {
  const { camera } = useThree();

  // Game Logic Refs
  const progressRef = useRef(0.002);
  const playerAngleRef = useRef(-Math.PI / 2);
  const lapCountRef = useRef(0);
  const [currentLap, setCurrentLap] = useState(0);
  const lastReportedProgressRef = useRef(0);
  const gameTimeRef = useRef(0);
  const currentScoreRef = useRef(0);
  const lastScoreTime = useRef(0);

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

  // Reset logic
  useEffect(() => {
    speedRef.current = BASE_START_SPEED * (1 + (level - 1) * 0.1);
    playerAngleRef.current = -Math.PI / 2;
    progressRef.current = 0.002;
    hueTimer.current = 0;
    gameTimeRef.current = 0;
    currentScoreRef.current = 0;
    lastScoreTime.current = 0;
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

    // UPDATE GAME TIME
    gameTimeRef.current += dt;
    const time = gameTimeRef.current; // Use synced time

    const effectiveLevel = isInfinite ? Math.min(8, Math.floor(lapCountRef.current / 2) + 1) : level;
    const currentMaxSpeed = BASE_MAX_SPEED * (1 + (effectiveLevel - 1) * 0.15);

    if (gameStarted && !isGameOver && speedRef.current < currentMaxSpeed) {
      speedRef.current += 0.0000003 * (1 + (effectiveLevel - 1) * 0.1);
    }

    if (tunnelMatRef.current) {
      const speedMultiplier = (speedRef.current / BASE_MAX_SPEED) * 50;
      hueTimer.current += dt * speedMultiplier;
      const hue = 0.65 + 0.1 * Math.sin(hueTimer.current * 0.2);
      tunnelMatRef.current.color.setHSL(hue, 0.5, 0.1);
    }

    if (!gameStarted) {
      const t = state.clock.getElapsedTime() * 0.1; // Idle anim uses real time
      const startPoint = TRACK_CURVE.getPointAt(0.002);
      camera.position.x = startPoint.x + Math.sin(t) * 15;
      camera.position.z = startPoint.z + Math.cos(t) * 15;
      camera.position.y = startPoint.y + 10;
      camera.lookAt(startPoint);
      return;
    }

    if (!isGameOver) {
      const dist = speedRef.current * (dt * 60);
      const lastProgress = progressRef.current;
      const nextProgress = progressRef.current + dist;

      const progressPercent = Math.min(Math.floor(progressRef.current * 100), 100);
      if (progressPercent !== lastReportedProgressRef.current) {
        lastReportedProgressRef.current = progressPercent;
        onProgressUpdate(progressPercent);
      }

      if (isInfinite) {
        // --- BALANCED PARABOLIC SCORING ---
        // Stats: Start ~1.5 pts/sec, Max ~15 pts/sec
        const speedFactor = speedRef.current * 1000;
        const scoreIncrement = (speedFactor * speedFactor) * (dt * 15);
        currentScoreRef.current += scoreIncrement;

        if (time - lastScoreTime.current > 0.1) {
          onScoreUpdate(Math.floor(currentScoreRef.current));
          lastScoreTime.current = time;
        }

        // --- SEAMLESS MATH WRAPPING ---
        if (nextProgress >= 1.0) {
          progressRef.current = nextProgress % 1.0;
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

      // Store nextProgress for collision range check
      (state as any).nextProgress = nextProgress;
      (state as any).lastProgress = lastProgress;
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
      // Frame-rate independent smoothing
      const rotateSpeed = 1 - Math.pow(0.0001, dt);
      playerRef.current.quaternion.slerp(q, rotateSpeed);

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
    const targetCamPos = playerPos.clone()
      .add(tangent.clone().multiplyScalar(-CAMERA_DISTANCE))
      .add(camUp.clone().multiplyScalar(CAMERA_HEIGHT));
    const targetLookAt = playerPos.clone().add(tangent.clone().multiplyScalar(20));

    // POSITION: Hard-lock (Direct Response)
    camera.position.copy(targetCamPos);
    camera.up.copy(camUp);

    // LOOK-AT: Subtle Smoothing (Zero-jitter filter)
    if (!camera.userData.currentLookAt) camera.userData.currentLookAt = targetLookAt.clone();

    if (camera.userData.currentLookAt.distanceTo(targetLookAt) > 100) {
      camera.userData.currentLookAt.copy(targetLookAt);
    } else {
      camera.userData.currentLookAt.lerp(targetLookAt, 0.5);
    }
    camera.lookAt(camera.userData.currentLookAt);

    if (!isGameOver) {
      const lastP = (state as any).lastProgress || progressRef.current;
      const nextP = (state as any).nextProgress || progressRef.current;

      obstacles.forEach(obs => {
        // Player's "body" length on the T-axis (approx 0.0006 for 2000 units track)
        const playerBuffer = 0.0006;
        let hitInRange = false;

        if (isInfinite && nextP >= 1.0) {
          // Cross-seam collision check
          hitInRange = (obs.t >= lastP - playerBuffer) || (obs.t <= (nextP % 1.0) + playerBuffer);
        } else {
          // Standard range collision check
          hitInRange = (obs.t >= lastP - playerBuffer && obs.t <= nextP + playerBuffer);
        }

        if (hitInRange) {
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
            let diff2 = Math.abs(pAng - ((oAng + Math.PI) % (Math.PI * 2)));
            if (diff2 > Math.PI) diff2 = (Math.PI * 2) - diff2;
            if (angleDiff < SPINNER_HIT_ANGLE || diff2 < SPINNER_HIT_ANGLE) hit = true;
          } else if (obs.type === 'double-spinner') {
            let diff1 = angleDiff;
            let diff3 = Math.abs(pAng - ((oAng + Math.PI) % (Math.PI * 2)));
            if (diff3 > Math.PI) diff3 = (Math.PI * 2) - diff3;
            const oAng90 = (oAng + Math.PI / 2) % (Math.PI * 2);
            let diff2 = Math.abs(pAng - oAng90);
            if (diff2 > Math.PI) diff2 = (Math.PI * 2) - diff2;
            const oAng270 = (oAng + Math.PI * 1.5) % (Math.PI * 2);
            let diff4 = Math.abs(pAng - oAng270);
            if (diff4 > Math.PI) diff4 = (Math.PI * 2) - diff4;
            if (diff1 < SPINNER_HIT_ANGLE * 0.7 || diff2 < SPINNER_HIT_ANGLE * 0.7 || diff3 < SPINNER_HIT_ANGLE * 0.7 || diff4 < SPINNER_HIT_ANGLE * 0.7) hit = true;
          } else {
            if (angleDiff < BLOCK_HIT_ANGLE) hit = true;
          }
          if (hit) onGameOver();
        }
      });
    }
  });

  return (
    <group>
      {/* PRIMARY TRACK (Current Loop) */}
      <mesh>
        <tubeGeometry args={[TRACK_CURVE, 250, TUBE_RADIUS, 12, false]} />
        <meshBasicMaterial ref={tunnelMatRef} side={THREE.DoubleSide} transparent={false} color="#050510" />
      </mesh>
      <mesh>
        <tubeGeometry args={[TRACK_CURVE, 250, TUBE_RADIUS - 0.1, 12, false]} />
        <meshBasicMaterial color={TRACK_COLOR} wireframe transparent opacity={0.3} />
      </mesh>

      {/* SECONDARY TRACK (Next Loop Preview - Seamless Transition) */}
      {/* We position a clone of the track exactly at the end of the current one to hide the seam */}
      {/* SEAMLESS LOOP PREVIEWS (Forward/Backward) */}
      {isInfinite && (
        <>
          {/* LOOK-AHEAD: The next loop starts where this one ends (Z = -2000) */}
          <group position={[0, 0, -2000]}>
            <mesh>
              <tubeGeometry args={[TRACK_CURVE, 250, TUBE_RADIUS, 12, false]} />
              <meshBasicMaterial side={THREE.DoubleSide} transparent={false} color="#050510" />
            </mesh>
            <mesh>
              <tubeGeometry args={[TRACK_CURVE, 250, TUBE_RADIUS - 0.1, 12, false]} />
              <meshBasicMaterial color={TRACK_COLOR} wireframe transparent opacity={0.3} />
            </mesh>
          </group>

          {/* LOOK-BEHIND: If we are near the start, show the end of the previous loop behind us (Z = +2000) */}
          {progressRef.current < 0.3 && (
            <group position={[0, 0, 2000]}>
              <mesh>
                <tubeGeometry args={[TRACK_CURVE, 250, TUBE_RADIUS, 12, false]} />
                <meshBasicMaterial side={THREE.DoubleSide} transparent={false} color="#050510" />
              </mesh>
              <mesh>
                <tubeGeometry args={[TRACK_CURVE, 250, TUBE_RADIUS - 0.1, 12, false]} />
                <meshBasicMaterial color={TRACK_COLOR} wireframe transparent opacity={0.3} />
              </mesh>
            </group>
          )}
        </>
      )}

      {/* DECORATIONS (Rings) - Now using InstancedMesh for 120x performance boost */}
      <InstancedRings isInfinite={isInfinite} progress={progressRef.current} />

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

        // Visual Instancing for Infinite Mode Loop Seam
        // If obstacle is near the start (t < 0.2), render a copy at the END of the track
        // so the player sees it coming before the loop resets.
        const renderGhostForward = isInfinite && obs.t < 0.2;
        const renderGhostBackward = isInfinite && obs.t > 0.8;

        return (
          <React.Fragment key={obs.id}>
            <ObstacleMesh
              data={obs} trackPoint={trackPoint} trackTangent={trackTangent}
              trackBinormal={binormal} trackNormal={normal} playerProgressRef={progressRef} gameTimeRef={gameTimeRef}
            />
            {renderGhostForward && (
              <ObstacleMesh
                data={{ ...obs, id: `${obs.id}-ghost-fwd` }}
                trackPoint={trackPoint.clone().add(new Vector3(0, 0, -2000))}
                trackTangent={trackTangent}
                trackBinormal={binormal}
                trackNormal={normal}
                playerProgressRef={progressRef}
                gameTimeRef={gameTimeRef}
                isGhost={true}
              />
            )}
            {renderGhostBackward && (
              <ObstacleMesh
                data={{ ...obs, id: `${obs.id}-ghost-back` }}
                trackPoint={trackPoint.clone().add(new Vector3(0, 0, 2000))}
                trackTangent={trackTangent}
                trackBinormal={binormal}
                trackNormal={normal}
                playerProgressRef={progressRef}
                gameTimeRef={gameTimeRef}
                isGhost={true}
              />
            )}

          </React.Fragment>
        );
      })}
    </group>
  );
});

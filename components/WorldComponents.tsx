
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GRID_COLOR } from '../constants';
import '../types';

export const SynthwaveSun: React.FC<{ isInfinite?: boolean }> = ({ isInfinite }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Classic Retro Sun Shader (Yellow -> Pink with Black Stripes)
    const shaderArgs = useMemo(() => ({
        uniforms: {
            colorTop: { value: new THREE.Color("#ffd700") }, // Bright Gold
            colorBottom: { value: new THREE.Color("#ff0055") } // Deep Pink
        },
        vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
        fragmentShader: `
        uniform vec3 colorTop;
        uniform vec3 colorBottom;
        varying vec2 vUv;
        void main() {
            vec3 color = mix(colorBottom, colorTop, vUv.y);
            float y = vUv.y;
            float show = 1.0;
            if (y < 0.5) {
                float freq = 20.0 + (0.5 - y) * 40.0; 
                float sineVal = sin(y * freq);
                float cutThickness = 0.3 - (y * 0.5); 
                if (sineVal > cutThickness) show = 1.0; else show = 0.0;
            }
            if (show < 0.1) discard;
            gl_FragColor = vec4(color, 1.0);
        }
    `
    }), []);

    // Simple Sprite Glow for atmospheric bloom (Artifact-free)
    const glowTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            gradient.addColorStop(0, 'rgba(255, 100, 50, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 0, 100, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);
        }
        return new THREE.CanvasTexture(canvas);
    }, []);

    useFrame((state) => {
        if (isInfinite && groupRef.current) {
            // In infinite mode, the sun stays at a constant distance ahead of the camera
            groupRef.current.position.z = state.camera.position.z - 1200;
        }
    });

    return (
        <group ref={groupRef} position={[0, 100, -2500]}>
            <mesh scale={[350, 350, 350]}>
                <sphereGeometry args={[1, 32, 32]} />
                <shaderMaterial args={[shaderArgs]} fog={false} side={THREE.DoubleSide} transparent />
            </mesh>

            <sprite position={[0, 0, -50]} scale={[isInfinite ? 1300 : 1000, isInfinite ? 1300 : 1000, 1]}>
                <spriteMaterial map={glowTexture} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
            </sprite>

            <pointLight intensity={isInfinite ? 3.0 : 2.0} distance={isInfinite ? 5000 : 4000} decay={2} color="#ff5500" />
        </group>
    );
};

export const NeonGrid: React.FC = () => {
    const gridRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (gridRef.current) {
            // Scroll the grid towards the camera to simulate forward movement
            gridRef.current.position.z = (state.clock.getElapsedTime() * 60) % 200;
        }
    });

    return (
        <group position={[0, -200, 0]}>
            <group ref={gridRef}>
                <gridHelper args={[6000, 200, GRID_COLOR, '#2a0a2a']} position={[0, 0, 0]} />
            </group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                <planeGeometry args={[6000, 6000]} />
                <meshStandardMaterial
                    color="#050510"
                    roughness={0.1}
                    metalness={0.8}
                />
            </mesh>
        </group>
    );
};

export const StarField: React.FC = () => {
    const stars = useMemo(() => {
        const temp = [];
        // OPTIMIZATION: Reduced to 800 for better Android performance
        for (let i = 0; i < 800; i++) {
            const x = (Math.random() - 0.5) * 6000;
            const y = (Math.random() - 0.5) * 6000;
            const z = (Math.random() - 0.5) * 6000;
            temp.push(x, y, z);
        }
        return new Float32Array(temp);
    }, []);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={stars.length / 3}
                    array={stars}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={4} color="#ffffff" transparent opacity={0.6} sizeAttenuation={false} fog={false} />
        </points>
    )
}

// --- RETRO ARTIFACTS (Fully Instanced) ---

// Shared geometries
const BOX_GEOM = new THREE.BoxGeometry(1, 1, 1);
const PLANE_GEOM = new THREE.PlaneGeometry(1, 1);
const CIRCLE_GEOM = new THREE.CircleGeometry(1, 16);
const TETRA_GEOM = new THREE.TetrahedronGeometry(1, 0);

// Shared materials
const DARK_MAT = new THREE.MeshBasicMaterial({ color: '#1a1a1a' });
const FLOPPY_MAT = new THREE.MeshBasicMaterial({ color: '#220044' });
const CAR_MAT = new THREE.MeshBasicMaterial({ color: '#ff00cc' });
const GLASS_MAT = new THREE.MeshBasicMaterial({ color: '#00ffff', transparent: true, opacity: 0.6 });
const WHEEL_MAT = new THREE.MeshBasicMaterial({ color: '#000000' });
const LABEL_MAT = new THREE.MeshBasicMaterial({ color: '#e0e0e0' });
const WHITE_MAT = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const WIRE_CYAN_MAT = new THREE.MeshBasicMaterial({ color: '#00ffcc', wireframe: true });

// Helpers
const _m4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scl = new THREE.Vector3();

function setMatrix(
    out: THREE.Matrix4,
    x: number, y: number, z: number,
    rx: number, ry: number, rz: number,
    sx: number, sy: number, sz: number
) {
    _pos.set(x, y, z);
    _quat.setFromEuler(new THREE.Euler(rx, ry, rz));
    _scl.set(sx, sy, sz);
    out.compose(_pos, _quat, _scl);
}

/** One InstancedMesh wrapper that syncs matrices once */
const Instanced: React.FC<{
    geom: THREE.BufferGeometry;
    mat: THREE.Material;
    matrices: THREE.Matrix4[];
}> = ({ geom, mat, matrices }) => {
    const ref = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        if (!ref.current) return;
        matrices.forEach((m, i) => ref.current!.setMatrixAt(i, m));
        ref.current.instanceMatrix.needsUpdate = true;
    }, []); // Only set once — these never move
    return <instancedMesh ref={ref} args={[geom, mat, matrices.length]} />;
};

export const RetroArtifacts: React.FC = () => {
    // Build matrix lists per bucket once
    const buckets = useMemo(() => {
        // Each artifact has a world transform (pos, rot, scale) and a type 0-3
        const artifacts: { pos: THREE.Vector3; rot: THREE.Euler; scale: number; type: number }[] = [];
        for (let i = 0; i < 60; i++) {
            const z = 400 - Math.random() * 1400;
            let x = (Math.random() - 0.5) * 600;
            if (Math.abs(x) < 40) x = 60 * Math.sign(x || 1);
            let y = (Math.random() - 0.5) * 400;
            if (Math.abs(y) < 30) y = 50 * Math.sign(y || 1);
            const type = Math.floor(Math.random() * 4);
            const rot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            const scale = type === 2 ? 5 : 6;
            artifacts.push({ pos: new THREE.Vector3(x, y, z), rot, scale, type });
        }

        // --- Buckets: darkBox, floppyBox, labelPlane, whitePlane, circleLabel, carBody, glass, wheel, pyramid
        const darkBox: THREE.Matrix4[] = [];
        const floppyBox: THREE.Matrix4[] = [];
        const labelPlane: THREE.Matrix4[] = [];
        const whitePlane: THREE.Matrix4[] = [];
        const circleLabel: THREE.Matrix4[] = [];
        const carBody: THREE.Matrix4[] = [];
        const glass: THREE.Matrix4[] = [];
        const wheel: THREE.Matrix4[] = [];
        const pyramid: THREE.Matrix4[] = [];

        const tmpParent = new THREE.Matrix4();
        const tmpLocal = new THREE.Matrix4();
        const tmpResult = new THREE.Matrix4();

        const addWorld = (
            bucket: THREE.Matrix4[],
            parentPos: THREE.Vector3, parentRot: THREE.Euler, parentScale: number,
            lx: number, ly: number, lz: number,
            lrx: number, lry: number, lrz: number,
            lsx: number, lsy: number, lsz: number
        ) => {
            setMatrix(tmpParent, parentPos.x, parentPos.y, parentPos.z, parentRot.x, parentRot.y, parentRot.z, parentScale, parentScale, parentScale);
            setMatrix(tmpLocal, lx, ly, lz, lrx, lry, lrz, lsx, lsy, lsz);
            tmpResult.multiplyMatrices(tmpParent, tmpLocal);
            bucket.push(tmpResult.clone());
        };

        for (const a of artifacts) {
            const { pos, rot, scale, type } = a;
            if (type === 0) {
                // VHS: dark body + label (plane) + 2 circles
                addWorld(darkBox, pos, rot, scale, 0, 0, 0, 0, 0, 0, 1.8, 1.0, 0.3);
                addWorld(labelPlane, pos, rot, scale, 0, 0.1, 0.16, 0, 0, 0, 1.4, 0.6, 1);
                addWorld(circleLabel, pos, rot, scale, -0.45, -0.1, 0.17, 0, 0, 0, 0.15, 0.15, 1);
                addWorld(circleLabel, pos, rot, scale, 0.45, -0.1, 0.17, 0, 0, 0, 0.15, 0.15, 1);
            } else if (type === 1) {
                // Floppy: purple body + label + white strip
                addWorld(floppyBox, pos, rot, scale, 0, 0, 0, 0, 0, 0, 1.4, 1.4, 0.1);
                addWorld(labelPlane, pos, rot, scale, 0, 0.4, 0.06, 0, 0, 0, 0.8, 0.5, 1);
                addWorld(whitePlane, pos, rot, scale, 0, -0.3, 0.06, 0, 0, 0, 1.0, 0.4, 1);
            } else if (type === 2) {
                // Retro Car: body + windscreen + 4 wheels
                const carRot = new THREE.Euler(rot.x, rot.y - Math.PI / 2, rot.z);
                addWorld(carBody, pos, carRot, scale, 0, 0, 0, 0, 0, 0, 2.5, 0.6, 1.1);
                addWorld(glass, pos, carRot, scale, -0.2, 0.4, 0, 0, 0, 0, 1.2, 0.5, 0.9);
                addWorld(wheel, pos, carRot, scale, 0.7, -0.3, 0.5, 0, 0, 0, 0.4, 0.4, 0.2);
                addWorld(wheel, pos, carRot, scale, -0.7, -0.3, 0.5, 0, 0, 0, 0.4, 0.4, 0.2);
                addWorld(wheel, pos, carRot, scale, 0.7, -0.3, -0.5, 0, 0, 0, 0.4, 0.4, 0.2);
                addWorld(wheel, pos, carRot, scale, -0.7, -0.3, -0.5, 0, 0, 0, 0.4, 0.4, 0.2);
            } else {
                // Pyramid wireframe
                const pyRot = new THREE.Euler(rot.x + Math.PI / 4, rot.y, rot.z + Math.PI / 4);
                addWorld(pyramid, pos, pyRot, scale, 0, 0, 0, 0, 0, 0, 1, 1, 1);
            }
        }

        return { darkBox, floppyBox, labelPlane, whitePlane, circleLabel, carBody, glass, wheel, pyramid };
    }, []);

    return (
        <group>
            {buckets.darkBox.length > 0 && <Instanced geom={BOX_GEOM} mat={DARK_MAT} matrices={buckets.darkBox} />}
            {buckets.floppyBox.length > 0 && <Instanced geom={BOX_GEOM} mat={FLOPPY_MAT} matrices={buckets.floppyBox} />}
            {buckets.labelPlane.length > 0 && <Instanced geom={PLANE_GEOM} mat={LABEL_MAT} matrices={buckets.labelPlane} />}
            {buckets.whitePlane.length > 0 && <Instanced geom={PLANE_GEOM} mat={WHITE_MAT} matrices={buckets.whitePlane} />}
            {buckets.circleLabel.length > 0 && <Instanced geom={CIRCLE_GEOM} mat={LABEL_MAT} matrices={buckets.circleLabel} />}
            {buckets.carBody.length > 0 && <Instanced geom={BOX_GEOM} mat={CAR_MAT} matrices={buckets.carBody} />}
            {buckets.glass.length > 0 && <Instanced geom={BOX_GEOM} mat={GLASS_MAT} matrices={buckets.glass} />}
            {buckets.wheel.length > 0 && <Instanced geom={BOX_GEOM} mat={WHEEL_MAT} matrices={buckets.wheel} />}
            {buckets.pyramid.length > 0 && <Instanced geom={TETRA_GEOM} mat={WIRE_CYAN_MAT} matrices={buckets.pyramid} />}
        </group>
    );
};


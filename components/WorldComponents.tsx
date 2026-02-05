
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GRID_COLOR } from '../constants';
import '../types';

export const SynthwaveSun: React.FC = () => {
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
            // Gradient: Yellow top, Pink bottom
            vec3 color = mix(colorBottom, colorTop, vUv.y);
            
            // Retro Blinds / Stripes Logic
            float y = vUv.y;
            float show = 1.0;
            
            // Only apply stripes to the lower half
            if (y < 0.5) {
                // Frequency increases towards the bottom (perspective effect)
                float freq = 20.0 + (0.5 - y) * 40.0; 
                float sineVal = sin(y * freq);
                
                // Cutout threshold - thicker cuts at the bottom
                float cutThickness = 0.3 - (y * 0.5); 
                
                if (sineVal > cutThickness) {
                    show = 1.0;
                } else {
                    show = 0.0;
                }
            }
            
            // Discard black stripes to let the dark sky show through (classic silhouette look)
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
        gradient.addColorStop(0, 'rgba(255, 100, 50, 0.8)'); // Orange core
        gradient.addColorStop(0.5, 'rgba(255, 0, 100, 0.2)'); // Pink halo
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group position={[0, 100, -1000]}> {/* Position matches END_Z */}
        
        {/* The Sun Sphere */}
        <mesh scale={[350, 350, 350]}>
            <sphereGeometry args={[1, 64, 64]} />
            <shaderMaterial args={[shaderArgs]} fog={false} side={THREE.DoubleSide} transparent />
        </mesh>
        
        {/* Atmospheric Glow Sprite behind the sun */}
        <sprite position={[0, 0, -50]} scale={[1000, 1000, 1]}>
             <spriteMaterial map={glowTexture} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
        </sprite>

        {/* Central Light Source */}
        <pointLight intensity={2.0} distance={4000} decay={2} color="#ff5500" />
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
        // OPTIMIZATION: Reduced from 6000 to 1500 for Android performance
        for(let i=0; i<1500; i++) {
            const x = (Math.random() - 0.5) * 6000;
            const y = (Math.random() - 0.5) * 6000;
            const z = (Math.random() - 0.5) * 6000;
            temp.push(x,y,z);
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

// --- RETRO ARTIFACTS (Replaces FloatingDebris) ---

export const RetroArtifacts: React.FC = () => {
    const items = useMemo(() => {
        const temp = [];
        for(let i=0; i<60; i++) {
            // Linear scatter along the track Z-axis
            const z = 400 - (Math.random() * 1400); 
            
            // Keep them somewhat away from the tunnel center (radius ~10)
            let x = (Math.random() - 0.5) * 600; 
            if (Math.abs(x) < 40) x = 60 * Math.sign(x || 1);
            
            let y = (Math.random() - 0.5) * 400;
            if (Math.abs(y) < 30) y = 50 * Math.sign(y || 1);

            const type = Math.floor(Math.random() * 4); // 0: VHS, 1: Floppy, 2: Car, 3: Pyramid
            
            // Random rotation
            const rot = new THREE.Euler(
                Math.random() * Math.PI, 
                Math.random() * Math.PI, 
                Math.random() * Math.PI
            );
            
            // Scale varies by type
            const scale = type === 2 ? 5 : 6; 

            temp.push({ pos: new THREE.Vector3(x, y, z), rot, scale, type });
        }
        return temp;
    }, []);

    return (
        <group>
            {items.map((item, i) => (
                <ArtifactItem key={i} {...item} />
            ))}
        </group>
    )
}

const ArtifactItem: React.FC<any> = ({ pos, rot, scale, type }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            // Gentle floating rotation
            ref.current.rotation.x += delta * 0.1;
            ref.current.rotation.y += delta * 0.2;
            
            // Bobbing motion
            ref.current.position.y += Math.sin(state.clock.elapsedTime + pos.x) * 0.05;
        }
    });

    return (
        <group ref={ref} position={pos} rotation={rot} scale={[scale, scale, scale]}>
            {type === 0 && <VHSGeometry />}
            {type === 1 && <FloppyGeometry />}
            {type === 2 && <RetroCarGeometry />}
            {type === 3 && <SynthPyramidGeometry />}
        </group>
    )
}

// -- Low Poly Retro Geometries --

const VHSGeometry = () => (
    <group>
        <mesh>
            <boxGeometry args={[1.8, 1.0, 0.3]} />
            {/* OPTIMIZATION: MeshBasicMaterial */}
            <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        {/* Label Area */}
        <mesh position={[0, 0.1, 0.16]}>
            <planeGeometry args={[1.4, 0.6]} />
            <meshBasicMaterial color="#e0e0e0" />
        </mesh>
        {/* Reel Holes */}
        <mesh position={[-0.45, -0.1, 0.17]}>
            <circleGeometry args={[0.15, 16]} />
            <meshBasicMaterial color="#eee" />
        </mesh>
        <mesh position={[0.45, -0.1, 0.17]}>
            <circleGeometry args={[0.15, 16]} />
            <meshBasicMaterial color="#eee" />
        </mesh>
    </group>
)

const FloppyGeometry = () => (
    <group>
        <mesh>
            <boxGeometry args={[1.4, 1.4, 0.1]} />
            {/* OPTIMIZATION: MeshBasicMaterial */}
            <meshBasicMaterial color="#220044" />
        </mesh>
        {/* Metal Shutter */}
        <mesh position={[0, 0.4, 0.06]}>
             <planeGeometry args={[0.8, 0.5]} />
             {/* OPTIMIZATION: MeshBasicMaterial */}
             <meshBasicMaterial color="#aaaaaa" />
        </mesh>
        {/* Label */}
        <mesh position={[0, -0.3, 0.06]}>
             <planeGeometry args={[1.0, 0.4]} />
             <meshBasicMaterial color="#ffffff" />
        </mesh>
    </group>
)

const RetroCarGeometry = () => (
    <group rotation={[0, -Math.PI/2, 0]}>
         {/* Main Body (Wedge shape approximated) */}
         <mesh position={[0, 0, 0]}>
             <boxGeometry args={[2.5, 0.6, 1.1]} />
             {/* OPTIMIZATION: MeshBasicMaterial */}
             <meshBasicMaterial color="#ff00cc" />
         </mesh>
         {/* Cabin */}
         <mesh position={[-0.2, 0.4, 0]}>
             <boxGeometry args={[1.2, 0.5, 0.9]} />
             <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
         </mesh>
         {/* Wheels (Abstract Cubes) */}
         <mesh position={[0.7, -0.3, 0.5]}>
             <boxGeometry args={[0.4, 0.4, 0.2]} />
             <meshBasicMaterial color="#000" />
         </mesh>
         <mesh position={[-0.7, -0.3, 0.5]}>
             <boxGeometry args={[0.4, 0.4, 0.2]} />
             <meshBasicMaterial color="#000" />
         </mesh>
         <mesh position={[0.7, -0.3, -0.5]}>
             <boxGeometry args={[0.4, 0.4, 0.2]} />
             <meshBasicMaterial color="#000" />
         </mesh>
         <mesh position={[-0.7, -0.3, -0.5]}>
             <boxGeometry args={[0.4, 0.4, 0.2]} />
             <meshBasicMaterial color="#000" />
         </mesh>
    </group>
)

const SynthPyramidGeometry = () => (
    <mesh>
        <tetrahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#00ffcc" wireframe />
    </mesh>
)

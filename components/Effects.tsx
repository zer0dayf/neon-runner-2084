
import React from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export const Effects: React.FC = () => {
  return (
    <EffectComposer>
      {/* OPTIMIZATION: Removed Noise, Vignette, Scanline, ChromaticAberration */}
      {/* Glowing Neon - Essential for visual style */}
      <Bloom 
        luminanceThreshold={0.2} 
        luminanceSmoothing={0.9} 
        height={300} 
        intensity={1.5} 
      />
    </EffectComposer>
  );
};

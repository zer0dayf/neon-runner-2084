
import React from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export const Effects: React.FC = () => {
  return (
    <EffectComposer>
      {/* OPTIMIZATION: Reduced resolution and intensity for mobile */}
      <Bloom
        luminanceThreshold={0.25}
        luminanceSmoothing={0.9}
        height={200}
        intensity={1.2}
      />
    </EffectComposer>
  );
};

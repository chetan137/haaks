import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

function FireParticles({ count = 2000 }) {
  const ref = useRef();
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Create fire-like positions
      const x = (Math.random() - 0.5) * 4;
      const y = Math.random() * 2 - 1;
      const z = (Math.random() - 0.5) * 4;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Fire colors - mix of orange and gold
      const fireIntensity = Math.random();
      if (fireIntensity > 0.7) {
        // Gold
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 0.84; // G
        colors[i * 3 + 2] = 0.0;  // B
      } else if (fireIntensity > 0.3) {
        // Orange
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 0.55; // G
        colors[i * 3 + 2] = 0.0;  // B
      } else {
        // Dark orange
        colors[i * 3] = 0.8;     // R
        colors[i * 3 + 1] = 0.3;  // G
        colors[i * 3 + 2] = 0.0;  // B
      }

      scales[i] = Math.random() * 0.5 + 0.5;
    }

    return { positions, colors, scales };
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime;
      ref.current.rotation.y = time * 0.1;

      // Animate fire particles
      const positions = ref.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.002; // Y movement
        positions[i * 3] += Math.cos(time + i * 0.05) * 0.001;    // X movement
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={2} // Additive blending for fire effect
      />
    </points>
  );
}

export default FireParticles;
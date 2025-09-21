import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import FireParticles from './FireEffect';
import PulsingOrb from './PulsingOrb';

function AnimatedParticles(props) {
  const ref = useRef();
  const [sphere] = useMemo(() => [random.inSphere(new Float32Array(5000), { radius: 1.5 })], []);

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#FF8C00"
          size={0.008}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function FloatingOrbs() {
  const orbsRef = useRef();

  useFrame((state) => {
    if (orbsRef.current) {
      orbsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      orbsRef.current.children.forEach((orb, i) => {
        orb.position.y = Math.sin(state.clock.elapsedTime + i) * 0.5;
        orb.rotation.z = state.clock.elapsedTime * (i % 2 === 0 ? 1 : -1) * 0.2;
      });
    }
  });

  return (
    <group ref={orbsRef}>
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[Math.sin(i) * 3, 0, Math.cos(i) * 3]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#FF8C00" : "#FFD700"}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

function WaveGeometry() {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]} scale={[4, 4, 1]}>
      <planeGeometry args={[1, 1, 64, 64]} />
      <meshBasicMaterial
        color="#FF8C00"
        transparent
        opacity={0.2}
        wireframe
      />
    </mesh>
  );
}

const ThreeBackground = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      background: 'linear-gradient(135deg, #111111 0%, #FF8C00 50%, #FFD700 100%)'
    }}>
      <Canvas
        camera={{
          position: [0, 0, 1],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <AnimatedParticles />
        <FireParticles count={1500} />
        <FloatingOrbs />
        <WaveGeometry />

        {/* Pulsing orbs for extra dynamism */}
        <PulsingOrb position={[-3, 1, -1]} color="#FF8C00" size={0.3} />
        <PulsingOrb position={[3, -1, -1]} color="#FFD700" size={0.4} />
        <PulsingOrb position={[0, 2, -2]} color="#FF8C00" size={0.2} />
        <PulsingOrb position={[-2, -2, 0]} color="#FFD700" size={0.3} />

        {/* Additional ambient lighting for better visibility */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[0, 0, 5]} intensity={0.5} />
      </Canvas>
    </div>
  );
};

export default ThreeBackground;
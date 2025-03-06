import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, PresentationControls } from '@react-three/drei';
import { Group } from 'three';

// External URL for the 3D model
const MODEL_URL = 'https://storage.googleapis.com/kgbakerycakes/tripo_pbr_model_532ee32e-967c-4ffd-a7ac-24e1ba184831.glb';

interface ModelProps {
  scale?: number;
  rotationSpeed?: number;
}

export default function Model3D({ 
  scale = 1.5, 
  rotationSpeed = 0.008 
}: ModelProps) {
  const modelRef = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  
  // Apply rotation animation to the model
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <PresentationControls
      global
      snap
      rotation={[0, 0, 0]}
      polar={[-Math.PI / 4, Math.PI / 4]}
      azimuth={[-Math.PI / 4, Math.PI / 4]}
    >
      <group ref={modelRef} scale={[scale, scale, scale]}>
        <primitive object={scene.clone()} />
      </group>
    </PresentationControls>
  );
}

// Preload the model to improve performance
useGLTF.preload(MODEL_URL); 
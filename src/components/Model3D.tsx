import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Component props type
interface Model3DProps {
  scale?: number;
  rotationSpeed?: number;
  productId: number;
}

// Define the Google Cloud Storage bucket URL
const GCS_URL = 'https://storage.googleapis.com/kgbakerycakes';

export default function Model3D({ scale = 1, rotationSpeed = 0.01, productId }: Model3DProps) {
  // Use a reference to the mesh to manipulate it in the render loop
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Load the model - we're using a single model for demo purposes
  // In production, you'd load different models based on productId
  const modelPath = `${GCS_URL}/cake_model_2.glb`;
  const { scene } = useGLTF(modelPath);
  
  // Access the camera to adjust its position
  const { camera } = useThree();
  
  // Set camera position on component mount - zoom out for a better view
  useEffect(() => {
    // Zoom out further by increasing the z position
    camera.position.z = 3.5;
    // Slightly adjust the camera angle for a better view
    camera.position.y = 0.5;
  }, [camera]);
  
  // Rotate the model in the animation loop
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
    }
  });
  
  // Clone the scene to ensure each model instance is independent
  const clonedScene = scene.clone();
  
  return (
    <mesh ref={meshRef} scale={[scale, scale, scale]}>
      <primitive object={clonedScene} dispose={null} />
    </mesh>
  );
} 
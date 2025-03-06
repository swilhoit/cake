import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Component props type
interface Model3DProps {
  scale?: number;
  rotationSpeed?: number;
  productId: number;
  isDetailView?: boolean;
}

// Define the Google Cloud Storage bucket URL
const GCS_URL = 'https://storage.googleapis.com/kgbakerycakes';

// Function to check if the device is low-end (likely mobile)
const isLowEndDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if it's a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // If on mobile, we'll consider it a low-end device for 3D rendering
  return isMobile;
};

export default function Model3D({ scale = 1, rotationSpeed = 0.01, productId, isDetailView = false }: Model3DProps) {
  // Use a reference to the mesh to manipulate it in the render loop
  const meshRef = useRef<THREE.Mesh>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const lowEndDevice = isLowEndDevice();
  
  // Simplify the model scale and rotation speed for low-end devices
  const finalScale = lowEndDevice ? scale * 0.8 : scale;
  const finalRotationSpeed = lowEndDevice ? rotationSpeed * 0.5 : rotationSpeed;
  
  // Load the model - we're using a single model for demo purposes
  // In production, you'd use productId to select different models
  // For now, we'll use it to add a tiny variation to the rotation speed for each model
  const adjustedRotationSpeed = finalRotationSpeed * (1 + (productId % 5) * 0.1);
  
  // Select model file based on device capability
  const modelFile = lowEndDevice ? 'cake_model_low.glb' : 'cake_model_2.glb';
  const modelPath = `${GCS_URL}/${modelFile}`;
  
  // Use suspense to load the model
  const { scene } = useGLTF(modelPath);
  
  // Access the camera to adjust its position
  const { camera } = useThree();
  
  // Set camera position on component mount - zoom out for a better view
  useEffect(() => {
    // Zoom out further by increasing the z position
    camera.position.z = isDetailView ? 3.8 : 3.5;
    // Slightly adjust the camera angle for a better view
    camera.position.y = 0.5;
    
    // Signal that the component is rendered
    setIsRendered(true);
    
    // Signal that the model has loaded
    setModelLoaded(true);
  }, [camera, isDetailView]);
  
  // Rotate the model in the animation loop with the product-specific adjusted speed
  useFrame(() => {
    if (meshRef.current && isRendered) {
      meshRef.current.rotation.y += adjustedRotationSpeed;
    }
  });
  
  // Clone the scene to ensure each model instance is independent
  const clonedScene = scene.clone();
  
  // For low-end devices, simplify the material to improve performance
  if (lowEndDevice && clonedScene) {
    clonedScene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.material) {
          // Simplify materials for better performance
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(mat => {
              // Type assertion to access material properties
              const material = mat as THREE.MeshStandardMaterial;
              return new THREE.MeshBasicMaterial({
                color: material.color ? material.color : new THREE.Color(0xffffff),
                map: material.map || null
              });
            });
          } else {
            // Type assertion to access material properties
            const material = mesh.material as THREE.MeshStandardMaterial;
            mesh.material = new THREE.MeshBasicMaterial({
              color: material.color ? material.color : new THREE.Color(0xffffff),
              map: material.map || null
            });
          }
        }
      }
    });
  }
  
  return (
    <mesh ref={meshRef} scale={[finalScale, finalScale, finalScale]}>
      <primitive object={clonedScene} dispose={null} />
    </mesh>
  );
} 
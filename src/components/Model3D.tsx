import React, { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getMainLoaderActive } from './LoadingScreen';

// Simple loading indicator
function ModelLoader() {
  return (
    <Html center className="overflow-visible">
      <div className="flex items-center justify-center p-2 rounded-lg bg-white/70 backdrop-blur-sm shadow-sm">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </Html>
  );
}

// Simple error display component
function ModelError({ message }: { message: string }) {
  return (
    <Html center className="overflow-visible">
      <div className="px-3 py-2 rounded-lg bg-red-50 text-red-500 text-sm">
        Failed to load model
      </div>
    </Html>
  );
}

// Main Model3D component - loads and displays 3D cake models
export default function Model3D({ 
  scale = 1, 
  rotationSpeed = 0.005, 
  productId,
  isDetailView = false
}: { 
  scale?: number; 
  rotationSpeed?: number; 
  productId?: string | number;
  isDetailView?: boolean;
}) {
  // Extract number from productId (if it exists)
  let idNumber = '1';
  if (typeof productId === 'string' && productId) {
    idNumber = productId.replace('product-', '');
  } else if (typeof productId === 'number') {
    idNumber = productId.toString();
  }
  
  // Calculate model number (1-5)
  const idNum = parseInt(idNumber);
  const modelNum = (!isNaN(idNum) && idNum > 0) ? ((idNum - 1) % 5) + 1 : 1;
  
  // Set fixed model paths that we know work
  const modelPath = (() => {
    // Fixed models that are known to work
    const modelFile = modelNum === 1 ? 'strawberry.glb' : 
                     modelNum === 2 ? 'nemo.glb' : 
                     modelNum === 3 ? 'princess.glb' : 
                     modelNum === 4 ? 'turkey.glb' : 
                     'spongebob1.glb';
    
    return `https://storage.googleapis.com/kgbakerycakes/optimized/${modelFile}`;
  })();
  
  // Product ID-based color for visual differentiation
  const colorMap: Record<string, string> = {
    '1': '#f8d7da', // Pink
    '2': '#d1e7dd', // Green
    '3': '#cfe2ff', // Blue
    '4': '#fff3cd', // Yellow
    '5': '#e2e3e5', // Gray
  };
  
  const bgColor = colorMap[idNumber] || '#f3d2c1';
  
  // Simplified loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Handle model load completion
  const handleModelLoad = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  // Calculate variant-specific transformations based on ID
  const variantProps = {
    // Base scale for this cake variant (multiplied by the prop scale)
    baseScale: 0.9 + (idNum % 3) * 0.1,
    
    // Different rotation speeds and directions
    rotationDirection: idNum % 2 === 0 ? 1 : -1,
    rotationSpeedModifier: 0.8 + (idNum % 3) * 0.2,
    
    // Position offset to make them look different
    positionY: (idNum % 3 - 1) * 0.2,
    
    // Some cakes can have a slight tilt
    tiltX: (idNum % 4 - 2) * 0.1,
    tiltZ: (idNum % 5 - 2) * 0.1,
    
    // For detail view, different position adjustment
    detailPositionY: -0.3 + (idNum % 3 - 1) * 0.2,
  };
  
  // Reference to the mesh
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Animation loop - rotate the mesh
  useFrame((state) => {
    if (meshRef.current) {
      // Base rotation with variant-specific direction and speed
      meshRef.current.rotation.y += rotationSpeed * variantProps.rotationDirection * variantProps.rotationSpeedModifier;
      
      // Even-numbered cakes have a floating motion
      if (idNum % 2 === 0) {
        const time = state.clock.getElapsedTime();
        meshRef.current.position.y = variantProps.positionY + Math.sin(time * 0.5) * 0.05;
      } 
      // Odd-numbered cakes have a slight wobble
      else {
        const time = state.clock.getElapsedTime();
        meshRef.current.rotation.z = variantProps.tiltZ + Math.sin(time * 0.7) * 0.02;
        meshRef.current.rotation.x = variantProps.tiltX + Math.sin(time * 0.4) * 0.02;
      }
    }
  });
  
  // Load the model
  return (
    <Suspense fallback={<ModelLoader />}>
      {isLoading && <ModelLoader />}
      <mesh 
        ref={meshRef}
        scale={[
          scale * variantProps.baseScale,
          scale * variantProps.baseScale,
          scale * variantProps.baseScale
        ]}
        position={[0, isDetailView ? variantProps.detailPositionY : variantProps.positionY, 0]}
        rotation={[variantProps.tiltX, 0, variantProps.tiltZ]}
        // Add smooth transition for dramatic scaling
        onUpdate={(self) => {
          // Apply smooth transitions to the scale
          if (self.scale.x !== scale * variantProps.baseScale) {
            self.scale.lerp(
              new THREE.Vector3(
                scale * variantProps.baseScale,
                scale * variantProps.baseScale,
                scale * variantProps.baseScale
              ),
              0.05
            );
          }
        }}
      >
        <Cake 
          modelPath={modelPath} 
          bgColor={bgColor}
          onLoad={handleModelLoad}
        />
      </mesh>
    </Suspense>
  );
}

// Simple Cake component that uses GLTF model
function Cake({ 
  modelPath, 
  bgColor, 
  onLoad,
}: { 
  modelPath: string;
  bgColor: string;
  onLoad: () => void;
}) {
  // Used to manage model loading state
  const [loaded, setLoaded] = useState(false);
  
  // Load the GLTF model
  const { scene } = useGLTF(modelPath);
  
  // Apply color tint and handle load event with proper cleanup
  useEffect(() => {
    if (!scene) return;
    
    let disposableMaterials: THREE.Material[] = [];
    
    try {
      // Apply color tint
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(m => {
              const newMat = m.clone();
              disposableMaterials.push(newMat);
              if (newMat.color) {
                const color = new THREE.Color(bgColor);
                newMat.color.lerp(color, 0.15);
              }
              return newMat;
            });
          } else {
            const newMat = child.material.clone();
            disposableMaterials.push(newMat);
            if (newMat.color) {
              const color = new THREE.Color(bgColor);
              newMat.color.lerp(color, 0.15);
            }
            child.material = newMat;
          }
        }
      });
      
      // Signal model is loaded if not already done
      if (!loaded) {
        setLoaded(true);
        onLoad();
      }
    } catch (error) {
      console.warn("Error in model processing:", error);
    }
    
    // Proper cleanup to avoid WebGL context memory leaks
    return () => {
      // Dispose of all cloned materials to prevent memory leaks
      disposableMaterials.forEach(material => {
        if (material.map) material.map.dispose();
        if (material.normalMap) material.normalMap.dispose();
        if (material.specularMap) material.specularMap.dispose();
        if (material.envMap) material.envMap.dispose();
        material.dispose();
      });
    };
  }, [scene, bgColor, onLoad, loaded]);
  
  // Render the model primitive
  return scene ? <primitive object={scene} /> : null;
}

// Not used anymore but kept for reference
function getCakeVariantName(id: number): string {
  const variants = ["Vanilla", "Chocolate", "Strawberry", "Lemon", "Carrot"];
  return variants[(id - 1) % variants.length] || "Custom Cake";
} 
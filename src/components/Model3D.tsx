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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Extract number from productId (if it exists)
  let idNumber = '1';
  if (typeof productId === 'string' && productId) {
    idNumber = productId.replace('product-', '');
  } else if (typeof productId === 'number') {
    idNumber = productId.toString();
  }
  
  // Product ID-based color for visual differentiation
  const colorMap: Record<string, string> = {
    '1': '#f8d7da', // Pink
    '2': '#d1e7dd', // Green
    '3': '#cfe2ff', // Blue
    '4': '#fff3cd', // Yellow
    '5': '#e2e3e5', // Gray
    '6': '#d1c4e9', // Purple
    '7': '#ffccbc', // Orange
    '8': '#bbdefb', // Light blue
    '9': '#ffebc8', // Peach
    '10': '#e8f5e9', // Mint
  };
  
  const bgColor = colorMap[idNumber] || '#f3d2c1';

  // Handle model load completion
  const handleModelLoad = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  // Handle model error
  const handleModelError = useCallback((msg: string) => {
    console.error(`Model error: ${msg}`);
    setHasError(true);
    setErrorMessage(msg);
    setIsLoading(false);
  }, []);
  
  return (
    <Suspense fallback={<ModelLoader />}>
      {isLoading && <ModelLoader />}
      {hasError && <ModelError message={errorMessage} />}
      <Model 
        scale={scale} 
        rotationSpeed={rotationSpeed}
        productId={productId}
        idNumber={idNumber}
        bgColor={bgColor}
        isDetailView={isDetailView}
        onLoad={handleModelLoad} 
        onError={handleModelError}
      />
    </Suspense>
  );
}

// The actual model component that will be wrapped in Suspense
function Model({ 
  scale, 
  rotationSpeed, 
  productId, 
  idNumber, 
  bgColor, 
  isDetailView,
  onLoad,
  onError
}: { 
  scale: number; 
  rotationSpeed: number; 
  productId?: string | number;
  idNumber: string;
  bgColor: string;
  isDetailView: boolean;
  onLoad: () => void;
  onError: (message: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Limit the model number to 1-5 (available models)
  const idNum = parseInt(idNumber);
  const modelNum = (!isNaN(idNum) && idNum > 0) ? ((idNum - 1) % 5) + 1 : 1;
  
  // Set the model path - Always use Google Cloud Storage for consistent behavior
  const modelPath = useMemo(() => {
    // Fixed models that are known to work
    const modelFile = modelNum === 1 ? 'strawberry.glb' : 
                     modelNum === 2 ? 'nemo.glb' : 
                     modelNum === 3 ? 'princess.glb' : 
                     modelNum === 4 ? 'turkey.glb' : 
                     'spongebob1.glb';
    
    // URL without cache busting to ensure proper loading
    const path = `https://storage.googleapis.com/kgbakerycakes/optimized/${modelFile}`;
    console.log(`Loading character model from: ${path}`);
    return path;
  }, [modelNum]);
  
  // Calculate variant-specific transformations based on ID
  const variantProps = useMemo(() => ({
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
    
    // For detail view, different position adjustment (moving up by adjusting Y position)
    detailPositionY: -0.3 + (idNum % 3 - 1) * 0.2, // Moved the model up in the taller container
    
    // Custom variation title
    variantName: getCakeVariantName(idNum)
  }), [idNum]);

  // Directly load the model without any fancy logic - direct approach
  const { scene, nodes, materials } = useGLTF(modelPath);
  
  // Signal successful load if scene is loaded
  useEffect(() => {
    if (scene && scene.children && scene.children.length > 0) {
      setModelLoaded(true);
      onLoad();
    } else if (!scene) {
      onError("Model failed to load");
    }
  }, [scene, onLoad, onError]);
  
  // Use the scene directly without cloning for better performance
  const model = scene;
  
  // Apply color tint to the model based on productId
  useEffect(() => {
    if (!model || model.children.length === 0) return;
    
    try {
      model.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.material) {
          // Create a copy of the material to avoid affecting other instances
          if (Array.isArray(child.material)) {
            child.material = child.material.map(m => {
              const newMat = m.clone();
              // Apply a subtle tint to the material
              if (newMat.color) {
                const color = new THREE.Color(bgColor);
                newMat.color.lerp(color, 0.15); // Very subtle tint
              }
              return newMat;
            });
          } else {
            const newMat = child.material.clone();
            if (newMat.color) {
              const color = new THREE.Color(bgColor);
              newMat.color.lerp(color, 0.15); // Very subtle tint
            }
            child.material = newMat;
          }
        }
      });
    } catch (error) {
      console.warn("Error applying material tint:", error);
    }
  }, [model, bgColor]);

  // Animation loop - rotate the mesh with custom rotation pattern
  useFrame((state) => {
    if (meshRef.current && model) {  // Only animate if we have a model
      // Base rotation with variant-specific direction and speed
      meshRef.current.rotation.y += rotationSpeed * variantProps.rotationDirection * variantProps.rotationSpeedModifier;
      
      // Even-numbered cakes have a gentle floating motion (up and down)
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

  // Only render if we have a model
  if (!model) {
    return null;
  }

  // Render the model
  return (
    <mesh 
      ref={meshRef}
      scale={[
        scale * variantProps.baseScale,
        scale * variantProps.baseScale,
        scale * variantProps.baseScale
      ]}
      position={[0, isDetailView ? variantProps.detailPositionY : variantProps.positionY, 0]}
      rotation={[variantProps.tiltX, 0, variantProps.tiltZ]}
    >
      <primitive object={model} />
    </mesh>
  );
}

// Get a cake variant name based on ID number for visual differentiation
function getCakeVariantName(id: number): string {
  const variants = [
    "Classic Vanilla",
    "Triple Chocolate",
    "Strawberry Dream",
    "Lemon Zest",
    "Spiced Carrot",
    "Blueberry Burst",
    "Red Velvet",
    "Coconut Cream",
    "Marble Swirl",
    "Black Forest"
  ];
  
  // If ID is valid (1-10), return the corresponding variant name
  if (id >= 1 && id <= variants.length) {
    return variants[id - 1];
  }
  
  return "Custom Cake";
} 
import React, { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Loading indicator component without text
function ModelLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-white/70 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-center">
          <img 
            src="/KG_Logo.gif" 
            alt="Loading" 
            className="h-16 w-auto object-contain"
          />
        </div>
        <div className="flex space-x-2 mt-3">
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </Html>
  );
}

// Error display component without text
function ModelError({ message }: { message: string }) {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-white/70 backdrop-blur-sm shadow-lg">
        <div className="text-pink-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
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
  const [retryCount, setRetryCount] = useState(0);
  
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
    // Add more colors for other IDs
  };
  
  const bgColor = colorMap[idNumber] || '#f3d2c1';

  // Reset error state when productId changes to allow fresh attempts
  useEffect(() => {
    setHasError(false);
    setErrorMessage("");
    setRetryCount(0);
    setIsLoading(true);
  }, [productId]);
  
  // Handle model error with retry logic
  const handleModelError = useCallback((msg: string) => {
    console.error(`Model error: ${msg}`);
    setHasError(true);
    setErrorMessage(msg);
    setIsLoading(false);
    
    // Implement retry logic with increasing delays
    if (retryCount < 3) {
      const delay = 500 * (retryCount + 1);
      console.log(`Retrying model load in ${delay}ms (attempt ${retryCount + 1}/3)`);
      
      setTimeout(() => {
        console.log(`Retrying model load now (attempt ${retryCount + 1}/3)`);
        setHasError(false);
        setIsLoading(true);
        setRetryCount(prev => prev + 1);
      }, delay);
    }
  }, [retryCount]);
  
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
        onLoad={() => setIsLoading(false)} 
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
  
  // Limit the model number to 1-8 (available models)
  const idNum = parseInt(idNumber);
  const modelNum = (!isNaN(idNum) && idNum > 0) ? ((idNum - 1) % 8) + 1 : 1;
  
  // Set the model path - Always use Google Cloud Storage for consistent behavior
  const modelPath = useMemo(() => {
    // Always use GCS path to avoid CORS issues
    const path = `https://storage.googleapis.com/kgbakerycakes/cake_model_${modelNum}.glb`;
    console.log(`Loading model from: ${path}`);
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
  
  // Load model with error handling
  // Use a try-catch block around useGLTF to handle exceptions
  let scene: THREE.Group | undefined;
  try {
    const result = useGLTF(modelPath, undefined, undefined, (error) => {
      console.error('GLTF loader error:', error);
      onError(`Failed to load model: ${error}`);
    });
    scene = result.scene;
  } catch (error) {
    console.error('Error in useGLTF hook:', error);
    onError(`Exception in model loader: ${error}`);
  }
  
  // Update error handler to watch for changes to scene
  useEffect(() => {
    if (!scene) {
      onError("Scene failed to load");
    }
  }, [scene, onError]);
  
  // Clone the model when it loads successfully
  const model = useMemo(() => {
    try {
      if (!scene) {
        onError("No scene available");
        return new THREE.Group();
      }
      
      // Clone the scene to avoid conflicts when instances are unmounted
      const clonedScene = scene.clone();
      
      // Set the model as loaded after a short delay to ensure everything is ready
      setTimeout(() => {
        if (clonedScene.children.length > 0) {
          setModelLoaded(true);
          onLoad();
        } else {
          onError("Model loaded but contains no objects");
        }
      }, 100);
      
      return clonedScene;
    } catch (error) {
      onError(`Error cloning scene: ${error}`);
      return new THREE.Group();
    }
  }, [scene, onLoad, onError]);
  
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
    if (meshRef.current) {
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

  // Always attempt to render the actual model
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
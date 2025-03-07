import React, { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { mainLoaderActive } from './LoadingScreen';

// Loading indicator component without text
function ModelLoader() {
  // Don't show if the main loader is active
  if (mainLoaderActive) return null;
  
  return (
    <Html center className="overflow-visible">
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
    <Html center className="overflow-visible">
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

// Modify the modelPreloader function to handle preloading more reliably
function modelPreloader() {
  // Enable THREE cache mechanism
  THREE.Cache.enabled = true;
  
  // Keep track of loaded models
  const loadedModels = new Map();
  
  return {
    preload: (url: string) => {
      return new Promise((resolve, reject) => {
        // Check if we've already loaded this model
        if (loadedModels.has(url)) {
          resolve(loadedModels.get(url));
          return;
        }
        
        // For Google Cloud Storage specifically
        const textureLoader = new THREE.FileLoader();
        textureLoader.setResponseType('arraybuffer'); // Important for binary files like GLB
        textureLoader.setCrossOrigin('anonymous'); 
        textureLoader.setWithCredentials(false); // Changed to false for Google Cloud Storage
        textureLoader.setPath(''); // Make sure no path prefix is added
        textureLoader.setRequestHeader({
          'Access-Control-Allow-Origin': '*', // Request header for CORS
          'Cache-Control': 'no-cache' // Prevent caching
        });
        
        console.log(`Preloading model: ${url}`);
        textureLoader.load(
          url,
          (blob) => {
            console.log(`Successfully preloaded model: ${url}`);
            loadedModels.set(url, blob); // Store for future use
            resolve(blob);
          },
          (progress) => {
            // Add progress tracking
            if (progress.lengthComputable) {
              const percentComplete = (progress.loaded / progress.total) * 100;
              console.log(`Loading progress: ${Math.round(percentComplete)}%`);
            }
          },
          (error) => {
            console.error(`Failed to preload model: ${url}`, error);
            reject(error);
          }
        );
      });
    },
    // Add a method to fetch cached models
    getPreloadedModel: (url: string) => {
      return loadedModels.get(url);
    },
    // Add a method to check if a model is preloaded
    isPreloaded: (url: string) => {
      return loadedModels.has(url);
    }
  };
}

// Create a global preloader instance
const preloader = modelPreloader();

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

// Modify the Model function to handle the async loading properly
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
  const [isPreloaded, setIsPreloaded] = useState(false);
  
  // Limit the model number to 1-8 (available models)
  const idNum = parseInt(idNumber);
  const modelNum = (!isNaN(idNum) && idNum > 0) ? ((idNum - 1) % 8) + 1 : 1;
  
  // Set the model path - Always use Google Cloud Storage for consistent behavior
  const modelPath = useMemo(() => {
    // Map model number to specific character models in the optimized directory
    const characterModels = [
      'nemo.glb',         // ID 1 or ID % 5 = 1
      'princess.glb',     // ID 2 or ID % 5 = 2
      'spongebob1.glb',   // ID 3 or ID % 5 = 3
      'strawberry.glb',   // ID 4 or ID % 5 = 4
      'turkey.glb'        // ID 5 or ID % 5 = 0
    ];

    // Get model file based on product ID (modulo operator ensures we stay within bounds)
    const modelIndex = (idNum - 1) % characterModels.length;
    const modelFile = characterModels[modelIndex];
    
    // Explicit Google Cloud Storage URL
    // Using static URLs without cache busters for better caching
    const path = `https://storage.googleapis.com/kgbakerycakes/optimized/${modelFile}`;
    
    console.log(`Model path for product ${idNum}: ${path}`);
    return path;
  }, [idNum]);
  
  // Preload the model before using useGLTF
  useEffect(() => {
    let isMounted = true;
    
    // First check if the model is already preloaded
    if (preloader.isPreloaded(modelPath)) {
      console.log(`Model already preloaded: ${modelPath}`);
      setIsPreloaded(true);
      return;
    }
    
    console.log(`Starting preload for: ${modelPath}`);
    
    // Attempt to preload the model file
    preloader.preload(modelPath)
      .then(() => {
        if (isMounted) {
          console.log(`Preload complete: ${modelPath}`);
          setIsPreloaded(true);
        }
      })
      .catch(error => {
        console.error(`Failed to preload model: ${modelPath}`, error);
        if (isMounted) {
          onError(`Failed to preload model: ${error.message || 'Network error'}`);
        }
      });
      
    return () => {
      isMounted = false;
    };
  }, [modelPath, onError]);
  
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
  
  // Configure GLTF loader options
  const gltfOptions = {
    draco: undefined,
    meshoptDecoder: undefined,
    crossOrigin: 'anonymous'
  };
  
  // Wait for preload to complete before attempting to use useGLTF
  // This is the key fix for the home page issue
  const useModelLoader = isPreloaded;
  
  // Load model with enhanced error handling
  // Use a try-catch block around useGLTF to handle exceptions
  let scene: THREE.Group | undefined;
  try {
    // Only load the model if it's been preloaded first
    const result = useModelLoader ? 
      useGLTF(modelPath, gltfOptions.draco, gltfOptions.meshoptDecoder) : 
      { scene: undefined };
      
    scene = result.scene;
  } catch (error) {
    console.error('Error in useGLTF hook:', error);
    onError(`Exception in model loader: ${error}`);
  }
  
  // Monitor for successful model loading
  useEffect(() => {
    if (scene) {
      console.log(`Model loaded successfully: ${modelPath}`);
      setModelLoaded(true);
      onLoad();
    }
  }, [scene, modelPath, onLoad]);
  
  // Create a fallback model if the scene couldn't be loaded
  useEffect(() => {
    if (isPreloaded && !scene) {
      // Keep trying - no fallback - log error only
      console.error("Scene failed to load - continuing to retry");
    }
  }, [scene, isPreloaded]);

  // Clone the model when it loads successfully
  const model = useMemo(() => {
    try {
      if (!scene) {
        return new THREE.Group();
      }
      
      // Clone the scene to avoid conflicts when instances are unmounted
      const clonedScene = scene.clone();
      
      return clonedScene;
    } catch (error) {
      onError(`Error cloning scene: ${error}`);
      return new THREE.Group();
    }
  }, [scene, onError]);
  
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
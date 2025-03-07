import React, { useRef, useState, useEffect, Suspense, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Constants
const CLOUD_STORAGE_BASE = 'https://storage.googleapis.com/kgbakerycakes/optimized/';
const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

// Create and reuse a single DRACOLoader instance
const createDracoLoader = () => {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  dracoLoader.setDecoderConfig({ type: 'js' });
  return dracoLoader;
};

// Shared DRACO loader to prevent duplicate instances
const globalDracoLoader = createDracoLoader();

// Global GLTFLoader with DRACO support
const createGLTFLoader = () => {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(globalDracoLoader);
  return loader;
};

// Loading indicator component without text
function ModelLoader() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#2a2a2a" />
    </mesh>
  );
}

// Error display component
function ModelError({ message }: { message: string }) {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff0000" />
    </mesh>
  );
}

// Get a cake variant name based on ID number for visual differentiation
function getCakeVariantName(id: number): string {
  // These names should match the filenames in Google Cloud Storage
  const availableModels = [
    "nemo",
    "strawberry",
    "princess",
    "spongebob1",
    "turkey"
  ];
  
  // We use a simple mapping based on ID
  const index = (id - 1) % availableModels.length;
  const modelName = availableModels[index];
  
  console.log(`Using model "${modelName}" for product ID ${id}`);
  return modelName;
}

// Global model cache
const modelCache = new Map<string, GLTF>();

// Main 3D model component
export default function Model3D({ 
  scale = 1, 
  rotationSpeed = 0.005, 
  productId,
  isDetailView = false,
  onLoad,
  onError
}: { 
  scale?: number; 
  rotationSpeed?: number; 
  productId?: string | number;
  isDetailView?: boolean;
  onLoad?: () => void;
  onError?: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Generate a stable, unique ID for this component instance
  const [idNumber] = useState(() => `model-${Math.floor(Math.random() * 10000)}`);
  
  // Calculate the background color based on the product ID
  const bgColor = productId 
    ? `hsl(${(Number(productId) * 40) % 360}, 70%, 80%)`
    : '#b2e0fc';

  // Clear errors when props change
  useEffect(() => {
    setError(null);
  }, [productId]);

  const handleModelError = useCallback((message: string) => {
    console.error(`Model Error: ${message}`);
    setError(message);
    if (onError) onError(message);
  }, [onError]);
  
  const handleModelLoaded = useCallback(() => {
    setIsLoading(false);
    if (onLoad) onLoad();
  }, [onLoad]);

  // Return the 3D model content directly (no Canvas)
  return (
    <Suspense fallback={<ModelLoader />}>
      <ModelContent 
        scale={scale} 
        rotationSpeed={rotationSpeed} 
        productId={productId}
        idNumber={idNumber}
        bgColor={bgColor}
        isDetailView={isDetailView}
        onLoad={handleModelLoaded} 
        onError={handleModelError}
      />
    </Suspense>
  );
}

// Separate model content component to avoid initialization issues
function ModelContent({ 
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
  // Get variant name based on the product ID
  const variantName = productId ? getCakeVariantName(Number(productId)) : 'nemo';
  
  // Create model URL
  const modelUrl = `${CLOUD_STORAGE_BASE}${encodeURIComponent(variantName)}.glb`;
  
  // Reference to the group containing our model
  const groupRef = useRef<THREE.Group>(null);
  
  // State to track if model is loaded and store the model
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  
  // Load the model with regular THREE.js GLTFLoader
  useEffect(() => {
    let isMounted = true;
    const loader = createGLTFLoader();
    
    console.log(`[${idNumber}] Loading model from URL: ${modelUrl}, attempt ${loadAttempt + 1}`);
    
    // Add a small random delay to stagger loading and prevent overloading
    const startLoading = () => {
      loader.load(
        modelUrl,
        (gltf) => {
          if (isMounted) {
            // Successfully loaded the model
            console.log(`[${idNumber}] Successfully loaded model: ${variantName}`);
            try {
              const clonedScene = gltf.scene.clone();
              setModel(clonedScene);
              onLoad();
            } catch (err) {
              console.error(`[${idNumber}] Error cloning model:`, err);
              onError(`Failed to process model: ${err}`);
            }
          }
        },
        (progress) => {
          if (progress.lengthComputable && isMounted) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`[${idNumber}] Loading ${modelUrl}: ${percent}%`);
          }
        },
        (error: any) => {
          if (isMounted) {
            const errorMsg = error.message || String(error);
            console.error(`[${idNumber}] Error loading model: ${errorMsg}`);
            setModelError(errorMsg);
            onError(`Failed to load model: ${errorMsg}`);
            
            // Retry loading after a delay if this isn't our final attempt
            if (loadAttempt < 3) {
              setTimeout(() => {
                if (isMounted) {
                  setLoadAttempt(prev => prev + 1);
                }
              }, 1000);
            }
          }
        }
      );
    };
    
    // Add a short random delay to prevent all models loading simultaneously
    const delay = Math.random() * 200;
    const timer = setTimeout(startLoading, delay);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [modelUrl, onError, onLoad, variantName, idNumber, loadAttempt]);
  
  // Handle rotation animation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });
  
  // Show error state after multiple failed attempts
  if (modelError && loadAttempt >= 3) {
    return <ModelError message={modelError} />;
  }
  
  // Show loading state
  if (!model) {
    return <ModelLoader />;
  }
  
  // Render the model
  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={model} />
    </group>
  );
}

// Configure THREE.js to limit cached resources
THREE.Cache.enabled = true;
// THREE.Cache.limit = 50; // Not available in THREE.js TypeScript definition 
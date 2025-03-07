import React, { useRef, useState, useEffect, Suspense, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
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
  isDetailView = false
}: { 
  scale?: number; 
  rotationSpeed?: number; 
  productId?: string | number;
  isDetailView?: boolean;
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
  }, []);
  
  const handleModelLoaded = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Preload configuration - do this once globally
  useEffect(() => {
    // Configure the loader for all future useGLTF calls
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(globalDracoLoader);
    
    return () => {
      // Don't dispose global loader on unmount of individual components
    };
  }, []);

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
  
  // State to track if model is loaded
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  
  // Preload model
  useEffect(() => {
    // Preload the model first
    useGLTF.preload(modelUrl);
    
    // Cleanup
    return () => {
      try {
        useGLTF.clear(modelUrl);
      } catch (e) {
        // Ignore cleanup errors
        console.log("Error clearing model:", e);
      }
    };
  }, [modelUrl]);
  
  // Actually load the model with proper async handling
  useEffect(() => {
    let isMounted = true;
    
    async function loadModel() {
      try {
        // Load the model
        const result = await useGLTF(modelUrl);
        
        // Only update state if component is still mounted
        if (isMounted) {
          if (result && result.scene) {
            setModel(result.scene.clone()); // Clone to avoid shared model issues
            setModelLoaded(true);
            onLoad();
            console.log(`Model successfully loaded: ${variantName}`);
          } else {
            const errorMsg = 'Model loaded but scene is missing';
            setModelError(errorMsg);
            onError(errorMsg);
          }
        }
      } catch (error) {
        if (isMounted) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`Error loading model: ${errorMsg}`);
          setModelError(errorMsg);
          onError(`Failed to load model: ${errorMsg}`);
        }
      }
    }
    
    loadModel();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [modelUrl, onError, onLoad, variantName]);
  
  // Handle rotation animation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });
  
  // Show error state
  if (modelError) {
    return <ModelError message={modelError} />;
  }
  
  // Show loading state
  if (!modelLoaded || !model) {
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
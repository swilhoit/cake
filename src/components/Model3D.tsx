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

// Create a DRACOLoader helper function
function createDracoLoader() {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  dracoLoader.setDecoderConfig({ type: 'js' });
  return dracoLoader;
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

// Initialize model cache
const loadedModels = new Map();

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
  
  // Setup draco loader and handle model preloading
  useEffect(() => {
    // Create draco loader for loading compressed models
    const dracoLoader = createDracoLoader();
    
    // Configure GLTFLoader with draco support
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    
    // Manually preload the model with our configured loader
    gltfLoader.load(
      modelUrl,
      () => {
        console.log(`Preloaded model: ${modelUrl}`);
      },
      (progress) => {
        if (progress.lengthComputable) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Preloading ${modelUrl}: ${percent}%`);
        }
      },
      (error: any) => {
        console.warn(`Preload warning: ${error.message}`);
      }
    );
    
    // Tell useGLTF to load this model
    useGLTF.preload(modelUrl);
    
    return () => {
      // Cleanup
      dracoLoader.dispose();
      try {
        useGLTF.clear(modelUrl);
      } catch (e) {
        // Ignore cleanup errors
        console.log("Error clearing model:", e);
      }
    };
  }, [modelUrl]);
  
  // Load the model using useGLTF
  let gltf: THREE.Group | null = null;
  try {
    const result = useGLTF(modelUrl);
    if (result && result.scene) {
      gltf = result.scene;
    }
  } catch (error) {
    console.error(`Error loading model: ${error}`);
    onError(`Failed to load model: ${error}`);
    return <ModelError message={String(error)} />;
  }
  
  // Handle rotation animation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });
  
  // Notify when model is ready
  useEffect(() => {
    if (gltf) {
      console.log(`Model ready: ${variantName}`);
      onLoad();
    }
  }, [gltf, onLoad, variantName]);
  
  // Show loading state if model isn't ready
  if (!gltf) {
    return <ModelLoader />;
  }
  
  // Render the model
  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={gltf} />
    </group>
  );
} 
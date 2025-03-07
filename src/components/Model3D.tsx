import React, { useRef, useState, useEffect, Suspense, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

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

// Single instance of the model preloader to be used across the app
const preloader = modelPreloader();

// Create a global DRACOLoader to be reused
const createDracoLoader = () => {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
  dracoLoader.setDecoderConfig({ type: 'js' });
  return dracoLoader;
};

// Setup global draco loader
const globalDracoLoader = createDracoLoader();

// Model preloader to handle loading and caching 3D models
function modelPreloader() {
  const loadedModels = new Map();
  const loadingPromises = new Map();
  
  // Create a global loader and configure it
  const loader = new GLTFLoader();
  
  // Attach the DRACOLoader to GLTFLoader
  loader.setDRACOLoader(globalDracoLoader);
  
  // Add a CORS proxy for Google Cloud Storage requests if needed
  const CLOUD_STORAGE_BASE = 'https://storage.googleapis.com/kgbakerycakes/optimized/';

  return {
    preload: (modelName: string): Promise<any> => {
      const url = `${CLOUD_STORAGE_BASE}${encodeURIComponent(modelName)}.glb`;
      
      // If we already have a loading promise for this URL, return it
      if (loadingPromises.has(url)) {
        return loadingPromises.get(url);
      }
      
      // If we already have loaded this model, return it immediately
      if (loadedModels.has(url)) {
        return Promise.resolve(loadedModels.get(url));
      }

      console.log(`Preloading model: ${url}`);
      
      // Create a promise for this model load
      const loadPromise = new Promise((resolve, reject) => {
        const onProgress = (event: ProgressEvent) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            console.log(`Model ${url} loading: ${Math.round(percentComplete)}%`);
          }
        };

        // Maximum retry count to prevent infinite retries
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 1500; // 1.5 seconds between retries

        // Function to attempt loading with retry logic
        const attemptLoad = () => {
          // Add a cache-busting parameter to prevent caching issues
          const cacheBuster = `?t=${Date.now()}`;
          const loadUrl = `${url}${cacheBuster}`;
          
          console.log(`Loading model from: ${loadUrl}${retryCount > 0 ? " (retry attempt)" : ""}`);
          
          // Set crossOrigin to 'anonymous' to handle CORS
          loader.setCrossOrigin('anonymous');
          
          loader.load(
            loadUrl,
            (gltf) => {
              console.log(`Successfully loaded model: ${url}`);
              loadedModels.set(url, gltf);
              resolve(gltf);
            },
            onProgress,
            (error: any) => {
              const errorMsg = error.message || String(error);
              console.error(`Error loading model ${loadUrl}: ${errorMsg}`);
              
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying model load in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);
                setTimeout(attemptLoad, retryDelay);
              } else {
                console.error(`Failed to load model after all attempts: ${url}`);
                reject(new Error(`Failed to load model: ${url}`));
              }
            }
          );
        };

        // Start loading
        attemptLoad();
      });

      // Store the promise so we don't start multiple loads for the same model
      loadingPromises.set(url, loadPromise);
      
      // When the promise completes, remove it from the loading promises
      loadPromise.finally(() => {
        loadingPromises.delete(url);
      });
      
      return loadPromise;
    },
    
    isPreloaded: (modelName: string): boolean => {
      const url = `${CLOUD_STORAGE_BASE}${encodeURIComponent(modelName)}.glb`;
      return loadedModels.has(url);
    },
    
    getModel: (modelName: string): any => {
      const url = `${CLOUD_STORAGE_BASE}${encodeURIComponent(modelName)}.glb`;
      return loadedModels.get(url);
    }
  };
}

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
      <Model 
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
  
  // We now use a simple mapping based on ID
  const index = (id - 1) % availableModels.length;
  const modelName = availableModels[index];
  
  console.log(`Using model "${modelName}" for product ID ${id}`);
  return modelName;
}

// Model component that handles model loading and display
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
  // Get variant name based on the product ID
  const variantName = productId ? getCakeVariantName(Number(productId)) : 'nemo';
  
  // Handle direct model loading with useGLTF from drei
  const modelUrl = `https://storage.googleapis.com/kgbakerycakes/optimized/${encodeURIComponent(variantName)}.glb`;
  
  // Handle different loading strategies for product page vs. home page
  const isHomePage = !isDetailView;
  
  // Preload models in the background
  useEffect(() => {
    // Preload model URL for useGLTF
    useGLTF.preload(modelUrl);
    
    // Set global DRACOLoader for all useGLTF calls
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(globalDracoLoader);
    
    return () => {
      // Clean up when unmounted
      try {
        useGLTF.clear(modelUrl);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [modelUrl]); 
  
  // Try to load the model using useGLTF
  let gltf;
  try {
    gltf = useGLTF(modelUrl).scene;
  } catch (error) {
    console.error(`Error loading model with useGLTF: ${error}`);
    onError(`Failed to load 3D model: ${error}`);
    return <ModelError message={String(error)} />;
  }
  
  // If we have a model, set up the 3D view
  const groupRef = useRef<THREE.Group>(null);
  
  // Handle rotation animation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });
  
  // Notify parent when model is loaded
  useEffect(() => {
    if (gltf) {
      console.log(`Model ready: ${variantName}`);
      onLoad();
    }
  }, [gltf, onLoad, variantName]);
  
  if (!gltf) {
    console.warn(`No GLTF model available for ${variantName}`);
    return <ModelLoader />;
  }
  
  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={gltf} />
    </group>
  );
} 
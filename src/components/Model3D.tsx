import React, { useRef, useState, useEffect, Suspense } from 'react';
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

// Model preloader to handle loading and caching 3D models
function modelPreloader() {
  const loadedModels = new Map();
  const loadingPromises = new Map();
  
  // Create a global loader and configure it
  const loader = new GLTFLoader();
  
  // Add DRACOLoader for compressed models
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
  dracoLoader.setDecoderConfig({ type: 'js' }); // Use JavaScript decoder for better compatibility
  
  // Attach the DRACOLoader to GLTFLoader
  loader.setDRACOLoader(dracoLoader);
  
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

  const handleModelError = (message: string) => {
    console.error(`Model Error: ${message}`);
    setError(message);
  };

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
        onLoad={() => setIsLoading(false)} 
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
  const [isPreloaded, setIsPreloaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string>('');
  
  // Get variant name based on the product ID
  const variantName = productId ? getCakeVariantName(Number(productId)) : 'nemo';
  
  // Set up model URL on first render
  useEffect(() => {
    const url = `https://storage.googleapis.com/kgbakerycakes/optimized/${encodeURIComponent(variantName)}.glb`;
    console.log(`Setting up model URL: ${url} for product ${productId}`);
    setModelUrl(url);
  }, [variantName, productId]);
  
  // Setup DRACOLoader once
  useEffect(() => {
    if (!modelUrl) return;
    
    // Configure the global useGLTF DRACOLoader
    console.log(`Setting up DRACOLoader for ${modelUrl}`);
    
    // Clear any previous preloads
    try {
      useGLTF.clear(modelUrl);
    } catch (e) {
      console.log("No previous model to clear");
    }
    
    // Preload the model with the correct URL
    useGLTF.preload(modelUrl);
    
    return () => {
      try {
        useGLTF.clear(modelUrl);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [modelUrl]);
  
  // Use direct GLTFLoader for more control
  useEffect(() => {
    if (!modelUrl) return;
    
    console.log(`Starting direct load for model: ${modelUrl}`);
    let isMounted = true;
    
    // Setup loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    
    // Add cache-busting parameter
    const loadUrl = `${modelUrl}?t=${Date.now()}`;
    
    loader.load(
      loadUrl,
      (gltf) => {
        if (!isMounted) return;
        console.log(`Successfully loaded model: ${modelUrl}`);
        setIsPreloaded(true);
        // We'll set our loaded model in a useRef in the rendering section
      },
      (progress) => {
        if (!isMounted) return;
        if (progress.lengthComputable) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Loading ${modelUrl}: ${percent}%`);
        }
      },
      (error: any) => {
        if (!isMounted) return;
        const errorMsg = error.message || String(error);
        console.error(`Error loading model ${modelUrl}: ${errorMsg}`);
        setError(errorMsg);
        onError(errorMsg);
      }
    );
    
    return () => {
      isMounted = false;
      dracoLoader.dispose();
    };
  }, [modelUrl, onError]);
  
  // Ref to store our loaded model
  const modelRef = useRef<THREE.Group | null>(null);
  
  // Access the gltf model - use a try/catch for safety
  let gltf = null;
  try {
    if (modelUrl && isPreloaded) {
      const result = useGLTF(modelUrl);
      gltf = result.scene;
      console.log('useGLTF returned model:', result);
    }
  } catch (e) {
    console.error('Error in useGLTF:', e);
    // We'll continue with null gltf and show an empty group
  }
  
  // Handle rotation animation
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });
  
  // Notify parent when model is ready
  useEffect(() => {
    if (isPreloaded && gltf && !error) {
      console.log('Model ready - calling onLoad');
      onLoad();
    }
  }, [isPreloaded, gltf, onLoad, error]);
  
  // Debug output
  useEffect(() => {
    console.log('Model render state:', { 
      productId, 
      variantName, 
      isPreloaded, 
      hasGltf: !!gltf, 
      error 
    });
  }, [productId, variantName, isPreloaded, gltf, error]);
  
  if (!isPreloaded || !gltf) {
    console.log(`Rendering empty group for ${variantName} - preloaded: ${isPreloaded}, hasGltf: ${!!gltf}`);
    return <group />;
  }
  
  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={gltf} />
    </group>
  );
} 
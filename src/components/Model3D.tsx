import React, { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { mainLoaderActive } from './LoadingScreen';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';
import { useLoader } from '@react-three/fiber';

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
  const loadedModels = new Map();
  const loadingPromises = new Map();
  
  // Handle CORS issues in development
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';

  return {
    preload: (url: string): Promise<any> => {
      // If we already have a loading promise for this URL, return it
      if (loadingPromises.has(url)) {
        return loadingPromises.get(url);
      }
      
      // If we already have loaded this model, return it immediately
      if (loadedModels.has(url)) {
        return Promise.resolve(loadedModels.get(url));
      }

      // Determine if we should use local models first in development
      let modelUrl = url;
      let isCloudUrl = url.includes('storage.googleapis.com');
      
      // Extract the filename for potential local fallback
      const fileName = url.split('/').pop();
      const localModelUrl = fileName ? `/models/${fileName}` : null;

      // In development, prefer local models directly to avoid CORS issues
      if (isDevelopment && isCloudUrl && localModelUrl) {
        console.log(`Development mode: Using local model path first: ${localModelUrl}`);
        modelUrl = localModelUrl;
      }
      
      console.log(`Preloading model: ${modelUrl}`);
      
      const loader = new GLTFLoader();
      
      // Create a promise for this model load
      const loadPromise = new Promise((resolve, reject) => {
        const onProgress = (event: ProgressEvent) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            console.log(`Model ${modelUrl} loading: ${Math.round(percentComplete)}%`);
          }
        };

        // Maximum retry count to prevent infinite retries
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 1500; // 1.5 seconds between retries

        // Try to load with a specific URL and fall back if needed
        const attemptLoadWithFallback = (currentUrl: string, fallbackUrl: string | null = null, isRetry: boolean = false) => {
          console.log(`Loading model from: ${currentUrl}${isRetry ? " (retry attempt)" : ""}`);
          
          loader.load(
            currentUrl,
            (gltf) => {
              console.log(`Successfully loaded model: ${currentUrl}`);
              loadedModels.set(url, gltf); // Store with the original requested URL
              resolve(gltf);
            },
            onProgress,
            (error: any) => {
              const errorMsg = error.message || String(error);
              console.error(`Error loading model ${currentUrl}: ${errorMsg}`);
              
              // If we have a fallback URL and this isn't already a fallback attempt
              if (fallbackUrl && !isRetry) {
                console.log(`Attempting fallback to: ${fallbackUrl}`);
                attemptLoadWithFallback(fallbackUrl, null, false);
              } 
              // Otherwise try to retry this URL a few times
              else if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying model load in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);
                setTimeout(() => attemptLoadWithFallback(currentUrl, null, true), retryDelay);
              } 
              // If we've exhausted all options, reject with a clear error
              else {
                console.error(`Failed to load model after all attempts: ${url}`);
                reject(new Error(`Failed to load model: ${url}`));
              }
            }
          );
        };

        // Start the loading process with potential fallback
        if (isDevelopment && isCloudUrl && localModelUrl !== modelUrl) {
          // In development, try cloud URL with local fallback
          attemptLoadWithFallback(modelUrl, localModelUrl);
        } else {
          // Standard loading without fallback or already using local URL
          attemptLoadWithFallback(modelUrl);
        }
      });

      // Store the promise so we don't start multiple loads for the same model
      loadingPromises.set(url, loadPromise);
      
      // When the promise resolves or rejects, remove it from the loading promises
      loadPromise.finally(() => {
        loadingPromises.delete(url);
      });
      
      return loadPromise;
    },
    
    isLoaded: (url: string): boolean => {
      return loadedModels.has(url);
    },
    
    getLoadedModel: (url: string): any | null => {
      return loadedModels.get(url) || null;
    }
  };
}

// Create a singleton instance of the model preloader
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

// Get a cake variant name based on ID number for visual differentiation
function getCakeVariantName(id: number): string {
  // These names should match filenames in your /public/models/ directory
  // Make sure to place GLB files with these exact names there for development
  const availableModels = [
    "nemo",      // These models are confirmed to work
    "strawberry",
    "princess",
    "spongebob1",
    "turkey"
  ];
  
  // We now use a simple mapping based on ID mod length of available models
  const index = (id - 1) % availableModels.length;
  const modelName = availableModels[index];
  
  console.log(`Using model "${modelName}" for product ID ${id}`);
  return modelName;
}

// Update the Model component to use fallback images when models fail to load
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
  const [shouldShowFallbackImage, setShouldShowFallbackImage] = useState<boolean>(false);
  
  // Get variant name based on the product ID
  const variantName = productId ? getCakeVariantName(Number(productId)) : 'nemo';
  
  // Properly URL encode the variant name for the model URL
  const encodedVariantName = encodeURIComponent(variantName);
  
  // Construct the model URL with proper encoding
  const modelUrl = `https://storage.googleapis.com/kgbakerycakes/optimized/${encodedVariantName}.glb`;
  
  // Fallback image URL - use when 3D models fail to load
  const fallbackImageUrl = productId ? `/images/cakes/${variantName}.jpg` : '/images/cakes/default.jpg';
  
  // Log the final URL for debugging
  useEffect(() => {
    console.log(`Model URL: ${modelUrl}`);
  }, [modelUrl]);
  
  // Preload the model first before using it with useGLTF
  useEffect(() => {
    let isMounted = true;
    
    console.log(`Starting preload for: ${modelUrl}`);
    
    // Try to preload the model
    preloader.preload(modelUrl)
      .then(() => {
        if (isMounted) {
          console.log(`Model preloaded successfully: ${modelUrl}`);
          setIsPreloaded(true);
          setShouldShowFallbackImage(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const errorMessage = `Error preloading model: ${err.message || 'Unknown error'}`;
          console.error(errorMessage);
          setError(errorMessage);
          onError(errorMessage);
          
          // Show fallback image after all attempts failed
          setShouldShowFallbackImage(true);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [modelUrl, onError]);

  // If showing fallback image instead of 3D model
  if (shouldShowFallbackImage) {
    console.log(`Using fallback image: ${fallbackImageUrl}`);
    return (
      <mesh>
        <planeGeometry args={[2 * scale, 2 * scale]} />
        <meshBasicMaterial>
          <Texture url={fallbackImageUrl} />
        </meshBasicMaterial>
      </mesh>
    );
  }

  // Declare model loader to only use when preloaded
  const groupRef = useRef<THREE.Group>(null);
  const { scene: gltf } = useGLTF(modelUrl);

  // Handle rotation animation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });

  // Call onLoad once the model is ready
  useEffect(() => {
    if (isPreloaded && !error) {
      onLoad();
    }
  }, [isPreloaded, onLoad, error]);

  if (!isPreloaded || !gltf) {
    // Return an empty group while loading
    return <group />;
  }

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={gltf} />
    </group>
  );
}

// Texture component for fallback images
function Texture({ url }: { url: string }) {
  const texture = useLoader(TextureLoader, url);
  return <primitive attach="map" object={texture} />;
} 
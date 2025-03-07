import React, { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { mainLoaderActive } from './LoadingScreen';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

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

      console.log(`Preloading model: ${url}`);
      
      const loader = new GLTFLoader();
      
      // Create a promise for this model load
      const loadPromise = new Promise((resolve, reject) => {
        const onProgress = (event: ProgressEvent) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            console.log(`Model ${url} loading: ${Math.round(percentComplete)}%`);
          }
        };

        // For development, use a CORS proxy or switch to local assets
        let modelUrl = url;
        if (isDevelopment && url.includes('storage.googleapis.com')) {
          // In development, switch to local assets if available
          const fileName = url.split('/').pop();
          if (fileName) {
            modelUrl = `/models/${fileName}`;
            console.log(`Development mode: Using local model path: ${modelUrl}`);
          }
        }

        // Maximum retry count to prevent infinite retries
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 1500; // 1.5 seconds between retries

        const attemptLoad = () => {
          loader.load(
            modelUrl,
            (gltf) => {
              console.log(`Model loaded successfully: ${url}`);
              
              // Store the loaded model in our cache
              loadedModels.set(url, gltf);
              
              // Remove the loading promise reference
              loadingPromises.delete(url);
              
              resolve(gltf);
            },
            onProgress,
            (error) => {
              console.error(`Error loading model ${url}:`, error);
              
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying model load in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);
                setTimeout(attemptLoad, retryDelay);
              } else {
                // If we've exhausted retries, try a local fallback for development
                if (isDevelopment && !modelUrl.startsWith('/models/')) {
                  const fileName = url.split('/').pop();
                  if (fileName) {
                    const localUrl = `/models/${fileName}`;
                    console.log(`Falling back to local model: ${localUrl}`);
                    modelUrl = localUrl;
                    retryCount = 0; // Reset retry count for the new URL
                    setTimeout(attemptLoad, 0); // Immediately try the local URL
                    return;
                  }
                }
                
                // All retries failed, reject the promise
                loadingPromises.delete(url);
                reject(new Error(`Failed to load model: ${url}`));
              }
            }
          );
        };

        // Start loading
        attemptLoad();
      });

      // Store the promise for this URL
      loadingPromises.set(url, loadPromise);
      
      // Return the promise for this model load
      return loadPromise.catch(error => {
        console.error(`Failed to preload model: ${url}`, error);
        loadingPromises.delete(url);
        throw error;
      });
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
  const [isPreloaded, setIsPreloaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get variant name based on the product ID
  const variantName = productId ? getCakeVariantName(Number(productId)) : 'default';
  
  // Construct the model URL based on the variant name - ensure URL encoding for spaces
  const modelUrl = `https://storage.googleapis.com/kgbakerycakes/optimized/${encodeURIComponent(variantName)}.glb`;
  
  // Preload the model first before using it with useGLTF
  useEffect(() => {
    let isMounted = true;
    
    console.log(`Starting preload for: ${modelUrl}`);
    
    preloader.preload(modelUrl)
      .then(() => {
        if (isMounted) {
          console.log(`Model preloaded successfully: ${modelUrl}`);
          setIsPreloaded(true);
        }
      })
      .catch((preloadError) => {
        if (isMounted) {
          console.error(`Model error: ${preloadError.message}`);
          setError(`Failed to preload model: ${preloadError.message}`);
          onError(`Failed to preload model: ${preloadError.message}`);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [modelUrl, onError]);
  
  // Declare model loader to only use when preloaded
  let gltf: GLTF | null = null;
  
  // Only try to load the model with useGLTF when it's preloaded
  if (isPreloaded) {
    try {
      gltf = useGLTF(modelUrl) as unknown as GLTF;
    } catch (loadError) {
      if (!error) {
        console.error(`Error loading model with useGLTF: ${loadError}`);
        setError(`Failed to load model: ${loadError}`);
        onError(`Failed to load model: ${loadError}`);
      }
    }
  }

  // Notify the parent when the model is successfully loaded
  useEffect(() => {
    if (gltf && isPreloaded && !error) {
      onLoad();
    }
  }, [gltf, isPreloaded, error, onLoad]);

  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current && !error && gltf) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });

  if (error) {
    return null;
  }
  
  if (!isPreloaded || !gltf) {
    // Return an empty group while loading
    return <group />;
  }

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// Get a cake variant name based on ID number for visual differentiation
function getCakeVariantName(id: number): string {
  // Map product IDs to specific cake variant names
  const cakeVariants: Record<number, string> = {
    1: "nemo",
    2: "princess",
    3: "spongebob1",
    4: "strawberry",
    5: "turkey",
    6: "Black Forest",
    7: "Custom Cake",
    8: "Classic Vanilla", 
    9: "Triple Chocolate",
    10: "Strawberry Dream"
  };
  
  // Get the variant name if it exists, otherwise use the default
  const variantName = cakeVariants[id] || 
                     (id > 10 ? cakeVariants[id % 10 || 10] : "nemo");
  
  console.log(`Variant name for product ID ${id}: ${variantName}`);
  return variantName;
} 
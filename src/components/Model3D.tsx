import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
// Import types without requiring the actual module at runtime
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, Environment } from '@react-three/drei';

// Type definition for the GLTFLoader
interface GLTFLoaderType {
  load: (
    url: string,
    onLoad: (gltf: GLTF) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: ErrorEvent) => void
  ) => void;
  setCrossOrigin: (crossOrigin: string) => void;
}

// Define a more specific type for dynamic import result
interface GLTFLoaderModule {
  GLTFLoader: new () => GLTFLoaderType;
}

// Set to store model paths that have been checked and don't exist
const nonExistentModels = new Set<string>();
// Cache for loaded models to improve performance
const modelCache: { [key: string]: THREE.Group } = {};

// Base path for model files - change if your file structure is different
const GCS_URL = 'https://storage.googleapis.com/kgbakerycakes';
const MODEL_PATH = GCS_URL;

interface Model3DProps {
  scale?: number;
  rotationSpeed?: number;
  productId: number;
  isDetailView?: boolean;
  onError?: () => void;
}

// Detect device performance level to optimize rendering
const getDevicePerformanceLevel = (): 'high' | 'medium' | 'low' | 'very-low' => {
  if (typeof window === 'undefined') return 'medium'; // Default for SSR

  // Check for mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // Get hardware capabilities
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const memoryInfo = (navigator as any).deviceMemory || 4;
  
  // Device pixel ratio helps identify display quality
  const dpr = window.devicePixelRatio || 1;
  
  if (isMobile && hardwareConcurrency <= 2) {
    return 'very-low';
  } else if (isMobile || hardwareConcurrency <= 4 || memoryInfo <= 2) {
    return 'low';
  } else if (hardwareConcurrency <= 8 || memoryInfo <= 4 || dpr < 2) {
    return 'medium';
  } else {
    return 'high';
  }
};

// Detect if code is running in production environment
const isProduction = (): boolean => {
  // For development, always return false to attempt to load models
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If it's localhost, we're in development
    const isDevelopment = hostname === 'localhost' 
                       || hostname.includes('.local') 
                       || hostname.startsWith('192.168.')
                       || hostname.startsWith('127.0.')
                       || hostname === '';
    
    // Return false for development to try loading models
    return !isDevelopment;
  }
  
  // Default to false to try loading models
  return false;
};

// Create a simple cube as fallback model when 3D models can't be loaded
const createFallbackCube = (): THREE.Group => {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xffe0a3 });
  const cube = new THREE.Mesh(geometry, material);
  group.add(cube);
  return group;
};

// Function to try several potential model filenames for a given product ID
const getModelPaths = (productId: number, performanceLevel: string): string[] => {
  // Try multiple naming conventions in order of preference
  const possibleNames = [
    // Standard naming convention using product ID
    `cake_${productId}.glb`,
    
    // Try with underscores
    `cake_model_${productId}.glb`,
    
    // Try with hyphens
    `cake-${productId}.glb`,
    `cake-model-${productId}.glb`,
    
    // Try without product ID prefix (just the ID)
    `${productId}.glb`,
    
    // Try with 'model' prefix
    `model_${productId}.glb`,
    
    // Try generic cake models
    'cake_model.glb',
    'cake.glb'
  ];
  
  // For low performance levels, add variants
  if (performanceLevel === 'low' || performanceLevel === 'very-low') {
    possibleNames.unshift(
      `cake_${productId}_low.glb`,
      `cake_model_${productId}_low.glb`,
      `cake-${productId}-low.glb`,
      `cake-model-${productId}-low.glb`,
      `${productId}_low.glb`
    );
  }
  
  // Return full paths
  return possibleNames.map(name => `${MODEL_PATH}/${name}`);
};

export default function Model3D({ 
  scale = 1, 
  rotationSpeed = 0.01, 
  productId, 
  isDetailView = false,
  onError 
}: Model3DProps) {
  // Use a reference to the mesh to manipulate it in the render loop
  const meshRef = useRef<THREE.Mesh>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  const performanceLevel = getDevicePerformanceLevel();
  
  // Optimize based on device performance level
  const performanceSettings = {
    'very-low': {
      scale: scale * 0.7,
      rotationSpeed: rotationSpeed * 0.25,
      useMeshBasicMaterial: true,
      skipLighting: true,
      memoryOptimized: true
    },
    'low': {
      scale: scale * 0.8,
      rotationSpeed: rotationSpeed * 0.5,
      useMeshBasicMaterial: true,
      skipLighting: false,
      memoryOptimized: true
    },
    'medium': {
      scale: scale,
      rotationSpeed: rotationSpeed * 0.75,
      useMeshBasicMaterial: false,
      skipLighting: false,
      memoryOptimized: false
    },
    'high': {
      scale: scale,
      rotationSpeed: rotationSpeed,
      useMeshBasicMaterial: false,
      skipLighting: false,
      memoryOptimized: false
    }
  };
  
  // Get settings based on performance level
  const settings = performanceSettings[performanceLevel];
  
  // Add slight variation based on product ID
  const adjustedRotationSpeed = settings.rotationSpeed * (1 + (productId % 5) * 0.1);
  const finalScale = settings.scale;
  
  // Get list of possible model paths to try
  const modelPaths = getModelPaths(productId, performanceLevel);
  
  // Use a model loader wrapper to handle loading and errors
  const loadModel = async (): Promise<THREE.Group> => {
    let lastError: Error | null = null;
    
    console.log(`🍰 Attempting to load model for Product ID: ${productId}`);
    console.log(`💡 Using performance level: ${performanceLevel}`);
    console.log(`🔍 Will try these model paths in order:`, modelPaths);
    
    // Try each path in sequence until one works
    for (const modelPath of modelPaths) {
      try {
        console.log(`🔄 Attempting to load model from: ${modelPath}`);
        
        // Check cache first
        if (modelCache[modelPath]) {
          console.log(`✅ Using cached model from ${modelPath}`);
          return modelCache[modelPath].clone();
        }
        
        // Dynamic import for GLTFLoader
        const GLTFModule = await import('three/examples/jsm/loaders/GLTFLoader') as GLTFLoaderModule;
        const loader = new GLTFModule.GLTFLoader();
        
        // Set cross-origin to anonymous to allow loading from other domains (like GCS)
        loader.setCrossOrigin('anonymous');
        
        // Load the model with a Promise wrapper around the loader
        const model = await new Promise<THREE.Group>((resolve, reject) => {
          loader.load(
            modelPath,
            (gltf: GLTF) => {
              console.log(`✅ Model loaded successfully from ${modelPath}!`);
              const model = gltf.scene.clone();
              
              // Store in cache for future use
              modelCache[modelPath] = model.clone();
              
              // Set the model path so we know which one succeeded
              setModelPath(modelPath);
              
              resolve(model);
            },
            (progress: ProgressEvent) => {
              // Optional progress callback
              if (progress.total > 0) {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                console.log(`📊 Loading ${modelPath}: ${percent}% (${Math.round(progress.loaded / 1024)}KB/${Math.round(progress.total / 1024)}KB)`);
              }
            },
            (error: ErrorEvent) => {
              console.error(`❌ Error loading model from ${modelPath}:`, error);
              reject(error);
            }
          );
        });
        
        // If we got here, we successfully loaded a model
        return model;
      } catch (error) {
        console.error(`❌ Failed to load model from ${modelPath}`, error);
        lastError = error as Error;
        // Continue to the next path
      }
    }
    
    // If we get here, all paths failed
    console.error("❌ All model loading attempts failed for product ID:", productId);
    throw lastError || new Error("Failed to load any model");
  };
  
  // State to track if we're using a fallback cube
  const [usingFallback, setUsingFallback] = useState(false);
  const [modelPath, setModelPath] = useState<string | null>(null);
  // Keep track of the loaded model to render it
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null);
  
  // Use a fallback model in production or if the model file doesn't exist
  useEffect(() => {
    if (!isProduction()) {
      // In development, try to load the model
      loadModel()
        .then((model) => {
          console.log("Model loaded successfully, setting loaded model for rendering");
          setModelLoaded(true);
          setUsingFallback(false);
          setLoadedModel(model); // Store the loaded model
          if (modelPath) {
            console.log(`Successfully loaded model from: ${modelPath}`);
          }
        })
        .catch((error) => {
          console.error("Failed to load model, using fallback:", error);
          setModelLoadFailed(true);
          setUsingFallback(true);
          setLoadedModel(createFallbackCube()); // Use fallback cube
          if (onError) onError();
        });
    } else {
      // In production, use the fallback directly
      setUsingFallback(true);
      setLoadedModel(createFallbackCube()); // Use fallback cube
    }
  }, [productId, isProduction, onError]);
  
  // Create a simple model (either loaded or fallback)
  const model = useMemo(() => {
    if (loadedModel) {
      return loadedModel;
    }
    if (usingFallback) {
      return createFallbackCube();
    }
    // Return a group that will be populated when the model loads
    return new THREE.Group();
  }, [loadedModel, usingFallback]);
  
  // Handle rotation animation
  useFrame(() => {
    if (meshRef.current) {
      // Rotate around Y axis
      meshRef.current.rotation.y += adjustedRotationSpeed;
      
      // Add slight backward tilt (about 10 degrees) - converted to radians
      const backwardTilt = 0.17; // Approximately 10 degrees in radians, positive for backward tilt
      
      // Add slight wobble in detail view for more dynamic appearance
      if (isDetailView) {
        // Apply backward tilt plus a small wobble
        meshRef.current.rotation.x = backwardTilt + Math.sin(Date.now() * 0.001) * 0.05;
      } else {
        // Apply constant backward tilt for non-detail view
        meshRef.current.rotation.x = backwardTilt;
      }
    }
  });
  
  // Effect to notify parent component when rendered
  useEffect(() => {
    // Use requestAnimationFrame to ensure component is fully rendered
    const timer = requestAnimationFrame(() => {
      setIsRendered(true);
    });
    
    // Cleanup function
    return () => {
      cancelAnimationFrame(timer);
    };
  }, []);
  
  // Effect to notify parent if model fails to load
  useEffect(() => {
    if (modelLoadFailed && onError) {
      onError();
    }
  }, [modelLoadFailed, onError]);
  
  // When component unmounts or when product changes, clean up resources
  useEffect(() => {
    // Cleanup function
    return () => {
      const cleanupResources = () => {
        // Advanced memory management to prevent memory leaks
        if (model && 'traverse' in model) {
          model.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              // Dispose of geometries and materials
              if (child.geometry) child.geometry.dispose();
              
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(material => material.dispose());
                } else {
                  child.material.dispose();
                }
              }
            }
          });
        }
      };
      
      cleanupResources();
    };
  }, [productId]);

  // Position, scale, and center the model on first render or when it changes
  useEffect(() => {
    if (meshRef.current && model) {
      try {
        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Calculate appropriate scale
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (maxDimension > 0) {
          // If we have a valid size, apply scale
          const targetSize = 1.5; // Target size in world units
          const autoScale = targetSize / maxDimension;
          model.scale.set(
            autoScale * finalScale,
            autoScale * finalScale,
            autoScale * finalScale
          );
        } else {
          // Default scale if we can't determine size
          model.scale.set(finalScale, finalScale, finalScale);
        }
        
        // Center the model
        model.position.set(-center.x, -center.y, -center.z);
        
        console.log(`Model dimensions: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
      } catch (e) {
        console.error("Error positioning model:", e);
      }
    }
  }, [model, meshRef.current, finalScale]);
  
  // Use a simple primitive for the model - this is what's used in ProductPage
  return (
    <mesh ref={meshRef}>
      <primitive object={model} />
    </mesh>
  );
}

// Wrapper component with necessary Three.js setup
export function Model3DWrapper({ 
  productId,
  isDetailView = false,
  onError 
}: Model3DProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Detect device capabilities for rendering optimization
  const { isMobile, memoryLimited } = useMemo(() => {
    if (typeof window === 'undefined') return { isMobile: false, memoryLimited: false };
    
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Check memory constraints
    const memoryLimited = isMobile || (navigator as any).deviceMemory < 4;
    
    return { isMobile, memoryLimited };
  }, []);
  
  // Calculate optimal pixel ratio based on device
  const pixelRatio = useMemo((): [number, number] => {
    if (memoryLimited) return [1, 1]; // Use lowest setting for memory-limited devices
    if (isMobile) return [1, 2]; // Cap at 2x for mobile
    return [1, 2]; // Default range for desktops
  }, [isMobile, memoryLimited]);
  
  const handleError = () => {
    setError(true);
    if (onError) onError();
  };
  
  // Fast path for production to avoid 3D rendering completely
  if (isProduction()) {
    useEffect(() => {
      // In production, always trigger the error callback to use fallback image
      handleError();
    }, [handleError]);
    
    // Return an empty div to maintain layout
    return <div className="w-full h-full bg-gray-50" />;
  }
  
  const scale = isDetailView ? 2.5 : 1.3;
  const rotationSpeed = isDetailView ? 0.003 : 0.01;
  
  return (
    <Canvas dpr={pixelRatio} camera={{ position: [0, 0, 5], fov: 45 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.7} />
        <spotLight intensity={0.5} position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        
        <Model3D 
          scale={scale} 
          rotationSpeed={rotationSpeed} 
          productId={productId}
          isDetailView={isDetailView}
          onError={handleError}
        />
        
        {isDetailView && <OrbitControls enableZoom={true} />}
        <Environment preset="sunset" />
      </Suspense>
    </Canvas>
  );
} 
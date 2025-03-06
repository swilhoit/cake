import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Component props type
interface Model3DProps {
  scale?: number;
  rotationSpeed?: number;
  productId: number;
  isDetailView?: boolean;
  onError?: () => void;
}

// URL for model files - use local path to avoid CORS issues
const MODEL_PATH = '/models';

// Set of model files that have been checked and confirmed not to exist
const nonExistentModels = new Set<string>();

// Enhanced device detection with performance considerations
const getDevicePerformanceLevel = (): 'high' | 'medium' | 'low' | 'very-low' => {
  if (typeof window === 'undefined') return 'medium';
  
  // Check if it's a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Get hardware concurrency (CPU cores) - null check for older browsers
  const cpuCores = window.navigator.hardwareConcurrency || 0;
  
  // Check for device memory (in GB) - this is experimental and might not be available in all browsers
  const deviceMemory = (navigator as any).deviceMemory || 0;
  
  // Very low-end: Old mobile with few cores or low memory
  if (isMobile && (cpuCores < 4 || deviceMemory < 2)) {
    return 'very-low';
  }
  
  // Low-end: Mobile with decent specs
  if (isMobile) {
    return 'low';
  }
  
  // Medium: Desktop with average specs
  if (!isMobile && cpuCores < 8) {
    return 'medium';
  }
  
  // High-end: Powerful desktop
  return 'high';
};

// Check if we're in a production environment
const isProduction = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.location.hostname.includes('vercel.app') || 
         window.location.hostname.includes('netlify.app') ||
         !window.location.hostname.includes('localhost');
};

// Model cache to avoid reloading the same models
const modelCache: Record<string, THREE.Group> = {};

// Basic cube model as a fallback when no models can be loaded
const createFallbackCube = (): THREE.Group => {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xffccaa });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  return group;
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
      modelFile: 'cake_model_very_low.glb', // Ultra-low poly version
      useMeshBasicMaterial: true,
      skipLighting: true,
      memoryOptimized: true
    },
    'low': {
      scale: scale * 0.8,
      rotationSpeed: rotationSpeed * 0.5,
      modelFile: 'cake_model_low.glb', // Low poly version
      useMeshBasicMaterial: true,
      skipLighting: false,
      memoryOptimized: true
    },
    'medium': {
      scale: scale,
      rotationSpeed: rotationSpeed * 0.75,
      modelFile: 'cake_model_2.glb', // Regular version
      useMeshBasicMaterial: false,
      skipLighting: false,
      memoryOptimized: false
    },
    'high': {
      scale: scale,
      rotationSpeed: rotationSpeed,
      modelFile: 'cake_model_2.glb', // Regular version
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
  
  // Select model file based on performance
  const modelPath = `${MODEL_PATH}/${settings.modelFile}`;

  // If in production or the model has already been checked and doesn't exist, use fallback
  const useFallbackModel = isProduction() || nonExistentModels.has(modelPath);
  
  // Use a fallback model in production or if the model file doesn't exist
  const model = useFallbackModel 
    ? createFallbackCube()
    : (() => {
        try {
          // Attempt to load from cache first
          const cachedModel = modelCache[modelPath];
          if (cachedModel) {
            // Use the cached model immediately
            if (!modelLoaded) setModelLoaded(true);
            return cachedModel.clone();
          } else {
            // Use suspense to load the model if not cached
            try {
              const { scene } = useGLTF(modelPath);
              // Store in cache for future use
              modelCache[modelPath] = scene.clone();
              return scene;
            } catch (error) {
              console.error(`Failed to load model ${modelPath}:`, error);
              nonExistentModels.add(modelPath);
              setModelLoadFailed(true);
              if (onError) onError();
              return createFallbackCube();
            }
          }
        } catch (error) {
          console.error('Error loading or creating model:', error);
          setModelLoadFailed(true);
          if (onError) onError();
          return createFallbackCube();
        }
      })();
  
  // Access the camera to adjust its position
  const { camera } = useThree();
  
  // Optimize WebGL context for mobile
  useEffect(() => {
    // Dispose of unused resources more aggressively on low-end devices
    if (settings.memoryOptimized) {
      // Force garbage collection by disposing unused textures/geometries
      const cleanupResources = () => {
        if (THREE.Cache.enabled) {
          THREE.Cache.clear();
        }
        // This helps prevent memory leaks
        if (meshRef.current) {
          meshRef.current.geometry?.dispose();
        }
      };
      
      // Set up interval to clean up resources periodically
      const cleanupInterval = setInterval(cleanupResources, 5000);
      
      return () => {
        clearInterval(cleanupInterval);
        cleanupResources();
      };
    }
  }, [settings.memoryOptimized]);
  
  // Set camera position on component mount
  useEffect(() => {
    // Adjust camera based on performance level - move further back on low-end devices
    const zPosition = isDetailView 
      ? 3.8 
      : performanceLevel === 'very-low' 
        ? 4.0 
        : performanceLevel === 'low' 
          ? 3.8 
          : 3.5;
    
    camera.position.z = zPosition;
    camera.position.y = 0.5;
    
    // Signal that the component is rendered
    setIsRendered(true);
    setModelLoaded(true);
    
    // Notify parent if model failed to load
    if (modelLoadFailed && onError) {
      onError();
    }
    
    // Cleanup when component unmounts
    return () => {
      // Release references to help garbage collection
      if (meshRef.current) {
        meshRef.current = null;
      }
    };
  }, [camera, isDetailView, performanceLevel, modelLoadFailed, onError]);
  
  // Rotate the model - use less frequent updates for low-end devices
  useFrame(() => {
    if (meshRef.current && isRendered) {
      // On very low-end devices, rotate less frequently
      if (performanceLevel === 'very-low') {
        if (Math.random() > 0.7) { // Only update in ~30% of frames
          meshRef.current.rotation.y += adjustedRotationSpeed;
        }
      } else {
        meshRef.current.rotation.y += adjustedRotationSpeed;
      }
    }
  });
  
  // Clone the model to ensure each instance is independent
  const clonedModel = model instanceof THREE.Group ? model.clone() : createFallbackCube();
  
  // For low-end devices, simplify the material to improve performance
  if ((performanceLevel === 'low' || performanceLevel === 'very-low') && clonedModel) {
    clonedModel.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.material) {
          // Simplify materials for better performance
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(mat => {
              // Type assertion to access material properties
              const material = mat as THREE.MeshStandardMaterial;
              return new THREE.MeshBasicMaterial({
                color: material.color ? material.color : new THREE.Color(0xffffff),
                map: material.map || null,
                transparent: material.transparent || false,
                opacity: material.opacity || 1
              });
            });
          } else {
            // Type assertion to access material properties
            const material = mesh.material as THREE.MeshStandardMaterial;
            mesh.material = new THREE.MeshBasicMaterial({
              color: material.color ? material.color : new THREE.Color(0xffffff),
              map: material.map || null,
              transparent: material.transparent || false,
              opacity: material.opacity || 1
            });
          }
        }
      }
    });
  }
  
  return (
    <mesh ref={meshRef} scale={[finalScale, finalScale, finalScale]}>
      <primitive object={clonedModel} dispose={null} />
    </mesh>
  );
} 
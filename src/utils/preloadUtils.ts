// Utility functions for preloading assets

// Cache for already loaded assets
const preloadedAssets = new Set<string>();

/**
 * Preloads an image and returns a promise
 * @param src Image URL to preload
 */
export const preloadImage = (src: string): Promise<void> => {
  // Skip if already preloaded
  if (preloadedAssets.has(src)) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      preloadedAssets.add(src);
      resolve();
    };
    img.onerror = reject;
  });
};

/**
 * Preloads multiple images
 * @param srcs Array of image URLs to preload
 */
export const preloadImages = (srcs: string[]): Promise<void[]> => {
  return Promise.all(srcs.map(src => preloadImage(src)));
};

/**
 * Advanced preloading for 3D models using THREE.js GLTFLoader
 * This not only caches the model but also processes it for faster rendering
 * @param modelPath Path to the model file
 */
export const preloadModel = (modelPath: string): Promise<void> => {
  // Skip if already preloaded
  if (preloadedAssets.has(modelPath)) {
    return Promise.resolve();
  }
  
  console.log(`Preloading model: ${modelPath}`);
  
  // Use THREE.js for comprehensive preloading
  return new Promise<void>((resolve) => {
    // First make sure THREE.js is available
    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      
      // Set up cache control headers
      const fetchOptions = {
        cache: 'force-cache' as RequestCache,
        headers: {
          'Cache-Control': 'max-age=31536000' // Cache for a year
        }
      };
      
      // Use THREE's built-in loading manager
      const loadingManager = new THREE.LoadingManager();
      loadingManager.onProgress = (url, loaded, total) => {
        console.log(`Loading ${url}: ${Math.round(loaded / total * 100)}%`);
      };
      
      loader.setPath('');
      loader.manager = loadingManager;
      
      // Load the model
      loader.load(
        modelPath,
        // Success callback - model loaded
        (gltf) => {
          console.log(`Successfully loaded model: ${modelPath}`);
          
          // Store in global cache for reuse
          if (typeof window !== 'undefined') {
            if (!window._modelCache) {
              window._modelCache = {};
            }
            
            // Store preprocessed model in cache
            window._modelCache[modelPath] = gltf;
            
            // Prep model for memory management
            gltf.scene.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                // Mark geometry for easier disposal later
                if (node.geometry) {
                  node.geometry.userData.cached = true;
                }
                
                // Prep materials for reuse
                if (node.material) {
                  if (Array.isArray(node.material)) {
                    node.material.forEach(material => {
                      material.userData.cached = true;
                    });
                  } else {
                    node.material.userData.cached = true;
                  }
                }
              }
            });
            
            // Mark as preloaded
            preloadedAssets.add(modelPath);
            resolve();
          }
        },
        // Progress callback
        (xhr) => {
          const progress = xhr.loaded / xhr.total;
          if (progress < 1) {
            console.log(`${modelPath} ${Math.round(progress * 100)}% loaded`);
          }
        },
        // Error callback
        (error) => {
          console.warn(`Error preloading model: ${modelPath}`, error);
          
          // Try a simple fetch as fallback
          fetch(modelPath, fetchOptions)
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch model: ${response.statusText}`);
              }
              console.log(`Basic fetch for model successful: ${modelPath}`);
              preloadedAssets.add(modelPath);
              resolve();
            })
            .catch(() => {
              console.error(`All attempts to preload ${modelPath} failed`);
              resolve(); // Still resolve to continue loading
            });
        }
      );
    }).catch(error => {
      console.error("Error importing GLTFLoader:", error);
      resolve(); // Resolve anyway to continue preloading flow
    });
  });
};

/**
 * Preloads multiple 3D models
 * @param modelPaths Array of model paths to preload
 */
export const preloadModels = (modelPaths: string[]): Promise<void[]> => {
  return Promise.all(modelPaths.map(path => preloadModel(path)));
};

/**
 * Returns fixed array of cake model paths that are known to work
 * @returns Array of model paths
 */
export const getCakeModelPaths = (): string[] => {
  // These are the exact URIs that we'll use in the app
  return [
    'https://storage.googleapis.com/kgbakerycakes/optimized/strawberry.glb',
    'https://storage.googleapis.com/kgbakerycakes/optimized/nemo.glb',
    'https://storage.googleapis.com/kgbakerycakes/optimized/princess.glb',
    'https://storage.googleapis.com/kgbakerycakes/optimized/turkey.glb',
    'https://storage.googleapis.com/kgbakerycakes/optimized/spongebob1.glb',
    'https://storage.googleapis.com/kgbakerycakes/banhmi.glb'  // Also preload the banh mi model
  ];
};

/**
 * Preloads critical assets for the site using a more reliable sequential approach
 * @param options Configuration options
 */
export const preloadCriticalAssets = async (
  options: {
    imageUrls?: string[];
    onProgress?: (progress: number) => void;
  } = {}
): Promise<void> => {
  const { imageUrls = [], onProgress } = options;
  
  // Always get all model paths
  const modelPaths = getCakeModelPaths();
  const totalAssets = imageUrls.length + modelPaths.length;
  let loadedAssets = 0;
  
  console.log(`Preloading ${totalAssets} assets (${imageUrls.length} images, ${modelPaths.length} models)`);
  
  // Define a function to update progress
  const updateProgress = () => {
    loadedAssets++;
    const percentage = Math.round((loadedAssets / totalAssets) * 100);
    if (onProgress) {
      onProgress(percentage);
    }
    console.log(`Preload progress: ${percentage}% (${loadedAssets}/${totalAssets})`);
  };
  
  try {
    // First, preload all essential 3D models (wait for them to complete)
    console.log("Starting model preloading...");
    const modelPromises = modelPaths.map(path => {
      return preloadModel(path)
        .then(() => {
          updateProgress();
        })
        .catch(error => {
          console.warn(`Error preloading model ${path}:`, error);
          updateProgress(); // Count as loaded even on error
        });
    });
    
    // Wait for all models to finish loading before proceeding
    await Promise.all(modelPromises);
    console.log("Finished preloading models");
    
    // Then preload images (these are less critical)
    console.log("Starting image preloading...");
    const imagePromises = imageUrls.map(url => {
      return preloadImage(url)
        .then(() => {
          updateProgress();
        })
        .catch(error => {
          console.warn(`Error preloading image ${url}:`, error);
          updateProgress(); // Count as loaded even on error
        });
    });
    
    await Promise.all(imagePromises);
    console.log("Finished preloading images");
    
  } catch (error) {
    console.error("Error during preloading:", error);
    // Make sure we report completion even if there was an error
    if (onProgress) {
      onProgress(100);
    }
  }
}; 
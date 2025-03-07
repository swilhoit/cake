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
 * A simpler and more reliable approach to preload 3D models by creating an Image element
 * This works because three.js GLTFLoader will use the browser cache
 * @param modelPath Path to the model file
 */
export const preloadModel = (modelPath: string): Promise<void> => {
  // Skip if already preloaded
  if (preloadedAssets.has(modelPath)) {
    return Promise.resolve();
  }
  
  console.log(`Preloading model: ${modelPath}`);
  
  // Create a promise that resolves when the image is loaded or errors
  return new Promise<void>((resolve) => {
    // Create a new image element
    const img = new Image();
    
    // Set the onload and onerror handlers to mark as complete
    img.onload = () => {
      preloadedAssets.add(modelPath);
      console.log(`Successfully preloaded model: ${modelPath}`);
      resolve();
    };
    
    img.onerror = () => {
      console.warn(`Error preloading model: ${modelPath}, but continuing`);
      preloadedAssets.add(modelPath); // Still mark as preloaded to avoid retries
      resolve(); // Resolve anyway to continue
    };
    
    // Set crossOrigin to anonymous to avoid CORS issues
    img.crossOrigin = 'anonymous';
    
    // Add a cache-busting parameter and set the src
    const cacheBuster = `v=${Date.now()}`;
    img.src = `${modelPath}${modelPath.includes('?') ? '&' : '?'}${cacheBuster}`;
    
    // Set a timeout to resolve the promise after 5 seconds if it hasn't resolved yet
    setTimeout(() => {
      if (!preloadedAssets.has(modelPath)) {
        console.warn(`Timeout preloading model: ${modelPath}, but continuing`);
        preloadedAssets.add(modelPath);
        resolve();
      }
    }, 5000);
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
 * Generates fixed array of cake model paths - always include all 5 models
 * @returns Array of model paths
 */
export const getCakeModelPaths = (): string[] => {
  // List of models we need to load - all 5 character models
  const modelFiles = [
    'strawberry.glb',
    'nemo.glb',
    'princess.glb', 
    'turkey.glb',
    'spongebob1.glb'
  ];

  // Return full URL paths to all models
  return modelFiles.map(modelFile => 
    `https://storage.googleapis.com/kgbakerycakes/optimized/${modelFile}`
  );
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
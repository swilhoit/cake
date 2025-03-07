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
 * Preloads a 3D model file (GLTF) using fetch
 * @param modelPath Path to the model file
 */
export const preloadModel = (modelPath: string): Promise<void> => {
  // Skip if already preloaded
  if (preloadedAssets.has(modelPath)) {
    return Promise.resolve();
  }
  
  return fetch(modelPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to preload model: ${modelPath}`);
      }
      preloadedAssets.add(modelPath);
    })
    .catch(error => {
      console.warn('Error preloading model:', error);
      // Continue even if we couldn't preload this model
      return Promise.resolve();
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
 * Generates an array of cake model paths based on product IDs
 * @param productIds Array of product IDs
 * @returns Array of model paths
 */
export const getCakeModelPaths = (productIds: (string | number)[]): string[] => {
  return productIds.map(id => {
    let modelId = String(id);
    if (modelId.includes('product-')) {
      modelId = modelId.replace('product-', '');
    }
    // Assuming the model path format
    return `/models/cake${modelId}.gltf`;
  });
};

/**
 * Preloads critical assets for the site
 * @param options Configuration options
 */
export const preloadCriticalAssets = async (
  options: {
    imageUrls?: string[];
    productIds?: (string | number)[];
    onProgress?: (progress: number) => void;
  } = {}
): Promise<void> => {
  const { imageUrls = [], productIds = [], onProgress } = options;
  
  // Calculate total assets to preload
  const modelPaths = getCakeModelPaths(productIds);
  const totalAssets = imageUrls.length + modelPaths.length;
  let loadedAssets = 0;
  
  const updateProgress = () => {
    loadedAssets++;
    if (onProgress) {
      onProgress((loadedAssets / totalAssets) * 100);
    }
  };
  
  // Start preloading images
  imageUrls.forEach(url => {
    preloadImage(url)
      .then(updateProgress)
      .catch(() => updateProgress()); // Count as loaded even on error
  });
  
  // Start preloading models
  modelPaths.forEach(path => {
    preloadModel(path)
      .then(updateProgress)
      .catch(() => updateProgress()); // Count as loaded even on error
  });
}; 
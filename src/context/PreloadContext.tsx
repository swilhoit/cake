import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the interface for our context
interface PreloadContextType {
  isLoading: boolean;
  progress: number;
  registerResource: (id: string) => void;
  markResourceLoaded: (id: string) => void;
  resourceCount: number;
  loadedCount: number;
}

// Default context value when not inside a provider
const defaultContext: PreloadContextType = {
  isLoading: true,
  progress: 0,
  registerResource: () => {},
  markResourceLoaded: () => {},
  resourceCount: 0,
  loadedCount: 0
};

const PreloadContext = createContext<PreloadContextType>(defaultContext);

// Custom hook to access the preload context
export const usePreload = () => useContext(PreloadContext);

interface PreloadProviderProps {
  children: React.ReactNode;
  minimumLoadingTime?: number; // Minimum time to show loading screen (ms)
}

export const PreloadProvider: React.FC<PreloadProviderProps> = ({ 
  children, 
  minimumLoadingTime = 1500 // Default minimum time
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [resources, setResources] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);
  const [loadCompletionTime, setLoadCompletionTime] = useState<number | null>(null);
  
  // Calculate resource counts
  const resourceCount = Object.keys(resources).length;
  const loadedCount = Object.values(resources).filter(loaded => loaded).length;

  // Register a resource that needs to be loaded
  const registerResource = (id: string) => {
    setResources(prev => {
      // Only add if not already registered
      if (prev[id] === undefined) {
        return {
          ...prev,
          [id]: false // Initially not loaded
        };
      }
      return prev;
    });
  };

  // Mark a resource as loaded
  const markResourceLoaded = (id: string) => {
    setResources(prev => {
      // Only update if the resource exists and is not already loaded
      if (prev[id] !== undefined && prev[id] === false) {
        return {
          ...prev,
          [id]: true // Mark as loaded
        };
      }
      return prev;
    });
  };

  // Calculate loading progress whenever resources change
  useEffect(() => {
    if (resourceCount === 0) {
      setProgress(0);
      return;
    }
    
    const calculatedProgress = (loadedCount / resourceCount) * 100;
    setProgress(calculatedProgress);
    
    // Check if loading is complete
    if (loadedCount === resourceCount && resourceCount > 0) {
      if (!loadCompletionTime) {
        setLoadCompletionTime(Date.now());
      }
    }
  }, [resources, resourceCount, loadedCount, loadCompletionTime]);

  // Control when to hide the loading screen based on minimum time
  useEffect(() => {
    if (loadCompletionTime) {
      const timeElapsed = Date.now() - loadCompletionTime;
      const remainingTime = Math.max(0, minimumLoadingTime - timeElapsed);
      
      // If we've reached the minimum loading time, hide the loading screen
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
      
      return () => clearTimeout(timer);
    }
  }, [loadCompletionTime, minimumLoadingTime]);

  // Register an initial resource to ensure loading screen shows
  useEffect(() => {
    registerResource('initial-app-load');
    
    // Set a timeout to ensure the loading screen is shown for at least the minimum time
    const timer = setTimeout(() => {
      markResourceLoaded('initial-app-load');
    }, minimumLoadingTime * 0.5); // Mark halfway through minimum time
    
    return () => clearTimeout(timer);
  }, [minimumLoadingTime]);

  return (
    <PreloadContext.Provider
      value={{
        isLoading,
        progress,
        registerResource,
        markResourceLoaded,
        resourceCount,
        loadedCount
      }}
    >
      {children}
    </PreloadContext.Provider>
  );
}; 
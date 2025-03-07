import React, { useState, useEffect } from 'react';
import { usePreload } from '../context/PreloadContext';

// Global variable to track if main loader is active
// Using a more robust approach with a getter/setter
let _mainLoaderActive = true;
export const getMainLoaderActive = () => _mainLoaderActive;
export const setMainLoaderActive = (value: boolean) => {
  _mainLoaderActive = value;
  // Dispatch a custom event when the loader state changes
  window.dispatchEvent(new CustomEvent('loaderStateChange', { detail: { active: value } }));
};
// For backward compatibility
export let mainLoaderActive = true;
Object.defineProperty(window, 'mainLoaderActive', {
  get: () => getMainLoaderActive(),
  set: (value) => setMainLoaderActive(value)
});

const LoadingScreen: React.FC = () => {
  const { isLoading, progress } = usePreload();
  const [currentTip, setCurrentTip] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progressComplete, setProgressComplete] = useState(false);
  
  const loadingTips = [
    "Did you know? Our 3D cake models are rendered in real-time.",
    "Each cake is handcrafted with love and attention to detail.",
    "Try rotating the cake models to see them from all angles.",
    "Our bestseller is the Triple Chocolate Delight cake.",
    "You can customize any cake for your special occasion.",
    "We use only the finest ingredients in all our cakes.",
    "Our cakes can be delivered within a 30-mile radius.",
    "Check out our monthly special flavors in the shop!"
  ];
  
  // Force exit if progress is 100% and loading is stuck
  useEffect(() => {
    if (progress >= 100) {
      setProgressComplete(true);
      
      // Force exit after 2 seconds if loading state is stuck
      const forceExitTimer = setTimeout(() => {
        if (isLoading) {
          console.log("Forcing loader exit after 100% completion");
          setIsExiting(true);
          
          const hideTimer = setTimeout(() => {
            setShowLoader(false);
            setMainLoaderActive(false);
          }, 800);
          
          return () => clearTimeout(hideTimer);
        }
      }, 2000);
      
      return () => clearTimeout(forceExitTimer);
    }
  }, [progress, isLoading]);
  
  // Update global variable when loading state changes
  useEffect(() => {
    setMainLoaderActive(isLoading);
    
    // Ensure we clean up properly when component unmounts
    return () => {
      setMainLoaderActive(false);
    };
  }, [isLoading]);
  
  // Handle hiding the loader with animation
  useEffect(() => {
    if (!isLoading && !isExiting) {
      console.log("Starting exit animation for loader");
      // Start exit animation
      setIsExiting(true);
      
      // Set a timeout to allow the exit animation to complete
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 800); // Match animation duration
      return () => clearTimeout(timer);
    } else if (isLoading && !progressComplete) {
      setIsExiting(false);
      setShowLoader(true);
    }
  }, [isLoading, isExiting, progressComplete]);
  
  // Rotate through tips every 3 seconds while loading
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isLoading, loadingTips.length]);
  
  // Don't render anything if not showing
  if (!showLoader) return null;
  
  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center ${
        isExiting ? 'animate-slide-down' : 'animate-slide-up'
      }`}
      style={{ 
        background: 'linear-gradient(-45deg, rgba(250, 220, 245, 1), rgba(220, 245, 250, 1), rgba(220, 250, 230, 1), rgba(245, 250, 220, 1))',
        backgroundSize: '400% 400%',
        animation: `gradient 15s ease infinite${isExiting ? '' : ', slideUp 0.8s ease-out forwards'}`,
        backdropFilter: 'blur(5px)'
      }}
    >
      <div className="container max-w-md mx-auto px-4 text-center">
        <div className="mb-8">
          {/* KG Bakery Logo */}
          <div className="flex justify-center items-center">
            <img 
              src="/KG_Logo.gif" 
              alt="KG Bakery"
              className="h-20 w-auto object-contain" 
            />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-pink-600">KG Bakery</h1>
        <p className="text-gray-600 mb-2">
          {progressComplete ? "Ready to explore our delicious cakes!" : "Preparing your cake experience..."}
        </p>
        
        <div className="h-12 flex items-center justify-center mb-4">
          <p className="text-sm text-gray-500 italic">{loadingTips[currentTip]}</p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div 
            className={`${progressComplete ? 'animate-flash-green' : 'bg-pink-500'} h-2.5 rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${Math.max(5, progress)}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-500">{Math.round(progress)}% loaded</p>
        
        {progressComplete && (
          <button 
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => setShowLoader(false), 800);
              setMainLoaderActive(false);
            }}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
          >
            Enter Site
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen; 
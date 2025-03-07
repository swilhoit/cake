import React, { useState, useEffect } from 'react';
import { usePreload } from '../context/PreloadContext';

// Global variable to track if main loader is active
export let mainLoaderActive = true;

const LoadingScreen: React.FC = () => {
  const { isLoading, progress } = usePreload();
  const [currentTip, setCurrentTip] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progressComplete, setProgressComplete] = useState(false);
  
  // Update global variable when loading state changes
  useEffect(() => {
    mainLoaderActive = isLoading;
    return () => {
      mainLoaderActive = false;
    };
  }, [isLoading]);
  
  // Check if progress is complete and trigger green flash
  useEffect(() => {
    if (progress >= 100) {
      setProgressComplete(true);
    }
  }, [progress]);
  
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
  
  // Rotate through tips every 3 seconds while loading
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isLoading, loadingTips.length]);
  
  // Handle hiding the loader with animation
  useEffect(() => {
    if (!isLoading && !isExiting) {
      // Start exit animation
      setIsExiting(true);
      
      // Set a timeout to allow the exit animation to complete
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 800); // Match animation duration
      return () => clearTimeout(timer);
    } else if (isLoading) {
      setIsExiting(false);
      setShowLoader(true);
    }
  }, [isLoading, isExiting]);
  
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
        <p className="text-gray-600 mb-2">Preparing your cake experience...</p>
        
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
      </div>
    </div>
  );
};

export default LoadingScreen; 
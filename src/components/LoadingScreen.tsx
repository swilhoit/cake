import React, { useState, useEffect } from 'react';
import { usePreload } from '../context/PreloadContext';

const LoadingScreen: React.FC = () => {
  const { isLoading, progress } = usePreload();
  const [currentTip, setCurrentTip] = useState(0);
  
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
  
  // Don't render anything if not loading
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="container max-w-md mx-auto px-4 text-center">
        <div className="mb-8">
          {/* Spinning cake icon */}
          <div className="inline-block animate-spin">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#F9A8D4"/>
              <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="#EC4899"/>
              <path d="M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#BE185D"/>
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-pink-600">Sweet Delights Bakery</h1>
        <p className="text-gray-600 mb-2">Preparing your cake experience...</p>
        
        <div className="h-12 flex items-center justify-center mb-4">
          <p className="text-sm text-gray-500 italic">{loadingTips[currentTip]}</p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div 
            className="bg-pink-500 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-500">{Math.round(progress)}% loaded</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 
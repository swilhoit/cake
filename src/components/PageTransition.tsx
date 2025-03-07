import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'in' | 'out'>('in');
  const [transitionType, setTransitionType] = useState<'fade' | 'slide'>('fade');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Determine if we're transitioning to or from a product page
      const isProductPath = (path: string) => path.startsWith('/product/');
      const isProductTransition = isProductPath(location.pathname) || isProductPath(displayLocation.pathname);
      
      // Set transition type based on whether it's a product page
      setTransitionType(isProductTransition ? 'slide' : 'fade');
      
      // Start transition out
      setTransitionStage('out');
      
      // After animation completes, change the content and animate in
      setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('in');
      }, 300); // Match this with CSS transition duration
    }
  }, [location, displayLocation]);

  // Determine transition classes based on type and stage
  const getTransitionClasses = () => {
    if (transitionType === 'fade') {
      return `transition-opacity duration-300 ease-in-out ${
        transitionStage === 'in' ? 'opacity-100' : 'opacity-0'
      }`;
    } else { // slide transition
      return `transition-all duration-300 ease-in-out overflow-hidden ${
        transitionStage === 'in' 
          ? 'transform-none opacity-100' 
          : location.pathname.startsWith('/product/') 
            ? 'translate-x-full opacity-0' 
            : '-translate-x-full opacity-0'
      }`;
    }
  };

  return (
    <div className={getTransitionClasses()}>
      {children}
    </div>
  );
} 
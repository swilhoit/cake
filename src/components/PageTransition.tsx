import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

// Define different transition types
type TransitionDirection = 'left' | 'right' | 'up' | 'down' | 'fade' | 'scale';

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'in' | 'out'>('in');
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>('fade');
  const [isNewPage, setIsNewPage] = useState(false);

  // Determine the transition direction based on route change
  const getTransitionDirection = (from: string, to: string): TransitionDirection => {
    // Home page transitions
    if (from === '/' && to.startsWith('/product/')) return 'left';
    if (from === '/' && to === '/shop') return 'up';
    if (from === '/' && to === '/about') return 'right';
    
    // Shop page transitions
    if (from === '/shop' && to === '/') return 'down';
    if (from === '/shop' && to.startsWith('/product/')) return 'left';
    if (from === '/shop' && to === '/about') return 'right';
    
    // Product page transitions
    if (from.startsWith('/product/') && to === '/') return 'left';
    if (from.startsWith('/product/') && to === '/shop') return 'right';
    if (from.startsWith('/product/') && to === '/about') return 'right';
    if (from.startsWith('/product/') && to.startsWith('/product/') && from !== to) return 'fade';
    
    // About page transitions
    if (from === '/about' && to === '/') return 'left';
    if (from === '/about' && to === '/shop') return 'left';
    if (from === '/about' && to.startsWith('/product/')) return 'left';
    
    // Default transition
    return 'fade';
  };

  // Get the opposite direction for the incoming page
  const getOppositeDirection = (direction: TransitionDirection): TransitionDirection => {
    switch (direction) {
      case 'left': return 'right';
      case 'right': return 'left';
      case 'up': return 'down';
      case 'down': return 'up';
      default: return direction; // fade and scale remain the same
    }
  };

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Determine direction for exit animation
      const exitDirection = getTransitionDirection(
        displayLocation.pathname, 
        location.pathname
      );
      
      // Set the exit direction
      setTransitionDirection(exitDirection);
      setIsNewPage(false);
      
      // Start transition out
      setTransitionStage('out');
      
      // After exit animation completes, change the content and animate in 
      // from the opposite direction
      setTimeout(() => {
        setDisplayLocation(location);
        setTransitionDirection(getOppositeDirection(exitDirection));
        setIsNewPage(true);
        setTransitionStage('in');
      }, 300); // Match this with CSS transition duration
    }
  }, [location, displayLocation]);

  // Get classes for the transition animation based on direction and stage
  const getTransitionClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out overflow-hidden';
    const inState = transitionStage === 'in';
    
    // When we're dealing with a new page coming in, we need to use the opposite transform
    // from what the previous page used to exit
    const transformValue = (() => {
      // Default transform for "out" stage
      if (!inState) {
        switch (transitionDirection) {
          case 'left': return '-translate-x-full';
          case 'right': return 'translate-x-full';
          case 'up': return '-translate-y-full';
          case 'down': return 'translate-y-full';
          case 'scale': return 'scale-75';
          case 'fade':
          default: return '';
        }
      } 
      // For "in" stage, no transform needed as it's the normal state
      else {
        return 'transform-none';
      }
    })();
    
    // For the initial position of new pages coming in
    const initialTransform = isNewPage && transitionStage === 'in' ? 'transform-gpu' : '';
    
    switch (transitionDirection) {
      case 'fade':
        return `${baseClasses} ${inState ? 'opacity-100' : 'opacity-0'}`;
      
      case 'scale':
        return `${baseClasses} ${initialTransform} ${
          inState ? 'opacity-100 transform-none' : `opacity-0 ${transformValue}`
        }`;
        
      default: // All directional slides
        return `${baseClasses} ${initialTransform} ${
          inState ? 'opacity-100 transform-none' : `opacity-0 ${transformValue}`
        }`;
    }
  };

  return (
    <div className={getTransitionClasses()}>
      {children}
    </div>
  );
} 
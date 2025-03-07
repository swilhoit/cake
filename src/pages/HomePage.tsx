import { Link, useNavigate } from 'react-router-dom';
import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useShopContext } from '../context/ShopContext';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF } from '@react-three/drei';
import Model3D from '../components/Model3D';
import * as THREE from 'three';
import React from 'react';
import { mainLoaderActive } from '../components/LoadingScreen';

// Global WebGL context manager to prevent exceeding browser limits
const WebGLContextManager = {
  maxContexts: 8, // Most browsers limit to around 8-16 contexts
  activeContexts: 0,
  canCreateContext: function() {
    return this.activeContexts < this.maxContexts;
  },
  addContext: function() {
    this.activeContexts += 1;
    console.log(`WebGL Context Added: ${this.activeContexts}/${this.maxContexts}`);
    return this.activeContexts;
  },
  removeContext: function() {
    if (this.activeContexts > 0) {
      this.activeContexts -= 1;
      console.log(`WebGL Context Removed: ${this.activeContexts}/${this.maxContexts}`);
    }
    return this.activeContexts;
  }
};

// Mock product data for when Shopify products aren't available
export const mockProducts = [
  { 
    id: 'gid://shopify/Product/1', 
    title: 'Premium Chocolate Cake', 
    description: 'Rich chocolate cake with ganache frosting',
    variants: [{ id: 'variant1', price: '29.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/2', 
    title: 'Vanilla Birthday Cake', 
    description: 'Classic vanilla cake with buttercream frosting',
    variants: [{ id: 'variant2', price: '24.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/3', 
    title: 'Red Velvet Deluxe', 
    description: 'Elegant red velvet cake with cream cheese frosting',
    variants: [{ id: 'variant3', price: '34.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1562777717-dc6984f65a63?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/4', 
    title: 'Strawberry Shortcake', 
    description: 'Light sponge cake with fresh strawberries and whipped cream',
    variants: [{ id: 'variant4', price: '27.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/5', 
    title: 'Lemon Drizzle Cake', 
    description: 'Zesty lemon cake with sweet glaze',
    variants: [{ id: 'variant5', price: '25.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1514910457252-414ca0d56c0a?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/6', 
    title: 'Carrot Walnut Cake', 
    description: 'Moist carrot cake with walnuts and cream cheese frosting',
    variants: [{ id: 'variant6', price: '28.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/7', 
    title: 'Black Forest Gateau', 
    description: 'German classic with chocolate, cherries, and whipped cream',
    variants: [{ id: 'variant7', price: '32.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/8', 
    title: 'Coconut Paradise Cake', 
    description: 'Coconut cake with coconut cream and toasted coconut flakes',
    variants: [{ id: 'variant8', price: '31.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/9', 
    title: 'Tiramisu Delight', 
    description: 'Coffee-soaked layers with mascarpone cream and cocoa dusting',
    variants: [{ id: 'variant9', price: '36.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/10', 
    title: 'Matcha Green Tea Cake', 
    description: 'Delicate matcha-flavored cake with white chocolate accents',
    variants: [{ id: 'variant10', price: '33.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1592151675528-1a0c09dde9e2?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/11', 
    title: 'Black Forest Gateau', 
    description: 'Cherry-filled chocolate cake with whipped cream and kirsch',
    variants: [{ id: 'variant11', price: '35.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500&auto=format" }]
  },
  { 
    id: 'gid://shopify/Product/12', 
    title: 'Honey Lavender Cake', 
    description: 'Aromatic lavender cake with honey buttercream and candied flowers',
    variants: [{ id: 'variant12', price: '37.99' }],
    images: [{ src: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&auto=format" }]
  }
];

// Enhanced function to detect device capabilities
const getDeviceCapabilities = (): { isMobile: boolean, shouldUseImages: boolean, dpr: [number, number] } => {
  if (typeof window === 'undefined') {
    return { isMobile: false, shouldUseImages: false, dpr: [1, 2] };
  }
  
  // Check if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Get hardware concurrency (CPU cores)
  const cpuCores = window.navigator.hardwareConcurrency || 0;
  
  // Check for device memory (in GB)
  const deviceMemory = (navigator as any).deviceMemory || 0;
  
  // Determine if we should use images instead of 3D models based on device capability
  // Be EXTRA conservative with low-end devices ONLY
  const shouldUseImages = 
    // Use images only for very low-end devices (1-2 cores, <1GB RAM)
    (cpuCores < 2 || deviceMemory < 1);
  
  // Set appropriate device pixel ratio based on device capability
  const dpr: [number, number] = isMobile ? [1, 1.5] : [1, 2];
  
  return { isMobile, shouldUseImages, dpr };
};

// Model loading fallback component
function ModelLoadingFallback() {
  // Don't show if the main loader is active
  if (mainLoaderActive) return null;
  
  return (
    <Html center>
      <div className="flex items-center justify-center">
        <div className="text-sm text-blue-500 px-3 py-2 rounded-full" style={{ background: 'transparent' }}>
          Loading model...
        </div>
      </div>
    </Html>
  );
}

// Product card with 3D model
function ProductCard({ product }: { product: any }) {
  const { addToCart } = useShopContext();
  const [isVisible, setIsVisible] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const { isMobile, shouldUseImages, dpr } = getDeviceCapabilities();
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [scaleValue, setScaleValue] = useState(1.3);
  const [containerScale, setContainerScale] = useState(1);
  const [rotationSpeed, setRotationSpeed] = useState(isMobile ? 0.003 : 0.005);
  const [inViewport, setInViewport] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Extract product ID from the Shopify handle or use a default ID
  const productId = product.id ? parseInt(product.id.split('/').pop() || '1', 10) : 1;

  // Setup intersection observer to detect when card is in viewport
  useEffect(() => {
    if (!cardRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // Only set to visible if actually in viewport AND we can create a context
        if (entries[0].isIntersecting && WebGLContextManager.canCreateContext()) {
          setInViewport(true);
        } else {
          setInViewport(false);
        }
      },
      { threshold: 0.1 } // Trigger when at least 10% of the element is visible
    );

    observer.observe(cardRef.current);
    
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // For performance on mobile, we might want to use images instead of 3D models
  useEffect(() => {
    // If we should use images based on device capability, set fallback image
    if (shouldUseImages || !WebGLContextManager.canCreateContext()) {
      setUseFallbackImage(true);
      return;
    }
    
    // Only show the model if in viewport and after a delay
    if (inViewport) {
      const delay = isMobile ? 200 : 50;
      
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isMobile, shouldUseImages, inViewport]);

  // Clean up when component unmounts or is not in viewport
  useEffect(() => {
    return () => {
      if (!inViewport && isVisible) {
        setIsVisible(false);
      }
    };
  }, [inViewport, isVisible]);

  // Smooth transition for scale and rotation values using useSpring-like approach
  useEffect(() => {
    // Only run animations if actually in viewport
    if (!inViewport) return;
    
    let frameId: number;
    const targetScale = isHovered ? 2.0 : 1.3;
    const targetContainerScale = isHovered ? 1.2 : 1;
    const targetRotationSpeed = isHovered ? 0.01 : (isMobile ? 0.003 : 0.005);
    const duration = 600; // ms
    const startTime = performance.now();
    const startScale = scaleValue;
    const startContainerScale = containerScale;
    const startRotationSpeed = rotationSpeed;
    
    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Cubic bezier easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate between start and target values
      const newScale = startScale + (targetScale - startScale) * eased;
      const newContainerScale = startContainerScale + (targetContainerScale - startContainerScale) * eased;
      const newRotationSpeed = startRotationSpeed + (targetRotationSpeed - startRotationSpeed) * eased;
      
      setScaleValue(newScale);
      setContainerScale(newContainerScale);
      setRotationSpeed(newRotationSpeed);
      
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };
    
    frameId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(frameId);
  }, [isHovered, isMobile, inViewport]);

  // Handle 3D model error with retry mechanism
  const handleModelError = () => {
    console.log(`Model error for product ${productId}, retry: ${retryCount}`);
    setModelError(true);
    
    // In production with CORS errors, try a couple of times then fallback
    const maxRetries = 3;
    
    // Try several times to load the model with increasing delays
    if (retryCount < maxRetries) {
      const retryDelay = (retryCount + 1) * 500; // 500ms, 1000ms, 1500ms
      
      setTimeout(() => {
        console.log(`Retrying model load for product ${productId}, attempt ${retryCount + 1}/${maxRetries}`);
        setModelError(false);
        setRetryCount(prev => prev + 1);
      }, retryDelay);
    } else {
      // After retries, fall back to image
      console.log(`Falling back to image for product ${productId} after ${maxRetries} failed attempts`);
      setUseFallbackImage(true);
    }
  };

  const handleAddToCart = () => {
    console.log("Adding to cart:", product.title, "variant:", product.variants[0].id);
    addToCart(product.variants[0].id, 1);
  };

  // Get fallback image URL with better error handling
  const getFallbackImageUrl = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    
    // Use CDN images instead of local placeholders since local files are empty
    const placeholders = [
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format", // Chocolate cake
      "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=500&auto=format", // Birthday cake
      "https://images.unsplash.com/photo-1562777717-dc6984f65a63?w=500&auto=format", // Strawberry cake
      "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=500&auto=format"  // Fancy cake
    ];
    
    return placeholders[productId % placeholders.length];
  };

  // Navigate to the product page
  const goToProductPage = () => {
    navigate(`/product/${product.id.split('/').pop()}`);
  };

  return (
    <div 
      ref={cardRef}
      onClick={goToProductPage} 
      className="relative h-80 w-full cursor-pointer overflow-visible" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(useFallbackImage || !inViewport) ? (
        <img 
          src={getFallbackImageUrl()} 
          alt={product.title} 
          className="w-full h-full object-contain transition-transform duration-500 ease-out"
          style={{ transform: `scale(${isHovered ? 1.5 : 1})` }}
        />
      ) : isVisible && (
        <Canvas
          camera={{ position: [0, 0, 4.0], fov: 30 }}
          dpr={dpr}
          gl={{ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false, // Disable unless needed for screenshots
            powerPreference: 'default',
            depth: true,
            stencil: false // Disable stencil buffer to save memory
          }}
          frameloop="demand" // Only render when needed
          className="touch-auto"
          style={{ 
            background: 'transparent',
            touchAction: 'none',
            overflow: 'visible',
            transition: 'transform 0.3s ease-out',
            transform: `scale(${containerScale})`
          }}
          onCreated={({ gl }) => {
            // Enable memory optimizations - use proper THREE.js APIs
            // Set sensible WebGL parameters
            gl.setPixelRatio(window.devicePixelRatio || 1);
            gl.setSize(gl.domElement.clientWidth, gl.domElement.clientHeight);
          }}
        >
          {/* Simple lighting setup */}
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.0} />
          <spotLight position={[-10, 10, 10]} intensity={0.8} />
          
          <Suspense fallback={<ModelLoadingFallback />}>
            <Model3D 
              productId={productId} 
              scale={scaleValue}
              rotationSpeed={rotationSpeed}
            />
          </Suspense>
        </Canvas>
      )}
      
      {/* Product info overlay */}
      <div className="absolute bottom-0 left-0 w-full bg-white bg-opacity-80 p-2">
        <h3 className="text-lg font-bold">{product.title}</h3>
        <p className="text-sm text-gray-700">
          ${parseFloat(product.variants[0].price).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// Define the keyframes as string constants
const SPIN_RIGHT_KEYFRAMES = `
@keyframes spin-right {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

const SPIN_LEFT_KEYFRAMES = `
@keyframes spin-left {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}
`;

// Add a component to inject the styles
function AnimationStyles() {
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = SPIN_RIGHT_KEYFRAMES + SPIN_LEFT_KEYFRAMES;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return null;
}

export default function HomePage() {
  const { products, loading } = useShopContext();
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  
  useEffect(() => {
    // If there are Shopify products, use them; otherwise, use mock data
    if (!loading && products && products.length > 0) {
      setDisplayedProducts(products);
      console.log("Using Shopify products:", products.length);
    } else if (!loading) {
      setDisplayedProducts(mockProducts);
      console.log("Using mock products since no Shopify products available");
    }
  }, [products, loading]);
  
  return (
    <div className="container mx-auto px-4 pb-12">
      {/* Inject the animation styles */}
      <AnimationStyles />
      
      {/* Product Grid Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedProducts.map((product: any, index: number) => (
                <div 
                  key={product.id} 
                  className="opacity-0" 
                  style={{ 
                    animation: `modelScaleIn 1.2s ease-out forwards`,
                    animationDelay: `${0.1 + index * 0.15}s`
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
          
          {displayedProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600">No products available at the moment.</p>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link 
              to="/shop" 
              className="inline-block bg-button-gradient text-gray-800 font-medium px-6 py-3 rounded-md hover:opacity-90 transition shadow-sm"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>
      
      {/* Banh Mi Marquee Section with yellow background - Simplified to 1 line */}
      <section className="py-4 bg-yellow-300 my-8 overflow-visible animate-marquee-slide-in">
        <h2 className="sr-only">Banh Mi Section</h2>
        
        {/* Marquee Container - Single line only - REDUCED NUMBER OF ITEMS */}
        <div className="marquee-container relative w-full overflow-visible">
          {/* Single Marquee - Left to Right - FASTER speed - REDUCED repetitions */}
          <div className="marquee-content flex animate-marquee-fast overflow-visible" style={{ paddingLeft: '100%' }}>
            {/* Reduced to just 5 repetitions to avoid too many elements */}
            {Array.from({ length: 5 }).map((_, index) => (
              <React.Fragment key={`banh-left-${index}`}>
                <div className="h-32 w-32 mx-2 overflow-visible">
                  <BanhMiModelSmall rotateRight={index % 2 === 0} />
                </div>
                <div className="flex items-center mx-2">
                  <h3 className="text-4xl font-black text-black whitespace-nowrap font-rubik">
                    WE HAVE BANH MIS!
                  </h3>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Modify the BanhMiModelSmall component to use much simpler image fallback
function BanhMiModelSmall({ rotateRight }: { rotateRight: boolean }) {
  // Disable 3D models in the marquee completely - using images is much more reliable
  // for this high-volume element that doesn't need interaction
  return (
    <div className="w-full h-full flex items-center justify-center">
      <img 
        src="https://storage.googleapis.com/kgbakerycakes/banh-mi-2d.png" 
        alt="Banh Mi" 
        className="w-5/6 h-5/6 object-contain" 
        style={{ 
          transform: `rotate(${rotateRight ? 10 : -10}deg)`,
          animation: `${rotateRight ? 'spin-right' : 'spin-left'} 10s infinite linear`
        }}
      />
    </div>
  );
}

// Modify the RotatingModel component to use the WebGL context manager
function RotatingModel({ url, rotateRight, onLoadFailed }: { 
  url: string, 
  rotateRight: boolean,
  onLoadFailed: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [meshReady, setMeshReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const contextIdRef = useRef<number | null>(null);
  
  // Register this component with the WebGL context manager
  useEffect(() => {
    if (!WebGLContextManager.canCreateContext()) {
      console.log("Maximum WebGL contexts reached, cannot create a new context");
      onLoadFailed();
      return;
    }
    
    contextIdRef.current = WebGLContextManager.addContext();
    
    return () => {
      if (contextIdRef.current !== null) {
        WebGLContextManager.removeContext();
        contextIdRef.current = null;
      }
    };
  }, [onLoadFailed]);
  
  // Only start loading if we got a valid context
  useEffect(() => {
    if (contextIdRef.current !== null) {
      // Stagger the loading with a short delay
      const timer = setTimeout(() => {
        setMeshReady(true);
      }, Math.random() * 200);
      
      return () => clearTimeout(timer);
    }
  }, [contextIdRef.current]);

  // Load model with error handling
  const { scene } = useGLTF(meshReady ? url : '');

  // Handle errors if no scene is loaded
  useEffect(() => {
    if (!scene && meshReady) {
      console.error("Model error: No scene available");
      onLoadFailed();
    }
  }, [scene, meshReady, onLoadFailed]);

  // Mark when model is successfully loaded
  useEffect(() => {
    if (scene && !modelLoaded) {
      setModelLoaded(true);
    }
  }, [scene, modelLoaded]);

  // Clean up model resources on unmount
  useEffect(() => {
    return () => {
      // Properly clean up WebGL resources
      if (scene) {
        scene.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            if (mesh.geometry) {
              mesh.geometry.dispose();
            }
            
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(material => material.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [scene]);
  
  // Simple rotation animation with controlled frame rate
  useFrame(() => {
    if (meshRef.current && scene && modelLoaded) {
      meshRef.current.rotation.y += rotateRight ? 0.01 : -0.01;
    }
  });
  
  // Only render when model is ready
  if (!scene || !meshReady || contextIdRef.current === null) {
    return null;
  }
  
  // Render the model
  return (
    <mesh 
      ref={meshRef}
      scale={[1.8, 1.8, 1.8]}
      position={[0, -0.2, 0]}
    >
      <primitive object={scene} />
    </mesh>
  );
} 
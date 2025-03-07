import { Link, useNavigate } from 'react-router-dom';
import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useShopContext } from '../context/ShopContext';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF } from '@react-three/drei';
import Model3D from '../components/Model3D';
import * as THREE from 'three';
import React from 'react';
import { mainLoaderActive } from '../components/LoadingScreen';

// WebGL Context Manager to limit context creation
type WebGLContextManagerType = {
  maxContexts: number;
  activeContexts: number;
  canCreateContext: () => boolean;
  addContext: () => number;
  removeContext: () => number;
  resetContextCount: () => void;
};

// Create a global WebGL context manager
const WebGLContextManager: WebGLContextManagerType = {
  maxContexts: 4, // Limit the number of concurrent WebGL contexts
  activeContexts: 0,
  
  canCreateContext() {
    return this.activeContexts < this.maxContexts;
  },
  
  addContext() {
    if (this.activeContexts < this.maxContexts) {
      this.activeContexts += 1;
      console.log(`WebGL context added. Active contexts: ${this.activeContexts}/${this.maxContexts}`);
    } else {
      console.warn(`Cannot create WebGL context. Already at max (${this.maxContexts})`);
    }
    return this.activeContexts;
  },
  
  removeContext() {
    if (this.activeContexts > 0) {
      this.activeContexts -= 1;
      console.log(`WebGL context removed. Active contexts: ${this.activeContexts}/${this.maxContexts}`);
    }
    return this.activeContexts;
  },
  
  resetContextCount() {
    const oldCount = this.activeContexts;
    this.activeContexts = 0;
    console.log(`WebGL context count reset from ${oldCount} to 0`);
    return 0;
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
function ProductCard({ 
  product, 
  index,
  use3D = false
}: { 
  product: any, 
  index: number,
  use3D?: boolean 
}) {
  const { addToCart } = useShopContext();
  const [isVisible, setIsVisible] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const { isMobile, shouldUseImages, dpr } = getDeviceCapabilities();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [containerScale, setContainerScale] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Extract product ID from the Shopify handle or use a default ID
  const productId = product.id ? parseInt(product.id.split('/').pop() || '1', 10) : 1;

  console.log(`ProductCard for ID ${productId}: use3D=${use3D}, useFallbackImage=${useFallbackImage}`);

  // Force fallback to image if we're not using 3D
  useEffect(() => {
    if (!use3D || shouldUseImages) {
      setUseFallbackImage(true);
    }
  }, [use3D, shouldUseImages]);

  // Check for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          console.log(`ProductCard ${productId} is now in view`);
        } else {
          setIsInView(false);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [productId]);

  // Add a small delay before showing models to ensure DOM is ready
  useEffect(() => {
    if (use3D && !useFallbackImage) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500 + (index * 50)); // Stagger loading
      
      return () => clearTimeout(timer);
    }
  }, [use3D, useFallbackImage, index]);

  // Get appropriate fallback image URL
  const getFallbackImageUrl = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    return `/images/cakes/default.jpg`;
  };

  // Navigate to product page when clicked
  const goToProductPage = () => {
    const handle = product.handle || `product-${productId}`;
    navigate(`/product/${handle}`);
  };

  return (
    <div 
      ref={cardRef}
      onClick={goToProductPage} 
      className="relative h-80 w-full shadow-md rounded-lg overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {useFallbackImage ? (
        <img 
          src={getFallbackImageUrl()} 
          alt={product.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, use a colored background
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.style.backgroundColor = `hsl(${(productId * 30) % 360}, 70%, 80%)`;
          }}
        />
      ) : use3D && isVisible && isInView && (
        <div className="w-full h-full relative">
          <ModelCanvasInstance 
            productId={productId} 
            isHovered={isHovered} 
            fallbackText="Loading 3D model..."
          />
        </div>
      )}

      <div className="absolute bottom-0 left-0 w-full bg-white/80 backdrop-blur-sm p-3">
        <h3 className="text-lg font-semibold text-gray-800">{product.title}</h3>
        <div className="flex justify-between items-center mt-1">
          <p className="text-gray-700">${parseFloat(product.variants[0].price).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { products, loading } = useShopContext();
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [loaderDismissed, setLoaderDismissed] = useState(false);
  const [featuredProductId, setFeaturedProductId] = useState<number>(1);
  const [show3DModels, setShow3DModels] = useState(false);
  const [use3DForGrid, setUse3DForGrid] = useState(false);  // Default to false for performance
  
  // Monitor loading screen state
  useEffect(() => {
    // Force the mainLoaderActive flag to false if it's stuck
    if (!show3DModels) {
      console.log("Checking loading screen state, mainLoaderActive:", mainLoaderActive);
      
      // Check if the loading screen element exists in the DOM
      const loaderElement = document.querySelector('[class*="fixed inset-0 z-"]');
      const isLoaderVisible = !!loaderElement;
      
      if (!isLoaderVisible && mainLoaderActive) {
        console.log("Loading screen is not visible but mainLoaderActive is true, forcing to false");
        // eslint-disable-next-line
        (window as any).mainLoaderActive = false;
      }
      
      if (!mainLoaderActive || !isLoaderVisible) {
        console.log("Loading screen dismissed, enabling 3D models");
        WebGLContextManager.resetContextCount();
        setLoaderDismissed(true);
        setShow3DModels(true);
      }
    }
    
    // Re-check every 500ms until models are shown
    const checkInterval = setInterval(() => {
      if (!show3DModels) {
        const loaderElement = document.querySelector('[class*="fixed inset-0 z-"]');
        if (!loaderElement) {
          console.log("Loading screen no longer in DOM, enabling 3D models");
          WebGLContextManager.resetContextCount();
          setLoaderDismissed(true);
          setShow3DModels(true);
        }
      }
    }, 500);
    
    return () => clearInterval(checkInterval);
  }, [show3DModels]);
  
  // Reset WebGL contexts when component unmounts
  useEffect(() => {
    return () => {
      WebGLContextManager.resetContextCount();
    };
  }, []);
  
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
  
  // Rotate featured product every 10 seconds
  useEffect(() => {
    if (displayedProducts.length > 0 && show3DModels) {
      const interval = setInterval(() => {
        setFeaturedProductId(prev => {
          const next = (prev % displayedProducts.length) + 1;
          console.log(`Changing featured product to ID: ${next}`);
          return next;
        });
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [displayedProducts, show3DModels]);
  
  // Add a toggle for 3D models in the grid
  const toggle3DModels = useCallback(() => {
    setUse3DForGrid(prev => !prev);
    console.log("Toggled 3D models for product grid:", !use3DForGrid);
  }, [use3DForGrid]);
  
  return (
    <div className="container mx-auto px-4 pb-12">
      {/* Featured Product with 3D Model */}
      {!loading && displayedProducts.length > 0 && (show3DModels || !mainLoaderActive) && (
        <section className="py-8 my-4">
          <div className="bg-gray-50 rounded-xl shadow-lg overflow-hidden">
            <div className="container mx-auto px-4 py-8">
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Featured Cake</h2>
              <div className="flex flex-col md:flex-row items-center">
                {/* 3D Model Display */}
                <div className="md:w-1/2 h-80 relative mb-6 md:mb-0">
                  <div className="w-full h-full flex items-center justify-center" style={{ 
                    background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(240,240,245,1) 100%)'
                  }}>
                    <ModelCanvasInstance 
                      productId={featuredProductId} 
                      isHovered={false} 
                      fallbackText="Experience our 3D cakes on the product page!"
                    />
                  </div>
                </div>
                {/* Product Info */}
                <div className="md:w-1/2 md:pl-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    {displayedProducts[featuredProductId % displayedProducts.length]?.title || "Delicious Cake"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {displayedProducts[featuredProductId % displayedProducts.length]?.description || 
                      "Handcrafted with love and the finest ingredients for your special occasions."}
                  </p>
                  <p className="text-xl font-semibold text-pink-600 mb-6">
                    ${parseFloat(displayedProducts[featuredProductId % displayedProducts.length]?.variants[0].price || "29.99").toFixed(2)}
                  </p>
                  <Link 
                    to={`/product/${
                      displayedProducts[featuredProductId % displayedProducts.length]?.handle || 
                      `product-${featuredProductId}`
                    }`}
                    className="inline-block bg-pink-500 text-white font-medium px-6 py-3 rounded-md hover:bg-pink-600 transition shadow-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Product Grid Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Our Cakes</h2>
            
            {/* Add 3D toggle button */}
            <button 
              onClick={toggle3DModels}
              className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm ${
                use3DForGrid ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {use3DForGrid ? '3D: On' : '3D: Off'}
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedProducts.map((product: any, index: number) => (
                <div 
                  key={product.id} 
                  className="block" 
                >
                  <ProductCard 
                    product={product} 
                    index={index}
                    use3D={use3DForGrid}
                  />
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
              className="inline-block bg-pink-500 text-white font-medium px-6 py-3 rounded-md hover:bg-pink-600 transition shadow-md"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>
      
      {/* Banh Mi Marquee Section - Using simple images instead of 3D models */}
      <section className="py-4 bg-yellow-300 my-8">
        <h2 className="sr-only">Banh Mi Section</h2>
        
        {/* Marquee Container */}
        <div className="relative w-full overflow-hidden">
          {/* Marquee Content - Left to Right */}
          <div className="flex items-center animate-marquee whitespace-nowrap py-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <div className="flex items-center mx-4" key={`banh-item-${index}`}>
                <img 
                  src="/images/banh-mi.png" 
                  alt="Banh Mi" 
                  className={`h-16 w-auto ${index % 2 === 0 ? 'animate-spin-slow' : 'animate-spin-slow-reverse'}`}
                />
                <span className="text-2xl font-bold text-black mx-2">WE HAVE BANH MIS!</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Smaller Banh Mi model optimized for the marquee
function BanhMiModelSmall({ rotateRight }: { rotateRight: boolean }) {
  // Minimal state management
  const [modelError, setModelError] = useState(false);
  
  // Simple error handler
  const handleModelError = () => {
    console.error("Banh Mi model failed to load");
    setModelError(true);
  };
  
  // Use the correct Banh Mi model URL
  const modelUrl = "https://storage.googleapis.com/kgbakerycakes/banhmi.glb";
  
  // Simple Canvas with minimal configuration
  return (
    <Canvas
      camera={{ position: [0, 0, 4.0], fov: 30 }}
      gl={{ 
        antialias: true,
        alpha: true
      }}
      style={{ 
        background: 'transparent',
        overflow: 'visible'
      }}
    >
      {/* Basic lighting */}
      <ambientLight intensity={0.8} />
      <spotLight position={[5, 10, 5]} intensity={1.5} />
      
      <Suspense fallback={null}>
        <RotatingModel 
          url={modelUrl} 
          rotateRight={rotateRight} 
          onLoadFailed={handleModelError} 
        />
      </Suspense>
    </Canvas>
  );
}

// Simple rotating model component
function RotatingModel({ url, rotateRight, onLoadFailed }: { 
  url: string, 
  rotateRight: boolean,
  onLoadFailed: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Load the model directly
  let { scene } = useGLTF(url);
  
  // Handle errors
  if (!scene) {
    console.error("Failed to load model:", url);
    onLoadFailed();
    return null;
  }
  
  // Simple rotation animation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotateRight ? 0.02 : -0.02;
    }
  });
  
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

// Model canvas instance component to render a single 3D model
function ModelCanvasInstance({ 
  productId, 
  isHovered, 
  fallbackText = "Too many 3D models active" 
}: { 
  productId: number, 
  isHovered: boolean, 
  fallbackText?: string 
}) {
  const { isMobile, dpr } = getDeviceCapabilities();
  const [modelError, setModelError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [forceRender, setForceRender] = useState(false);
  
  // Check if loader is actually visible in the DOM
  const loaderElement = document.querySelector('[class*="fixed inset-0 z-"]');
  const isLoaderVisible = !!loaderElement;
  
  // If loader is not visible but flag is stuck, force render anyway
  useEffect(() => {
    if (mainLoaderActive && !isLoaderVisible) {
      console.log(`Model ${productId}: Loader not visible but flag is true, forcing render`);
      const timer = setTimeout(() => {
        setForceRender(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [productId, isLoaderVisible]);
  
  // Skip rendering if the main loader is active and visible
  if (mainLoaderActive && !forceRender && isLoaderVisible) {
    console.log(`Model ${productId}: Skipping render due to active loader`);
    return null;
  }
  
  const handleModelError = useCallback(() => {
    console.error(`Model error for product ${productId}`);
    setModelError(true);
    
    // Retry loading after a delay if we haven't reached max retries
    if (retryCount < 3) {
      const timer = setTimeout(() => {
        setModelError(false);
        setRetryCount(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [productId, retryCount]);
  
  // Clear error state when product changes
  useEffect(() => {
    setModelError(false);
    setRetryCount(0);
  }, [productId]);
  
  // Handle WebGL context management
  useEffect(() => {
    // Add the context when component mounts
    if (WebGLContextManager.canCreateContext()) {
      WebGLContextManager.addContext();
      console.log(`Canvas context added for product ${productId}`);
    } else {
      console.warn(`Cannot add context for product ${productId}, max contexts reached`);
    }
    
    // Remove the context when component unmounts
    return () => {
      WebGLContextManager.removeContext();
      console.log(`Canvas context removed for product ${productId}`);
    };
  }, [productId]);
  
  // Check if we should even try to create a WebGL context
  if (!WebGLContextManager.canCreateContext()) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <p className="text-sm text-gray-500">{fallbackText}</p>
      </div>
    );
  }
  
  // Actually render the model
  console.log(`Rendering 3D model for product ${productId}`);
  
  return (
    <Canvas
      camera={{ position: [0, 0, 4.0], fov: 30 }}
      dpr={dpr}
      gl={{ 
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'default',
        depth: true
      }}
      className="touch-auto"
      style={{ 
        background: 'transparent',
        touchAction: 'none',
        overflow: 'visible'
      }}
      onCreated={({ gl }) => {
        // Set clear color with full transparency
        gl.setClearColor(0x000000, 0);
        console.log(`Canvas created for product ${productId}, mainLoaderActive: ${mainLoaderActive}`);
      }}
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1.0} />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow={!isMobile} />
      
      <Suspense fallback={<ModelLoadingFallback />}>
        {!modelError ? (
          <>
            <Model3D 
              productId={productId} 
              scale={1.3}
              rotationSpeed={isHovered ? 0.01 : 0.005}
              isDetailView={false}
            />
            {!isMobile && <Environment preset="city" />}
          </>
        ) : (
          <Html center>
            <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-full">
              Failed to load model
            </div>
          </Html>
        )}
      </Suspense>
      
      <OrbitControls
        enableZoom={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={0}
        rotateSpeed={0.5}
        enableDamping={!isMobile}
        dampingFactor={0.1}
      />
    </Canvas>
  );
}

// Define the keyframes as string constants
const SPIN_RIGHT_KEYFRAMES = `
@keyframes spin-right {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

const PULSE_KEYFRAMES = `
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
`;

const FADE_IN_KEYFRAMES = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

const MARQUEE_KEYFRAMES = `
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`;

const SPIN_SLOW_KEYFRAMES = `
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

const SPIN_SLOW_REVERSE_KEYFRAMES = `
@keyframes spin-slow-reverse {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}
`;

// Add global animations
function AnimationStyles() {
  useEffect(() => {
    // Add all keyframe animations to document
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      ${SPIN_RIGHT_KEYFRAMES}
      ${PULSE_KEYFRAMES}
      ${FADE_IN_KEYFRAMES}
      ${MARQUEE_KEYFRAMES}
      ${SPIN_SLOW_KEYFRAMES}
      ${SPIN_SLOW_REVERSE_KEYFRAMES}
      
      .animate-marquee {
        animation: marquee 30s linear infinite;
      }
      
      .animate-spin-slow {
        animation: spin-slow 8s linear infinite;
      }
      
      .animate-spin-slow-reverse {
        animation: spin-slow-reverse 8s linear infinite;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Cleanup
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return null;
} 
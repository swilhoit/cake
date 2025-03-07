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
function ProductCard({ product }: { product: any }) {
  const { addToCart } = useShopContext();
  const [isVisible, setIsVisible] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const { isMobile, shouldUseImages, dpr } = getDeviceCapabilities();
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Extract product ID from the Shopify handle or use a default ID
  const productId = product.id ? parseInt(product.id.split('/').pop() || '1', 10) : 1;

  // For performance on mobile, we might want to use images instead of 3D models
  useEffect(() => {
    // If we should use images based on device capability, set fallback image
    if (shouldUseImages) {
      setUseFallbackImage(true);
      return;
    }
    
    // Only show the model after the loading screen is gone
    if (!mainLoaderActive) {
      // Only show the model after a delay to ensure initial mount is complete
      // Shorter delay to show models faster
      const delay = isMobile ? 200 : 50;
      
      const timer = setTimeout(() => {
        setIsVisible(true);
        console.log(`Making model visible for product ${productId}`);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, shouldUseImages, productId, mainLoaderActive]);

  // Handle 3D model error with retry mechanism
  const handleModelError = () => {
    console.log(`Model error for product ${productId}, retry: ${retryCount}`);
    setModelError(true);
    
    // In production with CORS errors, try a couple of times then fallback
    if (retryCount < 2) {
      setTimeout(() => {
        setModelError(false);
        setRetryCount(prev => prev + 1);
      }, 1000); // Try again after 1 second
    } else {
      // After 2 retries, fall back to image
      setUseFallbackImage(true);
    }
  };

  // Get fallback image URL with better error handling
  const getFallbackImageUrl = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    // Use a local placeholder based on product ID
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
            // If the image fails to load, use a very simple colored div as fallback
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.style.backgroundColor = `hsl(${(productId * 30) % 360}, 70%, 80%)`;
          }}
        />
      ) : isVisible && !mainLoaderActive && (
        <div className="w-full h-full relative">
          <ModelCanvasInstance productId={productId} isHovered={isHovered} />
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
  
  // Monitor loading screen state
  useEffect(() => {
    if (!mainLoaderActive && !loaderDismissed) {
      console.log("Loading screen dismissed, resetting WebGL contexts");
      WebGLContextManager.resetContextCount();
      setLoaderDismissed(true);
      
      // Wait a short delay after loader dismisses before showing 3D models
      const timer = setTimeout(() => {
        setShow3DModels(true);
        console.log("Enabling 3D models after loading screen dismissed");
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [mainLoaderActive, loaderDismissed]);
  
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
  
  return (
    <div className="container mx-auto px-4 pb-12">
      {/* Featured Product with 3D Model */}
      {!loading && displayedProducts.length > 0 && show3DModels && (
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
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Our Cakes</h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedProducts.map((product: any) => (
                <Link 
                  key={product.id} 
                  to={`/product/${product.handle || `product-${product.id.split('/').pop()}`}`}
                  className="block"
                >
                  <div className="bg-white shadow-md rounded-lg overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="h-48 bg-gray-100">
                      <img 
                        src={product.images?.[0]?.src || "/images/cakes/default.jpg"} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800">{product.title}</h3>
                      <p className="text-gray-600 mt-1">${parseFloat(product.variants[0].price).toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
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
  
  // Skip rendering if the main loader is active
  if (mainLoaderActive) {
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
    // Don't add context if loader is active
    if (mainLoaderActive) return;
    
    // Add the context when component mounts
    WebGLContextManager.addContext();
    console.log(`Canvas context added for product ${productId}`);
    
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
import { Link } from 'react-router-dom';
import { useShopContext } from '../context/ShopContext';
import Model3D from '../components/Model3D';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';

// Import mock products from HomePage to maintain consistency
import { mockProducts } from './HomePage';

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
  
  // Always use images in deployed environment to avoid potential CORS issues
  const isDeployedEnvironment = window.location.hostname.includes('vercel.app');
  
  // Determine if we should use images instead of 3D models
  const shouldUseImages = 
    isDeployedEnvironment || // Always use images in production for now
    isMobile && (
      cpuCores < 4 || 
      deviceMemory < 2 || 
      // If Safari mobile, be more conservative as it has more WebGL issues
      (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream)
    );
  
  // Set appropriate device pixel ratio based on device capability
  const dpr: [number, number] = isMobile ? [1, 1.5] : [1, 2];
  
  return { isMobile, shouldUseImages, dpr };
};

function ProductCard({ product }: { product: any }) {
  const { addToCart } = useShopContext();
  const [isVisible, setIsVisible] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const { isMobile, shouldUseImages, dpr } = getDeviceCapabilities();
  const [retryCount, setRetryCount] = useState(0);

  // For performance on mobile, we might want to use images instead of 3D models
  useEffect(() => {
    // If we should use images based on device capability, set fallback image
    if (shouldUseImages) {
      setUseFallbackImage(true);
      return;
    }
    
    // Only show the model after a delay to ensure initial mount is complete
    // Longer delay on mobile to allow UI to initialize first
    const delay = isMobile ? 300 : 100;
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [isMobile, shouldUseImages]);

  // Extract product ID from the Shopify handle or use a default numeric ID
  const productId = 
    product.id ? 
    parseInt(product.id.split('/').pop() || '1', 10) : 
    1;

  // Handle 3D model error with retry mechanism
  const handleModelError = () => {
    console.log(`Model error for product ${productId}, retry: ${retryCount}`);
    setModelError(true);
    
    // Try up to 2 times to reload the model with increasing delays
    if (retryCount < 2) {
      const retryDelay = (retryCount + 1) * 1000; // 1s, then 2s
      
      setTimeout(() => {
        setModelError(false);
        setRetryCount(prev => prev + 1);
      }, retryDelay);
    } else {
      // After retries, fall back to image
      setUseFallbackImage(true);
    }
  };

  const handleAddToCart = () => {
    console.log("Adding to cart from ShopPage:", product.title, "variant:", product.variants[0].id);
    addToCart(product.variants[0].id, 1);
  };

  // Get fallback image URL with better error handling
  const getFallbackImageUrl = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    // Use a placeholder based on product ID
    return `/images/cake-${(productId % 4) + 1}.jpg`;
  };

  return (
    <div className="backdrop-blur-sm overflow-hidden flex flex-col border border-gray-200/20 rounded-lg transition-all duration-300 hover:border-blue-300/30">
      {/* 3D Model or Fallback Image */}
      <div className="relative h-80 w-full">
        {useFallbackImage ? (
          // Fallback image for mobile or low-end devices
          <div className="w-full h-full bg-gray-100">
            <img 
              src={getFallbackImageUrl()} 
              alt={product.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, use a placeholder
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Cake';
              }}
            />
          </div>
        ) : isVisible && (
          <Canvas
            camera={{ position: [0, 0, 4.0], fov: 30 }}
            dpr={dpr}
            className="!touch-none" /* Fix for mobile touch handling */
            frameloop={isMobile ? "demand" : "always"} // Only render on demand for mobile
            onCreated={({ gl }) => {
              // Optimize WebGL context
              gl.setClearColor(new THREE.Color('#f8f9fa'), 0);
              if ('physicallyCorrectLights' in gl) {
                (gl as any).physicallyCorrectLights = true;
              }
              // Reduce quality for mobile
              if (isMobile) {
                gl.shadowMap.enabled = false;
                if ('powerPreference' in gl) {
                  (gl as any).powerPreference = "low-power";
                }
              }
            }}
            onError={handleModelError}
          >
            <ambientLight intensity={0.8} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow={!isMobile} />
            
            <Suspense fallback={
              <Html center>
                <div className="flex items-center justify-center">
                  <div className="text-sm text-blue-500 bg-blue-50 px-3 py-2 rounded-full">
                    Loading cake model...
                  </div>
                </div>
              </Html>
            }>
              {!modelError ? (
                <>
                  <Model3D scale={1.3} rotationSpeed={isMobile ? 0.003 : 0.005} productId={productId} />
                  {!isMobile && <Environment preset="city" />}
                </>
              ) : (
                <Html center>
                  <div className="flex items-center justify-center">
                    <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-full">
                      Failed to load model
                    </div>
                  </div>
                </Html>
              )}
            </Suspense>
            
            <OrbitControls
              enableZoom={false}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={0}
              rotateSpeed={0.5}
              enableDamping={isMobile ? false : true}
              dampingFactor={0.1}
            />
          </Canvas>
        )}
      </div>
      
      {/* Product Information */}
      <div className="p-4 flex-grow">
        <Link to={`/product/${product.id.split('/').pop()}`}>
          <h3 className="text-lg font-semibold text-gray-800 hover:text-indigo-600">{product.title}</h3>
        </Link>
        <p className="text-green-600 font-medium mt-1">${product.variants[0].price}</p>
        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{product.description}</p>
      </div>
      
      {/* Add to Cart Button */}
      <div className="px-4 pb-4">
        <button 
          className="w-full bg-button-gradient hover:opacity-90 text-gray-800 font-medium py-2 rounded-md transition shadow-sm"
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { products, loading } = useShopContext();
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  
  useEffect(() => {
    // If there are Shopify products, use them; otherwise, use mock data
    if (!loading && products && products.length > 0) {
      setDisplayedProducts(products);
      console.log("Using Shopify products in ShopPage:", products.length);
    } else if (!loading) {
      setDisplayedProducts(mockProducts);
      console.log("Using mock products in ShopPage since no Shopify products available");
    }
  }, [products, loading]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Shop Our Collection</h1>
        <p className="text-gray-600 mt-2">
          Browse our premium custom cakes and bakery items
        </p>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayedProducts.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {displayedProducts.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">No products available</h2>
          <p className="text-gray-500 mt-2">
            Please check back later or contact us for more information.
          </p>
        </div>
      )}
    </div>
  );
} 
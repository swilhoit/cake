import { Link } from 'react-router-dom';
import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useShopContext } from '../context/ShopContext';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF } from '@react-three/drei';
import Model3D from '../components/Model3D';
import * as THREE from 'three';
import React from 'react';

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

// Product card with 3D model
function ProductCard({ product }: { product: any }) {
  const { addToCart } = useShopContext();
  const [isVisible, setIsVisible] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const { isMobile, shouldUseImages, dpr } = getDeviceCapabilities();
  const [retryCount, setRetryCount] = useState(0);

  // Extract product ID from the Shopify handle or use a default ID
  const productId = product.id ? parseInt(product.id.split('/').pop() || '1', 10) : 1;

  // For performance on mobile, we might want to use images instead of 3D models
  useEffect(() => {
    // If we should use images based on device capability, set fallback image
    if (shouldUseImages) {
      setUseFallbackImage(true);
      return;
    }
    
    // Only show the model after a delay to ensure initial mount is complete
    // Shorter delay to show models faster
    const delay = isMobile ? 200 : 50;
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [isMobile, shouldUseImages]);

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

  return (
    <Link to={`/product/${product.id.split('/').pop()}`} className="block">
      <div className="transition-all duration-300">
        {/* 3D Model Container - No background, no borders, no shadows */}
        <div className="relative h-80 w-full">
          {useFallbackImage ? (
            <img 
              src={getFallbackImageUrl()} 
              alt={product.title} 
              className="w-full h-full object-contain"  
            />
          ) : isVisible && (
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
                touchAction: 'none'
              }}
              onCreated={({ gl }) => {
                // Set clear color with full transparency
                gl.setClearColor(0x000000, 0);
              }}
            >
              <ambientLight intensity={0.8} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
              
              <Suspense fallback={
                <Html center>
                  <div className="flex items-center justify-center">
                    <div className="text-sm text-blue-500 px-3 py-2 rounded-full" style={{ background: 'transparent' }}>
                      Loading cake model...
                    </div>
                  </div>
                </Html>
              }>
                {!modelError ? (
                  <>
                    <Model3D 
                      scale={1.3} 
                      rotationSpeed={isMobile ? 0.003 : 0.005} 
                      productId={productId} 
                    />
                    {!isMobile && <Environment preset="city" />}
                  </>
                ) : (
                  <Html center>
                    <div className="flex items-center justify-center">
                      <div className="text-sm text-red-500 px-3 py-2 rounded-full" style={{ background: 'transparent' }}>
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
      </div>
    </Link>
  );
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
    <div>
      {/* Product Grid Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
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
      <section className="py-4 bg-yellow-300 my-8 overflow-hidden">
        <h2 className="sr-only">Banh Mi Section</h2>
        
        {/* Marquee Container - Single line only */}
        <div className="marquee-container relative w-full">
          {/* Single Marquee - Left to Right - FASTER speed - Reduced number of models */}
          <div className="marquee-content flex animate-marquee-fast">
            {/* Further reduced the number of repetitions to prevent WebGL context issues */}
            {[1, 2].map((item) => (
              <React.Fragment key={`banh-left-${item}`}>
                <div className="h-32 w-32 mx-2">
                  <BanhMiModelSmall rotateRight={item % 2 === 0} />
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

// Smaller Banh Mi model optimized for the marquee
function BanhMiModelSmall({ rotateRight }: { rotateRight: boolean }) {
  // Minimal state management
  const [modelError, setModelError] = useState(false);
  
  // Simple error handler
  const handleModelError = () => {
    console.error("BanhMi model failed to load");
    setModelError(true);
  };
  
  // Direct URL to the Banh Mi model - no timestamp or other modifications
  const modelUrl = "https://storage.googleapis.com/kgbakerycakes/banhmi.glb";
  
  // Simple Canvas with minimal configuration
  return (
    <Canvas
      camera={{ position: [0, 0, 4.0], fov: 30 }}
      gl={{ 
        antialias: true,
        alpha: true
      }}
      style={{ background: 'transparent' }}
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
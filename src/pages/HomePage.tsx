import { Link } from 'react-router-dom';
import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { useShopContext } from '../context/ShopContext';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF } from '@react-three/drei';
import Model3D from '../components/Model3D';
import * as THREE from 'three';

// Mock product data for when Shopify products aren't available
export const mockProducts = [
  { 
    id: 'gid://shopify/Product/1', 
    title: 'Premium Chocolate Cake', 
    description: 'Rich chocolate cake with ganache frosting',
    variants: [{ id: 'variant1', price: '29.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/2', 
    title: 'Vanilla Birthday Cake', 
    description: 'Classic vanilla cake with buttercream frosting',
    variants: [{ id: 'variant2', price: '24.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/3', 
    title: 'Red Velvet Deluxe', 
    description: 'Elegant red velvet cake with cream cheese frosting',
    variants: [{ id: 'variant3', price: '34.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/4', 
    title: 'Strawberry Dream', 
    description: 'Light strawberry cake with fresh berries',
    variants: [{ id: 'variant4', price: '32.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/5', 
    title: 'Lemon Blueberry Cake', 
    description: 'Zesty lemon cake with blueberry compote',
    variants: [{ id: 'variant5', price: '27.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/6', 
    title: 'Caramel Drizzle Cake', 
    description: 'Butter cake with caramel drizzle and toffee bits',
    variants: [{ id: 'variant6', price: '29.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/7', 
    title: 'Carrot Spice Cake', 
    description: 'Moist carrot cake with spices and cream cheese frosting',
    variants: [{ id: 'variant7', price: '26.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/8', 
    title: 'Coconut Paradise Cake', 
    description: 'Coconut cake with coconut cream and toasted coconut flakes',
    variants: [{ id: 'variant8', price: '31.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/9', 
    title: 'Tiramisu Delight', 
    description: 'Coffee-soaked layers with mascarpone cream and cocoa dusting',
    variants: [{ id: 'variant9', price: '36.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/10', 
    title: 'Matcha Green Tea Cake', 
    description: 'Delicate matcha-flavored cake with white chocolate accents',
    variants: [{ id: 'variant10', price: '33.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/11', 
    title: 'Black Forest Gateau', 
    description: 'Cherry-filled chocolate cake with whipped cream and kirsch',
    variants: [{ id: 'variant11', price: '35.99' }],
    images: [] 
  },
  { 
    id: 'gid://shopify/Product/12', 
    title: 'Honey Lavender Cake', 
    description: 'Aromatic lavender cake with honey buttercream and candied flowers',
    variants: [{ id: 'variant12', price: '37.99' }],
    images: [] 
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
    // Longer delay on mobile to allow UI to initialize first
    const delay = isMobile ? 300 : 100;
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [isMobile, shouldUseImages]);

  // Handle 3D model error with retry mechanism
  const handleModelError = () => {
    console.log(`Model error for product ${productId}, retry: ${retryCount}`);
    setModelError(true);
    
    // Fall back to image immediately in production
    if (window.location.hostname.includes('vercel.app')) {
      setUseFallbackImage(true);
      return;
    }
    
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
    console.log("Adding to cart:", product.title, "variant:", product.variants[0].id);
    addToCart(product.variants[0].id, 1);
  };

  // Get fallback image URL with better error handling
  const getFallbackImageUrl = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    // Use a local placeholder based on product ID
    return `/images/cake-${(productId % 4) + 1}.jpg`;
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
              className="!touch-none" /* Fix for mobile touch handling */
              style={{ background: 'transparent' }}
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
      
      {/* Banh Mi Marquee Section - No background */}
      <section className="py-8 my-12 overflow-hidden">
        <h2 className="sr-only">Banh Mi Section</h2>
        
        {/* Marquee Container */}
        <div className="marquee-container relative w-full">
          {/* First Marquee - Left to Right - Models only, no text */}
          <div className="marquee-content flex animate-marquee">
            {/* Repeat the models multiple times to ensure continuous scrolling */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={`banh-left-${item}`} className="h-40 w-40 mx-6">
                <BanhMiModelSmall rotateRight={true} />
              </div>
            ))}
          </div>
          
          {/* Second Marquee - Right to Left (reversed) - Models only, no text */}
          <div className="marquee-content flex animate-marquee-reverse mt-4">
            {/* Repeat the models multiple times in reverse */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={`banh-right-${item}`} className="h-40 w-40 mx-6">
                <BanhMiModelSmall rotateRight={false} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Call to action button centered below the marquee */}
        <div className="text-center mt-8 mb-4">
          <Link 
            to="/shop" 
            className="inline-block bg-transparent hover:bg-black hover:text-white border-2 border-black font-bold px-10 py-4 rounded-full transition duration-300 text-xl font-rubik"
          >
            Order Banh Mi
          </Link>
        </div>
      </section>
    </div>
  );
}

// Smaller Banh Mi model optimized for the marquee
function BanhMiModelSmall({ rotateRight }: { rotateRight: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const modelUrl = "https://storage.googleapis.com/kgbakerycakes/banhmi.glb";
  
  // Load the Banh Mi 3D model
  const { scene } = useGLTF(modelUrl);
  
  // Auto-rotation animation with specified direction
  useFrame(() => {
    if (meshRef.current) {
      // Rotate either clockwise or counter-clockwise based on the prop
      meshRef.current.rotation.y += rotateRight ? 0.03 : -0.03;
    }
  });
  
  // Clone the model to avoid conflicts
  const model = useMemo(() => {
    if (!scene) return new THREE.Group();
    return scene.clone();
  }, [scene]);
  
  return (
    <Canvas
      camera={{ position: [0, 0, 4.0], fov: 30 }}
      gl={{ 
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'default',
        depth: true
      }}
      className="!touch-none"
      style={{ background: 'transparent' }}
      onCreated={({ gl }) => {
        // Set clear color with full transparency
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={0.8} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      
      <mesh 
        ref={meshRef}
        scale={[2.0, 2.0, 2.0]}
        position={[0, 0, 0]}
        rotation={[0.1, 0, 0]}
      >
        <primitive object={model} />
      </mesh>
    </Canvas>
  );
} 
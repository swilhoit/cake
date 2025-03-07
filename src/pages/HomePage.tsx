import { Link } from 'react-router-dom';
import { useShopContext } from '../context/ShopContext';
import Model3D from '../components/Model3D';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef, ReactNode } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getMainLoaderActive } from '../components/LoadingScreen';

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
  const shouldUseImages = false; // Force 3D models
  
  // Set appropriate device pixel ratio based on device capability
  const dpr: [number, number] = isMobile ? [1, 1.5] : [1, 2];
  
  return { isMobile, shouldUseImages, dpr };
};

// Model loading fallback component
function ModelLoadingFallback() {
  // Get loader state
  const loaderVisible = document.querySelector('[class*="fixed inset-0 z-"]');
  
  // Don't show if the main loader is active and visible
  if (getMainLoaderActive() && loaderVisible) return null;
  
  return (
    <Html center>
      <div className="flex items-center justify-center">
        <div className="text-sm text-blue-500 bg-blue-50 px-3 py-2 rounded-full">
          Loading cake model...
        </div>
      </div>
    </Html>
  );
}

// Product card with 3D model
function ProductCard({ 
  product, 
  forceVisible = true 
}: { 
  product: any, 
  forceVisible?: boolean 
}) {
  const { addToCart } = useShopContext();
  const [modelError, setModelError] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const { isMobile, shouldUseImages, dpr } = getDeviceCapabilities();
  
  // Extract product ID from the Shopify handle
  const productId = parseInt(product.id.split('/').pop() || '1', 10);
  
  // For performance on mobile, we might want to use images instead of 3D models
  useEffect(() => {
    // If we should use images based on device capability, set fallback image
    if (shouldUseImages) {
      setUseFallbackImage(true);
    }
  }, [shouldUseImages]);
  
  // Log model ID for debugging
  useEffect(() => {
    console.log(`Product "${product.title}" using 3D model ID: ${productId}`);
  }, [product.title, productId]);

  // Simple error handler
  const handleModelError = () => {
    console.log(`Model error for product ${productId}`);
    setModelError(true);
    setUseFallbackImage(true);
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
                // If the image fails to load, use a very simple colored div as fallback
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.style.backgroundColor = `hsl(${(productId * 30) % 360}, 70%, 80%)`;
              }}
            />
          </div>
        ) : (
          // Always render Canvas for 3D models
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
              console.log(`Creating WebGL context for product ${productId}`);
            }}
            onError={handleModelError}
          >
            <ambientLight intensity={0.8} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow={!isMobile} />
            
            <Suspense fallback={
              <ModelLoadingFallback />
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
    </div>
  );
}

// Simple Banh Mi 3D model component
function BanhMi3D({ rotationSpeed = 0.005, index }: { rotationSpeed: number; index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Load the model (with explicit path)
  const model = useGLTF("https://storage.googleapis.com/kgbakerycakes/banhmi.glb");
  
  // Animate the model
  useFrame(() => {
    if (groupRef.current) {
      // Rotate in different directions based on index
      const direction = index % 2 === 0 ? 1 : -1;
      groupRef.current.rotation.y += rotationSpeed * direction;
      
      // Add a gentle floating motion
      const time = Date.now() * 0.001;
      const offset = index * 0.5;
      groupRef.current.position.y = Math.sin(time + offset) * 0.1;
    }
  });
  
  // Return the model in a group for easier manipulation
  return (
    <group ref={groupRef} scale={[1.5, 1.5, 1.5]}>
      {model.scene ? <primitive object={model.scene} /> : null}
    </group>
  );
}

// BanhMi marquee with inline 3D models between text items
function BanhMiMarquee() {
  const { isMobile } = getDeviceCapabilities();
  
  // Simplified BanhMi model component using react-three-fiber/drei
  const BanhMiModel = ({ index = 0 }: { index?: number }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF('https://storage.googleapis.com/kgbakerycakes/banhmi.glb');
    
    // Rotate the model on each frame
    useFrame(() => {
      if (groupRef.current) {
        // Alternate rotation direction based on index for visual variety
        const direction = index % 2 === 0 ? 1 : -1;
        groupRef.current.rotation.y += 0.01 * direction;
      }
    });
    
    // Return the model
    return (
      <group ref={groupRef} scale={[1.3, 1.3, 1.3]}>
        {scene && <primitive object={scene} />}
      </group>
    );
  };
  
  // Create a component for the 3D model display
  const BanhMiCanvas = ({ index }: { index: number }) => (
    <div className="h-16 w-16 inline-block">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        dpr={1}
        gl={{ preserveDrawingBuffer: true, powerPreference: isMobile ? 'low-power' : 'default' }}
        frameloop="always"
      >
        <ambientLight intensity={0.8} />
        <directionalLight intensity={0.5} position={[1, 1, 1]} />
        <Suspense fallback={null}>
          <BanhMiModel index={index} />
        </Suspense>
      </Canvas>
    </div>
  );
  
  return (
    <section className="w-screen h-16 bg-yellow-300 overflow-hidden -mx-[calc(50vw-50%)]">
      {/* Single line marquee with integrated 3D models */}
      <div className="relative w-full h-full overflow-hidden">
        <div className="flex items-center animate-marquee whitespace-nowrap h-full">
          {Array.from({ length: 10 }).map((_, index) => (
            <div className="flex items-center" key={`banh-item-${index}`}>
              <span className="text-2xl font-bold text-black mx-4">WE HAVE BANH MIS!</span>
              <BanhMiCanvas index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Add animation styles
function AnimationStyles() {
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes spin-slow-reverse {
        from { transform: rotate(0deg); }
        to { transform: rotate(-360deg); }
      }
      
      .animate-marquee {
        animation: marquee 25s linear infinite;
        will-change: transform;
      }
      
      .animate-spin-slow {
        animation: spin-slow 8s linear infinite;
      }
      
      .animate-spin-slow-reverse {
        animation: spin-slow-reverse 8s linear infinite;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return null;
}

// Main HomePage component
export default function HomePage() {
  const { products, loading } = useShopContext();
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  
  // Set up displayed products
  useEffect(() => {
    // If there are Shopify products, use them; otherwise, use mock data
    if (!loading && products && products.length > 0) {
      // Add sequential IDs for consistent model mapping
      const productsWithSequentialIds = products.map((product, index) => ({
        ...product,
        sequentialId: index + 1
      }));
      
      setDisplayedProducts(productsWithSequentialIds);
      console.log("Using Shopify products:", productsWithSequentialIds.length);
    } else if (!loading) {
      // Also add sequential IDs to mock products
      const mockWithSequentialIds = mockProducts.map((product, index) => ({
        ...product,
        sequentialId: index + 1
      }));
      
      setDisplayedProducts(mockWithSequentialIds);
      console.log("Using mock products since no Shopify products available");
    }
  }, [products, loading]);
  
  // No need for viewport monitoring - all models always visible

  // Add styles for animations
  AnimationStyles();
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Create a staggered entrance animation for elements
  const ElementAnimation = ({ children, delay, direction = 'bottom' }: { 
    children: ReactNode, 
    delay: number,
    direction?: 'left' | 'right' | 'bottom' | 'top'
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }, [delay]);
    
    // Calculate transform based on direction
    const getInitialTransform = () => {
      switch (direction) {
        case 'left': return 'translateX(-50px)';
        case 'right': return 'translateX(50px)';
        case 'top': return 'translateY(-50px)';
        case 'bottom': 
        default: return 'translateY(50px)';
      }
    };
    
    const style = {
      transform: isVisible ? 'translate(0)' : getInitialTransform(),
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.5s ease-out'
    };
    
    return <div style={style}>{children}</div>;
  };

  return (
    <div className="overflow-x-hidden">
      <div className="container mx-auto px-4 py-8">
        {/* Featured Cake removed */}
        
        <ElementAnimation delay={100} direction="top">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 text-center">Our Collection</h1>
            <p className="text-gray-600 mt-2 text-center">
              Browse our premium custom cakes and bakery items
            </p>
          </div>
        </ElementAnimation>
        
        {/* Products Grid with staggered animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProducts.slice(0, 6).map((product: any, index) => ( // Only show first 6 products
            <ElementAnimation 
              key={product.id} 
              delay={150 + (index * 100)} 
              direction={index % 2 === 0 ? 'left' : 'right'}
            >
              <ProductCard product={product} />
            </ElementAnimation>
          ))}
        </div>
        
        {displayedProducts.length === 0 && (
          <ElementAnimation delay={100} direction="bottom">
            <div className="text-center py-12">
              <h2 className="text-xl text-gray-600">No products available</h2>
              <p className="text-gray-500 mt-2">
                Please check back later or contact us for more information.
              </p>
            </div>
          </ElementAnimation>
        )}
        
        {/* View all products button */}
        <ElementAnimation delay={600} direction="bottom">
          <div className="text-center mt-12 mb-12">
            <Link 
              to="/shop" 
              className="inline-block bg-pink-500 text-white font-medium px-6 py-3 rounded-md hover:bg-pink-600 transition shadow-md"
            >
              View All Products
            </Link>
          </div>
        </ElementAnimation>
      </div>
      
      {/* Banh Mi Marquee - outside container for full width */}
      <BanhMiMarquee />
    </div>
  );
} 
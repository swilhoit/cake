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
  // Being more conservative to prevent WebGL context issues
  const shouldUseImages = 
    // Force images in production environment to avoid WebGL context issues
    window.location.hostname.includes('vercel.app') ||
    // Be conservative with mobile devices
    isMobile || 
    // Be conservative with low-end devices
    cpuCores < 6 || 
    deviceMemory < 4;
  
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
      
      {/* Banh Mi Marquee Section with yellow background - Simplified to 1 line */}
      <section className="py-4 bg-yellow-300 my-8 overflow-hidden">
        <h2 className="sr-only">Banh Mi Section</h2>
        
        {/* Marquee Container - Single line only */}
        <div className="marquee-container relative w-full">
          {/* Single Marquee - Left to Right - FASTER speed - Reduced number of models */}
          <div className="marquee-content flex animate-marquee-fast">
            {/* Reduced the number of repetitions to prevent WebGL context issues */}
            {[1, 2, 3].map((item) => (
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
  // Instead of always using a fallback box, attempt to load the model
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Handle model error with retry
  const handleModelError = useCallback(() => {
    console.error("BanhMi model failed to load");
    setModelError(true);
    
    // Implement retry logic with short delays
    if (retryCount < 3) {
      const delay = 500 * (retryCount + 1);
      console.log(`Retrying BanhMi model in ${delay}ms (attempt ${retryCount + 1}/3)`);
      
      setTimeout(() => {
        console.log(`Retrying BanhMi model now (attempt ${retryCount + 1}/3)`);
        setModelError(false);
        setRetryCount(prev => prev + 1);
      }, delay);
    }
  }, [retryCount]);
  
  // Reset error state when mount
  useEffect(() => {
    setModelError(false);
    setRetryCount(0);
  }, []);
  
  // Model URL - always use Google Cloud Storage
  const modelUrl = "https://storage.googleapis.com/kgbakerycakes/cake_model_1.glb";
  
  // Memoize the Canvas component to prevent unnecessary re-renders
  return useMemo(() => (
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
      // Enable continuous rendering for rotation animation
      frameloop="always"
    >
      {/* Improved lighting setup */}
      <ambientLight intensity={0.8} />
      <spotLight 
        position={[5, 10, 5]} 
        angle={0.4} 
        penumbra={1} 
        intensity={2.5}
        castShadow 
        color="#ffffff"
      />
      <directionalLight
        position={[0, 5, 5]}
        intensity={1.0}
        color="#ffffff"
      />
      
      <Suspense fallback={null}>
        {!modelError ? (
          <RotatingModel 
            url={modelUrl} 
            rotateRight={rotateRight} 
            onLoadFailed={handleModelError} 
          />
        ) : (
          <FallbackBanhMi rotateRight={rotateRight} />
        )}
      </Suspense>
    </Canvas>
  ), [rotateRight, modelError, handleModelError, modelUrl]);
}

// Fallback model for production where CORS prevents loading external models
function FallbackBanhMi({ rotateRight }: { rotateRight: boolean }) {
  // Keep all hook declarations consistently at the top
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Generate a random warm bread-like color - use useState for stable values
  const [color] = useState(() => {
    const hue = 20 + Math.random() * 30; // Range from orange-red to yellow-orange
    const saturation = 80 + Math.random() * 20; // High saturation
    const lightness = 55 + Math.random() * 15; // Medium-high lightness
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });
  
  // Auto-rotation animation with specified direction
  useFrame((state) => {
    if (meshRef.current) {
      // Rotate either clockwise or counter-clockwise based on the prop
      meshRef.current.rotation.y += rotateRight ? 0.02 : -0.02;
      
      // Add a slight floating motion for visual interest
      const time = state.clock.getElapsedTime();
      meshRef.current.position.y = -0.2 + Math.sin(time * 0.8) * 0.05;
    }
  });
  
  // Create a bread-like shape using multiple geometries
  return (
    <group 
      ref={meshRef as any}
      position={[0, -0.2, 0]}
      rotation={[0.1, 0, 0]}
    >
      {/* Bread loaf base */}
      <mesh position={[0, 0, 0]} scale={[1.8, 0.6, 0.7]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Rounded top of bread */}
      <mesh position={[0, 0.3, 0]} scale={[1.7, 0.4, 0.65]}>
        <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}

// Separate component for the rotating model that uses the useFrame hook - No text
function RotatingModel({ url, rotateRight, onLoadFailed }: { 
  url: string, 
  rotateRight: boolean,
  onLoadFailed: () => void
}) {
  // Start with all refs and state declarations to maintain consistent Hook order
  const meshRef = useRef<THREE.Mesh>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  // Store color as state to ensure consistent renders
  const [colorValue] = useState(() => {
    // Generate a random warm color for each Banh Mi to make them look distinct
    const hue = 20 + Math.random() * 30; 
    const saturation = 80 + Math.random() * 20;
    const lightness = 55 + Math.random() * 15;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });
  
  // Set up error handling callback
  const handleError = useCallback((error: any) => {
    console.error("Failed to load model:", error);
    onLoadFailed();
  }, [onLoadFailed]);
  
  // Load the 3D model with error handling
  let scene: THREE.Group | undefined;
  try {
    const result = useGLTF(url, undefined, undefined, (error) => {
      console.error('GLTF loader error:', error);
      handleError(error);
    });
    scene = result.scene;
  } catch (error) {
    console.error('Error in useGLTF hook:', error);
    handleError(error);
  }
  
  // Always declare all hooks regardless of conditions to maintain hook order
  // Handle errors through useEffect monitoring
  useEffect(() => {
    // Only try to access scene if the component is still mounted
    let isMounted = true;
    
    if (scene && isMounted) {
      console.log("Model loaded successfully:", url);
      setModelLoaded(true);
    } else if (isMounted) {
      console.error("Error loading model: scene is undefined");
      onLoadFailed();
    }
    
    return () => { isMounted = false; };
  }, [scene, url, onLoadFailed]);
  
  // Auto-rotation animation with specified direction
  useFrame((state) => {
    if (meshRef.current) {
      // Rotate either clockwise or counter-clockwise based on the prop
      meshRef.current.rotation.y += rotateRight ? 0.02 : -0.02;
      
      // Add a slight floating motion for visual interest
      const time = state.clock.getElapsedTime();
      meshRef.current.position.y = -0.2 + Math.sin(time * 0.8) * 0.05;
    }
  });
  
  // Create the model - ALWAYS call useMemo here to maintain hook order
  const model = useMemo(() => {
    if (!scene || !modelLoaded) return null;
    
    const clonedScene = scene.clone();
    
    // Apply random color tint to make each model look unique
    clonedScene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(mat => {
            const newMat = mat.clone();
            // Apply a subtle tint
            if (newMat.color) {
              const threeColor = new THREE.Color(colorValue);
              newMat.color.lerp(threeColor, 0.3);
            }
            return newMat;
          });
        } else {
          const newMat = child.material.clone();
          if (newMat.color) {
            const threeColor = new THREE.Color(colorValue);
            newMat.color.lerp(threeColor, 0.3);
          }
          child.material = newMat;
        }
      }
    });
    
    return clonedScene;
  }, [scene, colorValue, modelLoaded]);
  
  // If no model is available yet, show nothing (loading state)
  if (!model) {
    return null;
  }
  
  // Render the actual model
  return (
    <mesh 
      ref={meshRef}
      scale={[1.8, 1.8, 1.8]}
      position={[0, -0.2, 0]}
      rotation={[0.1, 0, 0]}
    >
      <primitive object={model} />
    </mesh>
  );
} 
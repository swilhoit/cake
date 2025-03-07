import { Link } from 'react-router-dom';
import { useShopContext } from '../context/ShopContext';
import Model3D from '../components/Model3D';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
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

// Featured cake section
function FeaturedCake({ product }: { product: any }) {
  const { isMobile, shouldUseImages, dpr } = getDeviceCapabilities();
  const [isVisible, setIsVisible] = useState(false);
  const [modelError, setModelError] = useState(false);
  
  // Extract product ID from the Shopify handle
  const productId = parseInt(product.id.split('/').pop() || '1', 10);
  
  // Show model with improved timing 
  useEffect(() => {
    // Start with longer delay to ensure UI is ready
    const initialDelay = isMobile ? 500 : 300;
    
    // Set up visibility check to ensure we only show when page is ready
    const checkVisibilityAndLoad = () => {
      // Check if main loader is gone
      if (!getMainLoaderActive()) {
        // Additional delay after loader disappears
        setTimeout(() => {
          setIsVisible(true);
          console.log("Featured cake model visible");
        }, 200);
      } else {
        // Check again in a bit
        setTimeout(checkVisibilityAndLoad, 100);
      }
    };
    
    // Initial timeout before checking
    const timer = setTimeout(checkVisibilityAndLoad, initialDelay);
    
    return () => clearTimeout(timer);
  }, [isMobile]);
  
  // Handle 3D model error
  const handleModelError = () => {
    console.error(`Featured model error for product ${productId}`);
    setModelError(true);
  };
  
  return (
    <section className="py-8 my-4">
      <div className="bg-gray-50 rounded-xl shadow-lg overflow-hidden">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Featured Cake</h2>
          <div className="flex flex-col md:flex-row items-center">
            {/* 3D Model Display */}
            <div className="md:w-1/2 h-80 relative mb-6 md:mb-0">
              <div className="w-full h-full">
                {isVisible && (
                  <Canvas
                    camera={{ position: [0, 0, 4.0], fov: 30 }}
                    dpr={dpr}
                    className="!touch-none" 
                    frameloop={isMobile ? "demand" : "always"}
                    onCreated={({ gl }) => {
                      gl.setClearColor(new THREE.Color('#f8f9fa'), 0);
                      if ('physicallyCorrectLights' in gl) {
                        (gl as any).physicallyCorrectLights = true;
                      }
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
                    
                    <Suspense fallback={<ModelLoadingFallback />}>
                      {!modelError ? (
                        <>
                          <Model3D 
                            scale={1.3} 
                            rotationSpeed={0.003} 
                            productId={productId} 
                          />
                          {!isMobile && <Environment preset="city" />}
                        </>
                      ) : (
                        <Html center>
                          <div className="flex items-center justify-center">
                            <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-full">
                              Failed to load featured model
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
                      enableDamping={!isMobile}
                      dampingFactor={0.1}
                    />
                  </Canvas>
                )}
              </div>
            </div>
            
            {/* Product Info */}
            <div className="md:w-1/2 md:pl-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{product.title}</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <p className="text-xl font-semibold text-pink-600 mb-6">${product.variants[0].price}</p>
              <Link 
                to={`/product/${product.id.split('/').pop()}`}
                className="inline-block bg-pink-500 text-white font-medium px-6 py-3 rounded-md hover:bg-pink-600 transition shadow-sm"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
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
  const [isVisible, setIsVisible] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const { isMobile, shouldUseImages, dpr } = getDeviceCapabilities();
  const [retryCount, setRetryCount] = useState(0);
  
  // Track whether this card is actually visible in the viewport
  const [isReadyToRender, setIsReadyToRender] = useState(false);

  // Extract product ID from the Shopify handle first
  const productId = parseInt(product.id.split('/').pop() || '1', 10);
  
  // For performance on mobile, we might want to use images instead of 3D models
  useEffect(() => {
    // If we should use images based on device capability, set fallback image
    if (shouldUseImages) {
      setUseFallbackImage(true);
      return;
    }
    
    // Use progressive loading scheme for product cards
    const baseDelay = isMobile ? 400 : 200; 
    
    // Calculate staggered delay based on product ID to avoid all models loading at once
    // This spreads out the WebGL context creation and network requests
    const staggeredDelay = baseDelay + ((productId % 10) * 150);
    
    // Set up visibility check to ensure we only show when page is ready
    const checkVisibilityAndLoad = () => {
      // Check if main loader is gone and this product card is in viewport
      if (!getMainLoaderActive() && forceVisible) {
        // Additional delay after loader disappears, staggered by product ID
        setTimeout(() => {
          setIsReadyToRender(true);
          setIsVisible(true);
          console.log(`Product card model ${productId} visible`);
        }, staggeredDelay);
      } else if (!getMainLoaderActive()) {
        // If not in viewport, mark as ready but don't make visible yet
        setIsReadyToRender(true);
      } else {
        // Check again in a bit
        setTimeout(checkVisibilityAndLoad, 100);
      }
    };
    
    const timer = setTimeout(checkVisibilityAndLoad, 200);
    
    return () => clearTimeout(timer);
  }, [isMobile, shouldUseImages, productId, forceVisible]);
  
  // Monitor whether this product card is in viewport
  useEffect(() => {
    if (forceVisible && isReadyToRender && !isVisible) {
      // If it becomes visible and we're ready to render, show the model
      setIsVisible(true);
      console.log(`Product card ${productId} now in viewport, showing model`);
    }
  }, [forceVisible, isReadyToRender, isVisible, productId]);
  
  // Log which product is using which model ID (fixed position)
  useEffect(() => {
    console.log(`Product "${product.title}" using 3D model ID: ${productId}`);
  }, [product.title, productId]);

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
        ) : isVisible && forceVisible ? (
          // Only render Canvas when both ready to render AND in viewport
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
        ) : (
          // Display loading placeholder when not ready or not in viewport
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="p-4 rounded-lg bg-white/70 shadow-sm">
              <div className="animate-pulse flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <div className="w-2 h-2 rounded-full bg-blue-400" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 rounded-full bg-blue-400" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
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

// Banh Mi marquee section with plain images
function BanhMiMarquee() {
  return (
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
  const [isInViewport, setIsInViewport] = useState<{[key: string]: boolean}>({});
  const gridRef = useRef<HTMLDivElement>(null);
  
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
  
  // Set up intersection observer to only load models that are visible
  useEffect(() => {
    if (!gridRef.current) return;
    
    const options = {
      root: null,
      rootMargin: '100px', // Load slightly before they come into view
      threshold: 0.1
    };
    
    // Create an observer instance
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const productId = entry.target.getAttribute('data-product-id');
        if (productId) {
          setIsInViewport(prev => ({
            ...prev,
            [productId]: entry.isIntersecting
          }));
        }
      });
    }, options);
    
    // Observe product cards
    const productCards = gridRef.current.querySelectorAll('[data-product-id]');
    productCards.forEach(card => {
      observer.observe(card);
    });
    
    return () => {
      if (productCards.length) {
        productCards.forEach(card => {
          observer.unobserve(card);
        });
      }
    };
  }, [displayedProducts.length]);

  // Add styles for animations
  AnimationStyles();
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Featured Cake */}
      {displayedProducts.length > 0 && (
        <FeaturedCake product={displayedProducts[0]} />
      )}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center">Our Collection</h1>
        <p className="text-gray-600 mt-2 text-center">
          Browse our premium custom cakes and bakery items
        </p>
      </div>
      
      {/* Products Grid */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedProducts.slice(0, 6).map((product: any) => { // Only show first 6 products
          // Ensure we extract ID consistently
          const productIdStr = String(product.id.split('/').pop() || '1');
          // Default to visible if not explicitly set to false
          const isVisible = isInViewport[productIdStr] !== false; 
          
          return (
            <div 
              key={product.id} 
              data-product-id={productIdStr} 
              className="product-card-container"
            >
              <ProductCard 
                product={product} 
                forceVisible={isVisible} 
              />
            </div>
          );
        })}
      </div>
      
      {displayedProducts.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">No products available</h2>
          <p className="text-gray-500 mt-2">
            Please check back later or contact us for more information.
          </p>
        </div>
      )}
      
      {/* View all products button */}
      <div className="text-center mt-12">
        <Link 
          to="/shop" 
          className="inline-block bg-pink-500 text-white font-medium px-6 py-3 rounded-md hover:bg-pink-600 transition shadow-md"
        >
          View All Products
        </Link>
      </div>
      
      {/* Banh Mi Marquee */}
      <BanhMiMarquee />
    </div>
  );
} 
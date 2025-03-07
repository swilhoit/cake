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
};

// Create a global WebGL context manager
const WebGLContextManager: WebGLContextManagerType = {
  maxContexts: 4, // Reduce from 8 to 4 for more safety
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
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Return parameters optimized for the current device
  // Always try to load 3D models, regardless of device
  return {
    isMobile,
    shouldUseImages: false, // Never use fallback images
    dpr: [1, 2] // Sensible DPR range for most devices
  };
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
function ProductCard({ product, index }: { product: any, index: number }) {
  const { addToCart } = useShopContext();
  const [isVisible, setIsVisible] = useState(true);
  const [modelError, setModelError] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const { isMobile, shouldUseImages, dpr } = getDeviceCapabilities();
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [scaleValue] = useState(1.3);
  const [containerScale, setContainerScale] = useState(1);
  const [modelReady, setModelReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Extract product ID from the Shopify handle or use a default ID
  const productId = product.id ? parseInt(product.id.split('/').pop() || '1', 10) : 1;

  console.log(`[HOME] ProductCard for ID ${productId}: isVisible=${isVisible}, useFallbackImage=${useFallbackImage}`);

  // Handle model loading complete
  const handleModelLoaded = useCallback(() => {
    console.log(`[HOME] Model loaded successfully for product ${productId}`);
    setModelReady(true);
    setModelError(false);
  }, [productId]);

  // Handle 3D model error with retry mechanism
  const handleModelError = useCallback((error: string) => {
    console.log(`[HOME] Model error for product ${productId}: ${error}`);
    setModelError(true);
    
    // Keep retrying without giving up
    if (retryCount < 5) {
      setTimeout(() => {
        setModelError(false);
        setRetryCount(prev => prev + 1);
      }, 500 * (retryCount + 1));
    }
  }, [productId, retryCount]);

  // Get appropriate fallback image URL (only for error placeholders)
  const getFallbackImageUrl = () => {
    if (product.featuredImage?.url) {
      return product.featuredImage.url;
    }
    // For mock products
    if (product.images?.[0]?.src) {
      return product.images[0].src;
    }
    // Default/placeholder image
    return 'https://storage.googleapis.com/kgbakerycakes/placeholder-cake.jpg';
  };

  // Navigate to product page when card is clicked
  const goToProductPage = () => {
    if (product) {
      const handle = product.handle || `product-${productId}`;
      navigate(`/product/${handle}`);
    }
  };

  return (
    <div 
      ref={cardRef}
      onClick={goToProductPage} 
      className="relative h-80 w-full cursor-pointer overflow-visible" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {useFallbackImage ? (
        <img 
          src={getFallbackImageUrl()} 
          alt={product.title} 
          className="w-full h-full object-contain transition-transform duration-500 ease-out"
          style={{ transform: `scale(${isHovered ? 1.5 : 1})` }}
        />
      ) : (
        <div 
          className="w-full h-full relative model-placeholder"
          data-product-id={productId} 
          data-index={index}
          style={{ transform: `scale(${isHovered ? 1.1 : 1})` }}
        >
          {/* This div will be used as a portal target for the shared canvas */}
        </div>
      )}

      <div className="absolute bottom-0 left-0 w-full bg-white bg-opacity-80 p-2">
        <h3 className="text-lg font-bold">{product.title}</h3>
        <p className="text-sm text-gray-700">
          ${parseFloat(product.variants[0].price).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// Create a shared canvas component that will render all models
function SharedModelCanvas({ products }: { products: any[] }) {
  const { isMobile, dpr } = getDeviceCapabilities();
  const [visibleModels, setVisibleModels] = useState<Record<string, boolean>>({});
  const [activeModel, setActiveModel] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Setup intersection observer to detect which model containers are visible
  useEffect(() => {
    const containers = document.querySelectorAll('.model-placeholder');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const productId = entry.target.getAttribute('data-product-id');
          if (productId) {
            setVisibleModels(prev => ({
              ...prev,
              [productId]: entry.isIntersecting
            }));
            
            // If this model is coming into view and no active model, set it as active
            if (entry.isIntersecting && activeModel === null) {
              setActiveModel(parseInt(productId));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    containers.forEach(container => {
      observer.observe(container);
    });
    
    return () => {
      containers.forEach(container => {
        observer.unobserve(container);
      });
    };
  }, [products, activeModel]);
  
  // Handle model hover to make it the active one
  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      const productId = target.getAttribute('data-product-id');
      if (productId) {
        setActiveModel(parseInt(productId));
      }
    };
    
    const containers = document.querySelectorAll('.model-placeholder');
    containers.forEach(container => {
      container.addEventListener('mouseenter', handleMouseEnter as EventListener);
    });
    
    return () => {
      containers.forEach(container => {
        container.removeEventListener('mouseenter', handleMouseEnter as EventListener);
      });
    };
  }, [products]);
  
  // Portal the canvas to the active model container
  useEffect(() => {
    if (activeModel !== null && canvasRef.current) {
      // Find the container for the active model
      const container = document.querySelector(`.model-placeholder[data-product-id="${activeModel}"]`);
      if (container) {
        // Move the canvas to this container
        container.appendChild(canvasRef.current);
      }
    }
  }, [activeModel, canvasRef]);

  return (
    <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 4.0], fov: 30 }}
        dpr={dpr}
        className="!touch-none absolute inset-0 w-full h-full"
        frameloop="always"
        style={{ 
          background: 'transparent',
          position: 'absolute',
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
        onCreated={({ gl }) => {
          console.log(`[HOME] Shared Canvas created`);
          WebGLContextManager.addContext();
          
          gl.setClearColor(new THREE.Color('#f8f9fa'), 0);
          
          if ('physicallyCorrectLights' in gl) {
            (gl as any).physicallyCorrectLights = true;
          }
          
          if (isMobile) {
            gl.shadowMap.enabled = false;
            if ('powerPreference' in gl) {
              (gl as any).powerPreference = "low-power";
            }
          } else {
            gl.setPixelRatio(window.devicePixelRatio || 1);
          }
        }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.0} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow={!isMobile} />
        
        {activeModel !== null && (
          <Suspense fallback={<ModelLoadingFallback />}>
            <>
              <Model3D 
                productId={activeModel} 
                scale={1.3}
                rotationSpeed={0.005}
                isDetailView={false}
              />
              {!isMobile && <Environment preset="city" />}
            </>
          </Suspense>
        )}
        
        <OrbitControls
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0}
          rotateSpeed={0.5}
          enableDamping={!isMobile}
          dampingFactor={0.1}
        />
      </Canvas>
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
      
      {/* Shared Canvas for all models */}
      {!loading && displayedProducts.length > 0 && (
        <SharedModelCanvas products={displayedProducts} />
      )}
      
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
                  <ProductCard product={product} index={index} />
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
    </div>
  );
} 
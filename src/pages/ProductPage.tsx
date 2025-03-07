import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShopContext } from '../context/ShopContext';
import { fetchProductById } from '../lib/shopify';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import Model3D from '../components/Model3D';
import * as THREE from 'three';
import { mockProducts } from '../pages/HomePage';

// Mock gallery images for when the real product doesn't have images
const mockImages = [
  '/cake-gallery-1.jpg',
  '/cake-gallery-2.jpg',
  '/cake-gallery-3.jpg',
  '/cake-gallery-4.jpg',
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

// Check if the Shopify configuration has been updated from the placeholder values
const isShopifyConfigured = () => {
  try {
    // This assumes shopifyClient is exported from lib/shopify
    const domain = (window as any).shopifyClient?.config?.domain;
    const token = (window as any).shopifyClient?.config?.storefrontAccessToken;
    
    return !(
      domain === 'YOUR_STORE_NAME.myshopify.com' ||
      token === 'YOUR_STOREFRONT_API_TOKEN'
    );
  } catch (error) {
    console.error('Error checking Shopify configuration:', error);
    return false;
  }
};

// Loading component for Suspense fallback without text
function ModelLoading() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-white/70 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-center">
          <img 
            src="/KG_Logo.gif" 
            alt="Loading" 
            className="h-16 w-auto object-contain"
          />
        </div>
        <div className="flex space-x-2 mt-3">
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </Html>
  );
}

// Fallback component for when model fails to load without text
function FallbackProduct() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-white/70 backdrop-blur-sm shadow-lg">
        <div className="text-pink-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>
    </Html>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [modelError, setModelError] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const { addToCart } = useShopContext();
  const { isMobile, shouldUseImages, dpr } = getDeviceCapabilities();
  const [retryCount, setRetryCount] = useState(0);
  const [use3DModel, setUse3DModel] = useState(true);

  // For performance on mobile, check if we should use fallback images
  useEffect(() => {
    if (shouldUseImages) {
      setUseFallbackImage(true);
    }
  }, [shouldUseImages]);

  // Handle 3D model error with retry mechanism
  const handleModelError = () => {
    console.log(`Model error in ProductPage, retry: ${retryCount}`);
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

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      
      setLoading(true);
      
      // Function to find a mock product if needed
      const findMockProduct = (productId: string) => {
        const numericId = parseInt(productId, 10);
        return mockProducts.find(p => {
          const mockId = parseInt(p.id.split('/').pop() || '0', 10);
          return mockId === numericId;
        });
      };
      
      try {
        // Check if using mock data (either by choice or because Shopify is not configured)
        const usingMockData = !isShopifyConfigured();
        
        if (usingMockData) {
          console.log("Using mock product data instead of Shopify");
          const mockProduct = findMockProduct(id);
          
          if (mockProduct) {
            setProduct(mockProduct);
            
            // Set the first variant as the selected one
            if (mockProduct.variants && mockProduct.variants.length > 0) {
              setSelectedVariant(mockProduct.variants[0]);
            }
            
            console.log("Mock product loaded:", mockProduct.title);
          } else {
            console.error("Failed to find mock product with ID:", id);
            navigate('/shop');
          }
        } else {
          // Try to fetch from Shopify
          // Check if id is just a number (from URL parameter)
          // If so, reconstruct the full Shopify ID format
          let fullProductId = id;
          if (/^\d+$/.test(id)) {
            fullProductId = `gid://shopify/Product/${id}`;
            console.log("Reconstructed product ID:", fullProductId);
          }
          
          const fetchedProduct = await fetchProductById(fullProductId);
          
          if (fetchedProduct) {
            setProduct(fetchedProduct);
            
            // Set the first variant as the selected one
            if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
              setSelectedVariant(fetchedProduct.variants[0]);
            }
            
            console.log("Product fetched successfully:", fetchedProduct.title);
          } else {
            console.error("Failed to fetch product from Shopify, trying mock data");
            const mockProduct = findMockProduct(id);
            
            if (mockProduct) {
              setProduct(mockProduct);
              
              if (mockProduct.variants && mockProduct.variants.length > 0) {
                setSelectedVariant(mockProduct.variants[0]);
              }
              
              console.log("Fallback to mock product:", mockProduct.title);
            } else {
              console.error("Could not find product in mock data either");
              navigate('/shop');
            }
          }
        }
      } catch (error) {
        console.error("Error in product loading process:", error);
        
        // Try to use mock data as fallback
        const mockProduct = findMockProduct(id);
        if (mockProduct) {
          setProduct(mockProduct);
          
          if (mockProduct.variants && mockProduct.variants.length > 0) {
            setSelectedVariant(mockProduct.variants[0]);
          }
          
          console.log("Error recovery: Using mock product:", mockProduct.title);
        } else {
          navigate('/shop');
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [id, navigate]);
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuantity(parseInt(e.target.value, 10));
  };
  
  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const variantId = e.target.value;
    const variant = product.variants.find((v: any) => v.id === variantId);
    setSelectedVariant(variant);
  };
  
  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    // Create a flashy notification 
    console.log(`Adding to cart: ${product.title}, variant: ${selectedVariant.title}, quantity: ${quantity}`);
    addToCart(selectedVariant.id, quantity);
    
    // Show a confirmation message
    const confirmElement = document.getElementById('add-confirmation');
    if (confirmElement) {
      confirmElement.style.opacity = '1';
      setTimeout(() => {
        confirmElement.style.opacity = '0';
      }, 2000);
    }
  };
  
  const handleImageClick = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    setShowImageModal(true);
  };
  
  const getProductImages = (): string[] => {
    if (product?.images && product.images.length > 0) {
      return product.images.map((img: any) => img.src);
    }
    return mockImages;
  };
  
  // Extract numeric product ID for model rotation
  const extractProductId = () => {
    if (!id) return 1;
    
    // If it's already a number, use it
    if (/^\d+$/.test(id)) {
      return parseInt(id, 10);
    }
    
    // If it's a Shopify ID format (gid://shopify/Product/X), extract the numeric part
    const match = id.match(/\/Product\/(\d+)$/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    
    // If it's stored in the product object and has Shopify format
    if (product?.id) {
      const productMatch = product.id.toString().match(/\/Product\/(\d+)$/);
      if (productMatch && productMatch[1]) {
        return parseInt(productMatch[1], 10);
      }
    }
    
    // Fallback to a sequential ID based on the product title if available
    if (product?.title) {
      // Use the length of the title as a simple hash
      return product.title.length % 10 + 1;
    }
    
    // Ultimate fallback
    return 1;
  };

  const productId = extractProductId();
  
  // Generate mock images for when product images are unavailable or as fallbacks
  const mockImages = useMemo(() => {
    const baseId = productId || 1;
    return [
      `/images/cake-${(baseId % 4) + 1}.jpg`,
      `/images/cake-${((baseId + 1) % 4) + 1}.jpg`,
    ];
  }, [productId]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
          <p className="mt-4 text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Product Image/3D Model */}
        <div>
          <div className="rounded-lg overflow-hidden h-[800px] relative">
            {useFallbackImage ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img 
                  src={selectedImage || (product?.images && product.images[0])} 
                  alt={product?.title} 
                  className="w-full h-auto object-contain"  
                />
              </div>
            ) : (
              <Canvas
                camera={{ position: [0, 0, 4.2], fov: 35 }}
                dpr={dpr}
                gl={{ 
                  antialias: true,
                  alpha: true,
                  preserveDrawingBuffer: true,
                  powerPreference: 'default',
                  depth: true
                }}
                style={{ 
                  background: 'transparent',
                  width: '100%', 
                  height: '100%',
                  borderRadius: '0.5rem',
                  outline: 'none'
                }}
                onCreated={({ gl }) => {
                  // Set clear color with full transparency
                  gl.setClearColor(0x000000, 0);
                }}
                onError={() => handleModelError()}
              >
                <ambientLight intensity={1.0} />
                <spotLight 
                  position={[10, 10, 10]} 
                  angle={0.15} 
                  penumbra={1} 
                  intensity={1.5}
                  castShadow 
                />
                <spotLight 
                  position={[-10, 5, -10]} 
                  angle={0.3} 
                  penumbra={1} 
                  intensity={1.2}
                  color="#fff9e0"  
                  castShadow={false} 
                />
                <directionalLight
                  position={[0, 5, 5]}
                  intensity={1.0}
                  color="#ffffff"
                />
                
                <Suspense fallback={<ModelLoading />}>
                  {!modelError ? (
                    <>
                      <Model3D 
                        scale={2.5}
                        rotationSpeed={0.003} 
                        productId={id}
                        isDetailView={true}
                      />
                      <Environment preset="city" />
                    </>
                  ) : (
                    <FallbackProduct />
                  )}
                </Suspense>
                
                <OrbitControls 
                  autoRotate={false}
                  enableZoom={true}
                  maxZoom={2.5}
                  minZoom={0.6}
                  maxPolarAngle={Math.PI / 1.5}
                  minPolarAngle={0}
                />
              </Canvas>
            )}
          </div>
        </div>
        
        {/* Product Information */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-800">{product.title}</h1>
          
          <div className="mt-4">
            <p className="text-2xl text-indigo-600 font-medium">
              ${selectedVariant ? selectedVariant.price : product.variants[0].price}
            </p>
          </div>
          
          {product.descriptionHtml ? (
            <div className="mt-6 prose" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
          ) : (
            <div className="mt-6 prose">
              <p>{product.description}</p>
            </div>
          )}
          
          <div className="mt-8 space-y-4">
            {/* Variant Selector (if there are variants) */}
            {product.variants && product.variants.length > 1 && (
              <div>
                <label htmlFor="variant" className="block text-sm font-medium text-gray-700">
                  Options
                </label>
                <select
                  id="variant"
                  name="variant"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedVariant ? selectedVariant.id : ''}
                  onChange={handleVariantChange}
                >
                  {product.variants.map((variant: any) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Quantity Selector */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <select
                id="quantity"
                name="quantity"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={quantity}
                onChange={handleQuantityChange}
              >
                {[...Array(10)].map((_, i) => {
                  const num = i + 1;
                  return (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  );
                })}
              </select>
            </div>
            
            {/* Add to Cart Button */}
            <div className="relative">
              <button
                onClick={handleAddToCart}
                className="w-full bg-button-gradient border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-gray-800 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-300 shadow-sm"
              >
                Add to Cart
              </button>
              
              {/* Confirmation message */}
              <div 
                id="add-confirmation"
                className="absolute top-0 left-0 right-0 -mt-10 bg-green-100 text-green-800 px-4 py-2 rounded opacity-0 transition-opacity duration-300"
              >
                Added to cart!
              </div>
            </div>
          </div>
          
          {/* Additional Product Information */}
          <div className="mt-10">
            <h2 className="text-lg font-medium text-gray-900">Details</h2>
            <div className="mt-4 border-t border-gray-200 pt-4">
              {product.tags && product.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No additional details available</p>
              )}
            </div>
          </div>
          
          {/* Extended Details Section with More Height */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6 min-h-[300px]">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Features & Benefits</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Made with premium ingredients for exceptional taste</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Freshly baked daily by our expert pastry chefs</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Perfect for special occasions and celebrations</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Available for delivery or pickup at your convenience</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Custom sizing and decoration options available upon request</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-3xl max-h-screen p-4">
            <img src={selectedImage} alt="Product detail" className="max-w-full max-h-[80vh] object-contain" />
            <button 
              className="absolute top-4 right-4 bg-white rounded-full p-2"
              onClick={() => setShowImageModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
import { useState, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShopContext } from '../context/ShopContext';
import { fetchProductById } from '../lib/shopify';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import Model3D from '../components/Model3D';
import * as THREE from 'three';

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
      
      try {
        // First try to fetch from Shopify
        const fetchedProduct = await fetchProductById(id);
        
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          
          // Set the first variant as the selected one
          if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
            setSelectedVariant(fetchedProduct.variants[0]);
          }
          
          console.log("Product fetched successfully:", fetchedProduct.title);
        } else {
          console.error("Failed to fetch product");
          // If we couldn't get the product, go back to shop
          navigate('/shop');
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        navigate('/shop');
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
  const productId = id ? parseInt(id.split('-').pop() || '1', 10) : 1;
  
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
          <div className="rounded-lg overflow-hidden h-96 relative bg-gray-50">
            {useFallbackImage ? (
              // Use first product image as fallback
              <img 
                src={getProductImages()[0]} 
                alt={product.title} 
                className="w-full h-full object-contain"
                onClick={() => handleImageClick(getProductImages()[0])}
              />
            ) : (
              <Canvas
                camera={{ position: [0, 0, 4.5], fov: 35 }}
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
                      <Model3D 
                        scale={1.5} 
                        rotationSpeed={isMobile ? 0.003 : 0.005} 
                        productId={productId} 
                        isDetailView={true} 
                        onError={handleModelError}
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
                  enableZoom={true} 
                  enablePan={false}
                  maxPolarAngle={Math.PI / 1.5}
                  minPolarAngle={0}
                  dampingFactor={0.1}
                  rotateSpeed={0.5}
                  enableDamping={!isMobile}
                />
              </Canvas>
            )}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <div className="inline-block bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-gray-700">
                Drag to rotate • Pinch to zoom
              </div>
            </div>
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
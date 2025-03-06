import { useState, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { fetchProductById } from '../lib/shopify';
import Model3D from '../components/Model3D';
import { useShopContext } from '../context/ShopContext';
import { mockProducts } from './HomePage';

// Mock images for the gallery if product doesn't have images
const mockGalleryImages = [
  '/cake-gallery-1.jpg',
  '/cake-gallery-2.jpg',
  '/cake-gallery-3.jpg',
  '/cake-gallery-4.jpg',
];

// Function to check if the device is mobile
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [modelError, setModelError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const { addToCart } = useShopContext();
  const isMobile = isMobileDevice();

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
          
          // Set the first image as selected if available
          if (fetchedProduct.images && fetchedProduct.images.length > 0) {
            setSelectedImage(fetchedProduct.images[0].src);
          }
        } else {
          // If Shopify fetch fails, try to find the product in our mock data
          const mockProduct = mockProducts.find(p => p.id.split('/').pop() === id);
          
          if (mockProduct) {
            setProduct(mockProduct);
            if (mockProduct.variants && mockProduct.variants.length > 0) {
              setSelectedVariant(mockProduct.variants[0]);
            }
            // For mock products, if there are no images, we'll show the gallery later with mock images
          } else {
            // If product not found in mock data either, navigate back to shop
            console.error(`Product with ID ${id} not found`);
            setTimeout(() => {
              navigate('/shop');
            }, 3000);
          }
        }
      } catch (error) {
        console.error("Error loading product:", error);
        // Fallback to mock data on error
        const mockProduct = mockProducts.find(p => p.id.split('/').pop() === id);
        if (mockProduct) {
          setProduct(mockProduct);
          if (mockProduct.variants && mockProduct.variants.length > 0) {
            setSelectedVariant(mockProduct.variants[0]);
          }
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
    if (selectedVariant) {
      console.log(`Adding to cart from ProductPage: ${product.title} (Variant: ${selectedVariant.title || 'Default'}, Quantity: ${quantity})`);
      addToCart(selectedVariant.id, quantity);
      
      // Show a confirmation message
      const confirmationElement = document.getElementById('add-confirmation');
      if (confirmationElement) {
        confirmationElement.classList.remove('opacity-0');
        confirmationElement.classList.add('opacity-100');
        
        // Hide the confirmation after 3 seconds
        setTimeout(() => {
          confirmationElement.classList.remove('opacity-100');
          confirmationElement.classList.add('opacity-0');
        }, 3000);
      }
    }
  };

  const handleImageClick = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    setShowImageModal(true);
  };

  const getProductImages = (): string[] => {
    if (product && product.images && product.images.length > 0) {
      return product.images.map((img: any) => img.src);
    }
    return mockGalleryImages;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Product Not Found</h1>
          <p className="mt-4 text-gray-600">
            Sorry, the product you're looking for doesn't exist or may have been removed.
          </p>
          <p className="mt-2 text-gray-600">Redirecting to shop...</p>
        </div>
      </div>
    );
  }

  // Extract numeric product ID for the 3D model
  const productId = parseInt(id || '1', 10);
  const productImages = getProductImages();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 3D Model Viewer */}
        <div>
          {/* 3D Model Viewer */}
          <div className="relative h-96 md:h-[500px] border rounded-lg overflow-hidden bg-transparent">
            <Canvas
              camera={{ position: [0, 0, 5.5], fov: 35 }}
              className="w-full h-full"
              onError={() => setModelError(true)}
              dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower resolution on mobile
              frameloop={isMobile ? "demand" : "always"} // Only render when needed on mobile
            >
              <ambientLight intensity={0.8} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
              
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
                      scale={1.8} 
                      rotationSpeed={0.003}
                      productId={productId}
                      isDetailView={true} 
                    />
                    <Environment preset="city" />
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
              />
            </Canvas>
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
                  value={selectedVariant ? selectedVariant.id : ''}
                  onChange={handleVariantChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                value={quantity}
                onChange={handleQuantityChange}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Add to Cart Button */}
            <div className="relative">
              <button
                onClick={handleAddToCart}
                className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl max-h-full">
            <button 
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={selectedImage} 
              alt="Product" 
              className="max-w-full max-h-[80vh] object-contain"
              onError={(e) => {
                // If image fails to load, set a placeholder
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 
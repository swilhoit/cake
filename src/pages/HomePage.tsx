import { Link } from 'react-router-dom';
import { Suspense, useState, useEffect } from 'react';
import { useShopContext } from '../context/ShopContext';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import Model3D from '../components/Model3D';

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
  }
];

// Function to check if the device is mobile
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Product card with 3D model
function ProductCard({ product }: { product: any }) {
  const { addToCart } = useShopContext();
  const [isVisible, setIsVisible] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const isMobile = isMobileDevice();

  // Extract product ID from the Shopify handle or use a default ID
  const productId = product.id ? parseInt(product.id.split('/').pop() || '1', 10) : 1;

  // For performance on mobile, we might want to use images instead of 3D models
  useEffect(() => {
    // On very low-end devices, just use images
    if (isMobile && window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency < 4) {
      setUseFallbackImage(true);
      return;
    }
    
    // Only show the model after a short delay to ensure initial mount is complete
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isMobile]);

  const handleAddToCart = () => {
    console.log("Adding to cart:", product.title, "variant:", product.variants[0].id);
    addToCart(product.variants[0].id, 1);
  };

  // Get fallback image URL
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
            dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower resolution on mobile
            className="!touch-none" /* Fix for mobile touch handling */
            frameloop={isMobile ? "demand" : "always"} // Only render on demand for mobile
            onError={() => setModelError(true)}
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
                  <Model3D scale={1.3} rotationSpeed={0.005} productId={productId} />
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
              enableZoom={false}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={0}
              rotateSpeed={0.5}
              enableDamping={false}
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
          className="w-full bg-blue-600/80 hover:bg-blue-700 text-white py-2 rounded-md transition"
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
      </div>
    </div>
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
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800">Our Collection</h2>
            <p className="text-gray-600 mt-2">
              Explore our beautifully crafted custom cakes
            </p>
          </div>
          
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
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>
      
      {/* Why Choose Us Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Why Choose Us</h2>
            <p className="text-gray-600 mt-2">
              What makes our custom cakes special
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-indigo-600 text-4xl mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                We use only the finest ingredients to create delicious cakes that look as good as they taste.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-indigo-600 text-4xl mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Custom Designs</h3>
              <p className="text-gray-600">
                Every cake is custom made to your specifications, ensuring a unique and personalized creation.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-indigo-600 text-4xl mb-4 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Fair Pricing</h3>
              <p className="text-gray-600">
                Our custom cakes are competitively priced, offering excellent value for the quality and craftsmanship.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className="py-16 bg-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Order Your Custom Cake?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Browse our collection and find the perfect cake for your special occasion
          </p>
          <Link 
            to="/shop" 
            className="bg-white text-indigo-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors inline-block"
          >
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
} 
import { Link } from 'react-router-dom';
import { useShopContext } from '../context/ShopContext';
import Model3D from '../components/Model3D';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';

function ProductCard({ product }: { product: any }) {
  const { addToCart } = useShopContext();
  const [isVisible, setIsVisible] = useState(false);
  const [modelError, setModelError] = useState(false);

  // Only show the model after a short delay to ensure initial mount is complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Extract product ID from the Shopify handle or use a default numeric ID
  const productId = 
    product.id ? 
    parseInt(product.id.split('/').pop() || '1', 10) : 
    1;

  return (
    <div className="backdrop-blur-sm overflow-hidden flex flex-col border border-gray-200/20 rounded-lg transition-all duration-300 hover:border-blue-300/30">
      {/* 3D Model Display */}
      <div className="relative h-80 w-full">
        {isVisible && (
          <Canvas
            camera={{ position: [0, 0, 4.0], fov: 30 }}
            dpr={[1, 2]}
            className="!touch-none" /* Fix for mobile touch handling */
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
          onClick={() => addToCart(product.variants[0].id, 1)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { products, loading } = useShopContext();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Shop Our Collection</h1>
        <p className="text-gray-600 mt-2">
          Browse our premium custom cakes and bakery items
        </p>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">No products available</h2>
          <p className="text-gray-500 mt-2">
            Please check back later or contact us for more information.
          </p>
        </div>
      )}
    </div>
  );
} 
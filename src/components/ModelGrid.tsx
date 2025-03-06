import React, { Suspense, useState, useEffect } from 'react';
import Model3D from './Model3D';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';

// Product data (mock) - exactly 16 products for a 4x4 grid
const products = [
  { id: 1, name: 'Premium Model', price: '$29.99', description: 'Our flagship model with premium finish' },
  { id: 2, name: 'Deluxe Edition', price: '$39.99', description: 'Limited edition with special features' },
  { id: 3, name: 'Standard Model', price: '$19.99', description: 'Classic design for everyday use' },
  { id: 4, name: 'Basic Model', price: '$14.99', description: 'Simple and elegant design' },
  { id: 5, name: 'Pro Series', price: '$49.99', description: 'Professional grade with advanced features' },
  { id: 6, name: 'Limited Collection', price: '$59.99', description: 'Exclusive limited run series' },
  { id: 7, name: 'Essential Model', price: '$24.99', description: 'Essential features in a compact design' },
  { id: 8, name: 'Ultra Edition', price: '$69.99', description: 'Our most advanced model' },
  { id: 9, name: 'Compact Model', price: '$17.99', description: 'Space-saving design for small spaces' },
  { id: 10, name: 'Designer Series', price: '$54.99', description: 'Designer collaboration special edition' },
  { id: 11, name: 'Eco-Friendly', price: '$34.99', description: 'Made with sustainable materials' },
  { id: 12, name: 'Travel Edition', price: '$27.99', description: 'Perfect for on-the-go use' },
  { id: 13, name: 'Vintage Collection', price: '$44.99', description: 'Classic design with modern features' },
  { id: 14, name: 'Modern Series', price: '$32.99', description: 'Sleek, modern design for any space' },
  { id: 15, name: 'Exclusive Model', price: '$79.99', description: 'Members-only exclusive design' },
  { id: 16, name: 'Value Edition', price: '$22.99', description: 'Great value without compromising quality' },
];

// Loading component for Suspense fallback
function ModelLoading() {
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

// Error component for failed model loading
function ModelError() {
  return (
    <Html center>
      <div className="flex items-center justify-center">
        <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-full">
          Failed to load model
        </div>
      </div>
    </Html>
  );
}

// ProductCard component with individual Canvas for each card
function ProductCard({ product }: { product: typeof products[0] }) {
  const [modelError, setModelError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show the model after a short delay to ensure initial mount is complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="backdrop-blur-sm overflow-hidden flex flex-col border border-gray-200/20 rounded-lg transition-all duration-300 hover:border-blue-300/30">
      {/* Further increased height for larger canvas - now taller at 80 (20rem) */}
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
            
            <Suspense fallback={<ModelLoading />}>
              {!modelError ? (
                <>
                  <Model3D scale={1.3} rotationSpeed={0.005} productId={product.id} />
                  <Environment preset="city" />
                </>
              ) : (
                <ModelError />
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
      <div className="p-4 flex-grow">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <p className="text-green-600 font-medium mt-1">{product.price}</p>
        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{product.description}</p>
      </div>
      <div className="px-4 pb-4">
        <button className="w-full bg-blue-600/80 hover:bg-blue-700 text-white py-2 rounded-md transition">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

// Main component
export default function ModelGrid() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Product grid with individual 3D models */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
} 
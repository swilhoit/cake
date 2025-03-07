import { Suspense, useState, useEffect } from 'react';
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
      <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-lg">
        <div className="flex items-center">
          <img 
            src="/KG_Logo.gif" 
            alt="KG Bakery" 
            className="h-10 w-auto object-contain"
          />
          <span className="ml-3 text-lg font-bold text-gray-800">KG Bakery</span>
        </div>
        <div className="flex space-x-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-gray-700 text-sm mt-1">Loading cake...</p>
      </div>
    </Html>
  );
}

// Error component for failed model loading
function ModelError() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-white shadow-lg">
        <div className="text-pink-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-700 text-sm text-center">Failed to load model</p>
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
    <div className="backdrop-blur-sm overflow-hidden flex flex-col rounded-lg transition-all duration-300 hover:shadow-lg">
      {/* Further increased height for larger canvas - now taller at 80 (20rem) */}
      <div className="relative h-80 w-full">
        {isVisible && (
          <Canvas
            camera={{ position: [0, 0, 4.0], fov: 30 }}
            dpr={[1, 2]}
            gl={{ 
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: true,
              powerPreference: 'default',
              depth: true
            }}
            className="!touch-none" /* Fix for mobile touch handling */
            onCreated={({ gl }) => {
              // Set clear color with transparency
              gl.setClearColor(0xffffff, 0);
            }}
            onError={() => setModelError(true)}
          >
            <color attach="background" args={["#ffffff00"]} />
            <ambientLight intensity={0.8} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            
            <Suspense fallback={<ModelLoading />}>
              {!modelError ? (
                <>
                  <Model3D scale={1.365} rotationSpeed={0.005} productId={product.id} />
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
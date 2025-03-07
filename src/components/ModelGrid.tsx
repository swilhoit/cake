import { Suspense, useState, useEffect } from 'react';
import Model3D from './Model3D';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { mainLoaderActive } from './LoadingScreen';

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
  // Don't show if the main loader is active
  if (mainLoaderActive) return null;
  
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
  const [hovered, setHovered] = useState(false);
  
  // Handle hover state
  const handleMouseEnter = () => setHovered(true);
  const handleMouseLeave = () => setHovered(false);

  return (
    <div 
      className="bg-white rounded-lg shadow-lg overflow-visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Product Information */}
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
        <p className="text-gray-500 text-sm">{product.price}</p>
      </div>
      
      {/* 3D Model */}
      <div className="h-64 w-full relative overflow-visible">
        <Canvas 
          camera={{ position: [0, 0, 3.5], fov: 35 }}  
          style={{ 
            background: 'transparent',
            overflow: 'visible'
          }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          <Suspense fallback={<ModelLoading />}>
            <Model3D 
              scale={hovered ? 1.2 : 1} 
            />
          </Suspense>
          
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </div>
      
      {/* Product Description */}
      <div className="p-4">
        <p className="text-gray-600 text-sm">{product.description}</p>
      </div>
      
      {/* Call to Action Button */}
      <div className="px-4 pb-4">
        <button 
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// Main component
export default function ModelGrid() {
  // Limit the number of products shown to prevent WebGL context issues
  const [visibleProducts, setVisibleProducts] = useState<typeof products>([]);
  
  useEffect(() => {
    // In production, show fewer products initially to prevent WebGL context issues
    const isProduction = typeof window !== 'undefined' && 
                        window.location.hostname.includes('vercel.app');
    
    // Show 8 products in production, all 16 in development
    const initialCount = isProduction ? 8 : 16;
    setVisibleProducts(products.slice(0, initialCount));
    
    // If in production, load the rest after a delay
    if (isProduction && products.length > initialCount) {
      const timer = setTimeout(() => {
        setVisibleProducts(products);
      }, 2000); // Load the rest after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Product grid with individual 3D models */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
} 
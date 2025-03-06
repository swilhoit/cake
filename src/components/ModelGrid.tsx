import { Canvas } from '@react-three/fiber';
import { Environment, Stage } from '@react-three/drei';
import Model3D from './Model3D';

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

// Product card component for each model
function ProductCard({ product }: { product: typeof products[0] }) {
  return (
    <div className="bg-transparent backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
      <div className="h-64 relative">
        <Canvas>
          <Stage environment="city" intensity={0.3} shadows={false}>
            <Model3D rotationSpeed={0.005 + (product.id * 0.0003)} />
          </Stage>
          <Environment preset="city" />
        </Canvas>
      </div>
      <div className="p-4 bg-white/10">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-xl font-bold text-indigo-700 mb-1">{product.price}</p>
        <p className="text-sm text-gray-800 mb-3 overflow-hidden line-clamp-2">{product.description}</p>
        <button className="w-full py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function ModelGrid() {
  // Use a wrapper with overflow-x to maintain 4x4 grid on small screens
  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="w-[1200px] mx-auto grid grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
} 
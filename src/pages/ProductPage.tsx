import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { fetchProductById } from '../lib/shopify';
import Model3D from '../components/Model3D';
import { useShopContext } from '../context/ShopContext';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useShopContext();

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      
      setLoading(true);
      const fetchedProduct = await fetchProductById(id);
      setProduct(fetchedProduct);
      
      // Set the first variant as the selected one
      if (fetchedProduct && fetchedProduct.variants && fetchedProduct.variants.length > 0) {
        setSelectedVariant(fetchedProduct.variants[0]);
      }
      
      setLoading(false);
    }
    
    loadProduct();
  }, [id]);

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
      addToCart(selectedVariant.id, quantity);
    }
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
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 3D Model Viewer */}
        <div className="relative h-96 md:h-[600px] border rounded-lg overflow-hidden bg-gray-50">
          <Canvas
            camera={{ position: [0, 0, 4.0], fov: 30 }}
            className="w-full h-full"
          >
            <ambientLight intensity={0.8} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            
            <Model3D 
              scale={2} 
              rotationSpeed={0.005}
              productId={parseInt(id || '1', 10)} 
            />
            
            <Environment preset="city" />
            <OrbitControls enableZoom={true} enablePan={false} />
          </Canvas>
        </div>
        
        {/* Product Information */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-800">{product.title}</h1>
          
          <div className="mt-4">
            <p className="text-2xl text-indigo-600 font-medium">
              ${selectedVariant ? selectedVariant.price : product.variants[0].price}
            </p>
          </div>
          
          <div className="mt-6 prose" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
          
          <div className="mt-8 space-y-4">
            {/* Variant Selector (if there are variants) */}
            {product.variants.length > 1 && (
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
            <button
              onClick={handleAddToCart}
              className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add to Cart
            </button>
          </div>
          
          {/* Additional Product Information */}
          <div className="mt-10">
            <h2 className="text-lg font-medium text-gray-900">Details</h2>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <ul className="space-y-2">
                {product.tags && product.tags.map((tag: string, index: number) => (
                  <li key={index} className="text-gray-600">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
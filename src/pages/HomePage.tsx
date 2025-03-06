import { Link } from 'react-router-dom';
import { useShopContext } from '../context/ShopContext';

export default function HomePage() {
  const { products, loading } = useShopContext();
  
  // Get featured products (first 4 products)
  const featuredProducts = loading ? [] : products.slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-96 md:h-[600px]">
          <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Delicious Custom Cakes
            </h1>
            <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl">
              Browse our premium collection of beautifully crafted custom cakes for any occasion
            </p>
            <Link 
              to="/shop" 
              className="bg-white text-indigo-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Featured Products</h2>
            <p className="text-gray-600 mt-2">
              Our most popular custom cake designs
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product: any) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:transform hover:scale-105"
                >
                  <Link to={`/product/${product.id.split('/').pop()}`}>
                    <div className="h-64 bg-gray-200 relative">
                      {product.images && product.images.length > 0 && (
                        <img 
                          src={product.images[0].src} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800">{product.title}</h3>
                      <p className="text-green-600 font-medium mt-1">${product.variants[0].price}</p>
                    </div>
                  </Link>
                </div>
              ))}
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
      <section className="py-16">
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
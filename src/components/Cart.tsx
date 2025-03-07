import { useRef, useEffect } from 'react';
import { useShopContext } from '../context/ShopContext';

// Placeholder image for when product images aren't available
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/80?text=Cake';

export default function Cart() {
  const { isCartOpen, toggleCart, cart, removeFromCart, updateCartItem } = useShopContext();
  const cartRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside of the cart to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node) && isCartOpen) {
        toggleCart();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartOpen, toggleCart]);

  // Prevent scrolling when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isCartOpen]);

  // Get image source for a cart item
  const getItemImage = (item: any): string => {
    if (item.variant && item.variant.image && item.variant.image.src) {
      return item.variant.image.src;
    }
    
    // Use product ID to determine which cake model we'd show
    const productId = item.variant ? item.variant.id.split('/').pop() : '1';
    return `/images/cake-${productId % 4 + 1}.jpg`;
  };

  // Modified to always render the component, but with opacity and transform changes
  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
        isCartOpen ? 'bg-black bg-opacity-50 pointer-events-auto' : 'bg-opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute right-0 h-full flex items-start">
        <div 
          ref={cartRef}
          className={`bg-white w-full max-w-md md:max-w-2xl lg:max-w-3xl h-full shadow-lg flex flex-col transition-transform duration-300 ease-in-out ${
            isCartOpen ? 'transform-none' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Your Cart</h2>
            <button 
              onClick={toggleCart}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {cart && cart.lineItems && cart.lineItems.length > 0 ? (
              cart.lineItems.map((item: any) => (
                <div key={item.id} className="flex border-b py-4">
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={getItemImage(item)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-500">
                      {item.variant.title !== 'Default Title' ? item.variant.title : ''}
                    </p>
                    
                    {/* Display custom attributes if they exist */}
                    {item.customAttributes && (
                      <div className="mt-2 text-xs">
                        {item.customAttributes.customText && (
                          <p className="text-gray-700">
                            <span className="font-medium">Custom Text:</span> {item.customAttributes.customText}
                          </p>
                        )}
                        {item.customAttributes.cakeAccessories && (
                          <p className="text-gray-700">
                            <span className="font-medium">Accessories:</span> {item.customAttributes.cakeAccessories}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Decrease quantity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <span className="mx-2 text-gray-700">{item.quantity}</span>
                      
                      <button
                        onClick={() => updateCartItem(item.id, item.quantity + 1)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Increase quantity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end">
                    <p className="text-sm font-medium">${item.variant.price}</p>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm mt-2"
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="mt-4 text-gray-500">Your cart is empty</p>
                <button 
                  onClick={toggleCart}
                  className="mt-4 bg-button-gradient text-gray-800 font-medium px-4 py-2 rounded hover:opacity-90 transition shadow-sm"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
          
          {cart && cart.lineItems && cart.lineItems.length > 0 && (
            <div className="border-t p-4">
              <div className="flex justify-between mb-4">
                <span className="font-medium">Subtotal</span>
                <span className="font-medium">${cart.subtotalPrice}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Shipping and taxes calculated at checkout
              </p>
              <a
                href={cart.webUrl}
                className="w-full bg-button-gradient text-gray-800 font-medium text-center py-3 rounded-md hover:opacity-90 transition shadow-sm block"
                target="_blank"
                rel="noopener noreferrer"
              >
                Checkout
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import shopifyClient, {
  createCheckout,
  addItemToCheckout,
  removeItemFromCheckout,
  updateItemInCheckout,
  fetchAllProducts
} from '../lib/shopify';

// Define the shape of our context
interface ShopContextType {
  isCartOpen: boolean;
  toggleCart: () => void;
  cart: any; // Shopify checkout object
  cartCount: number;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineItemId: string) => Promise<void>;
  updateCartItem: (lineItemId: string, quantity: number) => Promise<void>;
  products: any[]; // Shopify products
  loading: boolean;
}

// Create the context with default values
const ShopContext = createContext<ShopContextType>({
  isCartOpen: false,
  toggleCart: () => {},
  cart: null,
  cartCount: 0,
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateCartItem: async () => {},
  products: [],
  loading: true,
});

// Hook to use the shop context
export const useShopContext = () => useContext(ShopContext);

// Provider component
export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  // Toggle cart drawer
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  // Initialize checkout
  useEffect(() => {
    const initializeCheckout = async () => {
      // Check if we already have a checkout ID saved
      const existingCheckoutId = localStorage.getItem('checkoutId');
      
      if (existingCheckoutId) {
        try {
          // Fetch the checkout using the existing ID
          const checkout = await shopifyClient.checkout.fetch(existingCheckoutId);
          
          // Make sure this checkout hasn't been completed
          if (checkout && !checkout.completedAt) {
            setCart(checkout);
            setCartCount(checkout.lineItems.length);
            return;
          }
        } catch (error) {
          console.error('Error fetching existing checkout:', error);
          localStorage.removeItem('checkoutId');
        }
      }
      
      // If we get here, we need a new checkout
      const newCheckout = await createCheckout();
      if (newCheckout) {
        localStorage.setItem('checkoutId', newCheckout.id);
        setCart(newCheckout);
      }
    };
    
    // Fetch products
    const fetchProducts = async () => {
      setLoading(true);
      const allProducts = await fetchAllProducts();
      setProducts(allProducts);
      setLoading(false);
    };
    
    // Initialize
    initializeCheckout();
    fetchProducts();
  }, []);

  // Add item to cart
  const addToCart = async (variantId: string, quantity: number) => {
    if (!cart) return;
    
    const lineItemsToAdd = [{ variantId, quantity }];
    
    const updatedCheckout = await addItemToCheckout(cart.id, lineItemsToAdd);
    
    if (updatedCheckout) {
      setCart(updatedCheckout);
      setCartCount(updatedCheckout.lineItems.length);
      setIsCartOpen(true); // Open the cart when adding an item
    }
  };

  // Remove item from cart
  const removeFromCart = async (lineItemId: string) => {
    if (!cart) return;
    
    const updatedCheckout = await removeItemFromCheckout(cart.id, [lineItemId]);
    
    if (updatedCheckout) {
      setCart(updatedCheckout);
      setCartCount(updatedCheckout.lineItems.length);
    }
  };

  // Update item in cart
  const updateCartItem = async (lineItemId: string, quantity: number) => {
    if (!cart) return;
    
    const lineItemsToUpdate = [{ id: lineItemId, quantity }];
    
    const updatedCheckout = await updateItemInCheckout(cart.id, lineItemsToUpdate);
    
    if (updatedCheckout) {
      setCart(updatedCheckout);
      setCartCount(updatedCheckout.lineItems.length);
    }
  };

  return (
    <ShopContext.Provider
      value={{
        isCartOpen,
        toggleCart,
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        updateCartItem,
        products,
        loading,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}; 
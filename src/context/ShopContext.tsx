import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import shopifyClient, {
  createCheckout,
  addItemToCheckout,
  removeItemFromCheckout,
  updateItemInCheckout,
  fetchAllProducts
} from '../lib/shopify';
import { mockProducts } from '../pages/HomePage';

// Mock implementation for cart
class MockCart {
  id: string;
  lineItems: Array<{
    id: string;
    title: string;
    variant: {
      id: string;
      title: string;
      price: string;
    };
    quantity: number;
    image?: any;
  }>;
  subtotalPrice: string;
  webUrl: string;
  completedAt: null;

  constructor() {
    this.id = 'mock-checkout-id';
    this.lineItems = [];
    this.subtotalPrice = '0.00';
    this.webUrl = '#';
    this.completedAt = null;
  }

  addItem(variantId: string, quantity: number) {
    // Find the product/variant in mock products
    let productTitle = 'Unknown Product';
    let variantTitle = 'Default';
    let price = '0.00';
    let image = null;

    for (const product of mockProducts) {
      for (const variant of product.variants) {
        if (variant.id === variantId) {
          productTitle = product.title;
          // Handle case when variant doesn't have a title property
          variantTitle = 'Default';  // Default value
          price = variant.price;
          image = product.images && product.images.length > 0 ? product.images[0] : null;
          break;
        }
      }
    }

    // Check if the item already exists in the cart
    const existingItemIndex = this.lineItems.findIndex(item => item.variant.id === variantId);
    
    if (existingItemIndex >= 0) {
      // If item exists, update quantity
      this.lineItems[existingItemIndex].quantity += quantity;
    } else {
      // If item doesn't exist, add it
      const newItem = {
        id: `mock-line-item-${Date.now()}`,
        title: productTitle,
        variant: {
          id: variantId,
          title: variantTitle,
          price: price,
          image: image
        },
        quantity: quantity
      };
      this.lineItems.push(newItem);
    }

    // Recalculate subtotal
    this.recalculateSubtotal();

    // Return a copy of the cart
    return JSON.parse(JSON.stringify(this));
  }

  updateItem(lineItemId: string, quantity: number) {
    const itemIndex = this.lineItems.findIndex(item => item.id === lineItemId);
    
    if (itemIndex >= 0) {
      this.lineItems[itemIndex].quantity = quantity;
    }

    // Recalculate subtotal
    this.recalculateSubtotal();

    // Return a copy of the cart
    return JSON.parse(JSON.stringify(this));
  }

  removeItem(lineItemId: string) {
    this.lineItems = this.lineItems.filter(item => item.id !== lineItemId);
    
    // Recalculate subtotal
    this.recalculateSubtotal();

    // Return a copy of the cart
    return JSON.parse(JSON.stringify(this));
  }

  recalculateSubtotal() {
    const subtotal = this.lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.variant.price) * item.quantity);
    }, 0);
    
    this.subtotalPrice = subtotal.toFixed(2);
  }
}

// Check if the Shopify configuration has been updated from the placeholder values
const isShopifyConfigured = () => {
  try {
    // Access properties with type assertion and optional chaining
    const domain = (shopifyClient as any)?.config?.domain;
    const token = (shopifyClient as any)?.config?.storefrontAccessToken;
    
    return !(
      domain === 'YOUR_STORE_NAME.myshopify.com' ||
      token === 'YOUR_STOREFRONT_API_TOKEN'
    );
  } catch (error) {
    console.error('Error checking Shopify configuration:', error);
    return false;
  }
};

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
  const [mockCart] = useState<MockCart>(new MockCart());
  const [usingMockCart, setUsingMockCart] = useState(false);

  // Toggle cart drawer
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  // Initialize checkout
  useEffect(() => {
    const initializeCheckout = async () => {
      // Check if Shopify is configured
      if (!isShopifyConfigured()) {
        console.log("Using mock cart because Shopify is not configured");
        setCart(mockCart);
        setCartCount(0);
        setUsingMockCart(true);
        return;
      }
      
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
      
      if (!isShopifyConfigured()) {
        console.log("Using mock products because Shopify is not configured");
        setProducts(mockProducts);
        setLoading(false);
        return;
      }
      
      const allProducts = await fetchAllProducts();
      setProducts(allProducts.length > 0 ? allProducts : mockProducts);
      setLoading(false);
    };
    
    // Initialize
    initializeCheckout();
    fetchProducts();
  }, [mockCart]);

  // Add item to cart
  const addToCart = async (variantId: string, quantity: number) => {
    if (!cart) return;
    
    if (usingMockCart) {
      console.log("Adding to mock cart:", variantId, quantity);
      const updatedCart = mockCart.addItem(variantId, quantity);
      setCart(updatedCart);
      setCartCount(updatedCart.lineItems.length);
      setIsCartOpen(true); // Open the cart when adding an item
      return;
    }
    
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
    
    if (usingMockCart) {
      console.log("Removing from mock cart:", lineItemId);
      const updatedCart = mockCart.removeItem(lineItemId);
      setCart(updatedCart);
      setCartCount(updatedCart.lineItems.length);
      return;
    }
    
    const updatedCheckout = await removeItemFromCheckout(cart.id, [lineItemId]);
    
    if (updatedCheckout) {
      setCart(updatedCheckout);
      setCartCount(updatedCheckout.lineItems.length);
    }
  };

  // Update item in cart
  const updateCartItem = async (lineItemId: string, quantity: number) => {
    if (!cart) return;
    
    if (usingMockCart) {
      console.log("Updating mock cart item:", lineItemId, quantity);
      const updatedCart = mockCart.updateItem(lineItemId, quantity);
      setCart(updatedCart);
      setCartCount(updatedCart.lineItems.length);
      return;
    }
    
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
import { useShopContext } from '../context/ShopContext';

export default function CartIcon() {
  const { toggleCart, cartCount } = useShopContext();

  return (
    <button 
      onClick={toggleCart}
      className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors"
      aria-label="Cart"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
        />
      </svg>
      
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </button>
  );
} 
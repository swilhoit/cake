import { useState } from 'react';
import { Link } from 'react-router-dom';
import CartIcon from './CartIcon';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="shadow-sm bg-transparent">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/KG_Logo.gif" 
                alt="KG Bakery" 
                className="h-12 w-auto object-contain"
              />
              <span className="ml-3 text-xl font-bold text-gray-800 font-playfair">KG Bakery</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-indigo-600 relative group transition-colors duration-300 font-bold font-rubik">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/shop" className="text-gray-700 hover:text-indigo-600 relative group transition-colors duration-300 font-bold font-rubik">
              Shop
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-indigo-600 relative group transition-colors duration-300 font-bold font-rubik">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-indigo-600 relative group transition-colors duration-300 font-bold font-rubik">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <CartIcon />
          </div>
          
          {/* Mobile Navigation Button */}
          <div className="flex items-center md:hidden">
            <CartIcon />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="ml-4 text-gray-700 hover:text-indigo-600 transition-colors"
              aria-label="Toggle menu"
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
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu - Always render but control visibility with CSS */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-60 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/"
                className="text-gray-700 hover:text-indigo-600 transition-all duration-200 py-2 px-3 rounded hover:bg-gray-50 hover:pl-5 font-bold font-rubik"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/shop"
                className="text-gray-700 hover:text-indigo-600 transition-all duration-200 py-2 px-3 rounded hover:bg-gray-50 hover:pl-5 font-bold font-rubik"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop
              </Link>
              <Link 
                to="/about"
                className="text-gray-700 hover:text-indigo-600 transition-all duration-200 py-2 px-3 rounded hover:bg-gray-50 hover:pl-5 font-bold font-rubik"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/contact"
                className="text-gray-700 hover:text-indigo-600 transition-all duration-200 py-2 px-3 rounded hover:bg-gray-50 hover:pl-5 font-bold font-rubik"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
} 
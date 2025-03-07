import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import Header from './components/Header';
import Cart from './components/Cart';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import AboutPage from './pages/AboutPage';
import PageTransition from './components/PageTransition';
import { PreloadProvider } from './context/PreloadContext';
import LoadingScreen from './components/LoadingScreen';
import { Suspense, useEffect, useState } from 'react';
import { useShopContext } from './context/ShopContext';
import { preloadCriticalAssets, getCakeModelPaths } from './utils/preloadUtils';
import { usePreload } from './context/PreloadContext';

// Component to preload critical assets on app startup
const AssetPreloader = () => {
  const { products } = useShopContext();
  const { registerResource, markResourceLoaded } = usePreload();
  const [preloadStarted, setPreloadStarted] = useState(false);
  
  // Register important assets to preload
  useEffect(() => {
    if (preloadStarted) return;
    setPreloadStarted(true);
    console.log("Starting asset preload process");
    
    // Register critical asset resources
    const criticalResources = [
      'app-init',
      'header-render',
      'footer-render',
      'homepage-render',
      '3d-models',
      'bakery-images',
    ];
    
    criticalResources.forEach(resource => {
      registerResource(resource);
    });
    
    // Register important images for the site
    const importantImages = [
      '/images/bakery-storefront.jpg',
      '/images/cake-1.jpg',
      '/images/cake-2.jpg',
      '/images/cake-3.jpg',
      '/images/cake-4.jpg',
      '/KG_Logo.gif',
    ];
    
    // Begin preloading assets with a proper progress tracking
    preloadCriticalAssets({
      imageUrls: importantImages,
      onProgress: (progress) => {
        console.log(`Preloading progress: ${progress.toFixed(1)}%`);
        
        // Mark resources as loaded based on progress milestones
        // Wait longer for models to be fully loaded
        if (progress >= 10) {
          markResourceLoaded('app-init');
          console.log("App init loading complete");
        }
        
        if (progress >= 30) {
          markResourceLoaded('header-render');
          console.log("Header loading complete");
        }
        
        if (progress >= 50) {
          markResourceLoaded('bakery-images');
          console.log("Images loading complete");
        }
        
        if (progress >= 70) {
          markResourceLoaded('footer-render');
          console.log("Footer loading complete");
        }
        
        // Only mark 3D models as complete when we're almost done (95%)
        if (progress >= 95) {
          markResourceLoaded('3d-models');
          console.log("3D models loading complete");
        }
        
        // Only mark homepage as ready when 100% complete
        if (progress >= 100) {
          console.log("All preloading complete, showing homepage");
          markResourceLoaded('homepage-render');
        }
      }
    }).catch(error => {
      console.error("Error during preloading:", error);
      // If there's an error during preloading, mark everything as loaded anyway
      // so the user can still use the site
      criticalResources.forEach(resource => {
        markResourceLoaded(resource);
      });
    });
    
    // Safety fallback - if after 15 seconds we're still loading, mark everything as complete
    const safetyTimeout = setTimeout(() => {
      console.log("Safety timeout reached, marking all resources as loaded");
      criticalResources.forEach(resource => {
        markResourceLoaded(resource);
      });
    }, 15000);
    
    return () => clearTimeout(safetyTimeout);
  }, [registerResource, markResourceLoaded, products, preloadStarted]);
  
  return null;
};

// Main app content
const AppContent = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Cart />
      
      <main className="flex-1">
        <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/about" element={<AboutPage />} />
            {/* Add more routes as needed */}
            <Route path="*" element={
              <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h1>
                <p className="text-lg text-gray-600">
                  The page you're looking for doesn't exist or has been moved.
                </p>
              </div>
            } />
          </Routes>
        </PageTransition>
      </main>
      
      <footer className="py-8 bg-transparent mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Location and Contact Information */}
            <div className="flex flex-col items-center md:items-start">
              <div className="mb-4">
                <img 
                  src="/images/bakery-storefront.jpg" 
                  alt="Sweet Delights Bakery Storefront" 
                  className="h-48 object-cover rounded-lg shadow-md"
                />
              </div>
              <h3 className="text-lg font-bold mb-2">Sweet Delights Bakery</h3>
              <p className="text-gray-600">1234 Cake Avenue</p>
              <p className="text-gray-600">San Francisco, CA 94101</p>
              <p className="text-gray-600">Phone: (555) 123-4567</p>
              <p className="text-gray-600">Fax: (555) 123-4568</p>
            </div>
            
            {/* Business Hours */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold mb-2">Business Hours</h3>
              <p className="text-gray-600">Monday - Friday: 7:00 AM - 8:00 PM</p>
              <p className="text-gray-600">Saturday: 8:00 AM - 8:00 PM</p>
              <p className="text-gray-600">Sunday: 8:00 AM - 6:00 PM</p>
              <p className="text-gray-600 mt-4">Holiday hours may vary</p>
            </div>
            
            {/* Social Media and Links */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold mb-2">Connect With Us</h3>
              <div className="flex justify-center md:justify-start space-x-4 mb-4">
                <a href="#" aria-label="Facebook">
                  <svg className="h-6 w-6 text-pink-500 hover:text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg className="h-6 w-6 text-pink-500 hover:text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                  </svg>
                </a>
                <a href="#" aria-label="Twitter">
                  <svg className="h-6 w-6 text-pink-500 hover:text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
              <p className="text-gray-600">Follow us for updates, promotions, and cake inspiration!</p>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6 text-center">
            <p className="text-gray-500">&copy; {new Date().getFullYear()} Sweet Delights Bakery. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  // Use a longer minimum loading time to ensure models are fully loaded
  // Also implement proper React.StrictMode for stability
  return (
    <React.StrictMode>
      <PreloadProvider minimumLoadingTime={20000}>
        <ShopProvider>
          <Router>
            <Suspense fallback={<div className="fixed inset-0 bg-pink-100 flex items-center justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-pink-500 rounded-full border-t-transparent"></div>
              <div className="ml-4 text-pink-800 font-medium">Loading 3D Models...</div>
            </div>}>
              <AssetPreloader />
              <LoadingScreen />
              <AppContent />
            </Suspense>
          </Router>
        </ShopProvider>
      </PreloadProvider>
    </React.StrictMode>
  );
}

export default App;

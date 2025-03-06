import ModelGrid from './components/ModelGrid';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 px-4 text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="/KG_Logo.gif" 
            alt="KG Logo" 
            className="h-24 object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">KG Bakery</h1>
        <p className="text-lg text-gray-600 mb-6">Browse our collection of premium 3D cake models</p>
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
            Home
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
            Collection
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
            Gallery
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
            About
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
            Contact
          </button>
        </div>
      </header>
      
      <main className="flex-1 px-4 py-6">
        <ModelGrid />
      </main>
      
      <footer className="py-6 text-center text-gray-600">
        <p>&copy; 2023 KG Bakery. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;

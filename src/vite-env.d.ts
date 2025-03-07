/// <reference types="vite/client" />

// Extend window interface to include our model cache
interface Window {
  _modelCache?: Record<string, any>;
}

import { useRef, useState, Suspense } from 'react';
import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, PresentationControls, Html } from '@react-three/drei';
import { Group } from 'three';

// External URL for the 3D model
const EXTERNAL_MODEL_URL = 'https://storage.googleapis.com/kgbakerycakes/tripo_pbr_model_532ee32e-967c-4ffd-a7ac-24e1ba184831.glb';
// Local fallback
const LOCAL_MODEL_URL = '/models/model.glb';

interface ModelProps {
  scale?: number;
  rotationSpeed?: number;
}

// Loader component to handle the actual model loading
function ModelLoader({ modelUrl, scale, rotationSpeed }: { modelUrl: string } & ModelProps) {
  const modelRef = useRef<Group>(null);
  const model = useGLTF(modelUrl);
  
  // Apply rotation animation to the model
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += rotationSpeed || 0.008;
    }
  });
  
  return (
    <group ref={modelRef} scale={[scale || 1.5, scale || 1.5, scale || 1.5]}>
      <primitive object={model.scene} />
    </group>
  );
}

// Error fallback component
function ModelError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <Html center>
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded max-w-sm">
        <h3 className="font-bold">Model Loading Error</h3>
        <p>There was an error loading the 3D model.</p>
        <p className="text-xs mt-2 break-words">
          {error.message || "Unknown error"}
        </p>
        <div className="mt-3 text-xs">
          <p><strong>Troubleshooting:</strong></p>
          <ol className="list-decimal pl-5">
            <li>Make sure Google Cloud Storage CORS is configured</li>
            <li>Check that the model file exists at the correct path</li>
          </ol>
        </div>
        <button 
          onClick={retry}
          className="mt-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    </Html>
  );
}

// Main component
export default function Model3D({ scale = 1.5, rotationSpeed = 0.008 }: ModelProps) {
  const [useLocal, setUseLocal] = useState(false);
  const currentUrl = useLocal ? LOCAL_MODEL_URL : EXTERNAL_MODEL_URL;
  
  // Error handler function
  const handleError = (error: Error) => {
    console.error("Error loading model:", error);
    
    // If using external URL, try local fallback
    if (!useLocal) {
      console.log("Trying local model file instead...");
      setUseLocal(true);
      return <ModelLoader modelUrl={LOCAL_MODEL_URL} scale={scale} rotationSpeed={rotationSpeed} />;
    }
    
    // If both failed, show error
    return <ModelError error={error} retry={() => setUseLocal(false)} />;
  };
  
  return (
    <PresentationControls
      global
      snap
      rotation={[0, 0, 0]}
      polar={[-Math.PI / 4, Math.PI / 4]}
      azimuth={[-Math.PI / 4, Math.PI / 4]}
    >
      <Suspense fallback={
        <Html center>
          <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded">
            <p>Loading model{useLocal ? " (local fallback)" : ""}...</p>
          </div>
        </Html>
      }>
        <ErrorBoundary fallback={handleError}>
          <ModelLoader modelUrl={currentUrl} scale={scale} rotationSpeed={rotationSpeed} />
        </ErrorBoundary>
      </Suspense>
    </PresentationControls>
  );
}

// Custom ErrorBoundary component
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback: (error: Error) => React.ReactNode;
}> {
  state = { hasError: false, error: null as Error | null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Model error caught:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error);
    }
    
    return this.props.children;
  }
} 
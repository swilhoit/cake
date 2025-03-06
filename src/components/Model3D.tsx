import { useRef, useState, useEffect } from 'react';
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

export default function Model3D({ 
  scale = 1.5, 
  rotationSpeed = 0.008 
}: ModelProps) {
  const modelRef = useRef<Group>(null);
  const [errorState, setErrorState] = useState<{ error: boolean, usingLocal: boolean }>({ error: false, usingLocal: false });
  const [modelUrl, setModelUrl] = useState<string>(EXTERNAL_MODEL_URL);
  
  // Try to load the model, with fallback to local file
  let modelData;
  try {
    modelData = useGLTF(modelUrl);
  } catch (error) {
    console.error("Error loading model:", error);
    
    // If external URL failed and we haven't tried local yet
    if (modelUrl === EXTERNAL_MODEL_URL && !errorState.usingLocal) {
      console.log("Trying local model file instead...");
      setModelUrl(LOCAL_MODEL_URL);
      setErrorState({ error: false, usingLocal: true });
    } 
    // If both external and local failed
    else if (modelUrl === LOCAL_MODEL_URL || errorState.usingLocal) {
      if (!errorState.error) {
        setErrorState({ error: true, usingLocal: true });
      }
    }
  }
  
  // Apply rotation animation to the model
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += rotationSpeed;
    }
  });

  if (errorState.error) {
    return (
      <Html center>
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Model Loading Error</h3>
          <p>There was an error loading the 3D model.</p>
          <p className="text-xs mt-2">
            {errorState.usingLocal 
              ? "Both external and local model files failed to load." 
              : "CORS issue with Google Cloud Storage"}
          </p>
        </div>
      </Html>
    );
  }
  
  return (
    <PresentationControls
      global
      snap
      rotation={[0, 0, 0]}
      polar={[-Math.PI / 4, Math.PI / 4]}
      azimuth={[-Math.PI / 4, Math.PI / 4]}
    >
      <group ref={modelRef} scale={[scale, scale, scale]}>
        {modelData && <primitive object={modelData.scene.clone()} />}
      </group>
    </PresentationControls>
  );
}

// Attempt to preload both models
try {
  useGLTF.preload(EXTERNAL_MODEL_URL);
} catch (error) {
  console.error("Error preloading external model:", error);
  try {
    useGLTF.preload(LOCAL_MODEL_URL);
  } catch (error) {
    console.error("Error preloading local model:", error);
  }
} 
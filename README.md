# KG Bakery 3D Model Showcase

A React application that showcases 3D cake models in a beautiful 4x4 grid layout with a pastel animated background.

## Features

- 4x4 grid of interactive 3D cake models
- Animated pastel background with smooth gradient transitions
- Transparent glass-like product cards
- Responsive design
- Built with React, Vite, TypeScript, and Tailwind CSS

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS for styling
- Three.js for 3D rendering
- React Three Fiber as a React renderer for Three.js
- React Three Drei for helpful Three.js components

## Development

To run this project locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## CORS Configuration for 3D Models

This application loads 3D models from Google Cloud Storage. If you encounter CORS errors, you have two options:

### Option 1: Configure Google Cloud Storage CORS

1. Create a `cors-config.json` file:
```json
[
  {
    "origin": ["http://localhost:5173", "http://localhost:5174", "https://your-domain.com"],
    "method": ["GET", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

2. Apply the configuration:
```bash
gcloud storage buckets update gs://your-bucket-name --cors-file=cors-config.json
```

### Option 2: Use Local Models

The application will automatically fall back to local models in the `public/models/` directory if external models fail to load.

## Notes

- 3D models are primarily stored externally and loaded at runtime
- Fallback to local models is available for development purposes

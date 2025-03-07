# Development 3D Model Files

This directory is for storing local copies of 3D model files (.glb) for **development purposes only**.

## Usage During Development

When working on the application locally, you can place GLB models in this directory to allow convenient 
testing without needing to access cloud storage. The models here will **not** be used as fallbacks in production.

The development tooling is designed to recognize when you're working in a local environment 
(`localhost` or `127.0.0.1`) and will prioritize loading from Google Cloud Storage.

## Model File Requirements

1. Use the exact same filenames as in your Google Cloud Storage bucket
2. Only use GLB format files
3. Keep models optimized for web (smaller file size)

## Supported Models

Place models with these exact filenames:

- `nemo.glb`
- `strawberry.glb`
- `princess.glb`
- `spongebob1.glb`
- `turkey.glb`

## Important Note

The production application ONLY uses models from Google Cloud Storage. This directory is solely to make development and testing more efficient. 
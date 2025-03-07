# Fallback Images for 3D Models

This directory contains fallback images that are used when 3D models fail to load. The application will try to load a matching image for each cake variant if the 3D model cannot be loaded due to CORS issues, network problems, or missing model files.

## Image Requirements

1. Use JPG format for best compatibility
2. Name files to match model names (e.g., `nemo.jpg`, `strawberry.jpg`, etc.)
3. Include a `default.jpg` to be used as a default fallback

## Supported Cake Variants

The application will look for images matching these cake variant names:

- `nemo.jpg`
- `strawberry.jpg`
- `princess.jpg`
- `spongebob1.jpg`
- `turkey.jpg`
- `default.jpg` (fallback if variant-specific image not found)

Place your images in this directory to ensure the application can display something for users even when 3D models cannot be loaded. 
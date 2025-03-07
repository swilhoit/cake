# Local 3D Models for Development

This directory contains local copies of 3D models for development purposes.

When developing locally, CORS issues may prevent loading models directly from Google Cloud Storage. 
The application is configured to look for models in this directory when running in development mode.

## Model Naming

To make a model available locally, place the `.glb` file in this directory with the exact same filename
as the one referenced in the application. For example:

- strawberry.glb
- nemo.glb
- princess.glb
- spongebob1.glb
- turkey.glb

## How It Works

When the application detects it's running in a development environment (localhost), 
it will first attempt to load models from Google Cloud Storage. If that fails due to CORS issues,
it will automatically fall back to checking for a local copy in this directory.

No code changes are required - just place the models here and the app will find them. 
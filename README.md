# KG Bakery - 3D Cake Models with Shopify Integration

This project showcases a modern e-commerce website for KG Bakery featuring interactive 3D cake models integrated with Shopify as a CMS and shopping cart platform.

## Features

- Interactive 3D cake models with rotation and zoom capabilities
- Seamless Shopify integration for product management and checkout
- Responsive design for all device sizes
- Product detail pages with customization options
- Shopping cart functionality
- Beautiful UI with smooth animations

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Shopify store (or a development store)
- Shopify Storefront API access token

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd cakes
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure Shopify integration
   Open `src/lib/shopify.ts` and replace the placeholder values with your actual Shopify store information:
   ```typescript
   const shopifyClient = Client.buildClient({
     domain: 'YOUR_STORE_NAME.myshopify.com', // Replace with your Shopify store domain
     storefrontAccessToken: 'YOUR_STOREFRONT_API_TOKEN', // Replace with your Storefront API access token
     apiVersion: '2023-01', // Update with current API version if needed
   });
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

### Obtaining Shopify Access Tokens

1. Log in to your Shopify admin dashboard
2. Go to Apps > Develop apps
3. Create a new app (if you don't have one already)
4. Under API credentials, create a Storefront API access token
5. Copy the token and use it in the configuration

## 3D Models

The application uses glTF models for the 3D cake displays. The models are loaded from Google Cloud Storage by default:

```typescript
const GCS_URL = 'https://storage.googleapis.com/kgbakerycakes';
```

For optimized performance, we use smaller, optimized models from a dedicated directory:
```typescript
const OPTIMIZED_MODELS_URL = 'https://storage.googleapis.com/kgbakerycakes/optimized';
```

To use your own models:
1. Update the URL in `src/components/Model3D.tsx`
2. Ensure your models are in glTF format (.glb or .gltf)
3. Make sure the model IDs match the product IDs from Shopify
4. For best performance, create optimized versions with smaller file sizes

## Shopify Product Setup

For best results with the 3D models:

1. Create products in your Shopify admin
2. Add high-quality images for each product
3. Make sure to provide detailed descriptions
4. Create variants if your cakes have different options
5. Add tags to categorize your products

## Pages

- **Home**: Features a hero section and grid of 3D cake models
- **Shop**: Displays all available products with 3D models
- **Product Detail**: Shows a larger 3D model with product information and purchase options

## Development

### File Structure

- `src/components/`: React components including 3D models
- `src/context/`: Context providers for state management
- `src/lib/`: Utility functions and API integrations
- `src/pages/`: Main application pages
- `public/`: Static assets

### Libraries Used

- React
- Three.js (via @react-three/fiber and @react-three/drei)
- Shopify Buy SDK
- React Router
- Tailwind CSS

## Deployment

Build the project for production:

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to be deployed to your hosting provider.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

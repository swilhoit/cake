import Client from 'shopify-buy';

// Create a Shopify client
// Replace with your actual Shopify store domain and Storefront API access token
const shopifyClient = Client.buildClient({
  domain: 'your-store-name.myshopify.com',
  storefrontAccessToken: 'your-storefront-api-access-token',
});

// Export the client for use in other parts of the application
export default shopifyClient;

// Helper function to fetch all products
export async function fetchAllProducts() {
  try {
    const products = await shopifyClient.product.fetchAll();
    return products;
  } catch (error) {
    console.error('Error fetching products from Shopify:', error);
    return [];
  }
}

// Helper function to fetch a single product by ID
export async function fetchProductById(id: string) {
  try {
    const product = await shopifyClient.product.fetch(id);
    return product;
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    return null;
  }
}

// Helper function to create a checkout
export async function createCheckout() {
  try {
    return await shopifyClient.checkout.create();
  } catch (error) {
    console.error('Error creating checkout:', error);
    return null;
  }
}

// Helper function to add items to checkout
export async function addItemToCheckout(checkoutId: string, lineItemsToAdd: any[]) {
  try {
    return await shopifyClient.checkout.addLineItems(checkoutId, lineItemsToAdd);
  } catch (error) {
    console.error('Error adding item to checkout:', error);
    return null;
  }
}

// Helper function to update items in checkout
export async function updateItemInCheckout(checkoutId: string, lineItemsToUpdate: any[]) {
  try {
    return await shopifyClient.checkout.updateLineItems(checkoutId, lineItemsToUpdate);
  } catch (error) {
    console.error('Error updating item in checkout:', error);
    return null;
  }
}

// Helper function to remove items from checkout
export async function removeItemFromCheckout(checkoutId: string, lineItemIdsToRemove: string[]) {
  try {
    return await shopifyClient.checkout.removeLineItems(checkoutId, lineItemIdsToRemove);
  } catch (error) {
    console.error('Error removing item from checkout:', error);
    return null;
  }
} 
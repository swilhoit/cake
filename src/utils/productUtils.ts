/**
 * Utility functions for working with product IDs and data
 */

/**
 * Extracts the numeric ID from a full Shopify product ID
 * @param fullId A Shopify product ID like "gid://shopify/Product/123"
 * @returns The numeric part of the ID (e.g., "123")
 */
export const extractProductId = (fullId: string): string => {
  if (!fullId) return '';
  return fullId.split('/').pop() || '';
};

/**
 * Constructs a full Shopify product ID from a numeric ID
 * @param numericId The numeric ID (e.g., "123")
 * @returns A complete Shopify product ID (e.g., "gid://shopify/Product/123")
 */
export const constructProductId = (numericId: string): string => {
  if (!numericId) return '';
  // If the ID already has the Shopify format, return it as is
  if (numericId.startsWith('gid://')) return numericId;
  return `gid://shopify/Product/${numericId}`;
};

/**
 * Checks if an ID is in the expected format for Shopify API calls
 * @param id The ID to check
 * @returns True if the ID is in the Shopify format
 */
export const isShopifyIdFormat = (id: string): boolean => {
  return id.startsWith('gid://shopify/Product/');
};

/**
 * Gets a display-friendly product ID for debugging
 * @param id The product ID to format
 * @returns A formatted ID string
 */
export const getDisplayProductId = (id: string): string => {
  if (!id) return 'unknown';
  return id.includes('/') ? `${extractProductId(id)} (full ID)` : `${id} (numeric)`;
}; 
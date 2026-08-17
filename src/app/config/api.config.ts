// API Configuration - Single source of truth
export const API_CONFIG = {
  baseUrl: 'https://ecommerce-api-xejc.onrender.com/api',
  endpoints: {
    auth: '/auth',
    products: '/products',
    categories: '/categories',
    orders: '/orders',
    cart: '/cart',
    addresses: '/addresses',
    wishlist: '/wishlist',
    payments: '/payments',
  }
};

// Helper function to build full URLs
export function getApiUrl(endpoint: keyof typeof API_CONFIG.endpoints): string {
  return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
}

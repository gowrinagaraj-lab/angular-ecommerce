// API Configuration - Single source of truth
export const API_CONFIG = {
  // baseUrl: 'https://ecommerce-api-xejc.onrender.com/api',
  baseUrl: 'http://localhost:5000/api',
  endpoints: {
    auth: '/auth',
    products: '/products',
    categories: '/categories',
    orders: '/orders',
    cart: '/cart',
    addresses: '/addresses',
    wishlist: '/wishlist',
    payments: '/payments',
    notifications: '/notifications',
    chat: '/chat',
    reviews: '/reviews'
  }
};

// The server origin (without /api) — used for serving uploaded files
export const SERVER_ORIGIN = API_CONFIG.baseUrl.replace(/\/api$/, '');

// Helper function to build full API URLs
export function getApiUrl(endpoint: keyof typeof API_CONFIG.endpoints): string {
  return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
}

// Helper to resolve media/upload paths from backend
// Converts "/uploads/reviews/file.jpg" → "http://localhost:5000/uploads/reviews/file.jpg"
export function getMediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SERVER_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

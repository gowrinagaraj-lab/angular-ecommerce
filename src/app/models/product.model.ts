export interface ProductImage {
  url: string;
  public_id?: string;
}

export interface Product {
  _id?: string;
  id?: number;
  name: string;
  description: string;
  price: number;
  stock?: number;
  lowStockThreshold?: number;
  category?: string | { _id: string; name: string };
  brand?: string;
  images?: ProductImage[];
  mainImage?: string;
  rating?: number;
  totalReviews?: number;
  isActive?: boolean;
}

export interface LowStockProduct {
  _id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  alertedAt: string | null;
  mainImage?: string;
  isActive?: boolean;
}

export interface InventorySummary {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  reservedUnits: number;
  reservedOrders: number;
  defaultLowStockThreshold: number;
  lowStockProducts: LowStockProduct[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductApiResponse {
  success: boolean;
  total?: number;
  page?: number;
  totalPages?: number;
  data: Product | Product[];
  message?: string;
}
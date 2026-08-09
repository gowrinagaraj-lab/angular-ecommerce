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
  category?: string | { _id: string; name: string };
  brand?: string;
  images?: ProductImage[];
  mainImage?: string;
  rating?: number;
  totalReviews?: number;
  isActive?: boolean;
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
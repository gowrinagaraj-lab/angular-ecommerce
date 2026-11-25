import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductApiResponse, InventorySummary } from '../models/product.model';
import { getApiUrl } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = getApiUrl('products');
  private categoryurl = getApiUrl('categories');

  constructor(private http: HttpClient) {}

  // GET /api/products/admin/inventory - stock widgets for the admin dashboard
  getInventorySummary(): Observable<{ success: boolean; data: InventorySummary }> {
    return this.http.get<{ success: boolean; data: InventorySummary }>(`${this.apiUrl}/admin/inventory`);
  }

  getCategories(): Observable<any> {
    return this.http.get(this.categoryurl);
  }

  createCategory(categoryData: { name: string, description?: string }): Observable<any> {
    return this.http.post(this.categoryurl, categoryData);
  }

  updateCategory(id: string, categoryData: { name: string, description?: string }): Observable<any> {
    return this.http.put(`${this.categoryurl}/${id}`, categoryData);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.categoryurl}/${id}`);
  }

  // Deletes every category not used by a product; the backend requires the confirmation phrase
  deleteAllCategories(): Observable<any> {
    return this.http.delete(this.categoryurl, { body: { confirm: 'DELETE ALL' } });
  }

  toggleCategoryStatus(id: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.categoryurl}/${id}/status`, { isActive });
  }

  getProducts(options: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: number | null;
    maxPrice?: number | null;
    inStock?: boolean;
    sort?: string;
  } = {}): Observable<ProductApiResponse> {
    let params = new HttpParams()
      .set('page', options.page ?? 1)
      .set('limit', options.limit ?? 10);

    if (options.search) params = params.set('search', options.search);
    if (options.category) params = params.set('category', options.category);
    if (options.brand) params = params.set('brand', options.brand);
    if (options.minPrice !== null && options.minPrice !== undefined) params = params.set('minPrice', options.minPrice);
    if (options.maxPrice !== null && options.maxPrice !== undefined) params = params.set('maxPrice', options.maxPrice);
    if (options.inStock) params = params.set('inStock', 'true');
    if (options.sort) params = params.set('sort', options.sort);

    return this.http.get<ProductApiResponse>(this.apiUrl, { params });
  }

  getProductById(id: string): Observable<ProductApiResponse> {
    return this.http.get<ProductApiResponse>(`${this.apiUrl}/${id}`);
  }

  // Updated to accept both FormData and Partial<Product>
  createProduct(productData: FormData | Partial<Product>): Observable<ProductApiResponse> {
    return this.http.post<ProductApiResponse>(this.apiUrl, productData);
  }

  // Updated to accept both FormData and Partial<Product>
  updateProduct(id: string, productData: FormData | Partial<Product>): Observable<ProductApiResponse> {
    return this.http.put<ProductApiResponse>(`${this.apiUrl}/${id}`, productData);
  }

  deleteProduct(id: string): Observable<ProductApiResponse> {
    return this.http.delete<ProductApiResponse>(`${this.apiUrl}/${id}`);
  }
}
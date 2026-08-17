import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductApiResponse } from '../models/product.model';
import { getApiUrl } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = getApiUrl('products');
  private categoryurl = getApiUrl('categories');

  constructor(private http: HttpClient) {}

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

  toggleCategoryStatus(id: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.categoryurl}/${id}/status`, { isActive });
  }

  getProducts(page = 1, limit = 10, search = '', category = ''): Observable<ProductApiResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);

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
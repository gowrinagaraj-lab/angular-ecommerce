import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '../config/api.config';

export interface Product {
  _id: string;
  name: string;
  price: number;
  stock?: number;
}

export interface WishlistResponse {
  success: boolean;
  count?: number;
  message?: string;
  data: Product[] | any;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = getApiUrl('wishlist'); // Adjust backend URL/port as needed

  constructor(private http: HttpClient) {}

  getWishlist(): Observable<WishlistResponse> {
    return this.http.get<WishlistResponse>(this.apiUrl);
  }

  addToWishlist(productId: string): Observable<WishlistResponse> {
    return this.http.post<WishlistResponse>(`${this.apiUrl}/add`, { productId });
  }

  removeFromWishlist(productId: string): Observable<WishlistResponse> {
    return this.http.delete<WishlistResponse>(`${this.apiUrl}/remove/${productId}`);
  }

  clearWishlist(): Observable<WishlistResponse> {
    return this.http.delete<WishlistResponse>(`${this.apiUrl}/clear`);
  }
}
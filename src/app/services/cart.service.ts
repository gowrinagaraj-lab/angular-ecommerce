import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface BackendCartItem {
  _id?: string;
  product: {
    _id: string;
    name: string;
    price: number;
    mainImage?: string;
    stock: number;
  };
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  totalItems?: number;
  grandTotal?: number;
  message?: string;
  data?: {
    _id: string;
    user: string;
    items: BackendCartItem[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:5000/api/cart';
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // GET /api/cart
  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.apiUrl).pipe(
      tap(res => {
        // Fallback checks: totalItems property OR sum of item quantities
        const items = res.data?.items || [];
        const computedCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const finalCount = res.totalItems !== undefined ? res.totalItems : computedCount;

        this.cartCountSubject.next(finalCount);
      })
    );
  }

  // POST /api/cart/add
  addToCart(productId: string, quantity = 1): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.apiUrl}/add`, { productId, quantity }).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  // PUT /api/cart/update
  updateQuantity(productId: string, quantity: number): Observable<CartResponse> {
    return this.http.put<CartResponse>(`${this.apiUrl}/update`, { productId, quantity }).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  // DELETE /api/cart/remove/:productId
  removeItem(productId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/remove/${productId}`).pipe(
      tap(() => this.getCart().subscribe())
    );
  }

  // DELETE /api/cart/clear
  clearCart(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/clear`).pipe(
      tap(() => this.cartCountSubject.next(0))
    );
  }

  // Resets subject value to 0 when user logs out
  resetCartCount(): void {
    this.cartCountSubject.next(0);
  }
}
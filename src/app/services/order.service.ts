import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface CheckoutPayload {
  shippingAddress: ShippingAddress;
  paymentMethod?: 'COD' | 'CARD' | 'UPI';
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD' | 'CARD' | 'UPI';
  paymentStatus?: string;
  orderStatus?: string;
  totalAmount: number;
  createdAt: string;
}

export interface OrdersResponse {
  success: boolean;
  message?: string;
  data: Order[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:5000/api/orders'; // Adjust backend port if needed

  constructor(private http: HttpClient) {}

  // POST /api/orders/checkout
  checkout(payload:any): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/checkout`, payload);
  }

  // GET /api/orders - current user's order history
  getMyOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(this.apiUrl);
  }
}
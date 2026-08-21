import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '../config/api.config';

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
  user?: { _id: string, name: string, email: string };
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
  private apiUrl = getApiUrl('orders'); // Adjust backend port if needed

  constructor(private http: HttpClient) {}

  // POST /api/orders/checkout
  checkout(payload:any): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/checkout`, payload);
  }

  // GET /api/orders - current user's order history
  getMyOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(this.apiUrl);
  }

  // GET /api/orders/admin/all - all orders for admin
  getAllOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(`${this.apiUrl}/admin/all`);
  }

  // POST /api/orders/:id/generate-delivery-otp
  generateDeliveryOtp(orderId: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/${orderId}/generate-delivery-otp`, {});
  }

  // POST /api/orders/:id/verify-delivery-otp
  verifyDeliveryOtp(orderId: string, otp: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/${orderId}/verify-delivery-otp`, { otp });
  }

  // PATCH /api/orders/:id/cancel
  cancelOrder(orderId: string): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.apiUrl}/${orderId}/cancel`, {});
  }

  // GET /api/orders/admin/stats
  getOrderStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/stats`);
  }
}
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
}
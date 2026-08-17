import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = API_CONFIG.baseUrl; // Update to match your API base URL

  constructor(private http: HttpClient) {}

  // Create Razorpay Order & DB Order entry
  createOrder(orderData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/create`, orderData);
  }

  // Verify HMAC signature via your new route
  verifyPayment(payload: VerifyPaymentPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/verify`, payload);
  }
}
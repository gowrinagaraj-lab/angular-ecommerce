import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  location?: { lat: number; lng: number };
  isDefault?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = 'http://localhost:5000/api/addresses';

  constructor(private http: HttpClient) {}

  // GET /api/addresses
  getAddresses(): Observable<{ success: boolean; count: number; data: Address[] }> {
    return this.http.get<{ success: boolean; count: number; data: Address[] }>(this.apiUrl);
  }

  // POST /api/addresses
  addAddress(addressData: Address): Observable<{ success: boolean; message: string; data: Address }> {
    return this.http.post<{ success: boolean; message: string; data: Address }>(this.apiUrl, addressData);
  }

  // PUT /api/addresses/:addressId
  updateAddress(id: string, addressData: Partial<Address>): Observable<{ success: boolean; message: string; data: Address }> {
    return this.http.put<{ success: boolean; message: string; data: Address }>(`${this.apiUrl}/${id}`, addressData);
  }

  // DELETE /api/addresses/:addressId
  deleteAddress(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // PATCH /api/addresses/:addressId/default
  setDefaultAddress(id: string): Observable<{ success: boolean; message: string; data: Address }> {
    return this.http.patch<{ success: boolean; message: string; data: Address }>(`${this.apiUrl}/${id}/default`, {});
  }
}
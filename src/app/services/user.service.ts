import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '../config/api.config';

export interface AppUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface UserListResponse {
  success: boolean;
  total: number;
  page: number;
  totalPages: number;
  data: AppUser[];
}

export interface UserActionResponse {
  success: boolean;
  message: string;
  data: AppUser;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = getApiUrl('users');

  constructor(private http: HttpClient) {}

  // GET /api/users
  getUsers(page: number = 1, limit: number = 10, role?: string, email?: string, status?: string): Observable<UserListResponse> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (role) url += `&role=${encodeURIComponent(role)}`;
    if (email) url += `&email=${encodeURIComponent(email)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    return this.http.get<UserListResponse>(url);
  }

  // PATCH /api/users/:id/role
  updateUserRole(id: string, role: 'customer' | 'admin'): Observable<UserActionResponse> {
    return this.http.patch<UserActionResponse>(`${this.apiUrl}/${id}/role`, { role });
  }

  // PATCH /api/users/:id/status
  updateUserStatus(id: string, isActive: boolean): Observable<UserActionResponse> {
    return this.http.patch<UserActionResponse>(`${this.apiUrl}/${id}/status`, { isActive });
  }
}

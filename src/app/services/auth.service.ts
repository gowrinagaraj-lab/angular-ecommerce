import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  _id?: string;
  name?: string;
  email: string;
  phone?: string;
  role?: 'customer' | 'admin' | string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  
  // Safely parse localStorage without crashing
  private currentUserSubject = new BehaviorSubject<User | null>(this.getInitialUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getInitialUser(): User | null {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return null;

    try {
      // Handles JSON objects like {"name": "sankar", "email": "sankar@test.com", "role": "admin"}
      return JSON.parse(stored);
    } catch {
      // Fallback if plain string email was stored previously
      return { email: stored };
    }
  }

  // Get current user object value synchronously
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if current logged-in user is an admin
  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'admin';
  }

  // Get user role directly
  getUserRole(): string | null {
    return this.currentUserValue?.role || null;
  }

  // POST /api/auth/register
  register(userData: { name: string; email: string; password: string; phone?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  // POST /api/auth/login
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private handleAuthSuccess(res: AuthResponse): void {
    if (res.success && res.data) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('currentUser', JSON.stringify(res.data.user));
      this.currentUserSubject.next(res.data.user);
    }
  }
}
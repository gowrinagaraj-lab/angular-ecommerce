import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="max-width: 400px; margin: 50px auto; padding: 25px; border: 1px solid #ddd; border-radius: 8px; font-family: sans-serif;">
      <h2>Login</h2>

      <p *ngIf="errorMessage" style="color: red; background: #fde8e8; padding: 8px; border-radius: 4px;">{{ errorMessage }}</p>

      <!-- LOGIN FORM -->
      <form (ngSubmit)="onLogin()">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Email</label>
          <input 
            type="email" 
            [(ngModel)]="email" 
            name="email" 
            required 
            style="width: 100%; padding: 8px; box-sizing: border-box;"
          />
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Password</label>
          <input 
            type="password" 
            [(ngModel)]="password" 
            name="password" 
            required 
            style="width: 100%; padding: 8px; box-sizing: border-box;"
          />
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <button 
            type="submit" 
            [disabled]="loading"
            style="background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>

          <!-- Forgot Password Trigger -->
          <a href="#" (click)="toggleForgotModal($event)" style="color: #2980b9; font-size: 0.9rem; text-decoration: none;">
            Forgot Password?
          </a>
        </div>
      </form>

      <p style="font-size: 0.9rem;">
        Don't have an account? <a routerLink="/register" style="color: #2980b9;">Register here</a>
      </p>

      <!-- FORGOT PASSWORD MODAL OVERLAY -->
      <div *ngIf="showForgotModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
        <div style="background: white; padding: 25px; border-radius: 8px; width: 350px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0;">Reset Password</h3>
          <p style="font-size: 0.85rem; color: #666;">Enter your registered email address and we'll send you a password reset link.</p>

          <p *ngIf="forgotMsg" style="color: green; font-size: 0.85rem;">{{ forgotMsg }}</p>
          <p *ngIf="forgotError" style="color: red; font-size: 0.85rem;">{{ forgotError }}</p>

          <form (ngSubmit)="sendResetEmail()">
            <div style="margin-bottom: 15px;">
              <input 
                type="email" 
                [(ngModel)]="resetEmail" 
                name="resetEmail" 
                placeholder="Enter your email"
                required 
                style="width: 100%; padding: 8px; box-sizing: border-box;"
              />
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button 
                type="button" 
                (click)="toggleForgotModal($event)" 
                style="background: #7f8c8d; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                [disabled]="sendingReset"
                style="background: #2980b9; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;"
              >
                {{ sendingReset ? 'Sending...' : 'Send Link' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  // Login State
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  // Forgot Password State
  showForgotModal = false;
  resetEmail = '';
  sendingReset = false;
  forgotMsg = '';
  forgotError = '';

  constructor(
    private authService: AuthService, 
    private http: HttpClient,
    private router: Router
  ) {}

  onLogin(): void {
    if (!this.email || !this.password) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Invalid credentials.';
      }
    });
  }

  toggleForgotModal(event?: Event): void {
    if (event) event.preventDefault();
    this.showForgotModal = !this.showForgotModal;
    this.resetEmail = this.email; // Pre-fill with login email if available
    this.forgotMsg = '';
    this.forgotError = '';
  }

  sendResetEmail(): void {
    if (!this.resetEmail) {
      this.forgotError = 'Please provide a valid email.';
      return;
    }

    this.sendingReset = true;
    this.forgotMsg = '';
    this.forgotError = '';

    this.http.post<any>('http://localhost:5000/api/auth/forgot-password', {
      email: this.resetEmail
    }).subscribe({
      next: (res) => {
        this.sendingReset = false;
        this.forgotMsg = res.message || 'Reset link sent! Check your inbox.';
      },
      error: (err) => {
        this.sendingReset = false;
        this.forgotError = err.error?.message || 'Failed to send reset link.';
      }
    });
  }
}
import { Component, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width: 400px; margin: 40px auto; padding: 20px; background: white; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      @if (verificationSent) {
        <h2>Check your email</h2>
        <p>We sent a verification link to <strong>{{ email }}</strong>. Verify your address before logging in.</p>
        @if (errorMessage) {
          <p style="color: red; font-size: 14px;">{{ errorMessage }}</p>
        }
        @if (resendMessage) {
          <p style="color: green; font-size: 14px;">{{ resendMessage }}</p>
        }
        <button type="button" (click)="resendVerification()" [disabled]="loading || resendCooldown > 0">
          {{ loading ? 'Sending...' : resendCooldown > 0 ? 'Resend available in ' + resendCooldown + 's' : 'Resend verification email' }}
        </button>
        <p><a routerLink="/login">Go to login</a></p>
      } @else {
      <h2>Register</h2>
    
      @if (errorMessage) {
        <p style="color: red; font-size: 14px;">{{ errorMessage }}</p>
      }
    
      <form (ngSubmit)="onRegister()">
        <div class="form-group" style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Full Name *</label>
          <input
            type="text"
            [(ngModel)]="name"
            name="name"
            required
            placeholder="John Doe"
            style="width: 100%; padding: 8px; box-sizing: border-box;"
            >
        </div>
    
        <div class="form-group" style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Email Address *</label>
          <input
            type="email"
            [(ngModel)]="email"
            name="email"
            required
            placeholder="user@example.com"
            style="width: 100%; padding: 8px; box-sizing: border-box;"
            >
        </div>
    
        <div class="form-group" style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Phone Number</label>
          <input
            type="text"
            [(ngModel)]="phone"
            name="phone"
            placeholder="+1234567890"
            style="width: 100%; padding: 8px; box-sizing: border-box;"
            >
        </div>
    
        <div class="form-group" style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Password (min 6 chars) *</label>
          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            required
            placeholder="••••••••"
            style="width: 100%; padding: 8px; box-sizing: border-box;"
            >
        </div>
    
        <button
          type="submit"
          [disabled]="loading"
          style="width: 100%; background: #27ae60; color: white; border: none; padding: 10px; cursor: pointer; border-radius: 4px;"
          >
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>
    
      <p style="margin-top: 15px; text-align: center;">
        Already have an account? <a routerLink="/login">Login here</a>
      </p>
      }
    </div>
    `
})
export class RegisterComponent implements OnDestroy {
  name = '';
  email = '';
  password = '';
  phone = '';
  loading = false;
  errorMessage = '';
  verificationSent = false;
  resendMessage = '';
  resendCooldown = 0;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private authService: AuthService) {}

  ngOnDestroy(): void {
    this.clearCooldownTimer();
  }

  onRegister(): void {
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      name: this.name,
      email: this.email,
      password: this.password,
      phone: this.phone
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.verificationSent = true;
        this.startCooldown(res.retryAfter || 60);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Registration failed.';
      }
    });
  }

  resendVerification(): void {
    if (this.loading || this.resendCooldown > 0 || !this.email) return;

    this.loading = true;
    this.errorMessage = '';
    this.resendMessage = '';

    this.authService.resendVerification(this.email).subscribe({
      next: (res) => {
        this.loading = false;
        this.resendMessage = res.message;
        this.startCooldown(res.retryAfter || 60);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to resend verification email.';
        if (err.error?.retryAfter) this.startCooldown(err.error.retryAfter);
      }
    });
  }

  private startCooldown(seconds: number): void {
    this.clearCooldownTimer();
    this.resendCooldown = Math.max(0, seconds);
    if (!this.resendCooldown) return;

    this.cooldownTimer = setInterval(() => {
      this.resendCooldown -= 1;
      if (this.resendCooldown <= 0) this.clearCooldownTimer();
    }, 1000);
  }

  private clearCooldownTimer(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = null;
  }
}
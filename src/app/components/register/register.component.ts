import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width: 400px; margin: 40px auto; padding: 20px; background: white; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
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
    </div>
    `
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  phone = '';
  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

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
        alert(res.message || 'Registration successful!');
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Registration failed.';
      }
    });
  }
}
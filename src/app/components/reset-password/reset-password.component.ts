import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
token = '';
  password = '';
  loading = false;
  message = '';
  error = '';
  success = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Read the reset token directly from the URL route parameter
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  onResetPassword(): void {
    if (!this.password || this.password.length < 6) {
      this.error = 'Password must be at least 6 characters long.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.http.post<any>(`http://localhost:5000/api/auth/reset-password/${this.token}`, {
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = true;
        this.message = 'Password reset successfully! Redirecting to login...';
        
        // Optionally save new token and redirect
        if (res.data?.token) {
          localStorage.setItem('token', res.data.token);
        }

        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to reset password. Token may be expired.';
      }
    });
  }
}

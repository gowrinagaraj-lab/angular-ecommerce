import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="max-width: 480px; margin: 60px auto; padding: 28px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); text-align: center;">
      <h2>Email verification</h2>
      @if (loading) {
        <p>Verifying your email address...</p>
      } @else if (errorMessage) {
        <p style="color: #b91c1c;">{{ errorMessage }}</p>
        <p><a routerLink="/login">Return to login to request another link</a></p>
      } @else if (verified) {
        <p style="color: #047857;">{{ successMessage }}</p>
        <a routerLink="/login">Continue to login</a>
      }
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  verified = false;
  errorMessage = '';
  successMessage = '';

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.loading = false;
      this.errorMessage = 'Verification link is invalid or has expired.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (res) => {
        this.loading = false;
        this.verified = true;
        this.successMessage = res.message;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Unable to verify your email address.';
      }
    });
  }
}

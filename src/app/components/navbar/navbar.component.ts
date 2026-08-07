import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService, User } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav style="background-color: #2c3e50; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center;">
      <h2><a routerLink="/" style="color: white; text-decoration: none; font-weight: bold;">E-Shop</a></h2>
      <div>
        <ng-container *ngIf="user">
          <a routerLink="/products" style="color: white; margin-left: 15px; text-decoration: none;">Products</a>
          <a routerLink="/wishlist" style="color: white; margin-left: 15px; text-decoration: none;">Wishlist ({{ wishlistCount }})</a>
          <a routerLink="/cart" style="color: white; margin-left: 15px; text-decoration: none;">Cart ({{ cartCount }})</a>
          <span style="margin-left: 15px;">Hi, {{ user.name }}</span>
          <a href="#" (click)="logout($event)" style="color: #e74c3c; margin-left: 15px; text-decoration: none;">Logout</a>
        </ng-container>

        <ng-container *ngIf="!user">
          <a routerLink="/login" style="color: white; margin-left: 15px; text-decoration: none;">Login</a>
          <a routerLink="/register" style="color: white; margin-left: 15px; text-decoration: none;">Register</a>
        </ng-container>
      </div>
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  cartCount = 0;
  wishlistCount = 0;
  user: User | null = null;

  constructor(
    private cartService: CartService, 
    private authService: AuthService,
    private wishlistService: WishlistService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Subscribe to reactive cart count updates
    this.cartService.cartCount$.subscribe(count => this.cartCount = count);

    // 2. Fetch counts automatically when user logs in or page reloads
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.cartService.getCart().subscribe(); // Triggers cart count computation
        this.fetchWishlistCount();
      } else {
        this.cartService.resetCartCount(); // Resets count to 0 on logout
        this.wishlistCount = 0;
      }
    });
  }

  fetchWishlistCount(): void {
    this.wishlistService.getWishlist().subscribe({
      next: (res) => {
        this.wishlistCount = res.count || res.data?.length || 0;
      },
      error: () => {
        this.wishlistCount = 0;
      }
    });
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
import { Component, OnInit } from '@angular/core';

import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService, User } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav style="background-color: #2c3e50; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center;">
      <h2><a routerLink="/" style="color: white; text-decoration: none; font-weight: bold;">E-Shop</a></h2>
      <div>
        @if (user) {
          <a routerLink="/products" style="color: white; margin-left: 15px; text-decoration: none;">Products</a>
          <a routerLink="/wishlist" style="color: white; margin-left: 15px; text-decoration: none;">Wishlist ({{ wishlistCount }})</a>
          <a routerLink="/cart" style="color: white; margin-left: 15px; text-decoration: none;">Cart ({{ cartCount }})</a>
          <a routerLink="/orders" style="color: white; margin-left: 15px; text-decoration: none;">My Orders</a>
          @if (user.role === 'admin') {
            <a routerLink="/admin/categories" style="color: white; margin-left: 15px; text-decoration: none;">Manage Categories</a>
            <a routerLink="/admin/orders" style="color: white; margin-left: 15px; text-decoration: none;">Manage Orders</a>
          }
          <div style="position: relative; display: inline-block; margin-left: 15px;">
            <button (click)="toggleMenu()" style="background: none; border: none; color: white; cursor: pointer; font-size: 1rem; padding: 0; outline: none;">
              Hi, {{ user.name }} ▼
            </button>
            @if (isMenuOpen) {
              <div style="position: absolute; right: 0; top: 100%; margin-top: 0.5rem; background-color: white; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden; min-width: 160px; z-index: 1000; text-align: left;">
                <a routerLink="/sign-in-activity" (click)="closeMenu()" style="display: block; padding: 0.75rem 1rem; color: #333; text-decoration: none; border-bottom: 1px solid #eee; font-size: 0.9rem;">Sign In Activity</a>
                <a href="#" (click)="logout($event)" style="display: block; padding: 0.75rem 1rem; color: #e74c3c; text-decoration: none; font-size: 0.9rem;">Logout</a>
              </div>
            }
          </div>
        }
    
        @if (!user) {
          <a routerLink="/login" style="color: white; margin-left: 15px; text-decoration: none;">Login</a>
          <a routerLink="/register" style="color: white; margin-left: 15px; text-decoration: none;">Register</a>
        }
      </div>
    </nav>
    `
})


export class NavbarComponent implements OnInit {
  cartCount = 0;
  wishlistCount = 0;
  user: User | null = null;
  isMenuOpen = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private wishlistService: WishlistService,
    private router: Router
  ) { }

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
    this.closeMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService, BackendCartItem } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width: 950px; margin: 20px auto; padding: 20px;">
      <h2>Your Shopping Cart</h2>

      <p *ngIf="loading">Loading your cart...</p>
      <p *ngIf="error" style="color: red;">{{ error }}</p>

      <div *ngIf="!loading && cartItems.length > 0; else emptyCart">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #ddd; text-align: left;">
              <th style="padding: 10px;">Product</th>
              <th style="padding: 10px;">Price</th>
              <th style="padding: 10px;">Quantity</th>
              <th style="padding: 10px;">Total</th>
              <th style="padding: 10px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of cartItems" style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px; display: flex; align-items: center; gap: 10px;">
                <img 
                  [src]="item.product.mainImage || 'https://via.placeholder.com/50'" 
                  style="width: 50px; height: 50px; object-fit: contain;"
                />
                <strong>{{ item.product.name }}</strong>
              </td>
              <td style="padding: 10px;">\${{ item.product.price }}</td>
              <td style="padding: 10px;">
                <input 
                  type="number" 
                  min="1" 
                  [max]="item.product.stock"
                  [(ngModel)]="item.quantity" 
                  (change)="onQuantityChange(item.product._id, item.quantity)" 
                  style="width: 60px; padding: 5px;"
                />
              </td>
              <td style="padding: 10px;">\${{ (item.product.price * item.quantity).toFixed(2) }}</td>
              <td style="padding: 10px; display: flex; gap: 6px; align-items: center;">
                <!-- Move to Wishlist Button -->
                <button 
                  (click)="moveToWishlist(item.product._id)" 
                  title="Move to Wishlist"
                  style="background: #8e44ad; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px;"
                >
                  ♥ Wishlist
                </button>

                <!-- Remove Item Button -->
                <button 
                  (click)="removeItem(item.product._id)" 
                  style="background: #e74c3c; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 4px;"
                >
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button (click)="clearCart()" style="background: #7f8c8d; color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 4px;">
            Clear Cart
          </button>
          <h3>Grand Total: \${{ grandTotal.toFixed(2) }}</h3>
        </div>

        <div style="margin-top: 20px; text-align: right; display: flex; gap: 10px; justify-content: flex-end;">
          <a routerLink="/wishlist" style="color: #8e44ad; text-decoration: none; align-self: center; font-weight: bold;">
            View My Wishlist →
          </a>
          <a routerLink="/checkout" class="btn" style="background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Proceed to Checkout
          </a>
        </div>
      </div>

      <ng-template #emptyCart>
        <div *ngIf="!loading && !error">
          <p>Your cart is empty.</p>
          <a routerLink="/products" style="color: #2980b9; margin-right: 15px;">Continue Shopping</a>
          <a routerLink="/wishlist" style="color: #8e44ad;">View Wishlist</a>
        </div>
      </ng-template>
    </div>
  `
})
export class CartComponent implements OnInit {
  cartItems: BackendCartItem[] = [];
  grandTotal = 0;
  loading = true;
  error = '';

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.error = '';
    this.cartService.getCart().subscribe({
      next: (res) => {
        this.cartItems = res.data?.items || [];
        this.grandTotal = res.grandTotal || 0;
        this.loading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.cartItems = [];
          this.grandTotal = 0;
        } else {
          this.error = err.error?.message || 'Failed to load cart.';
        }
        this.loading = false;
      }
    });
  }

  onQuantityChange(productId: string, quantity: number): void {
    if (quantity < 1) return;
    
    this.cartService.updateQuantity(productId, quantity).subscribe({
      next: () => this.loadCart(),
      error: (err) => {
        alert(err.error?.message || 'Failed to update quantity');
        this.loadCart();
      }
    });
  }

  removeItem(productId: string): void {
    if (confirm('Remove item from cart?')) {
      this.cartService.removeItem(productId).subscribe({
        next: () => this.loadCart(),
        error: (err) => alert(err.error?.message || 'Failed to remove item')
      });
    }
  }

  /**
   * Adds the item to Wishlist and removes it from Cart
   */
  moveToWishlist(productId: string): void {
    this.wishlistService.addToWishlist(productId).subscribe({
      next: () => {
        // Once added to wishlist, remove from cart
        this.cartService.removeItem(productId).subscribe({
          next: () => {
            alert('Moved item to wishlist!');
            this.loadCart();
          },
          error: (err) => alert(err.error?.message || 'Item added to wishlist, but failed to remove from cart.')
        });
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add item to wishlist.');
      }
    });
  }

  clearCart(): void {
    if (confirm('Clear your entire cart?')) {
      this.cartService.clearCart().subscribe({
        next: () => this.loadCart(),
        error: (err) => alert(err.error?.message || 'Failed to clear cart')
      });
    }
  }
}
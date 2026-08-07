import { Component } from '@angular/core';
import { Product, WishlistService } from '../../services/wishlist.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent {
products: Product[] = [];
  loading: boolean = false;
  message: string = '';
  newProductId: string = ''; // For PoC manual product addition testing

  constructor(private wishlistService: WishlistService) {}

  ngOnInit(): void {
    this.fetchWishlist();
  }

  fetchWishlist(): void {
    this.loading = true;
    this.wishlistService.getWishlist().subscribe({
      next: (res) => {
        this.products = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.message = err.error?.message || 'Error loading wishlist';
        this.loading = false;
      }
    });
  }

  addToWishlist(): void {
    if (!this.newProductId.trim()) return;

    this.wishlistService.addToWishlist(this.newProductId.trim()).subscribe({
      next: (res) => {
        this.message = res.message || 'Added to wishlist';
        this.newProductId = '';
        this.fetchWishlist();
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to add item';
      }
    });
  }

  removeItem(productId: string): void {
    this.wishlistService.removeFromWishlist(productId).subscribe({
      next: (res) => {
        this.message = 'Item removed';
        this.fetchWishlist();
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to remove item';
      }
    });
  }

  clearWishlist(): void {
    this.wishlistService.clearWishlist().subscribe({
      next: (res) => {
        this.message = 'Wishlist cleared';
        this.products = [];
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to clear wishlist';
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ReviewService, Review } from '../../services/review.service';
import { Product } from '../../models/product.model';
import { getMediaUrl } from '../../config/api.config';

interface CategoryItem {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, RatingModule, FormsModule],
  template: `
    <div class="container">
      @if (loading) {
        <p>Loading details...</p>
      }
      @if (error) {
        <p style="color: red;">{{ error }}</p>
      }
    
      @if (!loading && product) {
        <div>
          <h2>{{ product.name }}</h2>
          <img
            [src]="getImageUrl(product)"
            [alt]="product.name"
            style="max-width: 300px; height: auto; margin-bottom: 15px; display: block;"
            />
          <div style="display: flex; align-items: center; margin-bottom: 15px; gap: 10px;">
            <p-rating [(ngModel)]="product.rating" [readonly]="true" [cancel]="false"></p-rating>
            <span style="color: #666;">({{ product.totalReviews || 0 }} reviews)</span>
          </div>
          <p><strong>Price:</strong> ₹{{ product.price }}</p>
          <p><strong>Category:</strong> {{ getCategoryName(product) }}</p>
          <p><strong>Brand:</strong> {{ product.brand || 'N/A' }}</p>
          <p><strong>Stock:</strong> {{ product.stock }}</p>
          <p><strong>Description:</strong> {{ product.description }}</p>
          <div style="margin-top: 20px;">
            <button class="btn" (click)="addToCart()">Add to Cart</button>
            <a routerLink="/products" class="btn btn-secondary" style="margin-left: 10px;">Back to Products</a>
          </div>

          <hr style="margin: 40px 0; border: 0; border-top: 1px solid #eee;" />
          
          <h3>Customer Reviews</h3>
          @if (reviewsLoading) {
            <p>Loading reviews...</p>
          }
          @if (!reviewsLoading && reviews.length === 0) {
            <p style="color: #666; font-style: italic;">No reviews yet for this product.</p>
          }
          @for (review of reviews; track review._id) {
            <div style="padding: 15px; border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 15px; background: #fafafa;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong style="color: #333;">{{ review.user?.name || 'Anonymous User' }}</strong>
                <span style="color: #999; font-size: 0.9em;">{{ review.createdAt | date:'mediumDate' }}</span>
              </div>
              <p-rating [(ngModel)]="review.rating" [readonly]="true" [cancel]="false"></p-rating>
              <p style="margin-top: 10px; color: #444; line-height: 1.5;">{{ review.comment }}</p>
              
              @if (review.media && review.media.length > 0) {
                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                  @for (m of review.media; track m.url) {
                    <img *ngIf="m.type === 'image'" [src]="getMediaUrl(m.url)" alt="Review Media" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" />
                    <video *ngIf="m.type === 'video'" [src]="getMediaUrl(m.url)" controls style="width: 150px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;"></video>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
    `
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  categories: CategoryItem[] = [];
  loading = true;
  error = '';

  // Expose helper to template
  getMediaUrl = getMediaUrl;
  
  reviews: Review[] = [];
  reviewsLoading = true;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.productService.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res.data || res || [];
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProductById(id).subscribe({
        next: (res) => {
          // Adjust for API returning product in res.data
          this.product = (res.data as Product) || null;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Product not found.';
          this.loading = false;
        }
      });

      this.reviewService.getProductReviews(id).subscribe({
        next: (res) => {
          this.reviews = res.data || [];
          this.reviewsLoading = false;
        },
        error: () => {
          this.reviewsLoading = false;
        }
      });
    }
  }

  // Category can come back as a populated object ({_id, name}) or a plain id string
  // that needs to be looked up against the categories list fetched separately.
  getCategoryName(product: Product): string {
    if (product.category && typeof product.category === 'object') {
      return product.category.name;
    }
    if (typeof product.category === 'string') {
      const match = this.categories.find(c => c._id === product.category);
      if (match) return match.name;
    }
    return 'N/A';
  }

  // Safe image accessor method preventing array out-of-bounds errors
  getImageUrl(product: Product): string {
    if (product.mainImage && product.mainImage.trim() !== '') {
      return product.mainImage;
    }
    if (product.images && product.images.length > 0 && product.images[0]?.url) {
      return product.images[0].url;
    }
    return 'https://via.placeholder.com/300?text=No+Image';
  }

  addToCart(): void { 
    if (!this.product?._id) {
      alert('Invalid product details.');
      return;
    }

    this.cartService.addToCart(this.product._id).subscribe({
      next: () => {
        alert(`${this.product?.name} added to cart!`);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add product to cart.');
      }
    });
  }
}
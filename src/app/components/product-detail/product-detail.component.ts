import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ReviewService, Review } from '../../services/review.service';
import { Product } from '../../models/product.model';
import { getMediaUrl } from '../../config/api.config';
import { SocketService } from '../../socket.service';

interface CategoryItem {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, RatingModule, FormsModule],
  template: `
    <div class="product-page-shell">
      <style>
        .product-page-shell {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(180deg, #fffaf5 0%, #f9fafb 100%);
          min-height: 100vh;
          color: #1f2937;
          padding: 32px 20px 48px;
        }

        .product-shell {
          max-width: 1200px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #f5e7d7;
          border-radius: 24px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
          padding: 28px;
        }

        .product-layout {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 32px;
        }

        .gallery-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .main-image-wrap {
          background: linear-gradient(135deg, #fffaf5, #f5f7fb);
          border: 1px solid #f0e4d6;
          border-radius: 22px;
          overflow: hidden;
          min-height: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .main-image {
          width: 100%;
          max-height: 520px;
          object-fit: contain;
          display: block;
          border-radius: 16px;
        }

        .thumbnail-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .thumbnail {
          width: 82px;
          height: 82px;
          border-radius: 14px;
          overflow: hidden;
          border: 2px solid transparent;
          background: #fff;
          cursor: pointer;
          transition: 0.2s ease;
          box-shadow: 0 8px 18px rgba(17, 24, 39, 0.06);
        }

        .thumbnail.active {
          border-color: #f59e0b;
          box-shadow: 0 12px 26px rgba(245, 158, 11, 0.18);
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .info-panel {
          padding: 12px 8px 0;
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 10px;
          color: #f59e0b;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        h1 {
          font-size: clamp(2rem, 3vw, 3rem);
          line-height: 1.1;
          margin: 0 0 16px;
          color: #111827;
        }

        .rating-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 18px;
          color: #4b5563;
        }

        .rating-score {
          font-weight: 700;
          color: #111827;
        }

        .price-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .price {
          font-size: 2.1rem;
          font-weight: 800;
          color: #111827;
        }

        .stock-pill {
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          background: #ecfdf5;
          color: #047857;
        }

        .stock-pill.out {
          background: #fef2f2;
          color: #b91c1c;
        }

        .description {
          font-size: 1rem;
          line-height: 1.8;
          color: #4b5563;
          margin: 0 0 24px;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(140px, 1fr));
          gap: 16px;
          padding: 18px 0;
          border-top: 1px solid #f2e8df;
          border-bottom: 1px solid #f2e8df;
          margin-bottom: 24px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .meta-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #6b7280;
          font-weight: 700;
        }

        .meta-value {
          font-size: 1rem;
          color: #111827;
          font-weight: 700;
        }

        .purchase-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .qty-picker {
          display: inline-flex;
          align-items: center;
          border: 1px solid #f1d3a4;
          border-radius: 999px;
          background: #fffaf5;
          overflow: hidden;
        }

        .qty-btn {
          width: 42px;
          height: 42px;
          border: none;
          background: transparent;
          color: #111827;
          font-size: 1.5rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .qty-btn:hover {
          background: #fef3c7;
        }

        .qty-value {
          min-width: 54px;
          text-align: center;
          font-weight: 700;
          font-size: 1.05rem;
        }

        .action-btns {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .primary-btn,
        .secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 26px;
          height: 48px;
          font-size: 0.96rem;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .primary-btn {
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: #fff;
          border: none;
          box-shadow: 0 12px 24px rgba(249, 115, 22, 0.28);
        }

        .secondary-btn {
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
        }

        .primary-btn:hover,
        .secondary-btn:hover {
          transform: translateY(-1px);
        }

        .benefit-strip {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 18px;
          color: #374151;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .benefit-strip span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          border-radius: 999px;
        }

        .detail-grid {
          max-width: 1200px;
          margin: 26px auto 0;
          display: grid;
          grid-template-columns: 1.5fr 0.8fr;
          gap: 24px;
        }

        .panel {
          background: #fff;
          border: 1px solid #f0e7df;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          padding: 24px;
        }

        .review-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .review-header h3 {
          margin: 0;
          font-size: 1.4rem;
        }

        .review-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: #fff7ed;
          color: #c2410c;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .review-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .review-item {
          border: 1px solid #f0ece7;
          border-radius: 16px;
          padding: 18px;
          background: #fffcfa;
        }

        .review-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .review-top strong {
          color: #111827;
        }

        .review-date {
          color: #6b7280;
          font-size: 0.8rem;
        }

        .review-comment {
          color: #374151;
          line-height: 1.75;
          margin: 10px 0 0;
        }

        .review-media {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }

        .review-media img,
        .review-media video {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #f3f4f6;
        }

        .spec-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .spec-list li {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
        }

        .spec-list li span:first-child {
          color: #6b7280;
          font-weight: 600;
        }

        .empty-state {
          color: #6b7280;
          font-style: italic;
          margin: 0;
        }

        @media (max-width: 900px) {
          .product-layout,
          .detail-grid {
            grid-template-columns: 1fr;
          }

          .main-image-wrap {
            min-height: 340px;
          }

          .price {
            font-size: 1.7rem;
          }
        }
      </style>

      @if (loading) {
        <div class="container"><p>Loading details...</p></div>
      }
      @if (error) {
        <div class="container"><p style="color: red;">{{ error }}</p></div>
      }

      @if (!loading && product) {
        <div class="product-shell">
          <div class="product-layout">
            <div class="gallery-panel">
              <div class="main-image-wrap">
                <img class="main-image" [src]="selectedImage || getImageUrl(product)" (error)="onImageError($event)" [alt]="product.name" />
              </div>

              @if (getGalleryImages(product).length > 1) {
                <div class="thumbnail-row">
                  @for (image of getGalleryImages(product); track image; let i = $index) {
                    <button
                      type="button"
                      class="thumbnail"
                      [class.active]="(selectedImage || getImageUrl(product)) === image"
                      (click)="selectImage(image)"
                      aria-label="Select product image"
                    >
                      <img [src]="image" (error)="onImageError($event)" [alt]="product.name + ' image ' + (i + 1)" />
                    </button>
                  }
                </div>
              }
            </div>

            <div class="info-panel">
              <div class="eyebrow">{{ getCategoryName(product) }}</div>
              <h1>{{ product.name }}</h1>

              <div class="rating-row">
                <p-rating [(ngModel)]="product.rating" [readonly]="true" [cancel]="false"></p-rating>
                <span class="rating-score">{{ (product.rating || 0) | number:'1.1-1' }}</span>
                <span>({{ product.totalReviews || 0 }} reviews)</span>
              </div>

              <div class="price-row">
                <span class="price">₹{{ product.price | number:'1.0-0' }}</span>
                <span class="stock-pill" [class.out]="!inStock">
                  {{ inStock ? 'In Stock' : 'Out of Stock' }}
                </span>
              </div>

              <p class="description">{{ product.description }}</p>

              <div class="meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Brand</span>
                  <span class="meta-value">{{ product.brand || 'N/A' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Category</span>
                  <span class="meta-value">{{ getCategoryName(product) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Stock</span>
                  <span class="meta-value">{{ product.stock ?? 0 }} units</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Delivery</span>
                  <span class="meta-value">Free shipping</span>
                </div>
              </div>

              <div class="purchase-controls">
                <div class="qty-picker" aria-label="Quantity selector">
                  <button type="button" class="qty-btn" (click)="decreaseQuantity()" aria-label="Decrease quantity">−</button>
                  <span class="qty-value">{{ quantity }}</span>
                  <button type="button" class="qty-btn" (click)="increaseQuantity()" aria-label="Increase quantity">+</button>
                </div>

                @if (!isAdmin) {
                  <div class="action-btns">
                    <button type="button" class="primary-btn" (click)="addToCart()">Add to Cart</button>
                    <button type="button" class="secondary-btn" (click)="buyNow()">Buy Now</button>
                  </div>
                }
              </div>

              <div class="benefit-strip">
                <span>🚚 Free delivery</span>
                <span>🔒 Secure checkout</span>
                <span>↩ 30-day returns</span>
              </div>
            </div>
          </div>

          <div class="detail-grid">
            <section class="panel">
              <div class="review-header">
                <h3>Customer Reviews</h3>
                <span class="review-badge">{{ reviews.length }} reviews</span>
              </div>

              @if (reviewsLoading) {
                <p>Loading reviews...</p>
              }
              @if (!reviewsLoading && reviews.length === 0) {
                <p class="empty-state">No reviews yet for this product.</p>
              }

              @if (!reviewsLoading && reviews.length > 0) {
                <div class="review-list">
                  @for (review of reviews; track review._id) {
                    <div class="review-item">
                      <div class="review-top">
                        <strong>{{ review.user?.name || 'Anonymous User' }}</strong>
                        <span class="review-date">{{ review.createdAt | date:'mediumDate' }}</span>
                      </div>
                      <p-rating [(ngModel)]="review.rating" [readonly]="true" [cancel]="false"></p-rating>
                      <p class="review-comment">{{ review.comment }}</p>

                      @if (review.media && review.media.length > 0) {
                        <div class="review-media">
                          @for (m of review.media; track m.url) {
                            <img *ngIf="m.type === 'image'" [src]="getMediaUrl(m.url)" alt="Review Media" />
                            <video *ngIf="m.type === 'video'" [src]="getMediaUrl(m.url)" controls></video>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </section>

            <aside class="panel">
              <div class="review-header">
                <h3>Product Details</h3>
              </div>
              <ul class="spec-list">
                <li><span>Brand</span><strong>{{ product.brand || 'N/A' }}</strong></li>
                <li><span>Category</span><strong>{{ getCategoryName(product) }}</strong></li>
                <li><span>Availability</span><strong>{{ inStock ? 'Available' : 'Unavailable' }}</strong></li>
                <li><span>Rating</span><strong>{{ (product.rating || 0) | number:'1.1-1' }}/5</strong></li>
              </ul>
            </aside>
          </div>
        </div>
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  product: Product | null = null;
  categories: CategoryItem[] = [];
  loading = true;
  error = '';

  // Expose helper to template
  getMediaUrl = getMediaUrl;

  selectedImage = '';
  quantity = 1;

  reviews: Review[] = [];
  reviewsLoading = true;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  // Admins manage the store; only customers shop
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get inStock(): boolean {
    return (this.product?.stock ?? 0) > 0;
  }

  getGalleryImages(product: Product | null): string[] {
    if (!product) {
      return [];
    }

    const sources = [
      product.mainImage,
      ...(product.images || []).map(image => image.url)
    ].filter((url): url is string => !!url && url.trim() !== '')
      .map(url => getMediaUrl(url));

    return [...new Set(sources)];
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  increaseQuantity(): void {
    const maxStock = this.product?.stock ?? 1;
    this.quantity = Math.min(this.quantity + 1, Math.max(maxStock, 1));
  }

  decreaseQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  syncSelectedImage(): void {
    if (!this.product) {
      return;
    }

    const galleryImages = this.getGalleryImages(this.product);
    const defaultImage = galleryImages[0] || this.getImageUrl(this.product);
    if (!this.selectedImage || !galleryImages.includes(this.selectedImage)) {
      this.selectedImage = defaultImage;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Keep the open product in sync with changes made elsewhere
  private watchProduct(): void {
    this.socketService.onProductUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ data }) => {
        if (this.product && data?._id === this.product._id) {
          this.product = { ...this.product, ...data };
        }
      });

    this.socketService.onProductDeleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ data }) => {
        if (this.product && data?._id === this.product._id) {
          this.product = null;
          this.error = 'This product has been removed from the store.';
        }
      });
  }

  ngOnInit(): void {
    this.watchProduct();
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
          this.quantity = 1;
          this.syncSelectedImage();
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
      return getMediaUrl(product.mainImage);
    }
    if (product.images && product.images.length > 0 && product.images[0]?.url) {
      return getMediaUrl(product.images[0].url);
    }
    return 'https://via.placeholder.com/300?text=No+Image';
  }

  // Swaps a broken/404'd image (deleted file, bad manual URL) for the placeholder
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'https://via.placeholder.com/300?text=No+Image';
  }

  addToCart(): void {
    if (!this.product?._id) {
      alert('Invalid product details.');
      return;
    }

    this.cartService.addToCart(this.product._id, this.quantity).subscribe({
      next: () => {
        alert(`${this.product?.name} added to cart!`);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add product to cart.');
      }
    });
  }

  buyNow(): void {
    if (!this.product?._id) {
      alert('Invalid product details.');
      return;
    }

    this.cartService.addToCart(this.product._id, this.quantity).subscribe({
      next: () => {
        alert(`Checkout ready for ${this.product?.name}.`);
      },
      error: (err) => {
        alert(err.error?.message || 'Unable to prepare checkout.');
      }
    });
  }
}
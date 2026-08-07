import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <p *ngIf="loading">Loading details...</p>
      <p *ngIf="error" style="color: red;">{{ error }}</p>

      <div *ngIf="!loading && product">
        <h2>{{ product.name }}</h2>
        
        <img 
          [src]="getImageUrl(product)" 
          [alt]="product.name" 
          style="max-width: 300px; height: auto; margin-bottom: 15px; display: block;"
        />

        <p><strong>Price:</strong> ₹{{ product.price }}</p>
        <p><strong>Category:</strong> {{ product.category }}</p>
        <p><strong>Brand:</strong> {{ product.brand || 'N/A' }}</p>
        <p><strong>Stock:</strong> {{ product.stock }}</p>
        <p><strong>Description:</strong> {{ product.description }}</p>

        <div style="margin-top: 20px;">
          <button class="btn" (click)="addToCart()">Add to Cart</button>
          <a routerLink="/products" class="btn btn-secondary" style="margin-left: 10px;">Back to Products</a>
        </div>
      </div>
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
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
    }
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
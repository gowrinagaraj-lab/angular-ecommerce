import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';

export interface CategoryItem {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: CategoryItem[] = [];
  searchTerm = '';
  loading = true;
  error = '';

  showAddForm = false;
  creating = false;
  newProduct: Partial<Product> = this.resetNewProductForm();

  editingProduct: Product | null = null;
  saving = false;
  isAdmin = false;

  // File Upload / Image State
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private productService: ProductService, 
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'admin';
    });

    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (res: any) => {
        const rawData = res.data || res || [];
        this.categories = rawData.map((c: any) => ({
          _id: String(c._id),
          name: c.name
        }));
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    this.productService.getProducts(1, 18, this.searchTerm).subscribe({
      next: (res) => {
        this.products = (res.data as Product[]) || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load products from server.';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.loadProducts();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  getImageUrl(product: Product): string {
    if (product.mainImage && product.mainImage.trim() !== '') return product.mainImage;
    if (product.images && product.images.length > 0 && product.images[0]?.url) return product.images[0].url;
    return 'https://via.placeholder.com/150';
  }

  addToCart(product: Product): void {
    if (!product._id) return;
    this.cartService.addToCart(product._id).subscribe({
      next: () => alert(`${product.name} added to cart!`),
      error: (err) => alert(err.error?.message || 'Failed to add product to cart')
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    this.editingProduct = null;
    this.selectedFile = null;
    this.imagePreview = null;
    if (!this.showAddForm) {
      this.newProduct = this.resetNewProductForm();
    }
  }

  startEdit(product: Product): void {
    this.showAddForm = false;
    
    let categoryId = '';
    if (product.category) {
      if (typeof product.category === 'object' && '_id' in (product.category as any)) {
        categoryId = String((product.category as any)._id);
      } else {
        categoryId = String(product.category);
      }
    }

    this.editingProduct = { 
      ...product,
      category: categoryId
    };

    this.selectedFile = null;
    this.imagePreview = null;
  }

  cancelEdit(): void {
    this.editingProduct = null;
    this.selectedFile = null;
    this.imagePreview = null;
  }

  resetNewProductForm(): Partial<Product> {
    return { name: '', description: '', price: 0, stock: 0, category: '', brand: '', mainImage: '' };
  }

  // --- SEND RAW JSON PAYLOAD ON CREATE ---
  createProduct(): void {
    if (!this.newProduct.name || !this.newProduct.description || !this.newProduct.category) {
      alert('Please complete all required fields including Category.');
      return;
    }

    this.creating = true;

    // Send direct JSON object instead of FormData
    const payload = {
      name: this.newProduct.name,
      price: Number(this.newProduct.price || 0),
      stock: Number(this.newProduct.stock || 0),
      category: String(this.newProduct.category),
      brand: this.newProduct.brand || '',
      description: this.newProduct.description,
      mainImage: this.imagePreview || this.newProduct.mainImage || ''
    };

    this.productService.createProduct(payload).subscribe({
      next: () => {
        this.creating = false;
        alert('Product created successfully!');
        this.showAddForm = false;
        this.newProduct = this.resetNewProductForm();
        this.selectedFile = null;
        this.imagePreview = null;
        this.loadProducts();
      },
      error: (err) => {
        this.creating = false;
        alert(err.error?.message || 'Failed to create product.');
      }
    });
  }

  // --- SEND RAW JSON PAYLOAD ON UPDATE ---
  saveProductUpdate(): void {
    if (!this.editingProduct || !this.editingProduct._id) return;

    this.saving = true;

    // Send direct JSON object instead of FormData
    const payload = {
      name: this.editingProduct.name,
      price: Number(this.editingProduct.price || 0),
      stock: Number(this.editingProduct.stock || 0),
      category: String(this.editingProduct.category),
      brand: this.editingProduct.brand || '',
      description: this.editingProduct.description,
      mainImage: this.imagePreview || this.editingProduct.mainImage || ''
    };

    this.productService.updateProduct(this.editingProduct._id, payload).subscribe({
      next: () => {
        this.saving = false;
        alert('Product updated successfully!');
        this.editingProduct = null;
        this.selectedFile = null;
        this.imagePreview = null;
        this.loadProducts();
      },
      error: (err) => {
        this.saving = false;
        alert(err.error?.message || 'Failed to update product.');
      }
    });
  }

  deleteProduct(product: Product): void {
    if (!product._id) return;

    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.productService.deleteProduct(product._id).subscribe({
        next: () => {
          alert('Product deleted successfully!');
          this.loadProducts();
        },
        error: (err) => alert(err.error?.message || 'Failed to delete product.')
      });
    }
  }
}
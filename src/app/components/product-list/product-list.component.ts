import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../socket.service';
import { PaginatorModule } from 'primeng/paginator';

export interface CategoryItem {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, FormsModule, PaginatorModule, ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: CategoryItem[] = [];
  searchTerm = '';
  selectedCategory = '';
  loading = true;
  error = '';

  totalRecords = 0;
  pageSize = 12;
  currentPage = 1;

  showAddForm = false;
  creating = false;
  newProduct: Partial<Product> = this.resetNewProductForm();

  editingProduct: Product | null = null;
  saving = false;
  isAdmin = false;

  // File Upload / Image State
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService, 
    private socketService: SocketService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isAdmin = user?.role === 'admin';
    });

    this.loadCategories();
    this.loadProducts();

    // Real-time updates: deletes and updates are applied to the list at once;
    // anything that changes paging or ordering triggers a quiet reload.
    this.socketService.onProductDeleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ data }) => this.applyProductDeleted(data._id));

    this.socketService.onProductUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ data, partial }) => this.applyProductUpdated(data, !!partial));

    this.socketService.onProductCreated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.reloadQuietly$.next());

    this.reloadQuietly$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.loadProducts(true));
  }

  private reloadQuietly$ = new Subject<void>();

  private applyProductDeleted(productId: string): void {
    const before = this.products.length;
    this.products = this.products.filter(product => product._id !== productId);

    if (this.products.length < before) {
      this.totalRecords = Math.max(0, this.totalRecords - 1);

      if (this.editingProduct?._id === productId) {
        this.editingProduct = null;
      }
    }

    // Refill the page (and fix page counts) from the server in the background
    this.reloadQuietly$.next();
  }

  private applyProductUpdated(data: Partial<Product> & { _id?: string }, partial: boolean): void {
    const index = this.products.findIndex(product => product._id === data._id);

    if (index === -1) {
      return;
    }

    const current = this.products[index];
    const { category, ...changes } = data;

    // Events carry the category as a plain id; keep the populated one unless it changed
    const currentCategoryId = typeof current.category === 'object' ? current.category?._id : current.category;
    const categoryChanged = !partial && category !== undefined && String(category) !== String(currentCategoryId);

    this.products = this.products.map((product, i) => (i === index ? { ...product, ...changes } : product));

    if (categoryChanged) {
      this.reloadQuietly$.next();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  // `quiet` refreshes in the background without the loading state (used for real-time updates)
  loadProducts(quiet = false): void {
    if (!quiet) {
      this.loading = true;
      this.error = '';
    }

    this.productService.getProducts(this.currentPage, this.pageSize, this.searchTerm, this.selectedCategory).subscribe({
      next: (res) => {
        this.products = (res.data as Product[]) || [];
        this.totalRecords = res.total || 0;
        this.loading = false;
      },
      error: (err) => {
        if (!quiet) {
          this.error = err.error?.message || 'Failed to load products from server.';
        }
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1; // Reset to first page on search
    this.loadProducts();
  }

  onCategoryChange(): void {
    this.currentPage = 1; // Reset to first page on category change
    this.loadProducts();
  }

  onPageChange(event: any): void {
    // PrimeNG Paginator event: event.page is 0-indexed, event.rows is the selected page size
    this.currentPage = event.page + 1;
    this.pageSize = event.rows;
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
    } else {
      this.selectedFile = null;
      this.imagePreview = null;
    }
  }

  getImageUrl(product: Product): string {
    if (product.mainImage && product.mainImage.trim() !== '') return product.mainImage;
    if (product.images && product.images.length > 0 && product.images[0]?.url) return product.images[0].url;
    return 'https://via.placeholder.com/150';
  }

  isOutOfStock(product: Product): boolean {
    return (product.stock ?? 0) <= 0;
  }

  addToCart(product: Product): void {
    if (!product._id || this.isOutOfStock(product)) return;
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
    return { name: '', description: '', price: 0, stock: 0, lowStockThreshold: 5, category: '', brand: '', mainImage: '' };
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
      lowStockThreshold: Number(this.newProduct.lowStockThreshold ?? 5),
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
      lowStockThreshold: Number(this.editingProduct.lowStockThreshold ?? 5),
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

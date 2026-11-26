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
import { getMediaUrl } from '../../config/api.config';

const FALLBACK_IMAGE = 'https://via.placeholder.com/150?text=No+Image';

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

  // Advanced filters
  showFilters = false;
  brandFilter = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  inStockOnly = false;
  sortOption = '-createdAt';

  sortOptions = [
    { label: 'Newest', value: '-createdAt' },
    { label: 'Price: Low to High', value: 'price' },
    { label: 'Price: High to Low', value: '-price' },
    { label: 'Top Rated', value: '-rating' },
    { label: 'Name: A to Z', value: 'name' }
  ];

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

    this.productService.getProducts({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm,
      category: this.selectedCategory,
      brand: this.brandFilter,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      inStock: this.inStockOnly,
      sort: this.sortOption
    }).subscribe({
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

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  selectCategoryChip(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.onCategoryChange();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.brandFilter = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.inStockOnly = false;
    this.sortOption = '-createdAt';
    this.currentPage = 1;
    this.loadProducts();
  }

  hasActiveFilters(): boolean {
    return !!this.selectedCategory || !!this.brandFilter || this.minPrice !== null || this.maxPrice !== null || this.inStockOnly;
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
    if (product.mainImage && product.mainImage.trim() !== '') return getMediaUrl(product.mainImage);
    if (product.images && product.images.length > 0 && product.images[0]?.url) return getMediaUrl(product.images[0].url);
    return FALLBACK_IMAGE;
  }

  // Swaps a broken/404'd image (deleted file, bad manual URL) for the placeholder
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = FALLBACK_IMAGE;
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

  // Builds the shared multipart payload for create/update: the mainImage field carries
  // either the selected File (uploaded and resized server-side) or the manual URL text,
  // never both - matching the form's "Upload File OR Main Image URL" choice.
  private buildProductFormData(product: Partial<Product>): FormData {
    const formData = new FormData();
    formData.append('name', product.name || '');
    formData.append('price', String(Number(product.price || 0)));
    formData.append('stock', String(Number(product.stock || 0)));
    formData.append('lowStockThreshold', String(Number(product.lowStockThreshold ?? 5)));
    formData.append('category', String(product.category || ''));
    formData.append('brand', product.brand || '');
    formData.append('description', product.description || '');

    if (this.selectedFile) {
      formData.append('mainImage', this.selectedFile, this.selectedFile.name);
    } else {
      formData.append('mainImage', product.mainImage || '');
    }

    return formData;
  }

  createProduct(): void {
    if (!this.newProduct.name || !this.newProduct.description || !this.newProduct.category) {
      alert('Please complete all required fields including Category.');
      return;
    }

    this.creating = true;

    const formData = this.buildProductFormData(this.newProduct);

    this.productService.createProduct(formData).subscribe({
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

  saveProductUpdate(): void {
    if (!this.editingProduct || !this.editingProduct._id) return;

    this.saving = true;

    const formData = this.buildProductFormData(this.editingProduct);

    this.productService.updateProduct(this.editingProduct._id, formData).subscribe({
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

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-admin-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-category.component.html',
  styleUrl: './admin-category.component.css'
})
export class AdminCategoryComponent implements OnInit {
  categories: any[] = [];
  categoryName: string = '';
  categoryDescription: string = '';
  editingCategoryId: string | null = null;
  successMessage: string = '';
  errorMessage: string = '';
  isSubmitting = false;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (res) => {
        // Backend might return { success: true, data: [...] } or just an array
        this.categories = res.data || res || [];
      },
      error: (err) => {
        this.errorMessage = 'Failed to load categories';
      }
    });
  }

  onSubmit(): void {
    if (!this.categoryName.trim()) {
      this.errorMessage = 'Category name is required';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const categoryData = {
      name: this.categoryName,
      description: this.categoryDescription
    };

    if (this.editingCategoryId) {
      this.productService.updateCategory(this.editingCategoryId, categoryData).subscribe({
        next: (res) => {
          this.successMessage = 'Category updated successfully!';
          this.resetForm();
          this.loadCategories();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update category';
          this.isSubmitting = false;
        }
      });
    } else {
      this.productService.createCategory(categoryData).subscribe({
        next: (res) => {
          this.successMessage = 'Category created successfully!';
          this.resetForm();
          this.loadCategories();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create category';
          this.isSubmitting = false;
        }
      });
    }
  }

  editCategory(category: any): void {
    this.editingCategoryId = category._id;
    this.categoryName = category.name;
    this.categoryDescription = category.description || '';
    this.successMessage = '';
    this.errorMessage = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteCategory(id: string): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.productService.deleteCategory(id).subscribe({
        next: (res) => {
          this.successMessage = 'Category deleted successfully!';
          this.loadCategories();
          if (this.editingCategoryId === id) {
            this.resetForm();
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to delete category';
        }
      });
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.categoryName = '';
    this.categoryDescription = '';
    this.editingCategoryId = null;
    this.isSubmitting = false;
  }
}

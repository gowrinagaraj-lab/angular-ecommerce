import { Component, OnDestroy, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { CategoryImportService } from '../../services/category-import.service';
import { ImportJob, isTerminalImportStatus } from '../../models/import-job.model';

// Persisted so an in-progress import survives a browser refresh (Phase 10) - the job
// itself lives in MongoDB, this is just enough of a breadcrumb for this tab to find it
// again and resume polling.
const ACTIVE_IMPORT_JOB_KEY = 'categoryImport.activeJobId';

@Component({
  selector: 'app-admin-category',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-category.component.html',
  styleUrl: './admin-category.component.css'
})
export class AdminCategoryComponent implements OnInit, OnDestroy {
  categories: any[] = [];
  pagedCategories: any[] = [];
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  categoryName = '';
  categoryDescription = '';
  editingCategoryId: string | null = null;
  successMessage = '';
  errorMessage = '';
  isSubmitting = false;

  // --- Category import (CSV/Excel) state ---
  selectedImportFile: File | null =null;
  importFileError = '';
  isUploading = false;
  uploadProgress: number | null = null;
  currentImportJob: ImportJob | null = null;
  private pollingSubscription: Subscription | null = null;

  constructor(
    private productService: ProductService,
    private categoryImportService: CategoryImportService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.resumeImportIfAny();
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (res) => {
        // Backend might return { success: true, data: [...] } or just an array
        this.categories = res.data || res || [];
        this.updatePagedCategories();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load categories';
      }
    });
  }

  private updatePagedCategories(): void {
    this.totalPages = Math.max(1, Math.ceil(this.categories.length / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedCategories = this.categories.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.updatePagedCategories();
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
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

  toggleStatus(category: any): void {
    const newStatus = !category.isActive;
    this.productService.toggleCategoryStatus(category._id, newStatus).subscribe({
      next: (res) => {
        this.successMessage = `Category ${newStatus ? 'activated' : 'deactivated'} successfully!`;
        category.isActive = newStatus;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update category status';
      }
    });
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

  // --- Category import (CSV/Excel) ---

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.importFileError = '';
    this.selectedImportFile = null;

    if (!file) {
      return;
    }

    // Client-side check purely for fast feedback - the backend re-validates
    // extension, size and required columns regardless, since this check is trivially
    // bypassed and must never be trusted as the real gate.
    const isAllowedExtension = /\.(csv|xlsx)$/i.test(file.name);

    if (!isAllowedExtension) {
      this.importFileError = 'Only .csv and .xlsx files are supported.';
      input.value = '';
      return;
    }

    this.selectedImportFile = file;
  }

  startImport(): void {

    if (!this.selectedImportFile || this.isUploading || this.isImportInProgress()) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.importFileError = '';
    this.currentImportJob = null;

    this.categoryImportService
      .uploadImportFile(this.selectedImportFile)
      .pipe(finalize(() => (this.isUploading = false)))
      .subscribe({
        next: (event) => {
          
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round((event.loaded / event.total) * 100);
          } else if (event.type === HttpEventType.Response) {
            const jobId = event.body?.data?.jobId;

            if (jobId) {
              this.selectedImportFile = null;
              this.beginTrackingImport(jobId);
            }
          }
        },
        error: (err) => {
          this.importFileError = err.error?.message || 'Failed to upload file for import.';
          this.uploadProgress = null;
        }
      });
  }

  cancelCurrentImport(): void {
    if (!this.currentImportJob) {
      return;
    }

    const jobId = this.currentImportJob.jobId;

    this.categoryImportService.cancelImport(jobId).subscribe({
      // No local state change here on success - the next poll tick (within ~2s) will
      // observe status "cancelled" from the server and the polling stream will stop
      // itself. That keeps the server's job document as the single source of truth
      // instead of the UI guessing at what "cancelled" should look like.
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to cancel import.';
      }
    });
  }

  dismissImportResult(): void {
    this.currentImportJob = null;
    this.uploadProgress = null;
  }

  isImportInProgress(): boolean {
    return !!this.currentImportJob && !isTerminalImportStatus(this.currentImportJob.status);
  }

  private resumeImportIfAny(): void {
    const storedJobId = localStorage.getItem(ACTIVE_IMPORT_JOB_KEY);

    if (storedJobId) {
      this.beginTrackingImport(storedJobId);
    }
  }

  private beginTrackingImport(jobId: string): void {
    debugger
    localStorage.setItem(ACTIVE_IMPORT_JOB_KEY, jobId);

    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = this.categoryImportService.pollImportStatus(jobId).subscribe((job) => {
      this.currentImportJob = job;

      if (isTerminalImportStatus(job.status)) {
        localStorage.removeItem(ACTIVE_IMPORT_JOB_KEY);

        if (job.status === 'completed') {
          this.loadCategories();
        }
      }
    });
  }
}

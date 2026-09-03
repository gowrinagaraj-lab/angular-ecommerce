import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ReviewService, Review } from '../../services/review.service';
import { getMediaUrl } from '../../config/api.config';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, RatingModule, FormsModule, PaginatorModule, DialogModule, ButtonModule],
  templateUrl: './my-reviews.component.html',
  styleUrl: './my-reviews.component.css'
})
export class MyReviewsComponent implements OnInit {
  reviews: Review[] = [];
  loading = true;
  error = '';

  // Expose helper to template
  getMediaUrl = getMediaUrl;

  totalRecords = 0;
  pageSize = 10;
  currentPage = 1;

  // Edit modal state
  showEditModal = false;
  editData = { reviewId: '', rating: 5, comment: '' };
  editLoading = false;

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.fetchReviews();
  }

  fetchReviews(page = 1): void {
    this.loading = true;
    this.currentPage = page;

    this.reviewService.getMyReviews(page, this.pageSize).subscribe({
      next: (res) => {
        this.reviews = res.data || [];
        this.totalRecords = res.total || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load reviews.';
        this.loading = false;
      }
    });
  }

  onPageChange(event: any): void {
    const page = event.page + 1;
    this.pageSize = event.rows;
    this.fetchReviews(page);
  }

  openEditModal(review: Review): void {
    this.editData = {
      reviewId: review._id,
      rating: review.rating,
      comment: review.comment || ''
    };
    this.showEditModal = true;
  }

  submitEdit(): void {
    if (!this.editData.rating) {
      alert('Please provide a rating.');
      return;
    }
    this.editLoading = true;
    this.reviewService.updateReview(this.editData.reviewId, {
      rating: this.editData.rating,
      comment: this.editData.comment
    }).subscribe({
      next: () => {
        this.editLoading = false;
        this.showEditModal = false;
        this.fetchReviews(this.currentPage); // Refresh list
      },
      error: (err) => {
        this.editLoading = false;
        alert(err.error?.message || 'Failed to update review.');
      }
    });
  }

  confirmDelete(reviewId: string): void {
    if (!confirm('Are you sure you want to delete this review? This cannot be undone.')) return;
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        this.fetchReviews(this.currentPage);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete review.');
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService, Review } from '../../services/review.service';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-review-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TagModule, ButtonModule, RatingModule],
  templateUrl: './admin-review-moderation.component.html',
  styleUrls: ['./admin-review-moderation.component.css']
})
export class AdminReviewModerationComponent implements OnInit {
  reviews: Review[] = [];

  loading = true;
  error = '';
  updatingReviewId: string | null = null;

  // Pagination
  page = 1;
  limit = 10;
  totalRecords = 0;

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    // Intentionally left blank, data is loaded via onLazyLoad in p-table
  }

  loadData(event: any): void {
    if (event.rows !== undefined) {
      this.limit = event.rows;
      this.page = Math.floor((event.first || 0) / event.rows) + 1;
    }

    this.loadQueue();
  }

  loadQueue(): void {
    this.loading = true;
    this.error = '';

    this.reviewService.getModerationQueue(this.page, this.limit).subscribe({
      next: (res) => {
        this.reviews = res.data || [];
        this.totalRecords = res.total || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load the moderation queue';
        this.loading = false;
      }
    });
  }

  approve(review: Review): void {
    if (!confirm('Approve this review and keep it visible? This clears all reports on it.')) {
      return;
    }

    this.setStatus(review, 'visible');
  }

  hide(review: Review): void {
    if (!confirm('Hide this review? It will no longer be shown to customers or count toward the product rating.')) {
      return;
    }

    this.setStatus(review, 'hidden');
  }

  private setStatus(review: Review, status: 'visible' | 'hidden'): void {
    this.updatingReviewId = review._id;

    this.reviewService.moderateReview(review._id, status).subscribe({
      next: () => {
        this.updatingReviewId = null;
        // Reloads from the server: approving clears reports (drops off the queue),
        // hiding clears reports too but the review stays listed (status: hidden).
        this.loadQueue();
      },
      error: (err) => {
        this.updatingReviewId = null;
        alert(err.error?.message || 'Failed to update this review');
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../services/order.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { RatingModule } from 'primeng/rating';
import { ReviewService, Review } from '../../services/review.service';
import { getMediaUrl } from '../../config/api.config';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule, RatingModule],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  cols: any[] = [];
  loading = true;
  error = '';
  expandedOrderId: string | null = null;
  otpInput: any;

  // Expose helper to template
  getMediaUrl = getMediaUrl;

  // Map of "productId_orderId" -> Review for fast lookup
  myReviewsMap: Record<string, Review> = {};

  // Write Review Modal
  showReviewModal = false;
  reviewData = { productId: '', orderId: '', rating: 5, comment: '' };
  reviewFiles: File[] = [];
  reviewVideoFile: File | null = null;

  // View Review Modal
  showViewReviewModal = false;
  viewingReview: Review | null = null;

  // Edit Review Modal
  showEditModal = false;
  editData = { reviewId: '', rating: 5, comment: '' };
  editLoading = false;

  constructor(
    private orderService: OrderService,
    private reviewService: ReviewService
  ) { }

  ngOnInit(): void {
    this.cols = [
      { field: 'sNo', header: 'S.No' },
      { field: '_id', header: 'Order ID' },
      { field: 'createdAt', header: 'Date' },
      { field: 'totalItems', header: 'Total Items' },
      { field: 'paymentMethod', header: 'Payment Method' },
      { field: 'paymentStatus', header: 'Payment Status' },
      { field: 'orderStatus', header: 'Order Status' },
      { field: 'totalAmount', header: 'Total' }
    ];
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.loading = true;
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        this.orders = (res.data || []).map((order: any, index: number) => ({
          ...order,
          sNo: index + 1,
          totalItems: order.items ? order.items.length : 0
        }));
        this.loading = false;
        // After loading orders, fetch reviews to build the lookup map
        this.fetchMyReviews();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load order history.';
        this.loading = false;
      }
    });
  }

  fetchMyReviews(): void {
    this.reviewService.getMyReviews(1, 100).subscribe({
      next: (res) => {
        const reviews: Review[] = res.data || [];
        // Build a map: "productId_orderId" -> Review
        this.myReviewsMap = {};
        reviews.forEach(review => {
          const productId = typeof review.product === 'object' ? review.product._id : review.product;
          const key = `${productId}_${review.order}`;
          this.myReviewsMap[key] = review;
        });
      },
      error: () => {
        // Non-fatal: review status just won't show
      }
    });
  }

  getReviewKey(productId: string, orderId: string): string {
    return `${productId}_${orderId}`;
  }

  isReviewed(item: any, orderId: string): boolean {
    const productId = item.product?._id || item.product;
    return !!this.myReviewsMap[this.getReviewKey(productId, orderId)];
  }

  openReviewModal(item: any, orderId: string): void {
    const productId = item.product?._id || item.product;
    this.reviewData = { productId, orderId, rating: 5, comment: '' };
    this.reviewFiles = [];
    this.reviewVideoFile = null;
    this.showReviewModal = true;
  }

  openViewReviewModal(item: any, orderId: string): void {
    const productId = item.product?._id || item.product;
    const key = this.getReviewKey(productId, orderId);
    console.log("************", this.myReviewsMap[key],)
    this.viewingReview = this.myReviewsMap[key] || null;
    if (this.viewingReview) {
      this.showViewReviewModal = true;
    }
  }

  openEditReviewModal(): void {
    if (!this.viewingReview) return;
    this.editData = {
      reviewId: this.viewingReview._id,
      rating: this.viewingReview.rating,
      comment: this.viewingReview.comment || ''
    };
    this.showEditModal = true;
  }

  submitEditReview(): void {
    if (!this.editData.rating) { alert('Please provide a rating.'); return; }
    this.editLoading = true;
    this.reviewService.updateReview(this.editData.reviewId, {
      rating: this.editData.rating,
      comment: this.editData.comment
    }).subscribe({
      next: () => {
        this.editLoading = false;
        this.showEditModal = false;
        this.showViewReviewModal = false;
        this.fetchMyReviews(); // Refresh review map
      },
      error: (err) => {
        this.editLoading = false;
        alert(err.error?.message || 'Failed to update review.');
      }
    });
  }

  confirmDeleteReview(): void {
    if (!this.viewingReview) return;
    if (!confirm('Are you sure you want to delete this review?')) return;
    this.reviewService.deleteReview(this.viewingReview._id).subscribe({
      next: () => {
        this.showViewReviewModal = false;
        this.viewingReview = null;
        this.fetchMyReviews();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete review.');
      }
    });
  }

  toggleDetails(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
    this.otpInput = '';
  }

  statusClass(status: string | undefined): string {
    switch ((status || '').toLowerCase()) {
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      case 'shipped': return 'badge-info';
      default: return 'badge-pending';
    }
  }

  cancelOrder(orderId: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('Are you sure you want to cancel this order?')) return;

    this.orderService.cancelOrder(orderId).subscribe({
      next: (res) => {
        alert(res.message || 'Order cancelled successfully');
        this.fetchOrders();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to cancel order');
      }
    });
  }

  onFileSelect(event: any): void {
    if (event.target.files) {
      this.reviewFiles = Array.from(event.target.files);
    }
  }

  onVideoSelect(event: any): void {
    const file: File = event.target.files?.[0];
    if (file) {
      this.reviewVideoFile = file;
    }
  }

  clearVideo(): void {
    this.reviewVideoFile = null;
  }

  submitReview(): void {
    if (!this.reviewData.rating) {
      alert('Please provide a rating.');
      return;
    }

    const formData = new FormData();
    formData.append('productId', this.reviewData.productId);
    formData.append('orderId', this.reviewData.orderId);
    formData.append('rating', this.reviewData.rating.toString());

    if (this.reviewData.comment) {
      formData.append('comment', this.reviewData.comment);
    }

    this.reviewFiles.forEach(file => {
      formData.append('photos', file);
    });

    if (this.reviewVideoFile) {
      formData.append('video', this.reviewVideoFile);
    }

    this.reviewService.createReview(formData).subscribe({
      next: () => {
        alert('Review submitted successfully!');
        this.showReviewModal = false;
        // Refresh reviews map so this item now shows "Reviewed"
        this.fetchMyReviews();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to submit review');
      }
    });
  }
}

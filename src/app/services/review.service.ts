import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '../config/api.config';

export interface ReviewMedia {
  type: 'image' | 'video' | 'file';
  url: string;
  originalName?: string;
}

export interface ReviewReport {
  user: any;
  reason: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  product: any;
  user: any; // Could be populated user object or string ID
  order: string;
  rating: number;
  comment: string;
  media: ReviewMedia[];
  status?: 'visible' | 'hidden';
  reportCount?: number;
  reports?: ReviewReport[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  success: boolean;
  message?: string;
  data?: any;
  total?: number;
  page?: number;
  totalPages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = getApiUrl('reviews' as any); // Cast as any because 'reviews' is recently added

  constructor(private http: HttpClient) { }

  createReview(formData: FormData): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(this.apiUrl, formData);
  }

  getProductReviews(productId: string, page = 1, limit = 10): Observable<ReviewResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ReviewResponse>(`${this.apiUrl}/product/${productId}`, { params });
  }

  getMyReviews(page = 1, limit = 10): Observable<ReviewResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ReviewResponse>(`${this.apiUrl}/my`, { params });
  }

  updateReview(reviewId: string, data: { rating?: number; comment?: string }): Observable<ReviewResponse> {
    return this.http.patch<ReviewResponse>(`${this.apiUrl}/${reviewId}`, data);
  }

  deleteReview(reviewId: string): Observable<ReviewResponse> {
    return this.http.delete<ReviewResponse>(`${this.apiUrl}/${reviewId}`);
  }

  reportReview(reviewId: string, reason?: string): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.apiUrl}/${reviewId}/report`, { reason });
  }

  // Admin: reviews that are hidden or have been reported, awaiting a moderation decision
  getModerationQueue(page = 1, limit = 10): Observable<ReviewResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ReviewResponse>(`${this.apiUrl}/admin/queue`, { params });
  }

  moderateReview(reviewId: string, status: 'visible' | 'hidden'): Observable<ReviewResponse> {
    return this.http.patch<ReviewResponse>(`${this.apiUrl}/${reviewId}/moderate`, { status });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { getApiUrl } from '../config/api.config';
import { NotificationApiResponse, UnreadCountResponse } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = getApiUrl('notifications');
  
  // Real-time unread count observable
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getMyNotifications(page = 1, limit = 10, isRead?: boolean, type?: string): Observable<NotificationApiResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (isRead !== undefined) {
      params = params.set('isRead', isRead);
    }
    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<NotificationApiResponse>(this.apiUrl, { params });
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`).pipe(
      tap(res => {
        if (res.success) {
          this.unreadCountSubject.next(res.data.unreadCount);
        }
      })
    );
  }

  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.getUnreadCount().subscribe(); // Refresh count
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.unreadCountSubject.next(0); // Instantly set to 0
      })
    );
  }
  
  resetUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }
}

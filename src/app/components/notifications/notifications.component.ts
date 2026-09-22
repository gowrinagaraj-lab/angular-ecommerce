import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatorModule } from 'primeng/paginator';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification.model';
import { SocketService } from '../../socket.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, PaginatorModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnDestroy, OnInit {
  notifications: Notification[] = [];
  loading = true;
  error = '';

  totalRecords = 0;
  pageSize = 10;
  currentPage = 1;
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();

    this.socketService.onProductChanged()
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadNotifications();
        this.notificationService.getUnreadCount().subscribe();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = '';

    this.notificationService.getMyNotifications(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.notifications = (res.data as Notification[]) || [];
        this.totalRecords = res.total || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load notifications.';
        this.loading = false;
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.page + 1;
    this.pageSize = event.rows;
    this.loadNotifications();
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) return;
    
    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => {
        notification.isRead = true;
      },
      error: (err) => alert(err.error?.message || 'Failed to mark as read')
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
      },
      error: (err) => alert(err.error?.message || 'Failed to mark all as read')
    });
  }

  getIconForType(type: string): string {
    switch(type) {
      case 'order': return '📦';
      case 'payment': return '💳';
      case 'promotion': return '🎉';
      default: return '🔔';
    }
  }
}

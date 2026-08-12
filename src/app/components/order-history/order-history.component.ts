import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  error = '';
  expandedOrderId: string | null = null;
  otpInput: any
  constructor(private orderService: OrderService) { }

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.loading = true;
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        this.orders = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load order history.';
        this.loading = false;
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
}

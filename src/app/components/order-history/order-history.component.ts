import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../services/order.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  cols: any[] = [];
  loading = true;
  error = '';
  expandedOrderId: string | null = null;
  otpInput: any
  constructor(private orderService: OrderService) { }

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

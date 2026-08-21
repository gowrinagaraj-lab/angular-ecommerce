import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../services/order.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  cols: any[] = [];
  loading = true;
  error = '';
  expandedOrderId: string | null = null;
  
  generatingOtp = false;
  verifyingOtp = false;
  otpInput = '';

  constructor(private orderService: OrderService) {}

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
    this.orderService.getAllOrders().subscribe({
      next: (res) => {
        this.orders = (res.data || []).map((order: any, index: number) => ({
          ...order,
          sNo: index + 1,
          totalItems: order.items ? order.items.length : 0
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load orders.';
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

  generateOtp(order: Order, event: Event): void {
    event.stopPropagation();
    this.generatingOtp = true;
    this.orderService.generateDeliveryOtp(order._id).subscribe({
      next: (res) => {
        this.generatingOtp = false;
        const customerEmail = order.user?.email || 'the customer';
        alert(`OTP sent successfully to ${customerEmail}`);
      },
      error: (err) => {
        this.generatingOtp = false;
        alert(err.error?.message || 'Failed to generate OTP');
      }
    });
  }

  verifyOtp(orderId: string, event: Event): void {
    event.stopPropagation();
    if (!this.otpInput) {
      alert('Please enter OTP');
      return;
    }
    this.verifyingOtp = true;
    this.orderService.verifyDeliveryOtp(orderId, this.otpInput).subscribe({
      next: (res) => {
        this.verifyingOtp = false;
        alert(res.message || 'Order marked as delivered!');
        this.fetchOrders();
      },
      error: (err) => {
        this.verifyingOtp = false;
        alert(err.error?.message || 'Failed to verify OTP');
      }
    });
  }
}

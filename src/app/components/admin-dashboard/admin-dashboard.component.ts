import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { InventorySummary, LowStockProduct } from '../../models/product.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: any = null;
  loading = true;
  error = '';

  inventory: InventorySummary | null = null;
  inventoryLoading = true;
  inventoryError = '';

  constructor(
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadInventory();
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';
    this.orderService.getOrderStats().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load dashboard statistics';
        this.loading = false;
      }
    });
  }

  loadInventory(): void {
    this.inventoryLoading = true;
    this.inventoryError = '';
    this.productService.getInventorySummary().subscribe({
      next: (res) => {
        this.inventory = res.data;
        this.inventoryLoading = false;
      },
      error: (err) => {
        this.inventoryError = err.error?.message || 'Failed to load inventory';
        this.inventoryLoading = false;
      }
    });
  }

  // 0..100 — how much of the alert level is left, for the stock bar
  stockPercent(product: LowStockProduct): number {
    if (!product.lowStockThreshold) {
      return product.stock > 0 ? 100 : 0;
    }
    return Math.min(100, Math.round((product.stock / product.lowStockThreshold) * 100));
  }
}

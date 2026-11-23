import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, AppUser } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    DropdownModule,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: AppUser[] = [];
  currentUserId: string | null = null;

  loading = true;
  error = '';
  updatingUserId: string | null = null;

  // Pagination
  page = 1;
  limit = 10;
  totalRecords = 0;

  // Filters
  filterEmail = '';
  filterRole = '';
  filterStatus = '';

  roleOptions = [
    { label: 'All Roles', value: '' },
    { label: 'Customer', value: 'customer' },
    { label: 'Admin', value: 'admin' }
  ];

  statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' }
  ];

  constructor(private userService: UserService, private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUserValue?._id || null;
    // Intentionally left blank, data is loaded via onLazyLoad in p-table
  }

  loadData(event: any): void {
    if (event.rows !== undefined) {
      this.limit = event.rows;
      this.page = Math.floor((event.first || 0) / event.rows) + 1;
    }

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.userService.getUsers(this.page, this.limit, this.filterRole, this.filterEmail, this.filterStatus).subscribe({
      next: (res) => {
        this.users = res.data;
        this.totalRecords = res.total;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadUsers();
  }

  isSelf(user: AppUser): boolean {
    return !!this.currentUserId && user._id === this.currentUserId;
  }

  toggleRole(user: AppUser): void {
    const nextRole = user.role === 'admin' ? 'customer' : 'admin';

    if (!confirm(`Change ${user.email}'s role to ${nextRole}?`)) {
      return;
    }

    this.updatingUserId = user._id;
    this.userService.updateUserRole(user._id, nextRole).subscribe({
      next: (res) => {
        this.updatingUserId = null;
        user.role = res.data.role;
      },
      error: (err) => {
        this.updatingUserId = null;
        alert(err.error?.message || 'Failed to update role');
      }
    });
  }

  toggleStatus(user: AppUser): void {
    const nextActive = !user.isActive;
    const action = nextActive ? 'reactivate' : 'suspend';

    if (!confirm(`Are you sure you want to ${action} ${user.email}?`)) {
      return;
    }

    this.updatingUserId = user._id;
    this.userService.updateUserStatus(user._id, nextActive).subscribe({
      next: (res) => {
        this.updatingUserId = null;
        user.isActive = res.data.isActive;
      },
      error: (err) => {
        this.updatingUserId = null;
        alert(err.error?.message || 'Failed to update account status');
      }
    });
  }
}

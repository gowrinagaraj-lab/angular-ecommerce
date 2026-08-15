import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, SignInActivity } from '../../services/auth.service';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sign-in-activity',
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
  templateUrl: './sign-in-activity.component.html',
  styleUrls: ['./sign-in-activity.component.css']
})
export class SignInActivityComponent implements OnInit {
  activities: SignInActivity[] = [];
  isAdmin: boolean = false;
  
  loading: boolean = true;
  error: string = '';

  // Pagination
  page: number = 1;
  limit: number = 10;
  totalRecords: number = 0;

  // Filters (Admin only)
  filterEmail: string = '';
  filterStatus: string = '';

  statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Success', value: 'Success' },
    { label: 'Failed', value: 'Failed' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    // Intentionally left blank, data is loaded via onLazyLoad in p-table
  }

  loadData(event: any) {
    if (event.rows !== undefined) {
      this.limit = event.rows;
      this.page = Math.floor((event.first || 0) / event.rows) + 1;
    }
    
    this.loadActivity();
  }

  loadActivity(): void {
    this.loading = true;
    this.error = '';

    if (this.isAdmin) {
      this.authService.getAllSignInActivity(this.page, this.limit, this.filterEmail, this.filterStatus).subscribe({
        next: (res) => {
          this.activities = res.data;
          this.totalRecords = res.total;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load sign-in activity';
          this.loading = false;
        }
      });
    } else {
      this.authService.getMySignInActivity(this.page, this.limit).subscribe({
        next: (res) => {
          this.activities = res.data;
          this.totalRecords = res.total;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load sign-in activity';
          this.loading = false;
        }
      });
    }
  }

  onFilterChange(): void {
    this.page = 1; // Reset to first page
    this.loadActivity();
  }
}

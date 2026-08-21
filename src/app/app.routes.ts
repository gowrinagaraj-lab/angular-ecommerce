import { inject } from '@angular/core';
import { Routes, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

// Component Imports
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { CartComponent } from './components/cart/cart.component';

import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { WishlistComponent } from './components/wishlist/wishlist.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { OrderHistoryComponent } from './components/order-history/order-history.component';
import { AdminCategoryComponent } from './components/admin-category/admin-category.component';
import { AdminOrdersComponent } from './components/admin-orders/admin-orders.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { SignInActivityComponent } from './components/sign-in-activity/sign-in-activity.component';
import { NotificationsComponent } from './components/notifications/notifications.component';

// -------------------------------------------------------------
// ROUTE GUARDS
// -------------------------------------------------------------

// 1. Auth Guard (Requires user to be logged in)
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

// 2. Admin Guard (Requires user to be logged in AND have 'admin' role)
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;
  }

  alert('Access denied: Admin privileges required.');
  router.navigate(['/products']);
  return false;
};

// -------------------------------------------------------------
// ROUTES DEFINITION
// -------------------------------------------------------------

export const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  
  // Public Routes
  { path: 'products', component: ProductListComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Protected User Routes (Requires Login)
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'wishlist', component: WishlistComponent, canActivate: [authGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: 'orders', component: OrderHistoryComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'sign-in-activity', component: SignInActivityComponent, canActivate: [authGuard] },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  
  // Admin Routes
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'admin/categories', component: AdminCategoryComponent, canActivate: [adminGuard] },
  { path: 'admin/orders', component: AdminOrdersComponent, canActivate: [adminGuard] },

  // Fallback Route
  { path: '**', redirectTo: '/products' }
];
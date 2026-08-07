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
{ path: 'reset-password/:token', component: ResetPasswordComponent },
  // Fallback Route
  { path: '**', redirectTo: '/products' }
];
import { Routes } from '@angular/router';
import { adminGuard, entrepreneurGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  { path: 'directory', loadComponent: () => import('./directory/directory.component').then(m => m.DirectoryComponent) },
  { path: 'categories', loadComponent: () => import('./categories/categories.component').then(m => m.CategoriesComponent) },
  { path: 'business/:id', loadComponent: () => import('./business-profile/business-profile.component').then(m => m.BusinessProfileComponent) },
  { path: 'auth/login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-layout').then(m => m.AdminLayout),
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      { path: '', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'requests', loadComponent: () => import('./admin/requests/requests.component').then(m => m.AdminRequestsComponent) },
      { path: 'users', loadComponent: () => import('./admin/users/users.component').then(m => m.AdminUsersComponent) },
    ]
  },
  {
    path: 'entrepreneur',
    loadComponent: () => import('./entrepreneur/entrepreneur-layout').then(m => m.EntrepreneurLayout),
    canActivate: [entrepreneurGuard],
    canActivateChild: [entrepreneurGuard],
    children: [
      { path: '', loadComponent: () => import('./entrepreneur/dashboard/dashboard.component').then(m => m.EntrepreneurDashboardComponent) },
      { path: 'my-business', loadComponent: () => import('./entrepreneur/my-business/my-business.component').then(m => m.EntrepreneurMyBusinessComponent) },
      { path: 'products', loadComponent: () => import('./entrepreneur/products/products.component').then(m => m.EntrepreneurProductsComponent) },
      { path: 'promotions', loadComponent: () => import('./entrepreneur/promotions/promotions.component').then(m => m.EntrepreneurPromotionsComponent) },
      { path: 'settings', loadComponent: () => import('./entrepreneur/settings/settings.component').then(m => m.EntrepreneurSettingsComponent) },
    ]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

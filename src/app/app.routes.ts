import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./layout/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        title: 'Dashboard',
        data: { title: 'Dashboard' },
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'moderation',
        data: { title: 'Product Moderation' },
        loadComponent: () => import('./features/moderation/moderation.component').then((m) => m.ModerationComponent),
      },
      {
        path: 'vendors',
        data: { title: 'Vendors' },
        loadComponent: () => import('./features/vendors/vendors.component').then((m) => m.VendorsComponent),
      },
      {
        path: 'categories',
        data: { title: 'Categories' },
        loadComponent: () => import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'orders',
        data: { title: 'Orders' },
        loadComponent: () => import('./features/orders/orders.component').then((m) => m.OrdersComponent),
      },
      // Delivery-backend pilot (Couriers / Delivery Requests) — no real backend is deployed
      // yet (DeliveryApiService defaults to unreachable localhost:5080), so these routes are
      // disabled until a live delivery-backend URL exists. Re-enable alongside the nav links
      // in shell.component.ts once that's ready.
      // {
      //   path: 'couriers',
      //   data: { title: 'Delivery' },
      //   loadComponent: () => import('./features/couriers/couriers.component').then((m) => m.CouriersComponent),
      // },
      // {
      //   path: 'packages',
      //   data: { title: 'Delivery Requests' },
      //   loadComponent: () => import('./features/packages/packages.component').then((m) => m.PackagesComponent),
      // },
      {
        path: 'customers',
        data: { title: 'Users' },
        loadComponent: () => import('./features/customers/customers.component').then((m) => m.CustomersComponent),
      },
      {
        path: 'customers/:id',
        data: { title: 'Customer' },
        loadComponent: () => import('./features/customers/user-detail.component').then((m) => m.UserDetailComponent),
      },
      {
        path: 'content',
        data: { title: 'Content & Banners' },
        loadComponent: () => import('./features/content/content.component').then((m) => m.ContentComponent),
      },
      {
        path: 'settings',
        data: { title: 'Settings' },
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      { path: '**', redirectTo: 'overview' },
    ],
  },
];

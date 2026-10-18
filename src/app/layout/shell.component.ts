import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from '../shared/icon.component';
import { ToastComponent } from '../shared/toast.component';
import { DrawerHostComponent } from '../shared/drawer-host.component';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { DemoDataService } from '../core/demo-data.service';
import { NavBadgesService } from '../core/nav-badges.service';

interface NavLink {
  view: string;
  icon: string;
  label: string;
  badge?: () => number | null;
}
interface NavGroup {
  group: string;
  links: NavLink[];
}

/** Fee Payments and General Settings are hidden from the Administrator role. */
const LIMITED_ADMIN_HIDDEN = new Set(['payments', 'general-settings']);

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent, ToastComponent, DrawerHostComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  protected auth = inject(AuthService);
  protected toast = inject(ToastService);
  protected demo = inject(DemoDataService);
  protected badges = inject(NavBadgesService);
  private router = inject(Router);

  protected sidebarOpen = signal(false);
  // Delivery-backend pilot badge counts — unused while the Delivery / Delivery Requests
  // nav links below are disabled.
  // protected couriersCashDue = computed(() => this.demo.couriers().filter((c) => this.demo.cashDue(c)).length || null);
  // protected packagesSubmitted = computed(() => this.demo.packages().filter((p) => p.status === 'submitted').length || null);

  constructor() {
    // Restores the sidebar name and roleName after a page refresh (login already loads them).
    this.auth.ensureProfile();
    this.badges.refresh();
  }

  private readonly allNavGroups: NavGroup[] = [
    {
      group: 'Overview',
      links: [{ view: 'overview', icon: 'grid', label: 'Dashboard' }],
    },
    {
      group: 'Marketplace',
      links: [
        { view: 'moderation', icon: 'shield', label: 'Product Moderation', badge: () => this.badges.moderationPending() },
        { view: 'vendors', icon: 'store', label: 'Vendors' },
        { view: 'reports', icon: 'alert', label: 'Reports' },
        { view: 'payments', icon: 'cash', label: 'Fee Payments', badge: () => this.badges.paymentsPending() },
        { view: 'categories', icon: 'tag', label: 'Categories' },
        { view: 'orders', icon: 'box', label: 'Orders' },
        // Delivery-backend pilot — disabled until a real delivery-backend is deployed
        // (route commented out in app.routes.ts too). See DeliveryApiService.
        // { view: 'couriers', icon: 'truck', label: 'Delivery', badge: () => this.couriersCashDue() },
        // { view: 'packages', icon: 'send', label: 'Delivery Requests', badge: () => this.packagesSubmitted() },
      ],
    },
    {
      group: 'Growth',
      links: [
        { view: 'customers', icon: 'users', label: 'Customer' },
        { view: 'content', icon: 'image', label: 'Content & Banners' },
      ],
    },
    {
      group: 'System',
      links: [
        { view: 'settings', icon: 'cog', label: 'Settings' },
        { view: 'general-settings', icon: 'sliders', label: 'General Settings' },
      ],
    },
  ];

  /** An "Administrator" never sees Fee Payments or General Settings. */
  protected navGroups = computed<NavGroup[]>(() =>
    this.auth.limitedAdmin()
      ? this.allNavGroups
          .map((g) => ({ ...g, links: g.links.filter((l) => !LIMITED_ADMIN_HIDDEN.has(l.view)) }))
          .filter((g) => g.links.length > 0)
      : this.allNavGroups,
  );

  /** The bell only counts queues this role can actually open. */
  protected anyPending = computed(
    () => (this.badges.moderationPending() ?? 0) > 0 || (!this.auth.limitedAdmin() && (this.badges.paymentsPending() ?? 0) > 0),
  );

  protected toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }
  protected closeSidebar() {
    this.sidebarOpen.set(false);
  }

  protected signOut() {
    if (!confirm('Sign out?')) return;
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  /** The bell reflects real pending work: it jumps to the first queue that needs the admin,
   *  and only says "nothing new" when there really is nothing pending. */
  protected openNotifications() {
    if (this.badges.moderationPending()) this.router.navigateByUrl('/moderation');
    else if (!this.auth.limitedAdmin() && this.badges.paymentsPending()) this.router.navigateByUrl('/payments');
    else this.toast.show('No new notifications');
  }
}

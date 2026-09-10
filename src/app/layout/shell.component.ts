import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
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
  protected topTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let r = this.router.routerState.snapshot.root;
        while (r.firstChild) r = r.firstChild;
        return r.data['title'] ?? 'Dashboard';
      }),
    ),
    { initialValue: 'Dashboard' },
  );

  // Delivery-backend pilot badge counts — unused while the Delivery / Delivery Requests
  // nav links below are disabled.
  // protected couriersCashDue = computed(() => this.demo.couriers().filter((c) => this.demo.cashDue(c)).length || null);
  // protected packagesSubmitted = computed(() => this.demo.packages().filter((p) => p.status === 'submitted').length || null);

  protected navGroups: NavGroup[] = [
    {
      group: 'Overview',
      links: [{ view: 'overview', icon: 'grid', label: 'Dashboard' }],
    },
    {
      group: 'Marketplace',
      links: [
        { view: 'moderation', icon: 'shield', label: 'Product Moderation', badge: () => this.badges.moderationPending() },
        { view: 'vendors', icon: 'store', label: 'Vendors', badge: () => this.badges.vendorsPending() },
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
        { view: 'customers', icon: 'users', label: 'Users' },
        { view: 'content', icon: 'image', label: 'Content & Banners' },
      ],
    },
    {
      group: 'System',
      links: [{ view: 'settings', icon: 'cog', label: 'Settings' }],
    },
  ];

  constructor() {
    // Every feature's load()/save() catch block special-cases a 401 by bailing out silently
    // (relying on AuthService.apiFetch having already cleared the token) instead of setting
    // its own error state — so without this, a session that expires mid-page leaves that
    // page's spinner or busy state stuck forever with no way back to /login but a manual
    // refresh. This is the one place all of those pages route through, so it's the one place
    // that needs to react when the session drops out from under them.
    effect(() => {
      if (!this.auth.isLoggedIn()) {
        this.toast.show('Your session expired — please sign in again.');
        this.router.navigateByUrl('/login');
      }
    });
  }

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

  protected onIconAction(kind: 'bell' | 'help') {
    this.toast.show(kind === 'bell' ? 'No new notifications' : 'Help & documentation');
  }
}

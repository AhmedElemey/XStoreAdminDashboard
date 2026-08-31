import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KpiCardComponent } from '../../shared/kpi-card.component';
import { AvatarComponent } from '../../shared/avatar.component';
import { DemoDataService } from '../../core/demo-data.service';
import { egp } from '../../core/format';
import { DemoOrder } from '../../core/models';

const CATS_PREVIEW: [string, string, number][] = [
  ['Electronics', '📱', 842],
  ['Fashion', '👕', 1290],
  ['Home & Garden', '🛋️', 610],
  ['Beauty', '✨', 455],
  ['Sports', '🏋️', 288],
  ['Toys', '🧸', 176],
];

const PENDING_PREVIEW: { t: string; v: string; cat: string }[] = [
  { t: 'iPhone 13 Pro 256GB', v: 'Cairo Tech Hub', cat: 'Electronics' },
  { t: 'Handmade Linen Abaya', v: 'Zamalek Boutique', cat: 'Fashion' },
  { t: 'Ergonomic Office Chair', v: 'Nile Home Décor', cat: 'Home & Garden' },
  { t: 'Vitamin-C Serum 30ml', v: 'Alexandria Beauty Bar', cat: 'Beauty' },
];

const OSTAT: Record<string, [string, string]> = {
  pending: ['b-grey', 'Pending'],
  confirmed: ['b-blue', 'Confirmed'],
  processing: ['b-indigo', 'Processing'],
  shipped: ['b-amber', 'Shipped'],
  delivered: ['b-green', 'Delivered'],
  cancelled: ['b-red', 'Cancelled'],
};

const REVENUE = [62, 58, 71, 69, 84, 78, 96, 102, 94, 115, 108, 124];

@Component({
  selector: 'app-dashboard',
  imports: [KpiCardComponent, AvatarComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private router = inject(Router);
  protected demo = inject(DemoDataService);
  protected egp = egp;
  protected OSTAT = OSTAT;

  protected catBars = CATS_PREVIEW.map(([name, emoji, count]) => ({
    name,
    emoji,
    count,
    pct: Math.round((count / 1290) * 100),
  }));
  protected pending = PENDING_PREVIEW;
  protected recentOrders = () => this.demo.orders().slice(0, 5);

  protected max = Math.max(...REVENUE);
  protected points = REVENUE.map((v, i) => `${20 + i * (560 / 11)},${180 - (v / this.max) * 150}`).join(' ');
  protected area = `20,180 ${this.points} 580,180`;
  protected dots = REVENUE.map((v, i) => ({ cx: 20 + i * (560 / 11), cy: 180 - (v / this.max) * 150 }));

  protected orderTotal(o: DemoOrder) {
    return this.demo.orderTotal(o);
  }

  protected goto(view: string) {
    this.router.navigateByUrl('/' + view);
  }
}

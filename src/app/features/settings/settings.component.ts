import { Component, inject, signal } from '@angular/core';
import { DemoDataService } from '../../core/demo-data.service';
import { DrawerService } from '../../core/drawer.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { InviteFormComponent } from './invite-form.component';

interface Toggle {
  label: string;
  on: boolean;
}

@Component({
  selector: 'app-settings',
  imports: [AvatarComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  protected demo = inject(DemoDataService);
  private drawer = inject(DrawerService);

  protected toggles = signal<Toggle[]>([
    { label: 'Require admin approval before products go live', on: true },
    { label: 'Require admin approval for new vendors', on: true },
    { label: 'Cash on Delivery enabled', on: true },
    { label: 'Delivered by xStore — platform couriers collect COD (pilot)', on: true },
    { label: 'Online payment gateway (Paymob/Fawry)', on: false },
    { label: 'Guest browsing (no login)', on: false },
    { label: 'Allow vendor-level coupons', on: false },
  ]);

  protected toggle(i: number) {
    this.toggles.update((list) => list.map((t, idx) => (idx === i ? { ...t, on: !t.on } : t)));
  }

  protected roleBadgeClass(role: string) {
    return role === 'Super Admin' ? 'b-indigo' : role === 'Moderator' ? 'b-blue' : 'b-grey';
  }

  protected openInvite() {
    this.drawer.show('Invite team member', InviteFormComponent, {});
  }
}

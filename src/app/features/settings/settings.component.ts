import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoDataService } from '../../core/demo-data.service';
import { DrawerService } from '../../core/drawer.service';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { StateBlockComponent } from '../../shared/state-block.component';
import { InviteFormComponent } from './invite-form.component';
import { MappedSystemSettings, mapSystemSettings } from '../../core/mappers';
import { Dto } from '../../core/models';
import { ApiError } from '../../core/api-error';

interface Toggle {
  label: string;
  on: boolean;
}

@Component({
  selector: 'app-settings',
  imports: [AvatarComponent, StateBlockComponent, FormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  protected demo = inject(DemoDataService);
  private drawer = inject(DrawerService);
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  protected toggles = signal<Toggle[]>([
    { label: 'Require admin approval before products go live', on: true },
    { label: 'Require admin approval for new vendors', on: true },
    { label: 'Cash on Delivery enabled', on: true },
    { label: 'Delivered by xStore — platform couriers collect COD (pilot)', on: true },
    { label: 'Online payment gateway (Paymob/Fawry)', on: false },
    { label: 'Guest browsing (no login)', on: false },
    { label: 'Allow vendor-level coupons', on: false },
  ]);

  protected settingsState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');
  protected commissionValue = signal(0);
  protected warnThreshold = signal(0);
  protected pauseThreshold = signal(0);
  protected saving = signal(false);

  ngOnInit() {
    this.loadSettings();
  }

  protected toggle(i: number) {
    this.toggles.update((list) => list.map((t, idx) => (idx === i ? { ...t, on: !t.on } : t)));
  }

  protected roleBadgeClass(role: string) {
    return role === 'Super Admin' ? 'b-indigo' : role === 'Moderator' ? 'b-blue' : 'b-grey';
  }

  protected openInvite() {
    this.drawer.show('Invite team member', InviteFormComponent, {});
  }

  async loadSettings() {
    this.settingsState.set('loading');
    try {
      const data = await this.api.systemSettings();
      const s: MappedSystemSettings = mapSystemSettings(data as Dto);
      this.commissionValue.set(s.commissionValueOnOrder);
      this.warnThreshold.set(s.warnThresholdEgp);
      this.pauseThreshold.set(s.pauseThresholdEgp);
      this.settingsState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.settingsState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  protected async saveSettings() {
    if (this.pauseThreshold() < this.warnThreshold()) {
      this.toast.show('Pause threshold must be ≥ warn threshold');
      return;
    }
    this.saving.set(true);
    try {
      await this.api.updateSystemSettings({
        commissionValueOnOrder: this.commissionValue(),
        warnThresholdEgp: this.warnThreshold(),
        pauseThresholdEgp: this.pauseThreshold(),
      });
      this.toast.show('System settings saved ✓');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Save failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.saving.set(false);
    }
  }
}

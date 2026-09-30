import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { StateBlockComponent } from '../../shared/state-block.component';
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
  protected auth = inject(AuthService);
  /** "Ahmed (Owner)" → "Ahmed" so the avatar initials aren't "A(". */
  protected adminInitialsName = () => this.auth.adminName().replace(/\s*\(.*\)\s*$/, '');
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  /** Read-only: no backend stores these yet, so the page must not pretend to change them. */
  protected readonly policies: Toggle[] = [
    { label: 'Require admin approval before products go live', on: true },
    { label: 'Require admin approval for new vendors', on: true },
    { label: 'Cash on Delivery enabled', on: true },
    { label: 'Delivered by xStore — platform couriers collect COD (pilot)', on: true },
    { label: 'Online payment gateway (Paymob/Fawry)', on: false },
    { label: 'Guest browsing (no login)', on: false },
    { label: 'Allow vendor-level coupons', on: false },
  ];

  protected settingsState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');
  protected commissionValue = signal(0);
  protected warnThreshold = signal(0);
  protected pauseThreshold = signal(0);
  protected saving = signal(false);

  ngOnInit() {
    this.loadSettings();
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

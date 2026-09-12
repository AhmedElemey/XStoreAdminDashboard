import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoDataService } from '../../core/demo-data.service';
import { DrawerService } from '../../core/drawer.service';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { AvatarComponent } from '../../shared/avatar.component';
import { StateBlockComponent } from '../../shared/state-block.component';
import { InviteFormComponent } from './invite-form.component';
import { DEFAULT_MARKETPLACE_POLICIES, MappedSystemSettings, MarketplacePolicies, mapSystemSettings } from '../../core/mappers';
import { Dto } from '../../core/models';
import { ApiError } from '../../core/api-error';

interface Toggle {
  key: keyof MarketplacePolicies;
  label: string;
  on: boolean;
}

const POLICY_LABELS: Record<keyof MarketplacePolicies, string> = {
  requireProductApproval: 'Require admin approval before products go live',
  requireVendorApproval: 'Require admin approval for new vendors',
  cashOnDeliveryEnabled: 'Cash on Delivery enabled',
  xstoreCourierPilotEnabled: 'Delivered by xStore — platform couriers collect COD (pilot)',
  onlinePaymentEnabled: 'Online payment gateway (Paymob/Fawry)',
  guestBrowsingEnabled: 'Guest browsing (no login)',
  vendorCouponsEnabled: 'Allow vendor-level coupons',
};

function togglesFrom(policies: MarketplacePolicies): Toggle[] {
  return (Object.keys(POLICY_LABELS) as (keyof MarketplacePolicies)[]).map((key) => ({ key, label: POLICY_LABELS[key], on: policies[key] }));
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

  protected toggles = signal<Toggle[]>(togglesFrom(DEFAULT_MARKETPLACE_POLICIES));

  protected settingsState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');
  protected commissionValue = signal(0);
  protected warnThreshold = signal(0);
  protected pauseThreshold = signal(0);
  protected saving = signal(false);

  ngOnInit() {
    this.loadSettings();
  }

  /** Immediate persist on flip, mirroring Categories' visibility toggle — optimistic update,
   *  reverted if the save fails. */
  protected async toggle(i: number) {
    const t = this.toggles()[i];
    if (!t) return;
    if (this.settingsState() === 'loading') {
      this.toast.show('Still loading settings — try again in a moment');
      return;
    }
    this.toggles.update((list) => list.map((x, idx) => (idx === i ? { ...x, on: !x.on } : x)));
    try {
      await this.persistSettings();
      this.toast.show(t.label + ' — ' + (!t.on ? 'enabled' : 'disabled') + ' ✓');
    } catch (e) {
      this.toggles.update((list) => list.map((x, idx) => (idx === i ? { ...x, on: t.on } : x)));
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Save failed: ' + ((e as Error).message || 'error'));
    }
  }

  private policiesPayload(): MarketplacePolicies {
    const out = {} as MarketplacePolicies;
    for (const t of this.toggles()) out[t.key] = t.on;
    return out;
  }

  /** Sends the full settings object every time (commission + all 7 policies) since PUT is a
   *  full replace — omitting fields here would reset them server-side once the backend
   *  actually persists these keys. */
  private persistSettings() {
    return this.api.updateSystemSettings({
      commissionValueOnOrder: this.commissionValue(),
      warnThresholdEgp: this.warnThreshold(),
      pauseThresholdEgp: this.pauseThreshold(),
      ...this.policiesPayload(),
    });
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
      this.toggles.set(togglesFrom(s));
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
      await this.persistSettings();
      this.toast.show('System settings saved ✓');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Save failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.saving.set(false);
    }
  }
}

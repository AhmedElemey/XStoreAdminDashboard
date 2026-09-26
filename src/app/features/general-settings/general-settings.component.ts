import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { readPage, mapAppSetting } from '../../core/mappers';
import { Dto, MappedAppSetting } from '../../core/models';
import { APP_SETTING_TYPES } from '../../core/app-settings';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
import { PagerComponent } from '../../shared/pager.component';
import { ChipTabsComponent } from '../../shared/chip-tabs.component';
import { IconComponent } from '../../shared/icon.component';
import { SettingFormComponent, SettingFormValue } from './setting-form.component';

let searchTimer: ReturnType<typeof setTimeout>;

/** Remote app config: typed key/value pairs the mobile app reads from the public
 *  `GET /api/app-settings` (force-update flags, min app version, limits, feature lists…). */
@Component({
  selector: 'app-general-settings',
  imports: [
    StateBlockComponent,
    PagerComponent,
    ChipTabsComponent,
    IconComponent,
    SettingFormComponent,
  ],
  templateUrl: './general-settings.component.html',
})
export class GeneralSettingsComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  protected tabLabels = ['All', ...APP_SETTING_TYPES];
  protected dataType = signal('');
  protected keyword = signal('');
  protected page = signal(1);
  protected pageSize = 20;
  protected total = signal(0);
  protected totalPages = signal(1);
  protected items = signal<MappedAppSetting[]>([]);
  protected loadState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');

  /** null = closed; `{ initial: null }` = add; `{ initial: row }` = edit. */
  protected form = signal<{ initial: MappedAppSetting | null } | null>(null);
  protected deletingId = signal('');

  ngOnInit() {
    this.load();
  }

  protected selectTab(label: string) {
    this.dataType.set(label === 'All' ? '' : label);
    this.page.set(1);
    this.load();
  }

  protected onSearch(v: string) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      this.keyword.set(v.trim());
      this.page.set(1);
      this.load();
    }, 350);
  }

  protected gotoPage(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.page.set(p);
    this.load();
  }

  async load() {
    this.loadState.set('loading');
    try {
      const data = await this.api.appSettings({
        keyword: this.keyword() || undefined,
        dataType: this.dataType() || undefined,
        page: this.page(),
        pageSize: this.pageSize,
      });
      // Tolerate the Result envelope `{ isSuccess, data: { items, totalCount } }` too.
      const inner =
        data &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        (data as Dto)['data'] &&
        !Array.isArray((data as Dto)['data'])
          ? (data as Dto)['data']
          : data;
      const p = readPage<Dto>(inner, this.pageSize);
      this.items.set(p.items.map(mapAppSetting));
      this.total.set(p.total);
      this.totalPages.set(p.totalPages);
      this.loadState.set(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.loadState.set('error');
      this.errorMsg.set(e instanceof Error ? e.message : "General settings aren't available yet.");
    }
  }

  protected openAdd() {
    this.form.set({ initial: null });
  }

  protected openEdit(s: MappedAppSetting) {
    this.form.set({ initial: s });
  }

  protected existingKeys() {
    return this.items().map((s) => s.key);
  }

  /** Passed to the modal; throwing keeps the modal open and shows the server's message. */
  protected saveSetting = async (v: SettingFormValue) => {
    const editing = this.form()?.initial;
    const body = {
      key: v.key,
      dataType: v.dataType,
      value: v.value,
      description: v.description || undefined,
    };
    if (editing) {
      await this.api.updateAppSetting(editing.id, body);
      this.toast.show(`"${v.key}" updated ✓`);
    } else {
      await this.api.createAppSetting(body);
      this.toast.show(`"${v.key}" added ✓`);
    }
    this.load();
  };

  protected async remove(s: MappedAppSetting) {
    if (
      !confirm(
        `Delete "${s.key}"?\n\nMobile apps reading this key will fall back to their built-in default.`,
      )
    )
      return;
    this.deletingId.set(s.id);
    try {
      await this.api.deleteAppSetting(s.id);
      this.toast.show(`"${s.key}" deleted`);
      if (this.items().length === 1 && this.page() > 1) this.page.update((p) => p - 1);
      this.load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      this.toast.show('Delete failed: ' + ((e as Error).message || 'error'));
    } finally {
      this.deletingId.set('');
    }
  }

  protected typeBadge(t: string) {
    return t === 'Boolean'
      ? 'b-green'
      : t === 'Json'
        ? 'b-indigo'
        : t === 'String'
          ? 'b-grey'
          : 'b-blue';
  }
}

import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AdminApiService } from '../../core/admin-api.service';
import { ToastService } from '../../core/toast.service';
import { readAllPages, mapAppSetting } from '../../core/mappers';
import { Dto, MappedAppSetting } from '../../core/models';
import { APP_SETTING_TYPES } from '../../core/app-settings';
import { ApiError } from '../../core/api-error';
import { StateBlockComponent } from '../../shared/state-block.component';
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
    ChipTabsComponent,
    IconComponent,
    SettingFormComponent,
  ],
  templateUrl: './general-settings.component.html',
})
export class GeneralSettingsComponent implements OnInit, OnDestroy {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  protected tabLabels = ['All', ...APP_SETTING_TYPES];
  protected dataType = signal('');
  protected keyword = signal('');
  protected total = signal(0);
  /** More settings exist than one load fetches (readAllPages cap). */
  protected truncated = signal(false);
  protected items = signal<MappedAppSetting[]>([]);
  protected loadState = signal<'loading' | 'error' | null>('loading');
  protected errorMsg = signal('');
  /** Bumped on every load(); an answer for an older load is dropped, so a slow reply can't overwrite newer filters. */
  private loadSeq = 0;

  /** null = closed; `{ initial: null }` = add; `{ initial: row }` = edit. */
  protected form = signal<{ initial: MappedAppSetting | null } | null>(null);
  protected deletingId = signal('');

  ngOnDestroy() {
    clearTimeout(searchTimer);
  }

  ngOnInit() {
    this.load();
  }

  protected selectTab(label: string) {
    this.dataType.set(label === 'All' ? '' : label);
    this.load();
  }

  protected onSearch(v: string) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      this.keyword.set(v.trim());
      this.load();
    }, 350);
  }

  async load() {
    const seq = ++this.loadSeq;
    this.loadState.set('loading');
    try {
      // No pagination on this page: fetch every setting so the whole list shows at once.
      const all = await readAllPages<Dto>(async (page, pageSize) => {
        const data = await this.api.appSettings({
          search: this.keyword() || undefined,
          dataType: this.dataType() || undefined,
          page,
          pageSize,
        });
        // Tolerate the Result envelope `{ isSuccess, data: { items, totalCount } }` too.
        return data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          (data as Dto)['data'] &&
          !Array.isArray((data as Dto)['data'])
          ? (data as Dto)['data']
          : data;
      });
      if (seq !== this.loadSeq) return; // a newer load() has started; drop this stale answer
      this.items.set(all.items.map(mapAppSetting));
      this.total.set(all.total);
      this.truncated.set(all.truncated);
      this.loadState.set(null);
    } catch (e) {
      if (seq !== this.loadSeq) return;
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

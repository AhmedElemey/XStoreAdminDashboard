import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import {
  APP_SETTING_TYPES,
  AppSettingType,
  TYPE_HINT,
  defaultValue,
  normalizeValue,
  prettyJson,
  validateKey,
  validateValue,
} from '../../core/app-settings';
import { MappedAppSetting } from '../../core/models';

export interface SettingFormValue {
  key: string;
  dataType: AppSettingType;
  value: string;
  description: string;
}

/** Add / edit modal for one General Settings key. Key and data type are locked once a
 *  setting exists — the mobile app reads values by key and parses them by type, so
 *  changing either would silently break shipped app versions. */
@Component({
  selector: 'app-setting-form',
  templateUrl: './setting-form.component.html',
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class SettingFormComponent implements OnInit {
  initial = input<MappedAppSetting | null>(null);
  /** Keys already known on screen — a fast client-side duplicate check (the backend
   *  still enforces uniqueness with a 409). */
  existingKeys = input<string[]>([]);
  onSave = input.required<(v: SettingFormValue) => Promise<void>>();
  closed = output<void>();

  protected types = APP_SETTING_TYPES;
  protected editing = computed(() => !!this.initial());

  protected dataType = signal<AppSettingType | ''>('');
  protected key = signal('');
  protected value = signal('');
  protected description = signal('');
  protected submitted = signal(false);
  protected touched = signal<Record<string, boolean>>({});
  protected busy = signal(false);
  protected serverError = signal('');

  protected hint = computed(() => {
    const t = this.dataType();
    return t ? TYPE_HINT[t] : '';
  });
  protected typeError = computed(() => (this.dataType() ? null : 'Data type is required.'));
  protected keyError = computed(() => {
    if (this.editing()) return null;
    const err = validateKey(this.key());
    if (err) return err;
    const k = this.key().trim();
    return this.existingKeys().includes(k) ? `A setting with key "${k}" already exists.` : null;
  });
  protected valueError = computed(() => {
    const t = this.dataType();
    return t ? validateValue(t, this.value()) : null;
  });
  protected valid = computed(() => !this.typeError() && !this.keyError() && !this.valueError());

  ngOnInit() {
    const i = this.initial();
    if (i) {
      this.dataType.set(i.dataType);
      this.key.set(i.key);
      this.value.set(i.dataType === 'Json' ? prettyJson(i.value) : i.value);
      this.description.set(i.description);
    }
  }

  /** Show a field's error only after the admin has left it or tried to save. */
  protected show(field: string) {
    return this.submitted() || !!this.touched()[field];
  }
  protected touch(field: string) {
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  protected setType(t: string) {
    this.dataType.set(t as AppSettingType);
    this.value.set(defaultValue(t as AppSettingType));
    this.touch('dataType');
  }

  protected formatJson() {
    if (!validateValue('Json', this.value())) this.value.set(prettyJson(this.value()));
  }

  protected async save() {
    this.submitted.set(true);
    const t = this.dataType();
    if (!this.valid() || !t) return;
    this.busy.set(true);
    this.serverError.set('');
    try {
      await this.onSave()({
        key: this.key().trim(),
        dataType: t,
        value: normalizeValue(t, this.value()),
        description: this.description().trim(),
      });
      this.closed.emit();
    } catch (e) {
      this.serverError.set((e as Error).message || 'Save failed.');
    } finally {
      this.busy.set(false);
    }
  }
}

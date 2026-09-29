import { Component, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** From/to date-only range picker (native datepicker, no time) — matches the legacy .toolbar/.form-row markup.
 *  Owns its own draft values; only reports out via `rangeChange` when the caller
 *  hits Apply/Clear, so a list screen can debounce/reload exactly like it does
 *  for search and tabs. */
@Component({
  selector: 'app-date-range-filter',
  imports: [FormsModule],
  template: `
    <div class="toolbar drf">
      <div class="form-row drf-field">
        <label>From</label>
        <input type="date" [ngModel]="from()" (ngModelChange)="onFromChange($event)" name="drfFrom" [max]="to() || null" />
      </div>
      <div class="form-row drf-field">
        <label>To</label>
        <input type="date" [ngModel]="to()" (ngModelChange)="onToChange($event)" name="drfTo" [min]="from() || null" />
      </div>
      <button class="btn btn-p btn-sm" (click)="apply()" [disabled]="rangeInvalid()">Apply</button>
      @if (from() || to()) {
        <button class="btn btn-g btn-sm" (click)="clear()">Clear</button>
      }
      @if (error()) {
        <span style="font-size:12px;color:var(--error);font-weight:600">{{ error() }}</span>
      }
    </div>
  `,
})
export class DateRangeFilterComponent {
  protected from = signal('');
  protected to = signal('');
  protected error = signal('');
  rangeChange = output<{ from: string; to: string }>();

  protected rangeInvalid(): boolean {
    const f = this.from();
    const t = this.to();
    return !!f && !!t && f > t;
  }

  protected onFromChange(v: string) {
    this.from.set(v);
    if (!this.rangeInvalid()) this.error.set('');
  }

  protected onToChange(v: string) {
    this.to.set(v);
    if (!this.rangeInvalid()) this.error.set('');
  }

  protected apply() {
    if (this.rangeInvalid()) {
      this.error.set('From date must be earlier than To date.');
      return;
    }
    this.error.set('');
    this.rangeChange.emit({ from: this.from(), to: this.to() });
  }
  protected clear() {
    this.from.set('');
    this.to.set('');
    this.error.set('');
    this.rangeChange.emit({ from: '', to: '' });
  }
}

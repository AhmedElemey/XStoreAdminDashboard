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
        <input type="date" aria-label="From date" [ngModel]="from()" (ngModelChange)="from.set($event)" name="drfFrom" [max]="to() || null" />
      </div>
      <div class="form-row drf-field">
        <label>To</label>
        <input type="date" aria-label="To date" [ngModel]="to()" (ngModelChange)="to.set($event)" name="drfTo" [min]="from() || null" />
      </div>
      <button class="btn btn-p btn-sm" (click)="apply()" [disabled]="rangeInvalid()">Apply</button>
      @if (from() || to()) {
        <button class="btn btn-g btn-sm" (click)="clear()">Clear</button>
      }
      <!-- Shown as soon as the range is invalid: Apply is disabled then, so an error set only
           on Apply could never appear. -->
      @if (rangeInvalid()) {
        <span role="alert" style="font-size:12px;color:var(--error);font-weight:600">From date must be earlier than To date.</span>
      }
    </div>
  `,
})
export class DateRangeFilterComponent {
  protected from = signal('');
  protected to = signal('');
  rangeChange = output<{ from: string; to: string }>();

  protected rangeInvalid(): boolean {
    const f = this.from();
    const t = this.to();
    return !!f && !!t && f > t;
  }

  protected apply() {
    if (this.rangeInvalid()) return;
    this.rangeChange.emit({ from: this.from(), to: this.to() });
  }
  protected clear() {
    this.from.set('');
    this.to.set('');
    this.rangeChange.emit({ from: '', to: '' });
  }
}

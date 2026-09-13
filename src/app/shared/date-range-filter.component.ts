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
        <input type="date" [ngModel]="from()" (ngModelChange)="from.set($event)" name="drfFrom" />
      </div>
      <div class="form-row drf-field">
        <label>To</label>
        <input type="date" [ngModel]="to()" (ngModelChange)="to.set($event)" name="drfTo" />
      </div>
      <button class="btn btn-p btn-sm" (click)="apply()">Apply</button>
      @if (from() || to()) {
        <button class="btn btn-g btn-sm" (click)="clear()">Clear</button>
      }
    </div>
  `,
})
export class DateRangeFilterComponent {
  protected from = signal('');
  protected to = signal('');
  rangeChange = output<{ from: string; to: string }>();

  protected apply() {
    this.rangeChange.emit({ from: this.from(), to: this.to() });
  }
  protected clear() {
    this.from.set('');
    this.to.set('');
    this.rangeChange.emit({ from: '', to: '' });
  }
}

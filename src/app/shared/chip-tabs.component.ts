import { Component, input, output } from '@angular/core';

/** A row of status filter chips — matches the legacy .tabs/.chip markup. */
@Component({
  selector: 'app-chip-tabs',
  template: `
    <div class="tabs">
      @for (label of labels(); track label) {
        <span class="chip" [class.active]="label === active()" (click)="select.emit(label)">{{ label }}</span>
      }
    </div>
  `,
})
export class ChipTabsComponent {
  labels = input.required<string[]>();
  active = input.required<string>();
  select = output<string>();
}

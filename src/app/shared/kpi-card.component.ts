import { Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-kpi-card',
  imports: [IconComponent],
  template: `
    <div class="card kpi">
      <div class="k-top">
        <div class="k-ico" [style.background]="color() + '22'" [style.color]="color()">
          <app-icon [name]="icon()" />
        </div>
        @if (trend()) {
          <span class="trend" [class.up]="dir() === 'up'" [class.down]="dir() === 'down'">{{ trend() }}</span>
        }
      </div>
      <div class="k-val">{{ value() }}</div>
      <div class="k-label">{{ label() }}</div>
    </div>
  `,
})
export class KpiCardComponent {
  icon = input.required<string>();
  value = input.required<string>();
  label = input.required<string>();
  trend = input('');
  dir = input<'up' | 'down'>('up');
  color = input('#2E5C6E');
}

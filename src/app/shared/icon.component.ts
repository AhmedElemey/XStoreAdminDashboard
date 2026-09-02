import { Component, input } from '@angular/core';
import { ICON_PATHS } from '../core/icons';

@Component({
  selector: 'app-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path [attr.d]="path()" />
    </svg>
  `,
})
export class IconComponent {
  name = input.required<string>();
  protected path() {
    return ICON_PATHS[this.name()] ?? '';
  }
}

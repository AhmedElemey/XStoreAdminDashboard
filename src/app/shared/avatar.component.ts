import { Component, input } from '@angular/core';
import { avatarColor, initials } from '../core/format';

@Component({
  selector: 'app-avatar',
  template: `<span class="ua" [style.background]="color()" [style.border-radius]="round() ? '50%' : '9px'">{{ text() }}</span>`,
})
export class AvatarComponent {
  name = input.required<string>();
  round = input(false);
  protected color() {
    return avatarColor(this.name());
  }
  protected text() {
    return initials(this.name());
  }
}

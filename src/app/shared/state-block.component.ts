import { Component, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

/** Loading / empty / error placeholder — matches the legacy .state block. */
@Component({
  selector: 'app-state-block',
  imports: [IconComponent],
  template: `
    @switch (kind()) {
      @case ('loading') {
        <div class="state"><span class="spin"></span><b>{{ message() || 'Loading…' }}</b></div>
      }
      @case ('empty') {
        <div class="state">
          <app-icon name="users" />
          <b>Nothing to show</b>
          <span>{{ message() || 'No records found.' }}</span>
        </div>
      }
      @case ('error') {
        <div class="state">
          <app-icon name="alert" />
          <b>Couldn't load data</b>
          <span>{{ message() || 'Something went wrong.' }}</span>
          <div style="margin-top:14px">
            <button class="btn btn-p btn-sm" (click)="retry.emit()">Retry</button>
          </div>
        </div>
      }
    }
  `,
})
export class StateBlockComponent {
  kind = input.required<'loading' | 'empty' | 'error'>();
  message = input('');
  retry = output<void>();
}

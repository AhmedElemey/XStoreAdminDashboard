import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { DrawerService } from '../core/drawer.service';

/** Renders whatever drawer content component the active feature registered via
 *  DrawerService.show() — the Angular-native replacement for the legacy openDrawer(html). */
@Component({
  selector: 'app-drawer-host',
  imports: [NgComponentOutlet],
  template: `
    <div class="overlay" [class.show]="drawer.open()" (click)="drawer.close()"></div>
    <aside class="drawer" [class.show]="drawer.open()">
      @if (drawer.open()) {
        <div class="d-head">
          <b style="font-size:16px">{{ drawer.state().title }}</b>
          <div class="d-close" (click)="drawer.close()">✕</div>
        </div>
        <div class="d-body">
          @if (drawer.state().component) {
            <ng-container *ngComponentOutlet="drawer.state().component!; inputs: drawer.state().inputs" />
          }
        </div>
      }
    </aside>
  `,
})
export class DrawerHostComponent {
  protected drawer = inject(DrawerService);
}

import { Injectable, Type, signal } from '@angular/core';

export interface DrawerState {
  title: string;
  component: Type<unknown> | null;
  inputs: Record<string, unknown>;
}

/** Generic right-hand detail drawer, rendered once in the app shell via NgComponentOutlet.
 *  Any feature can open it with a small presentational component + inputs — mirrors the
 *  legacy openDrawer(title, html, actions) but Angular-native (typed components, not innerHTML). */
@Injectable({ providedIn: 'root' })
export class DrawerService {
  readonly state = signal<DrawerState>({ title: '', component: null, inputs: {} });
  readonly open = signal(false);

  show(title: string, component: Type<unknown>, inputs: Record<string, unknown> = {}) {
    this.state.set({ title, component, inputs });
    this.open.set(true);
  }

  close() {
    this.open.set(false);
  }
}

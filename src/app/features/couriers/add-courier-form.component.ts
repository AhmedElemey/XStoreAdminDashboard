import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoDataService } from '../../core/demo-data.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';

@Component({
  selector: 'app-add-courier-form',
  imports: [FormsModule],
  templateUrl: './add-courier-form.component.html',
})
export class AddCourierFormComponent {
  private demo = inject(DemoDataService);
  private toast = inject(ToastService);
  protected drawer = inject(DrawerService);

  protected name = signal('');
  protected phone = signal('');
  protected zone = signal('');
  protected busy = signal(false);

  protected async submit() {
    if (!this.name().trim() || !this.phone().trim() || !this.zone().trim()) {
      this.toast.show('Please fill in all fields');
      return;
    }
    this.busy.set(true);
    try {
      await this.demo.addCourier(this.name().trim(), this.phone().trim(), this.zone().trim());
      this.toast.show(`Courier "${this.name().trim()}" created ✓ — share the login with them`);
      this.drawer.close();
    } catch (e) {
      this.toast.show((e as Error).message || 'Create failed');
    } finally {
      this.busy.set(false);
    }
  }
}

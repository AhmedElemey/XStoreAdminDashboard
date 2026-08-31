import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoDataService } from '../../core/demo-data.service';
import { ToastService } from '../../core/toast.service';
import { DrawerService } from '../../core/drawer.service';

const ROLE_DESC: Record<string, string> = {
  'Super Admin': 'Full access',
  Moderator: 'Orders + disputes',
  Viewer: 'Read-only reports',
};

@Component({
  selector: 'app-invite-form',
  imports: [FormsModule],
  templateUrl: './invite-form.component.html',
})
export class InviteFormComponent {
  private demo = inject(DemoDataService);
  private toast = inject(ToastService);
  protected drawer = inject(DrawerService);

  protected name = signal('');
  protected email = signal('');
  protected role = signal('Super Admin');

  protected submit() {
    if (!this.name().trim() || !this.email().trim()) {
      this.toast.show('Please fill in: Full name');
      return;
    }
    this.demo.team.update((list) => [...list, [this.name().trim(), this.role(), ROLE_DESC[this.role()] || '']]);
    this.toast.show('Invite sent to ' + this.email().trim() + ' ✓');
    this.drawer.close();
  }
}

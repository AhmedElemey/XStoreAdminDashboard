import { Component, inject, input } from '@angular/core';
import { MappedUser } from '../../core/models';
import { DrawerService } from '../../core/drawer.service';

@Component({
  selector: 'app-user-drawer',
  templateUrl: './user-drawer.component.html',
})
export class UserDrawerComponent {
  user = input.required<MappedUser>();
  protected drawer = inject(DrawerService);
}

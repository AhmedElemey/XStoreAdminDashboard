import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { ApiError } from '../core/api-error';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  protected phone = signal('');
  protected password = signal('');
  protected error = signal('');
  protected busy = signal(false);
  protected showBaseRow = signal(false);
  protected base = signal(this.auth.base);

  protected toggleBaseRow() {
    this.showBaseRow.update((v) => !v);
  }

  /** The page the admin was sent here from. Only an in-app path is followed — never another
   *  origin (`//evil.test`, `https://…`), so a crafted link can't redirect off the dashboard. */
  private safeReturnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl') || '';
    return url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login') ? url : '/overview';
  }

  async submit() {
    this.error.set('');
    if (this.base().trim()) this.auth.base = this.base().trim();
    if (!this.phone().trim() || !this.password()) {
      this.error.set('Enter your phone number and password.');
      return;
    }
    this.busy.set(true);
    try {
      await this.auth.login(this.phone().trim(), this.password());
      this.toast.show('Signed in ✓');
      this.router.navigateByUrl(this.safeReturnUrl());
    } catch (e) {
      this.error.set(e instanceof ApiError ? e.message : 'Sign in failed.');
    } finally {
      this.busy.set(false);
    }
  }
}

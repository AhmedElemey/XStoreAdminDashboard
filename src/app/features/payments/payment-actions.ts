import { AdminApiService } from '../../core/admin-api.service';
import { DrawerService } from '../../core/drawer.service';
import { ToastService } from '../../core/toast.service';
import { MappedCommissionPayment } from '../../core/models';
import { egp } from '../../core/format';
import { ApiError } from '../../core/api-error';

export interface PaymentActionDeps {
  api: AdminApiService;
  toast: ToastService;
  drawer: DrawerService;
  /** Called after a decision lands (or a 409 shows it was already decided) so the opener can reload. */
  onDone: () => void;
}

/** Returns true on success so the drawer knows whether to keep its form state. */
export async function approvePayment(
  d: PaymentActionDeps,
  p: MappedCommissionPayment,
): Promise<boolean> {
  try {
    await d.api.approveCommissionPayment(p.id, p.amount > 0 ? p.amount : undefined);
    d.toast.show(`Approved — ${egp(p.amount)} deducted from ${p.vendorName}'s balance ✓`);
    d.drawer.close();
    d.onDone();
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return false;
    d.toast.show(`Approve failed: ${(e as Error).message || 'error'}`);
    if (e instanceof ApiError && e.status === 409) {
      // Someone else already reviewed it: show the real status instead of a stale Pending row.
      d.drawer.close();
      d.onDone();
    }
    return false;
  }
}

export async function rejectPayment(
  d: PaymentActionDeps,
  p: MappedCommissionPayment,
  reason: string,
): Promise<boolean> {
  try {
    await d.api.rejectCommissionPayment(p.id, reason);
    d.toast.show('Payment rejected — vendor notified');
    d.drawer.close();
    d.onDone();
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return false;
    d.toast.show(`Reject failed: ${(e as Error).message || 'error'}`);
    if (e instanceof ApiError && e.status === 409) {
      d.drawer.close();
      d.onDone();
    }
    return false;
  }
}

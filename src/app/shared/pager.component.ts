import { Component, input, output } from '@angular/core';

/** Pagination footer — matches the legacy pager() helper. */
@Component({
  selector: 'app-pager',
  template: `
    <div class="pager">
      <span>{{ from() }}–{{ to() }} of {{ total().toLocaleString('en-US') }}</span>
      <div class="pg-btns">
        <button class="btn btn-g btn-sm" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)">← Prev</button>
        <span>Page {{ page() }} / {{ Math.max(1, totalPages()) }}</span>
        <button class="btn btn-g btn-sm" [disabled]="page() >= totalPages()" (click)="pageChange.emit(page() + 1)">Next →</button>
      </div>
    </div>
  `,
})
export class PagerComponent {
  page = input.required<number>();
  totalPages = input.required<number>();
  total = input.required<number>();
  pageSize = input.required<number>();
  pageChange = output<number>();
  protected Math = Math;
  protected from() {
    return this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1;
  }
  protected to() {
    return Math.min(this.page() * this.pageSize(), this.total());
  }
}

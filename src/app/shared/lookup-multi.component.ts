import { Component, ElementRef, OnDestroy, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface LookupItem {
  id: string;
  name: string;
}

let lookupTimer: ReturnType<typeof setTimeout>;

/** Debounced multi-select autocomplete. `load(search)` returns the candidate list
 *  (backend-filtered by the optional search term + isActive). Selected ids are
 *  emitted via `selectedChange`; pass them back as `selected` on open to prefill. */
@Component({
  selector: 'app-lookup-multi',
  imports: [FormsModule],
  template: `
    <div style="position:relative">
      <div
        style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 12px;border:1px solid var(--line);border-radius:9px;background:#fff;cursor:text"
        (click)="focusInput()"
      >
        @for (c of chosen(); track c.id) {
          <span class="chip active" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;font-size:12.5px;border-radius:16px">
            {{ c.name }}
            <b style="cursor:pointer;font-size:12px" (click)="$event.stopPropagation(); toggle(c)">✕</b>
          </span>
        }
        <input
          #inp
          style="border:none;outline:none;flex:1;min-width:140px;padding:2px;font-size:13.5px;font-family:inherit"
          [ngModel]="query()"
          (ngModelChange)="onQuery($event)"
          (focus)="onFocus()"
          (keydown.escape)="open.set(false)"
          placeholder="{{ placeholder() }}"
        />
      </div>

      @if (open()) {
        <div style="position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:70;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);max-height:220px;overflow:auto">
          @if (loading()) {
            <div class="muted" style="padding:10px 12px;font-size:12.5px">Loading…</div>
          } @else if (searchFailed()) {
            <div class="muted" style="padding:10px 12px;font-size:12.5px">Couldn't load options.</div>
          } @else if (!results().length) {
            <div class="muted" style="padding:10px 12px;font-size:12.5px">No matches for “{{ query() }}”.</div>
          } @else if (!visible().length) {
            <div class="muted" style="padding:10px 12px;font-size:12.5px">All matches are already selected.</div>
          } @else {
            @for (r of visible(); track r.id) {
              <div
                style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;cursor:pointer;font-size:13px"
                [style.background]="isChosen(r.id) ? 'var(--primary)' : ''"
                [style.color]="isChosen(r.id) ? '#fff' : ''"
                (click)="toggle(r)"
              >
                <span>{{ r.name }}</span>
                <small [style.opacity]="isChosen(r.id) ? 0.8 : 0.55">{{ r.id }}</small>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
})
export class LookupMultiComponent implements OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private inp = viewChild<ElementRef<HTMLInputElement>>('inp');

  load = input.required<(search: string) => Promise<LookupItem[]>>();
  placeholder = input('Select…');
  selected = input<string[]>([]);
  selectedChange = output<string[]>();

  protected query = signal('');
  protected open = signal(false);
  protected loading = signal(false);
  protected searchFailed = signal(false);
  protected results = signal<LookupItem[]>([]);
  protected chosen = signal<LookupItem[]>([]);

  protected visible = computed(() => {
    const ids = new Set(this.chosen().map((c) => c.id));
    return this.results().filter((r) => !ids.has(r.id));
  });

  private resolved = new Set<string>();

  constructor() {
    effect(() => {
      const ids = this.selected();
      const have = new Set(this.chosen().map((c) => c.id));
      const missing = ids.filter((id) => id != null && String(id) !== '' && !have.has(String(id)) && !this.resolved.has(String(id)));
      if (!missing.length) return;
      missing.forEach((id) => this.resolved.add(String(id)));
      Promise.all(missing.map((id) => this.load()(String(id)).then((list) => list.find((x) => x.id === String(id)) || list[0])))
        .then((found) => {
          const items = found.filter((x): x is LookupItem => !!x && !have.has(x.id));
          if (items.length) this.chosen.update((c) => [...c, ...items]);
        })
        .catch(() => {});
    });
    document.addEventListener('click', this.onDocClick);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocClick);
  }

  private onDocClick = (e: MouseEvent) => {
    if (!this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  };

  protected focusInput() {
    this.inp()?.nativeElement.focus();
  }

  protected onQuery(v: string) {
    this.query.set(v);
    clearTimeout(lookupTimer);
    lookupTimer = setTimeout(() => this.fetch(v.trim()), 250);
  }

  protected onFocus() {
    this.open.set(true);
    if (!this.results().length) this.fetch(this.query().trim());
  }

  private async fetch(q: string) {
    this.loading.set(true);
    this.searchFailed.set(false);
    try {
      const list = await this.load()(q);
      this.results.set(list || []);
    } catch {
      this.searchFailed.set(true);
      this.results.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  protected isChosen(id: string) {
    return this.chosen().some((c) => c.id === id);
  }

  protected toggle(item: LookupItem) {
    const next = this.isChosen(item.id) ? this.chosen().filter((c) => c.id !== item.id) : [...this.chosen(), item];
    this.chosen.set(next);
    this.selectedChange.emit(next.map((c) => c.id));
    this.query.set('');
    this.fetch('');
  }
}
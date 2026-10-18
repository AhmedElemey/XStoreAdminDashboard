import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { ImageService } from '../core/image.service';
import { ToastService } from '../core/toast.service';
import {
  FieldView,
  cellText,
  classify,
  collectImageUrls,
  humanize,
  matchesFilter,
  safeJson,
} from './field-tree.util';

/** One row / group of the tree. Recursive: object and list values render nested app-field-node's. */
@Component({
  selector: 'app-field-node',
  imports: [],
  template: `
    @if (visible()) {
      @let c = view();
      @if (c.kind === 'object' || c.kind === 'list') {
        <details class="ft-det" [open]="isOpen()" (toggle)="onToggle($event)">
          <summary>
            <span [attr.title]="name()">{{ label() }}</span>
            <span class="muted" style="margin-left: 4px"
              >({{
                c.kind === 'object' ? c.entries.length + ' fields' : c.items.length + ' items'
              }})</span
            >
          </summary>
          <div class="ft-group">
            @if (c.kind === 'object') {
              @for (e of c.entries; track e[0]) {
                <app-field-node
                  [name]="e[0]"
                  [value]="e[1]"
                  [depth]="depth() + 1"
                  [apiBase]="apiBase()"
                  [images]="images()"
                  [filter]="childFilter()"
                  [cmd]="cmd()"
                />
              }
            } @else {
              @for (it of c.items; track $index) {
                <app-field-node
                  [name]="name()"
                  [labelOverride]="'Item ' + ($index + 1)"
                  [value]="it"
                  [depth]="depth() + 1"
                  [apiBase]="apiBase()"
                  [images]="images()"
                  [filter]="childFilter()"
                  [cmd]="cmd()"
                />
              }
            }
          </div>
        </details>
      } @else {
        <dl class="ft-row">
          <dt [attr.title]="name()">{{ label() }}</dt>
          <dd>
            @switch (c.kind) {
              @case ('empty') {
                <span class="muted">{{ c.text }}</span>
              }
              @case ('bool') {
                <span [class]="'badge-s ' + c.badge">{{ c.text }}</span>
              }
              @case ('status') {
                <span [class]="'badge-s ' + c.badge">{{ c.text }}</span>
              }
              @case ('date') {
                <span [attr.title]="c.title">{{ c.text }}</span>
              }
              @case ('image') {
                <a class="ft-thumb" [href]="c.url" target="_blank" rel="noopener noreferrer">
                  <img [src]="imgSrc(c.url)" [alt]="label()" loading="lazy" />
                </a>
              }
              @case ('images') {
                <span class="ft-thumbs">
                  @for (u of c.urls; track $index) {
                    <a class="ft-thumb" [href]="u" target="_blank" rel="noopener noreferrer">
                      <img [src]="imgSrc(u)" [alt]="label() + ' ' + ($index + 1)" loading="lazy" />
                    </a>
                  }
                </span>
              }
              @case ('link') {
                <a
                  class="ft-link"
                  [href]="c.url"
                  [attr.title]="c.title"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ c.text }} ↗</a
                >
              }
              @case ('chips') {
                <span class="ft-chips">
                  @for (ch of c.chips; track $index) {
                    <span class="badge-s b-grey">{{ ch }}</span>
                  }
                  @if (c.moreChips) {
                    <span class="muted">+{{ c.moreChips }} more</span>
                  }
                </span>
              }
              @case ('table') {
                <div class="ft-table">
                  <table>
                    <thead>
                      <tr>
                        @for (col of c.columns; track col) {
                          <th scope="col">{{ humanize(col) }}</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (r of c.rows; track $index) {
                        <tr>
                          @for (col of c.columns; track col) {
                            <td>{{ cell(r[col], col) }}</td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
              @case ('deep') {
                <pre class="ft-pre">{{ c.text }}</pre>
              }
              @default {
                <span
                  class="ft-text"
                  [class.ft-block]="c.block"
                  [attr.dir]="c.rtl ? 'rtl' : null"
                  [attr.lang]="c.rtl ? 'ar' : null"
                  >{{ c.text }}</span
                >
              }
            }
          </dd>
        </dl>
      }
    }
  `,
})
export class FieldNodeComponent {
  name = input('');
  labelOverride = input('');
  value = input<unknown>(null);
  depth = input(0);
  apiBase = input('');
  images = input<Record<string, string>>({});
  filter = input('');
  /** Expand/collapse-all command from the root: `n` changes on every click. */
  cmd = input<{ open: boolean; n: number }>({ open: true, n: 0 });

  protected humanize = humanize;
  private localOpen = signal(true);

  protected label = computed(() => this.labelOverride() || humanize(this.name()) || '—');
  protected view = computed<FieldView>(() =>
    classify(this.value(), this.name(), this.apiBase(), this.depth()),
  );
  private keyMatches = computed(() => {
    const q = this.filter().trim();
    const n = this.name();
    return (
      !!q &&
      !!n &&
      (n.toLowerCase().includes(q.toLowerCase()) ||
        humanize(n).toLowerCase().includes(q.toLowerCase()))
    );
  });
  protected visible = computed(
    () => !this.filter().trim() || matchesFilter(this.name(), this.value(), this.filter()),
  );
  /** A group whose own name matched shows all its children. */
  protected childFilter = computed(() => (this.keyMatches() ? '' : this.filter()));
  protected isOpen = computed(() => this.localOpen() || !!this.filter().trim());

  constructor() {
    effect(() => {
      const c = this.cmd();
      untracked(() => this.localOpen.set(c.open));
    });
  }

  protected onToggle(e: Event) {
    this.localOpen.set((e.target as HTMLDetailsElement).open);
  }

  protected imgSrc(url: string): string {
    return this.images()[url] || url;
  }

  protected cell(v: unknown, key: string): string {
    return cellText(v, key);
  }
}

/** Reusable "show everything the backend sent" tree with filter, copy-JSON and raw JSON view. */
@Component({
  selector: 'app-field-tree',
  imports: [FieldNodeComponent],
  template: `
    <div class="card">
      <div class="c-head">
        <h3>{{ title() }}</h3>
        <div class="ft-tools">
          <input
            type="search"
            placeholder="Filter fields…"
            aria-label="Filter fields"
            [value]="filter()"
            (input)="filter.set($any($event.target).value)"
          />
          <button type="button" class="btn btn-g btn-sm" (click)="copyJson()">
            {{ copied() ? 'Copied ✓' : 'Copy JSON' }}
          </button>
          <button
            type="button"
            class="btn btn-g btn-sm"
            (click)="toggleAll()"
            [attr.aria-label]="allOpen() ? 'Collapse all groups' : 'Expand all groups'"
          >
            {{ allOpen() ? 'Collapse all' : 'Expand all' }}
          </button>
          <span class="sr-only" aria-live="polite">{{ copied() ? 'JSON copied' : '' }}</span>
        </div>
      </div>
      <div class="c-body">
        @if (hasData()) {
          <div class="ft-list">
            @if (entries().length) {
              @for (e of entries(); track e[0]) {
                <app-field-node
                  [name]="e[0]"
                  [value]="e[1]"
                  [apiBase]="apiBase()"
                  [images]="resolved()"
                  [filter]="filter()"
                  [cmd]="cmd()"
                />
              }
            } @else {
              <app-field-node
                name="value"
                [value]="data()"
                [apiBase]="apiBase()"
                [images]="resolved()"
                [filter]="filter()"
                [cmd]="cmd()"
              />
            }
          </div>
          <details class="ft-raw">
            <summary>Raw JSON</summary>
            <pre>{{ json() }}</pre>
          </details>
        } @else {
          <p class="muted" style="font-size:13px">No data.</p>
        }
      </div>
    </div>
  `,
})
export class FieldTreeComponent {
  private images = inject(ImageService);
  private toast = inject(ToastService);

  data = input.required<unknown>();
  title = input('All backend fields');
  collapsedByDefault = input(false);
  apiBase = input('');

  protected filter = signal('');
  protected copied = signal(false);
  protected resolved = signal<Record<string, string>>({});
  protected cmd = signal<{ open: boolean; n: number }>({ open: true, n: 0 });
  protected allOpen = computed(() => this.cmd().open);

  protected hasData = computed(() => {
    const d = this.data();
    return (
      d !== null && d !== undefined && !(typeof d === 'object' && !Object.keys(d as object).length)
    );
  });
  protected entries = computed<[string, unknown][]>(() => {
    const d = this.data();
    return d && typeof d === 'object' && !Array.isArray(d) ? Object.entries(d) : [];
  });
  protected json = computed(() => safeJson(this.data(), 2));

  private copyTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const collapsed = this.collapsedByDefault();
      untracked(() => this.cmd.set({ open: !collapsed, n: 0 }));
    });
    effect(() => {
      const urls = [...new Set(collectImageUrls(this.data(), this.apiBase()))].slice(0, 60);
      for (const u of urls) {
        this.images.resolve(u).then((r) => {
          if (r && r !== u) this.resolved.update((m) => ({ ...m, [u]: r }));
        });
      }
    });
  }

  protected toggleAll() {
    this.cmd.update((c) => ({ open: !c.open, n: c.n + 1 }));
  }

  protected async copyJson() {
    const text = safeJson(this.data(), 2);
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
    }
    this.toast.show(ok ? 'JSON copied' : 'Copy failed — select the Raw JSON text instead');
    if (ok) {
      this.copied.set(true);
      clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.copied.set(false), 1500);
    }
  }
}

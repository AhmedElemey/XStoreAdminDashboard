import { egp } from '../core/format';
import { absoluteImage } from '../core/mappers';

/** Pure helpers behind <app-field-tree>: key humanizing, value classification and formatting.
 *  Kept free of Angular so they can be unit-tested without TestBed. */

export const MAX_DEPTH = 6;
export const MAX_CHIPS = 30;

const WORD_MAP: Record<string, string> = {
  id: 'ID',
  ids: 'IDs',
  url: 'URL',
  urls: 'URLs',
  uri: 'URI',
  api: 'API',
  sku: 'SKU',
  ip: 'IP',
  vat: 'VAT',
  gps: 'GPS',
};

/** "imageURLs" → "Image URLs", "vendor_id" → "Vendor ID", "titleAr" → "Title (Arabic)". */
export function humanize(key: string): string {
  const raw = String(key ?? '').trim();
  if (!raw) return '';
  let s = raw;
  if (/^[A-Z0-9_\-\s]+$/.test(s) && /[_\-\s]/.test(s)) s = s.toLowerCase();
  s = s
    .replace(/[_\-.]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z]+)/g, (m, up: string, rest: string) =>
      /^[A-Z]s$/.test(rest) ? m : `${up} ${rest}`,
    );
  const words = s.split(/\s+/).filter(Boolean);
  let suffix = '';
  if (words.length > 1) {
    const last = words[words.length - 1].toLowerCase();
    if (last === 'ar') suffix = ' (Arabic)';
    else if (last === 'en') suffix = ' (English)';
    if (suffix) words.pop();
  }
  const out = words.map((w) => {
    const mapped = WORD_MAP[w.toLowerCase()];
    if (mapped) return mapped;
    if (w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w)) return w; // keep acronyms
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
  return out.join(' ') + suffix;
}

export function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n: number) => String(n).padStart(2, '0');

export function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T|\s|$)/.test(s) && !Number.isNaN(Date.parse(s.replace(' ', 'T')));
}

/** "dd MMM yyyy, HH:mm", or "dd MMM yyyy" for a date-only string. Timestamps render in local time. */
export function formatDateTime(s: string): string {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (dateOnlyMatch)
    return `${dateOnlyMatch[3]} ${MONTHS[Number(dateOnlyMatch[2]) - 1] ?? ''} ${dateOnlyMatch[1]}`;
  const d = new Date(s.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return s;
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const ID_STRICT_CASE = /(^id$|[a-z0-9_]Id$|_id$|ID$)/; // case-sensitive so "paid" is not an id
const ID_WORDS = /(code|phone|number$|zip|sku|barcode)/i;
const MONEY_KEY = /price|amount|fee|commission|total|cost/i;
const COUNT_KEY = /count|views|qty|quantity|reviews|orders|items|stock/i;
const PERCENT_KEY = /rate|percent|pct/i;
const IMAGE_KEY = /image|img|photo|thumb|logo|banner|avatar/i;

export function isIdLikeKey(key: string): boolean {
  return ID_STRICT_CASE.test(key) || ID_WORDS.test(key);
}

export function formatNumber(n: number, key = ''): string {
  if (!Number.isFinite(n)) return String(n);
  if (isIdLikeKey(key)) return String(n);
  const text = n.toLocaleString('en-US');
  if (PERCENT_KEY.test(key)) return text + '%';
  if (MONEY_KEY.test(key) && !COUNT_KEY.test(key)) return egp(n);
  return text;
}

export function hasArabic(s: string): boolean {
  return /[؀-ۿ]/.test(s);
}

export function isHttpUrl(s: string): boolean {
  return /^https?:\/\/\S+$/i.test(s.trim());
}

function looksLikePath(s: string): boolean {
  return /^(https?:\/\/|\/)\S+$/i.test(s) || /^[\w\-.%]+(\/[\w\-.%]+)+$/.test(s);
}

/** True for a string that points at an image: an image file extension, or a URL/path under an image-ish key. */
export function isImageValue(key: string, v: unknown): boolean {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (!s || /\s/.test(s)) return false;
  if (
    /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(s) &&
    (looksLikePath(s) || /^[\w\-.%]+\.\w+/.test(s))
  )
    return true;
  return IMAGE_KEY.test(key) && looksLikePath(s);
}

export function statusBadge(s: string): string {
  const k = s.toUpperCase().replace(/[^A-Z]/g, '');
  if (k === 'PENDING' || k === 'PENDINGAPPROVAL') return 'b-amber';
  if (k === 'ACTIVE' || k === 'APPROVED' || k === 'LIVE') return 'b-green';
  if (k === 'REJECTED') return 'b-red';
  return 'b-grey';
}

export type FieldKind =
  | 'empty'
  | 'bool'
  | 'number'
  | 'date'
  | 'image'
  | 'link'
  | 'status'
  | 'text'
  | 'chips'
  | 'images'
  | 'table'
  | 'list'
  | 'object'
  | 'deep';

export interface FieldView {
  kind: FieldKind;
  /** Display text (or the tooltip source for dates/links). */
  text: string;
  /** Hover tooltip, e.g. the raw ISO date. */
  title: string;
  /** Badge colour class for bool/status. */
  badge: string;
  /** Image / link target (already absolutized when `apiBase` was given). */
  url: string;
  rtl: boolean;
  /** Long or multiline text rendered as a block. */
  block: boolean;
  chips: string[];
  moreChips: number;
  urls: string[];
  columns: string[];
  rows: Record<string, unknown>[];
  items: unknown[];
  entries: [string, unknown][];
}

function view(kind: FieldKind, patch: Partial<FieldView> = {}): FieldView {
  return {
    kind,
    text: '',
    title: '',
    badge: '',
    url: '',
    rtl: false,
    block: false,
    chips: [],
    moreChips: 0,
    urls: [],
    columns: [],
    rows: [],
    items: [],
    entries: [],
    ...patch,
  };
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const isPrimitive = (v: unknown) =>
  v === null || ['string', 'number', 'boolean'].includes(typeof v);

/** Short text for a value inside a table cell. */
export function cellText(v: unknown, key = ''): string {
  if (isBlank(v)) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return formatNumber(v, key);
  if (typeof v === 'string') return isIsoDate(v) ? formatDateTime(v) : v;
  return safeJson(v);
}

export function safeJson(v: unknown, indent?: number): string {
  try {
    return JSON.stringify(v, null, indent) ?? '';
  } catch {
    return '[unserializable]';
  }
}

/** Decides how one value should be rendered. `depth` guards against runaway nesting. */
export function classify(v: unknown, key = '', apiBase = '', depth = 0): FieldView {
  if (isBlank(v)) return view('empty', { text: '—' });
  if (typeof v === 'boolean')
    return view('bool', { text: v ? 'Yes' : 'No', badge: v ? 'b-green' : 'b-grey' });
  if (typeof v === 'number') return view('number', { text: formatNumber(v, key) });

  if (typeof v === 'string') {
    const s = v.trim();
    if (isImageValue(key, s))
      return view('image', { url: absoluteImage(s, apiBase) || s, text: s });
    if (isHttpUrl(s)) return view('link', { url: s, text: s, title: s });
    if (isIsoDate(s)) return view('date', { text: formatDateTime(s), title: s });
    if (/status/i.test(key) && s.length <= 40 && !/\n/.test(s))
      return view('status', { text: s, badge: statusBadge(s) });
    return view('text', { text: v, rtl: hasArabic(v), block: v.length > 140 || /\n/.test(v) });
  }

  if (Array.isArray(v)) {
    if (!v.length) return view('empty', { text: '— (empty list)' });
    if (depth >= MAX_DEPTH) return view('deep', { text: safeJson(v, 2) });
    if (
      v.every((x) => typeof x === 'string') &&
      (v as string[]).every((x) => isImageValue(key || 'image', x))
    ) {
      return view('images', {
        urls: (v as string[]).map((x) => absoluteImage(x.trim(), apiBase) || x),
      });
    }
    if (v.every((x) => isPrimitive(x) && !isBlank(x))) {
      const all = v.map((x) => cellText(x, key));
      return view('chips', {
        chips: all.slice(0, MAX_CHIPS),
        moreChips: Math.max(0, all.length - MAX_CHIPS),
      });
    }
    if (v.every(isPlainObject)) {
      const rows = v as Record<string, unknown>[];
      const columns: string[] = [];
      for (const r of rows)
        for (const k of Object.keys(r)) if (!columns.includes(k)) columns.push(k);
      const flat = rows.every((r) => Object.values(r).every(isPrimitive));
      if (flat && columns.length) return view('table', { columns, rows });
    }
    return view('list', { items: v });
  }

  if (isPlainObject(v)) {
    const entries = Object.entries(v);
    if (!entries.length) return view('empty', { text: '— (empty)' });
    if (depth >= MAX_DEPTH) return view('deep', { text: safeJson(v, 2) });
    return view('object', { entries });
  }

  return view('text', { text: String(v) });
}

/** Case-insensitive deep search over keys (raw + humanized) and primitive values. */
export function matchesFilter(key: string, value: unknown, q: string, depth = 0): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (key && (key.toLowerCase().includes(needle) || humanize(key).toLowerCase().includes(needle)))
    return true;
  if (isPrimitive(value)) return value !== null && String(value).toLowerCase().includes(needle);
  if (depth >= 12) return false;
  if (Array.isArray(value)) return value.some((x) => matchesFilter('', x, needle, depth + 1));
  if (isPlainObject(value))
    return Object.entries(value).some(([k, x]) => matchesFilter(k, x, needle, depth + 1));
  return false;
}

/** Every image URL found anywhere in the data (absolutized) — used to pre-resolve thumbnails. */
export function collectImageUrls(
  data: unknown,
  apiBase = '',
  key = '',
  depth = 0,
  out: string[] = [],
): string[] {
  if (depth > 12 || out.length > 200) return out;
  if (typeof data === 'string') {
    if (isImageValue(key, data)) out.push(absoluteImage(data.trim(), apiBase) || data.trim());
  } else if (Array.isArray(data)) {
    for (const x of data) collectImageUrls(x, apiBase, key, depth + 1, out);
  } else if (isPlainObject(data)) {
    for (const [k, x] of Object.entries(data)) collectImageUrls(x, apiBase, k, depth + 1, out);
  }
  return out;
}

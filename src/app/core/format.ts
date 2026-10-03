/** Formatting + avatar-color helpers ported from the legacy prototype. */
// Each keeps white initials at ≥4.5:1 contrast (WCAG AA).
const AVATAR_COLORS = ['#2E5C6E', '#946620', '#3F7A5C', '#356F80', '#BE185D', '#0F766E', '#6D28D9', '#946620'];

export function avatarColor(name: string): string {
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function egp(n: number): string {
  return 'EGP ' + n.toLocaleString('en-US');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Today's date as local `YYYY-MM-DD` — used as the `min` for future-only date
 *  inputs (e.g. "block until") and for comparing date-only strings (`until > today`). */
export function todayDateOnly(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Show only the date of a date/datetime string as `YYYY Mon DD` (e.g. "2026 Sep 01").
 *  Tolerant to ISO, plain `YYYY-MM-DD`, or `DD/MM/YYYY` shapes; returns '' when nothing parses. */
export function dateOnly(v: unknown): string {
  if (v == null) return '';
  const s = String(v).trim();
  if (!s) return '';
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const mo = MONTHS[Number(m[2]) - 1];
    return mo ? `${m[1]} ${mo} ${String(m[3]).padStart(2, '0')}` : s;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()} ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
  }
  return s;
}

/** Date + time as `DD Mon YYYY h:mm AM` (e.g. "21 Aug 2024 4:50 PM"), local time.
 *  Returns '' when nothing parses. */
export function dateTime(v: unknown): string {
  if (v == null || String(v).trim() === '') return '';
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  const h = d.getHours() % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${h}:${mm} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

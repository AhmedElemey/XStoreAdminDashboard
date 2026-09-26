/** Formatting + avatar-color helpers ported from the legacy prototype. */
const AVATAR_COLORS = ['#2E5C6E', '#C68A2E', '#3F7A5C', '#356F80', '#EC4899', '#14B8A6', '#8B5CF6', '#C68A2E'];

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

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

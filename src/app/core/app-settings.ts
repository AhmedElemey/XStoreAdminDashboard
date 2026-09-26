/** Remote app configuration ("General Settings") — typed key/value pairs the super admin
 *  manages here and the mobile app reads from `GET /api/app-settings`. Pure helpers only
 *  (no Angular), so the validation rules can be unit-tested and mirror the backend's.
 *  Wire contract: BACKEND_HANDOFF.md "General Settings". */

export type AppSettingType = 'String' | 'Boolean' | 'Integer' | 'Float' | 'Json';

/** Order matches the backend enum (String=1 … Float=5) — see `parseSettingType`. */
export const APP_SETTING_TYPES: AppSettingType[] = [
  'String',
  'Json',
  'Boolean',
  'Integer',
  'Float',
];

export const TYPE_HINT: Record<AppSettingType, string> = {
  String: 'Free text, e.g. 2.0.4',
  Json: 'A JSON object or list, e.g. ["cairo","giza"] or {"enabled":true}',
  Boolean: 'On / off switch',
  Integer: 'Whole number, e.g. 170',
  Float: 'Decimal number, e.g. 0.15',
};

/** Keys are read by mobile clients as identifiers, so keep them code-friendly:
 *  lowercase letters, digits, `_`, `-`, `.`; must start with a letter. */
export const KEY_PATTERN = /^[a-z][a-z0-9_.-]{0,99}$/;

export function validateKey(key: string): string | null {
  const k = key.trim();
  if (!k) return 'Key is required.';
  if (!KEY_PATTERN.test(k))
    return 'Use lowercase letters, digits, "_", "-" or "." (start with a letter, max 100).';
  return null;
}

/** Tolerant: accepts the enum name in any case, or the backend's int value (1-based). */
export function parseSettingType(v: unknown): AppSettingType {
  if (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v.trim()))) {
    return APP_SETTING_TYPES[Number(v) - 1] ?? 'String';
  }
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  if (s === 'bool') return 'Boolean';
  if (s === 'int') return 'Integer';
  if (s === 'double' || s === 'decimal') return 'Float';
  if (s === 'list' || s === 'array' || s === 'object') return 'Json';
  return APP_SETTING_TYPES.find((t) => t.toLowerCase() === s) ?? 'String';
}

/** Returns an error message, or null when `raw` is a valid value for `type`. */
export function validateValue(type: AppSettingType, raw: string): string | null {
  const v = raw.trim();
  switch (type) {
    case 'Boolean':
      return v === 'true' || v === 'false' ? null : 'Value must be true or false.';
    case 'Integer':
      if (!/^-?\d+$/.test(v)) return 'Value must be a whole number.';
      return Number.isSafeInteger(Number(v)) ? null : 'Value is too large.';
    case 'Float':
      return v !== '' && /^-?\d+(\.\d+)?$/.test(v) ? null : 'Value must be a number, e.g. 0.15.';
    case 'Json':
      if (!v) return 'Value is required.';
      try {
        const parsed = JSON.parse(v);
        return parsed !== null && typeof parsed === 'object'
          ? null
          : 'Value must be a JSON object {…} or list […].';
      } catch (e) {
        return 'Invalid JSON: ' + ((e as Error).message || 'parse error');
      }
    case 'String':
      return raw.length > 4000 ? 'Value must be 4000 characters or fewer.' : null;
  }
}

/** Canonical string sent to the backend: trimmed numbers, minified JSON. Assumes valid input. */
export function normalizeValue(type: AppSettingType, raw: string): string {
  if (type === 'String') return raw;
  if (type === 'Json') return JSON.stringify(JSON.parse(raw));
  return raw.trim();
}

/** Default value when the admin switches the type in the form. */
export function defaultValue(type: AppSettingType): string {
  return type === 'Boolean' ? 'false' : '';
}

/** Pretty-print a stored JSON value for the editor; falls back to the raw text. */
export function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

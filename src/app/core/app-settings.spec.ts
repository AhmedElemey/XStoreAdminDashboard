import { describe, expect, it } from 'vitest';
import { normalizeValue, parseSettingType, validateKey, validateValue } from './app-settings';
import { mapAppSetting } from './mappers';

describe('validateValue', () => {
  it('accepts only true/false for Boolean', () => {
    expect(validateValue('Boolean', 'true')).toBeNull();
    expect(validateValue('Boolean', 'false')).toBeNull();
    expect(validateValue('Boolean', 'yes')).not.toBeNull();
  });

  it('rejects decimals and text for Integer', () => {
    expect(validateValue('Integer', '170')).toBeNull();
    expect(validateValue('Integer', '-3')).toBeNull();
    expect(validateValue('Integer', '1.5')).not.toBeNull();
    expect(validateValue('Integer', 'yrtr')).not.toBeNull();
    expect(validateValue('Integer', '99999999999999999999')).not.toBeNull();
  });

  it('accepts decimals for Float but not text', () => {
    expect(validateValue('Float', '0.15')).toBeNull();
    expect(validateValue('Float', '3')).toBeNull();
    expect(validateValue('Float', 'yrtr')).not.toBeNull();
    expect(validateValue('Float', '')).not.toBeNull();
  });

  it('requires a JSON object or list for Json', () => {
    expect(validateValue('Json', '["cairo","giza"]')).toBeNull();
    expect(validateValue('Json', '{"enabled":true}')).toBeNull();
    expect(validateValue('Json', "{json:'string'}")).not.toBeNull();
    expect(validateValue('Json', '{test}')).not.toBeNull();
    expect(validateValue('Json', '"just a string"')).not.toBeNull();
    expect(validateValue('Json', '')).not.toBeNull();
  });

  it('allows any String including empty', () => {
    expect(validateValue('String', '')).toBeNull();
    expect(validateValue('String', '2.0.4')).toBeNull();
  });
});

describe('validateKey', () => {
  it('accepts code-friendly keys and rejects the rest', () => {
    expect(validateKey('force_update_required')).toBeNull();
    expect(validateKey('listing-title-max-character')).toBeNull();
    expect(validateKey('')).not.toBeNull();
    expect(validateKey('Has Space')).not.toBeNull();
    expect(validateKey('1starts_with_digit')).not.toBeNull();
  });
});

describe('normalizeValue', () => {
  it('minifies JSON and trims numbers, keeps strings verbatim', () => {
    expect(normalizeValue('Json', '{\n  "a": 1\n}')).toBe('{"a":1}');
    expect(normalizeValue('Integer', ' 170 ')).toBe('170');
    expect(normalizeValue('String', ' padded ')).toBe(' padded ');
  });
});

describe('parseSettingType / mapAppSetting', () => {
  it('maps enum names, ints and aliases', () => {
    expect(parseSettingType('Boolean')).toBe('Boolean');
    expect(parseSettingType('json')).toBe('Json');
    expect(parseSettingType(3)).toBe('Boolean');
    expect(parseSettingType('list')).toBe('Json');
    expect(parseSettingType(undefined)).toBe('String');
  });

  it('stringifies typed values from the backend', () => {
    const s = mapAppSetting({
      id: 7,
      key: 'regions',
      dataType: 'Json',
      value: ['a', 'b'],
      createdBy: 'admin2',
    });
    expect(s.value).toBe('["a","b"]');
    expect(s.id).toBe('7');
    expect(s.updatedBy).toBe('—');
    expect(mapAppSetting({ id: 1, key: 'x', dataType: 'Boolean', value: false }).value).toBe(
      'false',
    );
  });
});

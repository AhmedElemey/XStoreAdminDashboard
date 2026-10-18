import { describe, expect, it } from 'vitest';
import {
  classify,
  collectImageUrls,
  formatDateTime,
  formatNumber,
  humanize,
  isImageValue,
  matchesFilter,
} from './field-tree.util';

describe('humanize', () => {
  it('splits camelCase, snake_case and kebab-case', () => {
    expect(humanize('stockQuantity')).toBe('Stock Quantity');
    expect(humanize('created_at')).toBe('Created At');
    expect(humanize('is-hot-deal')).toBe('Is Hot Deal');
  });

  it('is acronym-aware', () => {
    expect(humanize('imageURLs')).toBe('Image URLs');
    expect(humanize('vendorId')).toBe('Vendor ID');
    expect(humanize('ID')).toBe('ID');
    expect(humanize('thumbnailUrl')).toBe('Thumbnail URL');
  });

  it('turns Ar/En suffixes into language labels', () => {
    expect(humanize('titleAr')).toBe('Title (Arabic)');
    expect(humanize('descriptionEn')).toBe('Description (English)');
  });
});

describe('formatters', () => {
  it('formats numbers, money and percentages by key', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(1500, 'price')).toBe('EGP 1,500');
    expect(formatNumber(12, 'commissionRate')).toBe('12%');
    expect(formatNumber(1200, 'totalViews')).toBe('1,200');
    expect(formatNumber(250, 'totalAmount')).toBe('EGP 250');
  });

  it('never formats id/phone/code-like numbers', () => {
    expect(formatNumber(1234567, 'vendorId')).toBe('1234567');
    expect(formatNumber(201001234567, 'phoneNumber')).toBe('201001234567');
    expect(formatNumber(10115, 'zip')).toBe('10115');
  });

  it('formats dates, keeping date-only strings free of a time', () => {
    expect(formatDateTime('2026-03-05')).toBe('05 Mar 2026');
    expect(formatDateTime('2026-03-05T14:07:00')).toBe('05 Mar 2026, 14:07');
  });
});

describe('classify', () => {
  it('treats null, blank and empty containers as empty', () => {
    expect(classify(null).kind).toBe('empty');
    expect(classify('  ').text).toBe('—');
    expect(classify([]).text).toBe('— (empty list)');
    expect(classify({}).text).toBe('— (empty)');
  });

  it('classifies booleans, numbers and dates', () => {
    expect(classify(true)).toMatchObject({ kind: 'bool', text: 'Yes', badge: 'b-green' });
    expect(classify(false)).toMatchObject({ kind: 'bool', text: 'No', badge: 'b-grey' });
    expect(classify(5000, 'price')).toMatchObject({ kind: 'number', text: 'EGP 5,000' });
    expect(classify('2026-03-05T10:00:00Z', 'createdAt')).toMatchObject({
      kind: 'date',
      title: '2026-03-05T10:00:00Z',
    });
  });

  it('classifies image paths (made absolute), links and status badges', () => {
    expect(classify('uploads/a.jpg', 'imageUrl', 'https://api.test')).toMatchObject({
      kind: 'image',
      url: 'https://api.test/uploads/a.jpg',
    });
    expect(classify('https://x.test/page', 'website').kind).toBe('link');
    expect(classify('PENDING', 'status')).toMatchObject({ kind: 'status', badge: 'b-amber' });
    expect(classify('Rejected', 'listingStatus').badge).toBe('b-red');
  });

  it('does not treat plain text under an image-ish key as an image', () => {
    expect(classify('A nice photo of the item', 'photoCaption').kind).toBe('text');
    expect(isImageValue('imageAlt', 'front view')).toBe(false);
  });

  it('flags Arabic text as rtl and long text as a block', () => {
    expect(classify('مرحبا', 'titleAr').rtl).toBe(true);
    expect(classify('x'.repeat(200), 'notes').block).toBe(true);
    expect(classify('line1\nline2', 'notes').block).toBe(true);
  });

  it('classifies arrays: chips, images, tables and nested lists', () => {
    expect(classify(['a', 'b'], 'tags')).toMatchObject({ kind: 'chips', chips: ['a', 'b'] });
    const many = classify(
      Array.from({ length: 35 }, (_, i) => `t${i}`),
      'tags',
    );
    expect(many.chips).toHaveLength(30);
    expect(many.moreChips).toBe(5);
    expect(classify(['a.png', 'b.jpg'], 'images').kind).toBe('images');
    const table = classify(
      [
        { a: 1, b: 'x' },
        { a: 2, c: true },
      ],
      'variants',
    );
    expect(table.kind).toBe('table');
    expect(table.columns).toEqual(['a', 'b', 'c']);
    expect(classify([{ a: { deep: 1 } }], 'rows').kind).toBe('list');
  });

  it('classifies objects and falls back to raw JSON past the depth limit', () => {
    expect(classify({ a: 1 }, 'vendor').entries).toEqual([['a', 1]]);
    expect(classify({ a: 1 }, 'vendor', '', 7).kind).toBe('deep');
  });
});

describe('matchesFilter / collectImageUrls', () => {
  it('searches keys and nested values case-insensitively', () => {
    const v = { vendor: { storeName: 'Nile Shop' } };
    expect(matchesFilter('vendor', v, 'nile')).toBe(true);
    expect(matchesFilter('vendor', v, 'store name')).toBe(true);
    expect(matchesFilter('vendor', v, 'zzz')).toBe(false);
    expect(matchesFilter('vendor', v, '')).toBe(true);
  });

  it('collects image urls anywhere in the data', () => {
    const urls = collectImageUrls(
      { imageUrls: ['a.jpg'], owner: { avatar: '/u/p.png' }, name: 'x' },
      'https://api.test',
    );
    expect(urls).toEqual(['https://api.test/a.jpg', 'https://api.test/u/p.png']);
  });
});

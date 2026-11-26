import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { readStored, storageKey, validate, writeStored } from '@/lib/storage';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe('storage', () => {
  it('prefixes keys with the app name, except shared ones', () => {
    expect(storageKey('grid', 'demo')).toBe('demo:grid');
    expect(storageKey('theme', 'demo')).toBe('theme');
    expect(storageKey('i18nextLng', 'demo')).toBe('i18nextLng');
  });

  it('round-trips JSON values', () => {
    const s = memory();
    writeStored('grid', { a: 1 }, s);
    expect(readStored('grid', undefined, s)).toEqual({ a: 1 });
  });

  it('returns undefined for missing or broken values and missing storage', () => {
    const s = memory();
    expect(readStored('nope', undefined, s)).toBeUndefined();
    s.setItem(storageKey('bad'), '{not json');
    expect(readStored('bad', undefined, s)).toBeUndefined();
    expect(readStored('grid', undefined, undefined)).toBeUndefined();
  });

  it('drops values rejected by the schema', () => {
    const s = memory();
    writeStored('size', 'big', s);
    expect(readStored('size', z.number(), s)).toBeUndefined();
    writeStored('size', 3, s);
    expect(readStored('size', z.number(), s)).toBe(3);
  });

  it('validate() works with zod and returns the parsed value', () => {
    expect(validate(z.object({ a: z.number() }), { a: 1, b: 2 })).toEqual({ a: 1 });
    expect(validate(z.string(), 1)).toBeUndefined();
  });
});
